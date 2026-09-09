import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import type { Observation, PredictionError, TaskExpectation, VersionVector } from "../../task-causality/src/model.ts"
import type { PredictionPolicy, Stability } from "../../task-causality/src/prediction.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { digest } from "./value.ts"

export interface PinnedExpectation extends TaskExpectation { predictionPolicy: PredictionPolicy; observationValidators?:string[] }
export interface PredictionState { error: PredictionError; policy: PredictionPolicy; stability: Stability }

/** The legacy snapshot remains explicitly coarse; it is never a locality proof. */
export function attemptInputVector(engine:TaskGraphEngine,taskId:string):VersionVector {
  const snapshot=engine.signals.pinned(taskId)
  if(!snapshot)throw new Error("Execution has no pinned input snapshot")
  return [{entityId:taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
}

export function observationInputVector(engine:TaskGraphEngine,taskId:string):VersionVector {
  const inputs=attemptInputVector(engine,taskId),store=engine.store.control
  const expectation=store.get<PinnedExpectation>("task_expectations",taskId,store.head("task_expectations",taskId))
  if(!expectation?.observationValidators?.length)return inputs
  const attempt=engine.store.currentAttempt(taskId)
  if(!attempt)throw new Error("Observation has no execution attempt")
  return [...inputs,{entityId:taskId,port:"validation-attempt",view:"attempt",version:1,hash:digest({attemptId:attempt.id})}]
}

export function pinAttemptExpectation(engine:TaskGraphEngine,taskId:string,attemptId:string):void {
  const store=engine.store.control,version=store.head("task_expectations",taskId)
  if(!version)return // Legacy specifications remain distinguishable from typed expectations.
  const expectation=store.get<PinnedExpectation>("task_expectations",taskId,version)!
  if(expectation.specHash!==engine.signals.capture(taskId).specHash)throw new Error("Stale execution expectation")
  if(!expectation.predictionPolicy)throw new Error("Expectation has no pinned prediction policy")
  store.db.prepare("INSERT INTO control_attempt_expectations VALUES(?,?,?,?,?)").run(
    attemptId,taskId,version,expectation.specHash,JSON.stringify(observationInputVector(engine,taskId)))
  if(expectation.observationValidators?.length)new EvidenceStore(store).createObligation({entityId:taskId,tuple:observationInputVector(engine,taskId),kind:"prediction-state",mandatory:true,validators:expectation.observationValidators,reason:expectation.evidence})
}

/** Used by task adoption, parent completion and integration promotion alike. */
export function controlCompletionMissing(engine:TaskGraphEngine,taskIds:Iterable<string>):string[] {
  const store=engine.store.control,evidence=new EvidenceStore(store),ids=new Set(taskIds),entities=new Set(ids),missing:string[]=[]
  for(const id of ids) {
    if(store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='specialist_demands'").get())for(const demand of store.db.prepare("SELECT decision_id FROM specialist_demands WHERE task_id=? AND mandatory=1 AND state<>'satisfied'").all(id))missing.push(`required specialist unresolved: ${demand.decision_id}`)
    for(const row of store.db.prepare("SELECT b.boundary_id FROM planning_boundary_members b JOIN control_heads h ON h.collection='planning_boundaries' AND h.id=b.boundary_id AND h.version=b.version WHERE b.task_id=?").all(id))entities.add(String(row.boundary_id))
    for(const set of engine.store.integrationSetsByParent(id))entities.add(set.id)
    if(!engine.store.executionAllowed(id))missing.push(`execution fenced: ${id}`)
    if(engine.signals.stops().some(stop=>stop.taskId===id&&stop.state==="requested"))missing.push(`worker stop pending: ${id}`)
    const version=store.head("task_expectations",id)
    if(!version)continue
    const expectation=store.get<PinnedExpectation>("task_expectations",id,version)!
    const attempt=engine.store.currentAttempt(id)
    if(attempt?.worker?.sessionId) {
      const run=store.db.prepare("SELECT r.payload FROM agent_runs r JOIN activation_grants g ON g.id=r.grant_id WHERE r.task_id=? AND r.state='completed' AND json_extract(g.payload,'$.worker')=? AND json_extract(g.payload,'$.executionMode')='task'").get(id,attempt.worker.sessionId)
      const output=run&&JSON.parse(String(run.payload)).output
      if(output&&(output.requiresEscalation||output.unresolvedQuestions.length))missing.push(`worker reasoning unresolved: ${id}`)
    }
    const binding=attempt&&store.db.prepare("SELECT * FROM control_attempt_expectations WHERE attempt_id=?").get(attempt.id)
    if(!binding||Number(binding.expectation_version)!==version||expectation.specHash!==engine.signals.capture(id).specHash) {
      missing.push(`expectation is not bound to the current attempt: ${id}`);continue
    }
    if(expectation.evidence.some(ref=>!evidence.valid(ref)))missing.push(`expectation evidence expired: ${id}`)
    const row=store.db.prepare("SELECT * FROM control_prediction_state WHERE task_id=? AND attempt_id=?").get(id,attempt!.id)
    if(!row) {missing.push(`prediction observation missing: ${id}`);continue}
    const state=JSON.parse(String(row.payload)) as PredictionState
    const observation=store.get<Observation>("task_observations",String(row.observation_id),Number(row.observation_version))!
    if(!observation||digest(observation.inputVector)!==digest(observationInputVector(engine,id))||!engine.signals.matches(id))missing.push(`prediction observation has stale inputs: ${id}`)
    if(!observation?.evidence.length||observation.evidence.some(ref=>!evidence.valid(ref)))missing.push(`prediction evidence missing or expired: ${id}`)
    const error=state.error
    if(error.score===null||error.artifacts===null||error.riskResidual===null)missing.push(`prediction validation unknown: ${id}`)
    if(error.criticalViolations.length)missing.push(`critical invariant violation: ${id}`)
    if(error.artifacts!==null&&error.artifacts!==0||error.riskResidual!==null&&error.riskResidual!==0)missing.push(`artifact or risk expectation not restored: ${id}`)
    if(state.stability!=="stable"||error.score===null||error.score>=state.policy.exit)missing.push(`prediction not below stable threshold: ${id}`)
  }
  for(const entity of entities)for(const obligation of evidence.unresolved(entity))missing.push(`validation obligation unresolved: ${obligation.id} (${obligation.kind})`)
  return [...new Set(missing)]
}

export function requireControlCompletion(engine:TaskGraphEngine,taskIds:Iterable<string>):void {
  const missing=controlCompletionMissing(engine,taskIds)
  if(missing.length)throw new Error(`Completion blocked: ${missing.join("; ")}`)
}
