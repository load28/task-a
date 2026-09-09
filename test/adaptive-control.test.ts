import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { CausalGraph } from "../packages/task-causality/src/graph.ts"
import { propagate } from "../packages/task-causality/src/propagation.ts"
import { preservedExit } from "../packages/task-causality/src/boundary.ts"
import { predictionError,nextStability } from "../packages/task-causality/src/prediction.ts"
import { minimumRegion,mergeRegions } from "../packages/task-causality/src/regions.ts"
import type { CausalEdge,BoundaryProof,TaskExpectation,Observation } from "../packages/task-causality/src/model.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { budgetContext,ContextBudgetExceeded } from "../packages/task-context/src/budget.ts"
import { CognitiveMemory } from "../packages/task-context/src/memory.ts"
import { selectReplay,validateRule,evaluateRule } from "../packages/task-policy/src/index.ts"
import { digest } from "../packages/task-control/src/value.ts"

const edge=(from:string,to:string,weight=1,critical=false):CausalEdge=>({id:`${from}:${to}`,version:1,source:{entityId:from,port:"output",view:"behavior"},target:{entityId:to,port:"input",view:"behavior"},relation:"depends_on",changeTypes:["behavior"],impactWeight:weight,critical,completeness:"verified",evidence:[],observedPropagationRate:{successes:1,trials:1,estimate:1,modelVersion:"observed/v1"}})
const role:RoleVersion={id:"qa",version:1,name:"QA",purpose:"조합 검증",capabilities:["qa"],prompt:"검증",activationPolicy:{hardTriggers:["failure"],softSignals:{risk:1},threshold:.5,cooldownMs:100,maxInvocationsPerTask:2},requiredContext:[],contextBudget:{maxTokens:4000,maxDependencyDepth:2,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:["qa/v1"],allowedTools:[],lifecycle:"persistent",evidence:[]}
const signals=():Signals=>Object.fromEntries(FEATURES.map(f=>[f,0])) as Signals

test("T01 그래프 상태와 outbox는 함께 롤백되고 재시작 소비가 멱등이다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"adaptive-events-")),file=join(directory,"graph.db")
  let store=new TaskGraphStore(file)
  try {
    const engine=new TaskGraphEngine(store)
    assert.throws(()=>store.transaction(()=>{engine.createTask({title:"실패",goal:"rollback"});throw new Error("crash")}))
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM tasks").get()!.n,0)
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM event_outbox").get()!.n,0)
    const task=engine.createTask({title:"보존",goal:"durable"})
    assert.throws(()=>store.control.consume("test","v1",()=>{store.db.prepare("INSERT INTO control_ready VALUES(?,?,?)").run(task.id,"event",1);throw new Error("consumer crash")}))
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM control_ready").get()!.n,0)
    store.close();store=new TaskGraphStore(file)
    const count=store.control.consume("test","v1",()=>{})
    assert.ok(count>0);assert.equal(store.control.consume("test","v1",()=>{throw new Error("duplicate")}),0)
  } finally {store.close();rmSync(directory,{recursive:true,force:true})}
})

test("T05 버전은 불변이고 인과 전파가 독립 영역을 방문하지 않는다",()=>{
  const store=new TaskGraphStore()
  try {
    const graph=new CausalGraph(store.control)
    for(const e of [edge("A1","A2"),edge("A2","A"),edge("B1","B2")])graph.put(e,0)
    assert.throws(()=>graph.put({...edge("A1","A2"),impactWeight:.5},0),/Stale/)
    assert.throws(()=>store.db.prepare("UPDATE causal_edge_versions SET hash='bad'").run(),/Immutable/)
    const visited:string[]=[]
    const result=propagate({graphComplete:true,sources:["A1"],scopes:["behavior"],outgoing:id=>{visited.push(id);return graph.outgoing(id)},threshold:()=>.5,preserved:()=>false})
    assert.deepEqual(result.affected,["A","A1","A2"]);assert.ok(!visited.includes("B1"))
  } finally {store.close()}
})

test("T05 DAG 전수 계산 oracle과 국소 계산이 같은 결과를 만든다",()=>{
  for(let mask=0;mask<64;mask++) {
    const nodes=["0","1","2","3"],edges:CausalEdge[]=[]
    let bit=0
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(mask&(1<<bit++))edges.push(edge(String(i),String(j)))
    const evaluate=(changed:boolean)=>{const out:Record<string,number>={};for(const n of nodes)out[n]=(n==="0"&&changed?2:1)+edges.filter(e=>e.target.entityId===n).reduce((s,e)=>s+out[e.source.entityId]!,0);return out}
    const before=evaluate(false),after=evaluate(true)
    const closure=propagate({graphComplete:true,sources:["0"],scopes:["behavior"],outgoing:id=>edges.filter(e=>e.source.entityId===id),threshold:()=>0,preserved:()=>false})
    for(const n of nodes)if(!closure.affected.includes(n))assert.equal(before[n],after[n])
  }
})

test("T05 hard 영향은 약한 경로에서도 유지되고 1-weight cycle은 끝난다",()=>{
  const edges=[edge("a","b",.01),edge("b","c",1,true),edge("c","b",1)]
  const r=propagate({graphComplete:true,sources:["a"],scopes:["behavior"],outgoing:id=>edges.filter(e=>e.source.entityId===id),threshold:()=>.9,preserved:()=>false})
  assert.ok(r.hard.includes("c"));assert.ok(r.affected.includes("b"));assert.ok(r.trace.length<10)
  const unknown=propagate({graphComplete:true,sources:["a"],scopes:["behavior"],outgoing:id=>id==="a"?[{...edge("a","b",0),completeness:"unknown"}]:[],threshold:()=>.9,preserved:()=>false})
  assert.ok(unknown.affected.includes("b"))
})

test("T06 타입 이름이나 호환성만으로 경계 보존을 증명하지 않는다",()=>{
  const proof:BoundaryProof={id:"p",boundary:{id:"b",version:1},graphHash:"g",inputVector:[],scope:"behavior",exits:["a:b"],before:{response:"old"},after:{response:"old"},observableComplete:true,evidence:[{id:"e",version:1}],validatorVersion:"finite/v1",expiresAt:200,verdict:"preserved"}
  const input={proof,boundary:{id:"b",version:1,members:["a"],exits:["a:b"],invariants:["response"],bindingsComplete:true},edgeId:"a:b",scope:"behavior" as const,graphHash:"g",inputs:[],now:100,validEvidence:()=>true}
  assert.equal(preservedExit(input),true)
  assert.equal(preservedExit({...input,proof:{...proof,after:{response:"new"}}}),false)
  assert.equal(preservedExit({...input,boundary:{...input.boundary,bindingsComplete:false}}),false)
  assert.equal(preservedExit({...input,now:201}),false)
  assert.equal(preservedExit({...input,graphHash:"other"}),false)
})

test("T07 실제 관찰의 unknown과 임계값 진동을 구분한다",()=>{
  const expectation:TaskExpectation={id:"x",version:1,taskId:"t",specHash:"s",expectedArtifacts:{},expectedInterface:{api:"v1"},expectedBehavior:{pass:true},expectedDependencies:{},expectedGoals:{goal:"g"},expectedRisk:.2,evidence:[]}
  const observation:Observation={id:"o",version:1,taskId:"t",expectation:{id:"x",version:1},state:{artifacts:{},contract:{api:"v1"},behavior:{pass:true},dependencies:{},goals:{goal:"g"},risk:.2},evidence:[],inputVector:[]}
  const policy={weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.7,exit:.3}
  const exact=predictionError(expectation,observation,policy,[])
  assert.equal(exact.score,0)
  assert.equal(predictionError(expectation,{...observation,state:{...observation.state,behavior:null}},policy,[]).score,null)
  assert.equal(nextStability("replanning",{...exact,score:.5},policy,false),"replanning")
  assert.equal(nextStability("stable",{...exact,score:.5},policy,false),"stable")
  assert.equal(nextStability("stable",{...exact,criticalViolations:["security"]},policy,true),"replanning")
})

test("T02 영향 밖 역할은 잠들고 quota가 hard 의무를 skip하지 않는다",()=>{
  const input={taskId:"t",eventId:"e",eligible:true,role,policy:{id:"p",version:1},signals:{...signals(),failure:1},now:1000,invocations:0}
  assert.equal(activation(input).action,"activate")
  assert.equal(activation({...input,eligible:false}).action,"skip")
  assert.equal(activation({...input,invocations:2}).action,"defer")
  assert.equal(activation({...input,signals:{...signals(),risk:null}}).action,"defer")
})

test("T04 필수 context를 잘라내지 않고 optional history부터 제외한다",()=>{
  const item={id:"goal",version:1,kind:"task" as const,content:"목표",required:true,depth:0,relevance:1,level:0 as const,dependencies:[],path:[],evidence:[]}
  const input={taskId:"t",role,policy:{id:"p",version:1},items:[item],scaffold:"system",outputReservation:20,countTokens:(s:string)=>Buffer.byteLength(s)}
  const manifest=budgetContext(input);assert.equal(manifest.included[0]?.id,"goal")
  assert.throws(()=>budgetContext({...input,items:[{...item,content:"x".repeat(5000)}]}),ContextBudgetExceeded)
  const withHistory=budgetContext({...input,items:[item,{...item,id:"h1",kind:"history",required:false},{...item,id:"h2",kind:"history",required:false}]})
  assert.equal(withHistory.excluded.length,1)
})

test("T04 의미 view를 읽은 인지 record만 무효화한다",()=>{
  const store=new TaskGraphStore()
  try {
    const memory=new CognitiveMemory(store.control),ref={id:"m",version:1},dependency={entityId:"api",port:"response",view:"contract",version:1,hash:"old"}
    const record={...ref,kind:"architecture" as const,taskSpecHash:"s",policy:{id:"p",version:1},role:{id:"r",version:1},validatorVersion:"v",schemaVersion:"v",assumptions:[],conclusions:["유효"],unresolvedQuestions:[],evidenceIndex:[],dependencyVersion:[dependency],level:2 as const,content:"판단",expiresAt:null}
    memory.save(record)
    const input={dependencies:[dependency],policy:record.policy,role:record.role,taskSpecHash:"s",validatorVersion:"v",schemaVersion:"v",now:0,validEvidence:()=>true,validAssumption:()=>true}
    assert.ok(memory.reuse(ref,input))
    assert.equal(memory.invalidate("api","response","syntax","new","e").length,0)
    assert.deepEqual(memory.invalidate("api","response","contract","new","e"),[ref]);assert.equal(memory.reuse(ref,input),undefined)
  } finally {store.close()}
})

test("T08 최소 후보와 T09 전이적 overlap 병합",()=>{
  const result=minimumRegion([{id:"root",nodes:["a","b","c"],cost:10,feasible:true},{id:"local",nodes:["a","b"],cost:2,feasible:true}],["a","b"])
  assert.equal(result.region?.id,"local")
  assert.equal(minimumRegion([{id:"x",nodes:["a"],cost:1,feasible:true}],["a"],0).minimumProven,false)
  assert.equal(mergeRegions([{nodes:["a"],boundaries:["x"],resources:[]},{nodes:["b"],boundaries:["y"],resources:[]},{nodes:["c"],boundaries:["x","y"],resources:[]}]).length,1)
})

test("T11 사례 이름 규칙을 거절하고 구조 규칙은 이름과 무관하게 적용한다",()=>{
  assert.throws(()=>validateRule({op:"file",value:"auth.ts"} as never))
  assert.equal(evaluateRule({op:"all",rules:[{op:"relation",value:"shares_contract"},{op:"gte",feature:"dependencyImpact",value:.5}]},{features:{dependencyImpact:.8},relations:["shares_contract"],scopes:[]}),true)
  assert.equal(evaluateRule({op:"gte",feature:"risk",value:.5},{features:{risk:null},relations:[],scopes:[]}),null)
})

test("T13 replay는 mandatory budget을 먼저 확보하고 optional knapsack을 푼다",()=>{
  const candidates=[{id:"critical",cost:3,predictionError:0,impact:0,risk:1,mandatory:true},{id:"high",cost:4,predictionError:1,impact:1,risk:1,mandatory:false},{id:"small",cost:2,predictionError:.5,impact:1,risk:1,mandatory:false}]
  assert.deepEqual(selectReplay(candidates,2).selected,[])
  assert.deepEqual(selectReplay(candidates,7).selected,["critical","high"])
  assert.notEqual(digest({a:1,b:2}),digest({a:2,b:1}))
})

test("T02 grant는 한 worker만 소비하고 입력 변경·위조 context를 거절한다",async()=>{
  const {Admission}=await import("../packages/task-control/src/admission.ts")
  const store=new TaskGraphStore()
  try {
    const admission=new Admission(store.control)
    store.control.put("role_versions",role.id,role.version,role)
    const manifest=budgetContext({taskId:"t",role,policy:{id:"p",version:1},items:[],scaffold:"system",outputReservation:100,countTokens:s=>Buffer.byteLength(s)})
    store.control.put("context_manifests",manifest.id,manifest.version,manifest)
    const decision=admission.record(activation({taskId:"t",eventId:"e",eligible:true,role,policy:{id:"p",version:1},signals:{...signals(),failure:1},now:Date.now(),invocations:0}))
    const input={decisionId:decision.id,taskId:"t",specHash:"s",inputVector:[],graphHash:"g",role:{id:"qa",version:1},policy:{id:"p",version:1},profile:{id:"normal",level:3 as const,provider:"test",model:"bounded",maxInputTokens:1000,maxOutputTokens:1000,maxToolCalls:3,timeoutMs:1000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},context:{id:manifest.id,version:1},contextHash:manifest.hash,writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+10000,generation:1}
    assert.throws(()=>admission.issue({...input,contextHash:"forged"},"account",5000),/context/)
    assert.throws(()=>admission.issue(input,"account",100),/Budget/)
    const grant=admission.issue(input,"account",5000)
    const claim={worker:"w",specHash:"s",inputVector:[],graphHash:"g",generation:1,now:Date.now()}
    assert.throws(()=>admission.claim(grant.id,{...claim,specHash:"changed"}),/mismatched/)
    admission.claim(grant.id,claim)
    assert.throws(()=>admission.claim(grant.id,{...claim,worker:"other"}),/consumed/)
    admission.fence("t")
    assert.throws(()=>admission.submit(grant.id,"w",{taskId:"t",findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1}),/active grant/)
  }finally{store.close()}
})

test("T11 정책은 shadow·검증 없이 활성화되지 않으며 회귀 후보를 거절한다",async()=>{
  const {PolicyLearning}=await import("../packages/task-policy/src/index.ts")
  const store=new TaskGraphStore()
  try {
    const learning=new PolicyLearning(store.control)
    const proposal={id:"candidate",version:1,target:"activation" as const,observedPattern:"공유 계약 누락",rootCause:"consumer 검토 누락",proposedInvariant:"공유 contract 소비자 검증",proposedRule:{op:"relation" as const,value:"shares_contract" as const},expectedBenefit:1,regressionRisk:.1,evidence:[{id:"e",version:1}],counterexamples:[],rollback:{id:"old",version:1}}
    learning.propose(proposal,()=>true)
    const evaluation={id:"eval",version:1,proposal:{id:proposal.id,version:1},stage:"shadow" as const,episodes:["train"],holdoutEpisodes:["held"],usefulGainLowerBound:1,qualityLowerBound:1,missedCriticalUpperBound:0,effectiveSamples:10,confidenceWidth:.1,criticalStrata:["security"],evidence:[{id:"e",version:1}],authorized:true}
    const gate={minimumSamples:5,maxConfidenceWidth:.2,qualityFloor:.9,maxMissedCritical:0,criticalStrata:["security"],requiresApproval:true}
    assert.throws(()=>learning.evaluate({...evaluation,stage:"active"},gate,()=>true),/skip/)
    learning.evaluate(evaluation,gate,()=>true)
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM policy_heads").get()!.n,0)
    assert.throws(()=>learning.evaluate({...evaluation,stage:"validated",qualityLowerBound:.1},gate,()=>true),/gates/)
    assert.throws(()=>learning.evaluate({...evaluation,stage:"validated",qualityLowerBound:NaN},gate,()=>true),/finite/)
    assert.throws(()=>learning.evaluate({...evaluation,stage:"validated"},{...gate,minimumSamples:1},()=>true),/frozen/)
    assert.throws(()=>learning.evaluate({...evaluation,stage:"validated",holdoutEpisodes:["cherry-picked"]},gate,()=>true),/frozen/)
    assert.throws(()=>learning.evaluate({...evaluation,stage:"validated",effectiveSamples:1.5},gate,()=>true),/sample count/)
    learning.propose({...proposal,version:2},()=>true)
    assert.throws(()=>learning.evaluate({...evaluation,proposal:{id:proposal.id,version:2},stage:"validated"},gate,()=>true),/skip/)
    learning.evaluate({...evaluation,stage:"validated"},gate,()=>true)
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM policy_heads").get()!.n,0)
    learning.evaluate({...evaluation,stage:"active"},gate,()=>true)
    assert.equal(store.db.prepare("SELECT policy_id FROM policy_heads WHERE target='activation'").get()!.policy_id,proposal.id)
  }finally{store.close()}
})

test("T10 통합의 일곱 의무는 실제 tuple 증거 없이는 완료되지 않는다",async()=>{
  const {EvidenceStore}=await import("../packages/task-evidence/src/index.ts")
  const {integrationObligations}=await import("../packages/task-evidence/src/integration.ts")
  const store=new TaskGraphStore()
  try {
    const evidence=new EvidenceStore(store.control),now=Date.now()
    const ref=evidence.put({id:"cause",version:1,type:"runtime",source:"observation",confidence:1,timestamp:now,contentHash:digest({changed:true}),content:{changed:true},inputVector:[],producer:"test",validatorVersion:"observer/v1",expiresAt:null})
    const mutation=(taskId:string)=>({taskId,boundary:{id:"api",version:1},outputs:[{entityId:taskId,port:"out",view:"behavior",version:1,hash:taskId}],evidence:[ref]})
    const obligations=integrationObligations(evidence,[mutation("a"),mutation("b")],dimension=>`${dimension}/v1`)
    assert.equal(obligations.length,7)
    assert.equal(evidence.unresolved("api").length,7)
    assert.throws(()=>evidence.resolve(obligations[0]!.id,[ref]),/actual validation/)
    assert.equal(integrationObligations(evidence,[mutation("a"),mutation("b")],dimension=>`${dimension}/v1`).length,7)
    assert.equal(evidence.unresolved("api").length,7)
  }finally{store.close()}
})

test("T05 누락 가능성이 있는 그래프는 미도달만으로 독립성을 증명하지 않는다",()=>{
  const result=propagate({graphComplete:false,universe:["a","hidden-consumer"],sources:["a"],scopes:["behavior"],outgoing:()=>[],threshold:()=>.9,preserved:()=>false})
  assert.deepEqual(result.affected,["a","hidden-consumer"])
  assert.ok(result.unknown.includes("hidden-consumer"))
  assert.throws(()=>propagate({graphComplete:false,sources:["a"],scopes:["behavior"],outgoing:()=>[],threshold:()=>.9,preserved:()=>false}),/conservative universe/)
})

test("T08 scoped patch는 과거 결정·영역 밖 expectation·낡은 계획을 보호한다",async()=>{
  const {validateScopedPatch}=await import("../packages/task-causality/src/replan.ts")
  const decision={id:"decision",version:1}
  const nodes=[{id:"root",dependencies:[],objective:"goal",expectedOutcome:{pass:true},decisionRefs:[]},{id:"a",parent:"root",dependencies:[],objective:"local",expectedOutcome:{pass:true},decisionRefs:[decision]},{id:"b",parent:"root",dependencies:[],objective:"preserve",expectedOutcome:{pass:true},decisionRefs:[]}]
  const lease={id:"l",planId:"p",baseRevision:1,graphHash:"g",inputVector:[],changedNodes:["a"],invalidatedNodes:["a"],preservedNodes:["b"],boundary:["a"],immutableDecisions:[decision],invalidAssumptions:[],predictionErrors:[],violatedInvariants:[],evidence:[{id:"e",version:1}],expiresAt:200,generation:1}
  const patch={revisedTasks:[{...nodes[1]!,objective:"repaired"}],newTasks:[],removedTasks:[],newDependencies:[],preservedDecisions:[decision],invalidatedAssumptions:[],expectedOutcomes:[{taskId:"a",value:{pass:true}}],confidence:1}
  const current={revision:1,graphHash:"g",generation:1,nodes,now:100,validEvidence:()=>true}
  assert.equal(validateScopedPatch(lease,patch,current).find(n=>n.id==="b")!.objective,"preserve")
  assert.throws(()=>validateScopedPatch(lease,patch,{...current,revision:2}),/Stale/)
  assert.throws(()=>validateScopedPatch(lease,{...patch,revisedTasks:[{...patch.revisedTasks[0]!,decisionRefs:[]}]},current),/immutable/)
  assert.throws(()=>validateScopedPatch(lease,{...patch,expectedOutcomes:[...patch.expectedOutcomes,{taskId:"b",value:{pass:false}}]},current),/escape/)
  assert.throws(()=>validateScopedPatch(lease,{...patch,newDependencies:[{from:"b",to:"a"}]},current),/external/)
})

test("T03 결정론 검사는 실제 프로세스 receipt를 생성하며 모형의 pass 주장을 쓰지 않는다",async()=>{
  const {executeValidator}=await import("../packages/task-evidence/src/validators.ts")
  const {EvidenceStore}=await import("../packages/task-evidence/src/index.ts")
  const store=new TaskGraphStore()
  try {
    const evidence=new EvidenceStore(store.control)
    const result=await executeValidator({id:"node-check",version:1,command:[process.execPath,"-e","process.stdout.write('검증 완료')"],cwd:".",environment:{},timeoutMs:5000,maxOutputBytes:1024,inputVector:[]},process.cwd(),evidence)
    assert.equal(result.receipt.exitCode,0);assert.equal(result.receipt.stdout,"검증 완료")
    assert.equal((evidence.require(result.evidence).content as {passed:boolean}).passed,true)
    const failure=await executeValidator({id:"node-check",version:1,command:[process.execPath,"-e","process.exit(2)"],cwd:".",environment:{},timeoutMs:5000,maxOutputBytes:1024,inputVector:[]},process.cwd(),evidence)
    assert.equal((evidence.require(failure.evidence).content as {passed:boolean}).passed,false)
  }finally{store.close()}
})

test("T14 구버전 event를 보존 이관하며 없는 causal 증거를 만들지 않는다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"adaptive-upgrade-")),file=join(directory,"graph.db")
  let store=new TaskGraphStore(file)
  try {
    store.db.prepare("INSERT INTO events(id,type,task_id,refs_json,payload_json,created_at) VALUES(?,?,?,?,?,?)").run("old","TASK_CREATED",null,null,JSON.stringify({legacy:true}),"2026-09-09T00:00:00Z")
    store.close();store=new TaskGraphStore(file)
    const row=store.db.prepare("SELECT payload FROM event_outbox WHERE id='old'").get()!
    const event=JSON.parse(String(row.payload))
    assert.equal(event.payload.data.legacy,true)
    assert.match(event.payload.provenance,/unknown/)
    assert.throws(()=>store.db.prepare("UPDATE event_outbox SET type='changed' WHERE id='old'").run(),/Immutable/)
    store.close();store=new TaskGraphStore(file)
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM event_outbox WHERE id='old'").get()!.n,1)
  }finally{store.close();rmSync(directory,{recursive:true,force:true})}
})

test("T14 OpenCode hook은 모델·도구·context 상한을 실제 요청 전에 검사한다",async()=>{
  const {grantHooks}=await import("../packages/opencode-harness/src/grant-hooks.ts")
  const grant={id:"g",profile:{provider:"test",model:"bounded",maxOutputTokens:30},allowedTools:["task_graph_cognitive_read"]} as import("../packages/task-cognition/src/model.ts").ActivationGrant
  const calls:unknown[]=[]
  const hooks=grantHooks({authorize:async(session,operation)=>{calls.push({session,operation});if(operation.inputBytes!==undefined&&operation.inputBytes>500)throw new Error("context overflow");return {grant,remainingInputTokens:500,remainingOutputTokens:20,remainingToolCalls:1}},recordTool:async()=>{},recordModel:async()=>{}})
  const params={maxOutputTokens:100}
  await hooks["chat.params"]({sessionID:"s",model:{providerID:"test",id:"bounded"}},params)
  assert.equal(params.maxOutputTokens,20)
  await assert.rejects(hooks["chat.params"]({sessionID:"s",model:{providerID:"test",id:"other"}},params),/match/)
  const output:{args:Record<string,unknown>}={args:{grantId:"forged",path:"src/a.ts"}}
  await hooks["tool.execute.before"]({sessionID:"s",tool:"task_graph_cognitive_read",callID:"c"},output)
  assert.equal(output.args.grantId,"g");assert.equal(output.args.workerSessionId,"s")
  await assert.rejects(hooks["tool.execute.before"]({sessionID:"s",tool:"bash",callID:"x"},output),/outside/)
  await assert.rejects(hooks["experimental.chat.messages.transform"]({}, {messages:[{info:{sessionID:"s"},parts:["x".repeat(1000)]}]}),/overflow/)
  assert.ok(calls.length>=4)
})

test("T01 실제 Graph MCP 관찰 경로가 새 이벤트를 소비하고 재조회에는 실행을 만들지 않는다",async()=>{
  const {createGraphMcp}=await import("../packages/opencode-harness/src/graph-mcp.ts")
  const runtime=createGraphMcp(":memory:",3,undefined,"controller")
  try {
    await runtime.server.handle({jsonrpc:"2.0",id:0,method:"initialize"})
    await runtime.server.handle({jsonrpc:"2.0",method:"notifications/initialized"})
    const a=runtime.engine.createTask({title:"생산",goal:"출력"})
    const b=runtime.engine.createTask({title:"소비",goal:"소비",dependencies:[a.id]})
    const result=await runtime.server.handle({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"task_control_status",arguments:{taskId:b.id}}})
    assert.ok(!("error" in result!))
    assert.ok(runtime.control.graph.outgoing(a.id).some(e=>e.target.entityId===b.id))
    const cursor=runtime.store.db.prepare("SELECT sequence FROM event_consumers WHERE id='graph-projection/v1'").get()!.sequence
    runtime.control.status(b.id)
    assert.equal(runtime.store.db.prepare("SELECT sequence FROM event_consumers WHERE id='graph-projection/v1'").get()!.sequence,cursor)
    assert.equal(runtime.store.db.prepare("SELECT count(*) AS n FROM agent_runs").get()!.n,0)
  }finally{runtime.close()}
})
