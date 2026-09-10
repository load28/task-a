import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { GrantDispatcher,type GrantedExecutor } from "../packages/task-control/src/dispatch.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { FEATURES,type ActivationGrant,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { HostService } from "../packages/host-integration/src/service.ts"
import type { HarnessServer } from "../packages/opencode-harness/src/server.ts"

function fixture(database=":memory:") {
  const r=createGraphRuntime(database)
  const role:RoleVersion={id:"reader",version:1,name:"Reader",purpose:"Inspect",capabilities:[],prompt:"Return structured findings",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[]}
  r.control.roleLifecycle.installConfigured(role,"grant dispatcher fixture")
  function issue() {
    const task=r.engine.createTask({title:"Inspect",goal:"Inspect",writeScopes:[]})
    const context=budgetContext({taskId:task.id,role,policy:{id:"p",version:1},items:[],scaffold:role.prompt,outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
    r.store.control.put("context_manifests",context.id,1,context)
    const decision=r.control.admission.record(activation({taskId:task.id,eventId:task.id,eligible:true,role,policy:{id:"p",version:1},signals:{...Object.fromEntries(FEATURES.map(f=>[f,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
    const snapshot=r.engine.signals.capture(task.id)
    return r.control.admission.issue({taskId:task.id,decisionId:decision.id,specHash:snapshot.specHash,inputVector:[{entityId:task.id,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:{id:"p",version:1},context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"test",level:3,provider:"test",model:"test",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+60000,generation:1},"test",100000)
  }
  return {r,issue}
}
function claim(r:ReturnType<typeof createGraphRuntime>,grant:ActivationGrant) {
  assert.equal(r.store.db.prepare("SELECT state FROM agent_runs WHERE grant_id=?").get(grant.id)!.state,"candidate")
  r.control.admission.claim(grant.id,{worker:`worker-${grant.id}`,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
  assert.equal(r.store.db.prepare("SELECT state FROM agent_runs WHERE grant_id=?").get(grant.id)!.state,"active")
}
function adapter(r:ReturnType<typeof createGraphRuntime>,wait:()=>Promise<void>=async()=>{}) {
  const calls:string[]=[],stops:string[]=[]
  const executor:GrantedExecutor={
    async execute(id) {
      calls.push(id)
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
      claim(r,grant);await wait()
      r.control.admission.submit(id,`worker-${id}`,{taskId:grant.taskId,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
    },
    async stop(id){stops.push(id);return {stopped:true,evidence:"test adapter acknowledged stop"}},
    async close(){},
  }
  return {executor,calls,stops}
}

test("기본 준비 task는 모델을 깨우지 않고 발급된 grant만 용량 안에서 한 번 전달한다",async()=>{
  const f=fixture(),a=adapter(f.r),d=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    f.r.engine.createTask({title:"Dormant",goal:"Dormant"});d.tick();await d.settle();assert.equal(a.calls.length,0)
    const first=f.issue(),second=f.issue()
    d.tick();d.tick();await d.settle()
    assert.deepEqual(a.calls,[first.id])
    d.tick();await d.settle();d.tick();await d.settle()
    assert.deepEqual(a.calls,[first.id,second.id])
    assert.ok(d.status().every(row=>row.state==="completed"))
  } finally {await d.close();f.r.close()}
})

test("경쟁하는 dispatcher도 이미 전달 중인 grant를 중복 호출하지 않는다",async()=>{
  const f=fixture();let finish!:()=>void
  const wait=new Promise<void>(resolve=>{finish=resolve}),a=adapter(f.r,()=>wait)
  const first=new GrantDispatcher(f.r.control,a.executor,1),second=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    const grant=f.issue();first.tick();second.tick();assert.equal(a.calls.length,1)
    await second.recover()
    assert.equal(f.r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)!.state,"claimed")
    assert.equal(a.stops.length,0)
    finish();await first.settle();second.tick();assert.equal(a.calls.length,1)
  } finally {finish();await first.close();await second.close();f.r.close()}
})

test("수신 불명 실행은 재호출하지 않으며 실제 종료 확인 전까지 stopping과 예산 예약을 유지한다",async()=>{
  const f=fixture(),a=adapter(f.r),d=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    const grant=f.issue();claim(f.r,grant)
    f.r.store.db.prepare("INSERT INTO grant_dispatches VALUES(?,'dispatching','prior-process','{}')").run(grant.id)
    a.executor.stop=async()=>({stopped:false,evidence:"unavailable"})
    await d.recover();d.tick()
    assert.equal(a.calls.length,0);assert.equal(d.status()[0]!.state,"stopping")
    assert.equal(f.r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)!.state,"fenced")
    assert.equal(f.r.store.db.prepare("SELECT state FROM budget_reservations WHERE id=?").get(grant.id)!.state,"reserved")
    a.executor.stop=async()=>({stopped:true,evidence:"acknowledged"})
    await d.recover();assert.equal(d.status()[0]!.state,"failed")
    const receipt=d.status()[0]!.payload as {startedAt?:number;transitions:Array<{from:string;to:string;at:number}>}
    assert.ok(receipt.transitions.some(item=>item.to==="stopping"))
    assert.ok(receipt.transitions.some(item=>item.from==="stopping"&&item.to==="failed"))
    assert.equal(f.r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='GrantDispatchTransition'").get()!.n,2)
    d.tick();await d.settle();assert.equal(a.calls.length,0)
  } finally {await d.close();f.r.close()}
})

test("사용량 결과 수락 후 전달 ACK만 유실되면 모델 재호출 없이 완료 영수증을 복구한다",async()=>{
  const f=fixture(),a=adapter(f.r),d=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    const grant=f.issue();d.tick();await d.settle()
    f.r.store.db.prepare("UPDATE grant_dispatches SET state='dispatching',owner='crashed' WHERE grant_id=?").run(grant.id)
    await d.recover();d.tick();await d.settle()
    assert.equal(a.calls.length,1);assert.equal(d.status()[0]!.state,"completed")
  } finally {await d.close();f.r.close()}
})

test("실행 도중 취소는 먼저 grant를 fence하고 늦은 결과가 취소 상태를 덮어쓰지 못한다",async()=>{
  const f=fixture();let finish!:()=>void
  const gate=new Promise<void>(resolve=>{finish=resolve}),a=adapter(f.r,()=>gate),d=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    f.issue();d.tick();assert.equal((await d.stopAll()).stopped,true)
    finish();await d.settle();assert.equal(d.status()[0]!.state,"cancelled")
    assert.equal(a.stops.length,1)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM agent_runs WHERE state='completed'").get()!.n,0)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM operational_cost_measurements WHERE category='discardedWork'").get()!.n,1)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM grant_dispatch_transitions WHERE grant_id=?").get(d.status()[0]!.grantId)!.n,3)
  } finally {finish();await d.close();f.r.close()}
})

test("실제 HostService wake가 durable grant를 전용 executor에 전달한다",async()=>{
  const directory=mkdtempSync(join(tmpdir(),"host-dispatch-")),database=join(directory,"graph.db"),f=fixture(database)
  const grant=f.issue();f.r.close()
  const native:HarnessServer={prepare:async()=>{},createSession:async()=>"unused",submit:async()=>{throw new Error("Legacy manager must not receive grant dispatch")},hasMessage:async()=>false,inspect:async()=>({state:"waiting",text:"",questions:[],permissions:[],activity:[]}),reply:async()=>{},cancel:async()=>{},readiness:async()=>({}),close:async()=>{}}
  let observed:ReturnType<typeof adapter>|undefined
  const service=new HostService({version:1,directory,database,socket:join(directory,"host.sock"),workspaces:[{path:directory}],autoContinue:false,maxRuns:1,maxWorkers:1},native,(graph)=>{observed=adapter(graph);return observed.executor})
  try {
    service.store.register(directory);await service.wake();await new Promise(resolve=>setImmediate(resolve));await service.wake()
    assert.deepEqual(observed!.calls,[grant.id])
  } finally {await service.close();rmSync(directory,{recursive:true,force:true})}
})

test("더 새로운 입력으로 fence된 실행은 응답 대기 중에도 실제 중지를 확인한다",async()=>{
  const f=fixture();let finish!:()=>void
  const pending=new Promise<void>(resolve=>{finish=resolve}),a=adapter(f.r,()=>pending),d=new GrantDispatcher(f.r.control,a.executor,1)
  try {
    const grant=f.issue();d.tick()
    assert.equal(a.calls.length,1)
    f.r.engine.atomic(()=>f.r.control.admission.fence(grant.taskId))
    a.executor.stop=async()=>({stopped:false,evidence:"termination still pending"})
    await d.recover()
    assert.equal(d.status()[0]!.state,"stopping")
    d.tick();assert.equal(a.calls.length,1)
    a.executor.stop=async()=>{finish();return {stopped:true,evidence:"adapter observed termination"}}
    await d.recover();await d.settle()
    assert.equal(d.status()[0]!.state,"failed")
    assert.equal(f.r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)!.state,"fenced")
    assert.equal(f.r.store.db.prepare("SELECT state FROM budget_reservations WHERE id=?").get(grant.id)!.state,"reserved")
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM operational_cost_measurements WHERE grant_id=? AND category='discardedWork'").get(grant.id)!.n,1)
    d.tick();assert.equal(a.calls.length,1)
  }finally{finish();await d.close();f.r.close()}
})

test("실행기가 자체 fence 후 정리 중이면 복구가 실제 오류를 중단 오류로 덮지 않는다",async()=>{
  const f=fixture();let release!:()=>void
  const cleanup=new Promise<void>(resolve=>{release=resolve}),stops:string[]=[]
  const executor:GrantedExecutor={
    async execute(id) {
      const grant=JSON.parse(String(f.r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
      claim(f.r,grant)
      f.r.control.admission.fence(grant.taskId)
      queueMicrotask(release)
      await cleanup
      throw new Error("native model failure")
    },
    async stop(id){stops.push(id);return {stopped:true,evidence:"stopped"}},
    async close(){},
  }
  const d=new GrantDispatcher(f.r.control,executor,1)
  try {
    const grant=f.issue();d.tick();await d.recover();await d.settle();await d.recover()
    assert.equal(stops.length,1)
    assert.equal(d.status()[0]!.state,"failed")
    assert.equal((d.status()[0]!.payload as {error?:string}).error,"native model failure")
    assert.equal(f.r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)!.state,"fenced")
  } finally {release();await d.close();f.r.close()}
})
