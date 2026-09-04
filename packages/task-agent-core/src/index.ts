import type { EventSource, EventType, Task, TaskEvent, TaskRecord } from "#task-domain"
import type { AppendEventInput, TaskEngine } from "#task-engine"
import { compileTaskContext, formatTaskContext, type ContextMode, type ExecutableTaskContext } from "#task-context"
import { createHash } from "node:crypto"

export interface ContextRequest {
  taskId?: string
  query?: string
  mode?: ContextMode
}

export interface ContextResult {
  context: ExecutableTaskContext
  text: string
}

export interface SyncRequest {
  taskId?: string
  task?: string
  conversation: string
  instruction?: string
  source?: EventSource
  idempotencyKey?: string
}

export interface SyncResult {
  task: Task
  appended: TaskEvent[]
}

export interface ExtractedEvent {
  type: EventType
  content: string
  metadata?: Record<string, unknown>
}

export interface TaskReasoner {
  extractEvents(input: { conversation: string; instruction?: string; task: TaskRecord }): Promise<ExtractedEvent[]>
  selectTask(input: { query: string; candidates: Task[] }): Promise<string>
  run(input: { instruction: string; tasks: TaskRecord[] }): Promise<string>
}

export interface TaskAgent {
  context(request: ContextRequest): Promise<ContextResult>
  sync(request: SyncRequest): Promise<SyncResult>
  handoff(request: HandoffRequest): Promise<HandoffResult>
  run(request: RunRequest): Promise<RunResult>
}

export interface HandoffRequest extends ContextRequest {
  targetAgent?: string
}

export interface HandoffResult extends ContextResult {
  targetAgent?: string
}

export interface RunRequest {
  instruction: string
  taskIds?: string[]
  query?: string
}

export interface RunResult {
  text: string
  taskIds: string[]
}

export class TaskAgentService implements TaskAgent {
  private engine: TaskEngine
  private reasoner?: TaskReasoner

  constructor(engine: TaskEngine, reasoner?: TaskReasoner) {
    this.engine = engine
    this.reasoner = reasoner
  }

  async context(request: ContextRequest): Promise<ContextResult> {
    validateRequest(request)
    if (request.mode !== undefined && !["continuation", "implementation", "review", "handoff", "planning", "summary"].includes(request.mode)) throw new Error("mode must be a supported context mode")
    const task = await this.resolveTask(request.taskId, request.query)
    const context = compileTaskContext(this.engine.getCurrentTask(task.id), request.mode)
    const relations = this.engine.getRelations(task.id)
    if (relations.length > 0) {
      context.relations = relations.map(({ fromTaskId, toTaskId, type }) => ({ fromTaskId, toTaskId, type }))
    }
    return { context, text: formatTaskContext(context) }
  }

  async handoff(request: HandoffRequest): Promise<HandoffResult> {
    const result = await this.context({ ...request, mode: "handoff" })
    return { ...result, targetAgent: request.targetAgent }
  }

  async run(request: RunRequest): Promise<RunResult> {
    validateRequest(request)
    if (typeof request.instruction !== "string" || !request.instruction.trim()) throw new Error("instruction is required")
    if (request.taskIds !== undefined && (!Array.isArray(request.taskIds) || request.taskIds.some((id) => typeof id !== "string" || !id.trim()))) throw new Error("taskIds must be an array of task IDs")
    if (!this.reasoner) throw new Error("run requires a configured TaskReasoner")
    const tasks = request.taskIds?.length
      ? request.taskIds.map((id) => this.engine.getTask(id))
      : this.engine.searchTasks(request.query ?? "", 20).map((task) => this.engine.getTask(task.id))
    const text = await this.reasoner.run({ instruction: request.instruction, tasks })
    return { text, taskIds: tasks.map((record) => record.task.id) }
  }

  async sync(request: SyncRequest): Promise<SyncResult> {
    validateRequest(request)
    if (!request || typeof request.conversation !== "string") throw new Error("conversation must be a string")
    if ("events" in request) throw new Error("events must not be supplied by a Host Agent")
    if (request.idempotencyKey !== undefined && (typeof request.idempotencyKey !== "string" || !request.idempotencyKey.trim())) throw new Error("idempotencyKey must be a nonempty string")
    const task = await this.resolveTask(request.taskId, request.task)
    const fingerprint = createHash("sha256").update(JSON.stringify([request.conversation, request.instruction ?? null, request.source ?? null])).digest("hex")
    const syncKey = request.idempotencyKey ?? (sourceSyncKey(request.source) ? `${sourceSyncKey(request.source)}:${fingerprint}` : undefined)
    const existing = syncKey ? this.engine.syncReceipt<SyncResult>(task.id, syncKey, fingerprint) : undefined
    if (existing) return existing
    const record = this.engine.getTask(task.id)
    const extracted = await this.extract(request, record)
    if (!Array.isArray(extracted)) throw new Error("Task Agent must return an event array")
    return this.engine.atomic(() => {
    const repeated = syncKey ? this.engine.syncReceipt<SyncResult>(task.id, syncKey, fingerprint) : undefined
    if (repeated) return repeated
    const appended: TaskEvent[] = []
    for (const item of extracted) {
      if (!isPersistable(item)) throw new Error("Task Agent returned an invalid durable event")
      const idempotencyKey = syncKey ? `${syncKey}:${eventFingerprint(item)}` : undefined
      if (idempotencyKey && this.engine.hasProcessed(task.id, idempotencyKey)) continue
      if (item.type === "artifact") {
        const uri = item.metadata?.uri
        const artifactType = item.metadata?.type
        if (typeof uri !== "string" || !isArtifactType(artifactType)) throw new Error("artifact event must include metadata.uri and metadata.type")
        const record = this.engine.linkArtifact({
          taskId: task.id,
          type: artifactType,
          uri,
          description: item.content,
          source: request.source,
          idempotencyKey,
        })
        appended.push(record.events.at(-1)!)
        continue
      }
      const input: AppendEventInput = { taskId: task.id, ...item, source: request.source, idempotencyKey }
      const record = this.engine.appendEvent(input)
      appended.push(record.events.at(-1)!)
    }
    const result = { task: this.engine.getTask(task.id).task, appended }
    if (syncKey) this.engine.saveSyncReceipt(task.id, syncKey, fingerprint, result)
    return result
    })
  }

  private async extract(request: SyncRequest, task: TaskRecord): Promise<ExtractedEvent[]> {
    if (!this.reasoner) {
      throw new Error("Natural-language sync requires a configured TaskReasoner")
    }
    return this.reasoner.extractEvents({ conversation: request.conversation, instruction: request.instruction, task })
  }

  private async resolveTask(taskId?: string, query?: string): Promise<Task> {
    if (taskId) return this.engine.getCurrentTask(taskId).task
    if (!query?.trim()) throw new Error("taskId or task query is required")
    let matches = this.engine.searchTasks(query, 5)
    const semanticFallback = matches.length === 0 && Boolean(this.reasoner)
    if (semanticFallback) matches = this.engine.searchTasks("", 20)
    if (matches.length === 0) throw new Error(`No task matched: ${query}`)
    if (this.reasoner && (matches.length > 1 || semanticFallback)) {
      const selectedId = await this.reasoner.selectTask({ query, candidates: matches })
      const selected = matches.find((task) => task.id === selectedId)
      if (selected) return selected
      throw new Error("No task matched unambiguously; provide taskId")
    }
    if (matches.length !== 1) throw new Error("Multiple tasks matched; provide taskId")
    return matches[0]!
  }
}

function isPersistable(event: ExtractedEvent): boolean {
  const allowed: EventType[] = ["decision", "progress", "finding", "constraint", "blocker", "blocker_resolved", "next_action", "artifact", "status"]
  return Boolean(event) && allowed.includes(event.type) && typeof event.content === "string" && Boolean(event.content.trim())
}

function validateRequest(request: unknown): void {
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("request must be an object")
  const fields = request as Record<string, unknown>
  for (const name of ["taskId", "query", "task", "instruction", "targetAgent"]) {
    if (fields[name] !== undefined && (typeof fields[name] !== "string" || !(fields[name] as string).trim())) throw new Error(`${name} must be a nonempty string`)
  }
  if (fields.source !== undefined) {
    if (!fields.source || typeof fields.source !== "object" || Array.isArray(fields.source)) throw new Error("source must be an object")
    for (const value of Object.values(fields.source)) {
      if (typeof value !== "string") throw new Error("source values must be strings")
    }
  }
}

function isArtifactType(value: unknown): value is "file" | "commit" | "pr" | "issue" | "document" | "url" | "test" | "other" {
  return ["file", "commit", "pr", "issue", "document", "url", "test", "other"].includes(String(value))
}

function sourceSyncKey(source?: EventSource): string | undefined {
  if (!source?.conversationId) return undefined
  return [source.agent ?? "unknown", source.sessionId ?? "unknown", source.conversationId].join(":")
}

function eventFingerprint(event: ExtractedEvent): string {
  return createHash("sha256").update(JSON.stringify([event.type, event.content, event.metadata ?? null])).digest("hex").slice(0, 24)
}
