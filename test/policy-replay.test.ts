import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PolicyLearning, type PolicyProposal } from "../packages/task-policy/src/index.ts"
import type { ActivationFrame } from "../packages/task-policy/src/replay.ts"
import { FEATURES,type Signals,type RoleVersion } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"

function setup(r:ReturnType<typeof createGraphRuntime>) {
  const content={authorization:"synthetic replay fixture"}
  const proof=r.control.evidence.put({id:"source",version:1,type:"user",source:"fixture",producer:"test",validatorVersion:"fixture/v1",timestamp:Date.now(),confidence:1,content,contentHash:digest(content),inputVector:[],expiresAt:null})
  const role:RoleVersion={id:"qa",version:1,name:"QA",purpose:"검증",capabilities:[],prompt:"검증",activationPolicy:{hardTriggers:["failure"],softSignals:{risk:1},threshold:.8,cooldownMs:100,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[proof]}
  r.store.control.put("role_versions",role.id,1,role)
  const proposal:PolicyProposal={id:"candidate",version:1,target:"activation",observedPattern:"중간 위험 관찰",rootCause:"활성화 임계값",proposedInvariant:"필수 검증 보존",proposedRule:{op:"gte",feature:"risk",value:.3},expectedBenefit:1,regressionRisk:.1,evidence:[proof],counterexamples:[],rollback:{id:"baseline",version:1}}
  new PolicyLearning(r.store.control).propose(proposal,ref=>r.control.evidence.valid(ref))
  const task=r.engine.createTask({title:"입력 보존",goal:"과거 판단 재현"})
  const input={taskId:task.id,eventId:"first",eligible:true,role,policy:{id:"baseline",version:1},signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,0])),risk:.5} as Signals,now:Date.now(),invocations:0}
  return {proof,role,proposal,task,input,trial:{id:"trial",proposal:{id:proposal.id,version:1},role:{id:role.id,version:1},effect:"additional-trigger" as const,split:{seed:"fixed-before-shadow",holdoutBuckets:30}}}
}

test("historical replay와 shadow는 같은 불변 입력을 사용하고 재시작에도 holdout이 변하지 않는다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"policy-replay-")),file=join(directory,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const {input,proof,trial,task}=setup(r)
    const decision=r.control.policyReplay.recordActivation(input,"episode-one",[proof])
    const snapshot=r.store.control.get<ActivationFrame>("policy_replay_frames",decision.id,1)!
    assert.equal(r.control.policyReplay.recordActivation(input,"episode-one",[proof]).id,decision.id)
    assert.throws(()=>r.control.policyReplay.recordActivation({...input,signals:{...input.signals,risk:1}},"episode-one",[proof]),/already recorded/)
    r.control.policyReplay.register(trial)
    let report=r.control.policyReplay.report(trial.id)
    assert.equal(report.length,1);assert.equal(report[0]!.phase,"historical")
    assert.equal(report[0]!.actual,"skip");assert.equal(report[0]!.predicted,"activate")
    assert.equal(report[0]!.candidateCost,null);assert.equal(report[0]!.usefulActivation,null)
    assert.equal(report[0]!.observed.usage,null);assert.equal(report[0]!.promotionEligible,false)
    r.engine.signals.invalidate(task.id,"뒤늦게 바뀐 입력")
    assert.deepEqual(r.store.control.get("policy_replay_frames",decision.id,1),snapshot)
    r.close();r=createGraphRuntime(file)
    r.control.policyReplay.recordActivation({...input,eventId:"second"},"episode-one",[proof])
    report=r.control.policyReplay.report(trial.id)
    assert.equal(report.length,2);assert.deepEqual(report.map(row=>row.phase).sort(),["historical","shadow"])
    assert.equal(new Set(report.map(row=>row.partition)).size,1)
    assert.deepEqual(report.map(row=>row.predicted),["activate","activate"])
    for(let i=0;i<3;i++)r.engine.atomic(()=>r.control.policyReplay.ingest())
    assert.equal(r.control.policyReplay.report(trial.id).length,2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,0)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_heads").get()!.n,0)
    assert.throws(()=>r.control.policyReplay.register({...trial,split:{...trial.split,seed:"retune-holdout"}}),/immutable/)
    assert.throws(()=>r.store.db.prepare("UPDATE policy_replay_frames SET payload='{}'").run(),/Immutable/)
  }finally{r.close();rmSync(directory,{recursive:true,force:true})}
})

test("추가 활성화 후보는 필수 trigger·quota·cooldown·eligibility를 약화하지 않는다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const {input,proof,trial}=setup(r)
    r.control.policyReplay.register(trial)
    const cases=[
      {key:"quota",input:{...input,invocations:2},expected:"defer"},
      {key:"cooldown",input:{...input,lastInvocation:input.now-1},expected:"defer"},
      {key:"ineligible",input:{...input,eligible:false},expected:"skip"},
      {key:"mandatory",input:{...input,signals:{...input.signals,risk:0,failure:1}},expected:"activate"},
    ]
    for(const item of cases) {
      r.control.policyReplay.recordActivation({...item.input,eventId:item.key},item.key,[proof])
      assert.equal(r.control.policyReplay.report(trial.id).find(row=>row.episode===item.key)!.predicted,item.expected)
    }
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,0)
  }finally{r.close()}
})

test("미관측 relation은 false나 성공 label이 되지 않으며 지원하지 않는 target은 거절한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const {input,proof,trial,proposal}=setup(r),learning=new PolicyLearning(r.store.control)
    learning.propose({...proposal,id:"relation",proposedRule:{op:"relation",value:"shares_contract"}},ref=>r.control.evidence.valid(ref))
    r.control.policyReplay.register({...trial,proposal:{id:"relation",version:1}})
    r.control.policyReplay.recordActivation(input,"unknown-relation",[proof])
    const report=r.control.policyReplay.report(trial.id)[0]!
    assert.equal(report.ruleResult,null);assert.equal(report.predicted,"defer")
    assert.equal(report.preventedFailure,null);assert.equal(report.counterfactualOutcome,null)
    learning.propose({...proposal,id:"context",target:"context"},ref=>r.control.evidence.valid(ref))
    assert.throws(()=>r.control.policyReplay.register({...trial,id:"unsupported",proposal:{id:"context",version:1}}),/activation proposal/)
  }finally{r.close()}
})
