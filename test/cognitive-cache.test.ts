import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,writeFileSync,rmSync,symlinkSync,realpathSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { GrantDispatcher } from "../packages/task-control/src/dispatch.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type Signals,type RoleVersion,type ActivationGrant } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { controlCompletionMissing,currentInputVector } from "../packages/task-control/src/completion.ts"
import { observedReadsReusable } from "../packages/task-control/src/file-observations.ts"

function setup(r:ReturnType<typeof createGraphRuntime>) {
  const content={authorization:"Synthetic cognition with an actual independent native validator"}
  const authorization=r.control.evidence.put({id:"cache-operator",version:1,type:"code",source:"test controller",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
  r.control.validators.register({id:"cognition",version:1,command:[process.execPath,"-e",`const fs=require('node:fs');const input=JSON.parse(fs.readFileSync(0,'utf8')),output=input.evidence.find(e=>e.validatorVersion==='role-result/v1').content.output;process.exit(fs.readFileSync('gate.txt','utf8')==='pass'&&output.findings[0]==='supported'?0:2);`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
  const role:RoleVersion={id:"reviewer",version:1,name:"reviewer",purpose:"review",capabilities:[],prompt:"review",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:10},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:["cognition/v1"],allowedTools:[],lifecycle:"persistent",evidence:[authorization]}
  r.control.roleLifecycle.installConfigured(role,"cognitive cache fixture")
  const task=r.engine.createTask({title:"same input",goal:"same input"})
  let sequence=0,modelCalls=0
  const issue=(changedContext=false,taskId=task.id)=>{
    const policy={id:"baseline",version:1},snapshot=r.engine.signals.capture(taskId)
    const context=budgetContext({taskId,role,policy,items:changedContext?[{id:"changed",version:1,kind:"task",content:"new context",required:true,depth:0,relevance:1,level:0,dependencies:[],path:[],evidence:[]}]:[],scaffold:role.prompt,outputReservation:10,countTokens:s=>Buffer.byteLength(s)})
    r.store.control.put("context_manifests",context.id,1,context)
    const decision=r.control.admission.record(activation({taskId,eventId:`cache-event-${++sequence}`,eligible:true,role,policy,signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
    return r.control.admission.issue({decisionId:decision.id,taskId,specHash:snapshot.specHash,inputVector:currentInputVector(r.engine,taskId),graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy,context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"model-profile",level:3,provider:"test",model:"bounded",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},executionMode:"cognition",writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+60000,generation:1},"cache-account",1110)
  }
  const executor={execute:async(id:string)=>{
    const grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)!.payload)) as ActivationGrant
    assert.ok(grant.profile.level>=2,"A cached grant must not reach the model executor")
    modelCalls++
    r.control.admission.claim(id,{worker:id,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
    r.control.admission.submit(id,id,{taskId:grant.taskId,findings:["supported"],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:2,outputTokens:2,toolCalls:0,elapsedMs:1})
  },stop:async()=>({stopped:true,evidence:"No external process in the synthetic executor"}),close:async()=>{}}
  return {authorization,task,issue,executor,modelCalls:()=>modelCalls}
}

for(const mode of ["hit","context-miss","unvalidated","new-validation-fails","expired-before-delivery","fallback-budget"] as const)test(`L0가 검증된 인지를 재사용하고 모델 호출·예산·새 검증을 실제로 분리한다: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"cognitive-cache-")),r=createGraphRuntime(":memory:")
  let dispatcher:GrantDispatcher|undefined
  try {
    writeFileSync(join(dir,"gate.txt"),"pass")
    const f=setup(r);dispatcher=new GrantDispatcher(r.control,f.executor,1)
    f.issue();dispatcher.tick();await dispatcher.settle()
    assert.equal(f.modelCalls(),1)
    if(mode!=="unvalidated")await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    const second=f.issue(mode==="context-miss")
    const hit=!["context-miss","unvalidated"].includes(mode)
    assert.equal(second.profile.level,hit?0:3)
    assert.equal(r.store.db.prepare("SELECT reserved FROM budget_reservations WHERE id=?").get(second.id)!.reserved,hit?0:1100)
    if(["expired-before-delivery","fallback-budget"].includes(mode)) {
      const record=r.store.control.get<import("../packages/task-context/src/memory.ts").CognitiveRecord>("cognitive_records",second.reuse!.record.id,1)!
      const obligation=r.control.evidence.obligation((record.content as {obligationId:string}).obligationId)!
      r.control.evidence.retract(obligation.evidence[0]!,[f.authorization],"withdraw cached validation")
      if(mode==="fallback-budget") {
        const holder=r.engine.createTask({title:"holder",goal:"unrelated budget holder"})
        f.issue(true,holder.id)
        dispatcher.tick();await dispatcher.settle()
        assert.equal(f.modelCalls(),1)
        assert.equal(dispatcher.status().find(row=>row.grantId===second.id)!.state,"pending")
        assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(second.id)!.state,"issued")
        r.engine.atomic(()=>r.control.admission.fence(holder.id))
      }
    }
    if(mode==="new-validation-fails")writeFileSync(join(dir,"gate.txt"),"fail")
    dispatcher.tick();await dispatcher.settle()
    assert.equal(f.modelCalls(),["hit","new-validation-fails"].includes(mode)?1:2)
    const accepted=JSON.parse(String(r.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(second.id)!.payload))
    assert.equal(accepted.usage.inputTokens,["hit","new-validation-fails"].includes(mode)?0:2)
    assert.equal(accepted.usage.outputTokens,["hit","new-validation-fails"].includes(mode)?0:2)
    assert.ok(controlCompletionMissing(r.engine,[f.task.id]).some(reason=>reason.includes("role-output")),"A cache hit cannot remove the new independent validation")
    await r.control.validators.run(dir,{maxJobs:4,maxDurationMs:10000})
    if(mode==="hit")assert.equal(controlCompletionMissing(r.engine,[f.task.id]).filter(reason=>reason.includes("role-output")).length,0)
    if(mode==="new-validation-fails")assert.ok(controlCompletionMissing(r.engine,[f.task.id]).some(reason=>reason.includes("role-output")))
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM cognitive_cache_executions").get()!.n,["hit","new-validation-fails"].includes(mode)?1:0)
  }finally{await dispatcher?.close();r.close();rmSync(dir,{recursive:true,force:true})}
})

for(const mode of ["unchanged","changed","missing","alias","pod","oversized"] as const)test(`L0는 과거 파일 관찰을 실제 현재 입력으로 다시 확인한다: ${mode}`,()=>{
  const dir=realpathSync(mkdtempSync(join(tmpdir(),"cache-file-"))),r=createGraphRuntime(":memory:")
  try {
    const f=setup(r),grant=f.issue(),file=join(dir,"input.txt")
    writeFileSync(file,"original")
    r.control.admission.claim(grant.id,{worker:"file-reader",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
    r.control.files.read(grant,dir,"input.txt",digest("original"),"read-1",mode==="pod"?"pod":"native")
    if(mode==="changed")writeFileSync(file,"changed")
    if(mode==="missing"||mode==="alias")rmSync(file)
    if(mode==="alias"){writeFileSync(join(dir,"other.txt"),"original");symlinkSync(join(dir,"other.txt"),file)}
    if(mode==="oversized")writeFileSync(file,Buffer.alloc(4*1024*1024+1))
    assert.equal(observedReadsReusable(r.store.control,grant.id),mode==="unchanged")
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})

test("L0의 재시작과 완료 응답 유실은 모델이나 외부 완료 확인을 다시 호출하지 않는다",async()=>{
  const dir=mkdtempSync(join(tmpdir(),"cache-restart-")),database=join(dir,"graph.db")
  let r=createGraphRuntime(database),dispatcher:GrantDispatcher|undefined
  try {
    writeFileSync(join(dir,"gate.txt"),"pass")
    const f=setup(r);dispatcher=new GrantDispatcher(r.control,f.executor,1)
    f.issue();dispatcher.tick();await dispatcher.settle()
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:5000})
    const cached=f.issue();assert.equal(cached.profile.level,0)
    await dispatcher.close();r.close();r=createGraphRuntime(database)
    dispatcher=new GrantDispatcher(r.control,{execute:async()=>{assert.fail("No model execution for a durable cache hit")},completion:async()=>{assert.fail("No external publication for cognition reuse")},stop:async()=>({stopped:true,evidence:"fixture"}),close:async()=>{}},1)
    dispatcher.tick();await dispatcher.settle()
    assert.equal(dispatcher.status().find(row=>row.grantId===cached.id)!.state,"completed")
    r.store.db.prepare("UPDATE grant_dispatches SET state='dispatching',owner='lost-controller' WHERE grant_id=?").run(cached.id)
    await dispatcher.recover()
    assert.equal(dispatcher.status().find(row=>row.grantId===cached.id)!.state,"completed")
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM cognitive_cache_executions WHERE grant_id=?").get(cached.id)!.n,1)
  }finally{await dispatcher?.close();r.close();rmSync(dir,{recursive:true,force:true})}
})
