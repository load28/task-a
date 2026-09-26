import type { AdoptionRecord, ArtifactManifest, ArtifactRef, Attempt, CheckpointManifest, GraphBundle, LaunchRequest, PortResult, RevisionRef,
  RuntimeObservation, StopReceipt, ValidationEvidence, ValidationRequest, WorkspaceInstance } from "../contracts/model.ts"

export interface TaskControl {
  taskId: string
  desired: "running" | "suspended" | "cancelled"
  lastAttemptId?: string
  resumeCheckpointId?: string
  error?: string
}
export interface AttemptRecord extends Attempt {
  launch: LaunchRequest
  phase: "dispatch" | "observe" | "capture" | "validate" | "finished"
  lastObservation?: RuntimeObservation
  stopReceipt?: StopReceipt
  candidateIds: string[]
  validationRequests: ValidationRequest[]
  error?: string
}
export interface AgentState {
  bundle: GraphBundle | null
  history: GraphBundle[]
  proposals: GraphBundle[]
  tasks: TaskControl[]
  attempts: AttemptRecord[]
  workspaces: WorkspaceInstance[]
  artifacts: ArtifactManifest[]
  results: PortResult[]
  adoptions: AdoptionRecord[]
  evidence: ValidationEvidence[]
  sourceValidations: Array<{ graphRef: RevisionRef; artifactRef: ArtifactRef; validationEvidenceIds: string[] }>
  checkpoints: CheckpointManifest[]
  impacts: Array<{ graphRevision: number; affectedTaskIds: string[]; reasons: Record<string, string[]> }>
}
export const emptyState = (): AgentState => ({ bundle: null, history: [], proposals: [], tasks: [], attempts: [], workspaces: [], artifacts: [],
  results: [], adoptions: [], evidence: [], sourceValidations: [], checkpoints: [], impacts: [] })
