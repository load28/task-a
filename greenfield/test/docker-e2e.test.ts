import test, { type TestContext } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from "node:fs"
import { join } from "node:path"
import { arch, tmpdir } from "node:os"
import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"
import { digest } from "../contracts/canonical.ts"
import type { GraphBundle } from "../contracts/model.ts"
import { FileArtifactStore } from "../artifacts/index.ts"
import { StateStore } from "../store/index.ts"
import { TaskAgent } from "../control/agent.ts"
import type { AgentState } from "../control/model.ts"
import { DockerRuntimeBackend } from "../runtime/docker.ts"
import { ValidationService } from "../validation/index.ts"
import { createExample, NODE24_AMD64_IMAGE, NODE24_ARM64_IMAGE } from "../examples/index.ts"

const execute = promisify(execFile)
const enabled = process.env.TASK_AGENT_DOCKER_TEST === "1"
const image = process.env.TASK_AGENT_TEST_IMAGE ?? (arch() === "arm64" ? NODE24_ARM64_IMAGE : NODE24_AMD64_IMAGE)
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function makeWritable(path: string): void {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) return
  chmodSync(path, stat.isDirectory() ? 0o700 : 0o600)
  if (stat.isDirectory()) for (const name of readdirSync(path)) makeWritable(join(path, name))
}

async function testContainers(namespace: string): Promise<string[]> {
  const listed = await execute("docker", ["ps", "-aq", "--filter", `label=task-agent.namespace=${namespace}`], { encoding: "utf8" })
  return listed.stdout.trim().split(/\s+/).filter(Boolean)
}

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "task-agent-docker-e2e-"))
  const paths = { state: join(root, "state.sqlite"), artifacts: join(root, "artifacts"), backend: join(root, "backend") }
  const artifacts = new FileArtifactStore(paths.artifacts)
  let store: StateStore<AgentState>, backend: DockerRuntimeBackend, agent: TaskAgent, open = false
  const reopen = () => {
    if (open) { backend.close(); store.close() }
    store = new StateStore<AgentState>(paths.state)
    backend = new DockerRuntimeBackend({ root: paths.backend })
    agent = new TaskAgent({ store, artifacts, backend, validator: new ValidationService(backend, artifacts) })
    open = true
  }
  reopen()
  const namespace = digest(realpathSync(paths.backend)).slice(7, 27)
  t.after(async () => {
    // The unique private backend path determines its labels; never enumerate/remove unrelated resources.
    const containers = await testContainers(namespace)
    for (const container of containers) {
      const inspected = await execute("docker", ["inspect", container], { encoding: "utf8" })
      const value = JSON.parse(inspected.stdout)[0]
      assert.equal(value.Config.Labels["task-agent.namespace"], namespace)
      await execute("docker", ["rm", "-f", container], { encoding: "utf8" })
    }
    if (open) { backend.close(); store.close(); open = false }
    makeWritable(root); rmSync(root, { recursive: true, force: true })
  })
  return {
    root, paths, artifacts, namespace, reopen,
    close() { if (open) { backend.close(); store.close(); open = false } },
    get store() { return store! }, get backend() { return backend! }, get agent() { return agent! },
  }
}

type Fixture = ReturnType<typeof fixture>
async function activate(app: Fixture, bundle: GraphBundle) {
  return app.agent.execute({ graphId: bundle.graph.id, operationId: `activate-${bundle.graph.revision}`, expectedRevision: app.store.read(bundle.graph.id)?.revision ?? 0, payload: { kind: "activateGraph", bundle } })
}

async function finish(app: Fixture, graphId: string, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const result = await app.agent.tick(graphId)
    if (result.complete && result.pendingIntents.length === 0) return result
    const blocked = result.value.tasks.filter(task => task.desired === "suspended" && task.error)
    if (blocked.length) assert.fail(`Unexpected suspended tasks: ${JSON.stringify(blocked)}`)
    await pause(40)
  }
  const result = app.agent.get(graphId)
  assert.fail(`Graph failed to converge: ${JSON.stringify({ complete: result.complete, tasks: result.value.tasks, attempts: result.value.attempts.map(attempt => ({ taskId: attempt.taskId, phase: attempt.phase, observed: attempt.observed, error: attempt.error })), pending: result.pendingIntents })}`)
}

function counts(state: AgentState) {
  return Object.fromEntries(["A", "B", "C", "D", "integration"].map(id => [id, state.attempts.filter(attempt => attempt.taskId === id).length]))
}

function output(app: Fixture, state: AgentState, taskId: string): number {
  const result = state.results.find(result => result.producer.nodeId === taskId && result.producer.port === "result" && result.validity === "valid")
  assert.ok(result, `Missing valid result for ${taskId}`)
  const artifact = state.artifacts.find(artifact => artifact.id === result.artifactRef.id)
  assert.ok(artifact)
  return JSON.parse(readFileSync(join(app.artifacts.tree(artifact.storage).path, "data.json"), "utf8")).value
}

function assertReceipts(state: AgentState) {
  for (const attempt of state.attempts) {
    assert.equal(attempt.phase, "finished")
    assert.equal(attempt.stopReceipt?.termination.kind, "all-writers-terminated")
    assert.equal(attempt.stopReceipt?.attemptId, attempt.attemptId)
    assert.equal(attempt.stopReceipt?.fence, attempt.fence)
    assert.ok(attempt.backendHandle)
    assert.ok(state.checkpoints.some(checkpoint => checkpoint.id === attempt.checkpointId && checkpoint.attemptId === attempt.attemptId))
  }
  assert.ok(state.evidence.length >= state.attempts.filter(attempt => attempt.outcome?.kind === "success" && !attempt.fenced).length)
  assert.ok(state.evidence.every(evidence => evidence.outcome === "passed" && evidence.trustedIssuer && evidence.validationRunId && evidence.validationEnvironmentDigest))
  assert.ok(state.workspaces.every(workspace => !workspace.activeWriter && !workspace.captureHold))
}

test("actual app resumes a stopped checkpoint, selectively rebuilds changed tasks, and reuses equivalent outputs", { skip: !enabled, timeout: 120000 }, async t => {
  const app = fixture(t), graphId = "selective-rebuild", aDelayMs = 3000
  await activate(app, createExample(app.artifacts, image, { graphId, value: 1, aDelayMs }))
  await app.agent.tick(graphId) // Persist launch intents.
  await app.agent.tick(graphId) // Start A and D in separate workspaces.
  const running = app.agent.get(graphId).value.attempts.find(attempt => attempt.taskId === "A")!
  assert.equal(running.observed, "running")
  const runningCheckpoint = join(app.paths.backend, "workspaces", digest(running.workspaceId).slice(7), ".task-runtime", "checkpoint.json")
  const activeDeadline = Date.now() + 5000
  while (Date.now() < activeDeadline && (!existsSync(runningCheckpoint) || JSON.parse(readFileSync(runningCheckpoint, "utf8")).activeStepId !== "calculate")) await pause(20)
  assert.equal(JSON.parse(readFileSync(runningCheckpoint, "utf8")).activeStepId, "calculate")
  await app.agent.execute({ graphId, operationId: "suspend-A", expectedRevision: app.store.read(graphId)!.revision, payload: { kind: "requestSuspend", taskId: "A" } })
  const suspendDeadline = Date.now() + 10000
  while (Date.now() < suspendDeadline) {
    await app.agent.tick(graphId)
    if (app.agent.get(graphId).value.attempts.find(attempt => attempt.attemptId === running.attemptId)!.phase === "finished") break
    await pause(40)
  }
  const stoppedState = app.agent.get(graphId).value, stopped = stoppedState.attempts.find(attempt => attempt.attemptId === running.attemptId)!
  assert.equal(stopped.phase, "finished"); assert.equal(stopped.stopReceipt?.termination.kind, "all-writers-terminated")
  assert.equal(stoppedState.tasks.find(task => task.taskId === "A")!.desired, "suspended")
  const checkpoint = stoppedState.checkpoints.find(item => item.id === stopped.checkpointId)!
  assert.ok(checkpoint); assert.ok(await app.artifacts.verify(checkpoint.workspaceSnapshot))
  const saved = JSON.parse(readFileSync(join(app.artifacts.tree(checkpoint.workspaceSnapshot).path, ".task-runtime", "checkpoint.json"), "utf8"))
  assert.equal(saved.state, "suspended"); assert.deepEqual(checkpoint.completedSteps, [])
  app.reopen() // Resumption uses durable checkpoint data after controller recreation.
  await app.agent.execute({ graphId, operationId: "resume-A", expectedRevision: app.store.read(graphId)!.revision, payload: { kind: "requestResume", taskId: "A" } })
  const initial = await finish(app, graphId)
  assert.equal(output(app, initial.value, "integration"), 105)
  assert.deepEqual(counts(initial.value), { A: 2, B: 1, C: 1, D: 1, integration: 1 })
  const resumed = initial.value.attempts.filter(attempt => attempt.taskId === "A").at(-1)!
  assert.equal(resumed.launch.resumeCheckpoint?.manifest.id, checkpoint.id)
  assert.equal(resumed.workspaceId, stopped.workspaceId); assert.ok(resumed.fence > stopped.fence)
  assert.notEqual(resumed.backendHandle, stopped.backendHandle)
  const independent = initial.value.attempts.find(attempt => attempt.taskId === "D")!
  const originalArtifacts = initial.value.artifacts.map(artifact => artifact.id)

  // Reopen both durable stores before applying a new source revision.
  app.reopen()
  await activate(app, createExample(app.artifacts, image, { graphId, revision: 2, value: 5, aDelayMs }))
  const afterSource = await finish(app, graphId)
  assert.equal(output(app, afterSource.value, "integration"), 113)
  assert.deepEqual(counts(afterSource.value), { A: 3, B: 2, C: 2, D: 1, integration: 2 })
  assert.equal(afterSource.value.attempts.find(attempt => attempt.taskId === "D")!.backendHandle, independent.backendHandle)

  await activate(app, createExample(app.artifacts, image, { graphId, revision: 3, value: 5, aOffset: 3, aRevision: 2, aDelayMs }))
  const afterSpec = await finish(app, graphId)
  assert.equal(output(app, afterSpec.value, "integration"), 117)
  assert.deepEqual(counts(afterSpec.value), { A: 4, B: 3, C: 3, D: 1, integration: 3 })
  const beforeEquivalent = new Map(afterSpec.value.results.map(result => [result.producer.nodeId, result.artifactRef]))
  const independentAdoptionId = afterSpec.value.results.find(result => result.producer.nodeId === "D")!.adoptionId
  await activate(app, createExample(app.artifacts, image, { graphId, revision: 4, value: 3, aOffset: 5, aRevision: 3, aDelayMs }))
  const equivalent = await finish(app, graphId)
  assert.equal(output(app, equivalent.value, "A"), 8); assert.equal(output(app, equivalent.value, "integration"), 117)
  assert.deepEqual(counts(equivalent.value), { A: 5, B: 3, C: 3, D: 1, integration: 3 })
  for (const taskId of ["B", "C", "D", "integration"]) {
    const result = equivalent.value.results.find(item => item.producer.nodeId === taskId)!
    assert.deepEqual(result.artifactRef, beforeEquivalent.get(taskId))
    if (taskId === "D") { assert.equal(result.adoptionId, independentAdoptionId); continue }
    const adoption = equivalent.value.adoptions.find(item => item.id === result.adoptionId)!
    assert.equal(adoption.mode, "reuse"); assert.equal(adoption.targetGraphRef.revision, 4)
  }
  assert.ok(originalArtifacts.every(id => equivalent.value.artifacts.some(artifact => artifact.id === id)))
  assert.equal(equivalent.value.history.length, 4)
  assertReceipts(equivalent.value)
  for (const checkpoint of equivalent.value.checkpoints) assert.ok(await app.artifacts.verify(checkpoint.workspaceSnapshot))
  for (const artifact of equivalent.value.artifacts) assert.ok(await app.artifacts.verify(artifact.storage))
  assert.equal((await testContainers(app.namespace)).length, 15)
  t.diagnostic(JSON.stringify({ scenario: "suspend-resume-selective-rebuild-equivalent-reuse", graphRevision: 4, resumedCheckpointId: checkpoint.id, attemptCounts: counts(equivalent.value), finalValue: 117, stoppedReceipts: equivalent.value.attempts.length, verifiedWorkspaceSnapshots: equivalent.value.checkpoints.length, evidenceCount: equivalent.value.evidence.length, stateDigest: digest(equivalent.value) }))
})

test("actual controller SIGKILL after Docker start recovers the same attempt and container", { skip: !enabled, timeout: 90000 }, async t => {
  const app = fixture(t), graphId = "controller-crash"
  await activate(app, createExample(app.artifacts, image, { graphId, aDelayMs: 1000 }))
  await app.agent.tick(graphId) // Only schedules and persists the first starts.
  const scheduled = app.store.read(graphId)!.value.attempts.find(attempt => attempt.taskId === "A")!
  assert.equal(scheduled.observed, "queued")
  app.close()
  const imports = { store: new URL("../store/index.ts", import.meta.url).href, agent: new URL("../control/agent.ts", import.meta.url).href,
    artifacts: new URL("../artifacts/index.ts", import.meta.url).href, runtime: new URL("../runtime/docker.ts", import.meta.url).href, validation: new URL("../validation/index.ts", import.meta.url).href }
  const script = `
    import {StateStore} from ${JSON.stringify(imports.store)};
    import {TaskAgent} from ${JSON.stringify(imports.agent)};
    import {FileArtifactStore} from ${JSON.stringify(imports.artifacts)};
    import {DockerRuntimeBackend} from ${JSON.stringify(imports.runtime)};
    import {ValidationService} from ${JSON.stringify(imports.validation)};
    import {writeFileSync} from 'node:fs';
    class CrashStore extends StateStore { claim(id, owner) { return super.claim(id, owner, 100); } }
    const store=new CrashStore(${JSON.stringify(app.paths.state)}), artifacts=new FileArtifactStore(${JSON.stringify(app.paths.artifacts)}), runtime=new DockerRuntimeBackend({root:${JSON.stringify(app.paths.backend)}});
    const backend={ensureStarted:async request=>{const observed=await runtime.ensureStarted(request);writeFileSync(${JSON.stringify(join(app.root, "crash-observation.json"))},JSON.stringify(observed));process.kill(process.pid,'SIGKILL');return observed},observe:identity=>runtime.observe(identity),requestStop:request=>runtime.requestStop(request),captureStoppedWorkspace:receipt=>runtime.captureStoppedWorkspace(receipt)};
    const agent=new TaskAgent({store,artifacts,backend,validator:new ValidationService(runtime,artifacts)});await agent.tick(${JSON.stringify(graphId)});
  `
  const terminated = await new Promise<{ code: number | null; signal: string | null; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", script], { stdio: ["ignore", "ignore", "pipe"] })
    let stderr = ""; child.stderr.on("data", chunk => { stderr += chunk }); child.once("error", reject)
    const timer = setTimeout(() => child.kill("SIGKILL"), 15000)
    child.once("close", (code, signal) => { clearTimeout(timer); resolve({ code, signal, stderr }) })
  })
  assert.equal(terminated.signal, "SIGKILL", terminated.stderr)
  assert.ok(existsSync(join(app.root, "crash-observation.json")), terminated.stderr)
  const launched = JSON.parse(readFileSync(join(app.root, "crash-observation.json"), "utf8"))
  assert.equal(launched.attemptId, scheduled.attemptId)
  assert.equal(launched.observed, "running", JSON.stringify(launched))
  app.reopen()
  const recovered = await finish(app, graphId)
  assert.equal(output(app, recovered.value, "integration"), 105)
  assert.deepEqual(counts(recovered.value), { A: 1, B: 1, C: 1, D: 1, integration: 1 })
  const sameAttempt = recovered.value.attempts.find(attempt => attempt.taskId === "A")!
  assert.equal(sameAttempt.attemptId, scheduled.attemptId)
  assert.equal(sameAttempt.backendHandle, launched.backendHandle)
  assertReceipts(recovered.value)
  assert.equal((await testContainers(app.namespace)).length, 5)
  t.diagnostic(JSON.stringify({ scenario: "controller-sigkill", recoveredAttempt: sameAttempt.attemptId, preservedBackendHandle: sameAttempt.backendHandle, attemptCounts: counts(recovered.value), pendingIntents: recovered.pendingIntents.length, finalValue: 105, stoppedReceipts: recovered.value.attempts.length }))
})
