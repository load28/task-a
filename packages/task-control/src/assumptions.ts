import type { ControlRuntime } from "./runtime.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { canonical,digest } from "./value.ts"

export interface RegisteredAssumption {
  id:string;version:number;statement:string;tasks:string[];evidence:VersionRef[];authorization:VersionRef[];validator:string
}
/** A registered proposition is unknown until an independent validator measures it. */
export class AssumptionLedger {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS assumption_validity(id TEXT NOT NULL,version INTEGER NOT NULL,state TEXT NOT NULL,obligation_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(id,version));
      CREATE INDEX IF NOT EXISTS assumption_validation ON assumption_validity(obligation_id);
      CREATE TABLE IF NOT EXISTS assumption_task_consumers(task_id TEXT NOT NULL,id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(task_id,id,version));
      CREATE TABLE IF NOT EXISTS assumption_evidence_consumers(evidence_id TEXT NOT NULL,evidence_version INTEGER NOT NULL,assumption_id TEXT NOT NULL,assumption_version INTEGER NOT NULL,PRIMARY KEY(evidence_id,evidence_version,assumption_id,assumption_version));`)
  }
  register(input:RegisteredAssumption):void {
    const {store,evidence,validators,engine}=this.runtime
    store.atomic(()=>{
      if(!input.statement.trim()||!input.tasks.length||new Set(input.tasks).size!==input.tasks.length||!input.evidence.length||!input.authorization.length)throw new Error("Assumption needs a proposition, unique consumers and source evidence")
      input.tasks.forEach(id=>{if(engine.requireTask(id).status==="running")throw new Error("Assumptions must be bound before execution")})
      input.evidence.forEach(ref=>evidence.require(ref))
      for(const ref of input.authorization)if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Assumption registration needs controller authorization")
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(input.validator)
      const validator=match&&store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
      if(!validator||validator.output!==undefined)throw new Error("Assumption requires a registered receipt validator")
      const previous=store.get<RegisteredAssumption>("assumptions",input.id,input.version)
      if(previous) {if(digest(previous)!==digest(input))throw new Error("Immutable assumption conflict");return}
      store.put("assumptions",input.id,input.version,input)
      const tuple=[{entityId:input.id,port:"proposition",view:"assumption",version:input.version,hash:digest(input)}]
      const content={assumption:input,contract:"Return JSON {verdict:valid|invalid|unknown,reason:string} from actual observations. Command failure and incomplete output are unknown."}
      const proof=evidence.put({id:`assumption-input:${input.id}:${input.version}`,version:1,type:"runtime",source:"registered assumption",producer:"assumption-ledger",validatorVersion:"assumption-input/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
      const obligation=evidence.createObligation({entityId:input.id,tuple,kind:"assumption",mandatory:false,validators:[input.validator],reason:[...input.authorization,...input.evidence,proof]})
      store.db.prepare("INSERT INTO assumption_validity VALUES(?,?,'unknown',?,'{}')").run(input.id,input.version,obligation.id)
      for(const id of input.tasks)store.db.prepare("INSERT INTO assumption_task_consumers VALUES(?,?,?)").run(id,input.id,input.version)
      for(const ref of [...input.authorization,...input.evidence])store.db.prepare("INSERT OR IGNORE INTO assumption_evidence_consumers VALUES(?,?,?,?)").run(ref.id,ref.version,input.id,input.version)
      validators.schedule(obligation.id)
    })
  }
  valid(ref:VersionRef):boolean {
    const {store,evidence}=this.runtime,row=store.db.prepare("SELECT state,obligation_id FROM assumption_validity WHERE id=? AND version=?").get(ref.id,ref.version)
    return row?.state==="valid"&&evidence.satisfied(evidence.obligation(String(row.obligation_id))!)
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("assumption-validity/v1","registered-observation/v1",event=>{
      if(["EvidenceExpired","EvidenceRetracted"].includes(event.type)) {
        const ref=(event.payload as {evidence:VersionRef}).evidence
        for(const row of store.db.prepare("SELECT assumption_id,assumption_version FROM assumption_evidence_consumers WHERE evidence_id=? AND evidence_version=?").all(ref.id,ref.version))this.change({id:String(row.assumption_id),version:Number(row.assumption_version)},"unknown",event.id,[ref],"Assumption evidence is no longer valid")
        return
      }
      if(!["ValidationSatisfied","ValidatorFailed","ValidatorExecutionFailed"].includes(event.type))return
      const {obligationId}=event.payload as {obligationId:string},row=store.db.prepare("SELECT id,version FROM assumption_validity WHERE obligation_id=?").get(obligationId)
      if(!row)return
      const obligation=evidence.obligation(obligationId)!
      for(const ref of obligation.evidence)store.db.prepare("INSERT OR IGNORE INTO assumption_evidence_consumers VALUES(?,?,?,?)").run(ref.id,ref.version,String(row.id),Number(row.version))
      let state:"valid"|"invalid"|"unknown"="unknown",reason="No complete, current validator verdict"
      if(evidence.satisfied(obligation))try {
        const receipt=(evidence.require(obligation.evidence[0]!).content as {receipt:ValidationReceipt}).receipt
        if(receipt.truncated)throw new Error("Truncated verdict")
        const output=JSON.parse(receipt.stdout)
        if(!["valid","invalid","unknown"].includes(output.verdict)||typeof output.reason!=="string"||!output.reason.trim())throw new Error("Invalid verdict")
        state=output.verdict;reason=output.reason
      }catch{ /* Keep unknown; do not infer a proposition from command failure. */ }
      this.change({id:String(row.id),version:Number(row.version)},state,event.id,obligation.evidence,reason)
    },1000)
  }
  private change(ref:VersionRef,state:"valid"|"invalid"|"unknown",cause:string,proofs:VersionRef[],reason:string):void {
    const {store,engine}=this.runtime,old=store.db.prepare("SELECT state FROM assumption_validity WHERE id=? AND version=?").get(ref.id,ref.version)
    if(!old||old.state===state)return
    store.db.prepare("UPDATE assumption_validity SET state=?,payload=? WHERE id=? AND version=?").run(state,canonical({reason,evidence:proofs,cause}),ref.id,ref.version)
    const id=`assumption-state:${digest({ref,state,cause})}`
    store.event({id,type:state==="valid"?"AssumptionValidated":"AssumptionInvalidated",entityId:ref.id,correlationId:ref.id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{assumption:ref,state,evidence:proofs,reason}})
    if(state==="valid")return
    const content={assumption:ref,state,cause,reason,originalEvidence:proofs}
    const evidence=this.runtime.evidence.put({id:`assumption-loss:${id}`,version:1,type:"runtime",source:"assumption validity ledger",producer:"assumption-ledger",validatorVersion:"assumption-validity-loss/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
    for(const row of store.db.prepare("SELECT task_id FROM assumption_task_consumers WHERE id=? AND version=?").all(ref.id,ref.version)) {
      const taskId=String(row.task_id)
      engine.signals.invalidate(taskId,`Assumption ${ref.id}@${ref.version} became ${state}`)
      const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(taskId),request=owner&&this.runtime.requests.get(String(owner.request_id))
      if(request&&["executing","waiting","resuming"].includes(request.state)) {
        const causeId=`assumption-repair:${id}:${taskId}`
        store.event({id:causeId,type:"AssumptionValidityLost",entityId:taskId,correlationId:request.id,causationId:id,schemaVersion:1,timestamp:Date.now(),payload:{taskIds:[taskId],reason:"assumption validity lost",invalidAssumptions:[ref],evidence:[evidence]}})
        this.runtime.requests.questions.supersedeForChange(request.id,causeId)
      }
    }
  }
}
