import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { KubectlApi } from "../packages/task-instances/src/kubectl.ts"
import { validatorPod } from "../packages/task-control/src/pod-validation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PodAuthority } from "../packages/task-control/src/pod-authority.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { digest } from "../packages/task-control/src/value.ts"
import type { TaskInstance } from "../packages/task-instances/src/types.ts"

const context=process.env.TASK_INSTANCE_CONTEXT,image=process.env.TASK_INSTANCE_IMAGE
if(!context?.startsWith("kind-")||!image)throw new Error("An explicit local kind context and preloaded verification image are required")
const namespace=`grant-validation-${randomUUID().slice(0,8)}`,api=new KubectlApi(context,namespace)
const wait=async(check:()=>Promise<boolean>,label:string)=>{
  const until=Date.now()+90000
  while(Date.now()<until){if(await check())return;await new Promise(resolve=>setTimeout(resolve,250))}
  throw new Error(`Timed out: ${label}`)
}
const createdNamespace=await api.command(["create","namespace",namespace,"-o","json"])
const runtime=createGraphRuntime(":memory:"),authority=new PodAuthority(runtime.control,1)
try {
  await api.create("persistentvolumeclaims",{apiVersion:"v1",kind:"PersistentVolumeClaim",metadata:{name:"result",namespace},spec:{accessModes:["ReadWriteOnce"],resources:{requests:{storage:"64Mi"}}}})
  const instance=await api.create("taskinstances",{apiVersion:"tasks.task-agent.dev/v1alpha1",kind:"TaskInstance",metadata:{name:"fixture",namespace},spec:{taskId:"fixture",image,desiredState:"Suspended",run:1,storage:{size:"64Mi"},deletionPolicy:"Retain",stages:[{id:"fixture",command:["node","-e","process.exit(0)"]}]}}) as TaskInstance
  await api.create("pods",{apiVersion:"v1",kind:"Pod",metadata:{name:"seed",namespace},spec:{restartPolicy:"Never",automountServiceAccountToken:false,securityContext:{runAsUser:1000,runAsGroup:1000,fsGroup:1000},containers:[{name:"seed",image,imagePullPolicy:"Never",command:["node","--input-type=module","-e","import {mkdirSync,writeFileSync} from 'node:fs';import {snapshotCode} from '/app/packages/task-snapshots/src/index.ts';mkdirSync('/data/workspace',{recursive:true});writeFileSync('/data/workspace/result.txt','done');console.log(JSON.stringify({snapshotHash:snapshotCode('/data/workspace').hash}));"],env:[{name:"NODE_NO_WARNINGS",value:"1"}],volumeMounts:[{name:"result",mountPath:"/data"}]}],volumes:[{name:"result",persistentVolumeClaim:{claimName:"result"}}]}})
  await wait(async()=>{
    const pod=await api.get("pods","seed")
    if(pod?.status?.phase==="Failed")throw new Error("Fixture workspace preparation failed")
    return pod?.status?.phase==="Succeeded"
  },"workspace preparation")
  const seed=(await api.get("pods","seed"))!,snapshot=JSON.parse(await api.logs("seed","seed",4096))
  const state={artifacts:{"result.txt":"done"},contract:{},behavior:{correct:true},dependencies:{},goals:{},risk:0}
  const command=["/usr/local/bin/node","-e",`const fs=require('node:fs');if(fs.readFileSync('result.txt','utf8')!=='done')process.exit(1);if(process.env.TASK_GRANT_BINDING||process.env.OPENAI_API_KEY||fs.existsSync('/var/run/secrets/kubernetes.io/serviceaccount/token'))process.exit(2);try{fs.writeFileSync('result.txt','changed');process.exit(3)}catch(e){if(!['EROFS','EACCES'].includes(e.code))throw e}const net=require('node:net');const s=net.createServer();s.on('error',e=>{if(e.code!=='EPERM')process.exit(4);console.log(JSON.stringify({state:${JSON.stringify(state)},criticalViolations:[]}))});s.listen(9999,'127.0.0.1');`]
  const content={fixture:"synthetic model phase; actual isolated validator"},authorization=runtime.control.evidence.put({id:"fixture",version:1,type:"user",source:"local acceptance fixture",producer:"smoke-granted-validation",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
  runtime.control.validators.register({id:"isolated",version:1,command,cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:4096,authorization:[authorization],output:"semantic-state"})
  const task=runtime.engine.createTask({title:"Validate actual Pod output",goal:"File contains done",writeScopes:["result.txt"],acceptanceCriteria:[{id:"correct",description:"File contains done"}]})
  runtime.control.pinExpectation({id:task.id,version:1,taskId:task.id,specHash:runtime.engine.signals.capture(task.id).specHash,expectedArtifacts:state.artifacts,expectedInterface:state.contract,expectedBehavior:state.behavior,expectedDependencies:state.dependencies,expectedGoals:state.goals,expectedRisk:0,evidence:[authorization]},{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},["isolated/v1"])
  const role:RoleVersion={id:"fixture",version:1,name:"Fixture",purpose:"Synthetic bounded model phase",capabilities:[],prompt:"Return structured output",activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:10000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"temporary",evidence:[authorization]},policy={id:"fixture",version:1}
  runtime.store.control.put("role_versions",role.id,1,role)
  const manifest=budgetContext({taskId:task.id,role,policy,items:[],scaffold:role.prompt,outputReservation:1000,countTokens:value=>Buffer.byteLength(value)})
  runtime.store.control.put("context_manifests",manifest.id,1,manifest)
  const decision=runtime.control.admission.record({id:"fixture",eventId:"fixture",taskId:task.id,role:{id:role.id,version:1},policy,signals:Object.fromEntries(FEATURES.map(feature=>[feature,null])) as Signals,score:0,hard:[],action:"activate",reasons:["explicit synthetic test"],timestamp:Date.now()})
  const inputs=runtime.engine.signals.capture(task.id)
  const grant=runtime.control.admission.issue({taskId:task.id,decisionId:decision.id,specHash:inputs.specHash,inputVector:[{entityId:task.id,port:"inputs",view:"legacy-complete-input",version:1,hash:inputs.digest}],graphHash:runtime.control.graph.hash(),role:{id:role.id,version:1},policy,context:{id:manifest.id,version:1},contextHash:manifest.hash,profile:{id:"synthetic",level:3,provider:"fixture",model:"fixture",maxInputTokens:10000,maxOutputTokens:1000,maxToolCalls:1,timeoutMs:90000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},writeScopes:["result.txt"],allowedTools:[],obligations:[],expiresAt:Date.now()+90000,generation:1,executionMode:"task"},"fixture",11000)
  const binding=authority.register(grant.id,"http://127.0.0.1:1"),sessionId="synthetic-model"
  await authority.call(binding.token,"/claim",{sessionId,taskId:task.id,grantId:grant.id,generation:1})
  await authority.call(binding.token,"/authorize",{sessionId,operation:{kind:"model",inputBytes:1,systemBytes:1}})
  await authority.call(binding.token,"/authorize",{sessionId,operation:{kind:"model",reserveModel:true}})
  await authority.call(binding.token,"/record-model",{sessionId,messageId:"synthetic",usage:{inputTokens:1,outputTokens:1}})
  await authority.call(binding.token,"/freeze",{sessionId,output:{taskId:task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false}})
  const validators=authority.validationPlan(grant.id)
  const pod=validatorPod({grant,instance:{...instance,status:{...instance.status,volumeName:"result"}},modelPod:seed,image,snapshotHash:snapshot.snapshotHash,validators,budget:{maxJobs:1,maxDurationMs:1000}})
  const created=await api.create("pods",pod)
  await wait(async()=>{
    const current=await api.get("pods",pod.metadata.name)
    assert.equal(current?.metadata.uid,created.metadata.uid)
    if(current?.status?.phase==="Failed")throw new Error(await api.logs(pod.metadata.name,"validator",8192))
    return current?.status?.phase==="Succeeded"
  },"independent validation")
  const result=JSON.parse(await api.logs(pod.metadata.name,"validator",16384)),current=(await api.get("pods",pod.metadata.name))!
  assert.equal(current.status.containerStatuses[0].imageID,seed.status.containerStatuses[0].imageID)
  assert.equal(result.snapshotHash,snapshot.snapshotHash)
  assert.equal(result.receipts.length,1);assert.equal(result.receipts[0].exitCode,0)
  assert.deepEqual(JSON.parse(result.receipts[0].stdout),{state,criticalViolations:[]})
  assert.equal(runtime.engine.requireTask(task.id).status,"running")
  authority.finishValidated(grant.id,result.receipts)
  assert.equal(runtime.engine.requireTask(task.id).status,"verified")
  process.stdout.write(JSON.stringify({passed:true,context,namespace,modelCalls:0,checks:["actual PVC read-only mount","no model or Kubernetes credentials","inherited kernel network denial","same image identity","stable workspace snapshot","actual semantic validator receipt","controller adoption from sealed synthetic model result to verified task"],result})+"\n")
}finally {
  await authority.close();runtime.close()
  await api.command(["delete","--raw",`/api/v1/namespaces/${namespace}`,"-f","-"],{apiVersion:"v1",kind:"DeleteOptions",preconditions:{uid:createdNamespace.metadata.uid}})
}
