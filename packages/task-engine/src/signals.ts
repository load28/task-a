import { randomUUID } from "node:crypto"
import { controlCompletionMissing } from "../../task-control/src/completion.ts"
import { fingerprint } from "./revisions.ts"
import type { TaskGraphEngine, CompleteTaskInput } from "./index.ts"
import type { ArtifactVersionRef } from "#task-domain"
import type { CodeSnapshot } from "../../task-snapshots/src/index.ts"
export interface InputSnapshot {
  digest: string; specHash: string; inputRefs: ArtifactVersionRef[]; signatures: unknown[]; reusable: boolean
}
export interface InputSignal { taskId: string; generation: number; causes: string[]; updatedAt: string }
export interface SignalStop { id: string; taskId: string; token: string; state: "requested" | "stopped"; evidence?: string }
const refKey = (ref: ArtifactVersionRef) => `${ref.artifactId}@${ref.version}`

/** Push invalidates only immediate consumers; pull coalesces changes at claim time.
 * Every graph mutation and publication comparison uses the same SQLite transaction. */
export class SignalCoordinator {
  readonly engine: TaskGraphEngine
  private flushing = false
  constructor(engine: TaskGraphEngine) { this.engine = engine }
  get store() { return this.engine.store }
  list(): InputSignal[] { return this.store.db.prepare("SELECT payload FROM task_input_signals").all().map(r => JSON.parse(String(r.payload))) }
  stops(): SignalStop[] { return this.store.db.prepare("SELECT payload FROM task_input_stops").all().map(r => JSON.parse(String(r.payload))) }
  dirty(taskId: string): boolean {
    const task = this.engine.requireTask(taskId)
    if (task.childIds.length) return task.childIds.some(id => this.dirty(id))
    return !!this.store.db.prepare("SELECT 1 FROM task_input_signals WHERE task_id=?").get(taskId)
  }
  setEnvironment(taskId: string, value: unknown) {
    const prior = this.store.db.prepare("SELECT digest FROM task_environments WHERE task_id=?").get(taskId)?.digest
    const next = fingerprint(value)
    this.store.db.prepare("INSERT INTO task_environments VALUES(?,?) ON CONFLICT(task_id) DO UPDATE SET digest=excluded.digest").run(taskId, next)
    if (prior && prior !== next && this.store.currentAttempt(taskId)) this.invalidate(taskId, "execution environment changed")
  }
  attest(taskId: string, token: string, snapshot: CodeSnapshot) {
    if (!/^[a-f0-9]{64}$/.test(snapshot.hash) || snapshot.algorithm !== "sha256-tree-v1" || !Number.isInteger(snapshot.fileCount) || snapshot.fileCount < 0) throw new Error("Invalid actual code snapshot receipt")
    this.store.db.prepare("INSERT INTO task_output_snapshots VALUES(?,?,?) ON CONFLICT(task_id,token) DO UPDATE SET payload=excluded.payload").run(taskId, token, JSON.stringify(snapshot))
  }
  outputSnapshot(taskId: string, token: string | undefined): CodeSnapshot | undefined {
    const row = token && this.store.db.prepare("SELECT payload FROM task_output_snapshots WHERE task_id=? AND token=?").get(taskId, token)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  attach(ref: ArtifactVersionRef, snapshot?: CodeSnapshot, sourceInstanceTaskId?: string) {
    if (snapshot) this.store.db.prepare("INSERT INTO artifact_code_snapshots VALUES(?,?,?)").run(ref.artifactId, ref.version, JSON.stringify({ ...snapshot, sourceInstanceTaskId: sourceInstanceTaskId ?? (snapshot as CodeSnapshot & { sourceInstanceTaskId?: string }).sourceInstanceTaskId }))
  }
  code(ref: ArtifactVersionRef): (CodeSnapshot & { sourceInstanceTaskId?: string }) | undefined {
    const row = this.store.db.prepare("SELECT payload FROM artifact_code_snapshots WHERE artifact_id=? AND version=?").get(ref.artifactId, ref.version)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  signature(ref: ArtifactVersionRef): { value: unknown; reusable: boolean } {
    const v = this.engine.requireArtifactVersion(ref), name = this.store.findArtifact(ref.artifactId)!.name
    if (v.type === "bundle") {
      const members = v.inputs.map(r => this.signature(r))
      return { value: [name, v.type, members.map(m => m.value), v.contractVersionRefs], reusable: members.every(m => m.reusable) }
    }
    const code = this.code(ref)
    return { value: [name, v.type, v.type === "code" ? code?.hash ?? refKey(ref) : v.content === undefined ? refKey(ref) : fingerprint(v.content), v.contractVersionRefs],
      reusable: v.type !== "code" || !!code }
  }
  dependencies(taskId: string): string[] {
    return [...new Set([...this.engine.requireTask(taskId).dependencies, ...this.engine.ancestorsOf(taskId).flatMap(t => t.dependencies)])]
  }
  settled(taskId: string, seen = new Set<string>()): boolean {
    if (seen.has(taskId)) return false
    seen.add(taskId)
    return this.dependencies(taskId).every(id => {
      const t = this.engine.requireTask(id)
      return this.store.executionAllowed(id) && !this.dirty(id) && ["verified", "integrating", "integrated"].includes(t.status) && controlCompletionMissing(this.engine,[id]).length===0 && this.settled(id, new Set(seen))
    })
  }
  capture(taskId: string): InputSnapshot {
    const t = this.engine.requireTask(taskId), ancestors = this.engine.ancestorsOf(taskId)
    const inputRefs = [...new Map([...t.inputArtifactRefs.map(r => ({ artifactId: r.artifactId, version: this.store.findArtifact(r.artifactId)!.latestVersion })),
      ...this.dependencies(taskId).flatMap(id => this.engine.requireTask(id).outputArtifactRefs)].map(r => [refKey(r), r])).values()]
    const signatures = inputRefs.map(r => this.signature(r)).sort((a, b) => JSON.stringify(a.value).localeCompare(JSON.stringify(b.value)))
    const plan = this.store.findWorkPlanByRootTask(this.engine.rootOf(taskId).id)
    const specs = plan ? this.store.planNodes(plan.id, this.store.activePlanVersion(plan.id)).filter(n => this.store.planLinks(plan.id, this.store.activePlanVersion(plan.id)).some(l => l.nodeId === n.nodeId && [taskId, ...ancestors.map(a => a.id)].includes(l.taskId))).map(n => n.taskSpec) : []
    const specHash = fingerprint([t.goal, t.category, t.acceptanceCriteria.map(c => c.description), t.contextPolicy, t.assignedRole, t.integrationPolicy,
      this.store.contractsFor(taskId).map(c => [c.id, c.version]),
      ancestors.map(a => a.goal), this.store.requirementsOf([taskId, ...ancestors.map(a => a.id)]).map(r => [r.description, r.kind, r.version]), specs,
      this.store.db.prepare("SELECT digest FROM task_environments WHERE task_id=?").get(taskId)?.digest ?? fingerprint([process.versions.node, process.platform, process.arch])])
    return { specHash, inputRefs, signatures: signatures.map(s => s.value), reusable: signatures.every(s => s.reusable),
      digest: fingerprint([specHash, signatures.map(s => s.value)]) }
  }
  pin(taskId: string, attemptId: string) {
    const snapshot = this.capture(taskId)
    this.store.db.prepare("INSERT INTO task_input_snapshots VALUES(?,?)").run(attemptId, JSON.stringify(snapshot))
    this.store.db.prepare("DELETE FROM task_input_signals WHERE task_id=?").run(taskId)
    return snapshot
  }
  pinned(taskId: string): InputSnapshot | undefined {
    const attempt = this.store.currentAttempt(taskId)
    const row = attempt && this.store.db.prepare("SELECT payload FROM task_input_snapshots WHERE attempt_id=?").get(attempt.id)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
  matches(taskId: string) {
    const attempt = this.store.currentAttempt(taskId)
    if (attempt?.state === "fenced" || this.dirty(taskId)) return false
    const prior = this.pinned(taskId)
    // Legacy attempts have no complete snapshot: no completion adoption across an upgrade.
    return !!prior && prior.digest === this.capture(taskId).digest
  }
  invalidate(taskId: string, cause: string) {
    if (!this.store.executionAllowed(taskId)) return
    const task = this.engine.requireTask(taskId)
    if (task.childIds.length) { for (const id of task.childIds) this.invalidate(id, cause); return }
    const prior = this.list().find(s => s.taskId === taskId)
    const signal: InputSignal = { taskId, generation: (prior?.generation ?? 0) + 1, causes: [...new Set([...(prior?.causes ?? []), cause])], updatedAt: new Date().toISOString() }
    this.store.db.prepare("INSERT INTO task_input_signals VALUES(?,?) ON CONFLICT(task_id) DO UPDATE SET payload=excluded.payload").run(taskId, JSON.stringify(signal))
    const attempt = this.store.currentAttempt(taskId)
    const reserved = this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get() && this.store.db.prepare("SELECT 1 FROM task_reservations WHERE task_id=?").get(taskId)
    if (attempt && (attempt.state === "running" || reserved)) {
      this.store.saveAttempt({ ...attempt, state: "fenced" })
      if (!this.stops().some(s => s.taskId === taskId && s.token === attempt.token)) {
        const stop: SignalStop = { id: randomUUID(), taskId, token: attempt.token, state: "requested" }
        this.store.db.prepare("INSERT INTO task_input_stops VALUES(?,?)").run(stop.id, JSON.stringify(stop))
      }
    }
    const pending = this.store.db.prepare("SELECT payload FROM task_pending_results WHERE task_id=?").get(taskId)
    if (pending) this.store.db.prepare("INSERT INTO late_task_reports VALUES(?,?,?)").run(randomUUID(), taskId, String(pending.payload))
    this.store.db.prepare("DELETE FROM task_pending_results WHERE task_id=?").run(taskId)
    this.store.updateTask({ ...task, status: "stale", statusReason: `Input changed: ${cause}` })
    this.engine.refreshAncestors(taskId)
  }
  push(ref: ArtifactVersionRef) {
    const latest = this.engine.requireArtifactVersion(ref)
    if (ref.version > 1 && fingerprint(this.signature(ref).value) === fingerprint(this.signature({ ...ref, version: ref.version - 1 }).value)) return false
    const invalid = new Set([ref.artifactId])
    let expanded = true
    while (expanded) {
      expanded = false
      for (const bundle of this.store.validBundles()) if (bundle.memberRefs.some(r => invalid.has(r.artifactId))) {
        this.store.markBundleStale(bundle.artifactId, bundle.version)
        this.store.markArtifactVersionStale(bundle.artifactId, bundle.version)
        if (!invalid.has(bundle.artifactId)) { invalid.add(bundle.artifactId); expanded = true }
      }
    }
    for (const set of this.store.integrationSets()) if (set.memberRefs.some(r => invalid.has(r.artifactId)))
      this.store.updateIntegrationSet({ ...set, status: "stale", updatedAt: new Date().toISOString() })
    for (const row of this.store.db.prepare("SELECT id FROM tasks").all()) {
      const id = String(row.id)
      if (id === latest.producerTaskId || !this.store.executionAllowed(id)) continue
      const task = this.engine.requireTask(id), pinned = this.pinned(id)
      const consumes = (r: ArtifactVersionRef): boolean => r.artifactId === ref.artifactId || this.engine.requireArtifactVersion(r).type === "bundle" && this.engine.requireArtifactVersion(r).inputs.some(consumes)
      const refs = pinned?.inputRefs ?? task.inputArtifactRefs
      if (refs.some(consumes) || this.dependencies(id).some(d => this.engine.requireTask(d).outputArtifactRefs.some(r => r.artifactId === ref.artifactId))) this.invalidate(id, refKey(ref))
    }
    return true
  }
  stopped(id: string, token: string, evidence: string) {
    return this.engine.atomic(() => {
      const stop = this.stops().find(s => s.id === id)
      if (!stop || stop.token !== token || !evidence.trim()) throw new Error("Exact stopped attempt and evidence required")
      this.store.db.prepare("UPDATE task_input_stops SET payload=? WHERE id=?").run(JSON.stringify({ ...stop, state: "stopped", evidence }), id)
      if (this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get()) this.store.db.prepare("DELETE FROM task_reservations WHERE task_id=?").run(stop.taskId)
      this.prepare(stop.taskId)
    })
  }
  prepare(taskId: string) {
    if (!this.dirty(taskId) || !this.store.executionAllowed(taskId) || this.stops().some(s => s.taskId === taskId && s.state === "requested") || !this.settled(taskId)) return
    const t = this.engine.requireTask(taskId)
    if (t.status === "stale") this.store.updateTask({ ...t, status: "ready" })
  }
  defer(input: CompleteTaskInput) {
    this.store.db.prepare("INSERT INTO task_pending_results VALUES(?,?) ON CONFLICT(task_id) DO UPDATE SET payload=excluded.payload").run(input.taskId, JSON.stringify(input))
    const task = this.engine.requireTask(input.taskId), attempt = this.store.currentAttempt(input.taskId)!
    this.store.updateTask({ ...task, status: "implemented", statusReason: "Waiting for stable upstream inputs before adoption" })
    this.store.saveAttempt({ ...attempt, state: "completed" })
    if (this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get()) this.store.db.prepare("DELETE FROM task_reservations WHERE task_id=?").run(input.taskId)
    return this.engine.requireTask(input.taskId)
  }
  flush() {
    if (this.flushing) return
    this.flushing = true
    try {
      for (const row of this.store.db.prepare("SELECT task_id,payload FROM task_pending_results").all()) {
        const taskId = String(row.task_id)
        if (!this.settled(taskId) || this.dirty(taskId)) continue
        this.store.db.prepare("DELETE FROM task_pending_results WHERE task_id=?").run(taskId)
        this.engine.completeTask(JSON.parse(String(row.payload)))
      }
    } finally { this.flushing = false }
  }
}
