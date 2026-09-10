import { assertMeasuredEvaluation } from "./measurement.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { randomUUID } from "node:crypto"
import { ControlStore } from "../../task-control/src/store.ts"
import { canonical, digest, unit } from "../../task-control/src/value.ts"
import { FEATURES, type ContextBudget, type ContextSelector, type Feature, type ReasoningProfile } from "../../task-cognition/src/model.ts"
import { RELATIONS, CHANGE_SCOPES, type VersionRef } from "../../task-causality/src/model.ts"
import type { PredictionPolicy } from "../../task-causality/src/prediction.ts"
import { validatePredictionPolicy } from "../../task-causality/src/prediction.ts"
import { validateProfile } from "../../task-cognition/src/precision.ts"
import { INTEGRATION_DIMENSIONS } from "../../task-evidence/src/integration.ts"

export const POLICY_TARGETS=["activation","context","decomposition","role","validation","integration","escalation","cache","precision","propagation","boundary","expectation","routine"] as const
export type PolicyTarget=typeof POLICY_TARGETS[number]
export type StructuralRule = {op:"all"|"any";rules:StructuralRule[]} | {op:"gte"|"lte";feature:Feature;value:number} | {op:"relation";value:typeof RELATIONS[number]} | {op:"scope";value:typeof CHANGE_SCOPES[number]}
export type PolicyEffect =
  | {kind:"activation";role:VersionRef;mode:"require"}
  | {kind:"context";slot:"planner"|"worker"|"all";budget:ContextBudget;requiredContext:ContextSelector[]}
  | {kind:"decomposition";maxTasks:number}
  | {kind:"role";slot:"planner"|"worker"|"replanner";role:VersionRef;profile:ReasoningProfile}
  | {kind:"validation";phase:"plan"|"observation"|"replan";validators:string[]}
  | {kind:"integration";validators:Record<typeof INTEGRATION_DIMENSIONS[number],string>}
  | {kind:"escalation";maxClarifications:number;maxInputReplans:number;maxLocalRepairs:number}
  | {kind:"cache";reuse:"validated"|"disabled"}
  | {kind:"precision";minimumProfile:ReasoningProfile}
  | {kind:"propagation";threshold:number}
  | {kind:"boundary";requireComplete:boolean;bindingValidator?:string;proofMaxAgeMs?:number}
  | {kind:"expectation";policy:PredictionPolicy}
  | {kind:"routine";allow:VersionRef[]}
export interface PolicyProposal {
  id:string;version:number;target:PolicyTarget;observedPattern:string;rootCause:string;proposedInvariant:string;proposedRule:StructuralRule
  effect:PolicyEffect
  expectedBenefit:number;regressionRisk:number;evidence:VersionRef[];supportingCases:VersionRef[];counterexamples:VersionRef[]
  structuralAbstraction:string;holdoutCriteria:string[];rollbackCondition:string;rollback:VersionRef
}
export interface PolicyBundle {id:string;version:1;heads:Record<PolicyTarget,{policy:VersionRef|null;revision:number}>;hash:string}
export interface Evaluation {
  id:string;version:number;proposal:VersionRef;stage:"shadow"|"validated"|"active";episodes:string[];holdoutEpisodes:string[]
  usefulGainLowerBound:number;qualityLowerBound:number;missedCriticalUpperBound:number;effectiveSamples:number;confidenceWidth:number
  criticalStrata:string[];evidence:VersionRef[];authorized:boolean;measurementStudy?:VersionRef;approval?:VersionRef[]
}
export interface EvaluationGate {minimumSamples:number;maxConfidenceWidth:number;qualityFloor:number;maxMissedCritical:number;criticalStrata:string[];requiresApproval:boolean}
export function validateRule(rule:StructuralRule):void {
  const keys=Object.keys(rule).sort().join(",")
  if(rule.op==="all"||rule.op==="any") {
    if(keys!=="op,rules"||!rule.rules.length)throw new Error("Invalid structural group")
    rule.rules.forEach(validateRule)
  } else if(rule.op==="gte"||rule.op==="lte") {
    if(keys!=="feature,op,value"||!FEATURES.includes(rule.feature))throw new Error("Only structural features may be learned")
    unit(rule.value,"Rule threshold")
  } else if(rule.op==="relation") {
    if(keys!=="op,value"||!RELATIONS.includes(rule.value))throw new Error("Unknown causal relation")
  } else if(rule.op==="scope") {
    if(keys!=="op,value"||!CHANGE_SCOPES.includes(rule.value))throw new Error("Unknown change scope")
  } else throw new Error("Case-specific or executable rules are forbidden")
}
function validator(value:string):boolean{return /^[a-z][a-z0-9-]*\/v[1-9][0-9]*$/.test(value)}
export function validateEffect(target:PolicyTarget,effect:PolicyEffect):void {
  if(effect.kind!==target)throw new Error("Policy effect must match its target")
  if(effect.kind==="activation") {if(!effect.role.id||effect.role.version<1||effect.mode!=="require")throw new Error("Invalid activation effect");return}
  if(effect.kind==="context") {for(const value of Object.values(effect.budget))if(!Number.isSafeInteger(value)||value<0)throw new Error("Invalid context effect");if(effect.requiredContext.some(item=>!item.relation||!item.ports.length||item.depth<0))throw new Error("Invalid context effect");return}
  if(effect.kind==="decomposition") {if(!Number.isSafeInteger(effect.maxTasks)||effect.maxTasks<1)throw new Error("Invalid decomposition effect");return}
  if(effect.kind==="role") {if(!effect.role.id||effect.role.version<1||effect.profile.level<2)throw new Error("Invalid role effect");validateProfile(effect.profile);return}
  if(effect.kind==="validation") {if(!effect.validators.length||effect.validators.some(value=>!validator(value)))throw new Error("Invalid validation effect");return}
  if(effect.kind==="integration") {if(INTEGRATION_DIMENSIONS.some(dimension=>!validator(effect.validators[dimension])))throw new Error("Invalid integration effect");return}
  if(effect.kind==="escalation") {if([effect.maxClarifications,effect.maxInputReplans,effect.maxLocalRepairs].some(value=>!Number.isSafeInteger(value)||value<0))throw new Error("Invalid escalation effect");return}
  if(effect.kind==="cache")return
  if(effect.kind==="precision") {if(effect.minimumProfile.level<2)throw new Error("Invalid precision effect");validateProfile(effect.minimumProfile);return}
  if(effect.kind==="propagation") {unit(effect.threshold,"Propagation threshold");return}
  if(effect.kind==="boundary") {if(effect.requireComplete&&(!effect.bindingValidator||!validator(effect.bindingValidator)||!Number.isSafeInteger(effect.proofMaxAgeMs)||effect.proofMaxAgeMs!<1))throw new Error("Complete boundary effect requires a validator and finite proof lifetime");return}
  if(effect.kind==="expectation") {validatePredictionPolicy(effect.policy);return}
  if(effect.kind==="routine") {if(!effect.allow.length||effect.allow.some(ref=>!ref.id||ref.version<1))throw new Error("Invalid routine effect");return}
  const never:never=effect;throw new Error(`Unsupported policy effect ${String(never)}`)
}
export function evaluateRule(rule:StructuralRule,state:{features:Partial<Record<Feature,number|null>>;relations:string[];scopes:string[]}):boolean|null {
  validateRule(rule)
  if(rule.op==="all"||rule.op==="any") {
    const values=rule.rules.map(r=>evaluateRule(r,state))
    return rule.op==="all" ? values.includes(false)?false:values.includes(null)?null:true : values.includes(true)?true:values.includes(null)?null:false
  }
  if(rule.op==="relation")return state.relations.includes(rule.value)
  if(rule.op==="scope")return state.scopes.includes(rule.value)
  if(rule.op==="gte"||rule.op==="lte") {
    const value=state.features[rule.feature]
    if(value===null||value===undefined)return null
    unit(value,"Observed feature")
    return rule.op==="gte"?value>=rule.value:value<=rule.value
  }
  throw new Error("Unreachable rule")
}
export class PolicyLearning {
  readonly store:ControlStore
  constructor(store:ControlStore){this.store=store}
  propose(proposal:PolicyProposal,validEvidence:(r:VersionRef)=>boolean):void {
    if(!POLICY_TARGETS.includes(proposal.target)||![proposal.observedPattern,proposal.rootCause,proposal.proposedInvariant,proposal.structuralAbstraction,proposal.rollbackCondition].every(s=>s.trim())||!proposal.evidence.length||!proposal.supportingCases.length||!proposal.holdoutCriteria.length||proposal.holdoutCriteria.some(value=>!value.trim())||![...proposal.evidence,...proposal.supportingCases,...proposal.counterexamples].every(validEvidence))throw new Error("Incomplete structural policy proposal")
    validateRule(proposal.proposedRule);validateEffect(proposal.target,proposal.effect);unit(proposal.regressionRisk,"Regression risk")
    if(!Number.isFinite(proposal.expectedBenefit))throw new Error("Invalid expected benefit")
    this.store.atomic(()=>{
      const existing=this.store.get<PolicyProposal>("policy_proposals",proposal.id,proposal.version)
      this.store.put("policy_proposals",proposal.id,proposal.version,proposal)
      if(!existing)this.store.event({id:`policy-proposed:${proposal.id}:${proposal.version}`,type:"PolicyProposed",entityId:proposal.target,correlationId:proposal.id,schemaVersion:1,timestamp:Date.now(),payload:{proposal:{id:proposal.id,version:proposal.version},supportingCases:proposal.supportingCases,counterexamples:proposal.counterexamples,evidence:proposal.evidence}})
    })
  }
  evaluate(evaluation:Evaluation,gate:EvaluationGate,validEvidence:(r:VersionRef)=>boolean):void {
    this.store.atomic(()=>{
      for(const value of [evaluation.usefulGainLowerBound,evaluation.qualityLowerBound,evaluation.missedCriticalUpperBound,evaluation.effectiveSamples,evaluation.confidenceWidth,gate.minimumSamples,gate.maxConfidenceWidth,gate.qualityFloor,gate.maxMissedCritical])if(!Number.isFinite(value))throw new Error("Non-finite policy evaluation")
      const proposal=this.store.get<PolicyProposal>("policy_proposals",evaluation.proposal.id,evaluation.proposal.version)
      if(!proposal)throw new Error("Unknown policy proposal")
      if(!evaluation.evidence.length||!evaluation.evidence.every(validEvidence))throw new Error("Evaluation needs actual evidence")
      unit(evaluation.qualityLowerBound,"Quality lower bound");unit(evaluation.missedCriticalUpperBound,"Missed critical upper bound")
      unit(evaluation.confidenceWidth,"Confidence width");unit(gate.maxConfidenceWidth,"Maximum confidence width")
      unit(gate.qualityFloor,"Quality floor");unit(gate.maxMissedCritical,"Maximum missed critical")
      if(!Number.isSafeInteger(evaluation.effectiveSamples)||evaluation.effectiveSamples<0||!Number.isSafeInteger(gate.minimumSamples)||gate.minimumSamples<1)throw new Error("Invalid effective sample count")
      for(const values of [evaluation.episodes,evaluation.holdoutEpisodes,evaluation.criticalStrata,gate.criticalStrata])if(new Set(values).size!==values.length||values.some(value=>!value.trim()))throw new Error("Duplicate or empty evaluation membership")
      if(evaluation.episodes.some(value=>evaluation.holdoutEpisodes.includes(value)))throw new Error("Training/holdout episode leakage")
      // Each immutable proposal version must complete its own lifecycle. Preserve
      // existing legacy history, but never borrow another version's validation.
      const legacyHead=this.store.head("policy_evaluations",proposal.id)
      const legacy=legacyHead?this.store.get<Evaluation>("policy_evaluations",proposal.id,legacyHead):undefined
      const lifecycleId=legacy&&digest(legacy.proposal)===digest(evaluation.proposal)?proposal.id:`proposal:${digest(evaluation.proposal)}`
      const priorVersion=this.store.head("policy_evaluations",lifecycleId)
      const prior=priorVersion?this.store.get<Evaluation & {evaluationGate?:EvaluationGate;baselineHead?:{policy:VersionRef|null;revision:number}}>("policy_evaluations",lifecycleId,priorVersion):undefined
      const expected=prior?.stage==="shadow"?"validated":prior?.stage==="validated"?"active":"shadow"
      if(evaluation.stage!==expected||prior?.stage==="active")throw new Error("Policy lifecycle cannot skip stages")
      if(prior&&(!prior.evaluationGate||digest(prior.evaluationGate)!==digest(gate)))throw new Error("Evaluation gates are frozen before shadow outcomes")
      if(prior&&(digest(prior.episodes)!==digest(evaluation.episodes)||digest(prior.holdoutEpisodes)!==digest(evaluation.holdoutEpisodes)))throw new Error("Evaluation episode partitions are frozen before shadow outcomes")
      if(evaluation.stage!=="shadow") {
        if(evaluation.episodes.some(e=>evaluation.holdoutEpisodes.includes(e))||!evaluation.holdoutEpisodes.length)throw new Error("Training/holdout episode leakage")
        if(evaluation.effectiveSamples<gate.minimumSamples||evaluation.confidenceWidth>gate.maxConfidenceWidth||evaluation.usefulGainLowerBound<=0||evaluation.qualityLowerBound<gate.qualityFloor||evaluation.missedCriticalUpperBound>gate.maxMissedCritical||gate.criticalStrata.some(s=>!evaluation.criticalStrata.includes(s)))throw new Error("Policy has not met evidence and correctness gates")
      }
      if(evaluation.stage!=="shadow")assertMeasuredEvaluation(this.store,evaluation,gate)
      if(prior&&digest(prior.measurementStudy??null)!==digest(evaluation.measurementStudy??null))throw new Error("Measurement study is frozen before shadow outcomes")
      if(evaluation.stage==="active"&&gate.requiresApproval) {
        const evidence=new EvidenceStore(this.store)
        if(!evaluation.approval?.length||evaluation.approval.some(ref=>{const proof=evidence.require(ref);return !["user","code"].includes(proof.type)||digest((proof.content as {proposal?:VersionRef}).proposal??null)!==digest(evaluation.proposal)||(proof.content as {approval?:string}).approval!=="activate-policy"}))throw new Error("Policy approval requires explicit evidence for this proposal")
      }
      const baselineHead=prior?.baselineHead??this.head(proposal.target)
      if(evaluation.stage==="active"&&(!prior?.baselineHead||digest(this.head(proposal.target))!==digest(baselineHead)||digest(baselineHead.policy)!==digest(proposal.rollback)))throw new Error("Policy activation baseline changed since shadow registration")
      this.store.put("policy_evaluations",lifecycleId,priorVersion+1,{...evaluation,evaluationGate:gate,baselineHead})
      this.store.advance("policy_evaluations",lifecycleId,priorVersion,priorVersion+1)
      if(evaluation.stage==="active") {
        this.store.put("policy_versions",proposal.id,proposal.version,proposal)
        this.store.db.prepare("INSERT INTO policy_heads VALUES(?,?,?) ON CONFLICT(target) DO UPDATE SET policy_id=excluded.policy_id,version=excluded.version").run(proposal.target,proposal.id,proposal.version)
        this.store.event({id:randomUUID(),type:"PolicyUpdated",entityId:proposal.target,correlationId:proposal.id,schemaVersion:1,timestamp:Date.now(),payload:{policy:{id:proposal.id,version:proposal.version},evaluation}})
      }
    })
  }
  head(target:PolicyTarget):{policy:VersionRef|null;revision:number} {
    const row=this.store.db.prepare("SELECT policy_id,version FROM policy_heads WHERE target=?").get(target)
    return {policy:row?{id:String(row.policy_id),version:Number(row.version)}:null,revision:Number(this.store.db.prepare("SELECT revision FROM policy_head_revisions WHERE target=?").get(target)?.revision??0)}
  }
  rollback(target:PolicyTarget,ref:VersionRef,evidence:VersionRef[],validEvidence:(r:VersionRef)=>boolean,expected?:{policy:VersionRef|null;revision:number}):void {
    this.store.atomic(()=>{
      const previous=this.head(target)
      if(expected&&digest(previous)!==digest(expected))throw new Error("Stale policy rollback head")
      const version=this.store.get<PolicyProposal>("policy_versions",ref.id,ref.version)
      if(!version||version.target!==target||!evidence.length||!evidence.every(validEvidence))throw new Error("Rollback requires a verified prior policy and evidence")
      this.store.db.prepare("INSERT INTO policy_heads VALUES(?,?,?) ON CONFLICT(target) DO UPDATE SET policy_id=excluded.policy_id,version=excluded.version").run(target,ref.id,ref.version)
      this.store.event({id:randomUUID(),type:"PolicyRolledBack",entityId:target,correlationId:ref.id,schemaVersion:1,timestamp:Date.now(),payload:{ref,evidence,previous}})
    })
  }
}
export interface ReplayCandidate {id:string;cost:number;predictionError:number;impact:number;risk:number;mandatory:boolean}
export function selectReplay(candidates:ReplayCandidate[],budget:number):{selected:string[];deferred:string[];cost:number;value:number} {
  if(!Number.isSafeInteger(budget)||budget<0)throw new Error("Replay budget must use nonnegative integral cost units")
  if(new Set(candidates.map(c=>c.id)).size!==candidates.length)throw new Error("Duplicate replay candidate")
  for(const c of candidates){if(!Number.isSafeInteger(c.cost)||c.cost<0)throw new Error("Invalid replay cost");unit(c.predictionError,"Error");unit(c.impact,"Impact");unit(c.risk,"Risk")}
  const mandatory=candidates.filter(c=>c.mandatory),reserve=mandatory.reduce((s,c)=>s+c.cost,0)
  if(reserve>budget)return {selected:[],deferred:candidates.map(c=>c.id),cost:0,value:0}
  let states=new Map<number,{value:number;ids:string[]}>([[0,{value:0,ids:[]}]])
  for(const c of candidates.filter(c=>!c.mandatory).sort((a,b)=>a.id.localeCompare(b.id))) {
    const next=new Map(states)
    for(const [cost,state] of states) {
      const total=cost+c.cost,value=state.value+c.predictionError*c.impact*c.risk
      if(total<=budget-reserve && value>(next.get(total)?.value??-1))next.set(total,{value,ids:[...state.ids,c.id]})
    }
    states=next
  }
  const [cost,best]=[...states].sort((a,b)=>b[1].value-a[1].value||a[0]-b[0])[0]!
  const selected=[...mandatory.map(c=>c.id),...best.ids]
  return {selected,deferred:candidates.filter(c=>!selected.includes(c.id)).map(c=>c.id),cost:reserve+cost,value:best.value+mandatory.reduce((s,c)=>s+c.predictionError*c.impact*c.risk,0)}
}
export function outcomeMetrics(input:{useful:string[];outputs:string[];activations:number;usefulActivations:number;caught:number;required:number|null;cost:number;beta:number;lambda:number}) {
  const ratio=(n:number,d:number)=>d>0?n/d:null
  const precision=ratio(input.usefulActivations,input.activations),recall=input.required===null?null:ratio(input.caught,input.required)
  const f=precision===null||recall===null?null:precision+recall===0?0:(1+input.beta**2)*precision*recall/(input.beta**2*precision+recall)
  return {precision,recall,thinkingDensity:ratio(new Set(input.useful).size,new Set(input.outputs).size),costWeightedScore:f===null?null:f-input.lambda*input.cost}
}
