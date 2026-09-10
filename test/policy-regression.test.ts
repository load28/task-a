import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { PolicyLearning,type PolicyProposal } from "../packages/task-policy/src/index.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type Signals,type RoleVersion } from "../packages/task-cognition/src/model.ts"
import { digest } from "../packages/task-control/src/value.ts"

for(const mode of ["regressed","unchanged","malformed","failed","stale","aba","restart","observed-only","execution-error","truncated"] as const)test(`실제 정책 회귀 검증과 head fencing: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"policy-regression-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const content={condition:"A result containing the risk 'regression' violates the registered invariant"}
    const authorization=r.control.evidence.put({id:"operator",version:1,type:"code",source:"test controller",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const proposal:PolicyProposal={id:"learned",version:1,target:"activation",observedPattern:"관측 결과",rootCause:"호출 정책",proposedInvariant:"위험 보존",proposedRule:{op:"gte",feature:"risk",value:.5},expectedBenefit:1,regressionRisk:.1,evidence:[authorization],supportingCases:[authorization],counterexamples:[],structuralAbstraction:"risk band",holdoutCriteria:["independent episode"],rollbackCondition:"quality regression",rollback:{id:"learned",version:1}}
    r.store.control.put("policy_versions",proposal.id,1,proposal)
    r.store.control.put("policy_versions",proposal.id,2,{...proposal,version:2})
    r.store.db.prepare("INSERT INTO policy_heads VALUES('activation','learned',2)").run()
    const command=mode==="failed"?'process.exit(2)':mode==="malformed"?'console.log("not a verdict")':mode==="truncated"?'console.log(JSON.stringify({regressed:true,reason:"fixture"}));console.log(" ".repeat(5000))':`let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);const sample=input.evidence.find(e=>e.producer==='policy-regression').content;console.log(JSON.stringify({regressed:sample.result.output.risks.includes('regression'),reason:'Compared the accepted result with the registered invariant'}));`
    r.control.validators.register({id:"regression",version:1,command:[process.execPath,"-e",command],cwd:mode==="execution-error"?"nonexistent-validator-directory":".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
    const watchInput={id:"watch",target:"activation" as const,policy:{id:"learned",version:2},rollback:{id:"learned",version:1},validator:"regression/v1",condition:authorization,authorization:[authorization],maxSamples:1,sampleType:mode==="observed-only"?"observed" as const:"synthetic" as const}
    const watch=r.control.policyRegression.register(watchInput)
    const role:RoleVersion={id:"worker",version:1,name:"worker",purpose:"work",capabilities:[],prompt:"work",activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:3},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:1,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[authorization]}
    r.control.roleLifecycle.installConfigured(role,"policy regression fixture")
    const issue=()=>{
      const task=r.engine.createTask({title:"sample",goal:"sample"})
      const context=budgetContext({taskId:task.id,role,policy:watch.policy,items:[],scaffold:role.prompt,outputReservation:10,countTokens:s=>Buffer.byteLength(s)})
      r.store.control.put("context_manifests",context.id,1,context)
      const decision=r.control.admission.record(activation({taskId:task.id,eventId:task.id,eligible:true,role,policy:watch.policy,signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
      const grant=r.control.admission.issue({decisionId:decision.id,taskId:task.id,specHash:r.engine.signals.capture(task.id).specHash,inputVector:[],graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:watch.policy,context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"fixture",level:3,provider:"test",model:"bounded",maxInputTokens:1000,maxOutputTokens:100,maxToolCalls:1,timeoutMs:60000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]},writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+60000,generation:1},"fixture",10000)
      r.control.admission.claim(grant.id,{worker:grant.id,specHash:grant.specHash,inputVector:[],graphHash:grant.graphHash,generation:1,now:Date.now()})
      return grant
    }
    const first=issue(),inFlight=issue()
    const complete=(grant:typeof first)=>r.control.admission.submit(grant.id,grant.id,{taskId:grant.taskId,findings:[],decisions:[],risks:mode==="unchanged"?[]:["regression"],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false},{inputTokens:1,outputTokens:1,toolCalls:0,elapsedMs:1})
    complete(first)
    if(mode==="observed-only") {
      assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_regression_samples").get()!.n,0)
      assert.equal(new PolicyLearning(r.store.control).head("activation").policy!.version,2)
      return
    }
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_regression_samples").get()!.n,1)
    if(mode==="stale"||mode==="aba") {
      r.store.db.prepare("UPDATE policy_heads SET version=1 WHERE target='activation'").run()
      if(mode==="aba")r.store.db.prepare("UPDATE policy_heads SET version=2 WHERE target='activation'").run()
    }
    if(mode==="restart") {r.close();r=createGraphRuntime(file)}
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:4000})
    const learning=new PolicyLearning(r.store.control),state=r.store.db.prepare("SELECT state FROM policy_regression_state WHERE watch_id='watch'").get()!.state
    const rolledBack=["regressed","restart"].includes(mode)
    assert.equal(state,rolledBack?"rolled-back":["stale","aba"].includes(mode)?"superseded":"sample-budget-exhausted")
    assert.equal(learning.head("activation").policy!.version,rolledBack||mode==="stale"?1:2)
    assert.equal(r.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(inFlight.id)!.state,"claimed")
    assert.equal(JSON.parse(String(r.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(inFlight.id)!.payload)).policy.version,2)
    for(let i=0;i<3;i++)r.engine.atomic(()=>r.control.policyRegression.ingest())
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='PolicyRolledBack'").get()!.n,rolledBack?1:0)
    if(["malformed","failed","execution-error","truncated"].includes(mode))assert.equal(r.store.db.prepare("SELECT state FROM policy_regression_samples").get()!.state,"unknown")
    assert.throws(()=>r.control.policyRegression.register({...watchInput,maxSamples:2}),/immutable/)
    if(mode==="aba")assert.throws(()=>learning.rollback("activation",watch.rollback,[authorization],()=>true,{policy:watch.policy,revision:watch.headRevision}),/Stale/)
    complete(inFlight)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_regression_samples").get()!.n,1)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
