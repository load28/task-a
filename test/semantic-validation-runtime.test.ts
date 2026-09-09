import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync,writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { digest } from "../packages/task-control/src/value.ts"
import { HostService } from "../packages/host-integration/src/service.ts"
import type { HarnessServer } from "../packages/opencode-harness/src/server.ts"
import type { PinnedExpectation } from "../packages/task-control/src/completion.ts"

function fixture(output?:string,delay=0) {
  const workspace=mkdtempSync(join(tmpdir(),"semantic-validator-")),r=createGraphRuntime(join(workspace,"graph.db"))
  const task=r.engine.createTask({title:"Read the output",goal:"Produce ready",writeScopes:["value.txt"],acceptanceCriteria:["value.txt contains ready"]})
  const criterion=task.acceptanceCriteria[0]!.id
  const content={requirement:"value.txt contains ready",criterion}
  const source=r.control.evidence.put({id:"requirement",version:1,type:"user",source:"acceptance fixture",producer:"test",validatorVersion:"user/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
  const script=output!==undefined?`console.log(${JSON.stringify(output)})`:`const fs=require('node:fs');const works=fs.readFileSync('value.txt','utf8')==='ready';console.log(JSON.stringify({state:{artifacts:{},contract:{format:'text'},behavior:{[process.env.CRITERION]:works},dependencies:{},goals:{target:works?'ready':'other'},risk:works?0:1},criticalViolations:works?[]:['output requirement']}))`
  r.control.validators.register({id:"semantic",version:1,command:[process.execPath,"-e",delay?`setTimeout(()=>{${script}},${delay})`:script],cwd:".",environment:{CRITERION:criterion},timeoutMs:1000,maxOutputBytes:4000,authorization:[source],output:"semantic-state"})
  r.control.pinExpectation({id:task.id,version:1,taskId:task.id,specHash:r.engine.signals.capture(task.id).specHash,expectedArtifacts:{},expectedInterface:{format:"text"},expectedBehavior:{[criterion]:true},expectedDependencies:{},expectedGoals:{target:"ready"},expectedRisk:0,evidence:[source]},{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.7,exit:.3},["semantic/v1"])
  const start=()=>r.engine.startTask(task.id)
  const implemented=()=>{writeFileSync(join(workspace,"value.txt"),"ready");r.engine.completeTask({taskId:task.id,attemptToken:r.store.currentAttempt(task.id)?.token,summary:"Output written"})}
  const run=()=>r.control.validators.run(workspace,{maxJobs:1,maxDurationMs:2000})
  return {workspace,r,task,start,implemented,run,close:()=>{r.close();rmSync(workspace,{recursive:true,force:true})}}
}

test("실행 전 고정한 validator가 실제 파일을 검사한 뒤 observation·오차·완료를 자동 연결한다",async()=>{
  const f=fixture()
  try {
    f.start()
    assert.equal(f.r.control.evidence.unresolved(f.task.id).length,1)
    assert.deepEqual(await f.run(),[])
    f.implemented();assert.equal(f.r.engine.requireTask(f.task.id).status,"implemented")
    assert.equal((await f.run())[0]!.state,"passed")
    assert.equal(f.r.engine.requireTask(f.task.id).status,"verified")
    const state=JSON.parse(String(f.r.store.db.prepare("SELECT payload FROM control_prediction_state WHERE task_id=?").get(f.task.id)!.payload))
    assert.equal(state.error.score,0);assert.equal(state.stability,"stable")
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM agent_runs").get()!.n,0)
  } finally {f.close()}
})

test("exit 0이어도 불완전 JSON이나 잘린 의미 상태는 검증 성공으로 받아들이지 않는다",async()=>{
  const f=fixture('{"state":{"risk":0}}')
  try {
    f.start();f.implemented()
    assert.equal((await f.run())[0]!.state,"failed")
    assert.equal(f.r.engine.requireTask(f.task.id).status,"implemented")
    assert.equal(f.r.control.evidence.unresolved(f.task.id).length,1)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM control_prediction_state").get()!.n,0)
  } finally {f.close()}
})

test("실제 상태의 unknown과 critical 위반은 완료를 차단한다",async()=>{
  const unknown=fixture(JSON.stringify({state:{artifacts:null,contract:null,behavior:null,dependencies:null,goals:null,risk:null},criticalViolations:[]}))
  try {
    unknown.start();unknown.implemented();await unknown.run()
    assert.equal(unknown.r.engine.requireTask(unknown.task.id).status,"implemented")
    assert.equal(unknown.r.engine.evaluateCompletion(unknown.task.id).complete,false)
  } finally {unknown.close()}
  const bad=fixture()
  try {
    bad.start();bad.implemented();writeFileSync(join(bad.workspace,"value.txt"),"broken");await bad.run()
    assert.equal(bad.r.engine.requireTask(bad.task.id).status,"implemented")
    const row=JSON.parse(String(bad.r.store.db.prepare("SELECT payload FROM control_prediction_state").get()!.payload))
    assert.deepEqual(row.error.criticalViolations,["output requirement"])
  } finally {bad.close()}
})

test("검증 실행 중 입력 변경이 생기면 늦은 observation은 격리하고 현행 완료에 쓰지 않는다",async()=>{
  const f=fixture(undefined,100)
  try {
    f.start();f.implemented()
    const work=f.run()
    f.r.engine.addRequirement(f.task.id,"Additional current constraint","constraint")
    await work
    assert.notEqual(f.r.engine.requireTask(f.task.id).status,"verified")
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM event_outbox WHERE type='ObservationRejected'").get()!.n,1)
    assert.equal(f.r.store.db.prepare("SELECT count(*) AS n FROM control_prediction_state").get()!.n,0)
  } finally {f.close()}
})

test("검증기 사이의 critical 충돌은 마지막 성공 관찰로 덮어쓰지 않는다",async()=>{
  const f=fixture()
  try {
    const prior=f.r.store.control.get<PinnedExpectation>("task_expectations",f.task.id,1)!
    const state={artifacts:{},contract:{format:"text"},behavior:prior.expectedBehavior,dependencies:{},goals:{target:"ready"},risk:0}
    const output={state,criticalViolations:["independent critical finding"]}
    f.r.control.validators.register({id:"critical",version:1,command:[process.execPath,"-e",`console.log(${JSON.stringify(JSON.stringify(output))})`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:4000,authorization:prior.evidence,output:"semantic-state"})
    f.r.control.pinExpectation({...prior,version:2},prior.predictionPolicy,["critical/v1","semantic/v1"])
    f.start();f.implemented()
    await f.r.control.validators.run(f.workspace,{maxJobs:2,maxDurationMs:3000})
    assert.equal(f.r.engine.requireTask(f.task.id).status,"implemented")
    const stateRow=JSON.parse(String(f.r.store.db.prepare("SELECT payload FROM control_prediction_state").get()!.payload))
    assert.deepEqual(stateRow.error.criticalViolations,["independent critical finding"])
  } finally {f.close()}
})

test("재실행은 새로운 검증 의무를 만들고 이전 attempt의 실패는 이력으로 보존한다",async()=>{
  const f=fixture()
  try {
    f.start();f.implemented();rmSync(join(f.workspace,"value.txt"));await f.run()
    const old=f.r.control.evidence.unresolved(f.task.id)[0]!
    assert.equal(old.state,"failed")
    f.r.engine.reopenTask(f.task.id,"Repair missing file");f.start();f.implemented()
    const pending=f.r.control.evidence.unresolved(f.task.id)
    assert.equal(pending.length,1);assert.notEqual(pending[0]!.id,old.id)
    await f.run()
    assert.equal(f.r.engine.requireTask(f.task.id).status,"verified")
    assert.equal(f.r.control.evidence.obligation(old.id)!.state,"failed")
  } finally {f.close()}
})

test("설정된 검증 예산으로 실제 HostService가 프로세스 검증과 완료 판정을 수행한다",async()=>{
  const f=fixture();f.start();f.implemented();f.r.close()
  const native:HarnessServer={prepare:async()=>{},createSession:async()=>"unused",submit:async()=>{throw new Error("No model request is permitted")},hasMessage:async()=>false,inspect:async()=>({state:"waiting",text:"",questions:[],permissions:[],activity:[]}),reply:async()=>{},cancel:async()=>{},readiness:async()=>({}),close:async()=>{}}
  const service=new HostService({version:1,directory:f.workspace,database:join(f.workspace,"graph.db"),socket:join(f.workspace,"host.sock"),workspaces:[{path:f.workspace}],maxRuns:1,autoContinue:false,validationBudget:{maxJobs:1,maxDurationMs:2000}},native)
  try {
    service.store.register(f.workspace);await service.wake();await service.close()
    const r=createGraphRuntime(join(f.workspace,"graph.db"))
    try {assert.equal(r.engine.requireTask(f.task.id).status,"verified");assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM agent_runs").get()!.n,0)}finally{r.close()}
  } finally {await service.close();rmSync(f.workspace,{recursive:true,force:true})}
})
