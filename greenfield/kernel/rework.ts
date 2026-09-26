import { canonical } from "../contracts/index.ts"
import type { AdoptionRecord, GraphBundle, InputSnapshot, ValidatorRef } from "../contracts/index.ts"
import { findRevision, getTask, sorted, taskMeaningDigest } from "./graph.ts"

export interface ReworkDecision { action: "reuse" | "revalidate" | "rerun" | "wait"; validatorRefs?: ValidatorRef[]; reason: string }

export function decideRework(bundle: GraphBundle, taskId: string, snapshot: InputSnapshot | undefined, previousAdoption?: AdoptionRecord): ReworkDecision {
  if (!snapshot) return { action: "wait", reason: "Current inputs or predecessor completion are unresolved" }
  const task = getTask(bundle, taskId)
  if (snapshot.taskSpecRef.id !== taskId || snapshot.taskMeaningDigest !== taskMeaningDigest(task)) return { action: "wait", reason: "Input snapshot is not for the current task meaning" }
  if (!previousAdoption || previousAdoption.targetTaskSpecRef.id !== taskId || !previousAdoption.artifactRefs.length || !previousAdoption.validationEvidenceIds.length) return { action: "rerun", reason: "No previously adopted output candidate with validation evidence" }
  const previous = previousAdoption.currentInputs
  if (previous.semanticReuseKey === snapshot.semanticReuseKey) return { action: "reuse", reason: "Task meaning, input content/contracts, order obligations and execution conditions are identical" }
  if (previous.taskMeaningDigest !== snapshot.taskMeaningDigest) return { action: "rerun", reason: "Task execution meaning changed" }
  if (previous.workspaceTemplateDigest !== snapshot.workspaceTemplateDigest || previous.executionPolicyDigest !== snapshot.executionPolicyDigest) return { action: "rerun", reason: "Execution environment or authority changed" }
  const order = (value: InputSnapshot) => sorted(value.orderObligations.map(({ predecessor, successor }) => ({ predecessor, successor })))
  if (canonical(order(previous)) !== canonical(order(snapshot))) return { action: "rerun", reason: "Prior execution does not prove newly required order obligations" }
  const validators = [...task.inputPorts, ...task.outputPorts].flatMap(port => findRevision(bundle.contracts, port.contractRef).compatibilityValidators)
  const validatorRefs = [...new Map(validators.map(value => [canonical(value), value])).values()]
  if (!validatorRefs.length) return { action: "rerun", reason: "Changed inputs have no explicit compatibility validator" }
  return { action: "revalidate", validatorRefs: sorted(validatorRefs), reason: "Prior output requires validation against the current input combination" }
}
