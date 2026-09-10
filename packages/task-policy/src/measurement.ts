import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { ControlStore } from "../../task-control/src/store.ts"
import { digest,unit } from "../../task-control/src/value.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import type { ActivationGrant,AgentOutput } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { PolicyLearning,type Evaluation,type EvaluationGate,type PolicyProposal } from "./index.ts"
import { assertExecutionInputBoundary,inputBoundaryEvidence } from "../../task-control/src/input-boundary.ts"

export interface PolicyPair {episode:string;partition:"training"|"holdout";stratum:string;baseline:string;candidate:string}
export interface PolicyStudy {
  id:string;version:1;proposal:VersionRef;baseline:VersionRef;authorization:VersionRef[];condition:VersionRef
  validator:string;pairs:PolicyPair[];gate:EvaluationGate;confidence:number
  normalization:{inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}
  costWeights:{inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}
  samplingDesign:VersionRef;sampleType:"synthetic"|"observed"
}
type Scores={contribution:number;quality:number;criticalMiss:boolean;reason:string}
type Measurement={baseline:Scores;candidate:Scores}
type Usage={inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}
type Run={output:AgentOutput;usage:Usage}
export interface PairedValue {episode:string;stratum:string;gain:number;quality:number;criticalMiss:number}

/** Fixed-sample, simultaneous one-sided Hoeffding bounds. Each row is one
 * preregistered independent goal episode, never a repeated step in that episode.
 * Utility=(contribution - normalizedCost + 1)/2 is bounded in [0,1]. */
export function pairedBounds(values:PairedValue[],confidence:number,strata:string[]) {
  if(!Number.isFinite(confidence)||confidence<=0||confidence>=1||!values.length)throw new Error("A finite confidence level and measured episodes are required")
  if(new Set(values.map(v=>v.episode)).size!==values.length||new Set(strata).size!==strata.length)throw new Error("Repeated episodes or strata cannot increase effective samples")
  for(const v of values) {if(!Number.isFinite(v.gain)||Math.abs(v.gain)>1)throw new Error("Unbounded paired gain");unit(v.quality,"Measured quality");unit(v.criticalMiss,"Critical miss")}
  const alpha=(1-confidence)/(4*(1+strata.length))
  const bound=(rows:PairedValue[])=>{
    if(!rows.length)return null
    const mean=(key:"gain"|"quality"|"criticalMiss")=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length
    const radius=Math.sqrt(Math.log(1/alpha)/(2*rows.length)),gain=mean("gain")
    return {effectiveSamples:rows.length,usefulGainLowerBound:Math.max(-1,gain-2*radius),qualityLowerBound:Math.max(0,mean("quality")-radius),missedCriticalUpperBound:Math.min(1,mean("criticalMiss")+radius),confidenceWidth:(Math.min(1,gain+2*radius)-Math.max(-1,gain-2*radius))/2}
  }
  return {overall:bound(values)!,strata:Object.fromEntries(strata.map(stratum=>[stratum,bound(values.filter(value=>value.stratum===stratum))]))}
}
const costKeys=["inputTokens","outputTokens","toolCalls","elapsedMs"] as const
const validatorSpec=(store:ControlStore,name:string)=>{const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(name);return match?store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2])):undefined}
function scores(value:Scores):Scores {
  if(!value||Object.keys(value).sort().join(",")!=="contribution,criticalMiss,quality,reason"||typeof value.criticalMiss!=="boolean"||typeof value.reason!=="string"||!value.reason.trim())throw new Error("Missing factual attribution verdict")
  unit(value.contribution,"Measured contribution");unit(value.quality,"Measured quality");return value
}
function grant(store:ControlStore,id:string):ActivationGrant {
  const row=store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)
  if(!row)throw new Error("Unknown paired grant")
  return JSON.parse(String(row.payload))
}
function accepted(store:ControlStore,id:string):Run|undefined {
  const row=store.db.prepare("SELECT r.payload FROM agent_runs r JOIN activation_grants g ON g.id=r.grant_id WHERE g.id=? AND g.state='completed' AND r.state='completed'").get(id)
  return row?JSON.parse(String(row.payload)):undefined
}
function studyInputCoverage(store:ControlStore,study:PolicyStudy) {
  const unknown=new Set<string>()
  for(const id of new Set(study.pairs.flatMap(pair=>[pair.baseline,pair.candidate]))) {
    const execution=grant(store,id)
    if(!execution.inputBoundary) {unknown.add("legacy-boundary");continue}
    try {assertExecutionInputBoundary(store,execution)}catch {unknown.add("invalid-boundary-evidence");continue}
    for(const [channel,state] of Object.entries(execution.inputBoundary.channels))if(state==="unknown")unknown.add(channel)
    if(execution.inputBoundary.verdict!=="complete"&&!Object.values(execution.inputBoundary.channels).includes("unknown"))unknown.add("boundary-verdict")
  }
  const unknownChannels=[...unknown].sort()
  return {complete:unknownChannels.length===0,unknownChannels}
}
function measured(store:ControlStore,study:PolicyStudy,pair:PolicyPair):{value:PairedValue;evidence:VersionRef[]}|undefined {
  const evidence=new EvidenceStore(store)
  const row=store.db.prepare("SELECT obligation_id FROM policy_measurement_pairs WHERE study_id=? AND episode=?").get(study.id,pair.episode)
  const obligation=row?.obligation_id?evidence.obligation(String(row.obligation_id)):undefined
  if(!obligation||!evidence.satisfied(obligation))return
  const job=store.db.prepare("SELECT state,payload FROM validation_jobs WHERE obligation_id=? AND validator=?").get(obligation.id,study.validator)
  // A fabricated EvidenceStore.resolve receipt is not an executed measurement.
  if(job?.state!=="passed")return
  const jobRef=JSON.parse(String(job.payload)).evidence as VersionRef
  if(!obligation.evidence.some(ref=>digest(ref)===digest(jobRef)))return
  try {
    const proof=evidence.require(jobRef),receipt=(proof.content as {receipt:ValidationReceipt}).receipt
    if(!receipt||receipt.truncated) return
    const output=JSON.parse(receipt.stdout) as Measurement
    if(Object.keys(output).sort().join(",")!=="baseline,candidate")return
    scores(output.baseline);scores(output.candidate)
    const a=accepted(store,pair.baseline),b=accepted(store,pair.candidate)
    if(!a||!b)return
    if(study.sampleType==="observed") {
      if(!store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_model_usage'").get())return
      for(const [id,run] of [[pair.baseline,a],[pair.candidate,b]] as const) {
        const session=store.db.prepare("SELECT * FROM grant_sessions WHERE grant_id=?").get(id)
        if(!session||!store.db.prepare("SELECT 1 FROM grant_model_usage WHERE session_id=?").get(String(session.session_id))||store.db.prepare("SELECT 1 FROM grant_model_admissions WHERE session_id=? AND active=1").get(String(session.session_id))||store.db.prepare("SELECT 1 FROM grant_tool_calls WHERE session_id=? AND output_bytes IS NULL").get(String(session.session_id)))return
        if(Number(session.input_used)!==run.usage.inputTokens||Number(session.output_used)!==run.usage.outputTokens||Number(session.tool_used)!==run.usage.toolCalls)return
      }
    }
    const source=obligation.reason.map(ref=>evidence.require(ref)).find(proof=>proof.producer==="policy-measurements")?.content as {baseline?:{grant:ActivationGrant;result:Run};candidate?:{grant:ActivationGrant;result:Run}}|undefined
    if(!source||digest(source.baseline??null)!==digest({grant:grant(store,pair.baseline),result:a})||digest(source.candidate??null)!==digest({grant:grant(store,pair.candidate),result:b}))return
    // Questions/escalations are not final factual contributions.
    if([a,b].some(run=>run.output.unresolvedQuestions.length||run.output.requiresEscalation||run.output.evidence.some(ref=>!evidence.valid(ref))))return
    const utility=(run:Run,score:Scores)=>{
      let cost=0
      for(const key of costKeys) {
        const value=run.usage?.[key]
        if(!Number.isFinite(value)||value<0||value>study.normalization[key])throw new Error("Missing or out-of-range measured usage")
        cost+=value/study.normalization[key]*study.costWeights[key]
      }
      return (score.contribution-cost+1)/2
    }
    return {value:{episode:pair.episode,stratum:pair.stratum,gain:utility(b,output.candidate)-utility(a,output.baseline),quality:output.candidate.quality,criticalMiss:Number(output.candidate.criticalMiss)},evidence:[...obligation.reason,...obligation.evidence,...a.output.evidence,...b.output.evidence]}
  }catch{return}
}
export function policyStudyReport(store:ControlStore,ref:VersionRef) {
  const study=store.get<PolicyStudy>("policy_measurement_studies",ref.id,ref.version)
  if(!study)throw new Error("Unknown preregistered policy study")
  const evidence=new EvidenceStore(store),spec=validatorSpec(store,study.validator)
  const proposal=store.get<PolicyProposal>("policy_proposals",study.proposal.id,study.proposal.version)
  const sources=[...study.authorization,study.condition,study.samplingDesign,...(proposal?.evidence??[]),...(spec?.authorization??[])]
  if(!spec||!proposal||sources.some(ref=>!evidence.valid(ref)))throw new Error("Policy measurement authorization is no longer valid")
  const samples=study.pairs.map(pair=>({pair,measurement:measured(store,study,pair)}))
  const held=samples.filter(sample=>sample.pair.partition==="holdout")
  const complete=held.length>0&&held.every(sample=>!!sample.measurement)
  const bounds=complete?pairedBounds(held.map(sample=>sample.measurement!.value),study.confidence,study.gate.criticalStrata):null
  const inputCoverage=studyInputCoverage(store,study)
  const passes=(bound:NonNullable<typeof bounds>["overall"]|null)=>!!bound&&bound.effectiveSamples>=study.gate.minimumSamples&&bound.confidenceWidth<=study.gate.maxConfidenceWidth&&bound.usefulGainLowerBound>0&&bound.qualityLowerBound>=study.gate.qualityFloor&&bound.missedCriticalUpperBound<=study.gate.maxMissedCritical
  return {study,samples,bounds,complete,inputCoverage,evidence:[...sources,...samples.flatMap(sample=>sample.measurement?.evidence??[])],promotionEligible:study.sampleType==="observed"&&inputCoverage.complete&&!!bounds&&passes(bounds.overall)&&Object.values(bounds.strata).every(passes)}
}

/** Enrollment is fixed before either arm completes. No executor is called here;
 * accepted, read-only cognition runs are measured by an independent native job. */
export class PolicyMeasurements {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS policy_measurement_pairs(study_id TEXT NOT NULL,episode TEXT NOT NULL,baseline TEXT NOT NULL,candidate TEXT NOT NULL,obligation_id TEXT,PRIMARY KEY(study_id,episode));
      CREATE UNIQUE INDEX IF NOT EXISTS policy_measurement_episode ON policy_measurement_pairs(episode);
      CREATE INDEX IF NOT EXISTS policy_measurement_baseline ON policy_measurement_pairs(baseline);
      CREATE INDEX IF NOT EXISTS policy_measurement_candidate ON policy_measurement_pairs(candidate);`)
  }
  register(study:PolicyStudy):void {
    const {store,evidence}=this.runtime
    store.atomic(()=>{
      const prior=store.get<PolicyStudy>("policy_measurement_studies",study.id,study.version)
      if(prior) {if(digest(prior)!==digest(study))throw new Error("Policy study is immutable");return}
      if(!study.id||study.version!==1||!study.authorization.length||!["observed","synthetic"].includes(study.sampleType))throw new Error("Incomplete measurement study")
      const proposal=store.get<PolicyProposal>("policy_proposals",study.proposal.id,study.proposal.version)
      if(!proposal||digest(study.baseline)!==digest(proposal.rollback))throw new Error("Measurement baseline must be the pinned rollback")
      for(const ref of [...study.authorization,study.condition,study.samplingDesign])if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Measurement attribution and authorization require controller evidence")
      proposal.evidence.forEach(ref=>evidence.require(ref))
      const spec=validatorSpec(store,study.validator)
      if(!spec||spec.output!==undefined||spec.authorization.some(ref=>!evidence.valid(ref)))throw new Error("Measurement needs a registered receipt validator")
      if(!Number.isFinite(study.confidence)||study.confidence<=0||study.confidence>=1)throw new Error("Confidence must be fixed before outcomes")
      for(const key of costKeys) {if(!Number.isFinite(study.normalization[key])||study.normalization[key]<=0)throw new Error("Explicit positive cost units are required");unit(study.costWeights[key],"Cost weight")}
      if(Math.abs(costKeys.reduce((sum,key)=>sum+study.costWeights[key],0)-1)>1e-12)throw new Error("Normalized cost weights must sum to one")
      const gate=study.gate
      if(!Number.isSafeInteger(gate.minimumSamples)||gate.minimumSamples<1||typeof gate.requiresApproval!=="boolean"||new Set(gate.criticalStrata).size!==gate.criticalStrata.length||gate.criticalStrata.some(s=>!s.trim()))throw new Error("Invalid frozen measurement gate")
      for(const value of [gate.maxConfidenceWidth,gate.qualityFloor,gate.maxMissedCritical])unit(value,"Measurement gate")
      if(!study.pairs.length||new Set(study.pairs.map(pair=>pair.episode)).size!==study.pairs.length||new Set(study.pairs.flatMap(pair=>[pair.baseline,pair.candidate])).size!==study.pairs.length*2)throw new Error("One independent episode and distinct grants per pair are required")
      if(!study.pairs.some(pair=>pair.partition==="training")||!study.pairs.some(pair=>pair.partition==="holdout"))throw new Error("Frozen training and holdout episodes are required")
      for(const pair of study.pairs) {
        if(!pair.episode.trim()||!pair.stratum.trim()||!["training","holdout"].includes(pair.partition))throw new Error("Invalid episode membership")
        if(store.db.prepare("SELECT 1 FROM policy_measurement_pairs WHERE episode=?").get(pair.episode))throw new Error("Measured episodes cannot be reused for a new policy study")
        const a=grant(store,pair.baseline),b=grant(store,pair.candidate)
        for(const g of [a,b]) {
          if((g.profile.provider==="test"?"synthetic":"observed")!==study.sampleType)throw new Error("Synthetic measurements cannot be relabeled observed")
          const state=store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(g.id)!.state
          const run=store.db.prepare("SELECT state,payload FROM agent_runs WHERE grant_id=?").get(g.id)
          // Grant issuance creates an inert candidate lifecycle record. Enrollment
          // remains prospective until that record becomes active or terminal.
          const candidate=run&&run.state==="candidate"&&digest(JSON.parse(String(run.payload)).grant)===digest(g)
          if(state!=="issued"||run&&!candidate)throw new Error("Enroll both arms before execution begins")
          if(g.executionMode==="task"||g.writeScopes.length||g.allowedTools.some(tool=>tool!=="task_graph_cognitive_context"))throw new Error("Paired policy measurement requires cognition over a frozen context without external reads")
        }
        const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(a.taskId)
        if(pair.episode!==String(owner?.request_id??a.taskId))throw new Error("Episode identity must follow the actual request or standalone task")
        const identity=(g:ActivationGrant)=>({taskId:g.taskId,specHash:g.specHash,inputVector:g.inputVector,graphHash:g.graphHash,role:g.role})
        if(digest(identity(a))!==digest(identity(b))||digest(a.policy)!==digest(study.baseline)||digest(b.policy)!==digest(study.proposal))throw new Error("Pair must preserve input identity and pinned policy arms")
        if(store.db.prepare("SELECT 1 FROM policy_measurement_pairs WHERE baseline IN (?,?) OR candidate IN (?,?)").get(a.id,b.id,a.id,b.id))throw new Error("A grant cannot be reused across studies")
      }
      store.put("policy_measurement_studies",study.id,1,study)
      for(const pair of study.pairs)store.db.prepare("INSERT INTO policy_measurement_pairs VALUES(?,?,?,?,NULL)").run(study.id,pair.episode,pair.baseline,pair.candidate)
      store.event({id:`policy-study:${study.id}`,type:"PolicyMeasurementRegistered",entityId:proposal.target,correlationId:study.id,schemaVersion:1,timestamp:Date.now(),payload:{study:{id:study.id,version:1}}})
    })
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("policy-measurements/v1","paired-accepted-runs/v1",event=>{
      if(event.type!=="AgentCompleted")return
      const {grantId}=event.payload as {grantId:string}
      for(const row of store.db.prepare("SELECT * FROM policy_measurement_pairs WHERE (baseline=? OR candidate=?) AND obligation_id IS NULL").all(grantId,grantId)) {
        const study=store.get<PolicyStudy>("policy_measurement_studies",String(row.study_id),1)!,pair=study.pairs.find(pair=>pair.episode===row.episode)!
        const a=accepted(store,pair.baseline),b=accepted(store,pair.candidate)
        if(!a||!b||[...study.authorization,study.condition,study.samplingDesign].some(ref=>!evidence.valid(ref)))continue
        const content={study:{id:study.id,version:1},episode:pair.episode,condition:evidence.require(study.condition),baseline:{grant:grant(store,pair.baseline),result:a},candidate:{grant:grant(store,pair.candidate),result:b},contract:"Return {baseline:{contribution:number,quality:number,criticalMiss:boolean,reason:string},candidate:{contribution:number,quality:number,criticalMiss:boolean,reason:string}}. Scores must be factual [0,1] measurements under the registered attribution condition. Required assurance may contribute without new findings. Missing causal evidence is unknown: fail the measurement rather than invent usefulness or missed failures."}
        const tuple=[{entityId:study.id,port:"paired-results",view:pair.episode,version:1,hash:digest(content)}]
        const proof=evidence.put({id:`policy-pair:${study.id}:${pair.episode}`,version:1,type:"runtime",source:"paired accepted results",producer:"policy-measurements",validatorVersion:"paired-input/v1",timestamp:event.timestamp,content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
        const obligation=evidence.createObligation({entityId:study.id,tuple,kind:"policy-measurement",mandatory:false,validators:[study.validator],reason:[...study.authorization,study.condition,study.samplingDesign,proof,...inputBoundaryEvidence(content.baseline.grant),...inputBoundaryEvidence(content.candidate.grant)]})
        store.db.prepare("UPDATE policy_measurement_pairs SET obligation_id=? WHERE study_id=? AND episode=?").run(obligation.id,study.id,pair.episode)
      }
    },1000)
  }
  report(ref:VersionRef){return policyStudyReport(this.runtime.store,ref)}
  evaluate(ref:VersionRef,stage:Evaluation["stage"],approval:VersionRef[]=[]):void {
    this.runtime.store.atomic(()=>{
      const report=this.report(ref),study=report.study
      if(stage!=="shadow"&&!report.promotionEligible)throw new Error("Measured holdout evidence has not met promotion gates")
      const metrics=report.bounds?.overall??{usefulGainLowerBound:0,qualityLowerBound:0,missedCriticalUpperBound:1,effectiveSamples:0,confidenceWidth:1}
      const evaluation:Evaluation={id:study.id,version:1,proposal:study.proposal,stage,episodes:study.pairs.filter(pair=>pair.partition==="training").map(pair=>pair.episode),holdoutEpisodes:study.pairs.filter(pair=>pair.partition==="holdout").map(pair=>pair.episode),...metrics,criticalStrata:study.gate.criticalStrata,evidence:report.evidence,authorized:approval.length>0,approval,measurementStudy:ref}
      new PolicyLearning(this.runtime.store).evaluate(evaluation,study.gate,ref=>this.runtime.evidence.valid(ref))
      if(stage==="active") {
        const proposal=this.runtime.store.get<PolicyProposal>("policy_proposals",study.proposal.id,study.proposal.version)!
        this.runtime.policyRegression.register({id:`automatic-regression:${digest(study.proposal)}`,target:proposal.target,policy:study.proposal,rollback:study.baseline,validator:study.validator,condition:study.condition,authorization:study.authorization,maxSamples:Math.max(study.gate.minimumSamples,study.pairs.filter(pair=>pair.partition==="holdout").length),sampleType:study.sampleType})
      }
    })
  }
}

export function assertMeasuredEvaluation(store:ControlStore,evaluation:Evaluation,gate:EvaluationGate):void {
  if(!evaluation.measurementStudy)throw new Error("Policy promotion needs a preregistered measured study")
  const report=policyStudyReport(store,evaluation.measurementStudy),study=report.study
  if(digest(study.proposal)!==digest(evaluation.proposal)||digest(study.gate)!==digest(gate))throw new Error("Measured policy and gates do not match")
  const episodes=(partition:PolicyPair["partition"])=>study.pairs.filter(pair=>pair.partition===partition).map(pair=>pair.episode)
  if(digest(episodes("training"))!==digest(evaluation.episodes)||digest(episodes("holdout"))!==digest(evaluation.holdoutEpisodes))throw new Error("Measured episode partition mismatch")
  if(!report.promotionEligible)throw new Error("Measured holdout evidence has not met promotion gates")
  const actual=report.bounds!.overall
  for(const key of ["usefulGainLowerBound","qualityLowerBound","missedCriticalUpperBound","effectiveSamples","confidenceWidth"] as const)if(evaluation[key]!==actual[key])throw new Error("Caller aggregate does not match measured evidence")
  if(digest(evaluation.criticalStrata)!==digest(gate.criticalStrata)||report.evidence.some(ref=>!evaluation.evidence.some(supplied=>digest(supplied)===digest(ref))))throw new Error("Measured evidence or critical strata omitted")
}
