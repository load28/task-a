import { EvidenceStore } from "../../task-evidence/src/index.ts"
import type { ControlStore } from "./store.ts"
import type { ControlRuntime } from "./runtime.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { digest,canonical } from "./value.ts"

export interface ObservedInputDefinition {
  id:string;version:number;kind:"code"|"tool"|"environment"|"external";schemaVersion:string
  validator:string;authorization:VersionRef[];maxAgeMs:number
}
export interface InputObservation {
  id:string;version:number;definition:VersionRef;status:"known"|"missing"|"unknown";value:unknown
  hash:string;evidence:VersionRef[];expiresAt:number;obligationId:string
}
/** Only controller-registered, bounded native observations enter this ledger.
 * A known value attests the declared view, never universal input completeness. */
export class ObservedInputs {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS observed_input_state(id TEXT NOT NULL,version INTEGER NOT NULL,generation INTEGER NOT NULL,obligation_id TEXT,state TEXT NOT NULL,observation_version INTEGER,PRIMARY KEY(id,version));
      CREATE INDEX IF NOT EXISTS observed_input_obligation ON observed_input_state(obligation_id);
      CREATE TABLE IF NOT EXISTS observed_input_consumers(task_id TEXT NOT NULL,id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(task_id,id,version));
      CREATE INDEX IF NOT EXISTS observed_input_reverse ON observed_input_consumers(id,version,task_id);
      CREATE TABLE IF NOT EXISTS observed_input_evidence(id TEXT NOT NULL,version INTEGER NOT NULL,evidence_id TEXT NOT NULL,evidence_version INTEGER NOT NULL,PRIMARY KEY(id,version,evidence_id,evidence_version));
      CREATE INDEX IF NOT EXISTS observed_input_evidence_reverse ON observed_input_evidence(evidence_id,evidence_version,id,version);`)
  }
  register(definition:ObservedInputDefinition):void {
    const {store,evidence}=this.runtime
    if(!definition.id||!Number.isSafeInteger(definition.version)||definition.version<1||!["code","tool","environment","external"].includes(definition.kind)||!definition.schemaVersion||!definition.authorization.length||!Number.isSafeInteger(definition.maxAgeMs)||definition.maxAgeMs<1)throw new Error("Incomplete observed input definition")
    definition.authorization.forEach(ref=>{if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Input observers require controller authorization")})
    const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(definition.validator)
    const spec=match&&store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
    if(!spec||spec.output!==undefined||spec.authorization.some(ref=>!evidence.valid(ref)))throw new Error("Input observation requires a registered receipt validator")
    store.atomic(()=>{
      store.put("observed_input_definitions",definition.id,definition.version,definition)
      store.db.prepare("INSERT OR IGNORE INTO observed_input_state VALUES(?,?,0,NULL,'unknown',NULL)").run(definition.id,definition.version)
    })
  }
  definition(ref:VersionRef):ObservedInputDefinition {
    const definition=this.runtime.store.get<ObservedInputDefinition>("observed_input_definitions",ref.id,ref.version)
    if(!definition)throw new Error("Unregistered observed input")
    definition.authorization.forEach(ref=>this.runtime.evidence.require(ref));return definition
  }
  bind(taskId:string,refs:VersionRef[]):void {
    const {store,engine,graph}=this.runtime
    store.atomic(()=>{
      engine.requireTask(taskId)
      for(const ref of refs) {
        const definition=this.definition(ref)
        if(!store.db.prepare("INSERT OR IGNORE INTO observed_input_consumers VALUES(?,?,?)").run(taskId,ref.id,ref.version).changes)continue
        const id=digest({taskId,input:ref})
        graph.put({id,version:1,source:{entityId:this.key(ref),port:definition.kind,view:definition.schemaVersion},target:{entityId:taskId,port:"inputs",view:"registered-observations"},relation:"depends_on",changeTypes:["implementation","behavior","contract","dependency","assumption"],impactWeight:1,critical:true,observedPropagationRate:{successes:0,trials:0,estimate:1,modelVersion:"unmeasured-conservative/v1"},evidence:definition.authorization,completeness:"declared"},0)
      }
    })
  }
  private key(ref:VersionRef){return `observed-input:${ref.id}:${ref.version}`}
  current(ref:VersionRef):InputObservation|undefined {
    const {store}=this.runtime,row=store.db.prepare("SELECT observation_version FROM observed_input_state WHERE id=? AND version=?").get(ref.id,ref.version)
    return row?.observation_version?store.get<InputObservation>("observed_input_observations",this.key(ref),Number(row.observation_version)):undefined
  }
  valid(ref:VersionRef):boolean {return observedInputValid(this.runtime.store,ref)}
  changeToken(ref:VersionRef):string {return digest({definition:{id:ref.id,version:ref.version},hash:this.current(ref)?.hash??null,valid:this.valid(ref)})}
  validatedChange(refs:VersionRef[],declared?:{definition:VersionRef;token:string}):{definition:VersionRef;token:string}|undefined {
    const {evidence,store}=this.runtime
    for(const ref of refs) {
      if(!evidence.valid(ref))continue
      const proof=evidence.require(ref)
      if(proof.producer!=="observed-inputs"||proof.validatorVersion!=="input-invalidation/v1")continue
      const content=proof.content as {input:VersionRef;observation:{id:string;version:number}|null;valid:boolean}
      if(!content.input||typeof content.valid!=="boolean")continue
      const definition={id:content.input.id,version:content.input.version}
      const original=content.observation&&store.get<InputObservation>("observed_input_observations",content.observation.id,content.observation.version)
      if(content.observation&&!original||original&&digest(original.definition)!==digest(definition))continue
      const change={definition,token:digest({definition,hash:original?.hash??null,valid:content.valid})}
      if(change.token!==this.changeToken(definition)||declared&&digest(declared)!==digest(change))continue
      return change
    }
    return
  }
  ensure(refs:VersionRef[]):boolean {
    let ready=true
    for(const ref of refs)if(!this.valid(ref)){const current=this.current(ref);if(!current||current.expiresAt<=Date.now())this.refresh(ref);ready=false}
    return ready
  }
  refresh(ref:VersionRef):void {
    const {store,evidence}=this.runtime,definition=this.definition(ref)
    store.atomic(()=>{
      const row=store.db.prepare("SELECT * FROM observed_input_state WHERE id=? AND version=?").get(ref.id,ref.version)!
      if(row.state==="pending")return
      const generation=Number(row.generation)+1,tuple=[{entityId:this.key(ref),port:"observation",view:definition.schemaVersion,version:generation,hash:digest({definition,generation})}]
      const content={definition,generation,contract:"Return exactly {status:'known'|'missing'|'unknown',schemaVersion:string,value:JSON}. Measure only the registered input view. A failed command or incomplete observation is unknown. Do not report broader completeness."}
      const proof=evidence.put({id:`input-observation-request:${this.key(ref)}:${generation}`,version:1,type:"runtime",source:"registered input observation",producer:"observed-inputs",validatorVersion:"input-observation-request/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(definition.validator)!
      const spec=store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))!
      const obligation=evidence.createObligation({entityId:this.key(ref),tuple,kind:"observed-input",mandatory:false,validators:[definition.validator],reason:[...definition.authorization,...spec.authorization,proof]})
      store.db.prepare("UPDATE observed_input_state SET generation=?,obligation_id=?,state='pending' WHERE id=? AND version=?").run(generation,obligation.id,ref.id,ref.version)
    })
  }
  taskRefs(taskId:string):VersionRef[]{return this.runtime.store.db.prepare("SELECT id,version FROM observed_input_consumers WHERE task_id=? ORDER BY id,version").all(taskId).map(row=>({id:String(row.id),version:Number(row.version)}))}
  taskValues(taskId:string):InputObservation[] {
    return this.taskRefs(taskId).map(ref=>{if(!this.valid(ref))throw new Error(`Observed input is unresolved: ${ref.id}@${ref.version}`);return this.current(ref)!})
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("registered-inputs/v1","actual-observations/v1",event=>{
      if(["EvidenceExpired","EvidenceRetracted"].includes(event.type)) {
        const ref=(event.payload as {evidence:VersionRef}).evidence
        // Evidence reverse references avoid rescanning unrelated inputs.
        for(const row of store.db.prepare("SELECT id,version FROM observed_input_evidence WHERE evidence_id=? AND evidence_version=?").all(ref.id,ref.version))this.invalidate({id:String(row.id),version:Number(row.version)},event.id,[ref])
        return
      }
      if(!["ValidatorPassed","ValidatorFailed","ValidatorExecutionFailed"].includes(event.type))return
      const {obligationId}=event.payload as {obligationId:string},row=store.db.prepare("SELECT * FROM observed_input_state WHERE obligation_id=? AND state='pending'").get(obligationId)
      if(!row)return
      const ref={id:String(row.id),version:Number(row.version)},definition=store.get<ObservedInputDefinition>("observed_input_definitions",ref.id,ref.version)!,obligation=evidence.obligation(obligationId)!,previous=this.current(ref),previousValid=this.valid(ref)
      let status:InputObservation["status"]="unknown",value:unknown=null
      const job=store.db.prepare("SELECT state,payload FROM validation_jobs WHERE obligation_id=? AND validator=?").get(obligation.id,definition.validator)
      if(job?.state==="passed"&&obligation.evidence.some(ref=>digest(ref)===digest(JSON.parse(String(job.payload)).evidence))&&evidence.satisfied(obligation))try {
        const receipt=(evidence.require(obligation.evidence[0]!).content as {receipt:ValidationReceipt}).receipt
        if(receipt.truncated)throw new Error("Truncated observation")
        const output=JSON.parse(receipt.stdout)
        if(Object.keys(output).sort().join(",")!=="schemaVersion,status,value"||!["known","missing","unknown"].includes(output.status)||output.schemaVersion!==definition.schemaVersion)throw new Error("Invalid input observation")
        canonical(output.value);status=output.status;value=status==="known"?output.value:null
      }catch{ /* missing facts remain unknown */ }
      const version=Number(row.generation),hash=digest({status,value}),now=Date.now(),expiresAt=now+definition.maxAgeMs
      const observation:InputObservation={id:this.key(ref),version,definition:ref,status,value,hash,evidence:[...obligation.reason,...obligation.evidence],expiresAt,obligationId}
      const lifetime=evidence.put({id:`input-observation-lifetime:${observation.id}:${version}`,version:1,type:"runtime",source:"bounded observation lifetime",producer:"observed-inputs",validatorVersion:"input-observation-lifetime/v1",timestamp:now,content:{ref,version,hash},contentHash:digest({ref,version,hash}),inputVector:obligation.tuple,confidence:status==="known"?1:0,expiresAt})
      observation.evidence.push(lifetime)
      store.put("observed_input_observations",observation.id,version,observation)
      store.db.prepare("UPDATE observed_input_state SET state=?,observation_version=? WHERE id=? AND version=?").run(status,version,ref.id,ref.version)
      store.db.prepare("DELETE FROM observed_input_evidence WHERE id=? AND version=?").run(ref.id,ref.version)
      for(const source of observation.evidence)store.db.prepare("INSERT OR IGNORE INTO observed_input_evidence VALUES(?,?,?,?)").run(ref.id,ref.version,source.id,source.version)
      if(previous&&(previous.hash!==hash||!previousValid&&status==="known"))this.invalidate(ref,event.id,observation.evidence)
      store.event({id:`observed-input:${observation.id}:${version}`,type:"RegisteredInputObserved",entityId:observation.id,correlationId:observation.id,schemaVersion:1,timestamp:Date.now(),payload:{observation:{id:observation.id,version},previous:previous?{id:previous.id,version:previous.version}:null}})
    },1000)
  }
  private invalidate(ref:VersionRef,cause:string,proofs:VersionRef[]):void {
    const {store,engine,memory}=this.runtime,observation=this.current(ref)
    const content={input:ref,cause,observation:observation?{id:observation.id,version:observation.version}:null,valid:this.valid(ref),evidence:proofs}
    const change=this.runtime.evidence.put({id:`registered-input-invalidation:${digest({ref,cause})}`,version:1,type:"runtime",source:"observed input change or evidence withdrawal",producer:"observed-inputs",validatorVersion:"input-invalidation/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
    for(const row of store.db.prepare("SELECT task_id FROM observed_input_consumers WHERE id=? AND version=?").all(ref.id,ref.version)) {
      const taskId=String(row.task_id)
      this.runtime.admission.fence(taskId)
      if(engine.store.currentAttempt(taskId))engine.signals.invalidate(taskId,`Registered input changed: ${ref.id}@${ref.version}`)
      const definition=store.get<ObservedInputDefinition>("observed_input_definitions",ref.id,ref.version)!
      memory.invalidate(this.key(ref),definition.kind,definition.schemaVersion,this.valid(ref)?observation!.hash:digest({invalidated:cause,ref}),cause)
      const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(taskId),request=owner&&this.runtime.requests.get(String(owner.request_id))
      if(request&&request.taskId===taskId)this.runtime.requests.observedInputChanged(request.id,cause,change)
      if(request?.planId&&engine.store.findWorkPlan(request.planId)?.activeRevision&&["executing","waiting","resuming"].includes(request.state)) {
        const id=`registered-input-change:${digest({taskId,cause})}`
        store.event({id,type:"InputObservationChanged",entityId:taskId,correlationId:request.id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{taskIds:[taskId],reason:"observed input change",registeredInput:{definition:ref,token:this.changeToken(ref)},evidence:[change]}})
        this.runtime.requests.questions.supersedeForChange(request.id,id)
      }
    }
  }
}

export function observedInputRefs(store:ControlStore,taskId:string):VersionRef[] {
  if(!store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='observed_input_consumers'").get())return []
  return store.db.prepare("SELECT id,version FROM observed_input_consumers WHERE task_id=? ORDER BY id,version").all(taskId).map(row=>({id:String(row.id),version:Number(row.version)}))
}
export function observedInputCurrent(store:ControlStore,ref:VersionRef):InputObservation|undefined {
  const row=store.db.prepare("SELECT observation_version FROM observed_input_state WHERE id=? AND version=?").get(ref.id,ref.version)
  return row?.observation_version?store.get<InputObservation>("observed_input_observations",`observed-input:${ref.id}:${ref.version}`,Number(row.observation_version)):undefined
}
export function observedInputValid(store:ControlStore,ref:VersionRef,now=Date.now()):boolean {
  try {
    const definition=store.get<ObservedInputDefinition>("observed_input_definitions",ref.id,ref.version)!,value=observedInputCurrent(store,ref),evidence=new EvidenceStore(store)
    if(!definition||!value||value.status!=="known"||value.expiresAt<=now)return false
    const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(definition.validator)!
    const spec=store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))!
    return [...definition.authorization,...value.evidence,...spec.authorization].every(ref=>evidence.valid(ref,now))&&evidence.satisfied(evidence.obligation(value.obligationId)!,now)
  }catch{return false}
}
