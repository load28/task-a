import test from "node:test"
import type { TestContext } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { TaskAgent } from "./agent.ts"
import type { AgentState } from "./model.ts"
import { StateStore } from "../store/index.ts"
import { FileArtifactStore, inspectTree } from "../artifacts/index.ts"
import { ValidationService } from "../validation/index.ts"
import { fixtureBundle } from "../contracts/fixtures.ts"
import { digest, ref, withDigest } from "../contracts/canonical.ts"
import type { ArtifactManifest, CaptureResult, GraphBundle, LaunchRequest, RuntimeBackend, RuntimeIdentity, RuntimeObservation, StopReceipt, StopRequest } from "../contracts/model.ts"

class RecordingBackend implements RuntimeBackend {
  readonly launches: LaunchRequest[] = []
  captureCalls = 0
  autoFinish = false
  forged?: "observation-handle" | "receipt-handle"
  private readonly root: string
  constructor(root: string) { this.root = root }
  async ensureStarted(request: LaunchRequest): Promise<RuntimeObservation> {
    if (!this.launches.some(launch => launch.intentId === request.intentId)) this.launches.push(request)
    return this.observe(request)
  }
  async observe(identity: RuntimeIdentity): Promise<RuntimeObservation> {
    identity = { intentId: identity.intentId, attemptId: identity.attemptId, workspaceId: identity.workspaceId, fence: identity.fence,
      ...(identity.backendHandle ? { backendHandle: identity.backendHandle } : {}) }
    if (!this.launches.some(launch => launch.intentId === identity.intentId)) return { ...identity, observed: "queued" }
    const backendHandle = `backend-${identity.attemptId}`
    if (this.forged) {
      const reportedHandle = this.forged === "observation-handle" ? "foreign-backend" : backendHandle
      const receipt: StopReceipt = { ...identity, backendHandle: "foreign-backend", observationSource: "recording-backend", stoppedAt: "2026-09-26T00:00:00Z", termination: { kind: "all-writers-terminated", evidence: "exit report for the wrong backend resource" } }
      return { ...identity, backendHandle: reportedHandle, observed: "stopped", outcome: { kind: "success" }, stopReceipt: receipt }
    }
    if (!this.autoFinish) return { ...identity, backendHandle, observed: "running" }
    const stopReceipt: StopReceipt = { ...identity, backendHandle, observationSource: "recording-backend", stoppedAt: "2026-09-26T00:00:00Z", termination: { kind: "all-writers-terminated", evidence: "all task writers exited" } }
    return { ...identity, backendHandle, observed: "stopped", outcome: { kind: "success" }, stopReceipt, exitCode: 0 }
  }
  async requestStop(request: StopRequest): Promise<RuntimeObservation> { return this.observe(request) }
  async captureStoppedWorkspace(receipt: StopReceipt): Promise<CaptureResult> {
    this.captureCalls++
    const path = join(this.root, receipt.attemptId)
    mkdirSync(path, { recursive: true }); writeFileSync(join(path, "result.txt"), "완료")
    const files = inspectTree(path), snapshot = { path, files, digest: digest(files) }
    return { identity: { intentId: receipt.intentId, attemptId: receipt.attemptId, workspaceId: receipt.workspaceId, fence: receipt.fence, backendHandle: receipt.backendHandle },
      workspace: snapshot, outputs: [{ port: "result", snapshot }] }
  }
}

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "greenfield-regression-"))
  const store = new StateStore<AgentState>(":memory:"), artifacts = new FileArtifactStore(join(root, "artifacts"))
  const backend = new RecordingBackend(join(root, "captures")), validator = new ValidationService(backend, artifacts)
  const agent = new TaskAgent({ store, artifacts, backend, validator })
  t.after(() => {
    store.close()
    for (const entry of inspectTree(root).filter(entry => entry.kind === "directory")) chmodSync(join(root, entry.path), 0o700)
    rmSync(root, { recursive: true, force: true })
  })
  return { root, store, artifacts, backend, agent }
}
async function activate(agent: TaskAgent, bundle: GraphBundle, operationId = "activate") {
  return agent.execute({ operationId, graphId: bundle.graph.id, expectedRevision: agent.store.read(bundle.graph.id)?.revision ?? 0, payload: { kind: "activateGraph", bundle } })
}
async function drive(agent: TaskAgent, count: number) { for (let i = 0; i < count; i++) await agent.tick("sample") }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
function sourceBoundBundle(f: ReturnType<typeof fixture>): GraphBundle {
  const bundle = fixtureBundle()
  const file = join(f.root, "input.txt"); writeFileSync(file, "동일 입력")
  const stored = f.artifacts.ingestFile(file)
  bundle.tasks[0] = withDigest({ ...bundle.tasks[0]!, inputPorts: [{ name: "value", contractRef: ref(bundle.contracts[0]!), mountPath: "/inputs/value" }] })
  for (const sourceId of ["source-a", "source-b"]) {
    const registration = { issuer: "test-user", source: `fixture:${sourceId}`, digest: digest({ sourceId }) }
    const artifact: ArtifactManifest = withDigest({ id: `artifact-${sourceId}`, outputPort: "value", contractRef: ref(bundle.contracts[0]!), contentDigest: stored.ref.digest, storage: stored.ref, validationEvidenceIds: [], origin: { kind: "source", sourceId, issuer: registration.issuer, source: registration.source, registrationDigest: registration.digest } })
    bundle.sourceArtifacts.push(artifact)
    bundle.graph.sources.push({ id: sourceId, outputs: [{ name: "value", contractRef: artifact.contractRef, artifactRef: { id: artifact.id, digest: artifact.digest } }], registrationEvidence: registration })
  }
  bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: bundle.tasks.map(ref), edges: [{ kind: "consumes", from: { nodeId: "source-a", port: "value" }, to: { nodeId: "task-a", port: "value" } }] })
  return bundle
}

test("scheduling executes only the exact graph-selected task revision even when older revisions are embedded first", async t => {
  const f = fixture(t), bundle = fixtureBundle()
  const selected = withDigest({ ...bundle.tasks[0]!, revision: 2, objective: "현재 그래프가 선택한 두 번째 명세" })
  bundle.tasks.push(selected)
  bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: [ref(selected)] })
  await activate(f.agent, bundle); await drive(f.agent, 2)
  assert.equal(f.backend.launches.length, 1)
  const launch = f.backend.launches[0]!, attempt = f.agent.get("sample").value.attempts[0]!
  assert.deepEqual(ref(launch.task), ref(selected))
  assert.deepEqual(launch.inputSnapshot.taskSpecRef, ref(selected))
  assert.deepEqual(attempt.taskSpecRef, ref(selected))
  assert.equal(launch.task.objective, selected.objective)
})

test("cancellation during asynchronous artifact verification prevents a historical result from being re-adopted", async t => {
  const f = fixture(t), before = sourceBoundBundle(f)
  f.backend.autoFinish = true
  await activate(f.agent, before); await drive(f.agent, 4)
  const completed = f.agent.get("sample")
  assert.equal(completed.complete, true)
  assert.equal(completed.value.adoptions.length, 1)
  const next = structuredClone(before)
  next.graph = withDigest({ ...next.graph, revision: 2, baseRevision: 1, edges: [{ kind: "consumes", from: { nodeId: "source-b", port: "value" }, to: { nodeId: "task-a", port: "value" } }] })
  await activate(f.agent, next, "rebind")
  assert.equal(f.agent.get("sample").value.results[0]!.validity, "check_required")

  const entered = deferred<void>(), release = deferred<boolean>(), originalVerify = f.artifacts.verify.bind(f.artifacts)
  const outputDigest = completed.value.artifacts.find(artifact => artifact.origin.kind === "execution")!.storage.digest
  let held = false
  f.artifacts.verify = async reference => {
    if (!held && reference.digest === outputDigest) { held = true; entered.resolve(); return release.promise }
    return originalVerify(reference)
  }
  const reconciling = f.agent.tick("sample")
  await entered.promise
  try {
    await f.agent.execute({ operationId: "cancel-during-reuse", graphId: "sample", expectedRevision: f.agent.get("sample").revision, payload: { kind: "requestCancel", taskId: "task-a" } })
  } finally { release.resolve(true) }
  await reconciling
  const cancelled = f.agent.get("sample")
  assert.equal(cancelled.value.tasks[0]!.desired, "cancelled")
  assert.equal(cancelled.complete, false)
  assert.equal(cancelled.value.results[0]!.validity, "check_required")
  assert.equal(cancelled.value.adoptions.length, completed.value.adoptions.length)
  assert.equal(f.backend.launches.length, 1)
})

test("a foreign observation or stop-receipt handle cannot release the writer or schedule capture", async t => {
  const f = fixture(t)
  await activate(f.agent, fixtureBundle()); await drive(f.agent, 2)
  const running = f.agent.get("sample").value.attempts[0]!
  assert.equal(running.observed, "running")
  for (const variant of ["observation-handle", "receipt-handle"] as const) {
    f.backend.forged = variant
    await f.agent.tick("sample")
    const current = f.agent.get("sample"), attempt = current.value.attempts[0]!
    assert.equal(attempt.backendHandle, running.backendHandle, variant)
    assert.equal(attempt.observed, "unknown", variant)
    assert.equal(attempt.phase, "observe", variant)
    assert.equal(attempt.stopReceipt, undefined, variant)
    assert.equal(current.value.workspaces[0]!.activeWriter?.attemptId, running.attemptId, variant)
    assert.equal(current.value.workspaces[0]!.captureHold, null, variant)
    assert.equal(current.pendingIntents.some(intent => intent.type === "capture"), false, variant)
    assert.equal(current.value.adoptions.length, 0, variant)
    assert.equal(f.backend.captureCalls, 0, variant)
    assert.match(attempt.lastObservation?.diagnostic ?? "", /backend.*(changed|mismatch)/, variant)
  }
})
