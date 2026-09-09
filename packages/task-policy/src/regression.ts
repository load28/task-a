import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ActivationGrant,AgentOutput } from "../../task-cognition/src/model.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { digest,canonical } from "../../task-control/src/value.ts"
import { PolicyLearning,type PolicyProposal,type PolicyTarget } from "./index.ts"

export interface RegressionWatch {
  id:string;version:1;target:PolicyTarget;policy:VersionRef;rollback:VersionRef;headRevision:number;cutoff:number
  validator:string;condition:VersionRef;authorization:VersionRef[];maxSamples:number;sampleType:"observed"|"synthetic"
}
/** Bounded, deterministic post-run checks; no model calls or retrospective success labels. */
export class PolicyRegression {
  readonly runtime:ControlRuntime
  readonly learning:PolicyLearning
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime;this.learning=new PolicyLearning(runtime.store)
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS policy_regression_state(watch_id TEXT PRIMARY KEY,state TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS policy_regression_samples(watch_id TEXT NOT NULL,grant_id TEXT NOT NULL,obligation_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(watch_id,grant_id));
      CREATE INDEX IF NOT EXISTS policy_regression_obligation ON policy_regression_samples(obligation_id);`)
  }
  register(input:Omit<RegressionWatch,"version"|"headRevision"|"cutoff">):RegressionWatch {
    const {store,evidence}=this.runtime
    return store.atomic(()=>{
      const prior=store.get<RegressionWatch>("policy_regression_watches",input.id,1)
      if(prior) {
        if(digest({...input,version:1,headRevision:prior.headRevision,cutoff:prior.cutoff})!==digest(prior))throw new Error("Regression watch is immutable")
        return prior
      }
      if(!input.id||!Number.isSafeInteger(input.maxSamples)||input.maxSamples<1||!["synthetic","observed"].includes(input.sampleType))throw new Error("Bounded regression sampling is required")
      if(!input.authorization.length)throw new Error("Regression watch needs controller authorization")
      for(const ref of [...input.authorization,input.condition])if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Regression condition and authorization must be registered by the controller")
      const proposal=store.get<PolicyProposal>("policy_versions",input.policy.id,input.policy.version)
      const rollback=store.get<PolicyProposal>("policy_versions",input.rollback.id,input.rollback.version)
      const head=this.learning.head(input.target)
      if(!proposal||proposal.target!==input.target||!rollback||rollback.target!==input.target||digest(proposal.rollback)!==digest(input.rollback)||digest(head.policy)!==digest(input.policy)||digest(input.policy)===digest(input.rollback))throw new Error("Regression watch requires the current policy and its pinned rollback version")
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(input.validator)
      const validator=match&&store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
      if(!validator||validator.output!==undefined||validator.authorization.some(ref=>!evidence.valid(ref)))throw new Error("Regression requires a registered receipt validator")
      const watch:RegressionWatch={...input,version:1,headRevision:head.revision,cutoff:Number(store.db.prepare("SELECT coalesce(max(sequence),0) n FROM event_outbox").get()!.n)}
      store.put("policy_regression_watches",watch.id,1,watch)
      store.db.prepare("INSERT INTO policy_regression_state VALUES(?,'watching')").run(watch.id)
      store.event({id:`regression-watch:${watch.id}`,type:"PolicyRegressionWatchRegistered",entityId:watch.target,correlationId:watch.id,schemaVersion:1,timestamp:Date.now(),payload:{watch:{id:watch.id,version:1},headRevision:watch.headRevision}})
      return watch
    })
  }
  private current(watch:RegressionWatch):boolean {
    return digest(this.learning.head(watch.target))===digest({policy:watch.policy,revision:watch.headRevision})
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("policy-regression/v1","receipt-and-head-revision/v1",event=>{
      if(event.type==="AgentCompleted") {
        const payload=event.payload as {grantId:string;output:AgentOutput}
        const row=store.db.prepare("SELECT g.state,g.payload,r.payload AS result FROM activation_grants g JOIN agent_runs r ON r.grant_id=g.id WHERE g.id=? AND r.state='completed'").get(payload.grantId)
        if(!row||row.state!=="completed")return
        const grant=JSON.parse(String(row.payload)) as ActivationGrant,result=JSON.parse(String(row.result))
        if(digest(result.output)!==digest(payload.output))return
        const sequence=Number(store.db.prepare("SELECT sequence FROM event_outbox WHERE id=?").get(event.id)!.sequence)
        for(const row of store.db.prepare("SELECT w.payload FROM policy_regression_watches w JOIN policy_regression_state s ON s.watch_id=w.id WHERE s.state='watching' ORDER BY w.id").all()) {
          const watch=JSON.parse(String(row.payload)) as RegressionWatch
          if(!this.current(watch)) {this.finish(watch,"superseded",event.id);continue}
          if(sequence<=watch.cutoff||digest(grant.policy)!==digest(watch.policy)||(grant.profile.provider==="test"?"synthetic":"observed")!==watch.sampleType)continue
          if([...watch.authorization,watch.condition].some(ref=>!evidence.valid(ref))) {this.finish(watch,"authorization-expired",event.id);continue}
          const samples=Number(store.db.prepare("SELECT count(*) n FROM policy_regression_samples WHERE watch_id=?").get(watch.id)!.n)
          if(samples>=watch.maxSamples)continue
          const tuple=[{entityId:grant.id,port:"accepted-result",view:"policy-regression",version:1,hash:digest({watch,grant,result})}]
          const content={watch:{id:watch.id,version:1},policy:watch.policy,grant,result,condition:evidence.require(watch.condition),contract:"Return JSON {regressed:boolean,reason:string}. A failed command or missing observation is unknown, never proof of regression."}
          const proof=evidence.put({id:`policy-regression:${watch.id}:${grant.id}`,version:1,type:"runtime",source:"accepted grant result",producer:"policy-regression",validatorVersion:"regression-input/v1",timestamp:event.timestamp,content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
          const obligation=evidence.createObligation({entityId:watch.id,tuple,kind:"policy-regression",mandatory:false,validators:[watch.validator],reason:[...watch.authorization,watch.condition,proof]})
          store.db.prepare("INSERT INTO policy_regression_samples VALUES(?,?,?,'pending','{}')").run(watch.id,grant.id,obligation.id)
        }
        return
      }
      if(!["ValidationSatisfied","ValidatorFailed","ValidatorExecutionFailed"].includes(event.type))return
      const {obligationId}=event.payload as {obligationId:string}
      const sample=store.db.prepare("SELECT * FROM policy_regression_samples WHERE obligation_id=? AND state='pending'").get(obligationId)
      if(!sample)return
      const watch=store.get<RegressionWatch>("policy_regression_watches",String(sample.watch_id),1)!
      const obligation=evidence.obligation(obligationId)!
      let verdict:{regressed:boolean;reason:string}|null=null
      if(evidence.satisfied(obligation))try {
        const proof=evidence.require(obligation.evidence[0]!),receipt=(proof.content as {receipt:ValidationReceipt}).receipt
        if(receipt.truncated)throw new Error("Truncated regression verdict")
        const value=JSON.parse(receipt.stdout)
        if(typeof value.regressed!=="boolean"||typeof value.reason!=="string"||!value.reason.trim())throw new Error("Invalid regression verdict")
        verdict={regressed:value.regressed,reason:value.reason}
      }catch{ /* malformed or expired evidence is unknown */ }
      store.db.prepare("UPDATE policy_regression_samples SET state=?,payload=? WHERE obligation_id=?").run(verdict?verdict.regressed?"regressed":"no-regression-observed":"unknown",canonical({verdict,evidence:obligation.evidence,sourceEvent:event.id,validation:event.payload}),obligationId)
      if(!this.current(watch)) {this.finish(watch,"superseded",event.id);return}
      if(verdict?.regressed) {
        this.learning.rollback(watch.target,watch.rollback,obligation.evidence,ref=>evidence.valid(ref),{policy:watch.policy,revision:watch.headRevision})
        this.finish(watch,"rolled-back",event.id)
      }else {
        const counts=store.db.prepare("SELECT count(*) n,sum(CASE WHEN state='pending' THEN 1 ELSE 0 END) pending FROM policy_regression_samples WHERE watch_id=?").get(watch.id)!
        if(Number(counts.n)>=watch.maxSamples&&Number(counts.pending)===0)this.finish(watch,"sample-budget-exhausted",event.id)
      }
    },1000)
  }
  private finish(watch:RegressionWatch,state:string,cause:string):void {
    const {store}=this.runtime
    const result=store.db.prepare("UPDATE policy_regression_state SET state=? WHERE watch_id=? AND state='watching'").run(state,watch.id)
    if(result.changes)store.event({id:`regression-state:${watch.id}:${state}`,type:"PolicyRegressionWatchFinished",entityId:watch.target,correlationId:watch.id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{watch:{id:watch.id,version:1},state}})
  }
}
