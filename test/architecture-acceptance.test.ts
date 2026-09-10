import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PolicyLearning,type PolicyProposal } from "../packages/task-policy/src/index.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { digest } from "../packages/task-control/src/value.ts"
import type { PlanNode } from "../packages/task-domain/src/index.ts"

const signals=(risk=.5)=>({...Object.fromEntries(FEATURES.map(feature=>[feature,0])),risk} as Signals)
const node=(id:string,deps:string[]=[]):PlanNode=>({nodeId:id,label:id,stage:"implementation",outcome:id,dependsOnNodeIds:deps,taskSpec:{goal:id,acceptanceCriteria:["works"]}})
const event=(r:ReturnType<typeof createGraphRuntime>,type:string,after=0)=>{const row=r.store.db.prepare("SELECT id,sequence FROM event_outbox WHERE type=? AND sequence>? ORDER BY sequence LIMIT 1").get(type,after) as {id:string;sequence:number}|undefined;if(!row)throw new Error(`Missing ${type} after ${after}: ${JSON.stringify(r.store.db.prepare("SELECT sequence,type FROM event_outbox WHERE sequence>? ORDER BY sequence").all(after))}`);return row}
const taskFor=(r:ReturnType<typeof createGraphRuntime>,planId:string,nodeId:string)=>r.store.planLinks(planId,r.store.activePlanVersion(planId)).find(link=>link.nodeId===nodeId)!.taskId
function complete(r:ReturnType<typeof createGraphRuntime>,taskId:string,name:string,content=name){const task=r.engine.startTask(taskId);return r.engine.completeTask({taskId,attemptToken:task.attemptToken,summary:"verified",artifacts:[{name,type:"code",content}],verification:{passed:true,evidence:"executed",criteriaSatisfied:task.acceptanceCriteria.map(item=>item.id)}})}
function proof(r:ReturnType<typeof createGraphRuntime>,id:string){const content={id,observed:"actual acceptance outcome"};return r.control.evidence.put({id,version:1,type:"code",source:"acceptance runtime",producer:"architecture acceptance",validatorVersion:"acceptance/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})}
function proposal(r:ReturnType<typeof createGraphRuntime>,id:string,evidence:{id:string;version:number},target:PolicyProposal["target"]="cache"){
  const value:PolicyProposal={id,version:1,target,observedPattern:"measured repeated trace",rootCause:"structural scope",proposedInvariant:"preserve unaffected execution",proposedRule:{op:"gte",feature:"risk",value:.3},effect:target==="activation"?{kind:"activation",role:{id:"trace-role",version:1},mode:"require"}:{kind:"cache",reuse:"disabled"},expectedBenefit:1,regressionRisk:.1,evidence:[evidence],supportingCases:[evidence],counterexamples:[],structuralAbstraction:"causal scope",holdoutCriteria:["independent episode"],rollbackCondition:"quality regression",rollback:{id:"baseline",version:1}}
  new PolicyLearning(r.store.control).propose(value,ref=>r.control.evidence.valid(ref));return value
}
function roleGrant(r:ReturnType<typeof createGraphRuntime>,taskId:string,evidence:{id:string;version:number}){
  const role:RoleVersion={id:"trace-role",version:1,name:"Trace role",purpose:"verify",capabilities:[],prompt:"verify",activationPolicy:{hardTriggers:["failure"],softSignals:{risk:1},threshold:.8,cooldownMs:0,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:2,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[evidence]}
  r.control.roleLifecycle.installConfigured(role,"acceptance trace")
  const policy={id:"baseline",version:1},context=budgetContext({taskId,role,policy,items:[],scaffold:role.prompt,outputReservation:100,countTokens:value=>Buffer.byteLength(value)})
  r.store.control.put("context_manifests",context.id,1,context)
  const decision=r.control.admission.record(activation({taskId,eventId:`role:${taskId}`,eligible:true,role,policy,signals:signals(1),now:Date.now(),invocations:0}))
  return r.control.admission.issue({decisionId:decision.id,taskId,specHash:r.engine.signals.capture(taskId).specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy,profile:{id:"trace",level:3,provider:"test",model:"bounded",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:10000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},context:{id:context.id,version:1},contextHash:context.hash,writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+10000,generation:1},"trace",10000)
}

test("T15 공유 infrastructure의 실제 실패·원인 repair·shadow 개선을 하나의 불변 trace로 연결한다",async()=>{
  const r=createGraphRuntime(":memory:")
  try{
    const evidence=proof(r,"shared-proof"),plan=r.engine.createDraftPlan({title:"shared",goal:"integrate",requestText:"change cache",summary:"shared infrastructure",nodes:[node("infra"),node("consumer",["infra"])]}).planId
    r.engine.approveWorkPlan({planId:plan,version:1,approvalSource:"user"});const infra=taskFor(r,plan,"infra"),consumer=taskFor(r,plan,"consumer")
    complete(r,infra,"cache","v1");complete(r,consumer,"api","v1");r.engine.reopenTask(infra,"infrastructure change");complete(r,infra,"cache","v2")
    const changed=event(r,"ARTIFACT_VERSIONED")
    r.control.validators.register({id:"static",version:1,command:[process.execPath,"-e","process.exit(0)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[evidence]})
    r.control.evidence.createObligation({entityId:infra,tuple:[],kind:"static",mandatory:true,validators:["static/v1"],reason:[evidence]});await r.control.validators.run(".",{maxJobs:1,maxDurationMs:2000})
    const passed=event(r,"ValidatorPassed",changed.sequence),grant=roleGrant(r,infra,evidence),selected=event(r,"ActivationGrantIssued",passed.sequence);assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grant.id)!.payload)).role.id,"trace-role")
    complete(r,consumer,"api","v2")
    const set=r.integration.proposeIntegration({integrationSets:[{name:"shared-boundary",members:["cache","api"],scenarios:[{name:"interaction",expectedBehavior:["compatible"]}]}]}).sets[0]!,run=r.integration.startRun(set.id)
    const failed=r.integration.reportRun(run.run.id,{scenarios:run.scenarios.map(item=>({scenarioId:item.id,status:"failed" as const,observed:"runtime incompatibility"})),failure:{type:"contract_mismatch",affectedTaskIds:[infra],evidenceRefs:[],recommendedActions:["repair producer"]}})
    const integrationFailure=event(r,"INTEGRATION_FAILED",selected.sequence);r.engine.feedback.route({issueId:failed.issue!.id,causeTaskId:infra,causeRefs:r.engine.requireTask(infra).outputArtifactRefs,evidence:"producer owns incompatible behavior"})
    const repaired=event(r,"TASK_CREATED",integrationFailure.sequence)
    const learned=proposal(r,"shared-policy",evidence,"activation"),proposed=event(r,"PolicyProposed",repaired.sequence)
    const replayInput={taskId:infra,eventId:"shared-replay",eligible:true,role:r.store.control.get<RoleVersion>("role_versions","trace-role",1)!,policy:{id:"baseline",version:1},signals:signals(.5),now:Date.now(),invocations:0}
    r.control.policyReplay.recordActivation(replayInput,"shared-episode",[evidence]);r.control.policyReplay.register({id:"shared-shadow",proposal:{id:learned.id,version:1},role:{id:"trace-role",version:1},effect:"additional-trigger",split:{seed:"fixed",holdoutBuckets:25}});r.control.policyReplay.ingest()
    const shadow=event(r,"PolicyShadowPredicted",proposed.sequence)
    const trace=r.control.acceptance.record({id:"shared",scenario:"shared-infrastructure",episode:"shared-episode",stages:[{name:"infrastructure-change",eventId:changed.id},{name:"static-validation",eventId:passed.id},{name:"role-selection",eventId:selected.id},{name:"integration-failure",eventId:integrationFailure.id},{name:"causal-repair",eventId:repaired.id},{name:"learned-policy",eventId:proposed.id},{name:"shadow-improvement",eventId:shadow.id}],proposal:{id:learned.id,version:1},evidence:[evidence],reconsidered:[infra,consumer],preserved:[]})
    assert.equal(trace.scenario,"shared-infrastructure");assert.throws(()=>r.store.db.prepare("UPDATE architecture_acceptance_traces SET payload='{}'").run(),/Immutable/)
  }finally{r.close()}
})

test("T15 A1 변경은 A2와 A 통합만 재검토하고 B·C를 같은 trace에서 보존한다",()=>{
  const r=createGraphRuntime(":memory:")
  try{
    const evidence=proof(r,"local-proof"),plan=r.engine.createDraftPlan({title:"local",goal:"local repair",requestText:"change A1",summary:"branches",nodes:[node("A1"),node("A2",["A1"]),node("B"),node("C")]}).planId
    r.engine.approveWorkPlan({planId:plan,version:1,approvalSource:"user"});const a1=taskFor(r,plan,"A1"),a2=taskFor(r,plan,"A2"),b=taskFor(r,plan,"B"),c=taskFor(r,plan,"C")
    complete(r,a1,"a1","v1");complete(r,a2,"a2","v1");complete(r,b,"b","fixed");complete(r,c,"c","fixed")
    const beforeB=digest(r.engine.requireTask(b)),beforeC=digest(r.engine.requireTask(c));r.engine.reopenTask(a1,"A1 changed");complete(r,a1,"a1","v2")
    const changed=event(r,"ARTIFACT_VERSIONED"),propagated=event(r,"TASK_STALE",changed.sequence);complete(r,a2,"a2","v2");const revised=event(r,"TASK_STARTED",propagated.sequence)
    const set=r.integration.proposeIntegration({integrationSets:[{name:"A",members:["a1","a2"],scenarios:[{name:"A contract",expectedBehavior:["works"]}]}]}).sets[0]!;r.integration.startRun(set.id);const integration=event(r,"INTEGRATION_STARTED",revised.sequence)
    const learned=proposal(r,"local-policy",evidence),proposed=event(r,"PolicyProposed",integration.sequence)
    const trace=r.control.acceptance.record({id:"local",scenario:"local-a1-repair",episode:"local-episode",stages:[{name:"a1-change",eventId:changed.id},{name:"causal-propagation",eventId:propagated.id},{name:"scoped-revision",eventId:revised.id},{name:"integration-recheck",eventId:integration.id},{name:"learned-policy",eventId:proposed.id}],proposal:{id:learned.id,version:1},evidence:[evidence],reconsidered:[a2,set.id],preserved:[{entityId:b,beforeHash:beforeB,afterHash:digest(r.engine.requireTask(b))},{entityId:c,beforeHash:beforeC,afterHash:digest(r.engine.requireTask(c))}]})
    assert.deepEqual(trace.preserved.map(item=>item.entityId).sort(),[b,c].sort())
  }finally{r.close()}
})

test("T15 외부 contract 변경은 필요한 consumer만 깨우고 무관한 실행을 보존한 채 정책까지 연결한다",()=>{
  const r=createGraphRuntime(":memory:")
  try{
    const evidence=proof(r,"contract-proof"),provider=r.engine.createTask({title:"provider",goal:"provide"}),consumer=r.engine.createTask({title:"B consumer",goal:"consume",dependencies:[provider.id]}),unrelated=r.engine.createTask({title:"C",goal:"independent"})
    const initial=r.engine.defineContract({providerTaskId:provider.id,consumerTaskId:consumer.id,provides:[{name:"api/v1"}]});complete(r,provider.id,"provider","v1");complete(r,consumer.id,"consumer","v1");complete(r,unrelated.id,"unrelated","fixed");const before=digest(r.engine.requireTask(unrelated.id)),cutoff=Number(r.store.db.prepare("SELECT max(sequence) n FROM event_outbox").get()!.n)
    r.engine.defineContract({contractId:initial.id,providerTaskId:provider.id,consumerTaskId:consumer.id,provides:[{name:"api/v2"}]});const changed=event(r,"CONTRACT_UPDATED",cutoff)
    r.engine.markTaskStale(consumer.id,"external contract changed");const woke=r.store.db.prepare("SELECT id,sequence FROM event_outbox WHERE type='TaskStateCommitted' AND entity_id=? AND sequence>? ORDER BY sequence LIMIT 1").get(consumer.id,changed.sequence) as {id:string;sequence:number};const learned=proposal(r,"contract-policy",evidence),proposed=event(r,"PolicyProposed",woke.sequence)
    const trace=r.control.acceptance.record({id:"contract",scenario:"external-contract-change",episode:"contract-episode",stages:[{name:"contract-change",eventId:changed.id},{name:"consumer-wakeup",eventId:woke.id},{name:"learned-policy",eventId:proposed.id}],proposal:{id:learned.id,version:1},evidence:[evidence],reconsidered:[consumer.id],preserved:[{entityId:unrelated.id,beforeHash:before,afterHash:digest(r.engine.requireTask(unrelated.id))}]})
    assert.deepEqual(trace.reconsidered,[consumer.id]);assert.equal(r.engine.requireTask(unrelated.id).status,"verified")
  }finally{r.close()}
})
