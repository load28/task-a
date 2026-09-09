import type { ControlStore } from "./store.ts"
import type { ControllerProgram } from "./requests.ts"
import type { Observation,PredictionError,VersionRef } from "../../task-causality/src/model.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { digest } from "./value.ts"

/** Thresholds are registered policy, and counts are distinct measured attempts. */
export function selectWorkerPrecision(store:ControlStore,program:ControllerProgram,taskId:string) {
  const policy=program.workerPrecision,evidence=new EvidenceStore(store)
  const attempts=new Set<string>(),unknown=new Set<string>(),proofs=new Map<string,VersionRef>()
  if(policy)for(const row of store.db.prepare("SELECT o.payload observation,e.payload error FROM task_observations o JOIN prediction_errors e ON e.id=o.id AND e.version=o.version WHERE json_extract(o.payload,'$.taskId')=? ORDER BY o.version,o.id").all(taskId)) {
    const observation=JSON.parse(String(row.observation)) as Observation,error=JSON.parse(String(row.error)) as PredictionError
    const attempt=observation.inputVector.find(input=>input.port==="validation-attempt"&&input.view==="attempt")
    if(!attempt||observation.expectation.id!==taskId||observation.expectation.version!==store.head("task_expectations",taskId))continue
    const failed=error.criticalViolations.length>0||error.artifacts!==null&&error.artifacts>0||error.riskResidual!==null&&error.riskResidual>0||error.score!==null&&error.score>=program.predictionPolicy.exit
    if(!failed)continue
    const obligation=store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=? AND tuple_hash=? AND json_extract(payload,'$.kind')='prediction-state'").get(taskId,digest(observation.inputVector))
    if(!observation.evidence.length||observation.evidence.some(ref=>!evidence.valid(ref))||!obligation||!evidence.satisfied(JSON.parse(String(obligation.payload)))) {unknown.add(attempt.hash);continue}
    attempts.add(attempt.hash)
    for(const proof of observation.evidence)proofs.set(digest(proof),proof)
  }
  if([...unknown].some(attempt=>!attempts.has(attempt)))throw new Error("Adaptive precision has unresolved historical failure evidence")
  const selected=policy?.failureThresholds.filter(item=>attempts.size>=item.minimumFailures).at(-1)
  const profile=selected?policy!.profiles.find(profile=>profile.id===selected.profileId)!:program.worker.profile
  return {profile,measuredFailures:attempts.size,attempts:[...attempts].sort(),evidence:[...proofs.values()],policy:policy??null,contract:"Distinct currently supported prediction failures select a registered enforceable profile. Missing observations are not zero-risk claims; budgets, role, scopes and validation obligations remain binding."}
}
