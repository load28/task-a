import { digest } from "../packages/task-control/src/value.ts"
import type { ControllerProgram } from "../packages/task-control/src/requests.ts"
import type { ReasoningProfile, RoleVersion } from "../packages/task-cognition/src/model.ts"
import type { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"

type Runtime = ReturnType<typeof createGraphRuntime>

const emptyArray = { type: "array", maxItems: 0, items: {} }
const taskSchema = (file: string) => {
  const criterion = `${file}-exact`
  return {
    type: "object",
    required: ["node", "expectation"],
    properties: {
      node: {
        type: "object",
        required: ["nodeId", "label", "stage", "outcome", "dependsOnNodeIds", "taskSpec"],
        properties: {
          nodeId: { const: `write-${file.replace(/[^a-z0-9]+/gi, "-")}` },
          label: { const: `Write ${file}` },
          stage: { const: "implementation" },
          outcome: { const: `${file} contains exact content` },
          dependsOnNodeIds: emptyArray,
          taskSpec: {
            type: "object",
            required: ["goal", "writeScopes", "acceptanceCriteria"],
            properties: {
              goal: { const: `Write exact greeting to ${file}` },
              writeScopes: { type: "array", minItems: 1, maxItems: 1, items: { const: file } },
              acceptanceCriteria: {
                type: "array", minItems: 1, maxItems: 1,
                items: { type: "object", required: ["id", "description"], properties: { id: { const: criterion }, description: { const: `${file} contains exactly 안녕하세요` } }, additionalProperties: false },
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      expectation: {
        type: "object",
        required: ["expectedArtifacts", "expectedInterface", "expectedBehavior", "expectedDependencies", "expectedGoals", "expectedRisk"],
        properties: {
          expectedArtifacts: { type: "object", required: [file], properties: { [file]: { const: "안녕하세요" } }, additionalProperties: false },
          expectedInterface: { type: "object", maxProperties: 0, additionalProperties: false },
          expectedBehavior: { type: "object", required: [criterion], properties: { [criterion]: { const: true } }, additionalProperties: false },
          expectedDependencies: { type: "object", maxProperties: 0, additionalProperties: false },
          expectedGoals: { type: "object", maxProperties: 0, additionalProperties: false },
          expectedRisk: { const: 0 },
        },
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  }
}
const resultSchema = (files: string[], planning: boolean) => ({
  type: "object",
  required: ["taskId", "findings", "decisions", "risks", "unresolvedQuestions", "evidence", "proposedTasks", "confidence", "requiresEscalation"],
  properties: {
    taskId: { type: "string" },
    findings: planning ? emptyArray : { type: "array", items: {} },
    decisions: emptyArray,
    risks: emptyArray,
    unresolvedQuestions: emptyArray,
    evidence: emptyArray,
    proposedTasks: planning ? { type: "array", minItems: files.length, maxItems: files.length, items: { anyOf: files.map(taskSchema) } } : emptyArray,
    confidence: { const: 1 },
    requiresEscalation: { const: false },
  },
  additionalProperties: false,
})

const planValidator = String.raw`
let source="";for await(const chunk of process.stdin)source+=chunk
const input=JSON.parse(source),files=JSON.parse(process.argv[1])
const proof=input.evidence.find(value=>value.validatorVersion==="structured-proposal/v1")
const proposal=proof?.content?.proposal
if(!Array.isArray(proposal)||proposal.length!==files.length)process.exit(2)
const seen=new Set()
for(const item of proposal){
  const node=item?.node,expectation=item?.expectation,scopes=node?.taskSpec?.writeScopes,criteria=node?.taskSpec?.acceptanceCriteria
  if(!node||!expectation||!Array.isArray(scopes)||scopes.length!==1||!files.includes(scopes[0])||seen.has(scopes[0]))process.exit(3)
  seen.add(scopes[0])
  if(node.dependsOnNodeIds?.length!==0||expectation.expectedArtifacts?.[scopes[0]]!=="안녕하세요")process.exit(4)
  if(Object.keys(expectation.expectedArtifacts).length!==1||Object.keys(expectation.expectedInterface??{}).length||Object.keys(expectation.expectedDependencies??{}).length||Object.keys(expectation.expectedGoals??{}).length||expectation.expectedRisk!==0)process.exit(5)
  if(!Array.isArray(criteria)||criteria.length!==1||!criteria[0]?.id||expectation.expectedBehavior?.[criteria[0].id]!==true||Object.keys(expectation.expectedBehavior).length!==1)process.exit(6)
}
`

const stateValidator = String.raw`
const {readFileSync}=require("node:fs")
let source="";process.stdin.on("data",chunk=>source+=chunk);process.stdin.on("end",()=>{
  const input=JSON.parse(source),target=input.evidence.find(value=>value.validatorVersion==="pinned-expectation/v1"),expected=target?.content?.expectation
  if(!expected)process.exit(2)
  const artifacts={};let passed=true
  for(const [path,value] of Object.entries(expected.expectedArtifacts)){try{artifacts[path]=readFileSync(path,"utf8")}catch{artifacts[path]="<missing>"}if(artifacts[path]!==value)passed=false}
  const behavior=Object.fromEntries(Object.keys(expected.expectedBehavior).map(key=>[key,passed&&expected.expectedBehavior[key]===true]))
  console.log(JSON.stringify({state:{artifacts,contract:expected.expectedInterface,behavior,dependencies:expected.expectedDependencies,goals:expected.expectedGoals,risk:passed?expected.expectedRisk:1},criticalViolations:passed?[]:["Expected file content does not match the pinned expectation"]}))
})
`

function profile(model: string): ReasoningProfile {
  const slash = model.indexOf("/")
  if (slash < 1 || !model.slice(slash + 1)) throw new Error("Evaluation model must be provider/model")
  return {
    id: "evaluation-subscription-v3",
    level: 3,
    provider: model.slice(0, slash),
    model: model.slice(slash + 1),
    maxInputTokens: null,
    maxOutputTokens: null,
    maxToolCalls: null,
    timeoutMs: 90000,
    capability: { usage: true, tokenLimit: false, toolLimit: false, timeout: true },
    independentRoles: [],
  }
}

export function provisionEvaluationProgram(runtime: Runtime, model: string, parallel: boolean): ControllerProgram {
  const files = parallel ? ["a.txt", "b.txt"] : ["hello.txt"]
  const content = { authorization: "explicit live subscription evaluation", files, model }
  const authorization = runtime.control.evidence.put({
    id: "evaluation-operator",
    version: 1,
    type: "user",
    source: "evaluate:host invocation",
    producer: "evaluation-program",
    validatorVersion: "explicit-evaluation-authorization/v1",
    timestamp: Date.now(),
    confidence: 1,
    content,
    contentHash: digest(content),
    inputVector: [],
    expiresAt: null,
  })
  runtime.control.validators.register({
    id: "evaluation-plan",
    version: 1,
    command: [process.execPath, "-e", planValidator, JSON.stringify(files)],
    cwd: ".",
    environment: {},
    timeoutMs: 3000,
    maxOutputBytes: 2000,
    authorization: [authorization],
  })
  runtime.control.validators.register({
    id: "evaluation-state",
    version: 1,
    command: [process.execPath, "-e", stateValidator],
    cwd: ".",
    environment: {},
    timeoutMs: 3000,
    maxOutputBytes: 4000,
    authorization: [authorization],
    output: "semantic-state",
  })
  const subscription = profile(model)
  const planner: RoleVersion = {
    id: "evaluation-planner",
    version: 1,
    name: "Subscription evaluation planner",
    purpose: "Produce the exact independently validated evaluation plan",
    capabilities: ["sparse decomposition"],
    prompt: `Return only one compact JSON object matching outputSchema. Use the supplied taskId. Set findings, decisions, risks, unresolvedQuestions, and evidence to []; confidence to 1; requiresEscalation to false. Create exactly ${files.length} proposedTasks, one per file in ${JSON.stringify(files)}. Each task must have a unique nodeId, stage implementation, no dependencies, one writeScope equal to that file, and one acceptance criterion with a stable id. Its expectation must be expectedArtifacts {file: "안녕하세요"}, expectedBehavior {criterionId: true}, empty expectedInterface/expectedDependencies/expectedGoals, and expectedRisk 0. Do not call tools.`,
    activationPolicy: { hardTriggers: [], softSignals: {}, threshold: 1, cooldownMs: 0, maxInvocationsPerTask: 1 },
    requiredContext: [],
    contextBudget: { maxTokens: 32000, maxDependencyDepth: 1, maxEvidenceItems: 12, maxHistoricalDecisions: 2 },
    outputSchema: resultSchema(files, true),
    validators: [],
    allowedTools: [],
    lifecycle: "persistent",
    evidence: [authorization],
  }
  const worker: RoleVersion = {
    ...planner,
    id: "evaluation-worker",
    name: "Subscription evaluation worker",
    purpose: "Write and verify exactly one granted evaluation file",
    capabilities: ["scoped file replacement", "read-back verification"],
    prompt: "Use only the granted cognitive file tools. Read the supplied context to identify the single granted file and pinned expected content. If the file exists, read it and pass its hash as previousHash; otherwise use null. Write exactly 안녕하세요 with no newline, then read it back. Return only one compact JSON object matching outputSchema with the supplied taskId; findings may record the read-back, and decisions, risks, unresolvedQuestions, evidence, proposedTasks must be []; confidence must be 1 and requiresEscalation false.",
    outputSchema: resultSchema([], false),
    allowedTools: ["task_graph_cognitive_context", "task_graph_cognitive_read", "task_graph_cognitive_write"],
  }
  runtime.control.roleLifecycle.installConfigured(planner, "live subscription host evaluation planner")
  runtime.control.roleLifecycle.installConfigured(worker, "live subscription host evaluation worker")
  runtime.store.control.put("policy_versions", "evaluation-policy", 1, { id: "evaluation-policy", version: 1, authorization: [authorization] })
  const program: ControllerProgram = {
    id: "evaluation-program",
    version: 1,
    authorization: [authorization],
    policy: { id: "evaluation-policy", version: 1 },
    planner: { role: { id: planner.id, version: 1 }, profile: subscription },
    worker: { role: { id: worker.id, version: 1 }, profile: subscription },
    planValidators: ["evaluation-plan/v1"],
    observationValidators: ["evaluation-state/v1"],
    predictionPolicy: { weights: { contract: 0.25, behavior: 0.25, dependency: 0.25, goal: 0.25 }, enter: 0.5, exit: 0.1 },
    readScopes: files,
    writeScopes: files,
    maxTasks: files.length,
    grantLifetimeMs: 180000,
    account: "evaluation",
    tokenLimit: null,
    maxClarifications: 0,
    maxInputReplans: 0,
    maxLocalRepairs: 0,
  }
  runtime.control.requests.register(program)
  return program
}
