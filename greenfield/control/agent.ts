import { randomUUID } from "node:crypto"
import type { AdoptionRecord, AgentCommand, ArtifactManifest, Attempt, CheckpointManifest, GraphBundle, InputSnapshot, LaunchRequest, RevisionRef,
  RuntimeBackend, RuntimeIdentity, RuntimeObservation, StopReason, TaskSpecRevision, ValidationEvidence, ValidationRequest, Validator } from "../contracts/model.ts"
import { canonical, digest, ref, sameRef, withDigest } from "../contracts/canonical.ts"
import { toAgentError } from "../contracts/errors.ts"
import { validateCaptureResult, validateCommand, validateGraphBundle, validateStopReceipt } from "../contracts/validation.ts"
import { activeTasks, analyzeChange, decideRework, graphComplete, resolveInputs, taskComplete, validateGraph } from "../kernel/index.ts"
import { FileArtifactStore } from "../artifacts/index.ts"
import { StateStore, RevisionConflict, type Transaction } from "../store/index.ts"
import { validateArtifactShape, verifyValidationEvidence } from "../validation/index.ts"
import { validateSources } from "../validation/sources.ts"
import { emptyState, type AgentState, type AttemptRecord, type TaskControl } from "./model.ts"
import { adoptionIntact, unavailableResults } from "./integrity.ts"

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const diagnostic = (error: unknown): string => {
  const value = toAgentError(error)
  return value.message.startsWith(`${value.code}:`) ? value.message : `${value.code}: ${value.message}`
}
const identity = (attempt: Attempt): RuntimeIdentity => ({ intentId: attempt.intentId, attemptId: attempt.attemptId, workspaceId: attempt.workspaceId,
  fence: attempt.fence, ...(attempt.backendHandle ? { backendHandle: attempt.backendHandle } : {}) })
const sameIdentity = (a: RuntimeIdentity, b: RuntimeIdentity) => a.intentId === b.intentId && a.attemptId === b.attemptId && a.fence === b.fence && a.workspaceId === b.workspaceId
const findTask = (state: AgentState, id: string) => {
  const task = state.tasks.find(x => x.taskId === id)
  if (!task) throw new Error(`Unknown task: ${id}`)
  return task
}
const bundleFor = (state: AgentState) => { if (!state.bundle) throw new Error("No active graph"); return state.bundle }
const byRef = <T extends RevisionRef>(values: T[], target: RevisionRef): T => {
  const value = values.find(x => sameRef(x, target)); if (!value) throw new Error(`Missing exact reference: ${target.id}`); return value
}

/** The control plane is the only writer of active graph/result/attempt state. */
export class TaskAgent {
  readonly store: StateStore<AgentState>
  readonly artifacts: FileArtifactStore
  readonly backend: RuntimeBackend
  readonly validator: Validator
  private readonly owner = randomUUID()
  constructor(options: { store: StateStore<AgentState>; artifacts: FileArtifactStore; backend: RuntimeBackend; validator: Validator }) {
    this.store = options.store; this.artifacts = options.artifacts; this.backend = options.backend; this.validator = options.validator
  }

  get(graphId: string) {
    const state = this.store.read(graphId)
    if (!state) throw new Error(`Unknown graph: ${graphId}`)
    const unavailable = unavailableResults(state.value, this.artifacts)
    for (const result of state.value.results) {
      const reason = unavailable.get(result.adoptionId)
      if (reason) { result.validity = "invalid"; result.reasons = [reason] }
    }
    const bundle = state.value.bundle
    return { ...state, complete: bundle ? graphComplete(bundle, state.value.results) : false,
      pendingIntents: this.store.pending(graphId), events: this.store.events(graphId) }
  }

  async execute(command: AgentCommand) {
    validateCommand(command)
    const prior = this.store.receipt(command)
    if (prior) return prior
    const currentRevision = this.store.read(command.graphId)?.revision ?? 0
    if (currentRevision !== command.expectedRevision) throw new RevisionConflict(command.expectedRevision, currentRevision)
    const payload = command.payload
    let sourceEvidence: ValidationEvidence[] = []
    if (payload.kind === "activateGraph" || payload.kind === "proposeGraph") {
      validateGraphBundle(payload.bundle); validateGraph(payload.bundle)
      if (payload.bundle.graph.id !== command.graphId) throw new Error("Graph identity mismatch")
      sourceEvidence = await validateSources(payload.bundle, this.validator, this.artifacts)
    }
    return this.store.command({ graphId: command.graphId, operationId: command.operationId, expectedRevision: command.expectedRevision, payload, initial: emptyState }, (state, tx) => {
      for (const proof of sourceEvidence) if (!state.evidence.some(e => e.id === proof.id)) state.evidence.push(clean(proof))
      if (payload.kind === "activateGraph" || payload.kind === "proposeGraph") {
        for (const artifact of payload.bundle.sourceArtifacts) {
          const registration = { graphRef: ref(payload.bundle.graph), artifactRef: { id: artifact.id, digest: artifact.digest },
            validationEvidenceIds: sourceEvidence.filter(e => e.subjects.some(s => s.id === artifact.id && s.digest === artifact.digest)).map(e => e.id) }
          if (!state.sourceValidations.some(v => sameRef(v.graphRef, registration.graphRef) && v.artifactRef.id === artifact.id)) state.sourceValidations.push(registration)
        }
      }
      if (payload.kind === "proposeGraph") {
        const duplicate = state.proposals.find(x => sameRef(x.graph, payload.bundle.graph))
        if (!duplicate) state.proposals.push(clean(payload.bundle))
        tx.emit("graph.proposed", { graph: ref(payload.bundle.graph) }); return { proposed: ref(payload.bundle.graph) }
      }
      if (payload.kind === "activateGraph") return this.activate(state, tx, payload.bundle)
      if (["submitCandidate", "recordValidation", "adoptResult"].includes(payload.kind)) {
        throw new Error("unauthorized: result mutation requires the trusted runtime/validator path")
      }
      if (!("taskId" in payload)) throw new Error("Unsupported command")
      const task = findTask(state, payload.taskId)
      const attempt = state.attempts.find(a => a.attemptId === task.lastAttemptId)
      if (payload.kind === "requestRun" || payload.kind === "requestResume") {
        if (payload.kind === "requestResume") {
          if (task.desired === "cancelled") throw new Error("Cancelled work requires a new run command")
          if (attempt && (attempt.phase !== "finished" || !attempt.checkpointId)) throw new Error("termination_unknown: a verified stopped checkpoint is required before resume")
          if (attempt?.checkpointId) task.resumeCheckpointId = attempt.checkpointId
        } else delete task.resumeCheckpointId
        task.desired = "running"; delete task.error
      } else if (payload.kind === "requestSuspend" || payload.kind === "requestCancel") {
        task.desired = payload.kind === "requestSuspend" ? "suspended" : "cancelled"
        if (attempt && attempt.phase !== "finished") this.stop(state, tx, attempt, payload.kind === "requestSuspend" ? "suspend" : "cancel")
      }
      tx.emit("task.intent", { taskId: task.taskId, desired: task.desired }); return { taskId: task.taskId, desired: task.desired }
    })
  }

  private activate(state: AgentState, tx: Transaction, next: GraphBundle) {
    const prior = state.bundle
    if (next.graph.baseRevision !== (prior?.graph.revision ?? 0)) throw new RevisionConflict(next.graph.baseRevision, prior?.graph.revision ?? 0)
    if (next.graph.revision !== next.graph.baseRevision + 1) throw new Error("Graph revision must advance exactly once")
    // An ID/revision pair may never be rebound to different bytes, even in a later graph.
    for (const old of state.history) for (const key of ["contracts", "tasks", "templates", "policies", "validators"] as const) {
      for (const item of next[key]) {
        const previous = old[key].find(x => x.id === item.id && x.revision === item.revision)
        if (previous && previous.digest !== item.digest) throw new Error(`Immutable revision conflict: ${key}/${item.id}@${item.revision}`)
      }
    }
    const impact = analyzeChange(prior ?? undefined, next)
    const affected = new Set([...impact.affectedTaskIds, ...impact.removedTaskIds])
    for (const result of state.results) {
      if (impact.removedTaskIds.includes(result.producer.nodeId)) result.validity = "retired"
      else if (affected.has(result.producer.nodeId)) result.validity = "check_required"
      if (affected.has(result.producer.nodeId)) result.reasons = impact.reasons[result.producer.nodeId] ?? ["graph changed"]
    }
    for (const attempt of state.attempts) if (affected.has(attempt.taskId) && attempt.phase !== "finished") this.stop(state, tx, attempt, "supersede")
    for (const spec of activeTasks(next)) {
      let control = state.tasks.find(x => x.taskId === spec.id)
      if (!control) { control = { taskId: spec.id, desired: "running" }; state.tasks.push(control) }
      if (affected.has(spec.id)) { delete control.resumeCheckpointId; delete control.error }
    }
    for (const id of impact.removedTaskIds) { const control = state.tasks.find(x => x.taskId === id); if (control) control.desired = "cancelled" }
    for (const artifact of next.sourceArtifacts) {
      const existing = state.artifacts.find(x => x.id === artifact.id)
      if (existing && existing.digest !== artifact.digest) throw new Error("Immutable artifact identity conflict")
      if (!existing) state.artifacts.push(clean(artifact))
    }
    state.bundle = clean(next); state.history.push(clean(next))
    state.impacts.push({ graphRevision: next.graph.revision, affectedTaskIds: impact.affectedTaskIds, reasons: impact.reasons })
    tx.emit("graph.activated", { graph: ref(next.graph), affectedTaskIds: impact.affectedTaskIds, removedTaskIds: impact.removedTaskIds })
    return { graph: ref(next.graph), impact }
  }

  private stop(_state: AgentState, tx: Transaction, attempt: AttemptRecord, reason: StopReason) {
    attempt.desired = "stopped"; attempt.stopReason = reason; attempt.fenced = true
    tx.enqueue(`stop-${attempt.attemptId}`, "stop", { attemptId: attempt.attemptId })
    tx.emit("attempt.fenced", { attemptId: attempt.attemptId, fence: attempt.fence, reason })
  }

  private change<R>(graphId: string, kind: string, change: (state: AgentState, tx: Transaction) => R) {
    for (let retry = 0; retry < 4; retry++) {
      const current = this.store.read(graphId)
      if (!current) throw new Error(`Unknown graph: ${graphId}`)
      try { return this.store.command({ graphId, operationId: `${kind}-${randomUUID()}`, expectedRevision: current.revision, payload: { kind } }, change) }
      catch (error) { if (!(error instanceof RevisionConflict) || retry === 3) throw error }
    }
    throw new Error("State contention")
  }

  /** A bounded reconciliation pass. Caller controls polling and can restart at any time. */
  async tick(graphId: string) {
    const unavailable = unavailableResults(this.store.read(graphId)!.value, this.artifacts)
    if (unavailable.size) this.change(graphId, "integrity", (state, tx) => {
      for (const result of state.results) {
        const reason = unavailable.get(result.adoptionId)
        if (reason && result.validity === "valid") {
          result.validity = "invalid"; result.reasons = [reason]
          tx.emit("result.unavailable", { adoptionId: result.adoptionId, taskId: result.producer.nodeId, reason })
        }
      }
      return null
    })
    for (const intent of this.store.pending(graphId)) {
      if (!this.store.claim(intent.id, this.owner)) continue
      try {
        const state = this.store.read(graphId)!.value
        const attemptId = (intent.payload as { attemptId: string }).attemptId
        const attempt = state.attempts.find(x => x.attemptId === attemptId)
        if (!attempt) throw new Error("Intent references a missing attempt")
        if (intent.type === "start") {
          const observation = attempt.desired === "stopped" || attempt.fenced
            ? await this.backend.requestStop({ ...identity(attempt), reason: attempt.stopReason ?? "supersede", checkpoint: false })
            : await this.backend.ensureStarted(attempt.launch)
          this.observe(graphId, observation, intent.id)
        } else if (intent.type === "stop") {
          const observation = await this.backend.requestStop({ ...identity(attempt), reason: attempt.stopReason ?? "suspend", checkpoint: true })
          this.observe(graphId, observation, intent.id)
        } else if (intent.type === "capture") await this.capture(graphId, attemptId, intent.id)
        else throw new Error("Unknown backend intent")
      } catch (error) {
        const message = diagnostic(error)
        this.store.release(intent.id, this.owner, message)
        this.change(graphId, "intent-error", (state, tx) => {
          const attempt = state.attempts.find(a => a.attemptId === (intent.payload as any).attemptId)
          if (attempt) { attempt.error = message; findTask(state, attempt.taskId).error = message }
          tx.emit("intent.failed", { intentId: intent.id, message }); return null
        })
      }
    }
    const observing = this.store.read(graphId)!.value.attempts.filter(a => a.phase === "observe" || a.phase === "dispatch")
    for (const attempt of observing) {
      try { this.observe(graphId, await this.backend.observe(identity(attempt))) }
      catch (error) { this.observe(graphId, { ...identity(attempt), observed: "unknown", diagnostic: diagnostic(error) }) }
    }
    const validating = this.store.read(graphId)!.value.attempts.filter(a => a.phase === "validate")
    for (const attempt of validating) await this.validateCandidate(graphId, attempt.attemptId)
    await this.schedule(graphId)
    return this.get(graphId)
  }

  private observe(graphId: string, observation: RuntimeObservation, completedIntent?: string) {
    const obs = clean(observation)
    const before = this.store.read(graphId)!.value.attempts.find(a => a.attemptId === obs.attemptId)
    if (!before || !sameIdentity(identity(before), obs)) throw new Error("stale_attempt: observation identity mismatch")
    if (before.backendHandle && obs.backendHandle !== before.backendHandle) throw new Error("stale_attempt: backend handle changed or disappeared")
    if (obs.stopReceipt) {
      validateStopReceipt(obs.stopReceipt)
      if (!sameIdentity(identity(before), obs.stopReceipt)) throw new Error("stale_attempt: stop receipt identity mismatch")
      if (obs.stopReceipt.termination.kind === "all-writers-terminated" && obs.stopReceipt.backendHandle !== obs.backendHandle) throw new Error("stale_attempt: stop receipt backend mismatch")
      if (obs.stopReceipt.termination.kind === "creation-revoked" && (before.backendHandle || obs.backendHandle)) throw new Error("stale_attempt: a started execution cannot be uncreated")
    }
    if (!completedIntent && before.lastObservation && canonical(before.lastObservation) === canonical(obs)) return
    this.change(graphId, "observe", (state, tx) => {
      const attempt = state.attempts.find(a => a.attemptId === obs.attemptId)!
      if (!sameIdentity(identity(attempt), obs)) throw new Error("stale_attempt")
      if (completedIntent && (!completedIntent.startsWith("stop-") || obs.observed === "stopped" && obs.stopReceipt)) tx.completeIntent(completedIntent)
      if (["capture", "validate", "finished"].includes(attempt.phase)) return null
      attempt.lastObservation = obs; attempt.observed = obs.observed; attempt.observedFence = obs.fence
      if (obs.backendHandle) attempt.backendHandle = obs.backendHandle
      if (obs.outcome) attempt.outcome = obs.outcome
      if (obs.diagnostic) attempt.error = obs.diagnostic; else delete attempt.error
      attempt.phase = "observe"
      if (obs.observed === "stopped") {
        if (!obs.stopReceipt || !sameIdentity(identity(attempt), obs.stopReceipt)) throw new Error("termination_unknown: stopped observation needs exact receipt")
        attempt.stopReceipt = obs.stopReceipt
        const workspace = state.workspaces.find(w => w.id === attempt.workspaceId)!
        if (obs.stopReceipt.termination.kind === "creation-revoked") {
          workspace.activeWriter = null; workspace.captureHold = null; attempt.phase = "finished"
        } else {
          workspace.captureHold = { attemptId: attempt.attemptId, fence: attempt.fence }
          attempt.phase = "capture"
          tx.enqueue(`capture-${attempt.attemptId}`, "capture", { attemptId: attempt.attemptId })
        }
      }
      tx.emit("attempt.observed", { attemptId: attempt.attemptId, observed: attempt.observed, fence: attempt.fence }); return null
    })
  }

  private async capture(graphId: string, attemptId: string, intentId: string) {
    const before = this.store.read(graphId)!.value
    const attempt = before.attempts.find(x => x.attemptId === attemptId)!
    if (!attempt.stopReceipt) throw new Error("Missing stop receipt")
    const captured = await this.backend.captureStoppedWorkspace(attempt.stopReceipt)
    validateCaptureResult(captured)
    if (!sameIdentity(identity(attempt), captured.identity) || captured.identity.backendHandle !== attempt.backendHandle) throw new Error("Capture identity mismatch")
    const workspace = this.artifacts.ingestCapture(captured.workspace)
    const outputs = captured.outputs.map(output => ({ port: output.port, tree: this.artifacts.ingestCapture(output.snapshot) }))
    const bundle = before.history.find(b => sameRef(b.graph, attempt.inputs.graphRef))!
    const spec = byRef(bundle.tasks, attempt.taskSpecRef)
    const candidates: ArtifactManifest[] = outputs.map(({ port, tree }) => {
      const definition = spec.outputPorts.find(p => p.name === port)
      if (!definition) throw new Error("Undeclared output captured")
      return withDigest({ id: `artifact-${attemptId}-${port}`, outputPort: port, contractRef: definition.contractRef, contentDigest: tree.ref.digest,
        storage: tree.ref, validationEvidenceIds: [], origin: { kind: "execution" as const, taskSpecRef: attempt.taskSpecRef, attemptId }, consumedInputs: attempt.inputs })
    })
    const checkpointBody = { id: `checkpoint-${attemptId}`, attemptId, fence: attempt.fence, workspaceSnapshot: workspace.ref,
      taskSpecRef: attempt.taskSpecRef, inputSnapshotDigest: attempt.inputs.provenanceDigest, templateDigest: attempt.inputs.workspaceTemplateDigest,
      completedSteps: captured.checkpoint?.completedSteps ?? [], effectReceipts: captured.checkpoint?.effectReceipts ?? [] }
    const checkpoint: CheckpointManifest | undefined = captured.checkpoint ? { ...checkpointBody, integrityDigest: digest(checkpointBody) } : undefined
    const inputArtifacts = attempt.inputs.bindings.map(binding => before.artifacts.find(a => a.id === binding.artifactRef.id)!)
    const validations = [...spec.design.acceptance.map(v => ({ validatorRef: v, subjects: candidates })),
      ...spec.outputPorts.flatMap(port => byRef(bundle.contracts, port.contractRef).validators.map(v => ({ validatorRef: v, subjects: candidates.filter(a => a.outputPort === port.name) })))]
    const uniqueValidators = [...new Map(validations.map(v => [digest([v.validatorRef, v.subjects.map(a => a.digest)]), v])).entries()]
    const requests: ValidationRequest[] = uniqueValidators.map(([key, { validatorRef, subjects }]) => ({ id: `validation-${attemptId}-${key.slice(7, 23)}`,
      validator: byRef(bundle.validators, validatorRef), inputs: attempt.inputs, artifacts: subjects, inputArtifacts,
      template: attempt.launch.template, policy: attempt.launch.policy }))
    this.change(graphId, "capture", (state, tx) => {
      const current = state.attempts.find(a => a.attemptId === attemptId)!
      const space = state.workspaces.find(w => w.id === current.workspaceId)!
      if (current.phase !== "capture" || space.captureHold?.attemptId !== attemptId || space.captureHold.fence !== current.fence) throw new Error("Capture hold mismatch")
      if (checkpoint) {
        if (!state.checkpoints.some(x => x.id === checkpoint.id)) state.checkpoints.push(checkpoint)
        current.checkpointId = checkpoint.id; space.lastCheckpointId = checkpoint.id
      } else if (current.stopReason === "suspend") findTask(state, current.taskId).error = "checkpoint_invalid: execution stopped without a verified checkpoint"
      for (const artifact of candidates) if (!state.artifacts.some(x => x.id === artifact.id)) state.artifacts.push(artifact)
      current.candidateIds = candidates.map(a => a.id); current.validationRequests = requests
      space.activeWriter = null; space.captureHold = null
      current.phase = current.outcome?.kind === "success" && !current.fenced && current.desired === "running" ? "validate" : "finished"
      if (current.outcome?.kind === "failure" && !current.fenced) {
        const task = findTask(state, current.taskId); task.desired = "suspended"; task.error = current.outcome.reason
      }
      tx.completeIntent(intentId); tx.emit("workspace.captured", { attemptId, checkpointId: checkpoint?.id ?? null, outputIds: current.candidateIds }); return null
    })
  }

  private async validateCandidate(graphId: string, attemptId: string) {
    const state = this.store.read(graphId)!.value, attempt = state.attempts.find(x => x.attemptId === attemptId)!
    if (attempt.fenced) { this.change(graphId, "retire", s => { s.attempts.find(a => a.attemptId === attemptId)!.phase = "finished"; return null }); return }
    const bundle = state.history.find(b => sameRef(b.graph, attempt.inputs.graphRef))!
    const spec = byRef(bundle.tasks, attempt.taskSpecRef), candidates = attempt.candidateIds.map(id => state.artifacts.find(a => a.id === id)!)
    try {
      if (spec.outputPorts.length !== candidates.length) throw new Error("Required output missing")
      for (const artifact of candidates) {
        const shape = await validateArtifactShape(artifact, byRef(bundle.contracts, artifact.contractRef), this.artifacts)
        if (shape.outcome !== "passed") throw new Error(`validation_failed: ${shape.diagnostics.join("; ")}`)
      }
      const evidence: ValidationEvidence[] = []
      for (const request of attempt.validationRequests) {
        const proof = await this.validator.validate(request)
        await this.checkEvidence(request, proof)
        evidence.push(proof)
      }
      if (evidence.some(e => e.outcome !== "passed")) throw new Error("validation_failed: validators did not all pass")
      if (!evidence.length) throw new Error("validation_failed: no independent verification evidence")
      this.change(graphId, "adopt", (current, tx) => {
        const a = current.attempts.find(x => x.attemptId === attemptId)!, task = findTask(current, a.taskId), active = bundleFor(current)
        if (a.fenced || a.desired !== "running" || task.desired !== "running" || task.lastAttemptId !== a.attemptId || !a.stopReceipt) { a.phase = "finished"; return null }
        const fresh = resolveInputs(active, a.taskId, current.results, current.artifacts, current.adoptions)
        if (!fresh.ready || !fresh.snapshot || fresh.snapshot.semanticReuseKey !== a.inputs.semanticReuseKey) { a.fenced = true; a.phase = "finished"; return null }
        for (const proof of evidence) if (!current.evidence.some(e => e.id === proof.id)) current.evidence.push(clean(proof))
        let adoption: AdoptionRecord = { id: `adoption-${randomUUID()}`, mode: "fresh", targetGraphRef: a.inputs.graphRef,
          targetTaskSpecRef: a.taskSpecRef, currentInputs: a.inputs,
          artifactRefs: candidates.map(x => ({ id: x.id, digest: x.digest })), validationEvidenceIds: evidence.map(x => x.id), attemptId, fence: a.fence }
        if (a.inputs.provenanceDigest !== fresh.snapshot.provenanceDigest) {
          current.adoptions.push(adoption)
          adoption = { id: `adoption-${randomUUID()}`, mode: "reuse", originalAdoptionId: adoption.id,
            targetGraphRef: ref(active.graph), targetTaskSpecRef: fresh.snapshot.taskSpecRef, currentInputs: fresh.snapshot,
            artifactRefs: adoption.artifactRefs, validationEvidenceIds: adoption.validationEvidenceIds,
            equivalenceEvidenceIds: [digest({ from: a.inputs.semanticReuseKey, to: fresh.snapshot.semanticReuseKey })] }
        }
        this.installAdoption(current, adoption, candidates)
        a.phase = "finished"; delete task.error
        tx.emit("result.adopted", { adoptionId: adoption.id, taskId: a.taskId, mode: adoption.mode }); return null
      })
    } catch (error) {
      this.change(graphId, "validation-failed", (current, tx) => {
        const a = current.attempts.find(x => x.attemptId === attemptId)!
        // A validator that is still running should remain retryable across control restarts.
        if (String(error).includes("validation_pending")) { a.error = String(error); return null }
        a.phase = "finished"; a.error = diagnostic(error)
        if (!a.fenced) { const task = findTask(current, a.taskId); task.desired = "suspended"; task.error = a.error }
        tx.emit("validation.failed", { attemptId, message: String(error) }); return null
      })
    }
  }

  private installAdoption(state: AgentState, adoption: AdoptionRecord, candidates: ArtifactManifest[]) {
    state.adoptions.push(adoption)
    for (const candidate of candidates) {
      state.results = state.results.filter(r => !(r.producer.nodeId === adoption.targetTaskSpecRef.id && r.producer.port === candidate.outputPort))
      state.results.push({ producer: { nodeId: adoption.targetTaskSpecRef.id, port: candidate.outputPort }, artifactRef: { id: candidate.id, digest: candidate.digest },
        adoptionId: adoption.id, validity: "valid", reasons: [] })
    }
  }

  private async checkEvidence(request: ValidationRequest, evidence: ValidationEvidence) {
    await verifyValidationEvidence(request, evidence, this.artifacts)
  }

  private async schedule(graphId: string) {
    const snapshot = this.store.read(graphId)!
    if (!snapshot.value.bundle) return
    for (const originalSpec of activeTasks(snapshot.value.bundle)) {
      const state = this.store.read(graphId)!.value, bundle = bundleFor(state), spec = activeTasks(bundle).find(t => t.id === originalSpec.id)
      if (!spec) continue
      const task = findTask(state, spec.id)
      if (task.desired !== "running" || taskComplete(bundle, spec.id, state.results)) continue
      if (state.attempts.some(a => a.taskId === spec.id && a.phase !== "finished")) continue
      if (state.workspaces.some(w => w.ownerTaskId === spec.id && (w.activeWriter || w.captureHold))) continue
      const inputs = resolveInputs(bundle, spec.id, state.results, state.artifacts, state.adoptions)
      if (!inputs.ready || !inputs.snapshot) continue
      const previous = [...state.adoptions].reverse().find(a => a.targetTaskSpecRef.id === spec.id)
      const decision = decideRework(bundle, spec.id, inputs.snapshot, previous)
      if (previous && decision.action === "reuse") {
        const candidates = previous.artifactRefs.map(r => state.artifacts.find(a => a.id === r.id)!)
        if (adoptionIntact(state, previous, this.artifacts) && (await Promise.all(candidates.map(a => this.artifacts.verify(a.storage)))).every(Boolean)) {
          this.change(graphId, "reuse", (current, tx) => {
            const active = bundleFor(current), fresh = resolveInputs(active, spec.id, current.results, current.artifacts, current.adoptions)
            if (!this.canAdoptWithoutExecution(current, spec.id)) return null
            if (!fresh.ready || !fresh.snapshot || fresh.snapshot.semanticReuseKey !== inputs.snapshot!.semanticReuseKey) return null
            const adoption: AdoptionRecord = { id: `adoption-${randomUUID()}`, mode: "reuse", targetGraphRef: ref(active.graph), targetTaskSpecRef: fresh.snapshot.taskSpecRef,
              currentInputs: fresh.snapshot, artifactRefs: previous.artifactRefs, validationEvidenceIds: previous.validationEvidenceIds,
              originalAdoptionId: previous.id, equivalenceEvidenceIds: [digest({ from: previous.currentInputs.semanticReuseKey, to: fresh.snapshot.semanticReuseKey })] }
            this.installAdoption(current, adoption, candidates); tx.emit("result.reused", { taskId: spec.id, adoptionId: adoption.id }); return null
          })
          continue
        }
      }
      if (previous && decision.action === "revalidate") {
        const reused = await this.revalidate(graphId, spec, inputs.snapshot, previous, decision.validatorRefs ?? [])
        if (reused) continue
      }
      if (decision.action === "wait") continue
      this.startAttempt(graphId, spec, inputs.snapshot, task)
    }
  }

  private async revalidate(graphId: string, spec: TaskSpecRevision, inputs: InputSnapshot, previous: AdoptionRecord, refs: RevisionRef[]) {
    const state = this.store.read(graphId)!.value, bundle = bundleFor(state)
    const candidates = previous.artifactRefs.map(r => state.artifacts.find(a => a.id === r.id)!)
    if (!refs.length || !(await Promise.all(candidates.map(a => this.artifacts.verify(a.storage)))).every(Boolean)) return false
    const requests: ValidationRequest[] = refs.map(r => ({ id: `revalidate-${spec.id}-${digest([inputs.provenanceDigest, previous.id, r]).slice(7, 31)}`,
      validator: byRef(bundle.validators, r), inputs, artifacts: candidates,
      inputArtifacts: inputs.bindings.map(b => state.artifacts.find(a => a.id === b.artifactRef.id)!),
      template: byRef(bundle.templates, spec.workspaceTemplateRef), policy: byRef(bundle.policies, spec.executionPolicyRef) }))
    // Persist the exact requests before invoking any external validator.
    for (const request of requests) this.store.putRecord("validation-request", request.id, request)
    try {
      const proofs = await Promise.all(requests.map(async request => {
        const proof = await this.validator.validate(request); await this.checkEvidence(request, proof); return proof
      }))
      this.change(graphId, "revalidation-observed", (current, tx) => {
        const added = proofs.filter(p => !current.evidence.some(e => e.id === p.id))
        current.evidence.push(...clean(added))
        if (added.length) tx.emit("validation.compared", { taskId: spec.id, graphRef: inputs.graphRef,
          inputSnapshotDigest: inputs.provenanceDigest, outcomes: added.map(p => ({ evidenceId: p.id, outcome: p.outcome })) })
        return null
      })
      if (proofs.some(p => p.outcome === "inconclusive")) {
        this.waitForRevalidation(graphId, spec.id, inputs, "validation_inconclusive: compatibility requires a decision or environment repair")
        return true
      }
      if (proofs.some(p => p.outcome === "failed")) return false
      this.change(graphId, "revalidate", (current, tx) => {
        const active = bundleFor(current), fresh = resolveInputs(active, spec.id, current.results, current.artifacts, current.adoptions)
        if (!this.canAdoptWithoutExecution(current, spec.id)) return null
        if (!fresh.ready || !fresh.snapshot || fresh.snapshot.semanticReuseKey !== inputs.semanticReuseKey) return null
        current.evidence.push(...proofs.filter(p => !current.evidence.some(x => x.id === p.id)))
        const adoption: AdoptionRecord = { id: `adoption-${randomUUID()}`, mode: "revalidate", targetGraphRef: ref(active.graph), targetTaskSpecRef: fresh.snapshot.taskSpecRef,
          currentInputs: fresh.snapshot, artifactRefs: previous.artifactRefs, validationEvidenceIds: proofs.map(p => p.id), originalAdoptionId: previous.id,
          equivalenceEvidenceIds: proofs.map(p => p.id) }
        this.installAdoption(current, adoption, candidates); tx.emit("result.revalidated", { taskId: spec.id, adoptionId: adoption.id }); return null
      })
      return true
    } catch (error) {
      if (!String(error).includes("validation_pending")) this.waitForRevalidation(graphId, spec.id, inputs, diagnostic(error))
      return true
    }
  }

  private waitForRevalidation(graphId: string, taskId: string, inputs: InputSnapshot, reason: string) {
    this.change(graphId, "revalidation-wait", (state, tx) => {
      const task = findTask(state, taskId)
      if (!this.canAdoptWithoutExecution(state, taskId) || !state.bundle?.graph.taskSpecRefs.some(r => sameRef(r, inputs.taskSpecRef))) return null
      const current = resolveInputs(state.bundle, taskId, state.results, state.artifacts, state.adoptions)
      if (!current.ready || current.snapshot?.semanticReuseKey !== inputs.semanticReuseKey) return null
      task.desired = "suspended"; task.error = reason
      tx.emit("validation.waiting", { taskId, reason }); return null
    })
  }

  private startAttempt(graphId: string, spec: TaskSpecRevision, inputs: InputSnapshot, control: TaskControl) {
    this.change(graphId, "schedule", (state, tx) => {
      const bundle = bundleFor(state), task = findTask(state, spec.id)
      if (task.desired !== "running" || state.attempts.some(a => a.taskId === spec.id && a.phase !== "finished")) return null
      const current = resolveInputs(bundle, spec.id, state.results, state.artifacts, state.adoptions)
      if (!current.ready || !current.snapshot || current.snapshot.provenanceDigest !== inputs.provenanceDigest || !sameRef(spec, current.snapshot.taskSpecRef)) return null
      const template = byRef(bundle.templates, spec.workspaceTemplateRef), policy = byRef(bundle.policies, spec.executionPolicyRef)
      const checkpoint = control.resumeCheckpointId ? state.checkpoints.find(c => c.id === control.resumeCheckpointId) : undefined
      const resumedAttempt = checkpoint && state.attempts.find(a => a.attemptId === checkpoint.attemptId)
      const canResume = checkpoint && resumedAttempt && sameRef(checkpoint.taskSpecRef, spec) && resumedAttempt.inputs.semanticReuseKey === inputs.semanticReuseKey && checkpoint.templateDigest === template.digest
      let workspace = canResume ? state.workspaces.find(w => w.id === resumedAttempt.workspaceId) : undefined
      if (workspace?.activeWriter || workspace?.captureHold) return null
      if (!workspace) {
        workspace = { id: `workspace-${randomUUID()}`, ownerTaskId: spec.id, templateRef: ref(template), activeWriter: null, captureHold: null, retention: "retained" }
        state.workspaces.push(workspace)
      }
      const attemptId = `attempt-${randomUUID()}`, fence = Math.max(0, ...state.attempts.filter(a => a.workspaceId === workspace!.id).map(a => a.fence)) + 1
      const inputArtifacts = inputs.bindings.map(binding => state.artifacts.find(a => a.id === binding.artifactRef.id)!)
      const launch: LaunchRequest = { attemptId, fence, intentId: `start-${attemptId}`, workspaceId: workspace.id, task: clean(spec), template: clean(template), policy: clean(policy),
        inputSnapshot: inputs, inputArtifacts, readOnlyInputs: inputs.bindings.map((binding, i) => ({ port: binding.inputPort, digest: binding.contentDigest,
          hostPath: this.artifacts.pin(inputArtifacts[i]!.storage) })),
        ...(canResume ? { resumeCheckpoint: { manifest: checkpoint, snapshotPath: this.artifacts.pin(checkpoint.workspaceSnapshot) } } : {}) }
      if (template.sourceSnapshots.length > 1 || template.sourceSnapshots.some(s => s.destination !== ".")) throw new Error("capability_unsupported: first backend accepts one root source snapshot")
      if (template.sourceSnapshots[0]) launch.sourceSnapshotPath = this.artifacts.pin(template.sourceSnapshots[0].snapshot)
      const attempt: AttemptRecord = { attemptId, taskId: spec.id, taskSpecRef: ref(spec), inputs, workspaceId: workspace.id, fence, intentId: launch.intentId,
        desired: "running", observed: "queued", observedFence: fence, fenced: false, launch, phase: "dispatch", candidateIds: [], validationRequests: [] }
      state.attempts.push(attempt); task.lastAttemptId = attemptId; delete task.resumeCheckpointId
      workspace.activeWriter = { attemptId, fence }
      tx.enqueue(launch.intentId, "start", { attemptId }); tx.emit("attempt.scheduled", { taskId: spec.id, attemptId, workspaceId: workspace.id, fence }); return null
    })
  }

  private canAdoptWithoutExecution(state: AgentState, taskId: string) {
    return findTask(state, taskId).desired === "running"
      && !state.attempts.some(a => a.taskId === taskId && a.phase !== "finished")
      && !state.workspaces.some(w => w.ownerTaskId === taskId && (w.activeWriter || w.captureHold))
  }
}
