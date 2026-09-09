import { createHash, randomUUID } from "node:crypto"
import type { TaskGraphEngine } from "./index.ts"
import type { PlanNode, PlanImpactReport, PlanTransition, RevisionContext, Task, PlanTaskLink } from "#task-domain"
import { assertControlledPlanActivation } from "../../task-control/src/plan-admission.ts"

export const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().filter(key => value[key] !== undefined).map(key => [key, canonical(value[key])])) : value
export const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex")

/** Revision decisions are deterministic. Ambiguous reuse becomes validation, never assumed success. */
export class RevisionCoordinator {
  readonly engine: TaskGraphEngine
  constructor(engine: TaskGraphEngine) { this.engine = engine }
  get store() { return this.engine.store }
  context(planId: string, version: number): RevisionContext {
    const row = this.store.db.prepare("SELECT payload FROM plan_revision_context WHERE plan_id=? AND version=?").get(planId, version)
    return row ? JSON.parse(String(row.payload)) : { goal: this.store.findWorkPlan(planId)!.goal, requirements: [], constraints: [] }
  }
  saveContext(planId: string, version: number, value: RevisionContext) {
    this.store.db.prepare("INSERT INTO plan_revision_context VALUES(?,?,?)").run(planId, version, JSON.stringify(value))
  }
  private keys(planId: string, version: number) {
    const nodes = new Map(this.store.planNodes(planId, version).map(n => [n.nodeId, n]))
    const effective = new Map<string, string>(), own = new Map<string, string>()
    const context = this.context(planId, version), visiting = new Set<string>()
    const self = (id: string): string => {
      if (own.has(id)) return own.get(id)!
      const n = nodes.get(id)!
      const key = fingerprint([context, n.stage, n.researchTrack, n.outcome, n.taskSpec,
        n.parentNodeId ? self(n.parentNodeId) : null])
      own.set(id, key); return key
    }
    const walk = (id: string): string => {
      if (effective.has(id)) return effective.get(id)!
      if (visiting.has(id)) throw new Error("Cyclic plan dependencies")
      visiting.add(id)
      const n = nodes.get(id)!
      const key = fingerprint([self(id), n.parentNodeId ? [n.parentNodeId, walk(n.parentNodeId)] : null, n.dependsOnNodeIds.map(d => [d, walk(d)]).sort()])
      visiting.delete(id); effective.set(id, key); return key
    }
    for (const id of nodes.keys()) walk(id)
    return { nodes, effective, own }
  }
  analyze(planId: string, toVersion: number, fromVersion = this.store.activePlanVersion(planId)): PlanImpactReport {
    const old = this.keys(planId, fromVersion), next = this.keys(planId, toVersion)
    const links = new Map(this.store.planLinks(planId, fromVersion).map(l => [l.nodeId, l]))
    const decisions: NonNullable<PlanImpactReport["decisions"]> = []
    for (const [nodeId, n] of next.nodes) {
      const prior = links.get(nodeId)
      const task = prior && this.store.findTask(prior.taskId)
      const validOutputs = task?.outputArtifactRefs.every(r => this.store.findArtifactVersion(r.artifactId, r.version)?.status === "valid")
      const same = !!prior && old.effective.get(nodeId) === next.effective.get(nodeId)
      let action: (typeof decisions)[number]["action"] = same && validOutputs ? "reuse" : prior ? old.own.get(nodeId) === next.own.get(nodeId) ? "revalidate" : "replace" : "create"
      let priorTaskId = prior?.taskId
      // A previously completed identical specification can be adopted even after an intervening direction change.
      if (action !== "reuse") {
        outer: for (let v = fromVersion; v >= 1; v--) {
          const keys = this.keys(planId, v)
          for (const link of this.store.planLinks(planId, v)) {
            if (![nodeId, ...(n.reuseFromNodeIds ?? [])].includes(link.nodeId) || keys.effective.get(link.nodeId) !== next.effective.get(nodeId)) continue
            const candidate = this.store.findTask(link.taskId)!
            if (["verified", "integrated"].includes(candidate.status) && candidate.outputArtifactRefs.every(r => this.store.findArtifactVersion(r.artifactId, r.version)?.status === "valid")) {
              action = "reuse"; priorTaskId = candidate.id; break outer
            }
          }
        }
      }
      decisions.push({ nodeId, action, priorTaskId, reason: action === "reuse" ? "Effective specification and valid outputs are unchanged" :
        action === "revalidate" ? "Implementation specification is unchanged; dependency inputs require validation" : "Effective requirements, environment or task membership changed" })
    }
    for (const [nodeId, link] of links) if (!next.nodes.has(nodeId)) decisions.push({ nodeId, action: "exclude", priorTaskId: link.taskId, reason: "Not part of the target revision" })
    return { planId, fromVersion, toVersion,
      addedNodeIds: decisions.filter(d => d.action === "create").map(d => d.nodeId),
      changedNodeIds: decisions.filter(d => ["replace", "revalidate"].includes(d.action)).map(d => d.nodeId),
      removedNodeIds: decisions.filter(d => d.action === "exclude").map(d => d.nodeId),
      reusedNodeIds: decisions.filter(d => d.action === "reuse").map(d => d.nodeId), reopenedNodeIds: [], decisions,
      recommendations: ["Reuse valid stage results; stop only affected attempts; validate changed inputs before adoption."] }
  }
  transitions(planId?: string): PlanTransition[] {
    const rows = planId ? this.store.db.prepare("SELECT payload FROM plan_transitions WHERE plan_id=? ORDER BY rowid").all(planId) : this.store.db.prepare("SELECT payload FROM plan_transitions ORDER BY rowid").all()
    return rows.map(row => JSON.parse(String(row.payload)))
  }
  save(t: PlanTransition) {
    t.updatedAt = new Date().toISOString()
    this.store.db.prepare("INSERT INTO plan_transitions VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(t.id, t.planId, JSON.stringify(t))
  }
  begin(planId: string, version: number): PlanTransition {
    const existing = this.transitions(planId).find(t => t.toVersion === version && t.state !== "superseded")
    if (existing) return existing
    const impact = this.analyze(planId, version)
    const previousStops = this.transitions(planId).filter(t => t.state === "waiting").flatMap(t => t.stops)
    const stops = new Map(previousStops.map(s => [s.taskId, s]))
    const keep = new Set(impact.decisions!.filter(d => d.action === "reuse").map(d => d.priorTaskId))
    for (const link of this.store.planLinks(planId, impact.fromVersion)) {
      for (const taskId of this.engine.subtreeIds(link.taskId)) {
        const task = this.engine.requireTask(taskId)
        const attempt = this.store.currentAttempt(taskId)
        const reservation = this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get() &&
          this.store.db.prepare("SELECT 1 FROM task_reservations WHERE task_id=?").get(taskId)
        const pendingInputStop = this.engine.signals.stops().some(s => s.taskId === taskId && s.token === attempt?.token && s.state === "requested")
        if (keep.has(taskId) && !pendingInputStop && !(reservation && ["failed", "blocked", "stale"].includes(task.status))) continue
        this.store.setTaskVisibility(taskId, planId, true, true)
        if (pendingInputStop || attempt?.state === "running" || task.status === "running" && !task.childIds.length || reservation) {
          const token = attempt?.token ?? randomUUID()
          if (attempt) this.store.saveAttempt({ ...attempt, state: "fenced" })
          if (!stops.has(taskId)) stops.set(taskId, { taskId, token, state: "requested" })
        }
      }
    }
    for (const old of this.transitions(planId).filter(t => t.state === "waiting")) this.save({ ...old, state: "superseded" })
    const t: PlanTransition = { id: randomUUID(), planId, fromVersion: impact.fromVersion, toVersion: version,
      state: "waiting", stops: [...stops.values()], createdAt: new Date().toISOString(), updatedAt: "" }
    this.save(t); return t
  }
  confirmStopped(transitionId: string, taskId: string, token: string, evidence: string) {
    return this.engine.atomic(() => {
      const t = this.transitions().find(t => t.id === transitionId)
      if (!t || t.state !== "waiting") throw new Error("Transition is not waiting")
      const stop = t.stops.find(s => s.taskId === taskId)
      if (!stop || stop.token !== token || !evidence.trim()) throw new Error("Stopped execution identity and evidence are required")
      stop.state = "stopped"; stop.evidence = evidence; this.save(t)
      if (this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get())
        this.store.db.prepare("DELETE FROM task_reservations WHERE task_id=?").run(taskId)
      return t
    })
  }
  activate(t: PlanTransition): { rootTaskId: string; createdTaskIds: string[] } | undefined {
    if (t.state === "applied") return { rootTaskId: this.store.findWorkPlan(t.planId)!.rootTaskId!, createdTaskIds: [] }
    if (t.state !== "waiting" || t.stops.some(s => s.state !== "stopped")) return
    const plan = this.store.findWorkPlan(t.planId)!
    if (plan.currentRevision !== t.toVersion || this.store.activePlanVersion(plan.id) !== t.fromVersion) return
    assertControlledPlanActivation(this.engine,plan.id,t.toVersion)
    const impact = this.analyze(plan.id, t.toVersion, t.fromVersion), context = this.context(plan.id, t.toVersion)
    const priorDescendants = new Set(this.store.planLinks(plan.id, t.fromVersion).flatMap(l => [...this.engine.subtreeIds(l.taskId)]))
    const repair = this.engine.feedback.list().find(i => i.planId === plan.id && i.repairRevision === t.toVersion)
    const createdTaskIds: string[] = []
    const root = plan.rootTaskId ? this.engine.requireTask(plan.rootTaskId) : this.engine.createTask({ title: plan.title, goal: context.goal })
    if (!plan.rootTaskId) createdTaskIds.push(root.id)
    if (t.fromVersion) {
      this.store.db.prepare("INSERT OR IGNORE INTO plan_revision_results VALUES(?,?,?)").run(plan.id, t.fromVersion,
        JSON.stringify({ root: this.engine.loadTask(root.id), tasks: this.store.planLinks(plan.id, t.fromVersion).map(l => this.engine.loadTask(l.taskId)) }))
    }
    // Stable root identity, revision-specific membership; historical tasks are never deleted/reopened.
    const semanticChange = impact.changedNodeIds.length || impact.removedNodeIds.length || impact.addedNodeIds.length
    this.store.updateTask({ ...root, goal: context.goal, status: "pending", outputArtifactRefs: semanticChange ? [] : root.outputArtifactRefs, updatedAt: new Date().toISOString() })
    const priorContext = this.context(plan.id, t.fromVersion)
    if (!t.fromVersion || fingerprint(priorContext.requirements) !== fingerprint(context.requirements) || fingerprint(priorContext.constraints) !== fingerprint(context.constraints)) {
      const prior = this.store.db.prepare("SELECT requirement_id FROM plan_context_requirements WHERE plan_id=?").all(plan.id)
      for (const r of prior) this.store.db.prepare("INSERT OR IGNORE INTO plan_retired_requirements VALUES(?)").run(String(r.requirement_id))
      for (const [kind, values] of [["requirement", context.requirements], ["constraint", context.constraints]] as const) for (const description of values) {
        const id = randomUUID()
        this.store.insertRequirement({ id, taskId: root.id, description, kind, version: t.toVersion, status: "open", createdAt: new Date().toISOString() })
        this.store.db.prepare("INSERT INTO plan_context_requirements VALUES(?,?)").run(plan.id, id)
      }
    }
    const keep = new Set(impact.decisions!.filter(d => d.action === "reuse").map(d => d.priorTaskId!))
    for (const link of this.store.planLinks(plan.id, t.fromVersion)) for (const id of this.engine.subtreeIds(link.taskId))
      if (!keep.has(id)) this.store.setTaskVisibility(id, plan.id, false, true)
    const nodes = this.store.planNodes(plan.id, t.toVersion), pending = [...nodes], mapped = new Map<string, string>()
    while (pending.length) {
      const index = pending.findIndex(n => !n.parentNodeId || mapped.has(n.parentNodeId))
      if (index < 0) throw new Error("Invalid plan parent order")
      const node = pending.splice(index, 1)[0]!, decision = impact.decisions!.find(d => d.nodeId === node.nodeId)!
      let task: Task
      if (decision.action === "reuse" && decision.priorTaskId) {
        task = this.engine.requireTask(decision.priorTaskId)
        this.store.setTaskVisibility(task.id, plan.id, true)
        // A completed stop from a superseded transition cannot revive the old process.
        if (t.stops.some(s => s.taskId === task.id)) {
          this.store.updateTask({ ...task, status: ["verified", "integrated"].includes(task.status) ? task.status : "ready" })
          task = this.engine.requireTask(task.id)
        }
        if (["failed", "blocked", "stale"].includes(task.status)) {
          this.store.updateTask({ ...task, status: "pending" }); task = this.engine.requireTask(task.id)
        }
        const parentId = node.parentNodeId ? mapped.get(node.parentNodeId)! : root.id
        if (task.parentId !== parentId) this.store.updateTask({ ...task, parentId })
      } else {
        const parentId = node.parentNodeId ? mapped.get(node.parentNodeId)! : root.id
        const parent = this.engine.requireTask(parentId)
        if (["verified", "integrated", "failed"].includes(parent.status)) this.store.updateTask({ ...parent, status: "pending" })
        task = this.engine.createTask({ ...node.taskSpec, title: node.label, goal: node.taskSpec.goal || node.outcome, parentId })
        createdTaskIds.push(task.id)
        this.store.setTaskVisibility(task.id, plan.id, true)
        const sourceIds = new Set([decision.priorTaskId, ...(node.reuseFromNodeIds ?? []).flatMap(id => this.store.planLinks(plan.id, t.fromVersion).filter(l => l.nodeId === id).map(l => l.taskId))].filter(Boolean) as string[])
        if (sourceIds.size) {
          this.store.db.prepare("INSERT INTO task_reuse_candidates VALUES(?,?)").run(task.id, JSON.stringify({
            action: decision.action, sources: [...sourceIds].map(id => ({ taskId: id, task: this.engine.requireTask(id), attempt: this.store.currentAttempt(id) })),
            instruction: "Reuse only outputs valid for the current requirements and exact inputs. Changed dependencies require validation. Do not repeat completed implementation merely to obtain new evidence.",
          }))
        }
      }
      mapped.set(node.nodeId, task.id)
      this.store.insertPlanLink({ planId: plan.id, revision: t.toVersion, nodeId: node.nodeId, taskId: task.id, action: decision.action as PlanTaskLink["action"] })
      if(this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='request_plan_admissions'").get()) {
        const binding=this.store.db.prepare("SELECT request_id FROM request_plan_admissions WHERE plan_id=?").get(plan.id)
        if(binding)this.store.db.prepare("INSERT OR IGNORE INTO controlled_tasks VALUES(?,?)").run(task.id,String(binding.request_id))
      }
    }
    // Runtime decomposition is also durable work: preserve its responsibilities and
    // workspace ancestry when replacing a planned group, not just the group label.
    const priorPlanned = new Set(this.store.planLinks(plan.id, t.fromVersion).map(l => l.taskId))
    const descendantMap = new Map<string, string>()
    for (const decision of impact.decisions!) if (decision.priorTaskId && decision.action !== "exclude")
      descendantMap.set(decision.priorTaskId, mapped.get(decision.nodeId)!)
    const cloned: Array<{ prior: Task; taskId: string }> = []
    const cloneChildren = (oldParent: string, newParent: string) => {
      // Historical visibility was already changed, so read saved task identities directly.
      const rows = this.store.db.prepare("SELECT id FROM tasks WHERE parent_id=?").all(oldParent)
      for (const row of rows) {
        const oldId = String(row.id)
        if (priorPlanned.has(oldId) || !priorDescendants.has(oldId)) continue
        const prior = this.engine.requireTask(oldId)
        const next = this.engine.createTask({ title: prior.title, goal: prior.goal, category: prior.category, parentId: newParent,
          acceptanceCriteria: prior.acceptanceCriteria, writeScopes: prior.writeScopes, assignedRole: prior.assignedRole,
          integrationPolicy: prior.integrationPolicy, contextPolicy: prior.contextPolicy,
          requirements: this.store.requirementsOf([oldId]).map(r => ({ description: r.description, kind: r.kind })) })
        this.store.setTaskVisibility(next.id, plan.id, true)
        descendantMap.set(oldId, next.id); cloned.push({ prior, taskId: next.id }); createdTaskIds.push(next.id)
        this.store.db.prepare("INSERT INTO task_reuse_candidates VALUES(?,?)").run(next.id, JSON.stringify({ action: "replace",
          sources: [{ taskId: oldId, task: prior, attempt: this.store.currentAttempt(oldId) }],
          instruction: "Continue the prior responsibility and workspace; repair the reported cause or validate the current dependency versions." }))
        cloneChildren(oldId, next.id)
      }
    }
    for (const decision of impact.decisions!) if (decision.priorTaskId && ["replace", "revalidate"].includes(decision.action))
      cloneChildren(decision.priorTaskId, mapped.get(decision.nodeId)!)
    for (const { prior, taskId } of cloned) for (const dep of prior.dependencies)
      this.store.addDependency(taskId, descendantMap.get(dep) ?? dep, new Date().toISOString())
    for (const node of nodes) {
      const id = mapped.get(node.nodeId)!
      this.store.db.prepare("DELETE FROM task_dependencies WHERE task_id=?").run(id)
      for (const dep of node.dependsOnNodeIds) this.store.addDependency(id, mapped.get(dep)!, new Date().toISOString())
    }
    // Group evidence depends on its current descendants, including removed members.
    const invalidGroups = new Set<string>()
    for (const decision of impact.decisions!.filter(d => d.action !== "reuse")) {
      const next = nodes.find(n => n.nodeId === decision.nodeId)
      let parent = next?.parentNodeId ? mapped.get(next.parentNodeId) : undefined
      while (parent && parent !== root.id) { invalidGroups.add(parent); parent = this.engine.requireTask(parent).parentId }
      parent = decision.priorTaskId ? this.engine.requireTask(decision.priorTaskId).parentId : undefined
      while (parent && parent !== root.id) { if (this.store.taskVisible(parent)) invalidGroups.add(parent); parent = this.engine.requireTask(parent).parentId }
    }
    for (const id of invalidGroups) {
      const group = this.engine.requireTask(id)
      this.store.updateTask({ ...group, status: "pending", outputArtifactRefs: [] })
      for (const set of this.store.integrationSetsByParent(id)) if (!repair) this.store.db.prepare("INSERT OR IGNORE INTO plan_retired_integrations VALUES(?)").run(set.id)
    }
    if (!repair && (impact.changedNodeIds.length || impact.removedNodeIds.length || impact.addedNodeIds.length)) {
      for (const set of this.store.integrationSetsByParent(root.id)) this.store.db.prepare("INSERT OR IGNORE INTO plan_retired_integrations VALUES(?)").run(set.id)
    }
    if (repair) for (const setId of repair.integrationSetIds ?? []) {
      const set = this.store.findIntegrationSet(setId)!
      const priorLink = this.store.planLinks(plan.id, t.fromVersion).find(l => l.taskId === set.parentTaskId)
      this.store.updateIntegrationSet({ ...set, parentTaskId: priorLink ? mapped.get(priorLink.nodeId) : set.parentTaskId,
        status: "stale", outputBundleRef: undefined, updatedAt: new Date().toISOString() })
      if (set.outputBundleRef) {
        this.store.markBundleStale(set.outputBundleRef.artifactId, set.outputBundleRef.version)
        this.store.markArtifactVersionStale(set.outputBundleRef.artifactId, set.outputBundleRef.version)
      }
    }
    this.store.db.prepare("INSERT INTO plan_active_revisions VALUES(?,?) ON CONFLICT(plan_id) DO UPDATE SET version=excluded.version").run(plan.id, t.toVersion)
    this.store.updateWorkPlan({ ...plan, rootTaskId: root.id, goal: context.goal, state: "active", updatedAt: new Date().toISOString() })
    for (const taskId of [...mapped.values(), ...cloned.map(c => c.taskId)]) this.engine.refreshReadiness(taskId)
    for (const taskId of [...mapped.values(), ...cloned.map(c => c.taskId)]) this.engine.refreshAncestors(taskId)
    this.save({ ...t, state: "applied" })
    return { rootTaskId: root.id, createdTaskIds }
  }

  reuseReadyTask(taskId: string): boolean {
    const task = this.engine.requireTask(taskId)
    if (task.status !== "ready" || !this.store.executionAllowed(taskId)) return false
    const row = this.store.db.prepare("SELECT payload FROM task_reuse_candidates WHERE task_id=?").get(taskId)
    if (!row) return false
    const candidate = JSON.parse(String(row.payload))
    if (candidate.action !== "revalidate" || candidate.sources.length !== 1) return false
    const source = candidate.sources[0]
    if (!["verified", "integrated"].includes(source.task.status) || !source.attempt) return false
    const sourceEnvironment = this.store.db.prepare("SELECT digest FROM task_environments WHERE task_id=?").get(source.task.id)?.digest
    const targetEnvironment = this.store.db.prepare("SELECT digest FROM task_environments WHERE task_id=?").get(taskId)?.digest
    if (sourceEnvironment !== targetEnvironment) return false
    const refs = this.engine.signals.capture(taskId).inputRefs
    const allRefs = [...refs, ...source.attempt.inputRefs]
    if (allRefs.some(ref => !this.engine.signals.signature(ref).reusable)) return false
    const signature = (values: Array<{ artifactId: string; version: number }>) => values.map(ref => this.engine.signals.signature(ref).value)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    if (fingerprint(signature(refs)) !== fingerprint(signature(source.attempt.inputRefs))) return false
    const outputs = source.task.outputArtifactRefs.map((r: any) => this.engine.requireArtifactVersion(r))
    // Staleness from identical inputs can be discharged without another model run,
    // but publish fresh lineage instead of making historical evidence current again.
    if (outputs.some((v: any) => v.type === "bundle" || v.inputs.some((r: any) =>
      !source.attempt.inputRefs.some((i: any) => i.artifactId === r.artifactId && i.version === r.version)))) return false
    for (const output of outputs) {
      const snapshot = this.engine.signals.code(output)
      if (output.type === "code" && !snapshot) return false
    }
    const started = this.engine.startTask(taskId, { agent: "verified-result-cache" })
    for (const output of outputs) {
      const snapshot = this.engine.signals.code(output)
      if (snapshot) this.engine.signals.attest(taskId, started.attemptToken!, snapshot)
      this.engine.publishArtifact({ taskId, attemptToken: started.attemptToken,
      name: this.store.findArtifact(output.artifactId)!.name, type: output.type, content: output.content, contentRef: output.contentRef,
      inputs: refs, contractVersionRefs: output.contractVersionRefs })
    }
    this.engine.completeTask({ taskId, attemptToken: started.attemptToken, summary: `Reused verified result from ${source.task.id}`,
      verification: { passed: true, evidence: `Previous verified attempt ${source.attempt.id}; identical effective specification and input content`, criteriaSatisfied: started.acceptanceCriteria.map(c => c.id) } })
    return true
  }
}
