import type { ArtifactRef, Task, TaskEvent, TaskSnapshot, TaskStatus } from "#task-domain"

export function projectSnapshot(task: Task, events: TaskEvent[], artifacts: ArtifactRef[]): TaskSnapshot {
  let objective = task.objective
  let status: TaskStatus = task.status
  const constraints: string[] = []
  const decisions = new Map<string, string>()
  const blockers = new Map<string, string>()
  const progress: string[] = []
  const findings: string[] = []
  const nextActions: string[] = []

  for (const event of events) {
    switch (event.type) {
      case "task_created":
        if (typeof event.metadata?.objective === "string") objective = event.metadata.objective
        if (isTaskStatus(event.metadata?.status)) status = event.metadata.status
        break
      case "task_updated":
        if (typeof event.metadata?.objective === "string") objective = event.metadata.objective
        break
      case "decision": {
        const supersedes = event.metadata?.supersedes
        if (typeof supersedes === "string") decisions.delete(supersedes)
        decisions.set(event.id, event.content)
        break
      }
      case "constraint":
        if (!constraints.includes(event.content)) constraints.push(event.content)
        break
      case "progress":
        progress.push(event.content)
        break
      case "finding":
        findings.push(event.content)
        break
      case "blocker":
        blockers.set(event.id, event.content)
        break
      case "blocker_resolved": {
        const resolves = event.metadata?.resolves
        if (typeof resolves === "string") blockers.delete(resolves)
        break
      }
      case "next_action":
        nextActions.push(event.content)
        break
      case "status":
        if (isTaskStatus(event.metadata?.status)) status = event.metadata.status
        break
    }
  }

  return {
    objective,
    status,
    currentState: progress.at(-1) ?? objective,
    constraints,
    activeDecisions: [...decisions.values()],
    blockers: [...blockers.values()],
    recentProgress: progress.slice(-10),
    findings: findings.slice(-10),
    nextActions: nextActions.slice(-10),
    relevantArtifacts: artifacts,
    updatedAt: events.at(-1)?.createdAt ?? task.updatedAt,
  }
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return ["planned", "active", "blocked", "completed", "cancelled"].includes(String(value))
}
