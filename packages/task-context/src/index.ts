import type { TaskRecord } from "#task-domain"

export type ContextMode = "continuation" | "implementation" | "review" | "handoff" | "planning" | "summary"

export interface ExecutableTaskContext {
  task: { id: string; title: string; status: string }
  objective: string
  currentState: string
  constraints: string[]
  importantDecisions: string[]
  recentProgress: string[]
  blockers: string[]
  findings?: string[]
  artifacts?: Array<{ type: string; uri: string; description?: string }>
  relations?: Array<{ fromTaskId: string; toTaskId: string; type: string }>
  nextActions: string[]
}

export function compileTaskContext(record: TaskRecord, mode: ContextMode = "continuation"): ExecutableTaskContext {
  const { task, snapshot } = record
  const base: ExecutableTaskContext = {
    task: { id: task.id, title: task.title, status: snapshot.status },
    objective: snapshot.objective,
    currentState: snapshot.currentState,
    constraints: snapshot.constraints,
    importantDecisions: snapshot.activeDecisions,
    recentProgress: snapshot.recentProgress.slice(-5),
    blockers: snapshot.blockers,
    nextActions: snapshot.nextActions,
  }

  if (["implementation", "review", "handoff"].includes(mode)) {
    base.artifacts = snapshot.relevantArtifacts.map(({ type, uri, description }) => ({ type, uri, description }))
  }
  if (["continuation", "implementation", "handoff", "review", "planning", "summary"].includes(mode)) {
    base.findings = snapshot.findings.slice(-5)
  }
  return base
}

export function formatTaskContext(context: ExecutableTaskContext): string {
  const sections: Array<[string, string | string[] | undefined]> = [
    ["Task", `${context.task.title} (${context.task.status}, ${context.task.id})`],
    ["Objective", context.objective],
    ["Current State", context.currentState],
    ["Constraints", context.constraints],
    ["Important Decisions", context.importantDecisions],
    ["Recent Progress", context.recentProgress],
    ["Blockers", context.blockers],
    ["Findings", context.findings],
    ["Artifacts", context.artifacts?.map((item) => `${item.type}: ${item.uri}${item.description ? ` — ${item.description}` : ""}`)],
    ["Relations", context.relations?.map((item) => `${item.fromTaskId} -[${item.type}]-> ${item.toTaskId}`)],
    ["Next Actions", context.nextActions],
  ]
  return sections
    .filter(([, value]) => value !== undefined)
    .map(([title, value]) => `${title}\n${Array.isArray(value) ? (value.length ? value.map((item) => `- ${item}`).join("\n") : "None recorded.") : value}`)
    .join("\n\n")
}
