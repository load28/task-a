import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { canonical,digest } from "../packages/task-control/src/value.ts"

const policy={validator:"region-cost/v1",candidateLimit:8,evaluationBudget:8,costUnit:"work-units",calibration:{version:1,minimumSamples:2,maximumRelativeError:.5,inputTokensPerUnit:100,outputTokensPerUnit:50,toolCallsPerUnit:1,elapsedMsPerUnit:1000}}

test("실측 지역 비용은 등록 단위와 표본·오차 경계를 통과한 뒤에만 선택 비용을 보정한다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"region-cost-")),database=join(directory,"graph.db")
  let runtime=createGraphRuntime(database)
  try {
    const key=runtime.control.regionCosts.key(policy)
    runtime.store.db.prepare("INSERT INTO region_cost_calibration_samples VALUES(?,?,?,?,?,?,?,?)").run("s1",key,"q1","r1",10,12,.2,"{}")
    assert.deepEqual(runtime.control.regionCosts.summary(policy),{key,samples:1,stable:false,factor:1,maximumObservedRelativeError:.2,reason:"insufficient completed repair samples"})
    runtime.store.db.prepare("INSERT INTO region_cost_calibration_samples VALUES(?,?,?,?,?,?,?,?)").run("s2",key,"q2","r2",20,30,.3333333333333333,"{}")
    assert.deepEqual(runtime.control.regionCosts.summary(policy),{key,samples:2,stable:true,factor:1.5,maximumObservedRelativeError:.3333333333333333,reason:"observed execution costs are within the registered error bound"})
    runtime.close();runtime=createGraphRuntime(database)
    assert.equal(runtime.control.regionCosts.summary(policy)?.factor,1.5)
    const strict={...policy,calibration:{...policy.calibration,version:2,maximumRelativeError:.1}}
    assert.equal(runtime.control.regionCosts.summary(strict)?.samples,0)
    assert.throws(()=>runtime.control.regionCosts.summary({...policy,calibration:{...policy.calibration,elapsedMsPerUnit:0}}),/Invalid region cost calibration policy/)
  }finally{runtime.close();rmSync(directory,{recursive:true,force:true})}
})

test("완료된 지역 복구의 실제 사용량은 불변 비용 표본과 다음 선택의 보정 계수가 된다",()=>{
  const runtime=createGraphRuntime(":memory:")
  try {
    const task=runtime.engine.createTask({title:"보정",goal:"보정",writeScopes:[]}),requestId="request",grantId="replanner",repairId="repair",now=Date.now()
    const authorization=runtime.control.evidence.put({id:"completion",version:1,type:"runtime",source:"fixture",producer:"fixture",validatorVersion:"fixture/v1",timestamp:now,content:{passed:true},contentHash:digest({passed:true}),inputVector:[],confidence:1,expiresAt:null})
    const registered={id:"program",version:1,replanner:{selection:{...policy,calibration:{...policy.calibration,minimumSamples:1}}}}
    runtime.store.control.put("controller_programs","program",1,registered)
    const request={id:requestId,sessionId:"session",text:"보정",planOnly:false,taskId:task.id,program:{id:"program",version:1},evidence:authorization,state:"completed"}
    runtime.store.db.prepare("INSERT INTO controlled_tasks VALUES(?,?)").run(task.id,requestId)
    runtime.store.db.prepare("INSERT INTO control_requests VALUES(?,?,?,?,?)").run(requestId,"session",task.id,"completed",canonical(request))
    runtime.store.db.prepare("INSERT INTO activation_decisions VALUES(?,?,?,?,?,?)").run("decision","event",task.id,"role","policy",canonical({id:"decision"}))
    const grant={id:grantId,taskId:task.id,executionMode:"cognition",role:{id:"role",version:1},policy:{id:"policy",version:1},profile:{provider:"test"}}
    runtime.store.db.prepare("INSERT INTO activation_grants VALUES(?,?,?,?,?)").run(grantId,"decision",task.id,"completed",canonical(grant))
    runtime.store.db.prepare("INSERT INTO agent_runs VALUES(?,?,?,?,?)").run("run",grantId,task.id,"completed",canonical({grant,usage:{inputTokens:100,outputTokens:50,toolCalls:1,elapsedMs:1000},output:{}}))
    const components={planning:1,reasoning:1,context:1,reexecution:1,integration:1,interruption:1,discardedWork:0,warmSessionLoss:0,dataMigration:0,expectedFailure:1}
    const repair={id:repairId,requestId,state:"applied",grantId,grantIds:[grantId],startedAt:now-100,selection:{region:{id:"region",nodes:[task.id]},cost:5,trace:[{id:"region",evaluation:{costComponents:components,rawCostComponents:components}}]}}
    runtime.store.db.prepare("INSERT INTO request_region_repairs VALUES(?,?,?,?)").run(repairId,requestId,"applied",canonical(repair))
    runtime.store.db.exec("CREATE TABLE grant_dispatches(grant_id TEXT PRIMARY KEY,state TEXT,owner TEXT,payload TEXT)")
    runtime.store.db.prepare("INSERT INTO grant_dispatches VALUES(?,'failed','fixture',?)").run(grantId,canonical({transitions:[{from:"dispatching",to:"stopping",at:now-50,detail:{}},{from:"stopping",to:"failed",at:now-20,detail:{stop:{stopped:true}}}]}))
    runtime.control.regionCosts.record({repairId,category:"integration",amount:1,unit:"work-units",evidence:[authorization],source:"measured integration validator duration"})
    runtime.store.control.event({id:"request-completed",type:"RequestCompleted",entityId:task.id,correlationId:requestId,schemaVersion:1,timestamp:now,payload:{requestId,evidence:authorization}})
    runtime.control.regionCosts.ingest()
    const row=runtime.store.db.prepare("SELECT actual,estimated,relative_error FROM region_cost_calibration_samples WHERE repair_id=?").get(repairId)!
    assert.deepEqual({...row},{actual:5.03,estimated:7,relative_error:(7-5.03)/7})
    assert.deepEqual(runtime.control.regionCosts.summary(registered.replanner.selection),{key:runtime.control.regionCosts.key(registered.replanner.selection),samples:1,stable:true,factor:1,maximumObservedRelativeError:(7-5.03)/7,reason:"observed execution costs are within the registered error bound"})
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM execution_costs WHERE run_id=? AND kind='measured'").get(grantId)!.n,1)
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM execution_costs WHERE run_id=? AND category='integration'").get(repairId)!.n,1)
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM execution_costs WHERE run_id=? AND category='interruption'").get(repairId)!.n,1)
    assert.throws(()=>runtime.control.regionCosts.record({repairId,category:"integration",amount:1,unit:"other",evidence:[authorization],source:"wrong unit"}),/registered repair unit/)
  }finally{runtime.close()}
})
