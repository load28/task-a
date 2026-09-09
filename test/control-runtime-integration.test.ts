import { test } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { GuardAuthority } from "../packages/task-control/src/guard-authority.ts"
import { attemptInputVector } from "../packages/task-control/src/completion.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES, type RoleVersion, type Signals } from "../packages/task-cognition/src/model.ts"
import type { SemanticState, VersionVector } from "../packages/task-causality/src/model.ts"

type Runtime=ReturnType<typeof createGraphRuntime>
const policy={weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.7,exit:.3}
const semantic:SemanticState={artifacts:{},contract:{},behavior:{works:true},dependencies:{},goals:{},risk:0}
function evidence(r:Runtime,content:unknown,tuple:VersionVector=[],validator="runtime/v1",expiresAt:number|null=null) {
  return r.control.evidence.put({id:randomUUID(),version:1,type:"runtime",source:"runtime-test",producer:"test",validatorVersion:validator,timestamp:Date.now()-1000,content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt})
}
function obligation(r:Runtime,entityId:string,mandatory=true) {
  return r.control.evidence.createObligation({entityId,tuple:[],kind:"critical-review",mandatory,validators:["runtime/v1"],reason:[evidence(r,{changed:true})]})
}
function grant(r:Runtime,taskId:string,worker:string) {
  const role:RoleVersion={id:"review",version:1,name:"Review",purpose:"critical verification",capabilities:[],prompt:"verify",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:10},requiredContext:[],contextBudget:{maxTokens:4000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[]}
  r.store.control.put("role_versions",role.id,1,role)
  const manifest=budgetContext({taskId,role,policy:{id:"p",version:1},items:[],scaffold:"review",outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
  r.store.control.put("context_manifests",manifest.id,1,manifest)
  const decision=r.control.admission.record(activation({taskId,eventId:randomUUID(),eligible:true,role,policy:{id:"p",version:1},signals:{...Object.fromEntries(FEATURES.map(f=>[f,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
  const snapshot=r.engine.signals.capture(taskId)
  return r.control.admission.issue({taskId,decisionId:decision.id,specHash:snapshot.specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:{id:"p",version:1},profile:{id:"bounded",level:3,provider:"test",model:"test",maxInputTokens:1000,maxOutputTokens:1000,maxToolCalls:1,timeoutMs:10000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},context:{id:manifest.id,version:1},contextHash:manifest.hash,writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+10000,generation:1,worker},"test",100000)
}

test("실제 runtime은 조회 없이 변경을 투영하고 바깥 transaction과 함께 롤백한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const a=r.engine.createTask({title:"source",goal:"source"})
    const b=r.engine.createTask({title:"consumer",goal:"consumer",dependencies:[a.id]})
    assert.ok(r.control.graph.outgoing(a.id).some(edge=>edge.target.entityId===b.id))
    assert.equal(r.store.db.prepare("SELECT eligible FROM control_ready WHERE task_id=?").get(a.id)?.eligible,1)
    const count=r.store.db.prepare("SELECT count(*) AS n FROM event_outbox").get()!.n
    assert.throws(()=>r.engine.atomic(()=>{r.engine.createTask({title:"rollback",goal:"rollback"});throw new Error("crash")}))
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM event_outbox").get()!.n,count)
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM control_task_changes").get()!.n,0)
    r.engine.atomic(()=>r.store.db.prepare("DELETE FROM task_dependencies WHERE task_id=?").run(b.id))
    assert.equal(r.control.graph.outgoing(a.id).filter(edge=>edge.target.entityId===b.id).length,0)
    r.engine.atomic(()=>r.store.addDependency(b.id,a.id,new Date().toISOString()))
    assert.ok(r.control.graph.outgoing(a.id).some(edge=>edge.target.entityId===b.id))
    assert.equal(r.control.drain(),0)
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM agent_runs").get()!.n,0)
  } finally {r.close()}
})

test("필수 의무가 leaf·parent 완료를 막고 만료된 satisfied 증거도 재검증한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const root=r.engine.createTask({title:"root",goal:"root"})
    const child=r.engine.proposeDecomposition({taskId:root.id,children:[{title:"child",goal:"child"}]}).children[0]!
    r.engine.startTask(child.id)
    const pending=obligation(r,child.id)
    assert.throws(()=>r.engine.completeTask({taskId:child.id,summary:"done",verification:{passed:true}}),/obligation unresolved/)
    assert.equal(r.engine.requireTask(child.id).status,"running")
    assert.equal(r.engine.evaluateCompletion(root.id).complete,false)
    r.control.evidence.resolve(pending.id,[evidence(r,{passed:true})])
    r.engine.completeTask({taskId:child.id,summary:"done",verification:{passed:true}})
    assert.equal(r.engine.evaluateCompletion(root.id).complete,true)
    const short=evidence(r,{passed:true},[],"runtime/v1",Date.now()+10000)
    r.control.evidence.resolve(pending.id,[short])
    assert.equal(r.control.evidence.satisfied(r.control.evidence.obligation(pending.id)!,Date.now()+10001),false)
    const optional=obligation(r,root.id,false)
    assert.equal(r.control.evidence.unresolved(root.id).length,0)
    assert.equal(obligation(r,root.id,true).id,optional.id)
    assert.equal(r.engine.evaluateCompletion(root.id).complete,false)
  } finally {r.close()}
})

test("기대와 정책은 실행 전에 고정되고 현재 attempt의 실제 관찰만 완료에 사용한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const task=r.engine.createTask({title:"typed",goal:"typed"})
    const expectation={id:task.id,version:1,taskId:task.id,specHash:r.engine.signals.capture(task.id).specHash,expectedArtifacts:{},expectedInterface:{},expectedBehavior:{works:true},expectedDependencies:{},expectedGoals:{},expectedRisk:0,evidence:[evidence(r,{goal:"typed"})]}
    r.control.pinExpectation(expectation,policy)
    r.engine.startTask(task.id)
    assert.throws(()=>r.control.pinExpectation({...expectation,version:2},policy),/before execution/)
    assert.throws(()=>r.engine.completeTask({taskId:task.id,summary:"done",verification:{passed:true}}),/observation missing/)
    const inputVector=attemptInputVector(r.engine,task.id)
    const observation={id:randomUUID(),version:1,taskId:task.id,expectation:{id:task.id,version:1},state:semantic,inputVector,evidence:[evidence(r,{state:semantic},inputVector)]}
    assert.throws(()=>r.control.observe({...observation,inputVector:[]},policy,[]),/stale input/)
    assert.throws(()=>r.control.observe(observation,{...policy,exit:.6},[]),/pre-execution policy/)
    r.control.observe({...observation,state:{...semantic,behavior:null},evidence:[evidence(r,{state:{...semantic,behavior:null}},inputVector)]},policy,[])
    assert.throws(()=>r.engine.completeTask({taskId:task.id,summary:"done",verification:{passed:true}}),/unknown/)
    r.control.observe({...observation,id:randomUUID()},policy,["critical"])
    assert.throws(()=>r.engine.completeTask({taskId:task.id,summary:"done",verification:{passed:true}}),/critical invariant/)
    r.control.observe({...observation,id:randomUUID()},policy,[])
    r.engine.completeTask({taskId:task.id,summary:"done",verification:{passed:true}})
    assert.equal(r.engine.evaluateCompletion(task.id).complete,true)
    assert.throws(()=>r.control.pinExpectation({...expectation,version:2},policy),/before execution/)
    r.engine.atomic(()=>r.engine.signals.invalidate(task.id,"new input"))
    assert.throws(()=>r.control.observe({...observation,id:randomUUID()},policy,[]),/current expectation-bound attempt/)
    assert.equal(r.engine.evaluateCompletion(task.id).complete,false)
  } finally {r.close()}
})

test("native 입력 변경은 live 허가를 fence하고 실제 종료 전에는 예약을 유지한다",async()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const task=r.engine.createTask({title:"worker",goal:"worker"})
    const scheduler=new TaskScheduler(r.engine),worker="session-native"
    scheduler.claim(task.id,{agent:"native",sessionId:worker})
    const issued=grant(r,task.id,worker)
    r.control.admission.claim(issued.id,{worker,specHash:issued.specHash,inputVector:issued.inputVector,graphHash:issued.graphHash,generation:issued.generation,now:Date.now()})
    const authority=new GuardAuthority(r.store.control)
    authority.bind(worker,issued.id)
    await authority.authorize(worker,{kind:"model"})
    assert.throws(()=>r.engine.atomic(()=>{r.engine.signals.invalidate(task.id,"rollback");throw new Error("abort")}))
    await authority.authorize(worker,{kind:"model"})
    r.engine.atomic(()=>r.engine.signals.invalidate(task.id,"dependency changed"))
    await assert.rejects(authority.authorize(worker,{kind:"model"}),/fenced/)
    assert.equal(r.store.db.prepare("SELECT state FROM agent_runs WHERE grant_id=?").get(issued.id)?.state,"fenced")
    assert.equal(scheduler.status().active.length,1)
    assert.equal(r.store.db.prepare("SELECT state FROM budget_reservations WHERE id=?").get(issued.id)?.state,"reserved")
    const stop=r.engine.signals.stops()[0]!
    r.engine.signals.stopped(stop.id,stop.token,"adapter confirmed termination")
    assert.equal(scheduler.status().active.length,0)
  } finally {r.close()}
})

test("계획 fence는 미사용 허가 예산을 반환하며 재시작 뒤에도 소비를 거절한다",()=>{
  const dir=mkdtempSync(join(tmpdir(),"control-live-")),db=join(dir,"graph.db")
  let r=createGraphRuntime(db)
  try {
    const task=r.engine.createTask({title:"pod",goal:"pod"}),issued=grant(r,task.id,"pod-uid")
    const planId=randomUUID(),now=new Date().toISOString()
    r.engine.atomic(()=>{
      r.store.insertWorkPlan({id:planId,title:"plan",goal:"plan",requestText:"plan",state:"awaiting_approval",currentRevision:1,createdAt:now,updatedAt:now})
      r.store.setTaskVisibility(task.id,planId,true,true)
    })
    assert.equal(r.store.db.prepare("SELECT spent FROM budget_reservations WHERE id=?").get(issued.id)?.spent,0)
    r.close();r=createGraphRuntime(db)
    assert.throws(()=>r.control.admission.claim(issued.id,{worker:"pod-uid",specHash:issued.specHash,inputVector:[],graphHash:issued.graphHash,generation:1,now:Date.now()}),/fenced/)
    assert.equal(r.store.db.prepare("SELECT eligible FROM control_ready WHERE task_id=?").get(task.id)?.eligible,0)
  } finally {r.close();rmSync(dir,{recursive:true,force:true})}
})

test("통합 보고와 cached run은 미해결 통합 의무를 우회할 수 없다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const root=r.engine.createTask({title:"root",goal:"root"})
    const children=r.engine.proposeDecomposition({taskId:root.id,children:[{title:"a",goal:"a"},{title:"b",goal:"b"}]}).children
    for(const [index,child] of children.entries()) {
      r.engine.startTask(child.id)
      r.engine.publishArtifact({taskId:child.id,name:`artifact-${index}`,type:"code",contentRef:`git://value-${index}`})
      r.engine.completeTask({taskId:child.id,summary:"done",verification:{passed:true}})
    }
    const set=r.integration.proposeIntegration({integrationSets:[{name:"combined",parentTaskId:root.id,members:["artifact-0","artifact-1"],scenarios:[{name:"behavior",expectedBehavior:["works"]}]}]}).sets[0]!
    const run=r.integration.startRun(set.id)
    const pending=obligation(r,set.id)
    const report={scenarios:run.scenarios.map(s=>({scenarioId:s.id,status:"passed" as const}))}
    assert.throws(()=>r.integration.reportRun(run.run.id,report),/obligations unresolved/)
    assert.equal(r.store.findIntegrationRun(run.run.id)?.status,"running")
    assert.equal(r.store.findIntegrationSet(set.id)?.outputBundleRef,undefined)
    r.control.evidence.resolve(pending.id,[evidence(r,{passed:true})])
    assert.ok(r.integration.reportRun(run.run.id,report).bundle)
    const second=r.control.evidence.createObligation({entityId:set.id,tuple:[],kind:"resource-contention",mandatory:true,validators:["runtime/v1"],reason:[evidence(r,{changed:true})]})
    assert.ok(second)
    assert.throws(()=>r.integration.startRun(set.id),/obligations unresolved/)
    assert.equal(r.engine.evaluateCompletion(root.id).complete,false)
  } finally {r.close()}
})

test("증거 만료 후 verified producer의 후속 작업도 다시 대기한다",(t)=>{
  const r=createGraphRuntime(":memory:")
  try {
    const producer=r.engine.createTask({title:"producer",goal:"producer"})
    const consumer=r.engine.createTask({title:"consumer",goal:"consumer",dependencies:[producer.id]})
    const pending=obligation(r,producer.id),expiresAt=Date.now()+10000
    r.control.evidence.resolve(pending.id,[evidence(r,{passed:true},[],"runtime/v1",expiresAt)])
    r.engine.startTask(producer.id)
    r.engine.completeTask({taskId:producer.id,summary:"done",verification:{passed:true}})
    assert.ok(r.engine.resolveRunnable().some(row=>row.task.id===consumer.id))
    t.mock.method(Date,"now",()=>expiresAt+1)
    assert.equal(r.engine.resolveRunnable().some(row=>row.task.id===consumer.id),false)
    assert.throws(()=>r.engine.startTask(consumer.id),/not ready/)
    assert.equal(r.control.status(producer.id).unresolved.length,1)
  } finally {r.close()}
})

test("동일 관찰 재전송은 이후 critical 상태를 이전 성공으로 되돌리지 않는다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const task=r.engine.createTask({title:"observe",goal:"observe"})
    r.control.pinExpectation({id:task.id,version:1,taskId:task.id,specHash:r.engine.signals.capture(task.id).specHash,expectedArtifacts:{},expectedInterface:{},expectedBehavior:{works:true},expectedDependencies:{},expectedGoals:{},expectedRisk:0,evidence:[evidence(r,{goal:"observe"})]},policy)
    r.engine.startTask(task.id)
    const inputVector=attemptInputVector(r.engine,task.id)
    const observation={id:randomUUID(),version:1,taskId:task.id,expectation:{id:task.id,version:1},state:semantic,inputVector,evidence:[evidence(r,{state:semantic},inputVector)]}
    r.control.observe(observation,policy,[])
    r.control.observe({...observation,id:randomUUID()},policy,["critical"])
    r.control.observe(observation,policy,[])
    assert.throws(()=>r.engine.completeTask({taskId:task.id,summary:"done",verification:{passed:true}}),/critical invariant/)
  } finally {r.close()}
})
