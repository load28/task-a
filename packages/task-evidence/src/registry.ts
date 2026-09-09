import { randomUUID } from "node:crypto"
import { EvidenceStore, type Obligation } from "./index.ts"
import { executeValidator, type ValidatorSpec } from "./validators.ts"
import { ControlStore } from "../../task-control/src/store.ts"
import { canonical, digest } from "../../task-control/src/value.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { isAbsolute } from "node:path"

export interface RegisteredValidator extends Omit<ValidatorSpec,"inputVector"|"input"> {
  authorization:VersionRef[]
}

/** Only controller/operator code can register commands. Agent tools accept no argv. */
export class ValidatorRegistry {
  readonly store:ControlStore
  readonly evidence:EvidenceStore
  constructor(store:ControlStore) {
    this.store=store;this.evidence=new EvidenceStore(store)
    store.db.exec(`CREATE TABLE IF NOT EXISTS validation_jobs(id TEXT PRIMARY KEY,obligation_id TEXT NOT NULL,validator TEXT NOT NULL,state TEXT NOT NULL,token TEXT,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS validation_job_queue ON validation_jobs(state,obligation_id);`)
  }
  register(spec:RegisteredValidator):void {
    if(spec.runtimeReadPaths!==undefined&&(!Array.isArray(spec.runtimeReadPaths)||spec.runtimeReadPaths.some(path=>typeof path!=="string"||!isAbsolute(path)||path.includes("\0"))))throw new Error("Validator runtime reads must be explicit absolute paths")
    if(spec.output!==undefined&&spec.output!=="semantic-state")throw new Error("Unsupported validator output contract")
    if(!/^[a-z][a-z0-9-]*$/.test(spec.id)||!Number.isSafeInteger(spec.version)||spec.version<1||!spec.authorization.length||!spec.command.length||spec.command.some(arg=>typeof arg!=="string"||!arg||arg.includes("\0"))||!Number.isSafeInteger(spec.timeoutMs)||spec.timeoutMs<1||!Number.isSafeInteger(spec.maxOutputBytes)||spec.maxOutputBytes<1)throw new Error("Invalid registered validator")
    for(const ref of spec.authorization)if(!["user","code","runtime"].includes(this.evidence.require(ref).type))throw new Error("Validator command has no controller authorization")
    this.store.atomic(()=>{
      this.store.put("validator_versions",spec.id,spec.version,spec)
      this.store.event({id:randomUUID(),type:"ValidatorRegistered",entityId:spec.id,correlationId:spec.id,schemaVersion:1,timestamp:Date.now(),payload:{validator:{id:spec.id,version:spec.version}}})
    })
  }
  schedule(obligationId:string):void {
    this.store.atomic(()=>{
      const obligation=this.evidence.obligation(obligationId)
      if(!obligation)throw new Error("Unknown validation obligation")
      if(!this.evidence.applicable(obligation)||this.evidence.satisfied(obligation))return
      for(const validator of obligation.validators) {
        const id=digest({obligationId,validator})
        this.store.db.prepare("INSERT OR IGNORE INTO validation_jobs VALUES(?,?,?,'pending',NULL,'{}')").run(id,obligationId,validator)
      }
    })
  }
  ingest():number {
    return this.store.consume("validator-scheduling/v1","registry/v1",event=>{
      if(event.type==="ValidationRequired")this.schedule((event.payload as {obligationId:string}).obligationId)
    },1000)
  }
  async run(workspace:string,budget:{maxJobs:number;maxDurationMs:number}):Promise<Array<{jobId:string;state:string}>> {
    if(!Number.isSafeInteger(budget.maxJobs)||budget.maxJobs<1||!Number.isSafeInteger(budget.maxDurationMs)||budget.maxDurationMs<1)throw new Error("Validator execution budget is required")
    while(this.ingest()===1000){ /* durable event backlog */ }
    const began=Date.now(),results:Array<{jobId:string;state:string}>=[]
    const candidates=this.store.db.prepare("SELECT id FROM validation_jobs WHERE state IN ('pending','deferred') ORDER BY rowid LIMIT ?").all(budget.maxJobs)
    for(const candidate of candidates) {
      const selected=this.store.atomic(()=>{
        const row=this.store.db.prepare("SELECT * FROM validation_jobs WHERE id=?").get(String(candidate.id))!
        if(!["pending","deferred"].includes(String(row.state)))return
        const obligation=this.evidence.obligation(String(row.obligation_id))!
        if(!this.evidence.applicable(obligation)) {
          this.store.db.prepare("UPDATE validation_jobs SET state='superseded' WHERE id=?").run(String(row.id))
          return
        }
        if(this.evidence.satisfied(obligation))return
        if(obligation.kind==="prediction-state") {
          const task=this.store.db.prepare("SELECT status FROM tasks WHERE id=?").get(obligation.entityId)
          if(task?.status!=="implemented")return
        }
        const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(String(row.validator))
        const spec=match?this.store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2])):undefined
        const reason=!spec?"unregistered validator":spec.authorization.some(ref=>!this.evidence.valid(ref))?"expired validator authorization":spec.timeoutMs>budget.maxDurationMs-(Date.now()-began)?"validation budget unavailable":undefined
        if(reason) {
          this.store.db.prepare("UPDATE validation_jobs SET state='deferred',payload=? WHERE id=?").run(canonical({reason}),String(row.id))
          results.push({jobId:String(row.id),state:"deferred"});return
        }
        const token=randomUUID()
        this.store.db.prepare("UPDATE validation_jobs SET state='running',token=?,payload=? WHERE id=?").run(token,canonical({startedAt:Date.now(),specHash:digest(spec)}),String(row.id))
        return {id:String(row.id),token,spec:spec!,obligation}
      })
      if(!selected)continue
      try {
        const input={obligation:selected.obligation,evidence:selected.obligation.reason.map(ref=>this.evidence.require(ref))}
        const execution=await executeValidator({...selected.spec,inputVector:selected.obligation.tuple,input},workspace,this.evidence)
        const passed=(this.evidence.require(execution.evidence).content as {passed:boolean}).passed
        this.store.atomic(()=>{
          const row=this.store.db.prepare("SELECT token,state FROM validation_jobs WHERE id=?").get(selected.id)
          if(row?.token!==selected.token||row.state!=="running")throw new Error("Validator result was fenced")
          const state=passed?"passed":"failed"
          this.store.db.prepare("UPDATE validation_jobs SET state=?,payload=? WHERE id=?").run(state,canonical({evidence:execution.evidence,receipt:execution.receipt}),selected.id)
          const jobs=this.store.db.prepare("SELECT state,payload FROM validation_jobs WHERE obligation_id=?").all(selected.obligation.id)
          if(jobs.length===selected.obligation.validators.length&&jobs.every(job=>job.state==="passed"))this.evidence.resolve(selected.obligation.id,jobs.map(job=>JSON.parse(String(job.payload)).evidence))
          else if(!passed)this.setFailed(selected.obligation)
          this.store.event({id:randomUUID(),type:passed?"ValidatorPassed":"ValidatorFailed",entityId:selected.obligation.entityId,correlationId:selected.obligation.entityId,schemaVersion:1,timestamp:Date.now(),payload:{jobId:selected.id,obligationId:selected.obligation.id,evidence:execution.evidence}})
          results.push({jobId:selected.id,state})
        })
      } catch(error) {
        this.store.atomic(()=>{
          this.store.db.prepare("UPDATE validation_jobs SET state='failed',payload=? WHERE id=? AND token=?").run(canonical({error:error instanceof Error?error.message:"Validator execution failed"}),selected.id,selected.token)
          this.setFailed(selected.obligation)
        })
        results.push({jobId:selected.id,state:"failed"})
      }
    }
    return results
  }
  private setFailed(obligation:Obligation):void {
    this.store.db.prepare("UPDATE validation_obligations SET state='failed',payload=? WHERE id=?").run(canonical({...obligation,state:"failed"}),obligation.id)
  }
}
