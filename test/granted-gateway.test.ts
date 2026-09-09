import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { GuardAuthority } from "../packages/task-control/src/guard-authority.ts"
import { AuthorityHttpClient,AuthorityHttpServer } from "../packages/task-control/src/authority-http.ts"
import { CognitiveGateway } from "../packages/task-control/src/gateway.ts"
import { grantHooks } from "../packages/opencode-harness/src/grant-hooks.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"

function setup() {
  const workspace=mkdtempSync(join(tmpdir(),"granted-gateway-")),r=createGraphRuntime(join(workspace,"graph.db"))
  const task=r.engine.createTask({title:"edit",goal:"edit",writeScopes:["a.txt"]}),worker="native-session"
  new TaskScheduler(r.engine,1,workspace).claim(task.id,{agent:"native",sessionId:worker})
  const tools=["task_graph_cognitive_read","task_graph_cognitive_write","task_graph_cognitive_context"]
  const role:RoleVersion={id:"editor",version:1,name:"Editor",purpose:"edit",capabilities:[],prompt:"Edit only granted files",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:20000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:tools,lifecycle:"persistent",evidence:[]}
  r.store.control.put("role_versions",role.id,1,role)
  const context=budgetContext({taskId:task.id,role,policy:{id:"p",version:1},items:[],scaffold:role.prompt,outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
  r.store.control.put("context_manifests",context.id,1,context)
  const decision=r.control.admission.record(activation({taskId:task.id,eventId:"change",eligible:true,role,policy:{id:"p",version:1},signals:{...Object.fromEntries(FEATURES.map(f=>[f,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
  const grant=r.control.admission.issue({taskId:task.id,decisionId:decision.id,specHash:r.engine.signals.capture(task.id).specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:{id:"p",version:1},context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"test",level:3,provider:"test",model:"bounded",maxInputTokens:10000,maxOutputTokens:10000,maxToolCalls:20,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},readScopes:["a.txt","alias.txt"],writeScopes:["a.txt"],allowedTools:tools,obligations:[],expiresAt:Date.now()+60000,generation:1,executionMode:"task"},"account",100000)
  r.control.admission.claim(grant.id,{worker,specHash:grant.specHash,inputVector:[],graphHash:grant.graphHash,generation:1,now:Date.now()})
  const authority=new GuardAuthority(r.store.control);authority.bind(worker,grant.id)
  const gateway=new CognitiveGateway(r.engine,workspace)
  writeFileSync(join(workspace,"a.txt"),"before")
  return {r,workspace,task,worker,grant,authority,gateway,close:()=>{r.close();rmSync(workspace,{recursive:true,force:true})}}
}

test("인증된 adapter만 허가를 조회하며 자식·타 세션은 비용을 소비할 수 없다",async()=>{
  const f=setup(),rpc=new AuthorityHttpServer(f.authority)
  try {
    await rpc.listen()
    const binding=rpc.register(f.worker),client=new AuthorityHttpClient(binding)
    assert.equal((await client.authorize(f.worker,{kind:"model"})).grant.id,f.grant.id)
    await assert.rejects(client.authorize("child",{kind:"model"}),/capability/)
    const rejected=await fetch(new URL("/authorize",binding.url),{method:"POST",body:JSON.stringify({sessionId:f.worker,operation:{kind:"model"}})})
    assert.equal(rejected.status,401)
    rpc.revoke(binding)
    await assert.rejects(client.authorize(f.worker,{kind:"model"}),/Unauthorized/)
  } finally {await rpc.close();f.close()}
})

test("실제 hook→authority→gateway에서 인자 위조·경로 탈출·symlink·raw graph를 차단한다",async()=>{
  const f=setup(),rpc=new AuthorityHttpServer(f.authority)
  try {
    await rpc.listen()
    const hooks=grantHooks(new AuthorityHttpClient(rpc.register(f.worker)))
    const request={args:{path:"a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"read"},request)
    assert.equal((f.gateway.execute("cognitive_read",request.args) as {content:string}).content,"before")
    assert.throws(()=>f.gateway.execute("cognitive_read",{...request.args,path:"graph.db"}),/not admitted/)
    await assert.rejects(hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_task_create",callID:"raw"},{args:{}}),/not granted/)
    symlinkSync("a.txt",join(f.workspace,"alias.txt"))
    const alias={args:{path:"alias.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"alias"},alias)
    assert.throws(()=>f.gateway.execute("cognitive_read",alias.args),/Aliased/)
    const escape={args:{path:"../a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"escape"},escape)
    assert.throws(()=>f.gateway.execute("cognitive_read",escape.args),/outside/)
    f.r.engine.atomic(()=>f.r.engine.signals.invalidate(f.task.id,"changed"))
    assert.throws(()=>f.gateway.execute("cognitive_read",request.args),/live activation/)
  } finally {await rpc.close();f.close()}
})

test("파일 교체는 실제 reservation과 CAS를 강제하고 재전송은 쓰기를 반복하지 않는다",async()=>{
  const f=setup()
  try {
    const hooks=grantHooks(f.authority),request={args:{path:"a.txt",content:"after",previousHash:digest("before")} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_write",callID:"write"},request)
    const result=f.gateway.execute("cognitive_write",request.args)
    assert.equal(readFileSync(join(f.workspace,"a.txt"),"utf8"),"after")
    assert.deepEqual(f.gateway.execute("cognitive_write",request.args),result)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM event_outbox WHERE type='CognitiveFileWritten'").get()!.n,1)
    const stale={args:{path:"a.txt",content:"new",previousHash:digest("before")} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_write",callID:"stale"},stale)
    assert.throws(()=>f.gateway.execute("cognitive_write",stale.args),/changed since/)
    assert.equal(readFileSync(join(f.workspace,"a.txt"),"utf8"),"after")
  } finally {f.close()}
})

test("메시지·시스템·도구 정의의 합산 예산과 이전 호출의 사용량 영수증을 강제한다",async()=>{
  const f=setup()
  try {
    await assert.rejects(f.authority.authorize(f.worker,{kind:"model",reserveModel:true}),/must be measured/)
    await f.authority.authorize(f.worker,{kind:"model",inputBytes:9500})
    await f.authority.authorize(f.worker,{kind:"model",systemBytes:500})
    await assert.rejects(f.authority.authorize(f.worker,{kind:"model",reserveModel:true}),/Complete context exceeds/)
    await f.authority.authorize(f.worker,{kind:"model",inputBytes:100})
    await f.authority.authorize(f.worker,{kind:"model",reserveModel:true})
    await assert.rejects(f.authority.authorize(f.worker,{kind:"model",reserveModel:true}),/no usage receipt/)
    await f.authority.recordModel(f.worker,"step-1",{inputTokens:1000,outputTokens:10})
    await f.authority.recordModel(f.worker,"step-1",{inputTokens:1000,outputTokens:10})
    await assert.rejects(f.authority.authorize(f.worker,{kind:"model",reserveModel:true}),/must be measured/)
    await f.authority.authorize(f.worker,{kind:"model",inputBytes:100})
    const next=await f.authority.authorize(f.worker,{kind:"model",reserveModel:true})
    assert.equal(next.remainingInputTokens,9000)
    assert.equal(next.remainingOutputTokens,9990)
  } finally {f.close()}
})

test("provider의 실제 예산 초과는 영수증을 보존하며 후속 도구와 모델을 차단한다",async()=>{
  const f=setup()
  try {
    await f.authority.recordModel(f.worker,"overrun",{inputTokens:10001,outputTokens:1})
    await f.authority.recordModel(f.worker,"overrun",{inputTokens:10001,outputTokens:1})
    assert.equal(f.r.store.db.prepare("SELECT input_used FROM grant_sessions WHERE session_id=?").get(f.worker)!.input_used,10001)
    assert.equal(f.r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(f.grant.id)!.state,"fenced")
    assert.equal(f.r.store.db.prepare("SELECT state FROM agent_runs WHERE grant_id=?").get(f.grant.id)!.state,"fenced")
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM event_outbox WHERE type='ModelBudgetExceeded'").get()!.n,1)
    await assert.rejects(f.authority.authorize(f.worker,{kind:"model"}),/fenced/)
    await assert.rejects(f.authority.authorize(f.worker,{kind:"tool",tool:"task_graph_cognitive_read",callId:"late"}),/fenced/)
    assert.equal(f.r.store.db.prepare("SELECT state FROM budget_reservations WHERE id=?").get(f.grant.id)!.state,"reserved")
  } finally {f.close()}
})

test("실제 gateway 읽기는 파일 버전과 소비 포트를 고정하고 채택된 결과만 인과 관계로 투영한다",async()=>{
  const f=setup()
  try {
    const hooks=grantHooks(f.authority)
    const read=async(callID:string)=>{
      const request={args:{path:"a.txt"} as Record<string,unknown>}
      await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID},request)
      return f.gateway.execute("cognitive_read",request.args)
    }
    const first=await read("observed-first")
    writeFileSync(join(f.workspace,"a.txt"),"externally changed")
    assert.deepEqual(await read("observed-first"),first)
    await read("observed-second")
    assert.equal(f.r.store.db.prepare("SELECT count(*) n FROM observed_file_versions").get()!.n,2)
    assert.equal(f.r.store.db.prepare("SELECT count(*) n FROM observed_file_reads").get()!.n,2)
    assert.equal(f.r.control.graph.incoming(f.task.id).filter(edge=>edge.source.port==="content").length,0)
    f.r.control.admission.submit(f.grant.id,f.worker,{taskId:f.task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:10,outputTokens:10,toolCalls:2,elapsedMs:1})
    const edges=f.r.control.graph.incoming(f.task.id).filter(edge=>edge.source.port==="content")
    assert.equal(edges.length,1)
    assert.equal(edges[0]!.completeness,"observed")
    assert.equal(edges[0]!.source.view,"utf8-exact")
    const proofs=edges[0]!.evidence.map(ref=>f.r.control.evidence.require(ref))
    assert.deepEqual(proofs.map(proof=>proof.inputVector[0]!.hash),[digest("before"),digest("externally changed")])
    for(let i=0;i<3;i++)f.r.engine.atomic(()=>f.r.control.files.ingest())
    assert.deepEqual(f.r.control.graph.incoming(f.task.id).filter(edge=>edge.source.port==="content"),edges)
    assert.throws(()=>f.r.control.files.read(f.grant,f.workspace,"a.txt",digest("before"),"late"),/live claimed grant/)
  }finally{f.close()}
})


test("native 결과 채택 직전 읽은 파일을 확인하며 자기 쓰기와 외부 변경을 구분한다",async()=>{
  const f=setup()
  try {
    const hooks=grantHooks(f.authority)
    const read={args:{path:"a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"snapshot-read"},read)
    f.gateway.execute("cognitive_read",read.args)
    f.gateway.assertReadsCurrent(f.grant.id)
    writeFileSync(join(f.workspace,"a.txt"),"foreign")
    assert.throws(()=>f.gateway.assertReadsCurrent(f.grant.id),/changed before result/)
    writeFileSync(join(f.workspace,"a.txt"),"before")
    const write={args:{path:"a.txt",content:"own output",previousHash:digest("before")} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_write",callID:"snapshot-write"},write)
    f.gateway.execute("cognitive_write",write.args)
    f.gateway.assertReadsCurrent(f.grant.id)
    writeFileSync(join(f.workspace,"a.txt"),"foreign after own write")
    assert.throws(()=>f.gateway.assertReadsCurrent(f.grant.id),/changed before result/)
  }finally{f.close()}
})


test("관찰된 입력 파일의 새 버전은 실제 이전 소비 task를 무효화한다",async()=>{
  const f=setup()
  try {
    const hooks=grantHooks(f.authority),read={args:{path:"a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"first-consumer"},read)
    f.gateway.execute("cognitive_read",read.args)
    f.r.control.admission.submit(f.grant.id,f.worker,{taskId:f.task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:10,outputTokens:10,toolCalls:1,elapsedMs:1})
    f.r.engine.completeTask({taskId:f.task.id,summary:"Consumed before"});new TaskScheduler(f.r.engine,1,f.workspace).release(f.task.id,true)
    const task=f.r.engine.createTask({title:"second reader",goal:"read",writeScopes:[]}),worker="second-reader"
    new TaskScheduler(f.r.engine,1,f.workspace).claim(task.id,{agent:"native",sessionId:worker})
    const role=f.r.store.control.get<RoleVersion>("role_versions",f.grant.role.id,1)!
    const context=budgetContext({taskId:task.id,role,policy:f.grant.policy,items:[],scaffold:role.prompt,outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
    f.r.store.control.put("context_manifests",context.id,1,context)
    const decision=f.r.control.admission.record({id:"second-reader",eventId:"second-reader",taskId:task.id,role:f.grant.role,policy:f.grant.policy,signals:Object.fromEntries(FEATURES.map(feature=>[feature,null])) as Signals,score:0,hard:[],action:"activate",reasons:["fixture read"],timestamp:Date.now()})
    const grant=f.r.control.admission.issue({...f.grant,taskId:task.id,decisionId:decision.id,specHash:f.r.engine.signals.capture(task.id).specHash,graphHash:f.r.control.graph.hash(),context:{id:context.id,version:1},contextHash:context.hash,writeScopes:[]},"account",100000)
    f.r.control.admission.claim(grant.id,{worker,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()});f.authority.bind(worker,grant.id)
    writeFileSync(join(f.workspace,"a.txt"),"new input")
    const second={args:{path:"a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:worker,tool:"task_graph_cognitive_read",callID:"second-consumer"},second)
    f.gateway.execute("cognitive_read",second.args)
    assert.equal(f.r.engine.requireTask(f.task.id).status,"stale")
    assert.equal(f.r.engine.requireTask(task.id).status,"running")
    assert.equal(f.r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='FileInputInvalidated'").get()!.n,1)
  }finally{f.close()}
})

for(const mutation of ["edit","delete","symlink","oversize"] as const)test(`새 모델 읽기 없이 실제 외부 파일 ${mutation}을 관찰하고 소비 task를 무효화한다`,async()=>{
  const f=setup()
  try {
    const hooks=grantHooks(f.authority),read={args:{path:"a.txt"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:f.worker,tool:"task_graph_cognitive_read",callID:"observed"},read)
    f.gateway.execute("cognitive_read",read.args)
    f.r.control.admission.submit(f.grant.id,f.worker,{taskId:f.task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:1,elapsedMs:1})
    f.r.engine.completeTask({taskId:f.task.id,summary:"accepted observation"});new TaskScheduler(f.r.engine,1,f.workspace).release(f.task.id,true)
    if(mutation==="delete"||mutation==="symlink")rmSync(join(f.workspace,"a.txt"))
    if(mutation==="symlink")symlinkSync("graph.db",join(f.workspace,"a.txt"))
    if(mutation==="edit"||mutation==="oversize")writeFileSync(join(f.workspace,"a.txt"),mutation==="edit"?"changed":"x".repeat(1000))
    assert.equal(f.r.control.files.refreshNative(f.workspace,{maxFiles:10,maxBytes:100}),1)
    assert.equal(f.r.engine.requireTask(f.task.id).status,"stale")
    assert.equal(f.r.control.files.refreshNative(f.workspace,{maxFiles:10,maxBytes:100}),0)
    const observed=JSON.parse(String(f.r.store.db.prepare("SELECT v.payload FROM observed_file_heads h JOIN observed_file_versions v ON v.id=h.id AND v.version=h.version").get()!.payload))
    assert.equal(observed.status,mutation==="edit"?"observed":mutation==="delete"?"missing":"unknown")
    assert.equal(f.r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1)
    assert.throws(()=>f.r.store.db.prepare("UPDATE observed_file_versions SET payload='{}'").run(),/Immutable/)
  }finally{f.close()}
})
