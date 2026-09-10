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
  const authority=r.control.evidence.put({id:"validator-authority",version:1,type:"code",source:"registered coverage validator",confidence:1,timestamp:Date.now(),contentHash:digest({allow:"coverage"}),content:{allow:"coverage"},inputVector:[],producer:"fixture",validatorVersion:"authority/v1",expiresAt:null})
  r.control.validators.register({id:"coverage",version:1,command:[process.execPath,"-e",`const fs=require('node:fs'),input=JSON.parse(fs.readFileSync(0,'utf8')),p=input.evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;const a=p.revisionInput.nodes.find(n=>n.nodeId==='a'),b=p.revisionInput.nodes.find(n=>n.nodeId==='b'),prior=p.baseNodes.find(n=>n.nodeId==='b');process.exit(a.taskSpec.goal==='update a'&&a.outcome==='updated a'&&JSON.stringify(b)===JSON.stringify(prior)&&p.lease.boundary.length===1&&p.lease.boundary[0]==='a'?0:2)`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authority]})
  const satisfy=async(obligationId:string)=>{
    await r.control.validators.run(process.cwd(),{maxJobs:10,maxDurationMs:10000})
    assert.equal(r.control.evidence.independentlySatisfied(r.control.evidence.obligation(obligationId)!),true)
  }
  return {r,nodes,planId,issue,spec,patch,satisfy,authority,reason}
}

test("임시 patch는 실제 revision을 노출하지 않고 검증 후 한 번만 커밋하며 무관한 worker를 보존한다",async()=>{
  const f=fixture(),{r}=f
  try {
    const b=r.store.planLinks(f.planId,1).find(n=>n.nodeId==="b")!.taskId
    const attempt=r.engine.startTask(b,{agent:"native",sessionId:"keep"})
    const lease=f.issue(),staged=r.control.replanning.stage(lease.id,f.patch,[f.spec],"update a")
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.equal(r.store.findPlanRevision(f.planId,2),undefined)
    assert.throws(()=>r.control.replanning.commit(staged.id),/pending or expired/)
    assert.throws(()=>r.engine.reviseWorkPlan({planId:f.planId,baseVersion:1,nodes:f.nodes,summary:"bypass"}),/validated scoped commit/)
    await f.satisfy(staged.obligationId)
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

test("새 generation과 변경된 입력은 검증된 과거 patch의 커밋도 차단한다",async()=>{
  const f=fixture(),{r}=f
  try {
    const staged=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"old")
    await f.satisfy(staged.obligationId)
    const lease=f.issue()
    assert.throws(()=>r.control.replanning.commit(staged.id),/fenced/)
    const next=r.control.replanning.stage(lease.id,f.patch,[f.spec],"new")
    await f.satisfy(next.obligationId)
    const a=r.store.planLinks(f.planId,1).find(n=>n.nodeId==="a")!.taskId
    r.engine.addRequirement(a,"new explicit constraint","constraint")
    assert.throws(()=>r.control.replanning.commit(next.id),/inputs changed/)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
  } finally {r.close()}
})

test("재시작 후 staged revision과 검증 대기를 복구하며 실패한 커밋은 원자적으로 롤백한다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"scoped-replan-")),database=join(dir,"graph.db"),f=fixture(database)
  let r=f.r
  try {
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"durable")
    await f.satisfy(stage.obligationId)
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
    const role:RoleVersion={id:"replanner",version:1,name:"Replanner",purpose:"Scoped repair",capabilities:[],prompt:"Propose the scoped patch",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:10000,maxDependencyDepth:1,maxEvidenceItems:2,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:["coverage/v1"],allowedTools:[tool],lifecycle:"persistent",evidence:[]}
    r.control.roleLifecycle.installConfigured(role,"scoped replanning fixture")
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

for(const mode of ["fabricated","authority-withdrawn","receipt-withdrawn"] as const)test(`지역 계획 커밋은 현재 권한의 실제 독립 검증을 요구한다: ${mode}`,async()=>{
  const f=fixture(),{r}=f
  try {
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"validate current authority")
    const obligation=r.control.evidence.obligation(stage.obligationId)!
    if(mode==="fabricated") {
      const content={passed:true}
      const proof=r.control.evidence.put({id:"claimed-pass",version:1,type:"test",source:"claimed result",confidence:1,timestamp:Date.now(),contentHash:digest(content),content,inputVector:obligation.tuple,producer:"unexecuted validator",validatorVersion:"coverage/v1",expiresAt:null})
      r.control.evidence.resolve(obligation.id,[proof])
      assert.equal(r.control.evidence.satisfied(r.control.evidence.obligation(obligation.id)!),true)
    }else {
      await f.satisfy(obligation.id)
      r.control.evidence.retract(mode==="authority-withdrawn"?f.authority:r.control.evidence.obligation(obligation.id)!.evidence[0]!,[f.reason],"withdraw the validation authority or receipt")
    }
    assert.throws(()=>r.control.replanning.commit(stage.id),/pending or expired/)
    assert.equal(r.store.findWorkPlan(f.planId)!.currentRevision,1)
    assert.equal(r.store.findPlanRevision(f.planId,2),undefined)
    assert.equal(r.store.db.prepare("SELECT state FROM scoped_replan_stages WHERE id=?").get(stage.id)!.state,"staged")
  }finally{r.close()}
})

for(const mode of ["authority","receipt"] as const)test(`저장된 scoped revision도 승인 직전 검증 근거 철회를 재검사한다: ${mode}`,async()=>{
  const f=fixture(),{r}=f
  try {
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"commit before withdrawal")
    await f.satisfy(stage.obligationId)
    r.control.replanning.commit(stage.id)
    const ref=mode==="authority"?f.authority:r.control.evidence.obligation(stage.obligationId)!.evidence[0]!
    r.control.evidence.retract(ref,[f.reason],"withdraw before activating the committed revision")
    assert.throws(()=>r.engine.approveWorkPlan({planId:f.planId,version:2,approvalSource:"user"}),/Regional activation validation/)
    assert.equal(r.store.activePlanVersion(f.planId),1)
    assert.deepEqual(r.store.planLinks(f.planId,2),[])
    assert.equal(r.store.db.prepare("SELECT state FROM scoped_replan_stages WHERE id=?").get(stage.id)!.state,"committed","The immutable validated proposal remains historical evidence")
  }finally{r.close()}
})

test("worker 중단 대기 뒤의 scoped 활성화도 철회된 검증을 채택하지 않는다",async()=>{
  const f=fixture(),{r}=f
  try {
    const taskId=r.store.planLinks(f.planId,1).find(n=>n.nodeId==='a')!.taskId
    r.engine.startTask(taskId,{agent:"native",sessionId:"await-stop"})
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"wait for previous execution")
    await f.satisfy(stage.obligationId)
    r.control.replanning.commit(stage.id)
    const transition=r.engine.approveWorkPlan({planId:f.planId,version:2,approvalSource:"user"}).transition!
    assert.equal(transition.state,"waiting")
    r.control.evidence.retract(f.authority,[f.reason],"validator authority withdrawn while the previous worker terminates")
    const stop=transition.stops.find(stop=>stop.taskId===taskId)!
    r.engine.revisions.confirmStopped(transition.id,taskId,stop.token,"confirmed terminated")
    assert.throws(()=>r.engine.reconcilePlanTransition(transition.id),/Regional activation validation/)
    assert.equal(r.store.activePlanVersion(f.planId),1)
    assert.deepEqual(r.store.planLinks(f.planId,2),[])
    assert.equal(r.engine.revisions.transitions(f.planId).find(t=>t.id===transition.id)!.stops[0]!.state,"stopped")
  }finally{r.close()}
})

test("미활성 revision의 폐기와 중단 확인은 원자적으로 보존하며 head를 되감지 않는다",async()=>{
  const f=fixture(),{r}=f
  try {
    const taskId=r.store.planLinks(f.planId,1).find(n=>n.nodeId==='a')!.taskId
    r.engine.startTask(taskId,{agent:"native",sessionId:"retire-stop"})
    const stage=r.control.replanning.stage(f.issue().id,f.patch,[f.spec],"pending revision")
    await f.satisfy(stage.obligationId);r.control.replanning.commit(stage.id)
    const transition=r.engine.approveWorkPlan({planId:f.planId,version:2,approvalSource:"user"}).transition!
    assert.throws(()=>f.issue(),/settled active/)
    r.store.db.exec("CREATE TRIGGER reject_retirement BEFORE INSERT ON event_outbox WHEN NEW.type='PendingScopedRevisionSuperseded' BEGIN SELECT RAISE(ABORT,'retirement fault'); END")
    assert.throws(()=>r.control.replanning.supersedeCommitted(stage.id,[f.reason]),/retirement fault/)
    assert.equal(r.store.control.get("replan_supersessions",f.planId,2),undefined)
    assert.equal(r.store.findPlanRevision(f.planId,2)!.state,"approved")
    r.store.db.exec("DROP TRIGGER reject_retirement")
    r.control.replanning.supersedeCommitted(stage.id,[f.reason])
    r.control.replanning.supersedeCommitted(stage.id,[f.reason])
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='PendingScopedRevisionSuperseded'").get()!.n,1)
    assert.throws(()=>f.issue(),/confirmed execution stops/)
    assert.throws(()=>r.engine.approveWorkPlan({planId:f.planId,version:2,approvalSource:"user"}),/not awaiting approval/)
    for(const stop of transition.stops)r.engine.revisions.confirmStopped(transition.id,stop.taskId,stop.token,"fixture terminated")
    assert.equal(r.engine.reconcilePlanTransition(transition.id).activated,undefined)
    const lease=f.issue()
    assert.equal(lease.baseRevision,2);assert.equal(lease.sourceRevision,1)
    assert.equal(r.control.replanning.assertCurrent(lease.id).id,lease.id)
    const replacement=r.control.replanning.stage(lease.id,f.patch,[f.spec],"replacement after confirmed stop")
    await f.satisfy(replacement.obligationId)
    assert.equal(r.control.replanning.commit(replacement.id).revision.version,3)
    assert.equal(r.engine.approveWorkPlan({planId:f.planId,version:3,approvalSource:"user"}).transition!.state,"applied")
    assert.deepEqual(r.store.planLinks(f.planId,2),[])
    assert.equal(r.store.activePlanVersion(f.planId),3)
    assert.throws(()=>r.control.replanning.supersedeCommitted(replacement.id,[f.reason]),/Only a committed pending/)
  }finally{r.close()}
})
