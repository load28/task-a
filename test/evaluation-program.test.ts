import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { provisionEvaluationProgram } from "../scripts/evaluation-program.ts"
import type { ActivationGrant, AgentOutput } from "../packages/task-cognition/src/model.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { withTaskAdmission } from "../packages/task-control/src/task-admission.ts"

for (const parallel of [false, true]) test(`실제 host 평가는 실행 전에 완전한 제어 프로그램을 고정한다: ${parallel ? "parallel" : "single"}`, () => {
  const directory = mkdtempSync(join(tmpdir(), "evaluation-program-"))
  const database = join(directory, "tasks.db")
  const runtime = createGraphRuntime(database)
  try {
    const program = provisionEvaluationProgram(runtime, "openai/example", parallel)
    assert.deepEqual(runtime.store.control.get("controller_programs", program.id, program.version), program)
    assert.equal(runtime.control.roleLifecycle.executable(program.planner.role, ref => runtime.control.evidence.valid(ref)), true)
    assert.equal(runtime.control.roleLifecycle.executable(program.worker.role, ref => runtime.control.evidence.valid(ref)), true)
    assert.ok(runtime.store.control.get("validator_versions", "evaluation-plan", 1))
    assert.ok(runtime.store.control.get("validator_versions", "evaluation-state", 1))
    assert.equal(program.planner.profile.maxOutputTokens, null)
    assert.equal(program.planner.profile.maxInputTokens, null)
    assert.equal(program.planner.profile.maxToolCalls, null)
    assert.equal(program.planner.profile.capability.tokenLimit, false)
    assert.equal(program.planner.profile.capability.toolLimit, false)
    assert.equal(program.tokenLimit, null)
    const request = runtime.control.requests.submit({ id: "evaluation", sessionId: "test", text: "평가", planOnly: false, program: { id: program.id, version: program.version } })
    runtime.control.requests.tick()
    const started = runtime.control.requests.get(request.id)!
    assert.equal(started.state, "planning")
    assert.ok(started.plannerGrant)
  } finally {
    runtime.close()
    rmSync(directory, { recursive: true, force: true })
  }
})

test("평가 프로그램은 합성 실행에서 계획 검증과 실제 파일 관찰을 거쳐 완료한다", async () => {
  const directory = mkdtempSync(join(tmpdir(), "evaluation-program-e2e-"))
  const database = join(directory, "tasks.db")
  const runtime = createGraphRuntime(database)
  const output = (taskId: string, proposedTasks: unknown[] = []): AgentOutput => ({ taskId, findings: [], decisions: [], risks: [], unresolvedQuestions: [], evidence: [], proposedTasks, confidence: 1, requiresEscalation: false })
  const claim = (grant: ActivationGrant, worker: string) => runtime.control.admission.claim(grant.id, { worker, specHash: grant.specHash, inputVector: grant.inputVector, graphHash: runtime.control.graph.hash(), generation: grant.generation, now: Date.now() })
  try {
    const program = provisionEvaluationProgram(runtime, "openai/example", false)
    const request = runtime.control.requests.submit({ id: "evaluation", sessionId: "test", text: "hello.txt에 정확히 안녕하세요를 기록하고 검증하세요.", planOnly: false, program: { id: program.id, version: program.version } })
    runtime.control.requests.tick()
    const plannerId = runtime.control.requests.get(request.id)!.plannerGrant!
    const planner = JSON.parse(String(runtime.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(plannerId)!.payload)) as ActivationGrant
    const proposal = [{ node: { nodeId: "write-hello-txt", label: "Write hello.txt", stage: "implementation", outcome: "hello.txt contains exact content", dependsOnNodeIds: [], taskSpec: { goal: "Write exact greeting to hello.txt", writeScopes: ["hello.txt"], acceptanceCriteria: [{ id: "hello.txt-exact", description: "hello.txt contains exactly 안녕하세요" }] } }, expectation: { expectedArtifacts: { "hello.txt": "안녕하세요" }, expectedInterface: {}, expectedBehavior: { "hello.txt-exact": true }, expectedDependencies: {}, expectedGoals: {}, expectedRisk: 0 } }]
    claim(planner, "planner")
    runtime.control.admission.submit(planner.id, "planner", output(planner.taskId, proposal), { inputTokens: 10, outputTokens: 10, toolCalls: 0, elapsedMs: 1 })
    runtime.control.requests.tick()
    const stateValidation = await runtime.control.validators.run(directory, { maxJobs: 1, maxDurationMs: 5000 })
    assert.deepEqual(stateValidation.map(result => result.state), ["passed"], JSON.stringify(runtime.store.db.prepare("SELECT state,payload FROM validation_jobs").all()))
    runtime.control.requests.tick()
    const taskId = runtime.control.requests.tasks(request.id)[0]!
    const workerRow = runtime.store.db.prepare("SELECT id,payload FROM activation_grants WHERE task_id=? AND json_extract(payload,'$.executionMode')='task'").get(taskId)!
    const worker = JSON.parse(String(workerRow.payload)) as ActivationGrant
    const session = "worker"
    withTaskAdmission(runtime.engine, worker.id, session, () => new TaskScheduler(runtime.engine, 1, directory).claim(taskId, { agent: "fixture", sessionId: session }))
    claim(worker, session)
    writeFileSync(join(directory, "hello.txt"), "안녕하세요")
    runtime.control.admission.submit(worker.id, session, output(taskId), { inputTokens: 10, outputTokens: 10, toolCalls: 2, elapsedMs: 1 })
    runtime.engine.completeTask({ taskId, attemptToken: runtime.store.currentAttempt(taskId)!.token, summary: "fixture wrote exact content" })
    new TaskScheduler(runtime.engine, 1, directory).release(taskId, true)
    const observationValidation = await runtime.control.validators.run(directory, { maxJobs: 1, maxDurationMs: 5000 })
    assert.deepEqual(observationValidation.map(result => result.state), ["passed"], JSON.stringify(runtime.store.db.prepare("SELECT state,payload FROM validation_jobs").all()))
    runtime.control.requests.tick()
    assert.equal(runtime.control.requests.get(request.id)!.state, "completed")
    assert.equal(runtime.engine.requireTask(taskId).status, "verified")
  } finally {
    runtime.close()
    rmSync(directory, { recursive: true, force: true })
  }
})
