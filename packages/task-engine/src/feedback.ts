import { fingerprint } from "./revisions.ts"
import { randomUUID } from "node:crypto"
import type { ArtifactVersionRef, PlanNode } from "#task-domain"
import type { TaskGraphEngine } from "./index.ts"

export interface IssueReport {
  reporterTaskId: string
  summary: string
  evidence: string
  observedRefs: ArtifactVersionRef[]
}
export interface IssueRoute {
  issueId: string
  causeTaskId: string
  causeRefs: ArtifactVersionRef[]
  evidence: string
}
export interface TaskIssue extends IssueReport {
  id: string
  rootTaskId: string
  state: "reported" | "repairing" | "resolved"
  createdAt: string
  cause?: Omit<IssueRoute, "issueId">
  planId?: string
  repairRevision?: number
  ownerNodeId?: string
  affectedNodeIds?: string[]
  integrationSetIds?: string[]
  transitionId?: string
  resolution?: { evidence: string; taskIds: string[]; replacementRefs: ArtifactVersionRef[]; resolvedAt: string }
}
const key = (r: ArtifactVersionRef) => `${r.artifactId}@${r.version}`
const text = (value: string, name: string) => { if (!value?.trim()) throw new Error(`${name} is required`) }

/** Durable causal feedback. A finding is not a fix, and a fix is not downstream validation. */
export class FeedbackCoordinator {
  readonly engine: TaskGraphEngine
  constructor(engine: TaskGraphEngine) { this.engine = engine }
  get store() { return this.engine.store }
  list(rootTaskId?: string): TaskIssue[] {
    return this.store.db.prepare("SELECT payload FROM task_issues ORDER BY rowid").all()
      .map(row => JSON.parse(String(row.payload)) as TaskIssue).filter(i => !rootTaskId || i.rootTaskId === rootTaskId)
  }
  get(id: string) {
    const issue = this.list().find(i => i.id === id)
    if (!issue) throw new Error("Issue not found")
    return issue
  }
  private save(issue: TaskIssue) {
    this.store.db.prepare("INSERT INTO task_issues VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload").run(issue.id, JSON.stringify(issue))
    return issue
  }
  report(input: IssueReport) {
    return this.engine.atomic(() => {
      text(input.summary, "summary"); text(input.evidence, "evidence")
      const root = this.engine.rootOf(input.reporterTaskId)
      for (const ref of input.observedRefs) this.engine.requireArtifactVersion(ref)
      const duplicate = this.list(root.id).find(i => i.state !== "resolved" && i.reporterTaskId === input.reporterTaskId &&
        i.summary === input.summary && JSON.stringify(i.observedRefs) === JSON.stringify(input.observedRefs))
      if (duplicate) return duplicate
      const issue = this.save({ ...input, id: randomUUID(), rootTaskId: root.id, state: "reported", createdAt: new Date().toISOString() })
      // A completed root becomes incomplete immediately, including findings after archival.
      if (root.childIds.length) this.engine.refreshAncestors(input.reporterTaskId)
      return issue
    })
  }
  route(input: IssueRoute) {
    return this.engine.atomic(() => {
      const issue = this.get(input.issueId)
      text(input.evidence, "causal evidence")
      if (issue.state !== "reported") {
        if (issue.cause?.causeTaskId === input.causeTaskId && JSON.stringify(issue.cause.causeRefs) === JSON.stringify(input.causeRefs)) return issue
        throw new Error("Issue is already routed; report a new finding for a different cause")
      }
      const owner = this.engine.requireTask(input.causeTaskId)
      if (this.engine.rootOf(owner.id).id !== issue.rootTaskId) throw new Error("Cause must belong to the finding's task graph")
      if (!this.store.executionAllowed(owner.id)) throw new Error("Cause belongs to a historical execution; diagnose against the current owner version")
      // The model diagnoses; the engine validates the claimed producer and causal lineage.
      const ancestors = new Set<string>(), queue = [...issue.observedRefs]
      while (queue.length) {
        const ref = queue.shift()!
        if (ancestors.has(key(ref))) continue
        ancestors.add(key(ref)); queue.push(...this.engine.requireArtifactVersion(ref).inputs)
      }
      if (!input.causeRefs.length && owner.outputArtifactRefs.length) throw new Error("Published causes require exact artifact versions")
      for (const ref of input.causeRefs) {
        const artifact = this.engine.requireArtifactVersion(ref)
        if (!(artifact.producerTaskId === owner.id || owner.outputArtifactRefs.some(r => key(r) === key(ref))) || !ancestors.has(key(ref))) throw new Error("Cause must be the producer of an observed artifact or its recorded input lineage")
        if (!owner.outputArtifactRefs.some(r => key(r) === key(ref))) throw new Error("Cause version is no longer the owner's current output")
      }
      if (!input.causeRefs.length) {
        const seen = new Set<string>(), pending = [issue.reporterTaskId]
        while (pending.length) { const id = pending.pop()!; if (seen.has(id)) continue; seen.add(id); pending.push(...this.engine.requireTask(id).dependencies) }
        if (!seen.has(owner.id)) throw new Error("An unpublished cause must be the reporting task or its dependency")
      }
      const plan = this.ensurePlan(issue.rootTaskId)
      issue.rootTaskId = plan.rootTaskId!
      const version = this.store.activePlanVersion(plan.id)
      if (plan.currentRevision !== version) throw new Error("Finish or reconcile the pending plan revision before routing this finding")
      const links = this.store.planLinks(plan.id, version)
      const nodeFor = (id: string): string => {
        let task = this.engine.requireTask(id)
        while (true) {
          const link = links.find(l => l.taskId === task.id)
          if (link) return link.nodeId
          if (!task.parentId) throw new Error("Task has no executable plan node")
          task = this.engine.requireTask(task.parentId)
        }
      }
      const ownerNodeId = nodeFor(owner.id)
      const reporterNodeId = issue.reporterTaskId === plan.rootTaskId ? undefined : nodeFor(issue.reporterTaskId)
      const affected = new Set([ownerNodeId, ...(reporterNodeId ? [reporterNodeId] : [])])
      const nodes = this.store.planNodes(plan.id, version)
      // Include recorded lineage and consumed inputs even when a manager omitted a dependency edge.
      const causalTasks = new Set([owner.id]), refs = [...input.causeRefs], visited = new Set<string>()
      while (refs.length) {
        const ref = refs.shift()!
        if (visited.has(key(ref))) continue
        visited.add(key(ref))
        for (const dep of this.store.lineageDependents(ref.artifactId, ref.version)) {
          causalTasks.add(this.engine.requireArtifactVersion(dep).producerTaskId); refs.push(dep)
        }
      }
      for (const link of links) {
        const ids = this.engine.subtreeIds(link.taskId)
        if ([...ids].some(id => causalTasks.has(id) || this.store.currentAttempt(id)?.inputRefs.some(r => visited.has(key(r))))) affected.add(link.nodeId)
      }
      let changed = true
      while (changed) {
        changed = false
        for (const n of nodes) if (!affected.has(n.nodeId) && (n.dependsOnNodeIds.some(d => affected.has(d)) || n.parentNodeId && affected.has(n.parentNodeId))) {
          affected.add(n.nodeId); changed = true
        }
      }
      const integrationSetIds = this.store.integrationSets().filter(s => s.memberRefs.some(r => visited.has(key(r)) || [...affected].some(n => this.engine.subtreeIds(links.find(l => l.nodeId === n)!.taskId).has(this.engine.requireArtifactVersion(r).producerTaskId))) ||
        s.parentTaskId && [...affected].some(n => this.engine.subtreeIds(links.find(l => l.nodeId === n)!.taskId).has(s.parentTaskId!))).map(s => s.id)
      // Internal repair revisions preserve the approved objective and all responsibilities.
      const revised = nodes.map(n => ({ ...n, taskSpec: [ownerNodeId, reporterNodeId].includes(n.nodeId) ? {
        ...n.taskSpec, repairIssueIds: [...new Set([...(n.taskSpec.repairIssueIds ?? []), issue.id])],
      } : n.taskSpec, dependsOnNodeIds: n.nodeId !== ownerNodeId && affected.has(n.nodeId) && !this.isAncestorNode(nodes, n.nodeId, ownerNodeId)
        ? [...new Set([...n.dependsOnNodeIds, ownerNodeId])] : n.dependsOnNodeIds }))
      const revision = this.engine.reviseWorkPlan({ planId: plan.id, baseVersion: version, nodes: revised, summary: `Repair: ${issue.summary}` }).revision
      Object.assign(issue, { state: "repairing", cause: { causeTaskId: owner.id, causeRefs: input.causeRefs, evidence: input.evidence },
        planId: plan.id, repairRevision: revision.version, ownerNodeId, affectedNodeIds: [...affected], integrationSetIds })
      this.save(issue)
      const approval = this.engine.approveWorkPlan({ planId: plan.id, version: revision.version, approvalSource: `Existing objective repair: ${issue.id}` })
      issue.transitionId = approval.transition!.id
      return this.save(issue)
    })
  }
  private isAncestorNode(nodes: PlanNode[], ancestor: string, child: string): boolean {
    let node = nodes.find(n => n.nodeId === child)
    while (node?.parentNodeId) { if (node.parentNodeId === ancestor) return true; node = nodes.find(n => n.nodeId === node!.parentNodeId) }
    return false
  }
  /** Adopt an existing non-plan graph without rerunning or discarding any execution. */
  private ensurePlan(rootId: string) {
    const existing = this.store.findWorkPlanByRootTask(rootId)
    if (existing) return existing
    let root = this.engine.requireTask(rootId)
    if (!root.childIds.length) {
      const wrapper = this.engine.createTask({ title: root.title, goal: root.goal })
      this.store.updateTask({ ...root, parentId: wrapper.id })
      for (const issue of this.list(rootId)) this.save({ ...issue, rootTaskId: wrapper.id })
      root = this.engine.requireTask(wrapper.id)
    }
    const tasks = [...this.engine.subtreeIds(root.id)].filter(id => id !== root.id).map(id => this.engine.requireTask(id))
    const nodes: PlanNode[] = tasks.map(t => ({ nodeId: t.id, parentNodeId: t.parentId === root.id ? undefined : t.parentId,
      label: t.title, stage: "implementation", outcome: t.goal, dependsOnNodeIds: t.dependencies,
      taskSpec: { goal: t.goal, category: t.category, acceptanceCriteria: t.acceptanceCriteria, writeScopes: t.writeScopes,
        assignedRole: t.assignedRole, integrationPolicy: t.integrationPolicy } }))
    const draft = this.engine.createDraftPlan({ title: root.title, goal: root.goal, requestText: root.goal, summary: "Adopt existing execution graph for durable repair", nodes })
    const plan = this.store.findWorkPlan(draft.planId)!
    this.store.updateWorkPlan({ ...plan, rootTaskId: root.id, state: "active" })
    this.store.updatePlanRevision({ ...this.store.findPlanRevision(plan.id, 1)!, state: "approved", approval: { approvedAt: new Date().toISOString(), approvalSource: "Existing task graph adoption" } })
    this.store.db.prepare("INSERT INTO plan_active_revisions VALUES(?,1)").run(plan.id)
    for (const t of tasks) {
      this.store.insertPlanLink({ planId: plan.id, revision: 1, nodeId: t.id, taskId: t.id, action: "reuse" })
      this.store.setTaskVisibility(t.id, plan.id, true)
    }
    return this.store.findWorkPlan(plan.id)!
  }
  context(taskId: string) {
    const rootId = this.engine.rootOf(taskId).id
    const plan = this.store.findWorkPlanByRootTask(rootId)
    if (!plan) return []
    const links = this.store.planLinks(plan.id, this.store.activePlanVersion(plan.id))
    const nodeIds = links.filter(l => this.engine.subtreeIds(l.taskId).has(taskId)).map(l => l.nodeId)
    return this.list(rootId).filter(i => i.state !== "resolved" && i.affectedNodeIds?.some(n => nodeIds.includes(n)))
  }
  resolve(issueId: string, evidence: string) {
    return this.engine.atomic(() => {
      const issue = this.get(issueId); text(evidence, "resolution evidence")
      if (issue.state === "resolved") return issue
      if (issue.state !== "repairing") throw new Error("Diagnose and route the issue before resolution")
      const plan = this.store.findWorkPlan(issue.planId!)!
      if (plan.currentRevision !== this.store.activePlanVersion(plan.id)) throw new Error("Plan transition is still pending")
      const links = this.store.planLinks(plan.id, plan.currentRevision)
      const taskIds: string[] = []
      for (const nodeId of issue.affectedNodeIds!) {
        const link = links.find(l => l.nodeId === nodeId)
        if (!link) throw new Error("Affected responsibility was removed; issue requires a new diagnosis")
        const task = this.engine.requireTask(link.taskId)
        if (!this.engine.evaluateCompletion(task.id).complete) throw new Error(`Repair or downstream validation incomplete: ${nodeId}`)
        const original = this.store.planLinks(plan.id, issue.repairRevision! - 1).find(l => l.nodeId === nodeId)
        if (original?.taskId === task.id) throw new Error("Historical execution cannot validate a repair")
        taskIds.push(task.id)
      }
      const ownerId = links.find(l => l.nodeId === issue.ownerNodeId)!.taskId
      const ownerIds = this.engine.subtreeIds(ownerId)
      const replacements = issue.cause!.causeRefs.map(ref => {
        const head = this.store.findArtifact(ref.artifactId)!
        const latest = this.engine.requireArtifactVersion({ artifactId: ref.artifactId, version: head.latestVersion })
        if (latest.version <= ref.version || latest.status !== "valid" || !ownerIds.has(latest.producerTaskId)) throw new Error("Cause must be repaired by its owning task as a new artifact version")
        return { artifactId: latest.artifactId, version: latest.version }
      })
      for (const id of taskIds) for (const leafId of this.engine.subtreeIds(id)) {
        const task = this.engine.requireTask(leafId)
        if (task.childIds.length) continue
        const attempt = this.store.currentAttempt(leafId)
        if (!attempt || attempt.state !== "completed") throw new Error("Fresh verified execution evidence is required")
        const consumed = new Set<string>(), inputs = [...attempt.inputRefs]
        while (inputs.length) {
          const ref = inputs.pop()!
          if (consumed.has(key(ref))) continue
          consumed.add(key(ref))
          const artifact = this.engine.requireArtifactVersion(ref)
          if (artifact.type === "bundle") inputs.push(...artifact.inputs)
        }
        for (const dep of task.dependencies) for (const ref of this.engine.requireTask(dep).outputArtifactRefs)
          if (!consumed.has(key(ref)) && ![...consumed].some(k => {
            const at = k.lastIndexOf("@"), old = { artifactId: k.slice(0, at), version: Number(k.slice(at + 1)) }
            const a = this.engine.signals.signature(old), b = this.engine.signals.signature(ref)
            return a.reusable && b.reusable && fingerprint(a.value) === fingerprint(b.value)
          })) throw new Error("Downstream validation used different input code")
      }
      for (const id of issue.integrationSetIds ?? []) {
        const set = this.store.findIntegrationSet(id)!
        const bundle = set.outputBundleRef && this.store.findBundle(set.outputBundleRef.artifactId, set.outputBundleRef.version)
        if (set.status !== "passed" || !bundle || bundle.status !== "valid" || bundle.memberRefs.some(r => this.store.findArtifact(r.artifactId)?.latestVersion !== r.version))
          throw new Error("Affected integration must pass with the repaired versions")
      }
      this.save({ ...issue, state: "resolved", resolution: { evidence, taskIds, replacementRefs: replacements, resolvedAt: new Date().toISOString() } })
      this.engine.refreshAncestors(ownerId)
      return this.get(issueId)
    })
  }
}
