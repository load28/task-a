import test from "node:test"
import assert from "node:assert/strict"
import { executionProgress, hostView, userPlanView } from "../packages/host-integration/src/presentation.ts"

test("호스트에는 실행 로그 대신 진행 정보와 응답에 필요한 질문만 전달한다", () => {
  const view = hostView({
    requestId: "one", phase: "submitted", state: "running", sessionID: "internal",
    text: "누적 중간 발화", activity: Array(100).fill({ tool: "read", status: "completed" }),
    progress: { currentTask: "디자인 토큰 구현", currentAction: "코드 수정", milestones: [] },
    blockedBy: { requestId: "other", state: "waiting", questions: [{ id: "q", sessionID: "internal", questions: [{ question: "색상 선택" }] }],
      permissions: [{ id: "p", permission: "bash", patterns: ["npm test"], metadata: { output: "긴 내부 기록" } }] },
  })
  assert.equal(view.progress.currentTask, "디자인 토큰 구현")
  assert.equal(view.activity, undefined)
  assert.equal(view.sessionID, undefined)
  assert.equal(view.result, undefined)
  assert.equal(view.blockedBy.questions[0].id, "q")
  assert.deepEqual(view.blockedBy.permissions[0], { id: "p", permission: "bash", patterns: ["npm test"] })
  assert.equal(hostView({ state: "completed", text: "빌드 통과" }).result, "빌드 통과")
})

test("사용자용 계획은 일반 언어로 투영하고 그래프 내부 정보를 제거한다", () => {
  const plan = userPlanView({ id: "plan-internal", title: "로그인 개선", summary: "안전하게 개선합니다", revision: 2, state: "awaiting_approval", approvalPrompt: "이 계획으로 진행할까요?", taskSpec: { writeScopes: ["secret"] }, nodes: [{ id: "node-internal", label: "현재 구조 확인", stage: "research", researchTrack: "repository", outcome: "영향 범위 확인", dependsOn: ["살펴보기"], status: "planned", taskId: "task-internal", role: "implementer" }] })
  assert.deepEqual(plan, { title: "로그인 개선", summary: "안전하게 개선합니다", revision: 2, state: "awaiting_approval", approvalPrompt: "이 계획으로 진행할까요?", approvalNeeded: true, nodes: [{ label: "현재 구조 확인", stage: "살펴보기", research: "현재 프로젝트 확인", outcome: "영향 범위 확인", dependsOn: ["살펴보기"], status: "planned" }] })
  assert.doesNotMatch(JSON.stringify(plan), /plan-internal|node-internal|task-internal|taskSpec|secret|implementer/)
})

test("계획 도구 결과는 진행 표시의 안전한 계획과 승인 상태가 된다", () => {
  const part = (tool: string, output: unknown) => ({ type: "tool", tool, state: { status: "completed", output: JSON.stringify(output), input: {} } })
  const progress = executionProgress([part("task_graph_work_plan_present", { userView: { title: "새 기능", nodes: [{ label: "검증", stage: "validation", taskId: "hidden" }], approvalPrompt: "승인할까요?" } })])
  assert.equal(progress.plan?.nodes?.[0]?.stage, "확인하기")
  assert.equal(progress.plan?.approvalNeeded, true)
  assert.doesNotMatch(JSON.stringify(progress.plan), /hidden/)
})

test("실제 태스크 결과에서 진행 사항을 추출하고 실패를 완료로 표시하지 않는다", () => {
  const part = (tool: string, status: string, output = "", input = {}) => ({ type: "tool", tool, state: { status, output, input } })
  const progress = executionProgress([
    part("task_graph_task_start", "completed", JSON.stringify({ title: "디자인 토큰 구현" })),
    part("task_graph_task_complete", "error"),
    part("bash", "running", "", { command: "npm run build" }),
  ])
  assert.equal(progress.currentTask, "디자인 토큰 구현")
  assert.match(progress.currentAction, /npm run build.*실행 중/)
  assert.deepEqual(progress.milestones, ["작업 시작: 디자인 토큰 구현"])
})
