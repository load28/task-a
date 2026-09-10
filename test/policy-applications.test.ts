import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { INTEGRATION_DIMENSIONS } from "../packages/task-evidence/src/integration.ts"
import { POLICY_TARGETS,type PolicyEffect,type PolicyProposal } from "../packages/task-policy/src/index.ts"
import type { ControllerProgram } from "../packages/task-control/src/requests.ts"
import type { ReasoningProfile,RoleVersion } from "../packages/task-cognition/src/model.ts"

const profile=(id:string,level:2|3|4=3):ReasoningProfile=>({id,level,provider:"test",model:"bounded",maxInputTokens:2000,maxOutputTokens:200,maxToolCalls:2,timeoutMs:1000,capability:{usage:true,tokenLimit:true,toolLimit:true,timeout:true},independentRoles:[]})
const validators=Object.fromEntries(INTEGRATION_DIMENSIONS.map(dimension=>[dimension,`${dimension}/v1`])) as Record<typeof INTEGRATION_DIMENSIONS[number],string>

test("13개 활성 정책 head는 요청별 불변 bundle로 고정되고 각 target의 실행 설정을 합성한다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const p=profile("base"),higher=profile("higher",4),role=(id:string):RoleVersion=>({id,version:1,name:id,purpose:id,capabilities:[],prompt:id,activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:1000,maxDependencyDepth:1,maxEvidenceItems:2,maxHistoricalDecisions:1},outputSchema:{type:"object"},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[]})
    for(const id of ["base-role","specialist","replacement"])r.store.control.put("role_versions",id,1,role(id))
    for(const id of ["plan-extra","state-extra","replan-extra","binding",...INTEGRATION_DIMENSIONS])r.store.control.put("validator_versions",id,1,{id,version:1,output:id==="state-extra"?"semantic-state":undefined})
    r.store.control.put("routine_versions","routine",1,{id:"routine",version:1})
    const base:ControllerProgram={id:"program",version:1,authorization:[],policy:{id:"baseline",version:1},planner:{role:{id:"base-role",version:1},profile:p},worker:{role:{id:"base-role",version:1},profile:p},specialists:[{role:{id:"specialist",version:1},profile:p}],planValidators:["plan/v1"],observationValidators:["state/v1"],predictionPolicy:{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},readScopes:["."],writeScopes:["."],maxTasks:2,grantLifetimeMs:1000,account:"test",tokenLimit:10000,replanner:{role:{id:"base-role",version:1},profile:p,validators:["plan/v1"],maxAttempts:1}}
    const effects:Record<typeof POLICY_TARGETS[number],PolicyEffect>={
      activation:{kind:"activation",role:{id:"specialist",version:1},mode:"require"},
      context:{kind:"context",slot:"all",budget:{maxTokens:900,maxDependencyDepth:2,maxEvidenceItems:4,maxHistoricalDecisions:2},requiredContext:[{relation:"depends_on",ports:["inputs"],required:true,depth:2}]},
      decomposition:{kind:"decomposition",maxTasks:7},role:{kind:"role",slot:"worker",role:{id:"replacement",version:1},profile:higher},
      validation:{kind:"validation",phase:"plan",validators:["plan-extra/v1"]},integration:{kind:"integration",validators},
      escalation:{kind:"escalation",maxClarifications:3,maxInputReplans:4,maxLocalRepairs:5},cache:{kind:"cache",reuse:"disabled"},
      precision:{kind:"precision",minimumProfile:higher},propagation:{kind:"propagation",threshold:.25},
      boundary:{kind:"boundary",requireComplete:true,bindingValidator:"binding/v1",proofMaxAgeMs:5000},
      expectation:{kind:"expectation",policy:{weights:{contract:.4,behavior:.3,dependency:.2,goal:.1},enter:.4,exit:.05}},
      routine:{kind:"routine",allow:[{id:"routine",version:1}]},
    }
    for(const target of POLICY_TARGETS) {
      const proposal:PolicyProposal={id:`${target}-policy`,version:1,target,observedPattern:"measured",rootCause:"structural",proposedInvariant:"preserve obligations",proposedRule:{op:"scope",value:"implementation"},effect:effects[target],expectedBenefit:1,regressionRisk:.1,evidence:[{id:"e",version:1}],supportingCases:[{id:"e",version:1}],counterexamples:[],structuralAbstraction:"implementation scope",holdoutCriteria:["independent"],rollbackCondition:"regression",rollback:{id:"baseline",version:1}}
      r.store.control.put("policy_versions",proposal.id,1,proposal)
      r.store.db.prepare("INSERT INTO policy_heads VALUES(?,?,?)").run(target,proposal.id,1)
    }
    const bundle=r.control.requests.policies.snapshot("request")
    const result=r.control.requests.policies.apply("request",bundle,base,{entityId:"task",features:{},relations:[],scopes:["implementation"]})
    assert.equal(result.applications.length,13);assert.ok(result.applications.every(item=>item.ruleResult===true&&item.effect?.kind===item.target))
    assert.equal(result.program.maxTasks,7);assert.equal(result.program.worker.role.id,"replacement");assert.equal(result.program.worker.profile.level,4)
    assert.deepEqual(result.program.planValidators,["plan/v1","plan-extra/v1"]);assert.deepEqual(result.program.integrationValidators,validators)
    assert.deepEqual([result.program.maxClarifications,result.program.maxInputReplans,result.program.maxLocalRepairs],[3,4,5])
    assert.equal(result.program.policyControls?.cacheReuse,"disabled");assert.equal(result.program.policyControls?.propagationThreshold,.25);assert.equal(result.program.policyControls?.requireCompleteBoundary,true)
    assert.deepEqual(result.program.policyControls?.requiredSpecialistRoles,["specialist"]);assert.deepEqual(result.program.policyControls?.allowedRoutines,[{id:"routine",version:1}])
    assert.equal(result.program.predictionPolicy.enter,.4);assert.equal(result.program.planner.contextPolicy?.budget.maxDependencyDepth,2)
    r.store.control.put("policy_versions","later",1,{...r.store.control.get<PolicyProposal>("policy_versions","cache-policy",1)!,id:"later"})
    r.store.db.prepare("UPDATE policy_heads SET policy_id='later' WHERE target='cache'").run()
    assert.equal(r.control.requests.policies.snapshot("request").heads.cache.policy?.id,"cache-policy")
    assert.equal(r.control.requests.policies.snapshot("next-request").heads.cache.policy?.id,"later")
    assert.throws(()=>r.store.db.prepare("UPDATE policy_bundles SET payload='{}'").run(),/Immutable policy bundle/)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM policy_applications WHERE request_id='request'").get()!.n,13)
  }finally{r.close()}
})

test("관측되지 않은 구조 feature는 정책 미적용이 아니라 unknown 판정으로 보존된다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const proposal:PolicyProposal={id:"unknown",version:1,target:"cache",observedPattern:"risk",rootCause:"risk",proposedInvariant:"safe cache",proposedRule:{op:"gte",feature:"risk",value:.5},effect:{kind:"cache",reuse:"disabled"},expectedBenefit:1,regressionRisk:0,evidence:[{id:"e",version:1}],supportingCases:[{id:"e",version:1}],counterexamples:[],structuralAbstraction:"risk",holdoutCriteria:["independent"],rollbackCondition:"regression",rollback:{id:"baseline",version:1}}
    r.store.control.put("policy_versions",proposal.id,1,proposal);r.store.db.prepare("INSERT INTO policy_heads VALUES('cache','unknown',1)").run()
    const bundle=r.control.requests.policies.snapshot("unknown-request"),result=r.control.requests.policies.apply("unknown-request",bundle,{} as ControllerProgram,{entityId:"task",features:{risk:null},relations:[],scopes:[]})
    assert.equal(result.applications.find(item=>item.target==="cache")!.ruleResult,null);assert.equal(result.applications.find(item=>item.target==="cache")!.effect,null)
  }finally{r.close()}
})
