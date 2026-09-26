/** Serializable contracts for the independent task agent. No runtime implementation lives here. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }
export type Digest = `sha256:${string}`
export interface RevisionRef { id: string; revision: number; digest: Digest }
export interface Revisioned extends RevisionRef {}
export interface ArtifactRef { id: string; digest: Digest }
export interface BlobRef { uri: string; digest: Digest; size: number }
export interface ValidatorRef extends RevisionRef {}

export type DataShape =
  | { kind: "file"; mediaType: string }
  | { kind: "json"; schema: JsonValue }
  | { kind: "directory"; requiredPaths: string[] }

export interface ContractRevision extends Revisioned {
  purpose: string
  shape: DataShape
  invariants: string[]
  validators: ValidatorRef[]
  compatibilityValidators: ValidatorRef[]
}

export type ValidatorDefinition =
  | { kind: "builtin"; check: "integrity" }
  | { kind: "builtin"; check: "json-schema"; schema: JsonValue }
  | { kind: "argv"; argv: string[]; timeoutMs: number }

export interface ValidatorRevision extends Revisioned {
  definition: ValidatorDefinition
  implementationDigest: Digest
  configurationDigest: Digest
}

export interface InputPort { name: string; contractRef: RevisionRef; mountPath: string }
export interface OutputPort { name: string; contractRef: RevisionRef; path: string }
export interface ExecutionStep {
  id: string
  argv: string[]
  outputs: string[]
  timeoutMs: number
  effectPolicy: "replayable" | "requires-receipt"
}
export interface TaskSpecRevision extends Revisioned {
  objective: string
  kind: "work" | "integration"
  inputPorts: InputPort[]
  outputPorts: OutputPort[]
  design: { rationale: string; steps: ExecutionStep[]; acceptance: ValidatorRef[] }
  workspaceTemplateRef: RevisionRef
  executionPolicyRef: RevisionRef
}

export interface WorkspaceTemplateRevision extends Revisioned {
  environment: { kind: "container"; image: string }
  sourceSnapshots: Array<{ snapshot: BlobRef; destination: string }>
  bootstrap: ExecutionStep[]
}
export interface ExecutionPolicyRevision extends Revisioned {
  network: "none" | "restricted"
  allowedHosts: string[]
  resources: { cpus: number; memoryBytes: number; pids: number; timeoutMs: number }
  secretRefs: string[]
  allowedEffects: string[]
}

export interface PortAddress { nodeId: string; port: string }
export type GraphEdge =
  | { kind: "consumes"; from: PortAddress; to: PortAddress }
  | { kind: "after"; predecessor: string; successor: string }
  | { kind: "contains"; groupId: string; childId: string }
export interface SourceNode {
  id: string
  outputs: Array<{ name: string; contractRef: RevisionRef; artifactRef: ArtifactRef }>
  registrationEvidence: { issuer: string; source: string; digest: Digest }
}
export interface TaskGroup {
  id: string
  objective: string
  requiredTaskIds: string[]
  requiredIntegrationIds: string[]
}
export interface GraphRevision extends Revisioned {
  baseRevision: number
  taskSpecRefs: RevisionRef[]
  sources: SourceNode[]
  groups: TaskGroup[]
  edges: GraphEdge[]
  completionTargets: string[]
  reviewEvidence: { reviewer: string; rationale: string }
}
export interface GraphBundle {
  schemaVersion: 1
  graph: GraphRevision
  contracts: ContractRevision[]
  tasks: TaskSpecRevision[]
  templates: WorkspaceTemplateRevision[]
  policies: ExecutionPolicyRevision[]
  validators: ValidatorRevision[]
  sourceArtifacts: ArtifactManifest[]
}

export interface InputBinding {
  inputPort: string
  producer: PortAddress
  artifactRef: ArtifactRef
  contractRef: RevisionRef
  contentDigest: Digest
}
export interface OrderObligation {
  predecessor: string
  successor: string
  completionAdoptionId: string
}
export interface InputSnapshot {
  graphRef: RevisionRef
  taskSpecRef: RevisionRef
  bindings: InputBinding[]
  orderObligations: OrderObligation[]
  workspaceTemplateDigest: Digest
  executionPolicyDigest: Digest
  validatorRefs: ValidatorRef[]
  taskMeaningDigest: Digest
  provenanceDigest: Digest
  semanticReuseKey: Digest
}

interface ArtifactBase {
  id: string
  digest: Digest
  outputPort: string
  contractRef: RevisionRef
  contentDigest: Digest
  storage: BlobRef
  validationEvidenceIds: string[]
}
export type ArtifactManifest = ArtifactBase & (
  | { origin: { kind: "execution"; taskSpecRef: RevisionRef; attemptId: string }; consumedInputs: InputSnapshot }
  | { origin: { kind: "source"; sourceId: string; issuer: string; source: string; registrationDigest: Digest }; consumedInputs?: never }
)
export interface ValidationEvidence {
  id: string
  validatorRef: ValidatorRef
  validationRunId: string
  trustedIssuer: string
  validationEnvironmentDigest: Digest
  subjects: ArtifactRef[]
  inputSnapshotDigest: Digest
  outcome: "passed" | "failed" | "inconclusive"
  report: BlobRef
}
export type ResultValidity = "absent" | "valid" | "check_required" | "invalid" | "retired"
export interface PortResult {
  producer: PortAddress
  artifactRef: ArtifactRef
  adoptionId: string
  validity: ResultValidity
  reasons: string[]
}
interface AdoptionBase {
  id: string
  targetGraphRef: RevisionRef
  targetTaskSpecRef: RevisionRef
  currentInputs: InputSnapshot
  artifactRefs: ArtifactRef[]
  validationEvidenceIds: string[]
}
export type AdoptionRecord = AdoptionBase & (
  | { mode: "fresh"; attemptId: string; fence: number }
  | { mode: "reuse"; originalAdoptionId: string; equivalenceEvidenceIds: string[] }
  | { mode: "revalidate"; originalAdoptionId: string; equivalenceEvidenceIds: string[] }
)

export interface WriterIdentity { attemptId: string; fence: number }
export interface WorkspaceInstance {
  id: string
  ownerTaskId: string
  templateRef: RevisionRef
  activeWriter: WriterIdentity | null
  captureHold: WriterIdentity | null
  lastCheckpointId?: string
  retention: "retained" | "archived" | "deleted"
}
export type ObservedState = "queued" | "starting" | "running" | "stopping" | "stopped" | "unknown"
export type StopReason = "suspend" | "cancel" | "supersede"
export interface Attempt extends WriterIdentity {
  taskId: string
  taskSpecRef: RevisionRef
  inputs: InputSnapshot
  workspaceId: string
  intentId: string
  desired: "running" | "stopped"
  observed: ObservedState
  observedFence: number
  stopReason?: StopReason
  backendHandle?: string
  outcome?: { kind: "success" } | { kind: "failure"; reason: string; exitCode?: number }
  checkpointId?: string
  fenced: boolean
}
interface StopReceiptBase extends WriterIdentity {
  intentId: string
  workspaceId: string
  observationSource: string
  stoppedAt: string
}
export type StopReceipt = StopReceiptBase & (
  | { backendHandle: string; termination: { kind: "all-writers-terminated"; evidence: string } }
  | { backendHandle?: never; termination: { kind: "creation-revoked"; tombstone: string } }
)
export interface EffectReceipt {
  scope: string
  key: string
  payloadDigest: Digest
  state: "confirmed" | "unknown"
  evidence?: string
}
export interface CheckpointManifest {
  id: string
  attemptId: string
  fence: number
  workspaceSnapshot: BlobRef
  taskSpecRef: RevisionRef
  inputSnapshotDigest: Digest
  templateDigest: Digest
  completedSteps: Array<{ stepId: string; stepSpecDigest: Digest; inputDigest: Digest; outputDigest: Digest }>
  agentSession?: BlobRef
  effectReceipts: EffectReceipt[]
  integrityDigest: Digest
}

export interface RuntimeIdentity extends WriterIdentity { intentId: string; workspaceId: string; backendHandle?: string }
export type ExecutionIdentity = RuntimeIdentity
export interface ReadOnlyInput { port: string; digest: Digest; hostPath: string }
export interface LaunchRequest extends RuntimeIdentity {
  task: TaskSpecRevision
  template: WorkspaceTemplateRevision
  policy: ExecutionPolicyRevision
  inputSnapshot: InputSnapshot
  inputArtifacts: ArtifactManifest[]
  readOnlyInputs: ReadOnlyInput[]
  sourceSnapshotPath?: string
  resumeCheckpoint?: { manifest: CheckpointManifest; snapshotPath: string }
}
export interface RuntimeObservation extends RuntimeIdentity {
  observed: ObservedState
  outcome?: Attempt["outcome"]
  stopReceipt?: StopReceipt
  checkpoint?: CheckpointManifest
  exitCode?: number
  diagnostic?: string
  detail?: string
}
export interface StopRequest extends RuntimeIdentity { reason: StopReason; checkpoint: boolean }
export interface CapturedFile { path: string; kind: "file" | "directory"; digest: Digest; size: number; mode: number }
/** path is an absolute staging directory; files use safe paths relative to it. */
export interface CapturedSnapshot { path: string; digest: Digest; files: CapturedFile[] }
export interface CaptureResult {
  identity: RuntimeIdentity
  workspace: CapturedSnapshot
  outputs: Array<{ port: string; snapshot: CapturedSnapshot }>
  checkpoint?: {
    completedSteps: CheckpointManifest["completedSteps"]
    effectReceipts: EffectReceipt[]
    agentSessionPath?: string
  }
}
export interface RuntimeBackend {
  ensureStarted(request: LaunchRequest): Promise<RuntimeObservation>
  observe(identity: RuntimeIdentity): Promise<RuntimeObservation>
  requestStop(request: StopRequest): Promise<RuntimeObservation>
  captureStoppedWorkspace(receipt: StopReceipt): Promise<CaptureResult>
}
export interface ArtifactStore {
  put(bytes: Uint8Array): Promise<BlobRef>
  get(ref: BlobRef): Promise<Uint8Array>
  verify(ref: BlobRef): Promise<boolean>
}
export interface ValidationRequest {
  id: string
  validator: ValidatorRevision
  inputs: InputSnapshot
  artifacts: ArtifactManifest[]
  inputArtifacts: ArtifactManifest[]
  template: WorkspaceTemplateRevision
  policy: ExecutionPolicyRevision
}
export interface Validator { validate(request: ValidationRequest): Promise<ValidationEvidence> }
export interface Planner { propose(input: { objective: string; current?: GraphBundle }): Promise<GraphBundle> }

export interface CommandEnvelope<T> { operationId: string; graphId: string; expectedRevision: number; payload: T }
export type AgentCommand = CommandEnvelope<
  | { kind: "proposeGraph"; bundle: GraphBundle }
  | { kind: "activateGraph"; bundle: GraphBundle }
  | { kind: "requestRun"; taskId: string }
  | { kind: "requestSuspend"; taskId: string }
  | { kind: "requestResume"; taskId: string }
  | { kind: "requestCancel"; taskId: string }
  | { kind: "submitCandidate"; attemptId: string; fence: number; artifacts: ArtifactManifest[] }
  | { kind: "recordValidation"; evidence: ValidationEvidence }
  | { kind: "adoptResult"; adoption: AdoptionRecord }
>
export type AgentQuery =
  | { kind: "analyzeChange"; graphId: string; bundle: GraphBundle }
  | { kind: "getGraph"; graphId: string; revision?: number }
  | { kind: "getTask"; graphId: string; taskId: string }
  | { kind: "getImpact"; graphId: string; revision: number }
  | { kind: "readEvents"; graphId: string; afterSequence: number; limit: number }
export interface SystemEvent { sequence: number; schemaVersion: 1; id: string; type: string; graphId: string; operationId: string; payload: JsonValue }
export type ErrorCode = "invalid_contract" | "invalid_graph" | "revision_conflict" | "stale_attempt" | "validation_failed" | "validation_inconclusive" | "artifact_unavailable" | "capability_unsupported" | "runtime_unavailable" | "termination_unknown" | "checkpoint_invalid" | "effect_unknown" | "operation_conflict" | "unauthorized" | "internal_error"
export interface ErrorObject { kind: string; id: string }
export interface AgentError { code: ErrorCode; message: string; object: ErrorObject | null; revision: number | null; retryable: boolean; resultUsable: boolean }
