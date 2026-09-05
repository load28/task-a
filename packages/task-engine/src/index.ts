import { randomUUID } from "node:crypto"
import type {
  ArtifactType,
  ArtifactVersion,
  ArtifactVersionRef,
  ContextPolicy,
  ContractItem,
  ContractVersionRef,
  Criterion,
  EventType,
  IntegrationPolicy,
  Learning,
  LearningKind,
  Requirement,
  RequirementKind,
  Task,
  TaskCategory,
  TaskContract,
  TaskGraphEvent,
  TaskStatus,
  TaskSummary,
} from "#task-domain"
import { DEFAULT_CONTEXT_POLICY, isAtomic } from "#task-domain"
import type { TaskGraphStore } from "#task-store"

export interface CreateTaskInput {
  title: string
  goal: string
  category?: TaskCategory
  parentId?: string
  dependencies?: string[]
  acceptanceCriteria?: Array<string | Criterion>
  requirements?: Array<{ description: string; kind?: RequirementKind }>
  contextPolicy?: Partial<ContextPolicy>
  integrationPolicy?: IntegrationPolicy
  assignedRole?: string
}

export interface DecompositionChildProposal {
  key?: string
  title: string
  goal: string
  category?: TaskCategory
  dependencies?: string[]
  acceptanceCriteria?: Array<string | Criterion>
  requirements?: Array<{ description: string; kind?: RequirementKind }>
  contextPolicy?: Partial<ContextPolicy>
  integrationPolicy?: IntegrationPolicy
  assignedRole?: string
}

export interface DecompositionProposal {
  taskId: string
  children: DecompositionChildProposal[]
}

export interface PublishArtifactInput {
  taskId: string
  name: string
  type: ArtifactType
  contentRef?: string
  content?: string
  inputs?: ArtifactVersionRef[]
  contractVersionRefs?: ContractVersionRef[]
  compatibility?: "compatible" | "breaking"
}

export interface CompleteTaskInput {
  taskId: string
  summary: string
  artifacts?: Array<Omit<PublishArtifactInput, "taskId">>
  verification?: {
    passed: boolean
    evidence?: string
    criteriaSatisfied?: string[]
  }
  learnings?: Array<Omit<RecordLearningInput, "sourceTaskId" | "sourceRunId">>
}

export interface RecordLearningInput {
  sourceTaskId?: string
  sourceRunId?: string
  kind?: LearningKind
  description: string
  tags?: string[]
  importance?: number
}

export interface SupersedeLearningInput {
  learningId: string
  by?: string
  reason: string
  invalidFrom?: string
}

export interface TaskGraphEngineOptions {
  reflectionThreshold?: number
}

export interface DefineContractInput {
  contractId?: string
  providerTaskId: string
  consumerTaskId: string
  provides: ContractItem[]
  expects?: ContractItem[]
  invariants?: string[]
  compatibilityChecks?: string[]
}

export interface RunnableTask {
  task: Task
  rootId: string
  path: string[]
}

export interface CompletionEvaluation {
  complete: boolean
  missing: string[]
}

export interface ImpactReport {
  artifactId: string
  fromVersion: number
  compatibility: "compatible" | "breaking"
  staleArtifactVersions: ArtifactVersionRef[]
  staleBundles: ArtifactVersionRef[]
  staleIntegrationSetIds: string[]
  affectedTaskIds: string[]
  reopenRecommendedTaskIds: string[]
}

export interface TaskLoadResult {
  task: Task
  children: Task[]
  dependencies: Task[]
  requirements: Requirement[]
  outputVersions: ArtifactVersion[]
  completion: CompletionEvaluation
  summary: TaskSummary
  recentEvents: TaskGraphEvent[]
}

const TERMINAL_FOR_DEPENDENCY: TaskStatus[] = ["verified", "integrated"]

const MANUAL_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ["ready", "blocked", "failed"],
  ready: ["running", "pending", "blocked", "failed"],
  running: ["implemented", "failed", "blocked"],
  implemented: ["verified", "failed", "stale", "pending"],
  verified: ["integrating", "integrated", "stale", "pending"],
  integrating: ["integrated", "verified", "stale"],
  integrated: ["stale", "pending", "verified"],
  blocked: ["pending", "ready", "failed"],
  failed: ["pending"],
  stale: ["pending"],
}

export class TaskGraphEngine {
  readonly store: TaskGraphStore
  private reflectionThreshold: number

  constructor(store: TaskGraphStore, options: TaskGraphEngineOptions = {}) {
    this.store = store
    this.reflectionThreshold = Math.max(2, options.reflectionThreshold ?? 5)
  }

  atomic<T>(operation: () => T): T {
    return this.store.transaction(operation)
  }

  createTask(input: CreateTaskInput): Task {
    return this.atomic(() => {
      requireText(input.title, "title")
      requireText(input.goal, "goal")
      if (input.parentId) this.requireDecomposableParent(input.parentId)
      const dependencies = input.dependencies ?? []
      for (const dependency of dependencies) this.requireTask(dependency)
      const now = new Date().toISOString()
      const task = this.buildTask(input, input.parentId, now)
      this.store.insertTask(task)
      for (const dependency of dependencies) {
        if (input.parentId && this.isAncestorOf(dependency, task.id, input.parentId)) throw new Error("A task must not depend on its own ancestor")
        this.store.addDependency(task.id, dependency, now)
      }
      this.assertNoDependencyCycle()
      this.emit("TASK_CREATED", task.id, undefined, { title: task.title, parentId: task.parentId })
      this.addRequirements(task.id, input.requirements ?? [])
      this.refreshReadiness(task.id)
      if (task.parentId) this.refreshAncestors(task.parentId)
      return this.requireTask(task.id)
    })
  }

  proposeDecomposition(proposal: DecompositionProposal): { parent: Task; children: Task[] } {
    return this.atomic(() => {
      const parent = this.requireDecomposableParent(proposal.taskId)
      if (!Array.isArray(proposal.children) || proposal.children.length === 0) throw new Error("Decomposition proposal requires at least one child")
      const now = new Date().toISOString()
      const existingTitles = new Set(this.store.childTasks(parent.id).map((child) => normalizeTitle(child.title)))
      const keyed = new Map<string, string>()
      const created: Task[] = []
      for (const child of proposal.children) {
        requireText(child.title, "child title")
        requireText(child.goal, "child goal")
        const normalized = normalizeTitle(child.title)
        if (existingTitles.has(normalized)) throw new Error(`Duplicate responsibility in decomposition: ${child.title}`)
        existingTitles.add(normalized)
        const task = this.buildTask(child, parent.id, now)
        this.store.insertTask(task)
        created.push(task)
        if (child.key) {
          if (keyed.has(child.key)) throw new Error(`Duplicate child key: ${child.key}`)
          keyed.set(child.key, task.id)
        }
        keyed.set(task.title, task.id)
      }
      proposal.children.forEach((child, index) => {
        const task = created[index]!
        for (const dependency of child.dependencies ?? []) {
          const resolved = keyed.get(dependency) ?? (this.store.findTask(dependency) ? dependency : undefined)
          if (!resolved) throw new Error(`Invalid dependency reference: ${dependency}`)
          if (resolved === task.id) throw new Error("A task cannot depend on itself")
          if (this.isAncestorOf(resolved, task.id, parent.id)) throw new Error("A task must not depend on its own ancestor")
          this.store.addDependency(task.id, resolved, now)
        }
      })
      this.assertNoDependencyCycle()
      proposal.children.forEach((child, index) => {
        const task = created[index]!
        this.emit("TASK_CREATED", task.id, undefined, { title: task.title, parentId: parent.id })
        this.addRequirements(task.id, child.requirements ?? [])
      })
      this.emit("TASK_DECOMPOSED", parent.id, { childIds: created.map((task) => task.id) })
      for (const task of created) this.refreshReadiness(task.id)
      this.refreshAncestors(parent.id)
      return { parent: this.requireTask(parent.id), children: created.map((task) => this.requireTask(task.id)) }
    })
  }

  searchTasks(query: string, limit = 10): Task[] {
    return this.store.searchTasks(query.trim(), Math.max(1, Math.min(limit, 50)))
  }

  loadTask(taskId: string): TaskLoadResult {
    return this.atomic(() => {
      const task = this.requireTask(taskId)
      return {
        task,
        children: this.store.childTasks(taskId),
        dependencies: task.dependencies.map((id) => this.requireTask(id)),
        requirements: this.store.requirementsOf([taskId]),
        outputVersions: task.outputArtifactRefs.map((ref) => this.requireArtifactVersion(ref)),
        completion: this.evaluateCompletion(taskId),
        summary: this.summarize(taskId),
        recentEvents: this.store.eventsFor(taskId, 20),
      }
    })
  }

  resolveRunnable(rootId?: string): RunnableTask[] {
    return this.atomic(() => {
      const scope = rootId ? this.subtreeIds(this.requireTask(rootId).id) : undefined
      const candidates: Task[] = []
      for (const task of this.allTasks()) {
        if (scope && !scope.has(task.id)) continue
        if (!isAtomic(task)) continue
        this.refreshReadiness(task.id)
        const refreshed = this.requireTask(task.id)
        if (refreshed.status === "ready") candidates.push(refreshed)
      }
      const ordered = topologicalOrder(candidates)
      return ordered.map((task) => ({ task, rootId: this.rootOf(task.id).id, path: this.pathOf(task.id) }))
    })
  }

  startTask(taskId: string, worker?: { agent?: string; sessionId?: string; role?: string }): Task {
    return this.atomic(() => {
      let task = this.requireTask(taskId)
      if (!isAtomic(task)) throw new Error("Only atomic tasks can be started; decompose or pick a runnable leaf")
      this.refreshReadiness(taskId)
      task = this.requireTask(taskId)
      if (task.status !== "ready") {
        const blocking = task.dependencies.filter((id) => !TERMINAL_FOR_DEPENDENCY.includes(this.requireTask(id).status))
        throw new Error(blocking.length > 0
          ? `Task is not ready; waiting on dependencies: ${blocking.join(", ")}`
          : `Task is not ready (status: ${task.status})`)
      }
      if (worker?.role && !this.store.findRole(worker.role)) throw new Error(`Unknown role: ${worker.role}`)
      this.setStatus(task, "running", undefined, worker ? { worker } : undefined)
      return this.requireTask(taskId)
    })
  }

  completeTask(input: CompleteTaskInput): Task {
    return this.atomic(() => {
      requireText(input.summary, "summary")
      let task = this.requireTask(input.taskId)
      if (!isAtomic(task)) throw new Error("Composite tasks complete through their children and integrations")
      if (!["running", "implemented"].includes(task.status)) throw new Error(`Task cannot accept results in status ${task.status}`)
      for (const artifact of input.artifacts ?? []) {
        this.publishArtifact({ ...artifact, taskId: task.id })
      }
      for (const learning of input.learnings ?? []) {
        this.recordLearning({ ...learning, sourceTaskId: task.id })
      }
      task = this.requireTask(input.taskId)
      if (task.status === "running") this.setStatus(task, "implemented", undefined, { summary: input.summary })
      task = this.requireTask(input.taskId)
      const verification = input.verification
      if (verification?.passed) {
        const satisfied = new Set(verification.criteriaSatisfied ?? [])
        const unmet = task.acceptanceCriteria.filter((criterion) => !satisfied.has(criterion.id))
        if (unmet.length > 0) throw new Error(`Acceptance criteria not reported as satisfied: ${unmet.map((criterion) => criterion.id).join(", ")}`)
        this.setStatus(task, "verified", undefined, { evidence: verification.evidence })
        task = this.requireTask(input.taskId)
        this.afterTaskSettled(task.id)
      } else if (verification) {
        this.annotate(task, verification.evidence ? `Local verification failed: ${verification.evidence}` : "Local verification failed")
      }
      return this.requireTask(input.taskId)
    })
  }

  failTask(taskId: string, reason: string): Task {
    return this.atomic(() => {
      requireText(reason, "reason")
      const task = this.requireTask(taskId)
      if (!MANUAL_TRANSITIONS[task.status].includes("failed")) throw new Error(`Task cannot fail from status ${task.status}`)
      this.setStatus(task, "failed", reason)
      this.blockDependents(taskId, `Dependency failed: ${task.title}`)
      if (task.parentId) this.refreshAncestors(task.parentId)
      return this.requireTask(taskId)
    })
  }

  reopenTask(taskId: string, reason: string): Task {
    return this.atomic(() => {
      requireText(reason, "reason")
      const task = this.requireTask(taskId)
      if (!["implemented", "verified", "integrating", "integrated", "blocked", "failed", "stale"].includes(task.status)) {
        throw new Error(`Task cannot be reopened from status ${task.status}`)
      }
      this.setStatus(task, "pending", reason, undefined, "TASK_REOPENED")
      this.refreshReadiness(taskId)
      this.unblockDependents(taskId)
      if (task.parentId) this.refreshAncestors(task.parentId)
      return this.requireTask(taskId)
    })
  }

  publishArtifact(input: PublishArtifactInput): ArtifactVersion {
    return this.atomic(() => {
      const task = this.requireTask(input.taskId)
      requireText(input.name, "artifact name")
      if (!isArtifactType(input.type)) throw new Error(`Invalid artifact type: ${input.type}`)
      if (input.type === "bundle") throw new Error("Bundle artifacts are promoted by the integration engine, not published directly")
      if (!["running", "implemented"].includes(task.status)) throw new Error(`Task in status ${task.status} cannot publish artifacts; start or reopen it first`)
      const contentRef = input.contentRef?.trim() || (input.content !== undefined ? `inline:${randomUUID()}` : undefined)
      if (!contentRef) throw new Error("Artifact requires contentRef or inline content")
      const inputs = input.inputs ?? []
      for (const ref of inputs) this.requireArtifactVersion(ref)
      for (const ref of input.contractVersionRefs ?? []) {
        if (!this.store.findContract(ref.contractId, ref.version)) throw new Error(`Unknown contract version: ${ref.contractId}@${ref.version}`)
      }
      const now = new Date().toISOString()
      const head = this.store.findArtifactByName(input.name.trim())
      let artifactId: string
      let version: number
      if (head) {
        if (head.type !== input.type) throw new Error(`Artifact ${head.name} already exists with type ${head.type}`)
        artifactId = head.id
        version = head.latestVersion + 1
      } else {
        artifactId = randomUUID()
        version = 1
        this.store.insertArtifact({ id: artifactId, name: input.name.trim(), type: input.type, latestVersion: 1, createdAt: now })
      }
      const artifactVersion: ArtifactVersion = {
        artifactId,
        version,
        type: input.type,
        producerTaskId: task.id,
        inputs,
        contractVersionRefs: input.contractVersionRefs ?? [],
        contentRef,
        content: input.content,
        status: "valid",
        createdAt: now,
      }
      this.store.insertArtifactVersion(artifactVersion)
      if (head) this.store.updateArtifactLatest(artifactId, version)
      const refs = { artifactId, version, name: input.name.trim() }
      this.emit(head ? "ARTIFACT_VERSIONED" : "ARTIFACT_CREATED", task.id, refs)
      const outputs = task.outputArtifactRefs.filter((ref) => ref.artifactId !== artifactId)
      outputs.push({ artifactId, version })
      this.store.updateTask({ ...this.requireTask(task.id), outputArtifactRefs: outputs, updatedAt: now })
      if (head) this.propagateStale(artifactId, version, input.compatibility ?? "compatible")
      if (input.type === "architecture" && head) this.emit("ARCHITECTURE_REVISED", task.id, refs)
      return artifactVersion
    })
  }

  defineContract(input: DefineContractInput): TaskContract {
    return this.atomic(() => {
      const provider = this.requireTask(input.providerTaskId)
      const consumer = this.requireTask(input.consumerTaskId)
      if (provider.id === consumer.id) throw new Error("A contract requires distinct provider and consumer tasks")
      if (!Array.isArray(input.provides) || input.provides.length === 0) throw new Error("Contract requires at least one provided item")
      const now = new Date().toISOString()
      const existing = input.contractId ? this.store.findContract(input.contractId) : undefined
      if (input.contractId && !existing) throw new Error(`Unknown contract: ${input.contractId}`)
      if (existing && (existing.providerTaskId !== provider.id || existing.consumerTaskId !== consumer.id)) {
        throw new Error("Contract provider and consumer cannot change across versions")
      }
      const contract: TaskContract = {
        id: existing?.id ?? randomUUID(),
        providerTaskId: provider.id,
        consumerTaskId: consumer.id,
        provides: input.provides,
        expects: input.expects ?? [],
        invariants: input.invariants ?? [],
        compatibilityChecks: input.compatibilityChecks ?? [],
        version: (existing?.version ?? 0) + 1,
        createdAt: now,
      }
      this.store.insertContract(contract)
      for (const task of [provider, consumer]) {
        const refs = task.contractRefs.filter((ref) => ref.contractId !== contract.id)
        refs.push({ contractId: contract.id, version: contract.version })
        this.store.updateTask({ ...this.requireTask(task.id), contractRefs: refs, updatedAt: now })
      }
      this.emit("CONTRACT_UPDATED", provider.id, { contractId: contract.id, version: contract.version, consumerTaskId: consumer.id })
      return contract
    })
  }

  addRequirement(taskId: string, description: string, kind: RequirementKind = "requirement"): Requirement {
    return this.atomic(() => {
      this.requireTask(taskId)
      requireText(description, "description")
      if (!["requirement", "constraint"].includes(kind)) throw new Error(`Invalid requirement kind: ${kind}`)
      const requirement: Requirement = {
        id: randomUUID(),
        taskId,
        description: description.trim(),
        kind,
        version: 1,
        status: "open",
        createdAt: new Date().toISOString(),
      }
      this.store.insertRequirement(requirement)
      this.emit("REQUIREMENT_ADDED", taskId, { requirementId: requirement.id }, { description: requirement.description, kind })
      return requirement
    })
  }

  satisfyRequirement(requirementId: string, evidence: Record<string, unknown>): Requirement {
    return this.atomic(() => {
      const requirement = this.store.findRequirement(requirementId)
      if (!requirement) throw new Error(`Requirement not found: ${requirementId}`)
      if (requirement.status === "satisfied") return requirement
      const updated: Requirement = { ...requirement, status: "satisfied" }
      this.store.updateRequirement(updated)
      this.emit("REQUIREMENT_SATISFIED", requirement.taskId, { requirementId }, evidence)
      return updated
    })
  }

  recordLearning(input: RecordLearningInput): Learning {
    return this.atomic(() => {
      requireText(input.description, "description")
      if (input.kind !== undefined && !isLearningKind(input.kind)) throw new Error(`Invalid learning kind: ${input.kind}`)
      if (input.importance !== undefined && (!Number.isInteger(input.importance) || input.importance < 1 || input.importance > 10)) {
        throw new Error("importance must be an integer between 1 and 10")
      }
      if (input.sourceTaskId) this.requireTask(input.sourceTaskId)
      const learning: Learning = {
        id: randomUUID(),
        sourceTaskId: input.sourceTaskId,
        sourceRunId: input.sourceRunId,
        kind: input.kind ?? "insight",
        description: input.description.trim(),
        tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))],
        importance: input.importance ?? 5,
        appliedCount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      }
      this.store.insertLearning(learning)
      this.emit("LEARNING_RECORDED", input.sourceTaskId, { learningId: learning.id, runId: input.sourceRunId }, { kind: learning.kind, description: learning.description })
      this.maybeCreateReflection(learning)
      return learning
    })
  }

  supersedeLearning(input: SupersedeLearningInput): Learning {
    return this.atomic(() => {
      requireText(input.reason, "reason")
      const learning = this.store.findLearning(input.learningId)
      if (!learning) throw new Error(`Learning not found: ${input.learningId}`)
      if (learning.status !== "active") throw new Error(`Learning is already ${learning.status}`)
      if (input.by !== undefined) {
        if (input.by === learning.id) throw new Error("A learning cannot supersede itself")
        const replacement = this.store.findLearning(input.by)
        if (!replacement) throw new Error(`Learning not found: ${input.by}`)
        if (replacement.status !== "active") throw new Error(`Replacement learning is ${replacement.status}`)
      }
      const now = new Date().toISOString()
      const status = input.by ? "superseded" : "retracted"
      this.store.supersedeLearning(learning.id, status, input.by, now, input.invalidFrom)
      this.emit("LEARNING_SUPERSEDED", learning.sourceTaskId, { learningId: learning.id, supersededBy: input.by }, { status, reason: input.reason, invalidFrom: input.invalidFrom })
      return this.store.findLearning(learning.id)!
    })
  }

  relevantLearnings(taskId: string, limit = 10): Learning[] {
    const task = this.requireTask(taskId)
    const terms = tokenize([task.title, task.goal, task.category, ...this.ancestorsOf(taskId).map((ancestor) => ancestor.title)].join(" "))
    const proximity = new Set([...this.subtreeIds(this.rootOf(taskId).id), ...task.dependencies])
    return this.fuseLearnings(terms, limit, (learning) => learning.sourceTaskId !== taskId, proximity)
  }

  searchLearnings(query: string, limit = 20): Learning[] {
    const terms = tokenize(query)
    if (terms.length === 0) return this.store.activeLearnings().slice(0, Math.max(1, Math.min(limit, 100)))
    return this.fuseLearnings(terms, limit, () => true)
  }

  similarLearnings(learning: Learning, limit = 5): Learning[] {
    const terms = tokenize(`${learning.description} ${learning.tags.join(" ")}`)
    return this.fuseLearnings(terms, limit, (candidate) => candidate.id !== learning.id)
  }

  private fuseLearnings(terms: string[], limit: number, include: (learning: Learning) => boolean, proximity?: Set<string>): Learning[] {
    if (terms.length === 0) return []
    const wordIds = this.store.matchLearnings(ftsQuery(terms), "word")
    const trigramTerms = terms.filter((term) => [...term].length >= 3)
    const trigramIds = trigramTerms.length > 0 ? this.store.matchLearnings(ftsQuery(trigramTerms), "trigram") : []
    const candidates = new Map<string, Learning>()
    for (const id of [...wordIds, ...trigramIds]) {
      if (candidates.has(id)) continue
      const learning = this.store.findLearning(id)
      if (learning && include(learning)) candidates.set(id, learning)
    }
    if (candidates.size === 0) return []
    const inCandidates = (ids: string[]) => ids.filter((id) => candidates.has(id))
    const all = [...candidates.values()]
    const rankLists: string[][] = [
      inCandidates(wordIds),
      inCandidates(trigramIds),
      [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((learning) => learning.id),
      [...all].sort((a, b) => b.importance - a.importance || b.appliedCount - a.appliedCount || b.createdAt.localeCompare(a.createdAt)).map((learning) => learning.id),
    ]
    if (proximity) {
      rankLists.push(all
        .filter((learning) => learning.sourceTaskId && proximity.has(learning.sourceTaskId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((learning) => learning.id))
    }
    const scores = new Map<string, number>()
    for (const list of rankLists) {
      list.forEach((id, index) => scores.set(id, (scores.get(id) ?? 0) + 1 / (index + 1 + RRF_K)))
    }
    return all
      .sort((a, b) => (scores.get(b.id)! - scores.get(a.id)!) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, Math.min(limit, 50)))
  }

  private maybeCreateReflection(learning: Learning): void {
    if (learning.kind !== "failure_pattern") return
    const since = this.store.lastEventOfType("REFLECTION_CREATED")?.createdAt ?? ""
    const pending = this.store.activeLearnings().filter((candidate) => candidate.kind === "failure_pattern" && candidate.createdAt > since)
    if (pending.length < this.reflectionThreshold) return
    try {
      const parentId = learning.sourceTaskId ? this.rootOf(learning.sourceTaskId).id : undefined
      const title = `Reflect on ${pending.length} recurring failure patterns (${new Date().toISOString()})`
      const goal = [
        `${pending.length} failure-pattern learnings have accumulated: ${pending.map((candidate) => candidate.id).join(", ")}.`,
        "Review them, synthesize the recurring causes into a small number of higher-level insight or convention learnings,",
        "supersede the raw failure patterns they replace, and promote anything that must always hold into a requirement or constraint.",
      ].join(" ")
      const task = this.createReflectionTask(title, goal, parentId)
      if (!task) return
      this.emit("REFLECTION_CREATED", task.id, { learningIds: pending.map((candidate) => candidate.id) }, { count: pending.length })
    } catch {
      return
    }
  }

  private createReflectionTask(title: string, goal: string, parentId?: string): Task | undefined {
    try {
      return this.createTask({ title, goal, category: "diagnostic", parentId })
    } catch {
      if (!parentId) return undefined
      try {
        return this.createTask({ title, goal, category: "diagnostic" })
      } catch {
        return undefined
      }
    }
  }

  evaluateCompletion(taskId: string): CompletionEvaluation {
    const task = this.requireTask(taskId)
    const missing: string[] = []
    const children = this.store.childTasks(taskId)
    for (const child of children) {
      if (!TERMINAL_FOR_DEPENDENCY.includes(child.status)) missing.push(`child not verified: ${child.title} (${child.status})`)
    }
    for (const set of this.store.integrationSetsByParent(taskId)) {
      if (set.status !== "passed") missing.push(`integration set not passed: ${set.name} (${set.status})`)
      const bundle = set.outputBundleRef ? this.store.findBundle(set.outputBundleRef.artifactId, set.outputBundleRef.version) : undefined
      if (set.status === "passed" && bundle?.status !== "valid") missing.push(`bundle not valid: ${set.name}`)
    }
    for (const requirement of this.store.requirementsOf([taskId])) {
      if (requirement.kind === "requirement" && requirement.status !== "satisfied") missing.push(`requirement not satisfied: ${requirement.description}`)
    }
    for (const ref of task.outputArtifactRefs) {
      if (this.requireArtifactVersion(ref).status === "stale") missing.push(`stale output artifact: ${ref.artifactId}@${ref.version}`)
    }
    if (children.length === 0 && !TERMINAL_FOR_DEPENDENCY.includes(task.status)) missing.push(`task not verified (${task.status})`)
    return { complete: missing.length === 0, missing }
  }

  calculateImpact(artifactId: string, compatibility: "compatible" | "breaking" = "compatible"): ImpactReport {
    const head = this.store.findArtifact(artifactId)
    if (!head) throw new Error(`Artifact not found: ${artifactId}`)
    return this.collectImpact(artifactId, head.latestVersion, compatibility)
  }

  summarize(taskId: string): TaskSummary {
    const subtree = [...this.subtreeIds(taskId)]
    const completedWork: string[] = []
    const openQuestions: string[] = []
    const failureRefs: string[] = []
    const bundles: ArtifactVersionRef[] = []
    const decisionRefs: ArtifactVersionRef[] = []
    for (const id of subtree) {
      const task = this.requireTask(id)
      if (TERMINAL_FOR_DEPENDENCY.includes(task.status) && id !== taskId) completedWork.push(task.title)
      if (["blocked", "stale", "failed"].includes(task.status) && task.statusReason) openQuestions.push(`${task.title}: ${task.statusReason}`)
      for (const ref of task.outputArtifactRefs) {
        const version = this.requireArtifactVersion(ref)
        if ((version.type === "decision" || version.type === "architecture") && version.status === "valid") decisionRefs.push(ref)
      }
      for (const set of this.store.integrationSetsByParent(id)) {
        if (set.outputBundleRef && this.store.findBundle(set.outputBundleRef.artifactId, set.outputBundleRef.version)?.status === "valid") {
          bundles.push(set.outputBundleRef)
        }
        for (const run of this.store.runsOf(set.id)) {
          if (run.status === "failed") failureRefs.push(run.id)
        }
      }
    }
    return { taskId, completedWork, verifiedBundles: bundles, decisionRefs, failureRefs, openQuestions }
  }

  ancestorsOf(taskId: string): Task[] {
    const chain: Task[] = []
    let current = this.requireTask(taskId)
    const visited = new Set<string>([current.id])
    while (current.parentId) {
      if (visited.has(current.parentId)) throw new Error("Task hierarchy must not contain a cycle")
      current = this.requireTask(current.parentId)
      visited.add(current.id)
      chain.unshift(current)
    }
    return chain
  }

  rootOf(taskId: string): Task {
    const ancestors = this.ancestorsOf(taskId)
    return ancestors[0] ?? this.requireTask(taskId)
  }

  pathOf(taskId: string): string[] {
    return [...this.ancestorsOf(taskId).map((task) => task.title), this.requireTask(taskId).title]
  }

  subtreeIds(taskId: string): Set<string> {
    const ids = new Set<string>([taskId])
    const queue = [taskId]
    while (queue.length > 0) {
      for (const child of this.store.childTaskIds(queue.shift()!)) {
        if (!ids.has(child)) {
          ids.add(child)
          queue.push(child)
        }
      }
    }
    return ids
  }

  requireTask(taskId: string): Task {
    const task = this.store.findTask(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    return task
  }

  requireArtifactVersion(ref: ArtifactVersionRef): ArtifactVersion {
    const version = this.store.findArtifactVersion(ref.artifactId, ref.version)
    if (!version) throw new Error(`Unknown artifact version: ${ref.artifactId}@${ref.version}`)
    return version
  }

  markTaskIntegrating(taskId: string): void {
    const task = this.requireTask(taskId)
    if (task.status === "verified") this.setStatus(task, "integrating")
  }

  markTaskIntegrated(taskId: string): void {
    const task = this.requireTask(taskId)
    if (["verified", "integrating"].includes(task.status)) {
      this.setStatus(task, "integrated")
      this.afterTaskSettled(taskId)
    }
  }

  revertTaskToVerified(taskId: string, reason?: string): void {
    const task = this.requireTask(taskId)
    if (["integrating", "integrated"].includes(task.status)) this.setStatus(task, "verified", reason)
  }

  markTaskStale(taskId: string, reason: string): void {
    const task = this.requireTask(taskId)
    if (["implemented", "verified", "integrating", "integrated"].includes(task.status)) {
      this.setStatus(task, "stale", reason)
      if (task.parentId) this.refreshAncestors(task.parentId)
    }
  }

  refreshReadiness(taskId: string): void {
    const task = this.requireTask(taskId)
    if (!isAtomic(task)) return
    const satisfied = task.dependencies.every((id) => TERMINAL_FOR_DEPENDENCY.includes(this.requireTask(id).status))
    const failedUpstream = task.dependencies.filter((id) => this.requireTask(id).status === "failed")
    if (task.status === "pending" && satisfied) this.setStatus(task, "ready")
    else if (task.status === "ready" && !satisfied) this.setStatus(task, "pending", "Dependencies are no longer satisfied")
    else if (task.status === "pending" && failedUpstream.length > 0) {
      this.setStatus(task, "blocked", `Dependency failed: ${failedUpstream.map((id) => this.requireTask(id).title).join(", ")}`)
    } else if (task.status === "blocked" && failedUpstream.length === 0) {
      this.setStatus(task, satisfied ? "ready" : "pending")
    }
  }

  afterTaskSettled(taskId: string): void {
    for (const dependent of this.store.dependentIds(taskId)) this.refreshReadiness(dependent)
    const task = this.requireTask(taskId)
    if (task.parentId) this.refreshAncestors(task.parentId)
    for (const ref of task.outputArtifactRefs) {
      for (const set of this.store.integrationSetsByMember(ref.artifactId)) this.refreshIntegrationSetReadiness(set.id)
    }
  }

  refreshIntegrationSetReadiness(setId: string): void {
    const set = this.store.findIntegrationSet(setId)
    if (!set || !["pending", "stale", "failed"].includes(set.status)) return
    const ready = set.memberRefs.every((member) => {
      const latest = this.latestValidVersion(member.artifactId)
      if (!latest) return false
      const producer = this.requireTask(latest.producerTaskId)
      return TERMINAL_FOR_DEPENDENCY.includes(producer.status) || producer.status === "integrating"
    })
    if (ready && set.status === "pending") {
      this.store.updateIntegrationSet({ ...set, status: "ready", updatedAt: new Date().toISOString() })
    }
  }

  latestValidVersion(artifactId: string): ArtifactVersion | undefined {
    const versions = this.store.artifactVersions(artifactId)
    for (let index = versions.length - 1; index >= 0; index--) {
      if (versions[index]!.status === "valid") return versions[index]
    }
    return undefined
  }

  refreshAncestors(taskId: string): void {
    let current: Task | undefined = this.requireTask(taskId)
    while (current) {
      const children = this.store.childTasks(current.id)
      if (children.length > 0) this.applyCompositeStatus(current, children)
      current = current.parentId ? this.requireTask(current.parentId) : undefined
    }
  }

  emit(type: EventType, taskId?: string, refs?: Record<string, unknown>, payload?: Record<string, unknown>): TaskGraphEvent {
    const event: TaskGraphEvent = { id: randomUUID(), type, taskId, refs, payload, createdAt: new Date().toISOString() }
    this.store.insertEvent(event)
    return event
  }

  private applyCompositeStatus(task: Task, children: Task[]): void {
    const statuses = new Set(children.map((child) => child.status))
    let next: TaskStatus
    let reason: string | undefined
    if (statuses.has("failed")) {
      next = "blocked"
      reason = `Child task failed: ${children.filter((child) => child.status === "failed").map((child) => child.title).join(", ")}`
    } else if (children.every((child) => TERMINAL_FOR_DEPENDENCY.includes(child.status))) {
      const sets = this.store.integrationSetsByParent(task.id)
      const evaluation = this.evaluateCompletion(task.id)
      if (evaluation.complete) next = sets.length > 0 ? "integrated" : "verified"
      else if (sets.length > 0) next = "integrating"
      else {
        next = "running"
        reason = evaluation.missing.join("; ")
      }
    } else if (statuses.has("stale")) {
      next = "stale"
      reason = "A child task is stale"
    } else if (["running", "implemented", "integrating", "verified", "integrated"].some((status) => statuses.has(status as TaskStatus))) {
      next = "running"
    } else if (statuses.has("blocked") && [...statuses].every((status) => ["blocked", "pending", "ready"].includes(status))) {
      next = children.every((child) => child.status === "blocked") ? "blocked" : "pending"
    } else {
      next = "pending"
    }
    if (task.status !== next) this.setStatus(task, next, reason, undefined, next === "integrated" ? "TASK_INTEGRATED" : undefined, true)
  }

  private collectImpact(artifactId: string, fromVersion: number, compatibility: "compatible" | "breaking"): ImpactReport {
    const staleArtifactVersions: ArtifactVersionRef[] = []
    const affectedTasks = new Set<string>()
    const visited = new Set<string>()
    const queue: ArtifactVersionRef[] = []
    for (let version = 1; version < fromVersion; version++) queue.push({ artifactId, version })
    while (queue.length > 0) {
      const ref = queue.shift()!
      for (const dependent of this.store.lineageDependents(ref.artifactId, ref.version)) {
        const key = `${dependent.artifactId}@${dependent.version}`
        if (visited.has(key)) continue
        visited.add(key)
        staleArtifactVersions.push(dependent)
        const version = this.store.findArtifactVersion(dependent.artifactId, dependent.version)
        if (version) affectedTasks.add(version.producerTaskId)
        queue.push(dependent)
      }
    }
    const staleBundles: ArtifactVersionRef[] = []
    for (const bundle of this.store.validBundles()) {
      if (bundle.memberRefs.some((member) => member.artifactId === artifactId && member.version < fromVersion)
        || bundle.memberRefs.some((member) => staleArtifactVersions.some((stale) => stale.artifactId === member.artifactId && stale.version === member.version))) {
        staleBundles.push({ artifactId: bundle.artifactId, version: bundle.version })
      }
    }
    const staleIntegrationSetIds = [...new Set([
      ...this.store.integrationSetsByMember(artifactId).map((set) => set.id),
      ...staleArtifactVersions.flatMap((ref) => this.store.integrationSetsByMember(ref.artifactId).map((set) => set.id)),
    ])]
    return {
      artifactId,
      fromVersion,
      compatibility,
      staleArtifactVersions,
      staleBundles,
      staleIntegrationSetIds,
      affectedTaskIds: [...affectedTasks],
      reopenRecommendedTaskIds: compatibility === "breaking" ? [...affectedTasks] : [],
    }
  }

  private propagateStale(artifactId: string, newVersion: number, compatibility: "compatible" | "breaking"): void {
    const impact = this.collectImpact(artifactId, newVersion, compatibility)
    for (const ref of impact.staleArtifactVersions) {
      const version = this.store.findArtifactVersion(ref.artifactId, ref.version)
      if (version?.status === "valid") {
        this.store.markArtifactVersionStale(ref.artifactId, ref.version)
        this.emit("ARTIFACT_STALE", version.producerTaskId, { artifactId: ref.artifactId, version: ref.version, cause: `${artifactId}@${newVersion}` })
      }
    }
    for (const ref of impact.staleBundles) {
      const bundle = this.store.findBundle(ref.artifactId, ref.version)
      if (bundle?.status === "valid") {
        this.store.markBundleStale(ref.artifactId, ref.version)
        this.store.markArtifactVersionStale(ref.artifactId, ref.version)
        this.emit("BUNDLE_STALE", undefined, { artifactId: ref.artifactId, version: ref.version, integrationSetId: bundle.integrationSetId, cause: `${artifactId}@${newVersion}` })
      }
    }
    const now = new Date().toISOString()
    for (const setId of impact.staleIntegrationSetIds) {
      const set = this.store.findIntegrationSet(setId)
      if (set && ["ready", "passed", "failed"].includes(set.status)) {
        this.store.updateIntegrationSet({ ...set, status: "stale", updatedAt: now })
        if (set.parentTaskId) this.refreshAncestors(set.parentTaskId)
      }
    }
    for (const taskId of impact.affectedTaskIds) {
      if (compatibility === "breaking") this.markTaskStale(taskId, `Contract-breaking upstream change: ${artifactId}@${newVersion}`)
      else this.revertTaskToVerified(taskId, `Upstream change requires reintegration: ${artifactId}@${newVersion}`)
    }
    for (const set of this.store.integrationSetsByMember(artifactId)) {
      for (const member of set.memberRefs) {
        if (member.artifactId !== artifactId) continue
        const producer = this.requireTask(this.requireArtifactVersion({ artifactId, version: newVersion }).producerTaskId)
        if (["integrating", "integrated"].includes(producer.status)) this.revertTaskToVerified(producer.id, "New artifact version requires reintegration")
      }
    }
  }

  private blockDependents(taskId: string, reason: string): void {
    for (const dependentId of this.store.dependentIds(taskId)) {
      const dependent = this.requireTask(dependentId)
      if (["pending", "ready"].includes(dependent.status)) {
        this.setStatus(dependent, "blocked", reason)
        if (dependent.parentId) this.refreshAncestors(dependent.parentId)
      }
    }
  }

  private unblockDependents(taskId: string): void {
    for (const dependentId of this.store.dependentIds(taskId)) this.refreshReadiness(dependentId)
  }

  private annotate(task: Task, reason: string): void {
    this.store.updateTask({ ...this.requireTask(task.id), statusReason: reason, updatedAt: new Date().toISOString() })
  }

  private setStatus(task: Task, to: TaskStatus, reason?: string, payload?: Record<string, unknown>, eventOverride?: EventType, derived = false): void {
    const current = this.requireTask(task.id)
    if (current.status === to) return
    if (!derived && !MANUAL_TRANSITIONS[current.status].includes(to)) {
      throw new Error(`Invalid state transition: ${current.status} → ${to}`)
    }
    this.store.updateTask({ ...current, status: to, statusReason: reason, updatedAt: new Date().toISOString() })
    const eventType = eventOverride ?? STATUS_EVENTS[to]
    if (eventType) this.emit(eventType, task.id, undefined, { from: current.status, to, reason, ...payload })
  }

  private requireDecomposableParent(taskId: string): Task {
    const parent = this.store.findTask(taskId)
    if (!parent) throw new Error(`Missing parent task: ${taskId}`)
    if (["integrated", "verified", "failed"].includes(parent.status)) {
      throw new Error(`Task in status ${parent.status} cannot be decomposed; reopen it first`)
    }
    return parent
  }

  private buildTask(input: CreateTaskInput | DecompositionChildProposal, parentId: string | undefined, now: string): Task {
    if (input.category !== undefined && !isTaskCategory(input.category)) throw new Error(`Invalid task category: ${input.category}`)
    if (input.integrationPolicy !== undefined && !isIntegrationPolicy(input.integrationPolicy)) throw new Error(`Invalid integration policy: ${input.integrationPolicy}`)
    if (input.assignedRole && !this.store.findRole(input.assignedRole)) throw new Error(`Unknown role: ${input.assignedRole}`)
    return {
      id: randomUUID(),
      parentId,
      title: input.title.trim(),
      goal: input.goal.trim(),
      category: input.category ?? "general",
      status: "pending",
      childIds: [],
      dependencies: [],
      acceptanceCriteria: (input.acceptanceCriteria ?? []).map((criterion) =>
        typeof criterion === "string" ? { id: randomUUID(), description: criterion } : criterion),
      contextPolicy: { ...DEFAULT_CONTEXT_POLICY, ...input.contextPolicy },
      inputArtifactRefs: [],
      outputArtifactRefs: [],
      contractRefs: [],
      assignedRole: input.assignedRole,
      integrationPolicy: input.integrationPolicy,
      createdAt: now,
      updatedAt: now,
    }
  }

  private addRequirements(taskId: string, requirements: Array<{ description: string; kind?: RequirementKind }>): void {
    for (const requirement of requirements) this.addRequirement(taskId, requirement.description, requirement.kind ?? "requirement")
  }

  private isAncestorOf(candidateId: string, taskId: string, parentId: string): boolean {
    let current: string | undefined = parentId
    while (current) {
      if (current === candidateId) return true
      current = this.store.findTask(current)?.parentId
    }
    return false
  }

  private assertNoDependencyCycle(): void {
    const adjacency = new Map<string, string[]>()
    const link = (from: string, to: string) => {
      const list = adjacency.get(from) ?? []
      list.push(to)
      adjacency.set(from, list)
    }
    for (const edge of this.store.allDependencies()) link(edge.taskId, edge.dependsOnTaskId)
    for (const task of this.allTasks()) {
      if (task.parentId) link(task.parentId, task.id)
    }
    const state = new Map<string, "visiting" | "done">()
    const visit = (node: string): void => {
      const seen = state.get(node)
      if (seen === "done") return
      if (seen === "visiting") throw new Error("Dependency graph must not contain a cycle")
      state.set(node, "visiting")
      for (const next of adjacency.get(node) ?? []) visit(next)
      state.set(node, "done")
    }
    for (const node of adjacency.keys()) visit(node)
  }

  private allTasks(): Task[] {
    return this.store.searchTasks("", 10_000)
  }
}

const STATUS_EVENTS: Partial<Record<TaskStatus, EventType>> = {
  ready: "TASK_READY",
  running: "TASK_STARTED",
  implemented: "TASK_IMPLEMENTED",
  verified: "TASK_VERIFIED",
  integrated: "TASK_INTEGRATED",
  blocked: "TASK_BLOCKED",
  failed: "TASK_FAILED",
  stale: "TASK_STALE",
}

function topologicalOrder(tasks: Task[]): Task[] {
  const byId = new Map(tasks.map((task) => [task.id, task]))
  const ordered: Task[] = []
  const state = new Map<string, "visiting" | "done">()
  const visit = (task: Task): void => {
    const seen = state.get(task.id)
    if (seen) return
    state.set(task.id, "visiting")
    for (const dependency of task.dependencies) {
      const inScope = byId.get(dependency)
      if (inScope) visit(inScope)
    }
    state.set(task.id, "done")
    ordered.push(task)
  }
  for (const task of tasks) visit(task)
  return ordered
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ")
}

function requireText(value: unknown, field: string): void {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must not be empty`)
}

function isTaskCategory(value: unknown): value is TaskCategory {
  return ["requirement", "research", "architecture", "implementation", "qa", "integration", "diagnostic", "general"].includes(String(value))
}

function isIntegrationPolicy(value: unknown): value is IntegrationPolicy {
  return ["none", "contract", "targeted", "full"].includes(String(value))
}

function isArtifactType(value: unknown): value is ArtifactType {
  return ["research", "architecture", "code", "test", "bundle", "decision", "note"].includes(String(value))
}

function isLearningKind(value: unknown): value is LearningKind {
  return ["insight", "pitfall", "convention", "failure_pattern", "improvement"].includes(String(value))
}

const RRF_K = 60

function tokenize(text: string): string[] {
  return [...new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 1))]
}

function ftsQuery(terms: string[]): string {
  return terms.map((term) => `"${term.replaceAll('"', '""')}"`).join(" OR ")
}
