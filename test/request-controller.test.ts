import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync,writeFileSync,readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { HostService } from "../packages/host-integration/src/service.ts"
import { ControlServer } from "../packages/host-integration/src/control-server.ts"
import { digest } from "../packages/task-control/src/value.ts"
import type { ControllerProgram, ProposedTask } from "../packages/task-control/src/requests.ts"
import type { ActivationGrant, RoleVersion, AgentOutput } from "../packages/task-cognition/src/model.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { withTaskAdmission } from "../packages/task-control/src/task-admission.ts"

const proposal:ProposedTask[]=[{node:{nodeId:"write",label:"Write",stage:"implementation",outcome:"File contains done",dependsOnNodeIds:[],taskSpec:{goal:"Write done",writeScopes:["result.txt"],acceptanceCriteria:[{id:"file-correct",description:"File contains done"}]}},expectation:{expectedArtifacts:{"result.txt":"done"},expectedInterface:{},expectedBehavior:{"file-correct":true},expectedDependencies:{},expectedGoals:{},expectedRisk:0}}]
function install(r:ReturnType<typeof createGraphRuntime>):ControllerProgram {
  const content={authorization:"explicit test program"},authorization=r.control.evidence.put({id:"operator",version:1,type:"user",source:"test operator",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),confidence:1,content,contentHash:digest(content),inputVector:[],expiresAt:null})
  r.control.validators.register({id:"plan",version:1,command:[process.execPath,"-e",`let input='';for await(const chunk of process.stdin)input+=chunk;const data=JSON.parse(input);const proposal=data.evidence.find(e=>e.type==='agent').content; if(proposal.request!=='Write done'||proposal.proposal[0].node.taskSpec.goal!=='Write done')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[authorization]})
  r.control.validators.register({id:"state",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');const value=fs.readFileSync('result.txt','utf8');console.log(JSON.stringify({state:{artifacts:{'result.txt':value},contract:{},behavior:{'file-correct':value==='done'},dependencies:{},goals:{},risk:0},criticalViolations:[]}));`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[authorization],output:"semantic-state"})
  const role:RoleVersion={id:"bounded",version:1,name:"Bounded",purpose:"Perform requested work",capabilities:[],prompt:"Return structured output",activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:30000,maxDependencyDepth:2,maxEvidenceItems:10,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"temporary",evidence:[authorization]}
  r.store.control.put("role_versions",role.id,1,role)
  r.store.control.put("policy_versions","operator-policy",1,{id:"operator-policy",version:1,authorization:[authorization]})
  const entry={role:{id:role.id,version:1},profile:{id:"synthetic",level:3 as const,provider:"test",model:"test",maxInputTokens:32000,maxOutputTokens:1000,maxToolCalls:2,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]}}
  const program:ControllerProgram={id:"program",version:1,authorization:[authorization],policy:{id:"operator-policy",version:1},planner:entry,worker:entry,planValidators:["plan/v1"],observationValidators:["state/v1"],predictionPolicy:{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},readScopes:["result.txt"],writeScopes:["result.txt"],maxTasks:2,grantLifetimeMs:60000,account:"test",tokenLimit:100000}
  r.control.requests.register(program);return program
}
function accept(r:ReturnType<typeof createGraphRuntime>,grantId:string,tasks:unknown[]=[],extra:Partial<AgentOutput>={}) {
  const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grantId)!.payload)) as ActivationGrant
  const worker=`worker-${grantId}`
  if(grant.executionMode==="task")withTaskAdmission(r.engine,grantId,worker,()=>new TaskScheduler(r.engine,1).claim(grant.taskId,{agent:"fixture",sessionId:worker}))
  r.control.admission.claim(grantId,{worker,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:r.control.graph.hash(),generation:grant.generation,now:Date.now()})
  const output:AgentOutput={taskId:grant.taskId,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:tasks,confidence:1,requiresEscalation:false,...extra}
  r.control.admission.submit(grantId,worker,output,{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
  if(grant.executionMode==="task") {r.engine.completeTask({taskId:grant.taskId,attemptToken:r.store.currentAttempt(grant.taskId)!.token,summary:"fixture wrote actual file"});new TaskScheduler(r.engine,1).release(grant.taskId,true)}
}

test("기본 host 요청은 manager 없이 durable control event가 되며 설정 누락은 자동 호출하지 않는다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"control-host-")),s=new HostService({version:1,directory:dir,database:join(dir,"graph.db"),socket:join(dir,"host.sock"),workspaces:[{path:dir}],autoContinue:false,maxRuns:1})
  try {
    assert.ok(s.harness instanceof ControlServer)
    s.store.register(dir);s.store.enqueue({id:"event",host:"codex",sessionId:"user",workspace:dir,kind:"UserPromptSubmit",text:"Write done"})
    for(let i=0;i<5;i++)await s.wake()
    const r=createGraphRuntime(join(dir,"graph.db"))
    try {
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM control_requests").get()!.n,1)
      assert.equal(r.store.db.prepare("SELECT state FROM control_requests").get()!.state,"waiting")
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,0)
    }finally{r.close()}
  }finally{await s.close();rmSync(dir,{recursive:true,force:true})}
})

test("요청 해석→실제 계획 validator→worker grant→파일 검증→완료가 기본 host에서 연결된다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"control-e2e-")),database=join(dir,"graph.db"),r=createGraphRuntime(database),program=install(r);r.close()
  const calls:string[]=[]
  const s=new HostService({version:1,directory:dir,database,socket:join(dir,"host.sock"),workspaces:[{path:dir}],autoContinue:false,maxRuns:1,maxWorkers:1,controlProgram:{id:program.id,version:1},validationBudget:{maxJobs:4,maxDurationMs:3000}},undefined,graph=>({async execute(id){calls.push(id);const grant=JSON.parse(String(graph.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant;if(grant.executionMode==="task")writeFileSync(join(dir,"result.txt"),"done");accept(graph,id,grant.executionMode==="cognition"?proposal:[]);},async stop(){return {stopped:true,evidence:"fixture stop"}},async close(){}}))
  try {
    s.store.register(dir);s.store.enqueue({id:"event",host:"codex",sessionId:"user",workspace:dir,kind:"UserPromptSubmit",text:"Write done"})
    for(let i=0;i<100;i++){await s.wake();if(s.store.get("event")!.phase==="completed")break;await new Promise(resolve=>setTimeout(resolve,10))}
    assert.equal(s.store.get("event")!.phase,"completed",JSON.stringify(s.store.get("event")))
    assert.equal(calls.length,2);assert.equal(readFileSync(join(dir,"result.txt"),"utf8"),"done")
    for(let i=0;i<3;i++)await s.wake();assert.equal(calls.length,2)
  }finally{await s.close();rmSync(dir,{recursive:true,force:true})}
})

test("중복·재시작은 요청 grant를 재발급하지 않고 잘못된 계획은 실행 그래프를 남기지 않는다",()=>{
  const dir=mkdtempSync(join(tmpdir(),"request-restart-")),database=join(dir,"g.db");let r=createGraphRuntime(database)
  try {
    install(r);const input={id:"request",sessionId:"session",text:"Write done",planOnly:false,program:{id:"program",version:1}}
    r.control.requests.submit(input);r.control.requests.tick();const grant=r.control.requests.get(input.id)!.plannerGrant!
    r.close();r=createGraphRuntime(database);r.control.requests.submit(input);r.control.requests.tick()
    assert.equal(r.control.requests.get(input.id)!.plannerGrant,grant)
    assert.throws(()=>r.control.requests.submit({...input,text:"different"}),/identity conflict/)
    accept(r,grant,[{...proposal[0],node:{...proposal[0]!.node,taskSpec:{...proposal[0]!.node.taskSpec,writeScopes:["secret.txt"]}}}]);r.control.requests.tick()
    assert.equal(r.control.requests.get(input.id)!.state,"waiting")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM work_plans").get()!.n,0)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("실제 의미 실패는 필요한 QA만 깨우며 quota와 결과 검증 의무를 유지한다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"specialist-runtime-")),r=createGraphRuntime(":memory:")
  try {
    const baseline=install(r),base=r.store.control.get<RoleVersion>("role_versions","bounded",1)!
    r.control.validators.register({id:"review",version:1,command:[process.execPath,"-e",`let value='';for await(const chunk of process.stdin)value+=chunk;const data=JSON.parse(value);if(!data.evidence[0].content.output.findings.includes('file mismatch confirmed'))process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    for(const [id,hard] of [["qa",true],["architect",false]] as const)r.store.control.put("role_versions",id,1,{...base,id,validators:["review/v1"],activationPolicy:{...base.activationPolicy,hardTriggers:hard?["failure"]:[],softSignals:hard?{}:{architectureViolation:1}}})
    const program:ControllerProgram={...baseline,version:2,tokenLimit:66003,specialists:["qa","architect"].map(id=>({role:{id,version:1},profile:baseline.worker.profile}))}
    r.control.requests.register(program)
    r.control.requests.submit({id:"request",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("request")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("request")[0]!,worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!
    writeFileSync(join(dir,"result.txt"),"wrong");accept(r,String(worker.id))
    r.control.requests.submit({id:"other",sessionId:"other",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    const deferred=r.store.db.prepare("SELECT state FROM specialist_demands WHERE task_id=? AND mandatory=1").get(taskId)
    assert.ok(deferred,JSON.stringify({jobs:r.store.db.prepare("SELECT state,payload FROM validation_jobs").all(),events:r.store.db.prepare("SELECT type,payload FROM event_outbox WHERE type IN ('ObservationRejected','PredictionObserved')").all()}))
    assert.equal(deferred.state,"deferred")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants WHERE task_id=? AND json_extract(payload,'$.role.id')='qa'").get(taskId)!.n,0)
    r.control.requests.cancel("other");r.control.requests.tick()
    assert.equal(r.store.db.prepare("SELECT state FROM specialist_demands WHERE task_id=? AND mandatory=1").get(taskId)!.state,"issued")
    const roles=r.store.db.prepare("SELECT json_extract(payload,'$.role.id') role,id FROM activation_grants WHERE task_id=?").all(taskId)
    assert.deepEqual(roles.map(row=>row.role).sort(),["bounded","qa"])
    assert.equal(r.engine.requireTask(taskId).status,"implemented")
    const qa=String(roles.find(row=>row.role==="qa")!.id),grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(qa)!.payload)) as ActivationGrant
    r.control.admission.claim(qa,{worker:"qa-worker",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:r.control.graph.hash(),generation:1,now:Date.now()})
    r.control.admission.submit(qa,"qa-worker",{taskId,findings:["file mismatch confirmed"],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
    assert.ok(r.control.evidence.unresolved(taskId).some(obligation=>obligation.kind==="role-output"))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    assert.equal(r.control.evidence.unresolved(taskId).filter(obligation=>obligation.kind==="role-output").length,0)
    assert.equal(r.store.db.prepare("SELECT state FROM specialist_demands WHERE task_id=? AND mandatory=1").get(taskId)!.state,"satisfied")
    assert.equal(r.engine.requireTask(taskId).status,"implemented")
    r.control.requests.tick();assert.notEqual(r.control.requests.get("request")!.state,"completed")
    for(let i=0;i<3;i++)r.engine.atomic(()=>r.control.roles.ingest())
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants WHERE json_extract(payload,'$.role.id')='qa'").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("측정된 leaf 실패는 원래 기대치를 보존한 새 허가로 복구하고 다시 실제 검증을 통과해야 완료된다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"local-repair-")),r=createGraphRuntime(":memory:")
  try {
    const program={...install(r),version:2,maxLocalRepairs:1};r.control.requests.register(program)
    r.control.requests.submit({id:"repair",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("repair")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("repair")[0]!,initial=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!.id)
    writeFileSync(join(dir,"result.txt"),"wrong");accept(r,initial)
    assert.throws(()=>r.engine.reopenTask(taskId,"trust me"),/evidence-bound/)
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    const expected=r.store.control.get("task_expectations",taskId,1),plan=r.control.requests.get("repair")!.planId!
    r.control.requests.tick()
    const repair=r.store.db.prepare("SELECT grant_id FROM local_repair_attempts WHERE task_id=?").get(taskId)!
    assert.ok(repair,r.control.requests.get("repair")!.reason)
    assert.notEqual(String(repair.grant_id),initial)
    assert.deepEqual(r.store.control.get("task_expectations",taskId,1),expected)
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,1)
    r.control.requests.tick();assert.equal(r.store.db.prepare("SELECT count(*) n FROM local_repair_attempts").get()!.n,1)
    writeFileSync(join(dir,"result.txt"),"done");accept(r,String(repair.grant_id))
    r.control.requests.tick();assert.notEqual(r.control.requests.get("repair")!.state,"completed")
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.control.requests.get("repair")!.state,"completed",r.control.requests.get("repair")!.reason)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM task_attempts WHERE task_id=?").get(taskId)!.n,2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='LocalRepairIssued'").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const questionMode of ["none","resume","budget","budget-stale","stale","expired","generation"] as const)test(`국소 복구 소진의 검증된 scoped revision과 질문 재개: ${questionMode}`,async(t)=>{
  const dir=mkdtempSync(join(tmpdir(),"regional-repair-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r)
    r.control.validators.register({id:"repair",version:1,command:[process.execPath,"-e",`let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const p=input.evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;if(p.metadata.clarifications?.length&&p.metadata.clarifications[0].answers[0][0]!=='UTF-8로 검증해 주세요')process.exit(1);if(p.metadata.goal!=='Write done'||p.metadata.expectations[0].expectation.expectedArtifacts['result.txt']!=='done'||p.patch.revisedTasks[0].objective!=='Write done with verified encoding')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[{id:"operator",version:1}]})
    const program={...baseline,version:2,maxLocalRepairs:1,maxClarifications:1,tokenLimit:questionMode.startsWith("budget")?33012:100000,replanner:{...baseline.planner,validators:["repair/v1"],maxAttempts:1}};r.control.requests.register(program)
    r.control.requests.submit({id:"regional",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("regional")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const oldTask=r.control.requests.tasks("regional")[0]!,plan=r.control.requests.get("regional")!.planId!
    writeFileSync(join(dir,"result.txt"),"wrong")
    for(let i=0;i<2;i++) {
      const id=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(oldTask)!.id)
      accept(r,id);await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    }
    r.control.requests.tick()
    const row=r.store.db.prepare("SELECT payload FROM request_region_repairs").get()
    assert.ok(row,r.control.requests.get("regional")!.reason)
    let repair=JSON.parse(String(row.payload))
    if(questionMode!=="none") {
      const original=repair,oldGrant=repair.grantId
      accept(r,oldGrant,[],{findings:["수정 전 실패 원인을 보존한다"],unresolvedQuestions:[{kind:"user",question:"수정할 인코딩 조건을 확인해 주세요."}]})
      r.control.requests.tick()
      assert.equal(r.control.requests.get("regional")!.state,"waiting")
      const question=r.control.requests.questions.pending("regional")[0]!
      assert.ok(question.target?.kind==="regional");assert.equal(question.target.repairId,repair.id)
      for(let i=0;i<3;i++)r.control.requests.tick()
      r.close();r=createGraphRuntime(database)
      assert.equal(r.control.requests.questions.pending("regional")[0]!.id,question.id)
      if(questionMode==="stale")r.engine.atomic(()=>r.store.updateTask({...r.engine.requireTask(oldTask),goal:"Changed during clarification"}))
      if(questionMode==="expired")t.mock.method(Date,"now",()=>original.lease.expiresAt+1)
      if(questionMode==="generation") {
        const {id,baseRevision,graphHash,inputVector,generation,...fields}=original.lease
        r.control.replanning.issue({...fields,validators:["repair/v1"]})
      }
      const answer=()=>r.control.requests.questions.answer("regional","user",question.id,[["UTF-8로 검증해 주세요"]])
      if(!["resume","budget","budget-stale"].includes(questionMode)) {
        assert.throws(answer,/changed|stale|expired|fenced/)
        assert.equal(r.store.findWorkPlan(plan)!.currentRevision,1)
        assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload)).grantId,oldGrant)
        return
      }
      if(questionMode.startsWith("budget")) {
        r.control.requests.submit({id:"regional-budget-holder",sessionId:"other",text:"Write done",planOnly:true,program:{id:program.id,version:2}})
        r.control.requests.tick()
      }
      answer();answer();r.control.requests.tick()
      if(questionMode.startsWith("budget")) {
        assert.equal(r.control.requests.get("regional")!.state,"resuming")
        assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload)).grantId,oldGrant)
        r.close();r=createGraphRuntime(database)
        if(questionMode==="budget-stale")r.engine.atomic(()=>r.store.updateTask({...r.engine.requireTask(oldTask),goal:"Changed while waiting for budget"}))
        r.control.requests.cancel("regional-budget-holder");r.control.requests.tick()
        if(questionMode==="budget-stale") {
          assert.equal(r.control.requests.get("regional")!.state,"waiting")
          assert.match(r.control.requests.get("regional")!.reason!,/inputs changed/)
          assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload)).grantId,oldGrant)
          return
        }
      }
      repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload))
      assert.notEqual(repair.grantId,oldGrant)
      assert.deepEqual(repair.lease,original.lease)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,1)
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(repair.grantId)!.payload)) as ActivationGrant
      assert.ok(grant.expiresAt<=repair.lease.expiresAt)
      const context=JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version))
      assert.ok(context.includes("UTF-8로 검증해 주세요")&&context.includes("수정 전 실패 원인을 보존한다"))
      r.control.requests.tick()
      assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload)).grantId,repair.grantId)
    }
    const node={...proposal[0]!.node,taskSpec:{...proposal[0]!.node.taskSpec,goal:"Write done with verified encoding"}}
    const patch={revisedTasks:[{id:node.nodeId,dependencies:[],objective:node.taskSpec.goal,expectedOutcome:node.outcome,decisionRefs:[]}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[],invalidatedAssumptions:[],expectedOutcomes:[{taskId:node.nodeId,value:node.outcome}],confidence:1}
    accept(r,repair.grantId,[{patch,tasks:[{node,expectation:proposal[0]!.expectation}],summary:"Correct the failed implementation while preserving the requested outcome"}])
    r.control.requests.tick()
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,1)
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,2,r.control.requests.get("regional")!.reason)
    const next=r.control.requests.tasks("regional")[0]!
    assert.notEqual(next,oldTask)
    assert.equal(r.store.control.head("task_expectations",next),1)
    assert.throws(()=>r.engine.startTask(next,{agent:"bypass",sessionId:"raw"}),/adapter admission/)
    r.control.requests.tick()
    const worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(next)
    assert.ok(worker,r.control.requests.get("regional")!.reason)
    writeFileSync(join(dir,"result.txt"),"done");accept(r,String(worker.id))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.control.requests.get("regional")!.state,"completed",r.control.requests.get("regional")!.reason)
    assert.equal(r.store.findWorkPlan(plan)!.goal,"Write done")
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("방향 수정은 기존 목표·계획을 보존하고 새 사용자 증거를 scoped replanner에 전달한다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"request-steer-")),r=createGraphRuntime(":memory:")
  try {
    const baseline=install(r),program={...baseline,version:2,maxLocalRepairs:1,replanner:{...baseline.planner,validators:["plan/v1"],maxAttempts:1}};r.control.requests.register(program)
    r.control.requests.submit({id:"old",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("old")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const prior=r.control.requests.get("old")!,task=r.control.requests.tasks("old")[0]!
    r.control.requests.cancel("old")
    const input={id:"new",sessionId:"user",text:"인코딩 조건도 검증해 주세요",planOnly:false,program:{id:program.id,version:2}}
    const changed=r.control.requests.steer("old",input)
    assert.equal(changed.text,"Write done")
    assert.equal(changed.planId,prior.planId)
    assert.deepEqual(r.control.requests.tasks("new"),[task])
    assert.equal(changed.amendments![0]!.text,input.text)
    assert.deepEqual(r.control.requests.steer("old",input),changed)
    assert.throws(()=>r.control.requests.steer("old",{...input,text:"다른 변경"}),/identity conflict/)
    r.control.requests.tick()
    const repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE request_id='new'").get()!.payload))
    assert.deepEqual(repair.lease.predictionErrors,[])
    const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(repair.grantId)!.payload))
    const context=JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version))
    assert.ok(context.includes(input.text)&&context.includes("Write done"))
    assert.equal(r.store.findWorkPlan(prior.planId!)!.currentRevision,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})


for(const stale of [false,true])test(stale?"cooldown 종료는 대기 중 변경된 입력의 오래된 근거를 재사용하지 않는다":"cooldown 종료는 재시작 후 한 번 재평가하고 quota를 우회하지 않는다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"specialist-timer-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r),base=r.store.control.get<RoleVersion>("role_versions","bounded",1)!
    r.store.control.put("role_versions","qa",1,{...base,id:"qa",validators:["plan/v1"],activationPolicy:{...base.activationPolicy,hardTriggers:["failure"],cooldownMs:60000,maxInvocationsPerTask:2}})
    const program:ControllerProgram={...baseline,version:2,tokenLimit:200000,specialists:[{role:{id:"qa",version:1},profile:baseline.worker.profile}]}
    r.control.requests.register(program)
    r.control.requests.submit({id:"request",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("request")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("request")[0]!,worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!
    writeFileSync(join(dir,"result.txt"),"wrong");accept(r,String(worker.id))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    const measured=r.store.db.prepare("SELECT payload FROM event_outbox WHERE type='PredictionObserved' AND entity_id=?").get(taskId)!
    const emit=(id:string)=>r.engine.atomic(()=>r.store.control.event({id,type:"PredictionObserved",entityId:taskId,correlationId:"request",schemaVersion:1,timestamp:Date.now(),payload:JSON.parse(String(measured.payload)).payload}))
    const grants=()=>r.store.db.prepare("SELECT count(*) n FROM activation_grants WHERE task_id=? AND json_extract(payload,'$.role.id')='qa'").get(taskId)!.n
    assert.equal(grants(),1)
    emit("new-measurement")
    const timer=r.store.db.prepare("SELECT * FROM specialist_timers WHERE state='pending'").get()!
    assert.ok(timer)
    r.close();r=createGraphRuntime(database)
    r.control.roles.retry(Number(timer.due_at)-1);assert.equal(grants(),1)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='SpecialistCooldownElapsed'").get()!.n,0)
    if(stale) {
      r.engine.atomic(()=>r.store.updateTask({...r.engine.requireTask(taskId),goal:"Changed requirement"}))
      r.control.roles.retry(Number(timer.due_at))
      assert.equal(grants(),1)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_decisions WHERE event_id=?").get(String(timer.id))!.n,0)
      assert.equal(r.store.db.prepare("SELECT state FROM specialist_timers WHERE id=?").get(String(timer.id))!.state,"fired")
      return
    }
    r.control.roles.retry(Number(timer.due_at));assert.equal(grants(),2)
    for(let i=0;i<3;i++)r.control.roles.retry(Number(timer.due_at)+1)
    assert.equal(grants(),2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='SpecialistCooldownElapsed'").get()!.n,1)
    const issued=r.store.db.prepare("SELECT d.payload FROM activation_decisions d JOIN activation_grants g ON d.id=g.decision_id WHERE d.event_id=?").get(String(timer.id))!
    assert.equal(JSON.parse(String(issued.payload)).action,"activate")
    emit("quota-measurement");r.control.roles.retry(Number(timer.due_at)+120000)
    assert.equal(grants(),2)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM specialist_demands WHERE mandatory=1 AND state='deferred'").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})


for(const mode of ["resume","budget","budget-stale","cancel","stale","quota","untyped","escalation","disabled"] as const)test(`사용자 질문 응답의 내구 제어 경로: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"question-resume-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  const config={version:1 as const,directory:dir,database,socket:join(dir,"host.sock"),workspaces:[{path:dir}],autoContinue:false,maxRuns:1,controlProgram:{id:"program",version:2}}
  const server=()=>new ControlServer(config,()=>r.control,async()=>({stopped:true,evidence:"fixture"}))
  let transport=server()
  const binding={workspace:dir,sessionID:"user",messageID:"request"}
  const questionOutput:Partial<AgentOutput>={findings:["기존 조사 결과를 보존한다"],unresolvedQuestions:mode==="untyped"?["untyped request"]:[{kind:"user",question:"결과 파일의 문자열을 확인해 주세요."}],requiresEscalation:mode==="escalation"}
  const budgetLimited=mode==="budget"||mode==="budget-stale"
  try {
    const base=install(r)
    r.control.validators.register({id:"clarified-plan",version:1,command:[process.execPath,"-e",`let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const plan=input.evidence.find(e=>e.validatorVersion==='structured-proposal/v1').content;const answer=input.evidence.find(e=>e.validatorVersion==='user-answer/v1');if(plan.request!=='Write done'||plan.clarifications[0].answers[0][0]!=='done'||answer.content.answers[0][0]!=='done')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    r.control.requests.register({...base,version:2,maxClarifications:mode==="disabled"?0:1,planValidators:["clarified-plan/v1"],tokenLimit:budgetLimited?33002:100000})
    await transport.submit(binding,"Write done",budgetLimited)
    const initial=r.control.requests.get("request")!.plannerGrant!
    accept(r,initial,[],questionOutput)
    const view=await transport.inspect(binding),question=view.questions[0]!
    assert.equal(view.state,"waiting")
    if(["untyped","escalation","disabled"].includes(mode)) {
      assert.equal(view.questions.length,0)
      assert.match(view.text,/structured user questions|Escalation|quota exhausted/)
      for(let i=0;i<3;i++)await transport.inspect(binding)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1)
      return
    }
    assert.equal(view.questions.length,1)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM work_plans").get()!.n,0)
    for(let i=0;i<3;i++)await transport.inspect(binding)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1)
    await transport.close();r.close();r=createGraphRuntime(database);transport=server()
    assert.deepEqual((await transport.inspect(binding)).questions,[question])
    const reply={kind:"question" as const,requestID:question.id,answers:[["done"]]}
    await assert.rejects(transport.reply({...binding,sessionID:"foreign"},reply),/session/)
    await assert.rejects(transport.reply(binding,{...reply,answers:[]}),/answer/)
    await assert.rejects(transport.reply(binding,{requestID:question.id,kind:"permission",reply:"once"}),/Permission/)
    if(mode==="cancel") {
      await transport.cancel(binding)
      await assert.rejects(transport.reply(binding,reply),/no longer pending/)
      assert.equal(r.control.requests.questions.pending("request").length,0);return
    }
    if(mode==="stale") {
      const task=r.engine.requireTask(r.control.requests.get("request")!.taskId)
      r.engine.atomic(()=>r.store.updateTask({...task,goal:"Changed goal"}))
      await assert.rejects(transport.reply(binding,reply),/stale planning inputs/)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1);return
    }
    if(budgetLimited) {
      r.control.requests.submit({id:"occupy",sessionId:"other",text:"Write done",planOnly:true,program:{id:"program",version:2}})
      r.control.requests.tick()
    }
    await transport.reply(binding,reply)
    await transport.reply(binding,reply)
    await assert.rejects(transport.reply(binding,{...reply,answers:[["different"]]}),/identity conflict/)
    if(budgetLimited) {
      assert.equal(r.control.requests.get("request")!.state,"resuming")
      assert.equal(r.control.requests.get("request")!.plannerGrant,initial)
      r.close();r=createGraphRuntime(database);transport=server()
      if(mode==="budget-stale") {
        const task=r.engine.requireTask(r.control.requests.get("request")!.taskId)
        r.engine.atomic(()=>r.store.updateTask({...task,goal:"Changed during budget wait"}))
      }
      r.control.requests.cancel("occupy");r.control.requests.tick()
      if(mode==="budget-stale") {
        assert.equal(r.control.requests.get("request")!.state,"waiting")
        assert.match(r.control.requests.get("request")!.reason!,/stale planning inputs/)
        assert.equal(r.control.requests.get("request")!.plannerGrant,initial)
        return
      }
    }
    const resumed=r.control.requests.get("request")!.plannerGrant!
    assert.notEqual(resumed,initial)
    const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(resumed)!.payload)) as ActivationGrant
    const previous=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(initial)!.payload)) as ActivationGrant
    assert.deepEqual(grant.allowedTools,previous.allowedTools);assert.deepEqual(grant.writeScopes,previous.writeScopes)
    assert.equal(grant.generation,previous.generation+1)
    assert.ok(JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version)).includes("기존 조사 결과를 보존한다"))
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='RequestQuestionAnswered'").get()!.n,1)
    accept(r,resumed,proposal,mode==="quota"?questionOutput:{})
    r.control.requests.tick()
    if(mode==="quota") {
      assert.equal(r.control.requests.get("request")!.state,"waiting")
      assert.match(r.control.requests.get("request")!.reason!,/quota exhausted/)
      assert.equal(r.control.requests.questions.pending("request").length,0);return
    }
    assert.equal(r.control.requests.get("request")!.state,"validating")
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    if(mode==="resume") {
      const taskId=r.control.requests.tasks("request")[0]!,worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!
      writeFileSync(join(dir,"result.txt"),"done");accept(r,String(worker.id))
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    }
    assert.equal(r.control.requests.get("request")!.state,"completed",r.control.requests.get("request")!.reason)
    assert.equal(r.control.requests.get("request")!.text,"Write done")
  }finally{await transport.close();r.close();rmSync(dir,{recursive:true,force:true})}
})


for(const mode of ["resume","budget","stale","cancel","quota"] as const)test(`worker 질문의 기대치 보존 재개: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"worker-question-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const program={...install(r),version:2,maxClarifications:1,tokenLimit:mode==="budget"?33010:100000}
    r.control.requests.register(program)
    r.control.requests.submit({id:"request",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("request")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("request")[0]!,initial=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!.id)
    const expected=r.store.control.get("task_expectations",taskId,1),plan=r.control.requests.get("request")!.planId!
    const output={findings:["질문 이전 작업 상태"],unresolvedQuestions:[{kind:"user",question:"저장할 문자열을 확인해 주세요."}]}
    writeFileSync(join(dir,"result.txt"),"done");accept(r,initial,[],output)
    const priorAttempt=r.store.currentAttempt(taskId)!.id
    // Even passing semantic checks must not hide an unanswered worker question.
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    assert.equal(r.engine.requireTask(taskId).status,"implemented")
    r.control.requests.tick()
    assert.equal(r.control.requests.get("request")!.state,"waiting")
    const question=r.control.requests.questions.pending("request")[0]!
    assert.equal(question.target?.kind,"worker")
    r.close();r=createGraphRuntime(database)
    assert.equal(r.control.requests.questions.pending("request")[0]!.id,question.id)
    const answer=()=>r.control.requests.questions.answer("request","user",question.id,[["done으로 유지해 주세요"]])
    if(mode==="stale") {
      r.engine.atomic(()=>r.store.updateTask({...r.engine.requireTask(taskId),goal:"Changed worker goal"}))
      assert.throws(answer,/stale execution/);return
    }
    if(mode==="cancel") {r.control.requests.cancel("request");assert.throws(answer,/no longer pending/);return}
    if(mode==="budget") {
      r.control.requests.submit({id:"holder",sessionId:"other",text:"Write done",planOnly:true,program:{id:program.id,version:2}});r.control.requests.tick()
    }
    answer();answer();r.control.requests.tick()
    if(mode==="budget") {
      assert.equal(r.control.requests.get("request")!.state,"resuming")
      assert.equal(r.engine.requireTask(taskId).status,"implemented")
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM worker_question_resumptions").get()!.n,0)
      r.close();r=createGraphRuntime(database);r.control.requests.cancel("holder");r.control.requests.tick()
    }
    const resumed=String(r.store.db.prepare("SELECT grant_id FROM worker_question_resumptions WHERE question_id=?").get(question.id)!.grant_id)
    assert.notEqual(resumed,initial)
    assert.deepEqual(r.store.control.get("task_expectations",taskId,1),expected)
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,1)
    for(let i=0;i<3;i++)r.control.requests.tick()
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM worker_question_resumptions").get()!.n,1)
    const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(resumed)!.payload)) as ActivationGrant
    assert.deepEqual(grant.writeScopes,["result.txt"])
    const decision=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_decisions WHERE id=?").get(grant.decisionId)!.payload))
    assert.equal(decision.signals.failure,null)
    assert.match(decision.reasons[0],/explicit user clarification/)
    assert.ok(JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version)).includes("질문 이전 작업 상태"))
    accept(r,resumed,[],mode==="quota"?output:{})
    assert.notEqual(r.store.currentAttempt(taskId)!.id,priorAttempt)
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    if(mode==="quota") {
      assert.equal(r.control.requests.get("request")!.state,"waiting")
      assert.match(r.control.requests.get("request")!.reason!,/quota exhausted/)
      assert.equal(r.engine.requireTask(taskId).status,"implemented");return
    }
    assert.equal(r.control.requests.get("request")!.state,"completed",r.control.requests.get("request")!.reason)
    assert.equal(r.store.control.head("task_expectations",taskId),1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
