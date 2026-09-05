import type { ArtifactVersion, Requirement, Task, TaskContract } from "#task-domain"
import type {
  CompleteTaskInput,
  CreateTaskInput,
  DecompositionProposal,
  DefineContractInput,
  ImpactReport,
  PublishArtifactInput,
  RunnableTask,
  TaskGraphEngine,
  TaskLoadResult,
} from "#task-engine"
import type {
  IntegrationEngine,
  IntegrationProposal,
  IntegrationProposalResult,
  ReportRunResult,
  RunReport,
  StartRunResult,
} from "#integration-engine"
import { buildTaskContext, formatTaskContext, type TaskContext } from "#task-context"

export interface ContextResult {
  context: TaskContext
  text: string
}

export interface TaskAgent {
  createTask(input: CreateTaskInput): Promise<Task>
  searchTasks(input: { query: string; limit?: number }): Promise<Task[]>
  loadTask(input: { taskId: string }): Promise<TaskLoadResult>
  getRunnable(input: { rootId?: string }): Promise<RunnableTask[]>
  proposeDecomposition(input: DecompositionProposal): Promise<{ parent: Task; children: Task[] }>
  startTask(input: { taskId: string; agent?: string; sessionId?: string; role?: string }): Promise<Task>
  completeTask(input: CompleteTaskInput): Promise<Task>
  failTask(input: { taskId: string; reason: string }): Promise<Task>
  reopenTask(input: { taskId: string; reason: string }): Promise<Task>
  getContext(input: { taskId: string }): Promise<ContextResult>
  publishArtifact(input: PublishArtifactInput): Promise<ArtifactVersion>
  defineContract(input: DefineContractInput): Promise<TaskContract>
  addRequirement(input: { taskId: string; description: string; kind?: "requirement" | "constraint" }): Promise<Requirement>
  calculateImpact(input: { artifactId: string; compatibility?: "compatible" | "breaking" }): Promise<ImpactReport>
  proposeIntegration(input: IntegrationProposal): Promise<IntegrationProposalResult>
  runIntegration(input: { setRef: string }): Promise<StartRunResult>
  reportIntegration(input: { runId: string } & RunReport): Promise<ReportRunResult>
}

export class TaskAgentService implements TaskAgent {
  private engine: TaskGraphEngine
  private integration: IntegrationEngine

  constructor(engine: TaskGraphEngine, integration: IntegrationEngine) {
    this.engine = engine
    this.integration = integration
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    validateObject(input)
    return this.engine.createTask(input)
  }

  async searchTasks(input: { query: string; limit?: number }): Promise<Task[]> {
    validateObject(input)
    if (typeof input.query !== "string") throw new Error("query must be a string")
    return this.engine.searchTasks(input.query, input.limit)
  }

  async loadTask(input: { taskId: string }): Promise<TaskLoadResult> {
    requireId(input, "taskId")
    return this.engine.loadTask(input.taskId)
  }

  async getRunnable(input: { rootId?: string } = {}): Promise<RunnableTask[]> {
    validateObject(input)
    return this.engine.resolveRunnable(input.rootId)
  }

  async proposeDecomposition(input: DecompositionProposal): Promise<{ parent: Task; children: Task[] }> {
    requireId(input, "taskId")
    return this.engine.proposeDecomposition(input)
  }

  async startTask(input: { taskId: string; agent?: string; sessionId?: string; role?: string }): Promise<Task> {
    requireId(input, "taskId")
    return this.engine.startTask(input.taskId, { agent: input.agent, sessionId: input.sessionId, role: input.role })
  }

  async completeTask(input: CompleteTaskInput): Promise<Task> {
    requireId(input, "taskId")
    return this.engine.completeTask(input)
  }

  async failTask(input: { taskId: string; reason: string }): Promise<Task> {
    requireId(input, "taskId")
    return this.engine.failTask(input.taskId, input.reason)
  }

  async reopenTask(input: { taskId: string; reason: string }): Promise<Task> {
    requireId(input, "taskId")
    return this.engine.reopenTask(input.taskId, input.reason)
  }

  async getContext(input: { taskId: string }): Promise<ContextResult> {
    requireId(input, "taskId")
    const context = buildTaskContext(this.engine, input.taskId)
    return { context, text: formatTaskContext(context) }
  }

  async publishArtifact(input: PublishArtifactInput): Promise<ArtifactVersion> {
    requireId(input, "taskId")
    return this.engine.publishArtifact(input)
  }

  async defineContract(input: DefineContractInput): Promise<TaskContract> {
    requireId(input, "providerTaskId")
    requireId(input, "consumerTaskId")
    return this.engine.defineContract(input)
  }

  async addRequirement(input: { taskId: string; description: string; kind?: "requirement" | "constraint" }): Promise<Requirement> {
    requireId(input, "taskId")
    return this.engine.addRequirement(input.taskId, input.description, input.kind)
  }

  async calculateImpact(input: { artifactId: string; compatibility?: "compatible" | "breaking" }): Promise<ImpactReport> {
    requireId(input, "artifactId")
    return this.engine.calculateImpact(input.artifactId, input.compatibility)
  }

  async proposeIntegration(input: IntegrationProposal): Promise<IntegrationProposalResult> {
    validateObject(input)
    return this.integration.proposeIntegration(input)
  }

  async runIntegration(input: { setRef: string }): Promise<StartRunResult> {
    requireId(input, "setRef")
    return this.integration.startRun(input.setRef)
  }

  async reportIntegration(input: { runId: string } & RunReport): Promise<ReportRunResult> {
    requireId(input, "runId")
    return this.integration.reportRun(input.runId, { scenarios: input.scenarios, failure: input.failure })
  }
}

export const OPERATIONS = [
  "task_create",
  "task_search",
  "task_load",
  "task_get_runnable",
  "task_propose_decomposition",
  "task_start",
  "task_complete",
  "task_fail",
  "task_reopen",
  "task_get_context",
  "artifact_publish",
  "contract_define",
  "requirement_add",
  "impact_analyze",
  "integration_propose",
  "integration_run",
  "integration_report",
] as const

export async function dispatchOperation(agent: TaskAgent, operation: string, input: Record<string, any>): Promise<unknown> {
  switch (operation) {
    case "task_create":
      return agent.createTask(input as Parameters<TaskAgent["createTask"]>[0])
    case "task_search":
      return agent.searchTasks(input as Parameters<TaskAgent["searchTasks"]>[0])
    case "task_load":
      return agent.loadTask(input as Parameters<TaskAgent["loadTask"]>[0])
    case "task_get_runnable":
      return agent.getRunnable(input as Parameters<TaskAgent["getRunnable"]>[0])
    case "task_propose_decomposition":
      return agent.proposeDecomposition(input as Parameters<TaskAgent["proposeDecomposition"]>[0])
    case "task_start":
      return agent.startTask(input as Parameters<TaskAgent["startTask"]>[0])
    case "task_complete":
      return agent.completeTask(input as Parameters<TaskAgent["completeTask"]>[0])
    case "task_fail":
      return agent.failTask(input as Parameters<TaskAgent["failTask"]>[0])
    case "task_reopen":
      return agent.reopenTask(input as Parameters<TaskAgent["reopenTask"]>[0])
    case "task_get_context":
      return agent.getContext(input as Parameters<TaskAgent["getContext"]>[0])
    case "artifact_publish":
      return agent.publishArtifact(input as Parameters<TaskAgent["publishArtifact"]>[0])
    case "contract_define":
      return agent.defineContract(input as Parameters<TaskAgent["defineContract"]>[0])
    case "requirement_add":
      return agent.addRequirement(input as Parameters<TaskAgent["addRequirement"]>[0])
    case "impact_analyze":
      return agent.calculateImpact(input as Parameters<TaskAgent["calculateImpact"]>[0])
    case "integration_propose":
      return agent.proposeIntegration(input as Parameters<TaskAgent["proposeIntegration"]>[0])
    case "integration_run":
      return agent.runIntegration(input as Parameters<TaskAgent["runIntegration"]>[0])
    case "integration_report":
      return agent.reportIntegration(input as Parameters<TaskAgent["reportIntegration"]>[0])
  }
  throw new UnknownOperationError(operation)
}

export class UnknownOperationError extends Error {
  constructor(operation: string) {
    super(`Unknown operation: ${operation}`)
  }
}

function validateObject(input: unknown): asserts input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("request must be an object")
}

function requireId(input: unknown, field: string): void {
  validateObject(input)
  const value = (input as Record<string, unknown>)[field]
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be a nonempty string`)
}
