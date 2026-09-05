import { randomUUID } from "node:crypto"
import type { ArtifactType, LearningKind, Task, TaskCategory, TaskStatus } from "#task-domain"
import type { TaskGraphEngine } from "#task-engine"
import type { TaskAgent } from "#task-agent-core"
import type {
  ExecuteOutput,
  ExecutorRequest,
  ExecutorResponse,
  IntegrationPlanOutput,
  IntegrationVerifyOutput,
  PlanOutput,
  TaskExecutor,
} from "./executor.ts"
import { SCHEMAS } from "./executor.ts"
import {
  executeInstruction,
  integrationPlanInstruction,
  integrationVerifyInstruction,
  planInstruction,
} from "./instructions.ts"
import { resolveRole, seedDefaultRoles, verificationRole } from "./roles.ts"

export interface OrchestratorOptions {
  workspace?: string
  concurrency?: number
  maxAttemptsPerTask?: number
  maxDepth?: number
  maxRuns?: number
  maxIterations?: number
  autoIntegration?: boolean
  verifyCommand?: string
  onEvent?: (event: OrchestrationEvent) => void
}

export type OrchestrationEventType =
  | "task_planned"
  | "task_decomposed"
  | "task_started"
  | "task_completed"
  | "task_retry"
  | "handoff"
  | "integration_planned"
  | "integration_started"
  | "integration_passed"
  | "integration_failed"
  | "idle"

export interface OrchestrationEvent {
  type: OrchestrationEventType
  taskId?: string
  title?: string
  detail?: string
}

export interface Handoff {
  taskId: string
  title: string
  status: TaskStatus
  reason: string
}

export type OrchestrationStatus = "completed" | "handoff" | "budget_exhausted"

export interface OrchestrationReport {
  rootId: string
  status: OrchestrationStatus
  iterations: number
  runs: number
  costUsd: number
  completedTaskIds: string[]
  handoffs: Handoff[]
  missing: string[]
}

const TERMINAL_STATUSES: TaskStatus[] = ["verified", "integrated"]

const TASK_CATEGORIES: TaskCategory[] = [
  "requirement",
  "research",
  "architecture",
  "implementation",
  "qa",
  "integration",
  "diagnostic",
  "general",
]

const ARTIFACT_TYPES: ArtifactType[] = ["research", "architecture", "code", "test", "decision", "note"]

const LEARNING_KINDS: LearningKind[] = ["insight", "pitfall", "convention", "failure_pattern", "improvement"]

export class Orchestrator {
  private agent: TaskAgent
  private engine: TaskGraphEngine
  private executor: TaskExecutor
  private options: Required<Omit<OrchestratorOptions, "onEvent" | "verifyCommand">> & {
    onEvent?: (event: OrchestrationEvent) => void
    verifyCommand?: string
  }

  private attempts = new Map<string, number>()
  private lastFailure = new Map<string, string>()
  private handoffs = new Map<string, Handoff>()
  private completed = new Set<string>()
  private integrationPlanned = new Set<string>()
  private integrationAttempts = new Map<string, number>()
  private runs = 0
  private costUsd = 0

  constructor(agent: TaskAgent, engine: TaskGraphEngine, executor: TaskExecutor, options: OrchestratorOptions = {}) {
    this.agent = agent
    this.engine = engine
    this.executor = executor
    this.options = {
      workspace: options.workspace ?? process.cwd(),
      concurrency: Math.max(1, options.concurrency ?? 1),
      maxAttemptsPerTask: Math.max(1, options.maxAttemptsPerTask ?? 2),
      maxDepth: Math.max(1, options.maxDepth ?? 4),
      maxRuns: Math.max(1, options.maxRuns ?? 200),
      maxIterations: Math.max(1, options.maxIterations ?? 200),
      autoIntegration: options.autoIntegration ?? true,
      onEvent: options.onEvent,
      verifyCommand: options.verifyCommand,
    }
    seedDefaultRoles(engine.store)
  }

  async run(rootId: string): Promise<OrchestrationReport> {
    this.engine.requireTask(rootId)
    let iterations = 0
    while (iterations < this.options.maxIterations) {
      iterations++
      if (this.runs >= this.options.maxRuns) return this.report(rootId, "budget_exhausted", iterations)
      const runnable = (await this.agent.getRunnable({ rootId }))
        .filter((entry) => !this.handoffs.has(entry.task.id))
      if (runnable.length > 0) {
        const batch = runnable.slice(0, this.options.concurrency)
        await Promise.all(batch.map((entry) => this.advanceTask(entry.task.id)))
        continue
      }
      if (this.options.autoIntegration) {
        if (await this.advanceIntegrations(rootId)) continue
        if (await this.planIntegration(rootId)) continue
      }
      if (this.isComplete(rootId)) return this.report(rootId, "completed", iterations)
      this.emit({ type: "idle", taskId: rootId, detail: "더 진행할 수 있는 Task가 없습니다" })
      break
    }
    return this.report(rootId, this.isComplete(rootId) ? "completed" : "handoff", iterations)
  }

  private async advanceTask(taskId: string): Promise<void> {
    const task = this.engine.requireTask(taskId)
    const attempt = (this.attempts.get(taskId) ?? 0) + 1
    this.attempts.set(taskId, attempt)
    const role = resolveRole(this.engine.store, task)
    let contextText: string
    let depth: number
    try {
      const built = await this.agent.getContext({ taskId })
      contextText = built.text
      depth = Math.max(0, built.context.path.length - 1)
    } catch (error) {
      return this.handleFailure(task, attempt, describe(error))
    }

    const plan = await this.call({
      kind: "plan",
      taskId,
      title: task.title,
      instruction: planInstruction({
        task,
        depth,
        maxDepth: this.options.maxDepth,
        attempt,
        lastFailure: this.lastFailure.get(taskId),
      }),
      context: contextText,
      role,
      attempt,
    })
    if (!plan.ok) return this.handleFailure(task, attempt, plan.error ?? "plan 단계 실행 실패")
    const planOutput = plan.output as PlanOutput | undefined
    if (!planOutput || typeof planOutput.decision !== "string") {
      return this.handleFailure(task, attempt, "plan 결과가 스키마를 따르지 않습니다")
    }
    this.emit({ type: "task_planned", taskId, title: task.title, detail: `${planOutput.decision}: ${planOutput.reason}` })

    if (planOutput.decision === "blocked") {
      return this.stopForHuman(task, planOutput.reason || "Worker가 사람의 결정을 요청했습니다")
    }
    if (planOutput.decision === "decompose" && depth < this.options.maxDepth) {
      const children = normalizeChildren(planOutput.children ?? [])
      if (children.length === 0) return this.handleFailure(task, attempt, "decompose를 선택했지만 children이 비어 있습니다")
      try {
        const result = await this.agent.proposeDecomposition({ taskId, children })
        this.attempts.set(taskId, 0)
        this.lastFailure.delete(taskId)
        this.emit({
          type: "task_decomposed",
          taskId,
          title: task.title,
          detail: result.children.map((child) => child.title).join(", "),
        })
        return
      } catch (error) {
        return this.handleFailure(task, attempt, `분해 제안이 거부되었습니다: ${describe(error)}`)
      }
    }

    const sessionId = randomUUID()
    try {
      await this.agent.startTask({ taskId, agent: this.executor.name, sessionId, role: role?.id })
    } catch (error) {
      return this.handleFailure(task, attempt, describe(error))
    }
    this.emit({ type: "task_started", taskId, title: task.title, detail: role?.name })

    const execution = await this.call({
      kind: "execute",
      taskId,
      title: task.title,
      instruction: executeInstruction({
        task,
        workspace: this.options.workspace,
        attempt,
        lastFailure: this.lastFailure.get(taskId),
        verifyCommand: this.options.verifyCommand,
      }),
      context: contextText,
      role,
      attempt,
      sessionId,
    })
    if (!execution.ok) return this.handleFailure(task, attempt, execution.error ?? "execute 단계 실행 실패")
    const output = execution.output as ExecuteOutput | undefined
    if (!output || typeof output.summary !== "string") {
      return this.handleFailure(task, attempt, "execute 결과가 스키마를 따르지 않습니다")
    }
    if (output.status !== "completed") {
      return this.handleFailure(task, attempt, output.failureReason || output.summary)
    }

    try {
      await this.agent.completeTask({
        taskId,
        summary: output.summary,
        artifacts: normalizeArtifacts(output.artifacts ?? []),
        verification: output.verification,
        learnings: normalizeLearnings(output.learnings ?? []),
      })
    } catch (error) {
      return this.handleFailure(task, attempt, describe(error))
    }
    const settled = this.engine.requireTask(taskId)
    if (!TERMINAL_STATUSES.includes(settled.status)) {
      return this.handleFailure(task, attempt, `검증을 통과하지 못했습니다 (status: ${settled.status})`)
    }
    this.completed.add(taskId)
    this.attempts.set(taskId, 0)
    this.lastFailure.delete(taskId)
    this.emit({ type: "task_completed", taskId, title: task.title, detail: output.summary })
  }

  private async planIntegration(rootId: string): Promise<boolean> {
    const store = this.engine.store
    const candidates = [...this.engine.subtreeIds(rootId)]
      .map((id) => this.engine.requireTask(id))
      .filter((task) => task.childIds.length > 0)
      .filter((task) => !this.integrationPlanned.has(task.id))
      .filter((task) => store.integrationSetsByParent(task.id).length === 0)
      .filter((task) => {
        const children = store.childTasks(task.id)
        return children.length > 0 && children.every((child) => TERMINAL_STATUSES.includes(child.status))
      })
      .sort((left, right) => this.engine.pathOf(right.id).length - this.engine.pathOf(left.id).length)
    const parent = candidates[0]
    if (!parent) return false
    this.integrationPlanned.add(parent.id)

    const memberCandidates = this.memberCandidates(parent)
    const evaluation = this.engine.evaluateCompletion(parent.id)
    const openRequirements = store
      .requirementsOf([parent.id])
      .filter((requirement) => requirement.kind === "requirement" && requirement.status === "open")
    if (memberCandidates.length < 2) {
      if (openRequirements.length > 0) {
        this.stopForHuman(parent, `Requirement를 검증할 Artifact 조합이 없습니다: ${openRequirements.map((item) => item.description).join("; ")}`, false)
        return true
      }
      return true
    }

    const context = await this.agent.getContext({ taskId: parent.id })
    const response = await this.call({
      kind: "integration_plan",
      taskId: parent.id,
      title: parent.title,
      instruction: integrationPlanInstruction({
        parent,
        memberCandidates,
        openRequirements,
        missing: evaluation.missing,
      }),
      context: context.text,
      role: verificationRole(store),
      attempt: 1,
    })
    if (!response.ok) {
      this.stopForHuman(parent, `Integration 계획 단계가 실패했습니다: ${response.error ?? "unknown"}`, false)
      return true
    }
    const output = response.output as IntegrationPlanOutput | undefined
    if (!output || typeof output.needed !== "boolean") {
      this.stopForHuman(parent, "Integration 계획 결과가 스키마를 따르지 않습니다", false)
      return true
    }
    if (!output.needed || !output.integrationSets || output.integrationSets.length === 0) {
      if (openRequirements.length > 0) {
        this.stopForHuman(parent, `Integration이 필요 없다고 판단했지만 Requirement가 남아 있습니다: ${output.reason}`, false)
      }
      this.emit({ type: "integration_planned", taskId: parent.id, title: parent.title, detail: `skipped: ${output.reason}` })
      return true
    }
    try {
      const result = await this.agent.proposeIntegration({
        integrationSets: output.integrationSets.map((set) => ({
          name: set.name,
          parentTaskId: parent.id,
          policy: set.policy === "none" || set.policy === "contract" || set.policy === "targeted" || set.policy === "full"
            ? set.policy
            : undefined,
          members: set.members,
          scenarios: set.scenarios.map((scenario) => ({
            name: scenario.name,
            expectedBehavior: scenario.expectedBehavior,
            participants: scenario.participants,
            requirementIds: scenario.requirementIds,
          })),
        })),
      })
      this.emit({
        type: "integration_planned",
        taskId: parent.id,
        title: parent.title,
        detail: result.sets.map((set) => set.name).join(", "),
      })
    } catch (error) {
      this.stopForHuman(parent, `Integration 제안이 거부되었습니다: ${describe(error)}`, false)
    }
    return true
  }

  private async advanceIntegrations(rootId: string): Promise<boolean> {
    const store = this.engine.store
    const scope = this.engine.subtreeIds(rootId)
    const sets = store.integrationSets().filter((set) => set.parentTaskId && scope.has(set.parentTaskId))
    for (const set of sets) {
      this.engine.refreshIntegrationSetReadiness(set.id)
    }
    const target = store
      .integrationSets()
      .filter((set) => set.parentTaskId && scope.has(set.parentTaskId))
      .find((set) => set.status === "ready")
    if (!target) return false
    const attempt = (this.integrationAttempts.get(target.id) ?? 0) + 1
    this.integrationAttempts.set(target.id, attempt)
    const parent = target.parentTaskId ? this.engine.requireTask(target.parentTaskId) : undefined
    if (attempt > this.options.maxAttemptsPerTask) {
      if (parent) this.stopForHuman(parent, `Integration Set ${target.name}이 반복 실패했습니다`, false)
      return true
    }

    let started
    try {
      started = await this.agent.runIntegration({ setRef: target.id })
    } catch (error) {
      if (parent) this.stopForHuman(parent, `Integration 실행을 시작하지 못했습니다: ${describe(error)}`, false)
      return true
    }
    if (started.cached) {
      this.emit({ type: "integration_passed", taskId: parent?.id, title: target.name, detail: "cached" })
      return true
    }
    this.emit({ type: "integration_started", taskId: parent?.id, title: target.name })

    const members = started.run.memberRefs.map((ref) => ({
      name: store.findArtifact(ref.artifactId)?.name ?? ref.artifactId,
      version: ref.version,
    }))
    const context = parent ? (await this.agent.getContext({ taskId: parent.id })).text : ""
    const response = await this.call({
      kind: "integration_verify",
      taskId: parent?.id ?? target.id,
      title: target.name,
      instruction: integrationVerifyInstruction({
        setName: target.name,
        workspace: this.options.workspace,
        scenarios: started.scenarios,
        members,
      }),
      context,
      role: verificationRole(store),
      attempt,
    })
    const output = response.ok ? (response.output as IntegrationVerifyOutput | undefined) : undefined
    const scenarios = started.scenarios.map((scenario) => {
      const reported = output?.scenarios?.find((item) => item.scenarioId === scenario.id)
      if (reported && (reported.status === "passed" || reported.status === "failed")) {
        return { scenarioId: scenario.id, status: reported.status, observed: reported.observed }
      }
      return {
        scenarioId: scenario.id,
        status: "failed" as const,
        observed: response.ok ? "Worker가 이 시나리오의 결과를 보고하지 않았습니다" : (response.error ?? "실행 실패"),
      }
    })
    try {
      const result = await this.agent.reportIntegration({
        runId: started.run.id,
        scenarios,
        failure: output?.failure
          ? {
            type: isFailureType(output.failure.type) ? output.failure.type : undefined,
            affectedTaskIds: output.failure.affectedTaskIds,
            recommendedActions: output.failure.recommendedActions,
          }
          : undefined,
      })
      if (result.run.status === "passed") {
        this.emit({ type: "integration_passed", taskId: parent?.id, title: target.name })
      } else {
        this.emit({
          type: "integration_failed",
          taskId: parent?.id,
          title: target.name,
          detail: result.diagnosticTask ? `diagnostic: ${result.diagnosticTask.title}` : result.run.failure?.type,
        })
      }
    } catch (error) {
      if (parent) this.stopForHuman(parent, `Integration 결과를 제출하지 못했습니다: ${describe(error)}`, false)
    }
    return true
  }

  private memberCandidates(parent: Task): Array<{ name: string; type: string; producerTitle: string }> {
    const store = this.engine.store
    const seen = new Set<string>()
    const candidates: Array<{ name: string; type: string; producerTitle: string }> = []
    for (const child of store.childTasks(parent.id)) {
      for (const ref of child.outputArtifactRefs) {
        const latest = this.engine.latestValidVersion(ref.artifactId)
        if (!latest || seen.has(latest.artifactId)) continue
        const head = store.findArtifact(latest.artifactId)
        if (!head) continue
        seen.add(latest.artifactId)
        candidates.push({ name: head.name, type: latest.type, producerTitle: child.title })
      }
    }
    return candidates
  }

  private async handleFailure(task: Task, attempt: number, reason: string): Promise<void> {
    this.lastFailure.set(task.id, reason)
    if (attempt >= this.options.maxAttemptsPerTask) {
      return this.stopForHuman(task, reason)
    }
    this.emit({ type: "task_retry", taskId: task.id, title: task.title, detail: reason })
    const current = this.engine.requireTask(task.id)
    try {
      if (current.status === "running") await this.agent.failTask({ taskId: task.id, reason })
    } catch {
      // 상태 전이가 허용되지 않으면 아래 reopen 시도로 넘어간다
    }
    const afterFail = this.engine.requireTask(task.id)
    if (["implemented", "verified", "integrating", "integrated", "blocked", "failed", "stale"].includes(afterFail.status)) {
      try {
        await this.agent.reopenTask({ taskId: task.id, reason: `재시도: ${reason}` })
      } catch {
        this.stopForHuman(task, `재시도를 위해 상태를 되돌리지 못했습니다: ${reason}`)
      }
    }
  }

  private stopForHuman(task: Task, reason: string, markFailed = true): void {
    if (markFailed) {
      const current = this.engine.requireTask(task.id)
      if (!["failed", "verified", "integrated"].includes(current.status)) {
        try {
          void this.agent.failTask({ taskId: task.id, reason })
        } catch {
          // 실패로 표시할 수 없는 상태면 statusReason 없이 handoff만 남긴다
        }
      }
    }
    const settled = this.engine.requireTask(task.id)
    this.handoffs.set(task.id, { taskId: task.id, title: task.title, status: settled.status, reason })
    this.emit({ type: "handoff", taskId: task.id, title: task.title, detail: reason })
  }

  private async call(request: Omit<ExecutorRequest, "schema" | "workspace" | "sessionId"> & { sessionId?: string }): Promise<ExecutorResponse> {
    this.runs++
    const full: ExecutorRequest = {
      ...request,
      sessionId: request.sessionId ?? randomUUID(),
      workspace: this.options.workspace,
      schema: SCHEMAS[request.kind],
    }
    try {
      const response = await this.executor.run(full)
      if (typeof response.costUsd === "number") this.costUsd += response.costUsd
      return response
    } catch (error) {
      return { ok: false, error: describe(error) }
    }
  }

  private isComplete(rootId: string): boolean {
    return this.engine.evaluateCompletion(rootId).complete
  }

  private report(rootId: string, status: OrchestrationStatus, iterations: number): OrchestrationReport {
    const evaluation = this.engine.evaluateCompletion(rootId)
    const handoffs = [...this.handoffs.values()]
    if (status !== "completed" && handoffs.length === 0) {
      const root = this.engine.requireTask(rootId)
      handoffs.push({
        taskId: rootId,
        title: root.title,
        status: root.status,
        reason: evaluation.missing.join("; ") || "진행할 수 있는 Task가 없습니다",
      })
    }
    return {
      rootId,
      status,
      iterations,
      runs: this.runs,
      costUsd: this.costUsd,
      completedTaskIds: [...this.completed],
      handoffs,
      missing: evaluation.missing,
    }
  }

  private emit(event: OrchestrationEvent): void {
    this.options.onEvent?.(event)
  }
}

function normalizeChildren(children: NonNullable<PlanOutput["children"]>): Array<{
  key?: string
  title: string
  goal: string
  category?: TaskCategory
  dependencies?: string[]
  acceptanceCriteria?: string[]
  requirements?: Array<{ description: string; kind?: "requirement" | "constraint" }>
}> {
  return children
    .filter((child) => typeof child.title === "string" && typeof child.goal === "string")
    .map((child) => ({
      key: child.key,
      title: child.title,
      goal: child.goal,
      category: TASK_CATEGORIES.includes(child.category as TaskCategory) ? child.category as TaskCategory : undefined,
      dependencies: child.dependencies,
      acceptanceCriteria: child.acceptanceCriteria,
      requirements: child.requirements?.map((requirement) => ({
        description: requirement.description,
        kind: requirement.kind === "constraint" ? "constraint" as const : "requirement" as const,
      })),
    }))
}

function normalizeArtifacts(artifacts: NonNullable<ExecuteOutput["artifacts"]>): Array<{
  name: string
  type: ArtifactType
  contentRef?: string
  content?: string
  compatibility?: "compatible" | "breaking"
}> {
  return artifacts
    .filter((artifact) => typeof artifact.name === "string" && ARTIFACT_TYPES.includes(artifact.type as ArtifactType))
    .map((artifact) => ({
      name: artifact.name,
      type: artifact.type as ArtifactType,
      contentRef: artifact.contentRef,
      content: artifact.content,
      compatibility: artifact.compatibility,
    }))
}

function normalizeLearnings(learnings: NonNullable<ExecuteOutput["learnings"]>): Array<{
  kind?: LearningKind
  description: string
  tags?: string[]
  importance?: number
}> {
  return learnings
    .filter((learning) => typeof learning.description === "string" && learning.description.trim().length > 0)
    .map((learning) => ({
      kind: LEARNING_KINDS.includes(learning.kind as LearningKind) ? learning.kind as LearningKind : undefined,
      description: learning.description,
      tags: learning.tags,
      importance: learning.importance,
    }))
}

function isFailureType(value: unknown): value is "producer_violation" | "consumer_violation" | "contract_mismatch" | "architecture_issue" | "interaction_issue" | "unknown" {
  return typeof value === "string" && [
    "producer_violation",
    "consumer_violation",
    "contract_mismatch",
    "architecture_issue",
    "interaction_issue",
    "unknown",
  ].includes(value)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
