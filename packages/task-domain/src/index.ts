export type TaskStatus = "planned" | "active" | "blocked" | "completed" | "cancelled"

export interface Task {
  id: string
  title: string
  objective: string
  status: TaskStatus
  parentTaskId?: string
  createdAt: string
  updatedAt: string
}

export type EventType =
  | "task_created"
  | "task_updated"
  | "decision"
  | "progress"
  | "finding"
  | "constraint"
  | "constraint_removed"
  | "blocker"
  | "blocker_resolved"
  | "next_action"
  | "next_action_completed"
  | "artifact"
  | "relation"
  | "status"

export interface EventSource {
  agent?: string
  sessionId?: string
  conversationId?: string
}

export interface TaskEvent {
  id: string
  taskId: string
  type: EventType
  content: string
  metadata?: Record<string, unknown>
  source?: EventSource
  dedupeKey?: string
  createdAt: string
}

export type ArtifactType = "file" | "commit" | "pr" | "issue" | "document" | "url" | "test" | "other"

export interface ArtifactRef {
  id: string
  taskId: string
  type: ArtifactType
  uri: string
  description?: string
  createdAt: string
}

export interface TaskSnapshot {
  objective: string
  status: TaskStatus
  currentState: string
  constraints: string[]
  activeDecisions: string[]
  blockers: string[]
  recentProgress: string[]
  findings: string[]
  nextActions: string[]
  relevantArtifacts: ArtifactRef[]
  updatedAt: string
}

export interface TaskRecord {
  task: Task
  events: TaskEvent[]
  snapshot: TaskSnapshot
  artifacts: ArtifactRef[]
}

export type TaskRelationType = "parent" | "child" | "depends_on" | "blocks" | "related" | "supersedes"

export interface TaskRelation {
  id: string
  fromTaskId: string
  toTaskId: string
  type: TaskRelationType
  createdAt: string
}
