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
import { selectWorkerPrecision } from "../packages/task-control/src/worker-precision.ts"
import { PolicyLearning } from "../packages/task-policy/src/index.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { withTaskAdmission } from "../packages/task-control/src/task-admission.ts"

const proposal:ProposedTask[]=[{node:{nodeId:"write",label:"Write",stage:"implementation",outcome:"File contains done",dependsOnNodeIds:[],taskSpec:{goal:"Write done",writeScopes:["result.txt"],acceptanceCriteria:[{id:"file-correct",description:"File contains done"}]}},expectation:{expectedArtifacts:{"result.txt":"done"},expectedInterface:{},expectedBehavior:{"file-correct":true},expectedDependencies:{},expectedGoals:{},expectedRisk:0}}]
function install(r:ReturnType<typeof createGraphRuntime>):ControllerProgram {
  const content={authorization:"explicit test program"},authorization=r.control.evidence.put({id:"operator",version:1,type:"user",source:"test operator",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),confidence:1,content,contentHash:digest(content),inputVector:[],expiresAt:null})
  r.control.validators.register({id:"plan",version:1,command:[process.execPath,"-e",`let input='';for await(const chunk of process.stdin)input+=chunk;const data=JSON.parse(input);const proposal=data.evidence.find(e=>e.type==='agent').content; if(proposal.request!=='Write done'||proposal.proposal[0].node.taskSpec.goal!=='Write done')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[authorization]})
  r.control.validators.register({id:"state",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');const value=fs.readFileSync('result.txt','utf8');console.log(JSON.stringify({state:{artifacts:{'result.txt':value},contract:{},behavior:{'file-correct':value==='done'},dependencies:{},goals:{},risk:0},criticalViolations:[]}));`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[authorization],output:"semantic-state"})
  const role:RoleVersion={id:"bounded",version:1,name:"Bounded",purpose:"Perform requested work",capabilities:[],prompt:"Return structured output",activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:30000,maxDependencyDepth:2,maxEvidenceItems:10,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[authorization]}
  r.control.roleLifecycle.installConfigured(role,"request controller fixture")
  r.store.control.put("policy_versions","operator-policy",1,{id:"operator-policy",version:1,authorization:[authorization]})
  const entry={role:{id:role.id,version:1},profile:{id:"synthetic",level:3 as const,provider:"test",model:"test",maxInputTokens:32000,maxOutputTokens:1000,maxToolCalls:2,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]}}
  const program:ControllerProgram={id:"program",version:1,authorization:[authorization],policy:{id:"operator-policy",version:1},planner:entry,worker:entry,planValidators:["plan/v1"],observationValidators:["state/v1"],predictionPolicy:{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},readScopes:["result.txt"],writeScopes:["result.txt"],maxTasks:2,grantLifetimeMs:60000,account:"test",tokenLimit:100000}
  r.control.requests.register(program);return program
}
function accept(r:ReturnType<typeof createGraphRuntime>,grantId:string,tasks:unknown[]=[],extra:Partial<AgentOutput>={},observed?:(grant:ActivationGrant)=>void) {
  const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grantId)!.payload)) as ActivationGrant
  const worker=`worker-${grantId}`
  if(grant.executionMode==="task")withTaskAdmission(r.engine,grantId,worker,()=>new TaskScheduler(r.engine,1).claim(grant.taskId,{agent:"fixture",sessionId:worker}))
  r.control.admission.claim(grantId,{worker,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:r.control.graph.hash(),generation:grant.generation,now:Date.now()})
  observed?.(grant)
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
    const measured=createGraphRuntime(database)
    try {
      const row=measured.store.db.prepare("SELECT payload FROM outcome_labels WHERE json_extract(payload,'$.type')='request-outcome'").get()!
      assert.ok(row)
      const outcome=JSON.parse(String(row.payload))
      assert.equal(outcome.runs.length,2)
      assert.deepEqual(outcome.cost,{inputTokens:2,outputTokens:2,toolCalls:0,elapsedWorkMs:2,complete:true})
      assert.equal(outcome.sampleType,"synthetic")
      assert.equal(outcome.quality.usefulActivations,null)
      assert.equal(outcome.quality.missedFailures,null)
      for(let i=0;i<3;i++)measured.engine.atomic(()=>measured.control.outcomes.ingest())
      assert.equal(measured.store.db.prepare("SELECT count(*) n FROM outcome_labels").get()!.n,1)
    }finally{measured.close()}

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
    for(const [id,hard] of [["qa",true],["architect",false]] as const)r.control.roleLifecycle.installConfigured({...base,id,validators:["review/v1"],activationPolicy:{...base.activationPolicy,hardTriggers:hard?["failure"]:[],softSignals:hard?{}:{architectureViolation:1}}},"request specialist fixture")
    new PolicyLearning(r.store.control).propose({id:"architect-trigger",version:1,target:"activation",observedPattern:"실패 관찰",rootCause:"구조 검토 판단",proposedInvariant:"필수 의무 보존",proposedRule:{op:"gte",feature:"failure",value:.5},expectedBenefit:1,regressionRisk:.1,evidence:[{id:"operator",version:1}],counterexamples:[],rollback:baseline.policy},ref=>r.control.evidence.valid(ref))
    r.control.policyReplay.register({id:"architect-shadow",proposal:{id:"architect-trigger",version:1},role:{id:"architect",version:1},effect:"additional-trigger",split:{seed:"pre-outcome",holdoutBuckets:25}})
    r.control.policyReplay.register({id:"qa-shadow",proposal:{id:"architect-trigger",version:1},role:{id:"qa",version:1},effect:"additional-trigger",split:{seed:"pre-outcome",holdoutBuckets:25}})
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
    const shadow=r.control.policyReplay.report("architect-shadow")
    assert.ok(shadow.length>0)
    assert.ok(shadow.every(row=>row.actual==="defer"&&row.predicted==="activate"&&row.phase==="shadow"))
    assert.ok(shadow.every(row=>row.observed.grant===null&&row.candidateCost===null&&row.promotionEligible===false))
    assert.equal(r.engine.requireTask(taskId).status,"implemented")
    const qa=String(roles.find(row=>row.role==="qa")!.id),grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(qa)!.payload)) as ActivationGrant
    r.control.admission.claim(qa,{worker:"qa-worker",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:r.control.graph.hash(),generation:1,now:Date.now()})
    r.control.admission.submit(qa,"qa-worker",{taskId,findings:["file mismatch confirmed"],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
    assert.ok(r.control.evidence.unresolved(taskId).some(obligation=>obligation.kind==="role-output"))
    const measuredShadow=r.control.policyReplay.report("qa-shadow").find(row=>row.observed.grant?.id===qa)!
    assert.ok(measuredShadow)
    assert.deepEqual(measuredShadow.observed.usage,{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
    assert.deepEqual(measuredShadow.observed.grant!.context,grant.context)
    assert.equal(measuredShadow.observed.completion,null)
    assert.equal(measuredShadow.usefulActivation,null)
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

for(const questionMode of ["none","input-change","coalesced-input","question-input","assumption-loss","preserve-assumption","decision-loss","preserve-decision","selection","selection-unknown","selection-keep","resume","budget","budget-stale","stale","expired","generation"] as const)test(`국소 복구 소진의 검증된 scoped revision과 질문 재개: ${questionMode}`,async(t)=>{
  const dir=mkdtempSync(join(tmpdir(),"regional-repair-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r)
    r.control.validators.register({id:"repair",version:1,command:[process.execPath,"-e",`let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const p=input.evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;if(p.metadata.clarifications?.length&&p.metadata.clarifications[0].answers[0][0]!=='UTF-8로 검증해 주세요')process.exit(1);if(p.metadata.goal!=='Write done'||p.metadata.expectations[0].expectation.expectedArtifacts['result.txt']!=='done'||p.patch.revisedTasks[0].objective!=='Write done with verified encoding')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[{id:"operator",version:1}]})
    if(questionMode.startsWith("selection"))r.control.validators.register({id:"region-cost",version:1,command:[process.execPath,"-e",`let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const candidate=input.evidence.find(e=>e.validatorVersion==='region-candidate/v1').content;if(candidate.context.goal!=='Write done'||candidate.required.some(id=>!candidate.candidate.nodes.includes(id)))process.exit(1);console.log(JSON.stringify({feasible:${questionMode==="selection-unknown"?'"unknown"':'true'},costUnit:'work-units',costs:{planning:1,reasoning:2,context:3,reexecution:4,integration:5,expectedFailure:6},switching:{currentValid:${questionMode==="selection-keep"},keep:{estimate:${questionMode==="selection-keep"?1:20},lower:${questionMode==="selection-keep"?1:18},upper:${questionMode==="selection-keep"?2:22}},newFailure:{estimate:6,lower:5,upper:7}},reason:'registered structural fixture evaluator'}));`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[{id:"operator",version:1}]})
    const program={...baseline,version:2,fileObservation:{maxFiles:10,maxBytes:10000},maxLocalRepairs:1,maxClarifications:1,tokenLimit:questionMode.startsWith("budget")?33012:100000,replanner:{...baseline.planner,validators:["repair/v1"],maxAttempts:["coalesced-input","question-input"].includes(questionMode)?2:1,...(questionMode.startsWith("selection")?{selection:{validator:"region-cost/v1",candidateLimit:10,evaluationBudget:5,costUnit:"work-units"}}:{})}};r.control.requests.register(program)
    r.control.requests.submit({id:"regional",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("regional")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const oldTask=r.control.requests.tasks("regional")[0]!,plan=r.control.requests.get("regional")!.planId!
    if(["assumption-loss","preserve-assumption"].includes(questionMode)) {
      const content={premise:"registered precondition"},source=r.control.evidence.put({id:"source-premise",version:1,type:"code",source:"fixture",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
      r.control.validators.register({id:"assumption",version:1,command:[process.execPath,"-e",`console.log(JSON.stringify({verdict:'valid',reason:'Registered fixture precondition verified'}))`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
      r.control.assumptions.register({id:"premise",version:1,statement:"Registered precondition remains valid",tasks:[oldTask],evidence:[source],authorization:[{id:"operator",version:1}],validator:"assumption/v1"})
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
      assert.equal(r.control.assumptions.valid({id:"premise",version:1}),true)
    }
    if(["decision-loss","preserve-decision"].includes(questionMode)) {
      const content={basis:"registered decision basis"},source=r.control.evidence.put({id:"decision-source",version:1,type:"code",source:"fixture",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
      r.control.validators.register({id:"choice",version:1,command:[process.execPath,"-e",`let s='';for await(const c of process.stdin)s+=c;const d=JSON.parse(s).evidence.find(e=>e.validatorVersion==='decision-input/v1').content.decision;if(d.conclusion!=='Preserve the registered output contract')process.exit(1);console.log(JSON.stringify({verdict:'validated',reason:'Fixture contract decision verified'}))`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[{id:"operator",version:1}]})
      r.control.decisions.register({id:"choice",version:1,conclusion:"Preserve the registered output contract",tasks:[oldTask],assumptions:[],evidence:[source],authorization:[{id:"operator",version:1}],validator:"choice/v1"})
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
      assert.equal(r.control.decisions.valid({id:"choice",version:1}),true)
    }
    writeFileSync(join(dir,"result.txt"),"wrong")
    for(let i=0;i<(["input-change","coalesced-input","assumption-loss","decision-loss"].includes(questionMode)?1:2);i++) {
      const id=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(oldTask)!.id)
      accept(r,id,[],{},["input-change","coalesced-input","question-input"].includes(questionMode)?grant=>{r.control.files.read(grant,dir,"result.txt",digest(readFileSync(join(dir,"result.txt"),"utf8")),`observed-before-external-edit:${grant.id}`)}:undefined)
      if(["input-change","coalesced-input"].includes(questionMode)) {
        writeFileSync(join(dir,"result.txt"),"external change")
        const host=new ControlServer({version:1,directory:dir,database,socket:join(dir,"host.sock"),workspaces:[{path:dir}],autoContinue:false,maxRuns:1},()=>r.control,async()=>({stopped:true,evidence:"fixture"}))
        await host.inspect({workspace:dir,sessionID:"user",messageID:"regional"} as Parameters<ControlServer["inspect"]>[0])
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='InputObservationChanged'").get()!.n,1)
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='LocalRepairExhausted'").get()!.n,0)
      }else if(questionMode==="decision-loss") {
        r.control.evidence.retract({id:"decision-source",version:1},[{id:"operator",version:1}],"The decision basis was withdrawn")
        r.control.requests.tick()
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='DecisionValidityLost'").get()!.n,1)
      }else if(questionMode==="assumption-loss") {
        r.control.evidence.retract({id:"source-premise",version:1},[{id:"operator",version:1}],"The execution precondition was withdrawn")
        r.control.requests.tick()
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='AssumptionValidityLost'").get()!.n,1)
      }else {await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()}
    }
    r.control.requests.tick()
    if(questionMode.startsWith("selection")) {
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0)
      assert.ok(r.store.db.prepare("SELECT count(*) n FROM region_candidate_evaluations").get()!.n as number>0)
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
      if(questionMode==="selection-unknown") {
        assert.equal(r.control.requests.get("regional")!.state,"waiting")
        assert.match(r.control.requests.get("regional")!.reason!,/No proven feasible region/)
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0)
        return
      }
      if(questionMode==="selection-keep") {
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_keeps").get()!.n,1,JSON.stringify({request:r.control.requests.get("regional"),evaluations:r.store.db.prepare("SELECT * FROM region_candidate_evaluations").all(),jobs:r.store.db.prepare("SELECT state,payload FROM validation_jobs WHERE validator='region-cost/v1'").all()}))
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0)
        for(let i=0;i<3;i++)r.control.requests.tick()
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_keeps").get()!.n,1)
        const receipt=JSON.parse(String(r.store.db.prepare("SELECT payload FROM validation_jobs WHERE validator='region-cost/v1' AND state='passed' LIMIT 1").get()!.payload)).evidence
        r.control.evidence.retract(receipt,[{id:"operator",version:1}],"switching estimate receipt withdrawn")
        r.control.requests.tick()
        assert.equal(r.control.requests.get("regional")!.state,"waiting")
        assert.match(r.control.requests.get("regional")!.reason!,/No proven feasible region/)
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0)
        return
      }
    }
    const row=r.store.db.prepare("SELECT payload FROM request_region_repairs").get()
    assert.ok(row,r.control.requests.get("regional")!.reason)
    let repair=JSON.parse(String(row.payload))
    if(questionMode==="coalesced-input") {
      const previous=repair
      writeFileSync(join(dir,"result.txt"),"a newer external change")
      r.control.files.refreshNative(dir,{maxFiles:10,maxBytes:10000});r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(previous.grantId)!.state,"fenced")
      assert.equal(r.store.db.prepare("SELECT state FROM request_region_repairs WHERE id=?").get(previous.id)!.state,"superseded")
      assert.throws(()=>r.control.replanning.assertCurrent(previous.lease.id),/fenced/)
      r.control.requests.tick()
      repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()!.payload))
      assert.notEqual(repair.grantId,previous.grantId)
      assert.ok(repair.lease.generation>previous.lease.generation)
      const contextGrant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(repair.grantId)!.payload)) as ActivationGrant
      const context=JSON.stringify(r.store.control.get("context_manifests",contextGrant.context.id,contextGrant.context.version))
      assert.ok(context.includes(digest("a newer external change")))
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='RegionalRepairSuperseded'").get()!.n,1)
    }
    if(questionMode==="question-input") {
      const previous=repair
      accept(r,repair.grantId,[],{unresolvedQuestions:[{kind:"user",question:"변경 전 인코딩 조건을 확인해 주세요."}]});r.control.requests.tick()
      const question=r.control.requests.questions.pending("regional")[0]!
      assert.equal(r.control.requests.get("regional")!.state,"waiting")
      r.close();r=createGraphRuntime(database)
      writeFileSync(join(dir,"result.txt"),"changed while awaiting clarification")
      r.control.files.refreshNative(dir,{maxFiles:10,maxBytes:10000});r.control.requests.tick();r.control.requests.tick()
      assert.equal(r.control.requests.questions.get(question.id)!.state,"superseded")
      assert.throws(()=>r.control.requests.questions.answer("regional","user",question.id,[["이전 조건"]]),/no longer pending/)
      assert.throws(()=>r.control.replanning.assertCurrent(previous.lease.id),/fenced/)
      repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()!.payload))
      assert.notEqual(repair.grantId,previous.grantId)
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(repair.grantId)!.payload)) as ActivationGrant
      const context=JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version))
      assert.ok(context.includes("변경 전 인코딩 조건을 확인해 주세요."))
      assert.ok(context.includes(digest("changed while awaiting clarification")))
      assert.equal(r.control.requests.get("regional")!.clarifications?.length??0,0)
    }
    if(questionMode==="assumption-loss")assert.deepEqual(repair.lease.invalidAssumptions,[{id:"premise",version:1}])
    if(questionMode!=="none"&&questionMode!=="input-change"&&questionMode!=="coalesced-input"&&questionMode!=="question-input"&&questionMode!=="assumption-loss"&&questionMode!=="preserve-assumption"&&questionMode!=="decision-loss"&&questionMode!=="preserve-decision"&&!questionMode.startsWith("selection")) {
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
    if(questionMode==="decision-loss") {
      assert.deepEqual(repair.lease.invalidDecisions,[{id:"choice",version:1}])
      assert.deepEqual(repair.lease.immutableDecisions,[])
    }
    if(questionMode==="preserve-decision")assert.deepEqual(repair.lease.immutableDecisions,[{id:"choice",version:1}])
    const node={...proposal[0]!.node,taskSpec:{...proposal[0]!.node.taskSpec,goal:"Write done with verified encoding"}}
    const patch={revisedTasks:[{id:node.nodeId,dependencies:[],objective:node.taskSpec.goal,expectedOutcome:node.outcome,assumptionRefs:questionMode==="preserve-assumption"?[{id:"premise",version:1}]:[],decisionRefs:questionMode==="preserve-decision"?[{id:"choice",version:1}]:[]}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:questionMode==="preserve-decision"?[{id:"choice",version:1}]:[],invalidatedAssumptions:questionMode==="assumption-loss"?[{id:"premise",version:1}]:[],expectedOutcomes:[{taskId:node.nodeId,value:node.outcome}],confidence:1}
    if(questionMode==="preserve-assumption") {
      assert.deepEqual(repair.lease.immutableAssumptions,[{id:"premise",version:1}])
      assert.throws(()=>r.control.replanning.stage(repair.lease.id,{...patch,revisedTasks:patch.revisedTasks.map(node=>({...node,assumptionRefs:[]}))},[node],"drop premise"),/valid assumption binding/)
    }
    accept(r,repair.grantId,[{patch,tasks:[{node,expectation:proposal[0]!.expectation}],summary:"Correct the failed implementation while preserving the requested outcome"}])
    r.control.requests.tick()
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,1)
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,2,r.control.requests.get("regional")!.reason)
    const next=r.control.requests.tasks("regional")[0]!
    assert.notEqual(next,oldTask)
    assert.equal(r.store.control.head("task_expectations",next),1)
    if(questionMode==="preserve-assumption")assert.ok(r.store.db.prepare("SELECT 1 FROM assumption_task_consumers WHERE task_id=? AND id='premise'").get(next))
    if(questionMode==="preserve-decision")assert.ok(r.store.db.prepare("SELECT 1 FROM decision_task_consumers WHERE task_id=? AND id='choice'").get(next))
    if(questionMode==="decision-loss")assert.equal(r.store.db.prepare("SELECT 1 FROM decision_task_consumers WHERE task_id=? AND id='choice'").get(next),undefined)
    assert.throws(()=>r.engine.startTask(next,{agent:"bypass",sessionId:"raw"}),/adapter admission/)
    r.control.requests.tick()
    const worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(next)
    assert.ok(worker,r.control.requests.get("regional")!.reason)
    writeFileSync(join(dir,"result.txt"),"done");accept(r,String(worker.id))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.control.requests.get("regional")!.state,"completed",r.control.requests.get("regional")!.reason)
    assert.equal(r.store.findWorkPlan(plan)!.goal,"Write done")
    if(questionMode==="preserve-assumption") {
      r.control.evidence.retract({id:"source-premise",version:1},[{id:"operator",version:1}],"The preserved premise was withdrawn")
      assert.equal(r.control.assumptions.valid({id:"premise",version:1}),false)
      assert.equal(r.engine.signals.matches(next),false)
    }
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
    r.control.roleLifecycle.installConfigured({...base,id:"qa",validators:["plan/v1"],activationPolicy:{...base.activationPolicy,hardTriggers:["failure"],cooldownMs:60000,maxInvocationsPerTask:2}},"request QA fixture")
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


for(const integrationMode of ["pass","fail","repair"] as const)test(`공유 경계의 실제 7차원 검증이 요청 완료를 제어한다: ${integrationMode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"boundary-validation-")),r=createGraphRuntime(":memory:")
  try {
    const program=install(r),integrationPass=integrationMode==="pass"
    const dimensions=["behavior","interface","data","temporal","error-propagation","resource-contention","semantic"] as const
    const validators=Object.fromEntries(dimensions.map(dimension=>[dimension,`joint-${dimension}/v1`])) as Record<typeof dimensions[number],string>
    for(const dimension of dimensions)r.control.validators.register({id:`joint-${dimension}`,version:1,command:[process.execPath,"-e",`let text='';for await(const chunk of process.stdin)text+=chunk;const input=JSON.parse(text);const joint=input.evidence.find(e=>e.validatorVersion==='integration-input/v1').content;if(joint.observations.length!==2||joint.observations.some(o=>o.state.artifacts['result.txt']!=='done'))process.exit(2);if(${JSON.stringify(dimension)}==='data'&&!${integrationPass}&&(${integrationMode!=="repair"}||joint.boundary.version<2))process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    if(integrationMode==="repair")r.control.validators.register({id:"joint-repair",version:1,command:[process.execPath,"-e",`let text='';for await(const c of process.stdin)text+=c;const p=JSON.parse(text).evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;if(p.metadata.goal!=='Write done'||p.patch.revisedTasks.length!==2||p.metadata.expectations.some(item=>item.expectation.expectedArtifacts['result.txt']!=='done'))process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:2000,authorization:[{id:"operator",version:1}]})
    r.control.requests.register({...program,version:2,integrationValidators:validators,...(integrationMode==="repair"?{maxLocalRepairs:0,replanner:{...program.planner,validators:["joint-repair/v1"],maxAttempts:1}}:{})})
    r.control.requests.submit({id:"joint",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick()
    const second={...proposal[0]!,node:{...proposal[0]!.node,nodeId:"confirm",label:"Confirm",dependsOnNodeIds:["write"]}}
    accept(r,r.control.requests.get("joint")!.plannerGrant!,[proposal[0]!,second]);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const ids=r.control.requests.tasks("joint")
    const boundaryId=`integration:${r.control.requests.get("joint")!.planId}`
    assert.equal(r.store.control.head("planning_boundaries",boundaryId),1)
    writeFileSync(join(dir,"result.txt"),"done")
    for(let i=0;i<2;i++) {
      const grant=r.store.db.prepare("SELECT g.id FROM activation_grants g JOIN control_request_tasks t ON t.task_id=g.task_id WHERE t.request_id='joint' AND g.state='issued'").get()!
      assert.ok(grant,r.control.requests.get("joint")!.reason)
      accept(r,String(grant.id));await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:1500});r.control.requests.tick()
    }
    assert.notEqual(r.control.requests.get("joint")!.state,"completed")
    assert.equal(r.control.evidence.unresolved(boundaryId).length,7)
    await r.control.validators.run(dir,{maxJobs:10,maxDurationMs:10000});r.control.requests.tick()
    assert.equal(r.control.requests.get("joint")!.state==="completed",integrationPass,r.control.requests.get("joint")!.reason)
    assert.equal(r.control.evidence.unresolved(boundaryId).length,integrationPass?0:1)
    const count=r.store.db.prepare("SELECT count(*) n FROM validation_obligations WHERE entity_id=?").get(boundaryId)!.n
    assert.equal(count,7)
    for(let i=0;i<3;i++)r.engine.atomic(()=>r.control.boundaries.ingest())
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM validation_obligations WHERE entity_id=?").get(boundaryId)!.n,count)
    if(integrationMode==="repair") {
      const repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs").get()!.payload))
      assert.equal(r.control.evidence.unresolved(boundaryId).length,1)
      assert.ok(repair.lease.violatedInvariants.some((value:string)=>value.includes("Failed integration boundary")))
      const tasks=[proposal[0]!,second].map(item=>({...item,node:{...item.node,taskSpec:{...item.node.taskSpec,goal:"Write done with joint validation"}}}))
      const patch={revisedTasks:tasks.map(item=>({id:item.node.nodeId,dependencies:item.node.dependsOnNodeIds,objective:item.node.taskSpec.goal,expectedOutcome:item.node.outcome,decisionRefs:[]})),newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[],invalidatedAssumptions:[],expectedOutcomes:tasks.map(item=>({taskId:item.node.nodeId,value:item.node.outcome})),confidence:1}
      accept(r,repair.grantId,[{patch,tasks,summary:"Repair measured joint failure while preserving the requested outcome"}]);r.control.requests.tick()
      assert.equal(r.store.control.head("planning_boundaries",boundaryId),1)
      await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:1500});r.control.requests.tick()
      assert.equal(r.store.control.head("planning_boundaries",boundaryId),2,r.control.requests.get("joint")!.reason)
      assert.ok(r.control.requests.tasks("joint").every(id=>!ids.includes(id)))
      for(let i=0;i<2;i++) {
        r.control.requests.tick()
        const fresh=r.store.db.prepare("SELECT g.id FROM activation_grants g JOIN control_request_tasks t ON t.task_id=g.task_id WHERE t.request_id='joint' AND g.state='issued'").get()!
        assert.ok(fresh,r.control.requests.get("joint")!.reason)
        accept(r,String(fresh.id));await r.control.validators.run(dir,{maxJobs:1,maxDurationMs:1500})
      }
      assert.notEqual(r.control.requests.get("joint")!.state,"completed")
      assert.equal(r.control.evidence.unresolved(boundaryId).length,7)
      await r.control.validators.run(dir,{maxJobs:10,maxDurationMs:10000});r.control.requests.tick()
      assert.equal(r.control.requests.get("joint")!.state,"completed",r.control.requests.get("joint")!.reason)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='JointIntegrationFailed'").get()!.n,1)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM validation_obligations WHERE entity_id=?").get(boundaryId)!.n,14)
    }
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("질문 전에 실제로 읽은 파일이 바뀌면 원래 계획 답변을 새 입력으로 오인하지 않는다",()=>{
  const dir=mkdtempSync(join(tmpdir(),"question-file-input-")),r=createGraphRuntime(":memory:")
  try {
    const baseline=install(r),program={...baseline,version:2,maxClarifications:1}
    r.control.requests.register(program)
    r.control.requests.submit({id:"question",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}});r.control.requests.tick()
    const grantId=r.control.requests.get("question")!.plannerGrant!
    writeFileSync(join(dir,"result.txt"),"initial premise")
    accept(r,grantId,[],{unresolvedQuestions:[{kind:"user",question:"이 전제를 유지할까요?"}]},grant=>{r.control.files.read(grant,dir,"result.txt",digest(readFileSync(join(dir,"result.txt"),"utf8")),"question-input")})
    r.control.requests.tick()
    const question=r.control.requests.questions.pending("question")[0]!
    writeFileSync(join(dir,"result.txt"),"different premise")
    r.control.files.refreshNative(dir,{maxFiles:10,maxBytes:1000})
    assert.throws(()=>r.control.requests.questions.answer("question","user",question.id,[["유지"]]),/no longer pending/)
    assert.equal(r.control.requests.questions.get(question.id)!.state,"superseded")
    assert.equal(r.control.requests.get("question")!.state,"waiting","An unregistered input replan quota cannot authorize another call")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["repeat","quota","stale"] as const)test(`전문 검토 질문은 필수 의무와 읽기 전용 범위를 유지해 재개한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"specialist-question-")),database=join(dir,"graph.db");let r=createGraphRuntime(database)
  try {
    const base=install(r),role=r.store.control.get<RoleVersion>("role_versions","bounded",1)!
    r.control.validators.register({id:"review",version:1,command:[process.execPath,"-e",`let value='';for await(const chunk of process.stdin)value+=chunk;const data=JSON.parse(value);if(!data.evidence[0].content.output.findings.includes('verified review'))process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    r.control.roleLifecycle.installConfigured({...role,id:"qa",validators:["review/v1"],activationPolicy:{...role.activationPolicy,hardTriggers:["failure"],maxInvocationsPerTask:mode==="quota"?1:3}},"request QA quota fixture")
    const program={...base,version:2,maxClarifications:2,maxLocalRepairs:1,specialists:[{role:{id:"qa",version:1},profile:base.worker.profile}]};r.control.requests.register(program)
    r.control.requests.submit({id:"review-request",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("review-request")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("review-request")[0]!,worker=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!.id)
    writeFileSync(join(dir,"result.txt"),"wrong");accept(r,worker)
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
    const demand=()=>r.store.db.prepare("SELECT * FROM specialist_demands WHERE task_id=? AND mandatory=1").get(taskId)!
    const oldObligations:string[]=[]
    for(let round=0;round<(mode==="repeat"?2:1);round++) {
      const grantId=String(demand().grant_id)
      accept(r,grantId,[],{unresolvedQuestions:[{kind:"user",question:"어떤 기준으로 검토할까요?"}]})
      oldObligations.push(String(demand().obligation_id))
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
      const question=r.control.requests.questions.pending("review-request")[0]!
      assert.equal(question.target?.kind,"specialist")
      r.close();r=createGraphRuntime(database)
      if(mode==="stale") {
        r.control.evidence.retract(question.source,[{id:"operator",version:1}],"질문 근거 철회")
        assert.throws(()=>r.control.requests.questions.answer("review-request","user",question.id,[["기존 기준을 유지해 주세요"]]))
        assert.equal(demand().grant_id,grantId);return
      }
      r.control.requests.questions.answer("review-request","user",question.id,[["기존 기준을 유지해 주세요"]]);r.control.requests.tick()
      if(mode==="quota") {
        assert.equal(demand().grant_id,grantId)
        assert.equal(r.control.requests.get("review-request")!.state,"resuming")
        assert.ok(r.control.evidence.unresolved(taskId).some(item=>item.id===oldObligations[0]));return
      }
      assert.notEqual(demand().grant_id,grantId)
      assert.equal(demand().state,"issued")
      assert.equal(r.engine.requireTask(taskId).status,"implemented")
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(String(demand().grant_id))!.payload)) as ActivationGrant
      assert.deepEqual(grant.writeScopes,[]);assert.ok(!grant.allowedTools.includes("task_graph_cognitive_write"))
      assert.notEqual(r.control.requests.get("review-request")!.state,"completed")
      assert.ok(oldObligations.every(id=>!r.control.evidence.applicable(r.control.evidence.obligation(id)!)))
    }
    accept(r,String(demand().grant_id),[],{findings:["verified review"]})
    assert.equal(demand().state,"validating")
    assert.ok(r.control.evidence.unresolved(taskId).some(item=>item.kind==="role-output"))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(demand().state,"satisfied")
    assert.equal(r.control.evidence.unresolved(taskId).filter(item=>item.kind==="role-output").length,0)
    assert.notEqual(r.control.requests.get("review-request")!.state,"completed")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM specialist_question_resumptions").get()!.n,2)
    const repair=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(taskId)!
    assert.ok(repair)
    writeFileSync(join(dir,"result.txt"),"done");accept(r,String(repair.id))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.control.requests.get("review-request")!.state,"completed",r.control.requests.get("review-request")!.reason)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["pass","conflict","question","repair","adaptive"] as const)test(`L5는 서로 독립된 실제 검토와 합동 판정 없이는 완료되지 않는다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"adversarial-runtime-")),database=join(dir,"graph.db");let r=createGraphRuntime(database)
  try {
    const base=install(r),role=r.store.control.get<RoleVersion>("role_versions","bounded",1)!
    r.control.validators.register({id:"review",version:1,command:[process.execPath,"-e",`let value='';for await(const c of process.stdin)value+=c;const input=JSON.parse(value);if(!input.evidence[0].content.output.findings.length)process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    r.control.validators.register({id:"joint",version:1,command:[process.execPath,"-e",`let value='';for await(const c of process.stdin)value+=c;const input=JSON.parse(value),joint=input.evidence.find(e=>e.validatorVersion==='adversarial-joint/v1').content;if(joint.reviews.length!==2||new Set(joint.reviews.map(r=>r.role.id)).size!==2||joint.reviews.some(r=>!r.output.findings.includes('contract confirmed')))process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    if(mode==="repair")r.control.validators.register({id:"adversarial-repair",version:1,command:[process.execPath,"-e",`let value='';for await(const c of process.stdin)value+=c;const input=JSON.parse(value),p=input.evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;if(p.metadata.goal!=='Write done'||p.metadata.expectations[0].expectation.expectedArtifacts['result.txt']!=='done')process.exit(1);`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[{id:"operator",version:1}]})
    for(const id of ["qa","critic"])r.control.roleLifecycle.installConfigured({...role,id,validators:["review/v1"],activationPolicy:{...role.activationPolicy,maxInvocationsPerTask:2}},"adversarial reviewer fixture")
    const program:ControllerProgram={...base,version:2,maxClarifications:1,...(mode==="repair"?{maxLocalRepairs:0,replanner:{...base.planner,validators:["adversarial-repair/v1"],maxAttempts:1}}:{}),adversarialValidator:"joint/v1",worker:{...base.worker,profile:{...base.worker.profile,level:5,independentRoles:["qa","critic"]}},specialists:["qa","critic"].map(id=>({role:{id,version:1},profile:base.worker.profile}))}
    if(mode==="adaptive") {
      program.maxLocalRepairs=3
      program.worker={...base.worker,profile:{...base.worker.profile,id:"depth-2",level:2}}
      program.workerPrecision={profiles:([3,4,5] as const).map(level=>({...base.worker.profile,id:`depth-${level}`,level,independentRoles:level===5?["qa","critic"]:[]})),failureThresholds:[{minimumFailures:1,profileId:"depth-3"},{minimumFailures:2,profileId:"depth-4"},{minimumFailures:3,profileId:"depth-5"}]}
    }
    assert.throws(()=>r.control.requests.register({...program,adversarialValidator:undefined}),/L5 requires/)
    r.control.requests.register(program)
    r.control.requests.submit({id:"adversarial",sessionId:"user",text:"Write done",planOnly:false,program:{id:program.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("adversarial")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("adversarial")[0]!,worker=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=?").get(taskId)!.id)
    writeFileSync(join(dir,"result.txt"),mode==="adaptive"?"wrong":"done");accept(r,worker)
    if(mode==="adaptive")for(const level of [3,4,5]) {
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
      const next=r.store.db.prepare("SELECT id,payload FROM activation_grants WHERE task_id=? AND state='issued' AND json_extract(payload,'$.executionMode')='task'").get(taskId)!
      assert.ok(next,r.control.requests.get("adversarial")!.reason)
      const grant=JSON.parse(String(next.payload)) as ActivationGrant
      assert.equal(grant.profile.level,level)
      assert.equal(grant.profile.id,`depth-${level}`)
      const manifest=JSON.stringify(r.store.control.get("context_manifests",grant.context.id,grant.context.version))
      assert.ok(manifest.includes("measuredFailures"))
      writeFileSync(join(dir,"result.txt"),level===5?"done":"wrong");accept(r,String(next.id))
    }
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
    assert.equal(r.engine.requireTask(taskId).status,"implemented")
    assert.notEqual(r.control.requests.get("adversarial")!.state,"completed")
    let reviews=r.store.db.prepare("SELECT grant_id FROM specialist_demands WHERE task_id=? ORDER BY decision_id").all(taskId)
    assert.equal(reviews.length,2)
    r.close();r=createGraphRuntime(database)
    const reviewed:string[]=[]
    for(let i=0;i<reviews.length;i++) {
      let id=String(reviews[i]!.grant_id)
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
      assert.deepEqual(grant.writeScopes,[])
      assert.ok(!grant.allowedTools.includes("task_graph_cognitive_write"))
      if(mode==="question"&&i===0) {
        accept(r,id,[],{unresolvedQuestions:[{kind:"user",question:"검토 기준을 확인해 주세요."}]});r.control.requests.tick()
        const question=r.control.requests.questions.pending("adversarial")[0]!
        r.control.requests.questions.answer("adversarial","user",question.id,[["원래 계약을 검토해 주세요"]]);r.control.requests.tick()
        id=String(r.store.db.prepare("SELECT new_grant FROM specialist_question_resumptions WHERE old_grant=?").get(id)!.new_grant)
      }
      reviewed.push(id)
      accept(r,id,[],{findings:[["conflict","repair"].includes(mode)&&i===1?"contract contradicted":"contract confirmed"]})
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000})
      if(i===0)assert.notEqual(r.control.requests.get("adversarial")!.state,"completed")
    }
    for(let i=0;i<4;i++){await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()}
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM specialist_demands WHERE state='satisfied'").get()!.n,2)
    assert.equal(r.store.db.prepare("SELECT state FROM adversarial_reviews").get()!.state,["conflict","repair"].includes(mode)?"failed":"satisfied",JSON.stringify({jobs:r.store.db.prepare("SELECT payload,state FROM validation_jobs WHERE validator='joint/v1'").all(),events:r.store.db.prepare("SELECT type,payload FROM event_outbox WHERE type IN ('ValidatorFailed','ValidatorExecutionFailed')").all()}))
    assert.equal(r.control.requests.get("adversarial")!.state==="completed",!["conflict","repair"].includes(mode),r.control.requests.get("adversarial")!.reason)
    if(mode==="repair") {
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='AdversarialReviewFailed'").get()!.n,1)
      const repair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()!.payload))
      const node={...proposal[0]!.node,taskSpec:{...proposal[0]!.node.taskSpec,goal:"Write done after reconciled review"}}
      const patch={revisedTasks:[{id:node.nodeId,dependencies:[],objective:node.taskSpec.goal,expectedOutcome:node.outcome,decisionRefs:[]}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[],invalidatedAssumptions:[],expectedOutcomes:[{taskId:node.nodeId,value:node.outcome}],confidence:1}
      accept(r,repair.grantId,[{patch,tasks:[{node,expectation:proposal[0]!.expectation}],summary:"Resolve independently observed disagreement under the same contract"}]);r.control.requests.tick()
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick();r.control.requests.tick()
      const next=r.control.requests.tasks("adversarial")[0]!
      assert.notEqual(next,taskId)
      const nextWorker=String(r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(next)!.id)
      accept(r,nextWorker)
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()
      assert.notEqual(r.control.requests.get("adversarial")!.state,"completed")
      for(const row of r.store.db.prepare("SELECT grant_id FROM specialist_demands WHERE task_id=?").all(next))accept(r,String(row.grant_id),[],{findings:["contract confirmed"]})
      for(let i=0;i<4;i++){await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:3000});r.control.requests.tick()}
      assert.equal(r.control.requests.get("adversarial")!.state,"completed",r.control.requests.get("adversarial")!.reason)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM adversarial_reviews WHERE state='satisfied'").get()!.n,1)
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM adversarial_reviews WHERE state='failed'").get()!.n,1)
    }
    if(mode==="adaptive") {
      assert.equal(selectWorkerPrecision(r.store.control,program,taskId).measuredFailures,3)
      const measured=r.store.db.prepare("SELECT payload FROM task_observations WHERE json_extract(payload,'$.taskId')=?").all(taskId).map(row=>JSON.parse(String(row.payload))).find(observation=>observation.state.artifacts['result.txt']==='wrong')
      const aggregate=r.control.evidence.require(measured.evidence[0])
      const receipt=(aggregate.content as {observations:Array<{id:string;version:number}>}).observations[0]!
      r.control.evidence.retract(receipt,[{id:"operator",version:1}],"Withdraw a measured failure receipt")
      assert.throws(()=>selectWorkerPrecision(r.store.control,program,taskId),/unresolved historical failure evidence/)
    }
    for(const id of reviewed) {
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
      const decision=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_decisions WHERE id=?").get(grant.decisionId)!.payload))
      assert.equal(decision.signals.failure,null)
      assert.ok(decision.reasons.includes("registered mandatory review"))
    }
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("등록 입력은 계획 호출 전에 관찰되고 worker까지 고정되며 변경된 입력의 grant는 거절된다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"request-observed-input-")),r=createGraphRuntime(":memory:")
  try {
    const baseline=install(r),authorization=[{id:"operator",version:1}]
    writeFileSync(join(dir,"config.txt"),"before")
    r.control.validators.register({id:"request-config",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');console.log(JSON.stringify({status:'known',schemaVersion:'config/v1',value:fs.readFileSync('config.txt','utf8')}))`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
    const input={id:"config",version:1,kind:"environment" as const,schemaVersion:"config/v1",validator:"request-config/v1",authorization,maxAgeMs:60000}
    r.control.inputs.register(input)
    r.control.requests.register({...baseline,version:2,observedInputs:[input]})
    r.control.requests.submit({id:"input-request",sessionId:"user",text:"Write done",planOnly:false,program:{id:baseline.id,version:2}})
    r.control.requests.tick()
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,0)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    r.control.requests.tick()
    const request=r.control.requests.get("input-request")!,planner=request.plannerGrant!
    assert.ok(planner)
    accept(r,planner,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    const taskId=r.control.requests.tasks(request.id)[0]!
    assert.deepEqual(r.control.inputs.taskValues(taskId).map(value=>value.value),["before"])
    const row=r.store.db.prepare("SELECT id,payload FROM activation_grants WHERE task_id=? AND state='issued'").get(taskId)!
    assert.ok(row)
    const grant=JSON.parse(String(row.payload)) as ActivationGrant
    const context=r.store.control.get<import("../packages/task-cognition/src/model.ts").ContextManifest>("context_manifests",grant.context.id,1)!
    assert.ok(context.included.some(item=>item.required&&JSON.stringify(item.content).includes("before")))
    assert.ok(grant.inputVector.some(item=>item.entityId===taskId&&item.port==="environment"&&item.view==="runtime-platform"))
    assert.equal(grant.inputVector.some(item=>item.view==="legacy-complete-input"),false)
    assert.ok(grant.inputVector.some(item=>item.entityId==="observed-input:config:1"&&item.port==="environment"&&item.view==="config/v1"&&item.hash===r.control.inputs.current(input)!.hash))
    writeFileSync(join(dir,"config.txt"),"after")
    r.control.inputs.refresh(input)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(String(row.id))!.state,"fenced")
    assert.throws(()=>r.control.admission.claim(String(row.id),{worker:"late",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()}),/fenced/)
    assert.equal(r.engine.requireTask(request.taskId).goal,"Write done")
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["issued","claimed","quota","validation-stale","authorization"] as const)test(`계획 입력 변경은 원인을 병합하고 중단 확인·한도·기존 계획 검증을 보존한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"plan-input-recovery-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r),authorization=[{id:"operator",version:1}]
    writeFileSync(join(dir,"config.txt"),"one")
    r.control.validators.register({id:"planning-config",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');console.log(JSON.stringify({status:'known',schemaVersion:'config/v1',value:fs.readFileSync('config.txt','utf8')}))`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
    const input={id:"planning-input",version:1,kind:"environment" as const,schemaVersion:"config/v1",validator:"planning-config/v1",authorization,maxAgeMs:60000}
    r.control.inputs.register(input)
    r.control.requests.register({...baseline,version:2,maxInputReplans:mode==="quota"?0:1,observedInputs:[input]})
    r.control.requests.submit({id:"recovery",sessionId:"user",text:"Write done",planOnly:false,program:{id:baseline.id,version:2}})
    r.control.requests.tick();await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    const first=r.control.requests.get("recovery")!.plannerGrant!
    if(mode==="authorization") {
      const content={authorization:"withdraw obsolete program authorization"}
      const proof=r.control.evidence.put({id:"withdrawal",version:1,type:"user",source:"fixture operator",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
      r.control.evidence.retract(authorization[0]!,[proof],"program authority withdrawn")
      assert.equal(r.control.evidence.valid(authorization[0]!),false)
      assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(first)!.state,"fenced")
      assert.equal(r.control.requests.get("recovery")!.state,"waiting")
      return
    }
    if(mode==="claimed") {
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(first)!.payload)) as ActivationGrant
      r.control.admission.claim(first,{worker:"fixture-worker",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
      r.store.db.exec("CREATE TABLE grant_dispatches(grant_id TEXT PRIMARY KEY,state TEXT,owner TEXT,payload TEXT)")
      r.store.db.prepare("INSERT INTO grant_dispatches VALUES(?,'stopping','fixture','{}')").run(first)
    }
    if(mode==="validation-stale"){accept(r,first,proposal);r.control.requests.tick()}
    for(const value of ["two","three"]) {
      writeFileSync(join(dir,"config.txt"),value);r.control.inputs.refresh(input)
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000})
    }
    if(mode!=="validation-stale")assert.equal(r.control.requests.get("recovery")!.inputReplan!.generation,1,"Changes before a new issuance belong to the same recovery episode")
    r.close();r=createGraphRuntime(database)
    r.control.requests.tick()
    if(mode==="quota") {
      assert.equal(r.control.requests.get("recovery")!.state,"waiting")
      assert.equal(r.control.requests.get("recovery")!.plannerGrant,first)
      assert.equal(r.control.requests.tasks("recovery").length,0)
      return
    }
    if(mode==="claimed") {
      assert.equal(r.control.requests.get("recovery")!.plannerGrant,first,"A fenced worker still needs stop confirmation")
      r.store.db.prepare("UPDATE grant_dispatches SET state='failed',payload=? WHERE grant_id=?").run(JSON.stringify({stop:{stopped:true,evidence:"Fixture confirms previous worker stopped"}}),first)
      r.control.requests.tick()
    }
    const second=r.control.requests.get("recovery")!.plannerGrant!
    assert.notEqual(second,first)
    assert.equal(r.control.requests.get("recovery")!.inputReplan!.pending,false)
    const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(second)!.payload)) as ActivationGrant
    assert.equal(grant.generation,2)
    assert.equal(r.control.inputs.taskValues(grant.taskId)[0]!.value,"three")
    writeFileSync(join(dir,"config.txt"),"four");r.control.inputs.refresh(input)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    assert.equal(r.control.requests.get("recovery")!.state,"waiting")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants").get()!.n,2,"Input events cannot reset the registered replanning quota")
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["satisfied","mismatch","unknown","changed-after-preflight","expired","budget","retracted","restart"] as const)test(`L1 사전 검증은 충족된 leaf를 모델 없이 처리하고 불완전한 근거는 모델 판단으로 남긴다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"deterministic-preflight-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r)
    writeFileSync(join(dir,"result.txt"),mode==="mismatch"?"wrong":"done")
    if(mode==="unknown")rmSync(join(dir,"result.txt"))
    r.control.requests.register({...baseline,version:2,tokenLimit:mode==="budget"?33000:baseline.tokenLimit,deterministicPreflight:{maxAgeMs:mode==="expired"?1:60000}})
    r.control.requests.submit({id:"preflight-request",sessionId:"user",text:"Write done",planOnly:false,program:{id:baseline.id,version:2}})
    r.control.requests.tick();accept(r,r.control.requests.get("preflight-request")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("preflight-request")[0]!
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants WHERE task_id=?").get(taskId)!.n,0,"Deterministic preflight precedes any worker model grant")
    if(mode==="restart"){r.close();r=createGraphRuntime(database);r.control.requests.tick()}
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    const row=r.store.db.prepare("SELECT state,payload FROM activation_grants WHERE task_id=?").get(taskId)!
    assert.ok(row,JSON.stringify(r.control.requests.get("preflight-request")))
    const grant=JSON.parse(String(row.payload)) as ActivationGrant
    if(mode==="mismatch"||mode==="unknown"||mode==="expired") {
      assert.equal(grant.profile.level,3)
      assert.equal(row.state,"issued")
      assert.equal(r.engine.requireTask(taskId).status,"ready")
      return
    }
    assert.equal(grant.profile.level,1)
    assert.equal(row.state,"completed")
    const run=JSON.parse(String(r.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(grant.id)!.payload))
    assert.equal(run.usage.inputTokens,0);assert.equal(run.usage.outputTokens,0)
    assert.equal(r.store.db.prepare("SELECT spent FROM budget_reservations WHERE id=?").get(grant.id)!.spent,0)
    assert.notEqual(r.control.requests.get("preflight-request")!.state,"completed","Final independent verification is still required")
    if(mode==="changed-after-preflight")writeFileSync(join(dir,"result.txt"),"changed")
    if(mode==="retracted") {
      const preflight=JSON.parse(String(r.store.db.prepare("SELECT payload FROM task_preflights WHERE id=?").get(grant.preflight!.id)!.payload))
      const evidence=r.control.evidence.obligation(preflight.obligationId)!.evidence[0]!
      r.control.evidence.retract(evidence,[{id:"operator",version:1}],"withdraw deterministic observation")
    }
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick()
    assert.equal(r.control.requests.get("preflight-request")!.state==="completed",["satisfied","budget","restart"].includes(mode))
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM activation_grants WHERE task_id=? AND json_extract(payload,'$.profile.level')>=2").get(taskId)!.n,0)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["pass","new-fails","chain","receipt-withdrawn","quota","planner-role","validator-authorization"] as const)test(`검증 중 변경된 초안은 실제 검증된 대체 계획으로만 교체한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"draft-replacement-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const baseline=install(r),authorization=[{id:"operator",version:1}]
    writeFileSync(join(dir,"config.txt"),"one");writeFileSync(join(dir,"plan-gate.txt"),"fail")
    r.control.validators.register({id:"draft-input",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');console.log(JSON.stringify({status:'known',schemaVersion:'config/v1',value:fs.readFileSync('config.txt','utf8')}))`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
    const validatorAuthorization=r.control.evidence.put({id:"draft-validator-authority",version:1,type:"code",source:"fixture registration",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content:{validator:"draft-plan/v1"},contentHash:digest({validator:"draft-plan/v1"}),inputVector:[],confidence:1,expiresAt:null})
    r.control.validators.register({id:"draft-plan",version:1,command:[process.execPath,"-e",`const fs=require('node:fs'),data=JSON.parse(fs.readFileSync(0,'utf8')),proposal=data.evidence.find(e=>e.type==='agent').content;process.exit(fs.readFileSync('plan-gate.txt','utf8')==='pass'&&proposal.request==='Write done'&&proposal.proposal[0].node.taskSpec.goal==='Write done'?0:2)`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[validatorAuthorization]})
    const input={id:"draft-config",version:1,kind:"environment" as const,schemaVersion:"config/v1",validator:"draft-input/v1",authorization,maxAgeMs:60000}
    r.control.inputs.register(input)
    if(mode==="planner-role") {
      const role=r.store.control.get<RoleVersion>("role_versions",baseline.planner.role.id,1)!
      r.control.validators.register({id:"draft-role",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');process.exit(fs.readFileSync('plan-gate.txt','utf8')==='pass'?0:2)`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
      r.control.roleLifecycle.installConfigured({...role,version:2,validators:["draft-role/v1"]},"draft role revision fixture")
      baseline.planner={...baseline.planner,role:{id:role.id,version:2}}
    }
    r.control.requests.register({...baseline,version:2,observedInputs:[input],planValidators:["draft-plan/v1"],maxInputReplans:mode==="quota"?0:2})
    r.control.requests.submit({id:"draft-request",sessionId:"user",text:"Write done",planOnly:false,program:{id:baseline.id,version:2}})
    r.control.requests.tick();await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    accept(r,r.control.requests.get("draft-request")!.plannerGrant!,proposal);r.control.requests.tick()
    const old=r.control.requests.get("draft-request")!,oldObligation=r.control.evidence.obligation(old.obligationId!)!
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    assert.equal(r.control.evidence.satisfied(r.control.evidence.obligation(oldObligation.id)!),false)
    writeFileSync(join(dir,"config.txt"),"two");r.control.inputs.refresh(input)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    assert.equal(r.engine.store.findWorkPlan(old.planId!)!.state,"cancelled")
    assert.equal(r.control.evidence.applicable(oldObligation),true,"Retiring a draft cannot erase its failed validation")
    assert.throws(()=>r.engine.approveWorkPlan({planId:old.planId!,version:1,approvalSource:"stale draft"}))
    r.close();r=createGraphRuntime(database);r.control.requests.tick()
    if(mode==="quota") {
      assert.equal(r.control.requests.get("draft-request")!.state,"waiting")
      assert.equal(r.control.requests.tasks("draft-request").length,0)
      assert.equal(r.control.evidence.applicable(oldObligation),true)
      return
    }
    accept(r,r.control.requests.get("draft-request")!.plannerGrant!,proposal);r.control.requests.tick()
    let next=r.control.requests.get("draft-request")!
    assert.notEqual(next.planId,old.planId)
    assert.equal(r.control.evidence.applicable(oldObligation),true)
    if(mode==="chain") {
      writeFileSync(join(dir,"config.txt"),"three");r.control.inputs.refresh(input)
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick()
      accept(r,r.control.requests.get("draft-request")!.plannerGrant!,proposal);r.control.requests.tick()
      next=r.control.requests.get("draft-request")!
    }
    writeFileSync(join(dir,"plan-gate.txt"),mode==="new-fails"?"fail":"pass")
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000})
    assert.equal(r.control.evidence.applicable(oldObligation),mode==="new-fails")
    assert.equal(r.control.evidence.obligation(oldObligation.id)!.state,"failed","Historical failure is never rewritten into success")
    if(mode==="validator-authorization") {
      r.control.evidence.retract(validatorAuthorization,authorization,"withdraw validator authorization")
      assert.equal(r.control.evidence.applicable(oldObligation),true)
      assert.equal(r.control.evidence.independentlySatisfied(r.control.evidence.obligation(next.obligationId!)!),false)
    }
    if(mode==="receipt-withdrawn") {
      r.control.evidence.retract(r.control.evidence.obligation(next.obligationId!)!.evidence[0]!,authorization,"withdraw replacement validation")
      assert.equal(r.control.evidence.applicable(oldObligation),true)
    }
    r.control.requests.tick()
    const success=mode==="pass"||mode==="chain"||mode==="planner-role"
    assert.equal(r.control.requests.tasks("draft-request").length,success?1:0)
    if(success) {
      const id=r.control.requests.tasks("draft-request")[0]!,grant=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(id)!
      assert.ok(grant,JSON.stringify(r.control.requests.get("draft-request")))
      writeFileSync(join(dir,"result.txt"),"done");accept(r,String(grant.id))
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick()
      assert.equal(r.control.requests.get("draft-request")!.state,"completed")
    }
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["planning","draft","question","claimed","historical"] as const)test(`native 파일 변경은 현재 계획의 실제 읽기에만 복구를 연결한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"planner-file-change-")),r=createGraphRuntime(":memory:")
  try {
    const baseline=install(r)
    r.control.requests.register({...baseline,version:2,readScopes:["config.txt","result.txt"],maxInputReplans:2,maxClarifications:2})
    writeFileSync(join(dir,"config.txt"),"one")
    r.control.requests.submit({id:"file-request",sessionId:"user",text:"Write done",planOnly:false,program:{id:baseline.id,version:2}})
    r.control.requests.tick()
    const first=r.control.requests.get("file-request")!.plannerGrant!
    const observed=(grant:ActivationGrant)=>{
      r.control.files.read(grant,dir,"config.txt",digest(readFileSync(join(dir,"config.txt"),"utf8")),"read-1")
      r.control.files.read(grant,dir,"config.txt",digest(readFileSync(join(dir,"config.txt"),"utf8")),"read-2")
    }
    if(mode==="claimed") {
      const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(first)!.payload)) as ActivationGrant
      r.control.admission.claim(first,{worker:"file-reader",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()});observed(grant)
    }else accept(r,first,proposal,mode==="question"?{unresolvedQuestions:[{kind:"user",question:"Which configuration applies?"}]}:{},observed)
    if(mode==="draft"||mode==="question")r.control.requests.tick()
    const old=r.control.requests.get("file-request")!
    writeFileSync(join(dir,"config.txt"),"two")
    assert.equal(r.control.files.refreshNative(dir,{maxFiles:10,maxBytes:10000}),1)
    assert.equal(r.control.requests.get("file-request")!.state,"pending")
    if(mode==="draft")assert.equal(r.engine.store.findWorkPlan(old.planId!)!.state,"cancelled")
    if(mode==="question")assert.equal(r.control.requests.questions.history("file-request")[0]!.state,"superseded")
    r.control.requests.tick()
    if(mode==="claimed") {
      assert.equal(r.control.requests.get("file-request")!.plannerGrant,first)
      assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(first)!.state,"fenced")
      return
    }
    const next=r.control.requests.get("file-request")!.plannerGrant!
    assert.notEqual(next,first)
    if(mode==="historical") {
      writeFileSync(join(dir,"config.txt"),"three");r.control.files.refreshNative(dir,{maxFiles:10,maxBytes:10000})
      assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(next)!.state,"issued","A prior planner's reads cannot fence the new planner before it reads")
    }
    accept(r,next,proposal,{},observed);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick()
    const taskId=r.control.requests.tasks("file-request")[0]!
    assert.ok(taskId,JSON.stringify(r.control.requests.get("file-request")))
    assert.equal(r.control.requests.get("file-request")!.inputReplan!.generation,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["change","equal-refresh","retracted-restored","unknown","superseded","legacy","activating","activating-quota","activating-coalesced"] as const)test(`등록 입력의 변경·유효성 복구가 실제 지역 재계획과 대체 worker까지 이어진다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"registered-input-region-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database)
  try {
    const base=install(r),authorization=[{id:"operator",version:1}]
    r.control.validators.register({id:"region-input",version:1,command:[process.execPath,"-e",`const fs=require('node:fs'),value=fs.readFileSync('config.txt','utf8');console.log(JSON.stringify({status:value==='unknown'?'unknown':'known',schemaVersion:'config/v1',value:value==='unknown'?null:value}))`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
    r.control.validators.register({id:"input-repair",version:1,command:[process.execPath,"-e",`const fs=require('node:fs'),input=JSON.parse(fs.readFileSync(0,'utf8')),p=input.evidence.find(e=>e.validatorVersion==='scoped-proposal/v1').content;process.exit(p.metadata.goal==='Write done'&&p.metadata.expectations[0].expectation.expectedArtifacts['result.txt']==='done'&&p.patch.revisedTasks[0].objective==='Write done with current input'?0:2)`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization})
    const ref={id:"runtime-config",version:1}
    r.control.inputs.register({...ref,kind:"environment",schemaVersion:"config/v1",validator:"region-input/v1",authorization,maxAgeMs:60000})
    r.control.requests.register({...base,version:2,tokenLimit:250000,maxLocalRepairs:0,observedInputs:[ref],replanner:{...base.planner,validators:["input-repair/v1"],maxAttempts:mode==="activating-quota"?1:2}})
    writeFileSync(join(dir,"config.txt"),"one")
    r.control.requests.submit({id:"registered-region",sessionId:"user",text:"Write done",planOnly:false,program:{id:base.id,version:2}})
    r.control.requests.tick();await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    accept(r,r.control.requests.get("registered-region")!.plannerGrant!,proposal);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
    const oldTask=r.control.requests.tasks("registered-region")[0]!,plan=r.control.requests.get("registered-region")!.planId!
    if(mode.startsWith("activating")) {
      const row=r.store.db.prepare("SELECT payload FROM activation_grants WHERE task_id=? AND state='issued'").get(oldTask)!
      const grant=JSON.parse(String(row.payload)) as ActivationGrant,worker="old-live-worker"
      withTaskAdmission(r.engine,grant.id,worker,()=>new TaskScheduler(r.engine,1).claim(oldTask,{agent:"fixture",sessionId:worker}))
      r.control.admission.claim(grant.id,{worker,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:r.control.graph.hash(),generation:grant.generation,now:Date.now()})
    }
    if(mode==="retracted-restored") {
      const current=r.control.inputs.current(ref)!
      r.control.evidence.retract(r.control.evidence.obligation(current.obligationId)!.evidence[0]!,authorization,"withdraw stale input attestation")
      r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0,"Unresolved input cannot produce a new model context")
    }else writeFileSync(join(dir,"config.txt"),mode==="unknown"?"unknown":"two")
    r.control.inputs.refresh(ref);await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    if(mode==="unknown") {
      r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,0)
      writeFileSync(join(dir,"config.txt"),"two");r.control.inputs.refresh(ref)
      await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    }
    if(mode==="equal-refresh") {
      const old=r.control.inputs.current(ref)!
      r.control.inputs.refresh(ref);await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
      r.control.evidence.retract(r.control.evidence.obligation(old.obligationId)!.evidence[0]!,authorization,"retire the replaced observation")
      assert.equal(r.control.inputs.valid(ref),true)
    }
    if(mode==="legacy") {
      const source=JSON.parse(String(r.store.db.prepare("SELECT payload FROM event_outbox WHERE type='InputObservationChanged' AND entity_id=? ORDER BY sequence DESC LIMIT 1").get(oldTask)!.payload))
      delete source.payload.registeredInput
      r.engine.atomic(()=>r.store.control.event({...source,id:"legacy-registered-input"}))
    }
    r.close();r=createGraphRuntime(database);r.control.requests.tick()
    let row=r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()
    assert.ok(row,JSON.stringify(r.control.requests.get("registered-region")))
    let repair=JSON.parse(String(row.payload))
    if(mode==="legacy")assert.ok(repair.causes.includes("legacy-registered-input"))
    if(mode==="superseded") {
      const first=repair
      writeFileSync(join(dir,"config.txt"),"three");r.control.inputs.refresh(ref)
      await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick();r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT state FROM request_region_repairs WHERE id=?").get(first.id)!.state,"superseded")
      row=r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()!
      repair=JSON.parse(String(row.payload));assert.notEqual(repair.grantId,first.grantId)
    }
    assert.equal(r.control.inputs.taskValues(oldTask)[0]!.value,mode==="superseded"?"three":mode==="retracted-restored"?"one":"two")
    const node={...proposal[0]!.node,taskSpec:{...proposal[0]!.node.taskSpec,goal:"Write done with current input"}}
    const patch={revisedTasks:[{id:node.nodeId,dependencies:[],objective:node.taskSpec.goal,expectedOutcome:node.outcome,assumptionRefs:[],decisionRefs:[]}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[],invalidatedAssumptions:[],expectedOutcomes:[{taskId:node.nodeId,value:node.outcome}],confidence:1}
    accept(r,repair.grantId,[{patch,tasks:[{node,expectation:proposal[0]!.expectation}],summary:"Use the current registered input while preserving the requested outcome"}]);r.control.requests.tick()
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick();r.control.requests.tick()
    if(mode.startsWith("activating")) {
      assert.equal(r.store.db.prepare("SELECT state FROM request_region_repairs WHERE id=?").get(repair.id)!.state,"activating")
      const transition=r.engine.revisions.transitions(plan).find(t=>t.toVersion===2)!
      assert.equal(transition.state,"waiting");assert.equal(r.store.activePlanVersion(plan),1)
      writeFileSync(join(dir,"config.txt"),"three");r.control.inputs.refresh(ref)
      await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT state FROM request_region_repairs WHERE id=?").get(repair.id)!.state,"superseded")
      assert.equal(r.store.findPlanRevision(plan,2)!.state,"superseded")
      r.close();r=createGraphRuntime(database);r.control.requests.tick()
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,1,"No replacement grant before physical stop confirmation")
      if(mode==="activating-coalesced") {
        writeFileSync(join(dir,"config.txt"),"four");r.control.inputs.refresh(ref)
        await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000});r.control.requests.tick()
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,1)
      }
      for(const stop of r.engine.signals.stops().filter(stop=>stop.taskId===oldTask&&stop.state==="requested"))r.engine.signals.stopped(stop.id,stop.token,"actual fixture worker stopped")
      for(const stop of transition.stops)r.engine.revisions.confirmStopped(transition.id,stop.taskId,stop.token,"actual fixture worker stopped")
      assert.equal(r.engine.reconcilePlanTransition(transition.id).activated,undefined,"Stopped workers cannot activate the superseded revision")
      r.control.requests.tick();r.control.requests.tick()
      if(mode==="activating-quota") {
        assert.match(r.control.requests.get("registered-region")!.reason!,/quota exhausted/)
        assert.equal(r.store.db.prepare("SELECT count(*) n FROM request_region_repairs").get()!.n,1)
        assert.equal(r.store.activePlanVersion(plan),1)
        return
      }
      const nextRepair=JSON.parse(String(r.store.db.prepare("SELECT payload FROM request_region_repairs WHERE state='planning'").get()!.payload))
      assert.equal(nextRepair.lease.baseRevision,2);assert.equal(nextRepair.lease.sourceRevision,1)
      assert.notEqual(nextRepair.grantId,repair.grantId)
      assert.equal(r.control.inputs.taskValues(oldTask)[0]!.value,mode==="activating-coalesced"?"four":"three")
      accept(r,nextRepair.grantId,[{patch,tasks:[{node,expectation:proposal[0]!.expectation}],summary:"Replace the retired pending revision using the current execution inputs"}]);r.control.requests.tick()
      await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick();r.control.requests.tick()
      assert.equal(r.store.activePlanVersion(plan),3,r.control.requests.get("registered-region")!.reason)
      assert.deepEqual(r.store.planLinks(plan,2),[])
      assert.equal(r.engine.revisions.transitions(plan).find(t=>t.id===transition.id)!.state,"superseded")
    }
    assert.equal(r.store.findWorkPlan(plan)!.currentRevision,mode.startsWith("activating")?3:2,r.control.requests.get("registered-region")!.reason)
    const next=r.control.requests.tasks("registered-region")[0]!
    assert.notEqual(next,oldTask);assert.deepEqual(r.control.inputs.taskRefs(next),[ref])
    const worker=r.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='issued'").get(next)!
    assert.ok(worker,JSON.stringify(r.control.requests.get("registered-region")))
    writeFileSync(join(dir,"result.txt"),"done");accept(r,String(worker.id))
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:5000});r.control.requests.tick()
    assert.equal(r.control.requests.get("registered-region")!.state,"completed",r.control.requests.get("registered-region")!.reason)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
