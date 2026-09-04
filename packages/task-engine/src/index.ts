import { randomUUID } from "node:crypto"
import type {
  ArtifactRef,
  ArtifactType,
  EventSource,
  EventType,
  Task,
  TaskEvent,
  TaskRecord,
  TaskSnapshot,
  TaskStatus,
  TaskRelation,
  TaskRelationType,
} from "#task-domain"
import { projectSnapshot } from "./project-snapshot.ts"

export interface TaskRepository {
  transaction<T>(operation: () => T): T
  create(task: Task, event: TaskEvent, snapshot: TaskSnapshot): void
  find(id: string): Task | undefined
  search(query: string, limit: number): Task[]
  events(taskId: string): TaskEvent[]
  artifacts(taskId: string): ArtifactRef[]
  snapshot(taskId: string): TaskSnapshot | undefined
  append(event: TaskEvent, task: Task, snapshot: TaskSnapshot): void
  addArtifact(artifact: ArtifactRef, event: TaskEvent, task: Task, snapshot: TaskSnapshot): void
  findEventByDedupeKey(taskId: string, dedupeKey: string): TaskEvent | undefined
  addRelation(relation: TaskRelation): void
  relations(taskId: string): TaskRelation[]
  receipt(taskId: string, key: string): { fingerprint: string; result: string } | undefined
  saveReceipt(taskId: string, key: string, fingerprint: string, result: string): void
}

export interface CreateTaskInput {
  title: string
  objective: string
  status?: TaskStatus
  parentTaskId?: string
  source?: EventSource
}

export interface AppendEventInput {
  taskId: string
  type: EventType
  content: string
  metadata?: Record<string, unknown>
  source?: EventSource
  idempotencyKey?: string
}

export class TaskEngine {
  syncReceipt<T>(taskId: string, key: string, fingerprint: string): T | undefined {
    const receipt = this.repository.receipt(taskId, key)
    if (!receipt) return undefined
    if (receipt.fingerprint !== fingerprint) throw new Error("idempotencyKey must not be reused with different input")
    return JSON.parse(receipt.result) as T
  }

  saveSyncReceipt(taskId: string, key: string, fingerprint: string, result: unknown): void {
    this.repository.saveReceipt(taskId, key, fingerprint, JSON.stringify(result))
  }

  atomic<T>(operation: () => T): T {
    return this.repository.transaction(operation)
  }
  private repository: TaskRepository

  constructor(repository: TaskRepository) {
    this.repository = repository
  }

  createTask(...args: Parameters<TaskEngine["createTaskLocked"]>): TaskRecord {
    return this.repository.transaction(() => this.createTaskLocked(...args))
  }

  private createTaskLocked(input: CreateTaskInput): TaskRecord {
    requireText(input.title, "title")
    requireText(input.objective, "objective")
    if (input.status && !isTaskStatus(input.status)) throw new Error(`Invalid task status: ${input.status}`)
    if (input.parentTaskId) this.requireTask(input.parentTaskId)
    const now = new Date().toISOString()
    const task: Task = {
      id: randomUUID(),
      title: input.title.trim(),
      objective: input.objective.trim(),
      status: input.status ?? "planned",
      parentTaskId: input.parentTaskId,
      createdAt: now,
      updatedAt: now,
    }
    const event = makeEvent(task.id, "task_created", task.title, { title: task.title, objective: task.objective, status: task.status, parentTaskId: task.parentTaskId }, input.source, now)
    const snapshot = projectSnapshot(task, [event], [])
    this.repository.create(task, event, snapshot)
    if (input.parentTaskId) {
      this.repository.addRelation({
        id: randomUUID(),
        fromTaskId: input.parentTaskId,
        toTaskId: task.id,
        type: "parent",
        createdAt: now,
      })
    }
    return { task, events: [event], snapshot, artifacts: [] }
  }

  searchTasks(query: string, limit = 10): Task[] {
    return this.repository.search(query.trim(), Math.max(1, Math.min(limit, 50)))
  }

  getTask(...args: Parameters<TaskEngine["getTaskLocked"]>): TaskRecord {
    return this.repository.transaction(() => this.getTaskLocked(...args))
  }

  getCurrentTask(taskId: string): TaskRecord {
    return this.repository.transaction(() => {
      const task = this.requireTask(taskId)
      const snapshot = this.repository.snapshot(taskId)
      if (!snapshot) return this.getTask(taskId)
      return { task, snapshot, artifacts: snapshot.relevantArtifacts, events: [] }
    })
  }

  private getTaskLocked(taskId: string): TaskRecord {
    const task = this.requireTask(taskId)
    const events = this.repository.events(taskId)
    const artifacts = this.repository.artifacts(taskId)
    const snapshot = this.repository.snapshot(taskId) ?? projectSnapshot(task, events, artifacts)
    return { task, events, snapshot, artifacts }
  }

  updateTask(...args: Parameters<TaskEngine["updateTaskLocked"]>): TaskRecord {
    return this.repository.transaction(() => this.updateTaskLocked(...args))
  }

  private updateTaskLocked(taskId: string, changes: { title?: string; objective?: string }, source?: EventSource): TaskRecord {
    const task = this.requireTask(taskId)
    if (changes.title !== undefined) requireText(changes.title, "title")
    if (changes.objective !== undefined) requireText(changes.objective, "objective")
    const now = new Date().toISOString()
    const updated: Task = {
      ...task,
      title: changes.title?.trim() ?? task.title,
      objective: changes.objective?.trim() ?? task.objective,
      updatedAt: now,
    }
    const metadata = { title: updated.title, objective: updated.objective }
    const event = makeEvent(taskId, "task_updated", "Task metadata updated", metadata, source, now)
    return this.persistEvent(updated, event)
  }

  appendEvent(...args: Parameters<TaskEngine["appendEventLocked"]>): TaskRecord {
    return this.repository.transaction(() => this.appendEventLocked(...args))
  }

  private appendEventLocked(input: AppendEventInput): TaskRecord {
    requireText(input.content, "content")
    if (!isAppendableEventType(input.type)) throw new Error(`Invalid appendable event type: ${input.type}`)
    if (input.idempotencyKey && this.repository.findEventByDedupeKey(input.taskId, input.idempotencyKey)) {
      return this.getTask(input.taskId)
    }
    const task = this.requireTask(input.taskId)
    const priorEvents = this.repository.events(input.taskId)
    if (input.type === "status" && !isTaskStatus(input.metadata?.status)) {
      throw new Error("status event requires metadata.status")
    }
    if (input.type === "blocker_resolved") {
      const resolves = input.metadata?.resolves
      if (typeof resolves !== "string" || !activeEventIds(priorEvents, "blocker", "blocker_resolved", "resolves").has(resolves)) {
        throw new Error("blocker_resolved event requires metadata.resolves referencing an active blocker")
      }
    }
    if (input.type === "decision" && input.metadata?.supersedes !== undefined) {
      const supersedes = input.metadata.supersedes
      if (typeof supersedes !== "string" || !activeEventIds(priorEvents, "decision", "decision", "supersedes").has(supersedes)) {
        throw new Error("decision metadata.supersedes must reference an active decision")
      }
    }
    const now = new Date().toISOString()
    const nextStatus = input.type === "status" && isTaskStatus(input.metadata?.status)
      ? input.metadata.status
      : task.status
    const updated = { ...task, status: nextStatus, updatedAt: now }
    const event = makeEvent(task.id, input.type, input.content.trim(), input.metadata, input.source, now, input.idempotencyKey)
    return this.persistEvent(updated, event)
  }

  completeTask(taskId: string, content = "Task completed", source?: EventSource): TaskRecord {
    return this.appendEvent({ taskId, type: "status", content, metadata: { status: "completed" }, source })
  }

  linkArtifact(...args: Parameters<TaskEngine["linkArtifactLocked"]>): TaskRecord {
    return this.repository.transaction(() => this.linkArtifactLocked(...args))
  }

  private linkArtifactLocked(input: {
    taskId: string
    type: ArtifactType
    uri: string
    description?: string
    source?: EventSource
    idempotencyKey?: string
  }): TaskRecord {
    requireText(input.uri, "uri")
    if (!isArtifactType(input.type)) throw new Error(`Invalid artifact type: ${input.type}`)
    if (input.idempotencyKey && this.repository.findEventByDedupeKey(input.taskId, input.idempotencyKey)) {
      return this.getTask(input.taskId)
    }
    const task = this.requireTask(input.taskId)
    const now = new Date().toISOString()
    const artifact: ArtifactRef = {
      id: randomUUID(),
      taskId: task.id,
      type: input.type,
      uri: input.uri.trim(),
      description: input.description?.trim(),
      createdAt: now,
    }
    const event = makeEvent(task.id, "artifact", input.description?.trim() || artifact.uri, { artifactId: artifact.id, artifact }, input.source, now, input.idempotencyKey)
    const updated = { ...task, updatedAt: now }
    const events = [...this.repository.events(task.id), event]
    const artifacts = [...this.repository.artifacts(task.id), artifact]
    const snapshot = projectSnapshot(updated, events, artifacts)
    this.repository.addArtifact(artifact, event, updated, snapshot)
    return { task: updated, events, snapshot, artifacts }
  }

  addRelation(...args: Parameters<TaskEngine["addRelationLocked"]>): TaskRelation {
    return this.repository.transaction(() => this.addRelationLocked(...args))
  }

  private addRelationLocked(fromTaskId: string, toTaskId: string, type: TaskRelationType): TaskRelation {
    if (type === "child") return this.addRelation(toTaskId, fromTaskId, "parent")
    this.requireTask(fromTaskId)
    this.requireTask(toTaskId)
    if (fromTaskId === toTaskId) throw new Error("A task cannot relate to itself")
    if (!isRelationType(type)) throw new Error(`Invalid task relation type: ${type}`)
    const existing = this.repository.relations(fromTaskId).find((item) => item.fromTaskId === fromTaskId && item.toTaskId === toTaskId && item.type === type)
    if (existing) return existing
    if (type === "parent") {
      const child = this.requireTask(toTaskId)
      if (child.parentTaskId && child.parentTaskId !== fromTaskId) throw new Error("Task already has a different parent")
      const visited = new Set<string>()
      let ancestor: Task | undefined = this.requireTask(fromTaskId)
      while (ancestor) {
        if (ancestor.id === toTaskId || visited.has(ancestor.id)) throw new Error("Task hierarchy must not contain a cycle")
        visited.add(ancestor.id)
        ancestor = ancestor.parentTaskId ? this.requireTask(ancestor.parentTaskId) : undefined
      }
      const now = new Date().toISOString()
      this.persistEvent({ ...child, parentTaskId: fromTaskId, updatedAt: now },
        makeEvent(toTaskId, "task_updated", "Task parent linked", { parentTaskId: fromTaskId }, undefined, now))
    }
    const relation: TaskRelation = { id: randomUUID(), fromTaskId, toTaskId, type, createdAt: new Date().toISOString() }
    this.repository.addRelation(relation)
    const task = this.requireTask(fromTaskId)
    this.persistEvent({ ...task, updatedAt: relation.createdAt },
      makeEvent(fromTaskId, "relation", `Task relation added: ${type}`, { relation }, undefined, relation.createdAt))
    return relation
  }

  getRelations(taskId: string): TaskRelation[] {
    this.requireTask(taskId)
    return this.repository.relations(taskId)
  }

  hasProcessed(taskId: string, idempotencyKey: string): boolean {
    return Boolean(this.repository.findEventByDedupeKey(taskId, idempotencyKey))
  }

  private persistEvent(task: Task, event: TaskEvent): TaskRecord {
    const events = [...this.repository.events(task.id), event]
    const artifacts = this.repository.artifacts(task.id)
    const snapshot = projectSnapshot(task, events, artifacts)
    this.repository.append(event, task, snapshot)
    return { task, events, snapshot, artifacts }
  }

  private requireTask(taskId: string): Task {
    const task = this.repository.find(taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    return task
  }
}

function makeEvent(
  taskId: string,
  type: EventType,
  content: string,
  metadata: Record<string, unknown> | undefined,
  source: EventSource | undefined,
  createdAt: string,
  dedupeKey?: string,
): TaskEvent {
  return { id: randomUUID(), taskId, type, content, metadata, source, dedupeKey, createdAt }
}

function requireText(value: string, field: string): void {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must not be empty`)
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return ["planned", "active", "blocked", "completed", "cancelled"].includes(String(value))
}

function isAppendableEventType(value: unknown): value is AppendEventInput["type"] {
  return ["decision", "progress", "finding", "constraint", "blocker", "blocker_resolved", "next_action", "status"].includes(String(value))
}

function isArtifactType(value: unknown): value is ArtifactType {
  return ["file", "commit", "pr", "issue", "document", "url", "test", "other"].includes(String(value))
}

function isRelationType(value: unknown): value is TaskRelationType {
  return ["parent", "child", "depends_on", "blocks", "related", "supersedes"].includes(String(value))
}

function activeEventIds(events: TaskEvent[], addType: EventType, removeType: EventType, metadataKey: string): Set<string> {
  const active = new Set<string>()
  for (const event of events) {
    if (event.type === removeType) {
      const removed = event.metadata?.[metadataKey]
      if (typeof removed === "string") active.delete(removed)
    }
    if (event.type === addType) active.add(event.id)
  }
  return active
}

export { projectSnapshot } from "./project-snapshot.ts"
