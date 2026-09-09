export const CHANGE_SCOPES = ["syntactic", "implementation", "behavior", "contract", "dependency", "assumption", "subgoal", "goal"] as const
export type ChangeScope = typeof CHANGE_SCOPES[number]
export const RELATIONS = ["depends_on", "blocks", "implements", "validates", "integrates_with", "generated_from", "supersedes", "shares_contract", "shares_resource", "assumes", "conflicts_with", "derived_from", "constrained_by", "implements_goal"] as const
export type Relation = typeof RELATIONS[number]
export interface VersionRef { id: string; version: number }
export interface PortRef { entityId: string; port: string; view: string }
export interface DependencyVersion extends PortRef { version: number; hash: string }
export type VersionVector = DependencyVersion[]
export interface CausalEdge {
  id: string; version: number; source: PortRef; target: PortRef; relation: Relation
  changeTypes: ChangeScope[]; impactWeight: number; critical: boolean
  observedPropagationRate: { successes: number; trials: number; estimate: number; modelVersion: string }
  evidence: VersionRef[]; completeness: "declared" | "observed" | "verified" | "unknown"
}
export interface ChangeSignature { scopes: ChangeScope[]; magnitude: number; confidence: number; evidence: VersionRef[] }
export interface SemanticState {
  artifacts: Record<string, string> | null
  contract: Record<string, string> | null
  behavior: Record<string, boolean> | null
  dependencies: Record<string, string> | null
  goals: Record<string, string> | null
  risk: number | null
}
export interface TaskExpectation {
  id: string; version: number; taskId: string; specHash: string
  expectedArtifacts: Record<string, string>; expectedInterface: Record<string, string>
  expectedBehavior: Record<string, boolean>; expectedDependencies: Record<string, string>
  expectedGoals: Record<string, string>; expectedRisk: number; evidence: VersionRef[]
}
export interface Observation {
  id: string; version: number; taskId: string; expectation: VersionRef
  state: SemanticState; evidence: VersionRef[]; inputVector: VersionVector
}
export interface PredictionError {
  contract: number | null; behavior: number | null; dependency: number | null; goal: number | null
  artifacts: number | null; riskResidual: number | null; score: number | null
  criticalViolations: string[]; expectation: VersionRef; observation: VersionRef; evidence: VersionRef[]
}
export interface Boundary {
  id: string; version: number; members: string[]; exits: string[]; invariants: string[]
  bindingsComplete: boolean
}
export interface BoundaryProof {
  id: string; boundary: VersionRef; graphHash: string; inputVector: VersionVector
  scope: ChangeScope; exits: string[]; before: Record<string, string>; after: Record<string, string>
  observableComplete: boolean; evidence: VersionRef[]; validatorVersion: string; expiresAt: number
  verdict: "preserved" | "broken" | "unknown"
}
export interface PropagationResult {
  affected: string[]; preserved: string[]; hard: string[]; unknown: string[]
  impact: Record<string, number>; trace: Array<{ edgeId: string; scope: ChangeScope; reason: string; impact: number }>
}
export interface ReplanLease {
  id: string; planId: string; baseRevision: number; graphHash: string; inputVector: VersionVector
  changedNodes: string[]; invalidatedNodes: string[]; preservedNodes: string[]
  boundary: string[]; immutableDecisions: VersionRef[]; invalidAssumptions: VersionRef[]; invalidDecisions?:VersionRef[]; immutableAssumptions?:VersionRef[]
  predictionErrors: PredictionError[]; violatedInvariants: string[]; evidence: VersionRef[]
  expiresAt: number; generation: number
}
