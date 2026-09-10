import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { digest } from "../packages/task-control/src/value.ts"
import type { RoleVersion } from "../packages/task-cognition/src/model.ts"
import type { RoleEvaluation,RoleGate } from "../packages/task-cognition/src/roles.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type Signals } from "../packages/task-cognition/src/model.ts"
import { GuardAuthority } from "../packages/task-control/src/guard-authority.ts"

const gate:RoleGate={minimumSamples:2,maxOverlap:.25,approvalRequired:true}
function role(version:number,lifecycle:RoleVersion["lifecycle"],evidence:{id:string;version:number}[]):RoleVersion{return {id:"migration-specialist",version,name:"Migration specialist",purpose:"Handle recurring data migrations",capabilities:["migration"],prompt:"Inspect and report migration compatibility",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:2000,maxDependencyDepth:1,maxEvidenceItems:4,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:["migration/v1"],allowedTools:[],lifecycle,evidence}}
function proof(r:ReturnType<typeof createGraphRuntime>,id:string,type:"runtime"|"code"="runtime"){
  const content={id,observed:true}
  return r.control.evidence.put({id,version:1,type,source:"role lifecycle fixture",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
}
function evaluation(evidence:{id:string;version:number}[],authorization:{id:string;version:number}[]=[]):RoleEvaluation{return {evidence,specializedEpisodes:["episode-a","episode-b"],existingCapabilityGap:true,reusableCapability:true,usefulGainLowerBound:.2,overlapUpperBound:.1,effectiveSamples:2,authorization}}

test("동적 역할은 증거가 고정된 네 단계를 건너뛰지 않고 통과한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const measured=proof(r,"measured"),authorized=proof(r,"authorized","code")
    assert.throws(()=>r.control.roleLifecycle.register(role(1,"temporary",[measured]),0,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref)),/skip stages/)
    r.control.roleLifecycle.register(role(1,"candidate",[measured]),0,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    assert.equal(r.control.roleLifecycle.executable({id:"migration-specialist",version:1},ref=>r.control.evidence.valid(ref)),false)
    r.control.roleLifecycle.register(role(2,"temporary",[measured]),1,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    r.control.roleLifecycle.register(role(3,"validated",[measured]),2,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    assert.throws(()=>r.control.roleLifecycle.register(role(4,"persistent",[measured]),3,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref)),/authorization/)
    r.control.roleLifecycle.register(role(4,"persistent",[measured]),3,evaluation([measured],[authorized]),gate,ref=>r.control.evidence.valid(ref))
    assert.equal(r.control.roleLifecycle.executable({id:"migration-specialist",version:4},ref=>r.control.evidence.valid(ref)),true)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM role_lifecycle_records").get()!.n,4)
  }finally{r.close()}
})

test("직접 저장하거나 근거가 철회된 역할은 실행 신뢰를 얻지 못한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const measured=proof(r,"measured"),authority=proof(r,"authority","code"),uncertified={...role(1,"persistent",[]),id:"uncertified"}
    r.store.control.put("role_versions",uncertified.id,1,uncertified)
    assert.equal(r.control.roleLifecycle.executable({id:uncertified.id,version:1},ref=>r.control.evidence.valid(ref)),false)
    r.control.roleLifecycle.register(role(1,"candidate",[measured]),0,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    r.control.roleLifecycle.register(role(2,"temporary",[measured]),1,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    assert.equal(r.control.roleLifecycle.executable({id:"migration-specialist",version:2},ref=>r.control.evidence.valid(ref)),true)
    r.control.evidence.retract(measured,[authority],"measurement withdrawn")
    assert.equal(r.control.roleLifecycle.executable({id:"migration-specialist",version:2},ref=>r.control.evidence.valid(ref)),false)
    assert.throws(()=>r.store.db.prepare("UPDATE role_lifecycle_records SET source='configured'").run(),/Immutable role lifecycle/)
  }finally{r.close()}
})

test("명시된 코드 구성 역할만 학습 단계 밖의 영속 기준선으로 설치된다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const configured={...role(1,"persistent",[]),id:"configured"}
    assert.throws(()=>r.control.roleLifecycle.installConfigured({...configured,lifecycle:"temporary"},"catalog/v1"),/persistent baseline/)
    r.control.roleLifecycle.installConfigured(configured,"catalog/v1")
    r.control.roleLifecycle.installConfigured(configured,"catalog/v1")
    assert.equal(r.control.roleLifecycle.record({id:"configured",version:1})?.configuration,"catalog/v1")
    assert.equal(r.control.roleLifecycle.executable({id:"configured",version:1},ref=>r.control.evidence.valid(ref)),true)
  }finally{r.close()}
})

test("실행 중 역할 근거가 철회되면 다음 모델·도구 호출과 결과 채택을 막는다",async()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const measured=proof(r,"measured"),authority=proof(r,"authority","code")
    r.control.roleLifecycle.register(role(1,"candidate",[measured]),0,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    const temporary=role(2,"temporary",[measured])
    r.control.roleLifecycle.register(temporary,1,evaluation([measured]),gate,ref=>r.control.evidence.valid(ref))
    const task=r.engine.createTask({title:"evaluate role",goal:"evaluate role"}),worker="role-worker",policy={id:"p",version:1}
    const context=budgetContext({taskId:task.id,role:temporary,policy,items:[],scaffold:temporary.prompt,outputReservation:100,countTokens:value=>Buffer.byteLength(value)})
    r.store.control.put("context_manifests",context.id,1,context)
    const decision=r.control.admission.record(activation({taskId:task.id,eventId:"role-evaluation",eligible:true,role:temporary,policy,signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
    const snapshot=r.engine.signals.capture(task.id)
    const grant=r.control.admission.issue({taskId:task.id,decisionId:decision.id,specHash:snapshot.specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:temporary.id,version:temporary.version},policy,profile:{id:"evaluation",level:3,provider:"test",model:"test",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:10000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},context:{id:context.id,version:1},contextHash:context.hash,writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+10000,generation:1,worker},"test",10000)
    r.control.admission.claim(grant.id,{worker,specHash:grant.specHash,inputVector:[],graphHash:grant.graphHash,generation:1,now:Date.now()})
    const guard=new GuardAuthority(r.store.control);guard.bind(worker,grant.id)
    assert.equal((await guard.authorize(worker,{kind:"model"})).grant.id,grant.id)
    r.control.evidence.retract(measured,[authority],"role evaluation withdrawn")
    await assert.rejects(guard.authorize(worker,{kind:"model"}),/withdrawn/)
    assert.throws(()=>r.control.admission.submit(grant.id,worker,{taskId:task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1}),/lifecycle/)
  }finally{r.close()}
})
