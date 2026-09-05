export type TaskCategory =
  | "requirement"
  | "research"
  | "architecture"
  | "implementation"
  | "qa"
  | "integration"
  | "diagnostic"
  | "general"

export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "implemented"
  | "verified"
  | "integrating"
  | "integrated"
  | "blocked"
  | "failed"
  | "stale"

export type IntegrationPolicy = "none" | "contract" | "targeted" | "full"

export interface ArtifactVersionRef {
  artifactId: string
  version: number
}

export interface ContractVersionRef {
  contractId: string
  version: number
}

export interface ScenarioVersionRef {
  scenarioId: string
  version: number
}

export interface VersionRef {
  id: string
  version: number
}

export interface ContractRef {
  contractId: string
  version?: number
}

export interface Criterion {
  id: string
  description: string
}

export interface ContextPolicy {
  inheritGoal: boolean
  inheritRequirements: boolean
  inheritConstraints: boolean
  inheritDecisions: "all" | "relevant" | "none"
  inheritArtifacts: "referenced" | "relevant" | "none"
  inheritHistory: boolean
}

export const DEFAULT_CONTEXT_POLICY: ContextPolicy = {
  inheritGoal: true,
  inheritRequirements: true,
  inheritConstraints: true,
  inheritDecisions: "relevant",
  inheritArtifacts: "referenced",
  inheritHistory: false,
}

export interface Task {
  id: string
  parentId?: string
  title: string
  goal: string
  category: TaskCategory
  status: TaskStatus
  childIds: string[]
  dependencies: string[]
  acceptanceCriteria: Criterion[]
  contextPolicy: ContextPolicy
  inputArtifactRefs: ArtifactVersionRef[]
  outputArtifactRefs: ArtifactVersionRef[]
  contractRefs: ContractRef[]
  assignedRole?: string
  integrationPolicy?: IntegrationPolicy
  statusReason?: string
  createdAt: string
  updatedAt: string
}

export type RequirementKind = "requirement" | "constraint"

export interface Requirement {
  id: string
  taskId: string
  description: string
  kind: RequirementKind
  version: number
  status: "open" | "satisfied"
  createdAt: string
}

export type ArtifactType =
  | "research"
  | "architecture"
  | "code"
  | "test"
  | "bundle"
  | "decision"
  | "note"

export interface Artifact {
  id: string
  name: string
  type: ArtifactType
  latestVersion: number
  createdAt: string
}

export interface ArtifactVersion {
  artifactId: string
  version: number
  type: ArtifactType
  producerTaskId: string
  inputs: ArtifactVersionRef[]
  contractVersionRefs: ContractVersionRef[]
  contentRef: string
  content?: string
  status: "valid" | "stale"
  createdAt: string
}

export interface ContractItem {
  name: string
  description?: string
}

export interface TaskContract {
  id: string
  providerTaskId: string
  consumerTaskId: string
  provides: ContractItem[]
  expects: ContractItem[]
  invariants: string[]
  compatibilityChecks: string[]
  version: number
  createdAt: string
}

export type IntegrationSetStatus = "pending" | "ready" | "running" | "passed" | "failed" | "stale"

export interface IntegrationSet {
  id: string
  name: string
  parentTaskId?: string
  memberRefs: ArtifactVersionRef[]
  scenarioIds: string[]
  policy: IntegrationPolicy
  status: IntegrationSetStatus
  outputBundleRef?: ArtifactVersionRef
  createdAt: string
  updatedAt: string
}

export interface ScenarioResult {
  status: "passed" | "failed"
  observed?: string
  recordedAt: string
}

export interface IntegrationScenario {
  id: string
  integrationSetId: string
  name: string
  participantRefs: ArtifactVersionRef[]
  requirementIds: string[]
  fixtureRefs: ArtifactVersionRef[]
  expectedBehavior: string[]
  result?: ScenarioResult
  version: number
  createdAt: string
}

export type IntegrationFailureType =
  | "producer_violation"
  | "consumer_violation"
  | "contract_mismatch"
  | "architecture_issue"
  | "interaction_issue"
  | "unknown"

export interface IntegrationFailure {
  type: IntegrationFailureType
  affectedTaskIds: string[]
  evidenceRefs: ArtifactVersionRef[]
  recommendedActions: string[]
}

export interface ScenarioRunResult {
  scenarioId: string
  scenarioVersion: number
  status: "passed" | "failed"
  observed?: string
}

export interface IntegrationRun {
  id: string
  integrationSetId: string
  integrationKey: string
  memberRefs: ArtifactVersionRef[]
  scenarioResults: ScenarioRunResult[]
  status: "running" | "passed" | "failed"
  failure?: IntegrationFailure
  startedAt: string
  finishedAt?: string
}

export interface VerifiedBundle {
  artifactId: string
  version: number
  memberRefs: ArtifactVersionRef[]
  integrationSetId: string
  integrationRunId: string
  scenarioVersionRefs: ScenarioVersionRef[]
  contractVersionRefs: ContractVersionRef[]
  architectureVersionRef?: VersionRef
  requirementVersionRef?: VersionRef
  status: "valid" | "stale"
  createdAt: string
}

export interface Role {
  id: string
  name: string
  description: string
  principles: string[]
  capabilities: string[]
  allowedTools: string[]
  constraints: string[]
}

export type LearningKind =
  | "insight"
  | "pitfall"
  | "convention"
  | "failure_pattern"
  | "improvement"

export interface Learning {
  id: string
  sourceTaskId?: string
  sourceRunId?: string
  kind: LearningKind
  description: string
  tags: string[]
  appliedCount: number
  createdAt: string
}

export type EventType =
  | "TASK_CREATED"
  | "TASK_DECOMPOSED"
  | "TASK_READY"
  | "TASK_STARTED"
  | "TASK_IMPLEMENTED"
  | "TASK_VERIFIED"
  | "TASK_BLOCKED"
  | "TASK_FAILED"
  | "TASK_STALE"
  | "TASK_REOPENED"
  | "TASK_INTEGRATED"
  | "ARTIFACT_CREATED"
  | "ARTIFACT_VERSIONED"
  | "ARTIFACT_STALE"
  | "CONTRACT_UPDATED"
  | "REQUIREMENT_ADDED"
  | "REQUIREMENT_SATISFIED"
  | "INTEGRATION_CREATED"
  | "INTEGRATION_STARTED"
  | "INTEGRATION_PASSED"
  | "INTEGRATION_FAILED"
  | "BUNDLE_PROMOTED"
  | "BUNDLE_STALE"
  | "DIAGNOSTIC_CREATED"
  | "ARCHITECTURE_REVISED"
  | "LEARNING_RECORDED"

export interface TaskGraphEvent {
  id: string
  type: EventType
  taskId?: string
  refs?: Record<string, unknown>
  payload?: Record<string, unknown>
  createdAt: string
}

export interface TaskSummary {
  taskId: string
  completedWork: string[]
  verifiedBundles: ArtifactVersionRef[]
  decisionRefs: ArtifactVersionRef[]
  failureRefs: string[]
  openQuestions: string[]
}

export function sameRef(a: ArtifactVersionRef, b: ArtifactVersionRef): boolean {
  return a.artifactId === b.artifactId && a.version === b.version
}

export function isAtomic(task: Task): boolean {
  return task.childIds.length === 0
}
