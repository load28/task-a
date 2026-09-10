import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { digest } from "../packages/task-control/src/value.ts"
import type { PlanNode } from "../packages/task-domain/src/index.ts"
import type { BoundaryProof,TaskExpectation } from "../packages/task-causality/src/model.ts"
import type { ValidatedBoundary } from "../packages/task-control/src/boundary-validation.ts"
import type { RoutineExpectation,RoutineTemplate } from "../packages/task-control/src/routines.ts"
import type { ActivationGrant,AgentOutput,RoleVersion } from "../packages/task-cognition/src/model.ts"
import type { ControllerProgram } from "../packages/task-control/src/requests.ts"

const nodes:PlanNode[]=[
  {nodeId:"extract",label:"Extract",stage:"implementation",outcome:"normalized input",dependsOnNodeIds:[],taskSpec:{goal:"normalize input",acceptanceCriteria:[{id:"normalized",description:"input normalized"}],writeScopes:[]}},
  {nodeId:"load",label:"Load",stage:"validation",outcome:"loaded output",dependsOnNodeIds:["extract"],taskSpec:{goal:"validate and load",acceptanceCriteria:[{id:"loaded",description:"output loaded"}],writeScopes:[]}},
]
const expected=(id:string):RoutineExpectation=>({expectedArtifacts:{},expectedInterface:{},expectedBehavior:{[id]:true},expectedDependencies:{},expectedGoals:{},expectedRisk:0})
const nodeExpected=(node:PlanNode)=>expected(node.nodeId==="extract"?"normalized":"loaded")

test("검증된 반복 작업은 외부 port와 내부 checkpoint를 보존해 다른 목표의 실제 계획으로 펼쳐진다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const basisContent={episodes:["episode-a","episode-b"]},basis=r.control.evidence.put({id:"routine-basis",version:1,type:"runtime",source:"measured repeated execution",producer:"fixture",validatorVersion:"measurement/v1",timestamp:Date.now(),content:basisContent,contentHash:digest(basisContent),inputVector:[],confidence:1,expiresAt:null})
    const authContent={authorization:"routine validator"},authorization=r.control.evidence.put({id:"routine-auth",version:1,type:"code",source:"fixture",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content:authContent,contentHash:digest(authContent),inputVector:[],confidence:1,expiresAt:null})
    r.control.validators.register({id:"checkpoint",version:1,command:[process.execPath,"-e","process.exit(0)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[authorization]})
    const source=r.engine.createDraftPlan({title:"Source",goal:"import customer records",requestText:"source",summary:"source routine",nodes})
    const active=r.engine.approveWorkPlan({planId:source.planId,version:1,approvalSource:"fixture"}),links=r.store.planLinks(source.planId,1)
    for(const link of links){const task=r.engine.requireTask(link.taskId);r.store.updateTask({...task,status:"verified",statusReason:"fixture checkpoint passed"})}
    for(const node of nodes) {
      const taskId=links.find(link=>link.nodeId===node.nodeId)!.taskId
      const value:TaskExpectation={...nodeExpected(node),id:taskId,version:1,taskId,specHash:r.engine.signals.capture(taskId).specHash,evidence:[basis]}
      r.store.control.put("task_expectations",taskId,1,value);r.store.control.advance("task_expectations",taskId,0,1)
    }
    const checkpoints=links.map(link=>{const member={id:link.taskId,version:1},content={passed:true,member};return {member,validators:["checkpoint/v1"],evidence:[r.control.evidence.put({id:`routine-checkpoint:${link.taskId}`,version:1,type:"runtime",source:"completed member validation",producer:"fixture",validatorVersion:"checkpoint/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})]}})
    const members=new Set(links.map(link=>link.taskId)),all=r.control.graph.all()
    for(const edge of all.filter(edge=>members.has(edge.source.entityId)!==members.has(edge.target.entityId)))if(edge.completeness!=="verified")r.control.graph.put({...edge,version:edge.version+1,completeness:"verified",evidence:[basis]},edge.version)
    const edges=r.control.graph.all(),crossing=edges.filter(edge=>members.has(edge.source.entityId)!==members.has(edge.target.entityId)),toVector=(direction:"input"|"output")=>crossing.filter(edge=>direction==="input"?!members.has(edge.source.entityId):members.has(edge.source.entityId)).map(edge=>({entityId:edge.id,port:"causal-edge",view:direction,version:edge.version,hash:digest(edge)})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
    const boundary:ValidatedBoundary={id:"routine-boundary",version:1,members:[...members],exits:crossing.map(edge=>edge.id),invariants:["external ports preserved"],bindingsComplete:true,validators:{behavior:"checkpoint/v1",interface:"checkpoint/v1",data:"checkpoint/v1",temporal:"checkpoint/v1","error-propagation":"checkpoint/v1","resource-contention":"checkpoint/v1",semantic:"checkpoint/v1"},authorization:[authorization],bindingValidator:"checkpoint/v1",proofMaxAgeMs:60000}
    r.store.control.put("planning_boundaries",boundary.id,1,boundary);r.store.control.advance("planning_boundaries",boundary.id,0,1)
    const state={ports:digest(crossing)},proof:BoundaryProof={id:"routine-proof",boundary:{id:boundary.id,version:1},graphHash:r.control.graph.hash(),inputVector:[],scope:"contract",exits:[...boundary.exits],before:state,after:state,observableComplete:true,evidence:[basis,...checkpoints.flatMap(item=>item.evidence)],validatorVersion:"checkpoint+seven-dimension/v1",expiresAt:Date.now()+60000,verdict:"preserved"}
    r.store.control.put("boundary_proofs",proof.id,1,proof)
    const routine:RoutineTemplate={id:"etl",version:1,name:"ETL",sourcePlan:{id:source.planId,version:1,goal:"import customer records"},members:links.map(link=>({id:link.taskId,version:1})),nodes:nodes.map(node=>({node,expectation:nodeExpected(node)})),inputPorts:toVector("input"),outputPorts:toVector("output"),checkpoints,evidence:[basis],boundaryProof:{id:proof.id,version:1},observation:{episodes:["episode-a","episode-b"],failureRate:.05,uncertainty:.05,replanningRate:.05,independentChangeUpperBound:.05,coexecutionRate:.95,sharedFailureRate:.1,evidence:[basis]},policy:{minimumEpisodes:2,splitWeights:{failure:.34,uncertainty:.33,replanning:.33},splitThreshold:.8,maxIndependentChange:.1,minCoexecution:.8,sharedFailureThreshold:.8},cost:{complexity:1,parallelism:1,riskIsolation:1,coordination:4}}
    r.control.routines.register(routine,0)
    r.control.routines.register(routine,0)
    assert.throws(()=>r.control.routines.register({...routine,id:"insufficient",observation:{...routine.observation,episodes:["episode-a"]}},0),/does not justify/)
    assert.throws(()=>r.control.routines.register({...routine,id:"unchecked",checkpoints:routine.checkpoints.map(item=>({...item,evidence:[basis]}))},0),/checkpoint/)
    const prep:PlanNode={nodeId:"prepare",label:"Prepare",stage:"research",researchTrack:"repository",outcome:"source ready",dependsOnNodeIds:[],taskSpec:{goal:"prepare source",acceptanceCriteria:[{id:"ready",description:"source ready"}],writeScopes:[]}}
    const expanded=r.control.routines.expand([{node:prep,expectation:expected("ready")},{routineUse:{routine:{id:"etl",version:1},namespace:"orders",inputs:{extract:["prepare"]}}}],"import order records","request-orders")
    assert.deepEqual(expanded.proposal.map(item=>item.node.nodeId),["prepare","orders/extract","orders/load"])
    assert.deepEqual(expanded.proposal.find(item=>item.node.nodeId==="orders/extract")!.node.dependsOnNodeIds,["prepare"])
    assert.deepEqual(expanded.proposal.find(item=>item.node.nodeId==="orders/load")!.node.dependsOnNodeIds,["orders/extract"])
    const reused=r.engine.createDraftPlan({title:"Orders",goal:"import order records",requestText:"target",summary:"reuse routine",nodes:expanded.proposal.map(item=>item.node)})
    assert.deepEqual(r.store.planNodes(reused.planId,1).map(node=>node.nodeId),["prepare","orders/extract","orders/load"])
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='RoutineInstantiated'").get()!.n,1)
    assert.ok(active.rootTaskId)
    r.control.validators.register({id:"routine-state",version:1,command:[process.execPath,"-e","process.exit(0)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[authorization],output:"semantic-state"})
    const controllerRole:RoleVersion={id:"routine-worker",version:1,name:"Routine worker",purpose:"Plan and execute bounded routines",capabilities:[],prompt:"Return structured output",activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:10000,maxDependencyDepth:2,maxEvidenceItems:20,maxHistoricalDecisions:2},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[authorization]}
    r.control.roleLifecycle.installConfigured(controllerRole,"routine request fixture")
    r.store.control.put("policy_versions","routine-policy",1,{id:"routine-policy",version:1,authorization:[authorization]})
    const entry={role:{id:controllerRole.id,version:1},profile:{id:"routine-model",level:3 as const,provider:"test",model:"test",maxInputTokens:10000,maxOutputTokens:1000,maxToolCalls:1,timeoutMs:10000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]}}
    const program:ControllerProgram={id:"routine-program",version:1,authorization:[authorization],policy:{id:"routine-policy",version:1},planner:entry,worker:entry,planValidators:["checkpoint/v1"],observationValidators:["routine-state/v1"],predictionPolicy:{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},readScopes:[],writeScopes:[],maxTasks:4,grantLifetimeMs:10000,account:"test",tokenLimit:50000}
    r.control.requests.register(program);r.control.requests.submit({id:"routine-request",sessionId:"user",text:"import supplier records",planOnly:true,program:{id:program.id,version:1}});r.control.requests.tick()
    const controlled=r.control.requests.get("routine-request")!,grant=JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(controlled.plannerGrant!)!.payload)) as ActivationGrant
    r.control.admission.claim(grant.id,{worker:"planner",specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,generation:grant.generation,now:Date.now()})
    const output:AgentOutput={taskId:grant.taskId,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[{node:prep,expectation:expected("ready")},{routineUse:{routine:{id:"etl",version:1},namespace:"suppliers",inputs:{extract:["prepare"]}}}],confidence:1,requiresEscalation:false}
    r.control.admission.submit(grant.id,"planner",output,{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1});r.control.requests.tick()
    const planned=r.control.requests.get("routine-request")!
    assert.equal(planned.state,"validating",planned.reason)
    assert.deepEqual(r.store.planNodes(planned.planId!,1).map(node=>node.nodeId),["prepare","suppliers/extract","suppliers/load"])
    assert.deepEqual(planned.routineUses,[{routine:{id:"etl",version:1},namespace:"suppliers",inputs:{extract:["prepare"]}}])
    r.control.evidence.retract(checkpoints[0]!.evidence[0]!,[authorization],"checkpoint withdrawn")
    assert.throws(()=>r.control.routines.expand([{routineUse:{routine:{id:"etl",version:1},namespace:"later",inputs:{extract:["prepare"]}}}],"third goal","request-third"),/checkpoint/)
  }finally{r.close()}
})

test("표본·checkpoint·경계 증명이 없는 routine은 그래프를 바꾸지 못한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    assert.throws(()=>r.control.routines.expand([{routineUse:{routine:{id:"missing",version:1},namespace:"x",inputs:{}}}],"goal","request"),/unknown/)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='RoutineInstantiated'").get()!.n,0)
  }finally{r.close()}
})
