import type { Role, Task, TaskCategory } from "#task-domain"
import type { TaskGraphStore } from "#task-store"

export const DEFAULT_ROLES: Role[] = [
  {
    id: "researcher",
    name: "Researcher",
    description: "질문을 정의하고 근거를 수집해 조사 Artifact를 만든다",
    principles: [
      "추측하지 않고 확인한 근거만 기록한다",
      "출처를 Artifact 본문에 남긴다",
      "조사 범위를 벗어나는 구현 결정을 내리지 않는다",
    ],
    capabilities: ["코드베이스 탐색", "외부 문서 조사", "제약 조건 정리"],
    allowedTools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
    constraints: ["소스 파일을 수정하지 않는다"],
  },
  {
    id: "architect",
    name: "Architect",
    description: "경계와 계약을 정하고 architecture/decision Artifact를 만든다",
    principles: [
      "경계는 책임 단위로 나누고 의존 방향을 한쪽으로 고정한다",
      "결정에는 대안과 근거를 함께 남긴다",
      "구현 세부는 하위 Task에 위임한다",
    ],
    capabilities: ["분해 설계", "계약 정의", "통합 경계 식별"],
    allowedTools: ["Read", "Glob", "Grep", "WebFetch", "WebSearch"],
    constraints: ["소스 파일을 수정하지 않는다"],
  },
  {
    id: "implementer",
    name: "Implementer",
    description: "하나의 Atomic Task를 구현하고 로컬 검증까지 마친다",
    principles: [
      "Task 목표 밖의 파일을 바꾸지 않는다",
      "기존 코드의 표기와 구조를 따른다",
      "제출 전에 프로젝트의 검증 명령을 실행한다",
    ],
    capabilities: ["코드 작성", "테스트 작성", "로컬 검증 실행"],
    allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash"],
    constraints: ["검증되지 않은 결과를 completed로 제출하지 않는다"],
  },
  {
    id: "qa",
    name: "QA",
    description: "Acceptance Criteria와 Integration Scenario를 실제로 확인한다",
    principles: [
      "관찰한 출력만 근거로 삼는다",
      "통과하지 못한 것을 통과로 보고하지 않는다",
      "실패는 재현 방법과 함께 기록한다",
    ],
    capabilities: ["시나리오 실행", "결과 판정", "실패 증거 수집"],
    allowedTools: ["Read", "Glob", "Grep", "Bash"],
    constraints: ["검증 대상 코드를 수정하지 않는다"],
  },
  {
    id: "diagnostician",
    name: "Diagnostician",
    description: "실패 원인을 분류하고 영향 범위를 좁힌다",
    principles: [
      "증상과 원인을 분리해 기록한다",
      "원인을 특정하기 전에 수정하지 않는다",
      "재발 방지 교훈을 Learning으로 남긴다",
    ],
    capabilities: ["원인 분석", "영향 범위 판단", "재현 절차 작성"],
    allowedTools: ["Read", "Glob", "Grep", "Bash", "WebFetch"],
    constraints: ["원인 분석 범위를 넘는 리팩터링을 하지 않는다"],
  },
]

const CATEGORY_ROLES: Record<TaskCategory, string> = {
  requirement: "researcher",
  research: "researcher",
  architecture: "architect",
  implementation: "implementer",
  qa: "qa",
  integration: "qa",
  diagnostic: "diagnostician",
  general: "implementer",
}

export function seedDefaultRoles(store: TaskGraphStore): Role[] {
  for (const role of DEFAULT_ROLES) {
    if (!store.findRole(role.id)) store.upsertRole(role)
  }
  return DEFAULT_ROLES.map((role) => store.findRole(role.id)!)
}

export function resolveRole(store: TaskGraphStore, task: Task): Role | undefined {
  if (task.assignedRole) {
    const assigned = store.findRole(task.assignedRole)
    if (assigned) return assigned
  }
  return store.findRole(CATEGORY_ROLES[task.category])
}

export function planningRole(store: TaskGraphStore): Role | undefined {
  return store.findRole("architect")
}

export function verificationRole(store: TaskGraphStore): Role | undefined {
  return store.findRole("qa")
}

export function formatRoleBriefing(role: Role): string {
  const sections: Array<[string, string | string[]]> = [
    ["Role", `${role.name} — ${role.description}`],
    ["Principles", role.principles],
    ["Capabilities", role.capabilities],
    ["Constraints", role.constraints],
  ]
  return sections
    .filter(([, value]) => !Array.isArray(value) || value.length > 0)
    .map(([title, value]) => `${title}\n${Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : value}`)
    .join("\n\n")
}
