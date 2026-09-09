import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync,readFileSync,symlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PodAuthority } from "../packages/task-control/src/pod-authority.ts"
import { PodClient } from "../packages/task-control/src/pod-client.ts"
import { PodGateway } from "../packages/task-control/src/pod-gateway.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { validateSpec,type InstanceSpec } from "../packages/task-instances/src/types.ts"
import { podFor } from "../packages/task-instances/src/controller.ts"
import { stageKey } from "../packages/task-instances/src/stage-cache.ts"
import { runInstance } from "../packages/task-instances/src/worker.ts"
import { validatorPod } from "../packages/task-control/src/pod-validation.ts"

function fixture(taskMode=false) {
  const r=createGraphRuntime(":memory:"),task=r.engine.createTask({title:"Pod",goal:"Pod",writeScopes:["output.txt"]}),policy={id:"fixture",version:1}
  const role:RoleVersion={id:"pod",version:1,name:"Pod",purpose:"Test adapter",capabilities:[],prompt:"Return structured output",activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:30000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:["task_graph_cognitive_context","task_graph_cognitive_read","task_graph_cognitive_write"],lifecycle:"temporary",evidence:[]}
  r.store.control.put("role_versions",role.id,1,role)
  const context=budgetContext({taskId:task.id,role,policy,items:[],scaffold:role.prompt,outputReservation:1000,countTokens:text=>Buffer.byteLength(text)})
  r.store.control.put("context_manifests",context.id,1,context)
  const decision=r.control.admission.record({id:"decision",eventId:"event",taskId:task.id,role:{id:role.id,version:1},policy,signals:Object.fromEntries(FEATURES.map(feature=>[feature,null])) as Signals,score:0,hard:[],action:"activate",reasons:["explicit fixture"],timestamp:Date.now()})
  const snapshot=r.engine.signals.capture(task.id)
  const grant=r.control.admission.issue({decisionId:decision.id,taskId:task.id,specHash:snapshot.specHash,inputVector:[{entityId:task.id,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy,context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"fixture",level:3,provider:"test",model:"test",maxInputTokens:32000,maxOutputTokens:1000,maxToolCalls:5,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},writeScopes:taskMode?["output.txt"]:[],readScopes:["output.txt","alias.txt"],allowedTools:role.allowedTools,obligations:[],expiresAt:Date.now()+60000,generation:1,executionMode:taskMode?"task":"cognition"},"test",100000)
  return {r,grant}
}

test("Pod HTTP capability는 한 grant만 claim하며 미계측 결과·재실행·취소 후 접근을 차단한다",async()=>{
  const {r,grant}=fixture(),authority=new PodAuthority(r.control,1)
  try {
    const port=await authority.listen({host:"127.0.0.1",port:0}),binding=authority.register(grant.id,`http://127.0.0.1:${port}`),client=new PodClient(binding)
    await assert.rejects(client.request("/claim",{sessionId:"pod-session",taskId:"foreign",grantId:grant.id,generation:1}),/identity mismatch/)
    await client.request("/claim",{sessionId:"pod-session",taskId:grant.taskId,grantId:grant.id,generation:1})
    await assert.rejects(client.request("/claim",{sessionId:"pod-session",taskId:grant.taskId,grantId:grant.id,generation:1}),/consumed/)
    const output={taskId:grant.taskId,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false}
    await assert.rejects(client.request("/finish",{sessionId:"pod-session",output,validations:[]}),/receipts are incomplete/)
    await client.authorize("pod-session",{kind:"model",inputBytes:10,systemBytes:10})
    await client.authorize("pod-session",{kind:"model",reserveModel:true})
    await client.recordModel("pod-session","step",{inputTokens:10,outputTokens:10})
    const finish={sessionId:"pod-session",output,validations:[]}
    assert.deepEqual(await client.request("/finish",finish),{accepted:true})
    assert.deepEqual(await client.request("/finish",finish),{accepted:true})
    await assert.rejects(client.request("/finish",{...finish,output:{...output,confidence:0}}),/identity conflict/)
    await assert.rejects(client.authorize("pod-session",{kind:"model"}),/consumed or fenced/)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM agent_runs").get()!.n,1)
  }finally{await authority.close();r.close()}
})

test("Pod 파일 gateway는 live grant·CAS·scope·alias를 실제 파일에서 검사한다",async()=>{
  const {r,grant}=fixture(true),authority=new PodAuthority(r.control,1),dir=mkdtempSync(join(tmpdir(),"pod-gateway-"))
  try {
    const port=await authority.listen({host:"127.0.0.1",port:0}),binding=authority.register(grant.id,`http://127.0.0.1:${port}`),client=new PodClient(binding)
    await client.request("/claim",{sessionId:"pod-session",taskId:grant.taskId,grantId:grant.id,generation:1})
    const gateway=new PodGateway(client,dir,join(dir,"receipts")),identity={grantId:grant.id,workerSessionId:"pod-session",authorizationCallId:"write"}
    const input={...identity,path:"output.txt",content:"actual",previousHash:null}
    assert.deepEqual(await gateway.execute("cognitive_write",input),{path:"output.txt",hash:digest("actual")})
    assert.equal(readFileSync(join(dir,"output.txt"),"utf8"),"actual")
    assert.deepEqual(await gateway.execute("cognitive_write",input),{path:"output.txt",hash:digest("actual")})
    await assert.rejects(gateway.execute("cognitive_write",{...input,authorizationCallId:"stale",content:"changed"}),/changed after read/)
    symlinkSync(join(dir,"output.txt"),join(dir,"alias.txt"))
    await assert.rejects(gateway.execute("cognitive_read",{...identity,authorizationCallId:"alias",path:"alias.txt"}),/alias/)
    const read={...identity,authorizationCallId:"read",path:"output.txt"}
    assert.equal((await gateway.execute("cognitive_read",read) as {content:string}).content,"actual")
    await gateway.execute("cognitive_read",read)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM observed_file_reads WHERE grant_id=?").get(grant.id)!.n,1)
    await assert.rejects(client.request("/observe-read",{sessionId:"pod-session",callId:"read",path:"output.txt",hash:digest("forged")}),/identity conflict/)
    await assert.rejects(client.request("/observe-read",{sessionId:"pod-session",callId:"missing",path:"output.txt",hash:digest("actual")}),/matching admitted/)
    r.control.admission.fence(grant.taskId)
    await assert.rejects(gateway.execute("cognitive_write",input),/fenced/)
    assert.equal(readFileSync(join(dir,"output.txt"),"utf8"),"actual")
  }finally{await authority.close();r.close();rmSync(dir,{recursive:true,force:true})}
})

test("Pod activation은 고정 adapter·Secret·deadline·복구 identity에 묶인다",async()=>{
  const spec:InstanceSpec={taskId:"physical",image:"worker:test",desiredState:"Running",run:1,storage:{size:"1Gi"},deletionPolicy:"Retain",stages:[{id:"cognition",command:["node","/app/scripts/granted-instance-stage.ts"]}],activation:{grantId:"grant",taskId:"logical",generation:1,authoritySecret:"grant-secret",expiresAt:Date.now()+60000}}
  validateSpec(spec)
  assert.throws(()=>validateSpec({...spec,stages:[{id:"raw",command:["opencode","run","unbounded"]}]}),/fixed bounded adapter/)
  const pod=podFor({metadata:{name:"instance",uid:"uid",namespace:"test"},spec})
  assert.ok(pod.spec.activeDeadlineSeconds>0&&pod.spec.activeDeadlineSeconds<=60)
  assert.deepEqual(pod.spec.containers[0].envFrom,[{secretRef:{name:"grant-secret"}}])
  assert.notEqual(stageKey(spec,spec.stages[0]!,{}),stageKey({...spec,activation:{...spec.activation!,grantId:"new"}},spec.stages[0]!,{}))
  const dir=mkdtempSync(join(tmpdir(),"expired-pod-"))
  try{await assert.rejects(runInstance({...spec,activation:{...spec.activation!,expiresAt:1}},dir,"uid"),/expired before execution or restore/)}finally{rmSync(dir,{recursive:true,force:true})}
})

test("모델 Pod는 봉인 후 도구를 실행하거나 자기 검증 결과를 채택할 수 없다",async()=>{
  const {r,grant}=fixture(true),authority=new PodAuthority(r.control,1)
  try {
    const binding=authority.register(grant.id,"http://127.0.0.1:1"),sessionId="model"
    await authority.call(binding.token,"/claim",{sessionId,taskId:grant.taskId,grantId:grant.id,generation:1})
    await authority.call(binding.token,"/authorize",{sessionId,operation:{kind:"model",inputBytes:10,systemBytes:10}})
    await authority.call(binding.token,"/authorize",{sessionId,operation:{kind:"model",reserveModel:true}})
    await authority.call(binding.token,"/record-model",{sessionId,messageId:"step",usage:{inputTokens:10,outputTokens:10}})
    const output={taskId:grant.taskId,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false}
    const input={sessionId,output}
    assert.deepEqual(await authority.call(binding.token,"/freeze",input),{sealed:true})
    assert.deepEqual(await authority.call(binding.token,"/freeze",input),{sealed:true})
    await assert.rejects(authority.call(binding.token,"/freeze",{...input,output:{...output,confidence:0}}),/identity conflict/)
    await assert.rejects(authority.call(binding.token,"/authorize",{sessionId,operation:{kind:"model"}}),/sealed/)
    await assert.rejects(authority.call(binding.token,"/finish",{...input,validations:[]}),/Only the controller/)
    assert.throws(()=>authority.finishValidated(grant.id,[]),/pinned semantic validation/)
    assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)!.state,"claimed")
    assert.equal(r.engine.requireTask(grant.taskId).status,"running")
  }finally{await authority.close();r.close()}
})

test("독립 검증 Pod는 자격 증명 없이 읽기 전용 결과 볼륨과 네트워크 차단 launcher만 받는다",()=>{
  const {r,grant}=fixture(true)
  try {
    const instance={apiVersion:"tasks.task-agent.dev/v1alpha1",kind:"TaskInstance",metadata:{name:"model",namespace:"test",uid:"instance-uid"},spec:{taskId:"physical",image:"worker:test",desiredState:"Running" as const,run:1,storage:{size:"1Gi"},deletionPolicy:"Retain" as const,stages:[{id:"cognition",command:["node","/app/scripts/granted-instance-stage.ts"]}],envSecret:"model-credentials"},status:{volumeName:"results"}} as any
    const pod=validatorPod({grant,instance,modelPod:{metadata:{name:"model",uid:"pod-uid"},spec:{nodeName:"local-node"}},image:"worker:test",snapshotHash:"snapshot",validators:[],budget:{maxJobs:1,maxDurationMs:1000}})
    const container=pod.spec.containers[0]
    assert.equal(pod.spec.automountServiceAccountToken,false)
    assert.equal(container.envFrom,undefined)
    assert.equal(container.command[0],"/usr/local/bin/task-validator-no-network")
    assert.equal(container.securityContext.readOnlyRootFilesystem,true)
    assert.deepEqual(container.volumeMounts[0],{name:"source",mountPath:"/data/workspace",subPath:"workspace",readOnly:true})
    assert.equal(pod.spec.volumes[0].persistentVolumeClaim.readOnly,true)
    assert.ok(!JSON.stringify(pod).includes("model-credentials"))
  }finally{r.close()}
})
