import { digest } from "../../task-control/src/value.ts"
import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { ControllerProgram } from "../../task-control/src/requests.ts"
import type { ReasoningProfile,RoleVersion } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"

const empty={type:"array",maxItems:0,items:{}}
const stringMap={type:"object",additionalProperties:{type:"string"}}
const booleanMap={type:"object",additionalProperties:{type:"boolean"}}
const versionRef={type:"object",required:["id","version"],properties:{id:{type:"string",minLength:1},version:{type:"integer",minimum:1}},additionalProperties:false}
const resultSchema={
  type:"object",required:["taskId","findings","decisions","risks","unresolvedQuestions","evidence","proposedTasks","confidence","requiresEscalation"],
  properties:{
    taskId:{type:"string"},findings:{type:"array",items:{}},decisions:{type:"array",items:{}},risks:{type:"array",items:{}},unresolvedQuestions:{type:"array",items:{}},evidence:{type:"array",items:versionRef},
    proposedTasks:{type:"array",items:{type:"object",required:["node","expectation"],properties:{
      node:{type:"object",required:["nodeId","label","stage","outcome","dependsOnNodeIds","taskSpec"],properties:{nodeId:{type:"string",minLength:1},label:{type:"string",minLength:1},stage:{enum:["research","design","implementation","validation"]},outcome:{type:"string",minLength:1},dependsOnNodeIds:{type:"array",items:{type:"string"}},taskSpec:{type:"object",required:["goal","assignedRole","writeScopes","acceptanceCriteria","design"],properties:{goal:{type:"string",minLength:1},assignedRole:{type:"string",minLength:1},writeScopes:{type:"array",minItems:1,items:{type:"string"}},acceptanceCriteria:{type:"array",minItems:1,items:{type:"object",required:["id","description"],properties:{id:{type:"string",minLength:1},description:{type:"string",minLength:1}},additionalProperties:false}},design:{type:"object",required:["basis","approach","inputs","outputs","verification","risks"],properties:{basis:{type:"array",minItems:1,items:{type:"string"}},approach:{type:"string",minLength:1},inputs:{type:"array",items:{type:"string"}},outputs:{type:"array",minItems:1,items:{type:"string"}},verification:{type:"array",minItems:1,items:{type:"string"}},risks:{type:"array",items:{type:"string"}}},additionalProperties:false}},additionalProperties:false}},additionalProperties:false},
      expectation:{type:"object",required:["expectedArtifacts","expectedInterface","expectedBehavior","expectedDependencies","expectedGoals","expectedRisk"],properties:{expectedArtifacts:stringMap,expectedInterface:stringMap,expectedBehavior:booleanMap,expectedDependencies:stringMap,expectedGoals:stringMap,expectedRisk:{type:"number",minimum:0,maximum:1}},additionalProperties:false},
    },additionalProperties:false}},confidence:{type:"number",minimum:0,maximum:1},requiresEscalation:{type:"boolean"},
  },additionalProperties:false,
}
const workerSchema={...resultSchema,properties:{...resultSchema.properties,proposedTasks:empty}}

const planValidator=String.raw`
let source="";for await(const chunk of process.stdin)source+=chunk
const input=JSON.parse(source),proof=input.evidence.find(value=>value.validatorVersion==="structured-proposal/v1"),proposal=proof?.content?.proposal
if(!Array.isArray(proposal)||!proposal.length)process.exit(2)
const ids=new Set(proposal.map(item=>item?.node?.nodeId));if(ids.size!==proposal.length||ids.has(undefined))process.exit(3)
for(const item of proposal){
 const node=item?.node,e=item?.expectation,s=node?.taskSpec?.writeScopes,c=node?.taskSpec?.acceptanceCriteria,d=node?.taskSpec?.design
 if(!node||!e||typeof node.taskSpec.assignedRole!=="string"||!node.taskSpec.assignedRole.trim()||!Array.isArray(s)||!s.length||new Set(s).size!==s.length||!Array.isArray(c)||!c.length||!d||!Array.isArray(d.basis)||!d.basis.length||!Array.isArray(d.verification)||!d.verification.length)process.exit(4)
 if(!Array.isArray(node.dependsOnNodeIds)||node.dependsOnNodeIds.some(id=>!ids.has(id)||id===node.nodeId))process.exit(5)
 if(Object.keys(e.expectedArtifacts??{}).sort().join("\0")!==[...s].sort().join("\0")||Object.values(e.expectedArtifacts).some(value=>typeof value!=="string"))process.exit(6)
 if(c.some(value=>!value?.id||e.expectedBehavior?.[value.id]!==true)||Object.keys(e.expectedBehavior??{}).length!==c.length)process.exit(7)
 for(const field of ["expectedInterface","expectedDependencies","expectedGoals"])if(!e[field]||Object.values(e[field]).some(value=>typeof value!=="string"))process.exit(8)
 if(typeof e.expectedRisk!=="number"||e.expectedRisk<0||e.expectedRisk>1)process.exit(9)
}
`

const stateValidator=String.raw`
const {lstatSync,readFileSync}=require("node:fs"),{resolve,relative,isAbsolute}=require("node:path")
let source="";process.stdin.on("data",chunk=>source+=chunk);process.stdin.on("end",()=>{
 const input=JSON.parse(source),target=input.evidence.find(value=>value.validatorVersion==="pinned-expectation/v1"),expected=target?.content?.expectation
 if(!expected)process.exit(2)
 const artifacts={};let passed=true
 for(const [path,value] of Object.entries(expected.expectedArtifacts)){
  try{const absolute=resolve(process.cwd(),path),rel=relative(process.cwd(),absolute),stat=lstatSync(absolute);if(!path||isAbsolute(path)||rel.startsWith("..")||stat.isSymbolicLink()||!stat.isFile()||stat.nlink!==1)throw new Error();artifacts[path]=readFileSync(absolute,"utf8")}catch{artifacts[path]="<missing-or-aliased>"}
  if(artifacts[path]!==value)passed=false
 }
 console.log(JSON.stringify({state:{artifacts,contract:expected.expectedInterface,behavior:Object.fromEntries(Object.keys(expected.expectedBehavior).map(key=>[key,passed&&expected.expectedBehavior[key]===true])),dependencies:expected.expectedDependencies,goals:expected.expectedGoals,risk:passed?expected.expectedRisk:1},criticalViolations:passed?[]:["Workspace files differ from the approved exact artifacts"]}))
})
`

function profile(model:string):ReasoningProfile {
  const slash=model.indexOf("/")
  if(slash<1||!model.slice(slash+1))throw new Error("Automatic host model must be provider/model")
  const subscription=model.startsWith("openai/")
  return {id:`local-${subscription?"subscription-v3":"bounded-v1"}`,level:3,provider:model.slice(0,slash),model:model.slice(slash+1),maxInputTokens:subscription?null:128000,maxOutputTokens:subscription?null:16000,maxToolCalls:subscription?null:64,timeoutMs:180000,capability:{usage:true,tokenLimit:!subscription,toolLimit:!subscription,timeout:true},independentRoles:[]}
}

/** Install the operator-configured, exact-artifact local baseline in each project DB. */
export function provisionDefaultProgram(runtime:ControlRuntime,model:string):VersionRef {
  const suffix=digest({model,contract:"exact-artifact-v8"}).slice(0,12),id=`local-default-${suffix}`
  if(runtime.engine.store.control.get("controller_programs",id,1))return {id,version:1}
  const authorizationContent={kind:"configured-local-controller",model,contract:"exact approved artifacts v8"}
  const authorization=runtime.evidence.put({id:`${id}-authorization`,version:1,type:"code",source:"installed automatic host configuration",producer:"default-program",validatorVersion:"configured-local-controller/v1",timestamp:Date.now(),confidence:1,content:authorizationContent,contentHash:digest(authorizationContent),inputVector:[],expiresAt:null})
  const planId=`local-plan-${suffix}`,stateId=`local-state-${suffix}`
  runtime.validators.register({id:planId,version:1,command:[process.execPath,"-e",planValidator],cwd:".",environment:{},timeoutMs:3000,maxOutputBytes:2000,authorization:[authorization]})
  runtime.validators.register({id:stateId,version:1,command:[process.execPath,"-e",stateValidator],cwd:".",environment:{},timeoutMs:5000,maxOutputBytes:262144,authorization:[authorization],output:"semantic-state"})
  const p=profile(model),base={version:1,activationPolicy:{hardTriggers:[],softSignals:{},threshold:1,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:64000,maxDependencyDepth:2,maxEvidenceItems:16,maxHistoricalDecisions:4},validators:[],lifecycle:"persistent" as const,evidence:[authorization]}
  const workerId=`local-worker-${suffix}`,plannerSchema=structuredClone(resultSchema) as any
  plannerSchema.properties.proposedTasks.items.properties.node.properties.taskSpec.properties.assignedRole={type:"string",const:workerId}
  const planner:RoleVersion={...base,id:`local-planner-${suffix}`,name:"Local exact-artifact planner",purpose:"Inspect the repository and propose reviewable exact file artifacts",capabilities:["bounded repository inspection","exact artifact planning"],prompt:`Use sparse repository inspection. In the first tool round call cognitive_context and cognitive_list for path . together. In the second tool round call cognitive_read for at most six strictly necessary files together. Do not start a third tool round; return the plan immediately. Return only JSON matching outputSchema with the supplied taskId. For missing user information, return unresolvedQuestions and no proposal. Otherwise propose a small dependency-valid plan. Every leaf must set assignedRole exactly to ${workerId} and name exact file writeScopes; expectedArtifacts must map each writeScope to the complete exact UTF-8 file content that will exist after execution. Each acceptance criterion needs a stable id with expectedBehavior[id]=true. Include concrete design basis, approach, inputs, outputs, verification, and risks. Put repository path and hash observations in findings. The evidence array may contain only existing context evidence references shaped exactly as {id,version}; use an empty array when no such reference supports the result. Do not modify files.`,outputSchema:plannerSchema,allowedTools:["task_graph_cognitive_context","task_graph_cognitive_list","task_graph_cognitive_read"]}
  const worker:RoleVersion={...base,id:workerId,name:"Local exact-artifact worker",purpose:"Apply only the approved exact artifacts through the bounded file gateway",capabilities:["bounded repository inspection","atomic exact file replacement"],prompt:"Use cognitive_context to read the approved task and expectation. Use cognitive_list and cognitive_read as needed. For each granted writeScope, make its complete UTF-8 content exactly equal to expectedArtifacts[path] using cognitive_write with the observed previous hash or null for a missing file, then read it back. Return only JSON matching outputSchema with the supplied taskId. Do not propose tasks or claim success before exact read-back.",outputSchema:workerSchema,allowedTools:["task_graph_cognitive_context","task_graph_cognitive_list","task_graph_cognitive_read","task_graph_cognitive_write"]}
  runtime.roleLifecycle.installConfigured(planner,`installed local controller ${id}`)
  runtime.roleLifecycle.installConfigured(worker,`installed local controller ${id}`)
  runtime.engine.defineRole({id:worker.id,name:worker.name,description:worker.purpose,capabilities:worker.capabilities,allowedTools:worker.allowedTools,constraints:["Execute only controller-approved exact artifacts and scopes"]})
  runtime.engine.store.control.put("policy_versions",id,1,{id,version:1,authorization:[authorization]})
  const program:ControllerProgram={id,version:1,authorization:[authorization],policy:{id,version:1},planner:{role:{id:planner.id,version:1},profile:p},worker:{role:{id:worker.id,version:1},profile:p},planValidators:[`${planId}/v1`],observationValidators:[`${stateId}/v1`],predictionPolicy:{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.5,exit:.1},readScopes:["."],writeScopes:["."],maxTasks:8,grantLifetimeMs:180000,account:id,tokenLimit:null,maxClarifications:2,maxInputReplans:2,maxLocalRepairs:0,fileObservation:{maxFiles:1000,maxBytes:1048576}}
  runtime.requests.register(program)
  return {id,version:1}
}
