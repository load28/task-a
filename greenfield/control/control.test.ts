import test from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { TaskAgent } from "./agent.ts"
import type { AgentState } from "./model.ts"
import { StateStore } from "../store/index.ts"
import { FileArtifactStore, inspectTree } from "../artifacts/index.ts"
import { fixtureBundle } from "../contracts/fixtures.ts"
import { digest, ref, withDigest } from "../contracts/canonical.ts"
import type { CaptureResult, GraphBundle, LaunchRequest, RuntimeBackend, RuntimeIdentity, RuntimeObservation, StopReceipt, StopRequest, Validator } from "../contracts/model.ts"
import { ValidationService } from "../validation/index.ts"

class FakeBackend implements RuntimeBackend {
  requests = new Map<string, LaunchRequest>()
  stopped = new Set<string>()
  starts = 0
  stopCalls = 0
  unavailableStops = 0
  autoFinish = false
  root: string
  captureBarrier?: () => Promise<void>
  constructor(root: string) { this.root = root }
  async ensureStarted(request: LaunchRequest) {
    if (!this.requests.has(request.attemptId)) { this.starts++; this.requests.set(request.attemptId, request) }
    if (this.autoFinish) this.stopped.add(request.attemptId)
    return this.observe(request)
  }
  async observe(identity: RuntimeIdentity): Promise<RuntimeObservation> {
    identity = { intentId: identity.intentId, attemptId: identity.attemptId, workspaceId: identity.workspaceId, fence: identity.fence,
      ...(identity.backendHandle ? { backendHandle: identity.backendHandle } : {}) }
    if (!this.requests.has(identity.attemptId)) return { ...identity, observed: "queued" }
    if (!this.stopped.has(identity.attemptId)) return { ...identity, backendHandle: identity.attemptId, observed: "running" }
    const stopReceipt: StopReceipt = { ...identity, backendHandle: identity.attemptId, observationSource: "test-backend", stoppedAt: "2026-09-26T00:00:00Z",
      termination: { kind: "all-writers-terminated", evidence: "verified-exit" } }
    return { ...identity, backendHandle: identity.attemptId, observed: "stopped", outcome: { kind: "success" }, exitCode: 0, stopReceipt }
  }
  async requestStop(request: StopRequest): Promise<RuntimeObservation> {
    this.stopCalls++
    if (this.unavailableStops-- > 0) return { intentId: request.intentId, attemptId: request.attemptId, workspaceId: request.workspaceId, fence: request.fence, observed: "unknown" }
    this.stopped.add(request.attemptId)
    return this.observe(request)
  }
  async captureStoppedWorkspace(receipt: StopReceipt): Promise<CaptureResult> {
    await this.captureBarrier?.()
    assert(this.stopped.has(receipt.attemptId))
    const path = join(this.root, receipt.attemptId); mkdirSync(path, { recursive: true })
    writeFileSync(join(path, "result.txt"), "완료")
    const files = inspectTree(path), snapshot = { path, files, digest: digest(files) }
    return { identity: { intentId: receipt.intentId, attemptId: receipt.attemptId, workspaceId: receipt.workspaceId, fence: receipt.fence, backendHandle: receipt.backendHandle },
      workspace: snapshot, outputs: [{ port: "result", snapshot }], checkpoint: { completedSteps: [], effectReceipts: [] } }
  }
}

function fixture(t: any) {
  const root = mkdtempSync(join(tmpdir(), "greenfield-control-")), db = join(root, "state.db")
  const artifacts = new FileArtifactStore(join(root, "artifacts")), backend = new FakeBackend(join(root, "capture"))
  const store = new StateStore<AgentState>(db), validator = new ValidationService(backend, artifacts)
  const agent = new TaskAgent({ store, artifacts, backend, validator })
  t.after(() => {
    try { store.close() } catch {}
    for (const entry of inspectTree(root).filter(x => x.kind === "directory")) chmodSync(join(root, entry.path), 0o700)
    rmSync(root, { recursive: true, force: true })
  })
  return { root, db, artifacts, backend, store, validator, agent }
}
async function apply(agent: TaskAgent, bundle = fixtureBundle(), operationId = "apply") {
  return agent.execute({ operationId, graphId: bundle.graph.id, expectedRevision: agent.store.read(bundle.graph.id)?.revision ?? 0, payload: { kind: "activateGraph", bundle } })
}
async function intent(agent: TaskAgent, kind: "requestSuspend" | "requestResume" | "requestCancel", id: string = kind) {
  return agent.execute({ operationId: id, graphId: "sample", expectedRevision: agent.get("sample").revision, payload: { kind, taskId: "task-a" } })
}
async function drive(agent: TaskAgent, count = 5) { for (let i = 0; i < count; i++) await agent.tick("sample") }

test("activation is atomic, idempotent and rejects an invalid graph without writes", async t => {
  const { agent, store } = fixture(t), bundle = fixtureBundle()
  const command = { operationId: "apply", graphId: "sample", expectedRevision: 0, payload: { kind: "activateGraph" as const, bundle } }
  const result = await agent.execute(command)
  assert.deepEqual(await agent.execute(command), result)
  const bad = structuredClone(bundle)
  bad.graph = withDigest({ ...bad.graph, revision: 2, baseRevision: 1, completionTargets: ["missing"] })
  await assert.rejects(apply(agent, bad, "bad"))
  assert.equal(store.read("sample")!.value.bundle!.graph.revision, 1)
  assert.equal(store.pending().length, 0)
})

test("a control restart replays pending intent once and adopts independently validated output", async t => {
  const f = fixture(t); f.backend.autoFinish = true
  await apply(f.agent); await f.agent.tick("sample")
  assert.equal(f.backend.starts, 0)
  f.store.close()
  const store = new StateStore<AgentState>(f.db); t.after(() => store.close())
  const agent = new TaskAgent({ ...f, store })
  await drive(agent)
  assert.equal(f.backend.starts, 1)
  assert.equal(agent.get("sample").complete, true)
  assert.equal(agent.get("sample").value.adoptions.length, 1)
  assert(agent.get("sample").value.evidence.every(e => e.trustedIssuer === "task-agent/controller-validator-v1"))
})

test("graph change atomically fences a running attempt and late completion never becomes current", async t => {
  const f = fixture(t); await apply(f.agent); await drive(f.agent, 2)
  const old = f.agent.get("sample").value.attempts[0]!
  const next = fixtureBundle()
  next.tasks[0] = withDigest({ ...next.tasks[0]!, revision: 2, objective: "변경된 작업" })
  next.graph = withDigest({ ...next.graph, revision: 2, baseRevision: 1, taskSpecRefs: [ref(next.tasks[0])] })
  await apply(f.agent, next, "change")
  const changed = f.agent.get("sample")
  assert.equal(changed.value.attempts[0]!.fenced, true)
  assert(changed.pendingIntents.some(i => i.type === "stop"))
  f.backend.autoFinish = true
  await drive(f.agent, 7)
  const completed = f.agent.get("sample")
  assert.equal(completed.complete, true)
  assert(completed.value.adoptions.every(a => a.mode !== "fresh" || a.attemptId !== old.attemptId))
  assert.equal(completed.value.attempts.length, 2)
})

test("stop failure stays retryable and resume waits for termination AND immutable capture", async t => {
  const f = fixture(t); await apply(f.agent); await drive(f.agent, 2)
  f.backend.unavailableStops = 1
  await intent(f.agent, "requestSuspend")
  await f.agent.tick("sample")
  assert(f.agent.get("sample").pendingIntents.some(i => i.type === "stop"))
  await assert.rejects(intent(f.agent, "requestResume"), /checkpoint/)
  await f.agent.tick("sample")
  let release!: () => void
  f.backend.captureBarrier = () => new Promise(resolve => { release = resolve })
  const capturing = f.agent.tick("sample")
  await new Promise(resolve => setImmediate(resolve))
  assert(f.agent.get("sample").value.workspaces[0]!.captureHold)
  await assert.rejects(intent(f.agent, "requestResume", "too-early"), /checkpoint/)
  release(); await capturing
  f.backend.captureBarrier = undefined
  await intent(f.agent, "requestResume", "resume-ready")
  await f.agent.tick("sample")
  const attempts = f.agent.get("sample").value.attempts
  assert.equal(attempts.length, 2)
  assert.equal(attempts[0]!.workspaceId, attempts[1]!.workspaceId)
  assert.equal(attempts[1]!.fence, 2)
  assert(f.backend.stopCalls >= 2)
})

test("a forged validator result cannot satisfy completion", async t => {
  const f = fixture(t); f.backend.autoFinish = true
  const corrupt: Validator = { validate: async request => ({ ...await f.validator.validate(request), inputSnapshotDigest: digest("another-input") }) }
  const agent = new TaskAgent({ ...f, validator: corrupt })
  await apply(agent); await drive(agent)
  assert.equal(agent.get("sample").complete, false)
  assert.equal(agent.get("sample").value.tasks[0]!.desired, "suspended")
  assert.match(agent.get("sample").value.tasks[0]!.error!, /bound to the trusted/)
})

test("backend error codes survive durable diagnostics and status reads", async t => {
  const f = fixture(t)
  f.backend.ensureStarted = async () => { throw Object.assign(new Error("Policy is unavailable"), { code: "capability_unsupported" }) }
  await apply(f.agent); await drive(f.agent, 2)
  assert.match(f.agent.get("sample").value.tasks[0]!.error!, /^capability_unsupported:/)
  assert.match(f.agent.get("sample").pendingIntents[0]!.error!, /^capability_unsupported:/)
})

test("unrelated graph revision during execution records explicit reuse without rewriting provenance", async t => {
  const f = fixture(t); await apply(f.agent); await drive(f.agent, 2)
  const next = fixtureBundle(); next.graph = withDigest({ ...next.graph, revision: 2, baseRevision: 1, reviewEvidence: { reviewer: "reviewer", rationale: "표시만 변경" } })
  await apply(f.agent, next, "unrelated")
  const attempt = f.agent.get("sample").value.attempts[0]!
  assert.equal(attempt.fenced, false)
  f.backend.stopped.add(attempt.attemptId)
  await drive(f.agent)
  const state = f.agent.get("sample").value
  assert.equal(state.adoptions[0]!.mode, "fresh")
  assert.equal(state.adoptions[0]!.targetGraphRef.revision, 1)
  assert.equal(state.adoptions[1]!.mode, "reuse")
  assert.equal(state.adoptions[1]!.targetGraphRef.revision, 2)
  assert.equal(state.artifacts[0]!.origin.kind, "execution")
})

test("completed results become unavailable when adopted bytes or reports are corrupted", async t => {
  for (const target of ["output", "report"] as const) {
    const f = fixture(t); f.backend.autoFinish = true
    await apply(f.agent); await drive(f.agent)
    assert.equal(f.agent.get("sample").complete, true)
    const state = f.store.read("sample")!.value
    const path = target === "output" ? join(f.artifacts.tree(state.artifacts[0]!.storage).path, "result.txt")
      : join(f.artifacts.root, "blobs", state.evidence[0]!.report.digest.slice(7))
    chmodSync(path, 0o600); writeFileSync(path, "손상된 증거")
    const view = f.agent.get("sample")
    assert.equal(view.complete, false)
    assert.equal(view.value.results[0]!.validity, "invalid")
    assert.match(view.value.results[0]!.reasons[0]!, /artifact_unavailable/)
    assert.equal(f.store.read("sample")!.value.results[0]!.validity, "valid", "reads do not mutate durable state")
    await f.agent.tick("sample")
    assert.equal(f.store.read("sample")!.value.results[0]!.validity, "invalid")
    assert(f.store.events("sample").some(e => e.type === "result.unavailable"))
  }
})

test("compatibility proof passes, fails or waits without treating uncertainty as execution failure", async t => {
  for (const mode of ["unavailable", "inconclusive", "passed", "failed"] as const) {
  const f = fixture(t); f.backend.autoFinish = true
  const make = (revision: number, text: string): GraphBundle => {
    const b = fixtureBundle()
    const compat = withDigest({ id: "compatibility", revision: 1, definition: { kind: "argv" as const, argv: ["node", "check.mjs"], timeoutMs: 1000 },
      implementationDigest: digest("compatibility"), configurationDigest: digest({}) })
    b.validators.push(compat)
    b.contracts[0] = withDigest({ ...b.contracts[0]!, compatibilityValidators: [ref(compat)] })
    const contractRef = ref(b.contracts[0])
    b.tasks[0] = withDigest({ ...b.tasks[0]!, inputPorts: [{ name: "value", contractRef, mountPath: "/inputs/value" }],
      outputPorts: [{ ...b.tasks[0]!.outputPorts[0]!, contractRef }] })
    const file = join(f.root, `source-${revision}.txt`); writeFileSync(file, text)
    const tree = f.artifacts.ingestFile(file), registration = { issuer: "test", source: "explicit test data", digest: digest(text) }
    const artifact = withDigest({ id: `source-${revision}`, outputPort: "value", contractRef, storage: tree.ref, contentDigest: tree.ref.digest,
      validationEvidenceIds: [], origin: { kind: "source" as const, sourceId: "source", issuer: registration.issuer, source: registration.source, registrationDigest: registration.digest } })
    b.sourceArtifacts = [artifact]
    b.graph = withDigest({ ...b.graph, revision, baseRevision: revision - 1, taskSpecRefs: b.tasks.map(ref),
      sources: [{ id: "source", registrationEvidence: registration, outputs: [{ name: "value", contractRef, artifactRef: { id: artifact.id, digest: artifact.digest } }] }],
      edges: [{ kind: "consumes" as const, from: { nodeId: "source", port: "value" }, to: { nodeId: "task-a", port: "value" } }] })
    return b
  }
  let compatibilityCalls = 0
  const validator: Validator = { validate: async request => {
    if (request.validator.id !== "compatibility") return f.validator.validate(request)
    compatibilityCalls++
    if (mode === "unavailable") throw new Error("runtime_unavailable: compatibility environment is not available")
    const environment = { kind: "trusted-test-validator", reason: "requires a requirements decision" }
    const report = await f.artifacts.put(new TextEncoder().encode(JSON.stringify({ validationRequestId: request.id, requestDigest: digest(request),
      environment, result: { outcome: mode } })))
    return { id: `evidence-${request.id}`, validatorRef: ref(request.validator), validationRunId: request.id,
      trustedIssuer: "task-agent/controller-validator-v1", validationEnvironmentDigest: digest(environment),
      subjects: request.artifacts.map(a => ({ id: a.id, digest: a.digest })), inputSnapshotDigest: request.inputs.provenanceDigest, outcome: mode, report }
  } }
  const agent = new TaskAgent({ ...f, validator })
  await apply(agent, make(1, "이전 입력")); await drive(agent)
  assert.equal(agent.get("sample").complete, true)
  await apply(agent, make(2, "변경된 입력"), "changed-source"); await drive(agent)
  if (mode === "passed" || mode === "failed") {
    assert.equal(agent.get("sample").complete, true)
    assert.equal(agent.get("sample").value.adoptions.at(-1)!.mode, mode === "passed" ? "revalidate" : "fresh")
    assert.equal(f.backend.starts, mode === "passed" ? 1 : 2)
    assert(agent.get("sample").value.evidence.some(e => e.outcome === mode && e.validatorRef.id === "compatibility"))
  } else {
  assert.equal(agent.get("sample").complete, false)
  assert.equal(agent.get("sample").value.tasks[0]!.desired, "suspended")
  assert.match(agent.get("sample").value.tasks[0]!.error!, /runtime_unavailable|validation_inconclusive/)
  assert.equal(compatibilityCalls, 1)
  assert.equal(f.backend.starts, 1)
  }
  }
})
