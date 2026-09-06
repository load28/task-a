/** Host-facing projection. Full execution records remain in the server and relay. */
export function hostView(raw: any, depth = 0): Record<string, any> {
  const view: Record<string, any> = { requestId: raw.requestId, phase: raw.phase, state: raw.state ?? raw.phase }
  if (raw.progress) view.progress = projectProgress(raw.progress)
  if (raw.text && raw.state !== "running") view.result = raw.text
  if (raw.error) view.error = raw.error
  if (raw.questions?.length) view.questions = raw.questions.map((q: any) => ({ id: q.id, questions: q.questions }))
  if (raw.permissions?.length)
    view.permissions = raw.permissions.map((p: any) => ({ id: p.id, permission: p.permission, patterns: p.patterns }))
  if (depth < 3) for (const key of ["blockedBy", "activeRequest"])
    if (raw[key]) view[key] = hostView(raw[key], depth + 1)
  return view
}

const stageLabels: Record<string, string> = { research: "살펴보기", design: "설계하기", implementation: "만들기", validation: "확인하기" }
const researchLabels: Record<string, string> = { repository: "현재 프로젝트 확인", external_examples: "유사 사례 조사", official_documentation: "공식 자료 확인" }

/** Remove graph implementation details before a plan crosses the host boundary. */
export function userPlanView(plan: any): Record<string, any> | undefined {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.nodes)) return
  const nodes = plan.nodes.filter((node: any) => node && typeof node.label === "string").map((node: any) => ({
    label: node.label, stage: stageLabels[node.stage] ?? "계획",
    ...(researchLabels[node.researchTrack] ? { research: researchLabels[node.researchTrack] } : {}),
    ...(typeof node.outcome === "string" ? { outcome: node.outcome } : {}),
    ...(Array.isArray(node.dependsOn) && node.dependsOn.length ? { dependsOn: node.dependsOn.filter((x: unknown) => typeof x === "string") } : {}),
    ...(typeof node.status === "string" ? { status: node.status } : {}),
  }))
  return { ...(typeof plan.title === "string" ? { title: plan.title } : {}), ...(typeof plan.summary === "string" ? { summary: plan.summary } : {}), ...(typeof plan.revision === "number" ? { revision: plan.revision } : {}), ...(typeof plan.state === "string" ? { state: plan.state } : {}), nodes, ...(typeof plan.approvalPrompt === "string" ? { approvalPrompt: plan.approvalPrompt, approvalNeeded: true } : {}), ...(plan.impact && typeof plan.impact === "object" ? { impact: plan.impact } : {}) }
}

function projectProgress(progress: any): Record<string, any> {
  const view = { ...progress }
  const plan = userPlanView(progress.plan)
  if (plan) view.plan = plan
  else delete view.plan
  return view
}

/** Summarize observed actions, without another model call or invented completion. */
export function executionProgress(parts: any[]) {
  const milestones: string[] = []
  let currentTask: string | undefined
  let currentAction = "요청을 분석하고 있습니다"
  let plan: Record<string, any> | undefined
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
    if (done && /(?:work_plan|work-plan)/.test(p.tool)) {
      plan = userPlanView(result?.userView ?? result?.plan ?? result)
      if (plan) currentAction = plan.approvalNeeded ? "계획 승인을 기다리고 있습니다" : "사용자용 작업 계획을 준비했습니다"
    }
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
  return { ...(currentTask ? { currentTask } : {}), ...(plan ? { plan } : {}), currentAction, milestones: [...new Set(milestones)].slice(-3) }
}
