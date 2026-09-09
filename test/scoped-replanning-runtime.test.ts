import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { PlanNode } from "#task-domain"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { validateScopedPatch,type ReplanPatch } from "../packages/task-causality/src/replan.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { CognitiveGateway } from "../packages/task-control/src/gateway.ts"
import { GuardAuthority } from "../packages/task-control/src/guard-authority.ts"
import { grantHooks } from "../packages/opencode-harness/src/grant-hooks.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"

const node=(id:string):PlanNode=>({nodeId:id,label:id,stage:"implementation",outcome:`produce ${id}`,dependsOnNodeIds:[],taskSpec:{goal:`implement ${id}`,writeScopes:[id],acceptanceCriteria:["tested"]}})
function fixture(database=":memory:") {
  const r=createGraphRuntime(database),nodes=[node("a"),node("b")]
  const {planId}=r.engine.createDraftPlan({title:"Plan",goal:"Deliver",requestText:"build",summary:"initial",nodes})
  r.engine.approveWorkPlan({planId,version:1,approvalSource:"user"})
  const content={request:"change a"}
  const reason=r.control.evidence.put({id:"change",version:1,type:"user",source:"test input",confidence:1,timestamp:Date.now(),contentHash:digest(content),content,inputVector:[],producer:"fixture",validatorVersion:"user/v1",expiresAt:null})
  const issue=()=>r.control.replanning.issue({planId,boundary:["a"],changedNodes:["a"],invalidatedNodes:["a"],preservedNodes:["b"],immutableDecisions:[],invalidAssumptions:[],predictionErrors:[],violatedInvariants:["request changed"],evidence:[reason],expiresAt:Date.now()+60000,validators:["coverage/v1"]})
  const spec={...nodes[0]!,outcome:"updated a",taskSpec:{...nodes[0]!.taskSpec,goal:"update a"}}
  const patch:ReplanPatch={revisedTasks:[{id:"a",dependencies:[],objective:spec.taskSpec.goal,expectedOutcome:spec.outcome,decisionRefs:[]}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[],invalidatedAssumptions:[],expectedOutcomes:[{taskId:"a",value:spec.outcome}],confidence:.8}
  const satisfy=(obligationId:string)=>{
    const obligation=r.control.evidence.obligation(obligationId)!,content={passed:true}
    const ref=r.control.evidence.put({id:obligationId,version:1,type:"test",source:"scoped revision acceptance fixture",confidence:1,timestamp:Date.now(),contentHash:digest(content),content,inputVector:obligation.tuple,producer:"test runner",validatorVersion:"coverage/v1",expiresAt:null})
    r.control.evidence.resolve(obligationId,[ref])
  }
  return {r,nodes,planId,issue,spec,patch,satisfy}
}

test("임시 patch는 실제 revision을 노출하지 않고 검증 후 한 번만 커밋하며 무관한 worker를 보존한다",()=>{
  const f=fixture(),{r}=f
  try {
    const b=r.store.planLinks(f.planId,1).find(n=>n.nodeId==="b")!.taskId
    const attempt=r.engine.startTask(b,{agent:"native",sessionId:"keep"})
    const lease=f.issue(),staged=r.control.replanning.stage(lease.id,f.patch,[f.spec],"update a")
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.equal(r.store.findPlanRevision(f.planId,2),undefined)
    assert.throws(()=>r.control.replanning.commit(staged.id),/pending or expired/)
    assert.throws(()=>r.engine.reviseWorkPlan({planId:f.planId,baseVersion:1,nodes:f.nodes,summary:"bypass"}),/validated scoped commit/)
    f.satisfy(staged.obligationId)
    const result=r.control.replanning.commit(staged.id)
    assert.equal(result.revision.version,2)
    assert.deepEqual(r.control.replanning.commit(staged.id),result)
    assert.equal(digest(r.store.planNodes(f.planId,2).find(n=>n.nodeId==="b")),digest(f.nodes[1]))
    const activated=r.engine.approveWorkPlan({planId:f.planId,version:2,approvalSource:"user"})
    assert.equal(activated.transition!.state,"applied")
    assert.equal(r.store.planLinks(f.planId,2).find(n=>n.nodeId==="b")!.taskId,b)
    assert.equal(r.engine.requireTask(b).attemptToken,attempt.attemptToken)
    assert.equal(r.engine.requireTask(b).status,"running")
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM event_outbox WHERE type='ScopedReplanCommitted'").get()!.n,1)
  } finally {r.close()}
})

test("범위 밖 spec·암묵적 dependency 변경과 expectation 불일치는 저장 전에 거절한다",()=>{
  const f=fixture(),{r}=f
  try {
    const lease=f.issue()
    assert.throws(()=>r.control.replanning.stage(lease.id,f.patch,[f.spec,f.nodes[1]!],"escape"),/exactly the changed/)
    assert.throws(()=>r.control.replanning.stage(lease.id,f.patch,[{...f.spec,outcome:"wrong"}],"mismatch"),/differs/)
    const edgeOnly={...f.patch,revisedTasks:[],expectedOutcomes:[],newDependencies:[{from:"a",to:"a"}]}
    assert.throws(()=>r.control.replanning.stage(lease.id,edgeOnly,[],"implicit"),/explicit revised task/)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM validation_obligations").get()!.n,0)
    assert.equal(r.store.db.prepare("SELECT state FROM scoped_replan_stages WHERE id=?").get(lease.id)!.state,"lease")
    const newNode={id:"proposal:child",parent:"a",dependencies:["b"],objective:"child",expectedOutcome:"child",decisionRefs:[]}
    const expansion={...f.patch,revisedTasks:[],newTasks:[newNode],expectedOutcomes:[{taskId:newNode.id,value:"child"}]}
    const current={revision:1,graphHash:lease.graphHash,generation:lease.generation,nodes:f.nodes.map(n=>({id:n.nodeId,dependencies:[],objective:n.taskSpec.goal,expectedOutcome:n.outcome,decisionRefs:[]})),now:Date.now(),validEvidence:()=>true}
    assert.throws(()=>validateScopedPatch(lease,expansion,current),/external read/)
    assert.throws(()=>validateScopedPatch({...lease,boundary:["a","b"]},{...expansion,newTasks:[{...newNode,parent:"b",dependencies:[]}]},current),/mutable parent/)
  } finally {r.close()}
})

test("새 generation과 변경된 입력은 검증된 과거 patch의 커밋도 차단한다",()=>{
  const f=fixture(),{r}=f
  try {
    const staged=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"old")
    f.satisfy(staged.obligationId)
    const lease=f.issue()
    assert.throws(()=>r.control.replanning.commit(staged.id),/fenced/)
    const next=r.control.replanning.stage(lease.id,f.patch,[f.spec],"new")
    f.satisfy(next.obligationId)
    const a=r.store.planLinks(f.planId,1).find(n=>n.nodeId==="a")!.taskId
    r.engine.addRequirement(a,"new explicit constraint","constraint")
    assert.throws(()=>r.control.replanning.commit(next.id),/inputs changed/)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
  } finally {r.close()}
})

test("재시작 후 staged revision과 검증 대기를 복구하며 실패한 커밋은 원자적으로 롤백한다",()=>{
  const dir=mkdtempSync(join(tmpdir(),"scoped-replan-")),database=join(dir,"graph.db"),f=fixture(database)
  let r=f.r
  try {
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"durable")
    f.satisfy(stage.obligationId)
    r.close();r=createGraphRuntime(database)
    r.store.db.exec("CREATE TRIGGER reject_scoped_commit BEFORE INSERT ON event_outbox WHEN NEW.type='ScopedReplanCommitted' BEGIN SELECT RAISE(ABORT,'commit fault'); END")
    assert.throws(()=>r.control.replanning.commit(stage.id),/commit fault/)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.equal(r.store.db.prepare("SELECT state FROM scoped_replan_stages WHERE id=?").get(stage.id)!.state,"staged")
    r.store.db.exec("DROP TRIGGER reject_scoped_commit")
    assert.equal(r.control.replanning.commit(stage.id).revision.version,2)
  } finally {r.close();rmSync(dir,{recursive:true,force:true})}
})

test("인지 역할은 adapter가 고정한 lease로만 patch를 제안하며 계획 커밋 권한을 얻지 않는다",async()=>{
  const f=fixture(),{r}=f
  try {
    const lease=f.issue(),taskId=r.store.findWorkPlan(f.planId)!.rootTaskId!,tool="task_graph_cognitive_replan_stage"
    const role:RoleVersion={id:"replanner",version:1,name:"Replanner",purpose:"Scoped repair",capabilities:[],prompt:"Propose the scoped patch",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:10000,maxDependencyDepth:1,maxEvidenceItems:2,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:["coverage/v1"],allowedTools:[tool],lifecycle:"temporary",evidence:[]}
    r.store.control.put("role_versions",role.id,1,role)
    const context=budgetContext({taskId,role,policy:{id:"test",version:1},items:[],scaffold:role.prompt,outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
    r.store.control.put("context_manifests",context.id,1,context)
    const decision=r.control.admission.record(activation({taskId,eventId:"change",eligible:true,role,policy:{id:"test",version:1},signals:{...Object.fromEntries(FEATURES.map(f=>[f,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
    const snapshot=r.engine.signals.capture(taskId)
    const grant=r.control.admission.issue({taskId,decisionId:decision.id,specHash:snapshot.specHash,inputVector:[{entityId:taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:{id:"test",version:1},context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"bounded",level:3,provider:"test",model:"test",maxInputTokens:20000,maxOutputTokens:1000,maxToolCalls:2,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},writeScopes:[],allowedTools:[tool],obligations:[],expiresAt:lease.expiresAt,generation:lease.generation,replanLease:{id:lease.id,version:lease.generation}},"test",21000)
    r.control.admission.claim(grant.id,{worker:"session",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
    const authority=new GuardAuthority(r.store.control);authority.bind("session",grant.id)
    const hooks=grantHooks(authority),gateway=new CognitiveGateway(r.engine,process.cwd())
    const call={args:{patch:f.patch,specifications:[f.spec],summary:"scoped"} as Record<string,unknown>}
    await hooks["tool.execute.before"]({sessionID:"session",tool,callID:"propose"},call)
    const staged=gateway.execute("cognitive_replan_stage",call.args) as {id:string}
    assert.deepEqual(gateway.execute("cognitive_replan_stage",call.args),staged)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.throws(()=>r.control.replanning.commit(staged.id),/pending/)
    await assert.rejects(hooks["tool.execute.before"]({sessionID:"session",tool:"task_graph_work_plan_approve",callID:"approve"},{args:{}}),/not granted/)
  } finally {r.close()}
})

test("인지 전용 MCP는 raw graph와 Pod 도구를 광고하거나 실행하지 않는다",async()=>{
  const {createGraphMcp}=await import("../packages/opencode-harness/src/graph-mcp.ts")
  const r=createGraphMcp(":memory:")
  try {
    await r.server.handle({jsonrpc:"2.0",id:0,method:"initialize"})
    await r.server.handle({jsonrpc:"2.0",method:"notifications/initialized"})
    const listed=await r.server.handle({jsonrpc:"2.0",id:1,method:"tools/list"}) as {result:{tools:Array<{name:string}>}}
    assert.ok(listed.result.tools.length>0)
    assert.ok(listed.result.tools.every(t=>t.name.startsWith("cognitive_")))
    for(const name of ["task_create","task_start","work_plan_revise","task_instance_create"]) {
      const response=await r.server.handle({jsonrpc:"2.0",id:2,method:"tools/call",params:{name,arguments:{operationId:name,title:"forged",goal:"forged"}}})
      assert.match(JSON.stringify(response),/error|isError/)
    }
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM tasks").get()!.n,0)
  } finally {r.close()}
})
