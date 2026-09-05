/** Host-facing projection. Full execution records remain in the server and relay. */
export function hostView(raw: any, depth = 0): Record<string, any> {
  const view: Record<string, any> = { requestId: raw.requestId, phase: raw.phase, state: raw.state ?? raw.phase }
  if (raw.progress) view.progress = raw.progress
  if (raw.text && raw.state !== "running") view.result = raw.text
  if (raw.error) view.error = raw.error
  if (raw.questions?.length) view.questions = raw.questions.map((q: any) => ({ id: q.id, questions: q.questions }))
  if (raw.permissions?.length)
    view.permissions = raw.permissions.map((p: any) => ({ id: p.id, permission: p.permission, patterns: p.patterns }))
  if (depth < 3) for (const key of ["blockedBy", "activeRequest"])
    if (raw[key]) view[key] = hostView(raw[key], depth + 1)
  return view
}

/** Summarize observed actions, without another model call or invented completion. */
export function executionProgress(parts: any[]) {
  const milestones: string[] = []
  let currentTask: string | undefined
  let currentAction = "요청을 분석하고 있습니다"
  for (const p of parts) {
    if (p.type !== "tool") continue
    const done = p.state.status === "completed"
    let result: any
    if (done && typeof p.state.output === "string") {
      try { result = JSON.parse(p.state.output) } catch {}
    }
    if (p.tool === "task_graph_task_start" && done && result?.title) {
      currentTask = result.title
      milestones.push(`작업 시작: ${result.title}`)
    }
    if (p.tool === "task_graph_task_complete" && done) {
      milestones.push(`작업 검증 완료: ${result?.title ?? currentTask ?? "하위 태스크"}`)
    }
    if (p.tool === "task_graph_integration_report" && done && result?.run?.status === "passed")
      milestones.push("통합 검증 통과")
    if (p.tool === "bash") {
      const command = String(p.state.input?.command ?? "명령").split("\n")[0]!.slice(0, 160)
      currentAction = `${command} — ${done ? "실행 완료" : p.state.status === "error" ? "오류 확인 중" : "실행 중"}`
    } else if (["edit", "write", "apply_patch"].includes(p.tool)) {
      currentAction = done ? "코드 변경을 적용했습니다" : "코드를 수정하고 있습니다"
    } else if (["read", "glob", "grep"].includes(p.tool)) {
      currentAction = "프로젝트 구조와 기존 코드를 확인하고 있습니다"
    } else if (p.tool === "task") {
      currentAction = `작업 에이전트: ${String(p.state.input?.description ?? "위임 작업 진행 중").slice(0, 160)}`
    } else if (p.tool.startsWith("task_graph_integration")) {
      currentAction = "통합 검증 결과를 확인하고 있습니다"
    }
  }
  return { ...(currentTask ? { currentTask } : {}), currentAction, milestones: [...new Set(milestones)].slice(-3) }
}
