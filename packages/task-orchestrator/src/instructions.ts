import type { IntegrationScenario, Requirement, Role, Task } from "#task-domain"

export interface PlanPromptInput {
  task: Task
  depth: number
  maxDepth: number
  attempt: number
  lastFailure?: string
}

export function planInstruction(input: PlanPromptInput): string {
  const lines = [
    "이 Task를 지금 실행할지, 더 분해할지, 사람에게 넘길지 판단한다.",
    "Atomic 기준: 1 Agent + 1 clear objective + 1 bounded context + 1 independently verifiable result.",
    "기준을 만족하면 decision=\"execute\".",
    "책임이 여럿 섞여 있으면 decision=\"decompose\"로 children을 제안한다. child는 책임이 겹치지 않아야 하고, 실행 순서가 필요하면 dependencies에 다른 child의 key 또는 title을 넣는다.",
    "정보가 부족하거나 사람의 결정이 필요하면 decision=\"blocked\"과 그 이유를 reason에 적는다.",
    `현재 분해 깊이 ${input.depth}, 허용 최대 깊이 ${input.maxDepth}.`,
  ]
  if (input.depth >= input.maxDepth) lines.push("최대 깊이에 도달했으므로 decompose를 선택하지 않는다.")
  if (input.lastFailure) lines.push(`직전 시도 실패 사유: ${input.lastFailure}`)
  lines.push("이 단계에서는 파일을 수정하지 않는다. 판단만 한다.")
  return lines.join("\n")
}

export interface ExecutePromptInput {
  task: Task
  workspace: string
  attempt: number
  lastFailure?: string
  verifyCommand?: string
}

export function executeInstruction(input: ExecutePromptInput): string {
  const lines = [
    "이 Atomic Task를 실제로 수행하고 결과를 제출한다.",
    `작업 디렉터리: ${input.workspace}`,
    "만들어낸 결과물은 artifacts에 넣는다. 코드 변경은 type=\"code\"이고 contentRef에 변경한 파일 경로를 적는다.",
    "조사 결과는 type=\"research\", 설계 결정은 type=\"decision\" 또는 \"architecture\"로 남기고 근거를 content에 적는다.",
    "acceptance criteria를 모두 충족했다면 verification.passed=true와 criteriaSatisfied에 criterion id를 전부 넣는다.",
    "충족하지 못했거나 확인하지 못했다면 status=\"failed\"와 failureReason을 적는다. 확인하지 않은 것을 통과로 보고하지 않는다.",
    "작업에서 배운 것이 있으면 learnings에 kind와 importance(1-10)와 함께 남긴다.",
  ]
  if (input.verifyCommand) {
    lines.push(`제출 전에 \`${input.verifyCommand}\`를 실행하고 실제 출력 요약을 verification.evidence에 넣는다.`)
  } else {
    lines.push("제출 전에 이 프로젝트의 검증 명령(테스트·타입체크·린트)을 찾아 실행하고 실제 출력 요약을 verification.evidence에 넣는다.")
  }
  if (input.lastFailure) lines.push(`직전 시도 실패 사유: ${input.lastFailure}. 같은 방식을 반복하지 않는다.`)
  return lines.join("\n")
}

export interface IntegrationPlanPromptInput {
  parent: Task
  memberCandidates: Array<{ name: string; type: string; producerTitle: string }>
  openRequirements: Requirement[]
  missing: string[]
}

export function integrationPlanInstruction(input: IntegrationPlanPromptInput): string {
  const lines = [
    "이 상위 Task의 자식 결과물들이 실제로 함께 동작하는지 검증할 Integration Set을 설계한다.",
    "Architecture Boundary 단위로만 묶는다. 모든 조합을 검증하지 않는다.",
    "각 Integration Set은 멤버가 2개 이상이어야 하고, 모든 멤버는 최소 하나의 시나리오에 participant로 등장해야 한다.",
    "members와 participants에는 아래 후보 목록의 Artifact 이름을 그대로 쓴다.",
    "검증할 조합이 없다면 needed=false와 이유를 적는다.",
    "",
    "멤버 후보",
    ...input.memberCandidates.map((member) => `- ${member.name} (${member.type}, from ${member.producerTitle})`),
  ]
  if (input.openRequirements.length > 0) {
    lines.push(
      "",
      "아직 충족되지 않은 Requirement — 각 시나리오의 requirementIds에 해당 id를 넣어 검증 대상으로 삼는다",
      ...input.openRequirements.map((requirement) => `- ${requirement.id}: ${requirement.description}`),
    )
  }
  if (input.missing.length > 0) {
    lines.push("", "상위 Task 완료를 막고 있는 항목", ...input.missing.map((item) => `- ${item}`))
  }
  return lines.join("\n")
}

export interface IntegrationVerifyPromptInput {
  setName: string
  workspace: string
  scenarios: IntegrationScenario[]
  members: Array<{ name: string; version: number }>
}

export function integrationVerifyInstruction(input: IntegrationVerifyPromptInput): string {
  const lines = [
    `Integration Set "${input.setName}"의 시나리오를 실제로 실행하고 결과를 판정한다.`,
    `작업 디렉터리: ${input.workspace}`,
    "각 시나리오마다 scenarioId를 그대로 돌려주고, 실행해서 관찰한 것을 observed에 적는다.",
    "실행하지 못한 시나리오는 passed로 보고하지 않는다.",
    "하나라도 실패하면 failure.type으로 원인을 분류하고 affectedTaskIds와 recommendedActions를 적는다.",
    "",
    "검증 대상 버전 조합",
    ...input.members.map((member) => `- ${member.name}@${member.version}`),
    "",
    "시나리오",
  ]
  for (const scenario of input.scenarios) {
    lines.push(`- ${scenario.id} — ${scenario.name}`)
    for (const behavior of scenario.expectedBehavior) lines.push(`  기대: ${behavior}`)
  }
  return lines.join("\n")
}

export function roleSystemPrompt(role: Role | undefined, briefing: string | undefined): string | undefined {
  if (!role || !briefing) return undefined
  return [
    "너는 Task Agent의 Worker로서 하나의 Task만 수행한다.",
    "상태 전이와 검증 판단은 Engine이 한다. 너는 결과만 제출한다.",
    "요청된 JSON 스키마에 맞는 구조화 출력만 최종 결과로 제출한다.",
    "",
    briefing,
  ].join("\n")
}
