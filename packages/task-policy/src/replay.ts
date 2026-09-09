import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import { digest } from "../../task-control/src/value.ts"
import { activation } from "../../task-cognition/src/activation.ts"
import type { ActivationDecision } from "../../task-cognition/src/model.ts"
import type { CausalEdge, VersionRef } from "../../task-causality/src/model.ts"
import { evaluateRule, type PolicyProposal, type StructuralRule } from "./index.ts"

type ActivationInput=Parameters<typeof activation>[0]
export interface ActivationFrame {
  id:string;version:1;episode:string;input:ActivationInput;decision:ActivationDecision
  snapshot:unknown;edges:CausalEdge[];graphHash:string;evidence:VersionRef[]
  scopes:string[]|null;relationsComplete:boolean
}
export interface ShadowTrial {
  id:string;version:1;proposal:VersionRef;role:VersionRef
  effect:"additional-trigger";split:{seed:string;holdoutBuckets:number};cutoff:number
}
export interface ShadowPrediction {
  id:string;version:1;trial:VersionRef;frame:VersionRef;episode:string
  partition:"training"|"holdout";phase:"historical"|"shadow"
  actual:ActivationDecision["action"];predicted:ActivationDecision["action"];ruleResult:boolean|null
  reason:string;counterfactualOutcome:null
}

/** Decision replay has no executor, admission or production-effect callback. */
export class PolicyReplay {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime}
  recordActivation(input:ActivationInput,episode:string,evidence:VersionRef[]):ActivationDecision {
    const runtime=this.runtime,store=runtime.store
    return store.atomic(()=>{
      evidence.forEach(ref=>runtime.evidence.require(ref))
      if(input.requiredBy&&!evidence.some(ref=>digest(ref)===digest(input.requiredBy)))throw new Error("Mandatory review needs its pinned requirement evidence")
      const decision=runtime.admission.record(activation(input))
      const existing=store.get<ActivationFrame>("policy_replay_frames",decision.id,1)
      if(existing) {
        if(digest(existing.input)!==digest(input)||existing.episode!==episode||digest(existing.evidence)!==digest(evidence))throw new Error("Replay frame cannot change an already recorded decision input")
        return decision
      }
      const edges=runtime.graph.all()
      const frame:ActivationFrame={id:decision.id,version:1,episode,input,decision,snapshot:runtime.engine.signals.capture(input.taskId),edges,graphHash:digest(edges),evidence,scopes:null,relationsComplete:false}
      store.put("policy_replay_frames",frame.id,1,frame)
      store.event({id:`policy-frame:${frame.id}`,type:"PolicyReplayFrameRecorded",entityId:input.taskId,correlationId:episode,schemaVersion:1,timestamp:input.now,payload:{frame:{id:frame.id,version:1}}})
      return decision
    })
  }
  register(input:Omit<ShadowTrial,"version"|"cutoff">):ShadowTrial {
    const {store}=this.runtime
    return store.atomic(()=>{
      const proposal=store.get<PolicyProposal>("policy_proposals",input.proposal.id,input.proposal.version)
      if(!input.id||!proposal||proposal.target!=="activation"||input.effect!=="additional-trigger")throw new Error("Replay requires an activation proposal with an explicit additional-trigger effect")
      if(!store.get("role_versions",input.role.id,input.role.version))throw new Error("Replay role must be pinned")
      if(!input.split.seed.trim()||!Number.isSafeInteger(input.split.holdoutBuckets)||input.split.holdoutBuckets<1||input.split.holdoutBuckets>99)throw new Error("Replay requires a frozen training/holdout split")
      proposal.evidence.forEach(ref=>this.runtime.evidence.require(ref))
      const prior=store.get<ShadowTrial>("policy_shadow_trials",input.id,1)
      if(prior) {
        if(digest({...input,version:1,cutoff:prior.cutoff})!==digest(prior))throw new Error("Shadow trial is immutable")
        return prior
      }
      const cutoff=Number(store.db.prepare("SELECT coalesce(max(sequence),0) AS n FROM event_outbox").get()!.n)
      const trial:ShadowTrial={...input,version:1,cutoff}
      store.put("policy_shadow_trials",trial.id,1,trial)
      store.event({id:`policy-trial:${trial.id}`,type:"PolicyShadowRegistered",entityId:proposal.target,correlationId:trial.id,schemaVersion:1,timestamp:Date.now(),payload:{trial:{id:trial.id,version:1}}})
      return trial
    })
  }
  ingest():number {
    const {store}=this.runtime
    return store.consume("policy-shadow/v1","additional-trigger/v1",event=>{
      if(event.type==="PolicyShadowRegistered") {
        const ref=(event.payload as {trial:VersionRef}).trial,trial=store.get<ShadowTrial>("policy_shadow_trials",ref.id,ref.version)!
        for(const row of store.db.prepare("SELECT payload,sequence FROM event_outbox WHERE type='PolicyReplayFrameRecorded' AND sequence<=? ORDER BY sequence").all(trial.cutoff)) {
          const envelope=JSON.parse(String(row.payload)) as {payload:{frame:VersionRef}}
          this.replay(trial,envelope.payload.frame,Number(row.sequence))
        }
      }else if(event.type==="PolicyReplayFrameRecorded") {
        const ref=(event.payload as {frame:VersionRef}).frame
        const sequence=Number(store.db.prepare("SELECT sequence FROM event_outbox WHERE id=?").get(event.id)!.sequence)
        for(const row of store.db.prepare("SELECT payload FROM policy_shadow_trials ORDER BY id").all())this.replay(JSON.parse(String(row.payload)),ref,sequence)
      }
    },1000)
  }
  private replay(trial:ShadowTrial,ref:VersionRef,sequence:number):void {
    const {store}=this.runtime,frame=store.get<ActivationFrame>("policy_replay_frames",ref.id,ref.version)
    if(!frame||frame.input.role.id!==trial.role.id||frame.input.role.version!==trial.role.version)return
    const proposal=store.get<PolicyProposal>("policy_proposals",trial.proposal.id,trial.proposal.version)!
    const id=digest({trial:{id:trial.id,version:1},frame:ref})
    if(store.get("policy_shadow_predictions",id,1))return
    // Missing relation/scope observations must not turn into negative labels.
    const evaluate=(rule:StructuralRule):boolean|null=>{
      if(rule.op==="all"||rule.op==="any") {
        const values=rule.rules.map(evaluate)
        return rule.op==="all"?values.includes(false)?false:values.includes(null)?null:true:values.includes(true)?true:values.includes(null)?null:false
      }
      const relations=frame.edges.filter(edge=>edge.source.entityId===frame.input.taskId||edge.target.entityId===frame.input.taskId).map(edge=>edge.relation)
      if(rule.op==="relation"&&!relations.includes(rule.value)&&!frame.relationsComplete)return null
      if(rule.op==="scope"&&frame.scopes===null)return null
      return evaluateRule(rule,{features:frame.input.signals,relations,scopes:frame.scopes??[]})
    }
    const matched=evaluate(proposal.proposedRule),input=frame.input,limits=input.role.activationPolicy
    let predicted=frame.decision.action,reason="Existing decision retained"
    // Hard triggers, eligibility, role lifecycle, quota and cooldown cannot be weakened.
    if(predicted!=="activate"&&input.eligible&&input.role.lifecycle!=="candidate"&&matched!==false) {
      if(input.invocations>=limits.maxInvocationsPerTask||input.lastInvocation!==undefined&&input.now-input.lastInvocation<limits.cooldownMs) {
        predicted="defer";reason="Existing quota or cooldown remains binding"
      }else {predicted=matched===true?"activate":"defer";reason=matched===true?"Additional structural trigger matched":"Missing observations prevent a definite candidate decision"}
    }
    const bucket=Number.parseInt(digest({seed:trial.split.seed,episode:frame.episode}).slice(0,8),16)%100
    const prediction:ShadowPrediction={id,version:1,trial:{id:trial.id,version:1},frame:ref,episode:frame.episode,partition:bucket<trial.split.holdoutBuckets?"holdout":"training",phase:sequence<=trial.cutoff?"historical":"shadow",actual:frame.decision.action,predicted,ruleResult:matched,reason,counterfactualOutcome:null}
    store.put("policy_shadow_predictions",id,1,prediction)
    store.event({id:`policy-prediction:${id}`,type:"PolicyShadowPredicted",entityId:frame.input.taskId,correlationId:frame.episode,schemaVersion:1,timestamp:Date.now(),payload:{prediction:{id,version:1}}})
  }
  report(trialId:string) {
    const {store}=this.runtime
    if(!store.get("policy_shadow_trials",trialId,1))throw new Error("Unknown shadow trial")
    const predictions=store.db.prepare("SELECT payload FROM policy_shadow_predictions WHERE json_extract(payload,'$.trial.id')=? ORDER BY id").all(trialId).map(row=>JSON.parse(String(row.payload)) as ShadowPrediction)
    return predictions.map(prediction=>{
      const frame=store.get<ActivationFrame>("policy_replay_frames",prediction.frame.id,1)!
      const grantRow=store.db.prepare("SELECT g.payload,g.state,r.payload AS result FROM activation_grants g LEFT JOIN agent_runs r ON r.grant_id=g.id WHERE g.decision_id=?").get(frame.decision.id)
      const grant=grantRow?JSON.parse(String(grantRow.payload)):null,result=grantRow?.result?JSON.parse(String(grantRow.result)):null
      const outcome=store.get<{completionEvidence:VersionRef}>("outcome_labels",`request-outcome:${prediction.episode}`,1)
      return {...prediction,observed:{grant:grant?{id:grant.id,state:grantRow!.state,policy:grant.policy,profile:grant.profile,context:grant.context,contextHash:grant.contextHash}:null,usage:result?.usage??null,completion:outcome?.completionEvidence??null},candidateCost:null,usefulActivation:null,preventedFailure:null,promotionEligible:false as const}
    })
  }
}
