import type { ControlRuntime } from "./runtime.ts"
import type { ControlStore } from "./store.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { canonical,digest } from "./value.ts"

export interface RegisteredDecision {
  id:string;version:number;conclusion:string;tasks:string[];assumptions:VersionRef[];evidence:VersionRef[];authorization:VersionRef[];validator:string
}
export function decisionValid(store:ControlStore,ref:VersionRef):boolean {
  const row=store.db.prepare("SELECT state,obligation_id FROM decision_validity WHERE id=? AND version=?").get(ref.id,ref.version)
  if(row?.state!=="validated")return false
  const evidence=new EvidenceStore(store),value=store.get<RegisteredDecision>("decision_versions",ref.id,ref.version)!
  if(!evidence.satisfied(evidence.obligation(String(row.obligation_id))!))return false
  return value.assumptions.every(ref=>{
    const state=store.db.prepare("SELECT state,obligation_id FROM assumption_validity WHERE id=? AND version=?").get(ref.id,ref.version)
    return state?.state==="valid"&&evidence.satisfied(evidence.obligation(String(state.obligation_id))!)
  })
}
export class DecisionLedger {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS decision_validity(id TEXT NOT NULL,version INTEGER NOT NULL,state TEXT NOT NULL,obligation_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(id,version));
      CREATE INDEX IF NOT EXISTS decision_validation ON decision_validity(obligation_id);
      CREATE TABLE IF NOT EXISTS decision_task_consumers(task_id TEXT NOT NULL,id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(task_id,id,version));
      CREATE TABLE IF NOT EXISTS decision_dependencies(kind TEXT NOT NULL,source_id TEXT NOT NULL,source_version INTEGER NOT NULL,id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(kind,source_id,source_version,id,version));`)
  }
  valid(ref:VersionRef):boolean {return decisionValid(this.runtime.store,ref)}
  register(input:RegisteredDecision):void {
    const {store,evidence,engine}=this.runtime
    store.atomic(()=>{
      if(!input.conclusion.trim()||!input.tasks.length||new Set(input.tasks).size!==input.tasks.length||!input.evidence.length||!input.authorization.length)throw new Error("Decision requires a conclusion, consumers and evidence")
      input.tasks.forEach(id=>{if(engine.requireTask(id).status==="running")throw new Error("Decisions must be bound before execution")})
      input.evidence.forEach(ref=>evidence.require(ref))
      if(input.assumptions.some(ref=>!this.runtime.assumptions.valid(ref)))throw new Error("Decision assumptions must have actual current validation")
      for(const ref of input.authorization)if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Decision registration needs controller authorization")
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(input.validator),validator=match&&store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
      if(!validator||validator.output!==undefined)throw new Error("Decision requires a registered receipt validator")
      const existing=store.get<RegisteredDecision>("decision_versions",input.id,input.version)
      if(existing) {if(digest(existing)!==digest(input))throw new Error("Immutable decision conflict");return}
      store.put("decision_versions",input.id,input.version,input)
      const tuple=[{entityId:input.id,port:"conclusion",view:"decision",version:input.version,hash:digest(input)}]
      const content={decision:input,assumptions:input.assumptions.map(ref=>store.get("assumptions",ref.id,ref.version)),contract:"Return JSON {verdict:validated|invalid|unknown,reason:string}; a validated conclusion does not claim an external action was executed."}
      const proof=evidence.put({id:`decision-input:${input.id}:${input.version}`,version:1,type:"runtime",source:"registered decision",producer:"decision-ledger",validatorVersion:"decision-input/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
      const obligation=evidence.createObligation({entityId:input.id,tuple,kind:"decision",mandatory:false,validators:[input.validator],reason:[...input.evidence,...input.authorization,proof]})
      store.db.prepare("INSERT INTO decision_validity VALUES(?,?,'unknown',?,'{}')").run(input.id,input.version,obligation.id)
      for(const id of input.tasks)store.db.prepare("INSERT INTO decision_task_consumers VALUES(?,?,?)").run(id,input.id,input.version)
      for(const [kind,refs] of [["evidence",[...input.evidence,...input.authorization]],["assumption",input.assumptions]] as const)for(const ref of refs)store.db.prepare("INSERT OR IGNORE INTO decision_dependencies VALUES(?,?,?,?,?)").run(kind,ref.id,ref.version,input.id,input.version)
      this.runtime.validators.schedule(obligation.id)
    })
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("decision-validity/v1","validated-source-bindings/v1",event=>{
      if(["EvidenceExpired","EvidenceRetracted","AssumptionInvalidated"].includes(event.type)) {
        const assumption=event.type==="AssumptionInvalidated",ref=assumption?(event.payload as {assumption:VersionRef}).assumption:(event.payload as {evidence:VersionRef}).evidence
        for(const row of store.db.prepare("SELECT id,version FROM decision_dependencies WHERE kind=? AND source_id=? AND source_version=?").all(assumption?"assumption":"evidence",ref.id,ref.version))this.change({id:String(row.id),version:Number(row.version)},"invalidated",event.id,"Decision source lost its valid basis")
        return
      }
      if(!["ValidationSatisfied","ValidatorFailed","ValidatorExecutionFailed"].includes(event.type))return
      const {obligationId}=event.payload as {obligationId:string},row=store.db.prepare("SELECT id,version FROM decision_validity WHERE obligation_id=?").get(obligationId)
      if(!row)return
      const ref={id:String(row.id),version:Number(row.version)},obligation=evidence.obligation(obligationId)!,decision=store.get<RegisteredDecision>("decision_versions",ref.id,ref.version)!
      for(const proof of obligation.evidence)store.db.prepare("INSERT OR IGNORE INTO decision_dependencies VALUES('evidence',?,?,?,?)").run(proof.id,proof.version,ref.id,ref.version)
      let state="unknown",reason="No complete current decision validation"
      if(evidence.satisfied(obligation)&&decision.assumptions.every(ref=>this.runtime.assumptions.valid(ref)))try {
        const receipt=(evidence.require(obligation.evidence[0]!).content as {receipt:ValidationReceipt}).receipt,value=JSON.parse(receipt.stdout)
        if(receipt.truncated||!["validated","invalid","unknown"].includes(value.verdict)||typeof value.reason!=="string"||!value.reason.trim())throw new Error("Invalid decision verdict")
        state=value.verdict==="invalid"?"invalidated":value.verdict;reason=value.reason
      }catch{ /* Unknown is not validated or executed. */ }
      this.change(ref,state,event.id,reason)
    },1000)
  }
  private change(ref:VersionRef,state:string,cause:string,reason:string):void {
    const {store,engine}=this.runtime,old=store.db.prepare("SELECT state FROM decision_validity WHERE id=? AND version=?").get(ref.id,ref.version)
    if(!old||old.state===state)return
    store.db.prepare("UPDATE decision_validity SET state=?,payload=? WHERE id=? AND version=?").run(state,canonical({cause,reason}),ref.id,ref.version)
    const id=`decision-state:${digest({ref,state,cause})}`,content={decision:ref,state,cause,reason}
    const proof=this.runtime.evidence.put({id,version:1,type:"runtime",source:"decision validity ledger",producer:"decision-ledger",validatorVersion:"decision-state/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    store.event({id,type:state==="validated"?"DecisionValidated":"DecisionInvalidated",entityId:ref.id,correlationId:ref.id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{...content,evidence:[proof]}})
    if(state==="validated")return
    for(const row of store.db.prepare("SELECT task_id FROM decision_task_consumers WHERE id=? AND version=?").all(ref.id,ref.version)) {
      const taskId=String(row.task_id);engine.signals.invalidate(taskId,`Decision ${ref.id}@${ref.version} lost validation`)
      const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(taskId),request=owner&&this.runtime.requests.get(String(owner.request_id))
      if(request&&["executing","waiting","resuming"].includes(request.state)) {
        const causeId=`decision-repair:${id}:${taskId}`
        store.event({id:causeId,type:"DecisionValidityLost",entityId:taskId,correlationId:request.id,causationId:id,schemaVersion:1,timestamp:Date.now(),payload:{taskIds:[taskId],reason:"decision validity lost",invalidDecisions:[ref],evidence:[proof]}})
        this.runtime.requests.questions.supersedeForChange(request.id,causeId)
      }
    }
  }
}
