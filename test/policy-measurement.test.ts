import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PolicyLearning,type PolicyProposal } from "../packages/task-policy/src/index.ts"
import { pairedBounds,type PolicyStudy } from "../packages/task-policy/src/measurement.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type Signals,type RoleVersion,type ActivationGrant } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"

function setup(r:ReturnType<typeof createGraphRuntime>,command?:string) {
  const content={condition:"The fixture's independent expected flag defines quality; returning no findings still provides required assurance. These model outputs are synthetic."}
  const authorization=r.control.evidence.put({id:"operator",version:1,type:"code",source:"test controller",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
  const proposal:PolicyProposal={id:"precision",version:2,target:"precision",observedPattern:"반복 검증",rootCause:"정밀도",proposedInvariant:"검증 보존",proposedRule:{op:"gte",feature:"risk",value:.5},expectedBenefit:1,regressionRisk:.1,evidence:[authorization],counterexamples:[],rollback:{id:"precision",version:1}}
  r.store.control.put("policy_versions",proposal.id,1,{...proposal,version:1})
  new PolicyLearning(r.store.control).propose(proposal,ref=>r.control.evidence.valid(ref))
  r.control.validators.register({id:"measurement",version:1,command:[process.execPath,"-e",command??`let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);const pair=input.evidence.find(e=>e.producer==='policy-measurements').content;const score=arm=>({contribution:1,quality:Number(arm.result.output.decisions.includes('expected')),criticalMiss:false,reason:'Required assurance measured against the fixture contract'});console.log(JSON.stringify({baseline:score(pair.baseline),candidate:score(pair.candidate)}));`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
  const role:RoleVersion={id:"reviewer",version:1,name:"reviewer",purpose:"review",capabilities:[],prompt:"review",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:3},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[authorization]}
  r.control.roleLifecycle.installConfigured(role,"policy measurement fixture")
  const grants:ActivationGrant[]=[]
  const pairs=(["training","holdout"] as const).map(partition=>{
    const task=r.engine.createTask({title:"독립 에피소드",goal:"independent test episode"})
    const issue=(version:number)=>{
      const policy={id:proposal.id,version}
      const context=budgetContext({taskId:task.id,role,policy,items:[],scaffold:role.prompt,outputReservation:10,countTokens:s=>Buffer.byteLength(s)})
      r.store.control.put("context_manifests",context.id,1,context)
      const decision=r.control.admission.record(activation({taskId:task.id,eventId:`${task.id}:${version}`,eligible:true,role,policy,signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
      const grant=r.control.admission.issue({decisionId:decision.id,taskId:task.id,specHash:r.engine.signals.capture(task.id).specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy,context:{id:context.id,version:1},contextHash:context.hash,profile:{id:`fixture-${version}`,level:3,provider:"test",model:"bounded",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},executionMode:"cognition",writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+60000,generation:1},"fixture",10000)
      grants.push(grant);return grant.id
    }
    return {episode:task.id,partition,stratum:"critical",baseline:issue(1),candidate:issue(2)}
  })
  const study:PolicyStudy={id:"study",version:1,proposal:{id:proposal.id,version:2},baseline:proposal.rollback,authorization:[authorization],condition:authorization,validator:"measurement/v1",pairs,gate:{minimumSamples:1,maxConfidenceWidth:1,qualityFloor:0,maxMissedCritical:1,criticalStrata:["critical"],requiresApproval:true},confidence:.95,normalization:{inputTokens:1000,outputTokens:100,toolCalls:1,elapsedMs:1000},costWeights:{inputTokens:.5,outputTokens:.5,toolCalls:0,elapsedMs:0},samplingDesign:authorization,sampleType:"synthetic"}
  return {study,grants,authorization}
}
function complete(r:ReturnType<typeof createGraphRuntime>,g:ActivationGrant,options:{missing?:boolean;excess?:boolean}={}) {
  r.control.admission.claim(g.id,{worker:g.id,specHash:g.specHash,inputVector:g.inputVector,graphHash:g.graphHash,generation:g.generation,now:Date.now()})
  r.control.admission.submit(g.id,g.id,{taskId:g.taskId,findings:[],decisions:["expected"],risks:[],unresolvedQuestions:options.missing?["unanswered"]:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:g.policy.version===1?100:1,outputTokens:1,toolCalls:0,elapsedMs:options.excess?1001:1})
}
for(const mode of ["measured","restart","malformed","failed","truncated","unresolved","over-unit","retracted","missing"] as const)test(`정책 평가가 사전 등록된 실제 두 실행과 독립 측정을 사용한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"policy-measurement-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const command=mode==="malformed"?'console.log("not measured")':mode==="failed"?'process.exit(2)':mode==="truncated"?'console.log(" ".repeat(3000))':undefined
    const {study,grants,authorization}=setup(r,command)
    r.control.policyMeasurements.register(study)
    r.control.policyMeasurements.register(study)
    assert.throws(()=>r.control.policyMeasurements.register({...study,confidence:.5}),/immutable/)
    r.control.policyMeasurements.evaluate({id:study.id,version:1},"shadow")
    assert.equal(r.control.policyMeasurements.report(study).complete,false)
    for(const g of grants) {
      if(mode==="missing"&&g.id===study.pairs[1]!.candidate)continue
      complete(r,g,{missing:mode==="unresolved",excess:mode==="over-unit"})
    }
    if(mode==="restart") {r.close();r=createGraphRuntime(file)}
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:10000})
    let report=r.control.policyMeasurements.report(study)
    assert.equal(report.complete,["measured","restart","retracted"].includes(mode))
    assert.deepEqual(report.inputCoverage,{complete:false,unknownChannels:["environment","random"]})
    assert.equal(report.promotionEligible,false,"Synthetic samples never authorize observed policy promotion")
    assert.throws(()=>r.control.policyMeasurements.evaluate({id:study.id,version:1},"validated"),/promotion gates/)
    if(report.complete) {
      assert.equal(report.bounds!.overall.effectiveSamples,1)
      const measured=report.samples[1]!.measurement!.value
      assert.ok(Math.abs(measured.gain-.02475)<1e-12)
      assert.equal(measured.quality,1,"No new finding may still provide required assurance")
      assert.equal(measured.criticalMiss,0)
    }
    if(mode==="retracted") {
      const row=r.store.db.prepare("SELECT obligation_id FROM policy_measurement_pairs WHERE episode=?").get(study.pairs[1]!.episode)!
      r.control.evidence.retract(r.control.evidence.obligation(String(row.obligation_id))!.evidence[0]!,[authorization],"withdraw measured verdict")
      report=r.control.policyMeasurements.report(study)
      assert.equal(report.complete,false)
    }
    for(let i=0;i<2;i++)r.engine.atomic(()=>r.control.policyMeasurements.ingest())
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_measurement_pairs WHERE obligation_id IS NOT NULL").get()!.n,mode==="missing"?1:2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_heads").get()!.n,0)
    assert.throws(()=>r.store.db.prepare("UPDATE policy_measurement_studies SET payload='{}'").run(),/Immutable/)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("정책 표본은 결과를 본 뒤 선정하거나 episode 이름으로 복제할 수 없다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const {study,grants}=setup(r)
    assert.throws(()=>r.control.policyMeasurements.register({...study,sampleType:"observed"}),/relabeled/)
    assert.throws(()=>r.control.policyMeasurements.register({...study,pairs:study.pairs.map((pair,i)=>i?pair:{...pair,episode:"fake-independent-episode"})}),/Episode identity/)
    assert.throws(()=>r.control.policyMeasurements.register({...study,costWeights:{...study.costWeights,toolCalls:.1}}),/sum to one/)
    assert.throws(()=>r.control.policyMeasurements.register({...study,pairs:[...study.pairs,{...study.pairs[1]!,episode:"duplicate"}]}),/distinct grants/)
    complete(r,grants[0]!)
    assert.throws(()=>r.control.policyMeasurements.register(study),/before execution/)
  }finally{r.close()}
})

test("정규화된 paired 신뢰구간은 유효 표본 수와 개별 critical strata를 보존한다",()=>{
  const values=Array.from({length:1000},(_,i)=>({episode:`goal-${i}`,stratum:i===0?"rare":"common",gain:.5,quality:1,criticalMiss:0}))
  const result=pairedBounds(values,.95,["rare","absent"])
  assert.ok(result.overall.usefulGainLowerBound>0)
  assert.ok(result.overall.qualityLowerBound>.9)
  assert.ok(result.overall.missedCriticalUpperBound<.1)
  assert.equal(result.strata.rare!.effectiveSamples,1)
  assert.ok(result.strata.rare!.usefulGainLowerBound<0,"Aggregate success cannot hide a weak critical stratum")
  assert.equal(result.strata.absent,null)
  assert.throws(()=>pairedBounds([values[0]!,values[0]!],.95,[]),/Repeated episodes/)
  assert.throws(()=>pairedBounds([{...values[0]!,gain:2}],.95,[]),/Unbounded/)
})

test("shadow 수치를 위조해도 합성 측정을 검증된 정책으로 승격할 수 없다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"policy-forged-evaluation-")),r=createGraphRuntime(":memory:")
  try {
    const {study,grants}=setup(r)
    r.control.policyMeasurements.register(study)
    r.control.policyMeasurements.evaluate({id:study.id,version:1},"shadow")
    grants.forEach(g=>complete(r,g))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:10000})
    const report=r.control.policyMeasurements.report(study)
    const forged={id:"forged",version:1,proposal:study.proposal,stage:"validated" as const,episodes:[study.pairs[0]!.episode],holdoutEpisodes:[study.pairs[1]!.episode],usefulGainLowerBound:1,qualityLowerBound:1,missedCriticalUpperBound:0,effectiveSamples:10000,confidenceWidth:0,criticalStrata:study.gate.criticalStrata,evidence:report.evidence,authorized:true,measurementStudy:{id:study.id,version:1}}
    assert.throws(()=>new PolicyLearning(r.store.control).evaluate(forged,study.gate,()=>true),/promotion gates/)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_heads").get()!.n,0)
    assert.throws(()=>r.control.policyMeasurements.register({...study,id:"reuse-holdout"}),/episodes cannot be reused/)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
