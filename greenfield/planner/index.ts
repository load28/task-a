import { canonical, parseGraphBundle } from "../contracts/index.ts"
import type { GraphBundle, JsonValue, Planner } from "../contracts/model.ts"
import { validateGraph } from "../kernel/graph.ts"

export const DECOMPOSITION_REQUIREMENTS = {
  protocol: "task-agent/graph-proposal-v1",
  output: "GraphBundle",
  rules: [
    "목표를 단일 목적과 출력 책임을 가진 실행 leaf 및 group으로 분해한다.",
    "계약을 먼저 선언하고 정확한 revision을 참조하는 입력·출력 포트, argv 설계, 독립 검증기를 제시한다.",
    "의존성을 consumes와 after로 구분하고 순환 없는 그래프를 만든다. 독립 작업 사이에 불필요한 의존성을 만들지 않는다.",
    "여러 결과를 조합해야 하는 목표는 integration leaf와 필수 완료 target을 명시한다.",
    "책임 분해와 요구 해석의 검토 근거를 reviewEvidence에 기록한다. 근거 없는 성공·검증 증거를 생성하지 않는다.",
    "current가 있으면 그 graph identity와 정확한 현재 revision을 기준으로 다음 전체 proposal을 작성한다.",
    "feedback이 있으면 지적된 오류를 수정한 전체 GraphBundle JSON을 반환한다.",
  ],
} as const
export interface ProposalFeedback { attempt: number; issues: string[]; previousProposal?: JsonValue }
export interface ProposalInput { objective: string; current?: GraphBundle; requirements?: typeof DECOMPOSITION_REQUIREMENTS; feedback?: ProposalFeedback }
export interface ProposalSource { propose(input: ProposalInput): Promise<unknown> }
export interface PlannerOptions { maxRepairs?: number }
export class ProposalValidationError extends Error {
  readonly code = "invalid_proposal"
  readonly attempts: number
  readonly issues: string[]
  constructor(attempts: number, issues: string[]) { super(`Proposal invalid after ${attempts} attempts: ${issues.join("; ")}`); this.name = "ProposalValidationError"; this.attempts = attempts; this.issues = issues }
}

/** A proposal is untrusted until both wire contracts and graph semantics pass. */
export class GraphPlanner implements Planner {
  private readonly source: ProposalSource
  private readonly maxRepairs: number
  constructor(source: ProposalSource, options: PlannerOptions = {}) {
    this.source = source; this.maxRepairs = options.maxRepairs ?? 2
    if (!Number.isSafeInteger(this.maxRepairs) || this.maxRepairs < 0 || this.maxRepairs > 10) throw new Error("maxRepairs must be an integer from zero to ten")
  }
  async propose(input: ProposalInput): Promise<GraphBundle> {
    if (!input.objective.trim()) throw new Error("An objective is required")
    if (input.current) validateGraph(input.current)
    const base: ProposalInput = { objective: input.objective, ...(input.current ? { current: input.current } : {}), requirements: DECOMPOSITION_REQUIREMENTS }
    let feedback: ProposalFeedback | undefined
    for (let attempt = 0; attempt <= this.maxRepairs; attempt++) {
      let raw: unknown, issues: string[]
      try { raw = await this.source.propose(JSON.parse(canonical({ ...base, ...(feedback ? { feedback } : {}) })) as ProposalInput) }
      catch (error) {
        if (!(error instanceof SyntaxError)) throw error
        issues = [`Invalid proposal JSON: ${error.message}`]
        if (attempt === this.maxRepairs) throw new ProposalValidationError(attempt + 1, issues)
        feedback = { attempt: attempt + 1, issues }; continue
      }
      try {
        const proposal = parseGraphBundle(raw)
        validateGraph(proposal)
        if (input.current && (proposal.graph.id !== input.current.graph.id || proposal.graph.baseRevision !== input.current.graph.revision)) throw new Error("Proposal must extend the exact current graph revision")
        if (!input.current && proposal.graph.baseRevision !== 0) throw new Error("An initial proposal must start at revision one")
        return proposal
      } catch (error) {
        issues = [(error as Error).message.slice(0, 2000)]
        if (attempt === this.maxRepairs) throw new ProposalValidationError(attempt + 1, issues)
        let previousProposal: JsonValue | undefined
        try { previousProposal = JSON.parse(canonical(raw)) as JsonValue } catch { /* Non-JSON proposal is described by its validation issue. */ }
        feedback = { attempt: attempt + 1, issues, ...(previousProposal !== undefined ? { previousProposal } : {}) }
      }
    }
    throw new Error("Unreachable proposal state")
  }
}

/** Adapts a caller-owned JSON input (file, stdin, editor, or model response). */
export class JsonProposalSource implements ProposalSource {
  private readonly read: (input: ProposalInput) => Promise<string>
  constructor(read: (input: ProposalInput) => Promise<string>) { this.read = read }
  async propose(input: ProposalInput): Promise<unknown> { return JSON.parse(await this.read(input)) }
}

export { CommandProposalSource } from "./command-source.ts"
export { GraphPlanner as ValidatingPlanner }
