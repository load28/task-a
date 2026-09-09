import type { RequestController,ControllerProgram,ControlledRequest } from "./requests.ts"
import type { Observation } from "../../task-causality/src/model.ts"
import type { PredictionState } from "./completion.ts"
import { observationInputVector } from "./completion.ts"
import { withTaskInvalidation } from "./task-admission.ts"
import { canonical,digest } from "./value.ts"

/** Action repair precedes plan revision. It cannot rewrite the goal or expectation. */
export class LocalRepairs {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS local_repair_attempts(request_id TEXT NOT NULL,task_id TEXT NOT NULL,attempt_id TEXT PRIMARY KEY,grant_id TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS local_repair_exhaustions(attempt_id TEXT PRIMARY KEY)")
  }
  advance(request:ControlledRequest,program:ControllerProgram,taskId:string):boolean {
    const runtime=this.controller.runtime,engine=runtime.engine,store=runtime.store,db=store.db
    const task=engine.requireTask(taskId),attempt=engine.store.currentAttempt(taskId)
    if(!attempt||task.status!=="implemented"||!engine.signals.matches(taskId)||!engine.store.executionAllowed(taskId))return false
    const row=db.prepare("SELECT * FROM control_prediction_state WHERE task_id=? AND attempt_id=?").get(taskId,attempt.id)
    if(!row)return false // Unknown/missing observations require validation, not blind repair.
    const state=JSON.parse(String(row.payload)) as PredictionState,error=state.error
    const mismatch=error.criticalViolations.length>0||error.artifacts!==null&&error.artifacts>0||error.riskResidual!==null&&error.riskResidual>0||error.score!==null&&error.score>=state.policy.exit
    if(!mismatch)return false
    const observation=store.get<Observation>("task_observations",String(row.observation_id),Number(row.observation_version))
    if(!observation||digest(observation.inputVector)!==digest(observationInputVector(engine,taskId))||!observation.evidence.length||observation.evidence.some(ref=>!runtime.evidence.valid(ref)))return true
    // Never retry an unacknowledged worker, or invalidate a concurrently reviewing role.
    if(db.prepare("SELECT 1 FROM activation_grants WHERE task_id=? AND state IN ('issued','claimed')").get(taskId))return true
    if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()&&db.prepare("SELECT 1 FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE g.task_id=? AND d.state<>'completed'").get(taskId))return true
    if(runtime.evidence.unresolved(taskId).some(item=>item.kind!=="prediction-state"))return true
    if(db.prepare("SELECT 1 FROM specialist_demands WHERE task_id=? AND mandatory=1 AND state<>'satisfied'").get(taskId))return true
    const previous=db.prepare("SELECT payload FROM local_repair_attempts WHERE request_id=? AND task_id=? ORDER BY rowid").all(request.id,taskId)
    if(program.maxLocalRepairs===undefined||previous.length>=program.maxLocalRepairs) {
      if(db.prepare("INSERT OR IGNORE INTO local_repair_exhaustions VALUES(?)").run(attempt.id).changes)store.event({id:`repair-exhausted:${attempt.id}`,type:"LocalRepairExhausted",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:request.id,attemptId:attempt.id,reason:program.maxLocalRepairs===undefined?"local repair policy is not registered":"local repair quota exhausted",error,evidence:observation.evidence,repairs:previous.map(row=>JSON.parse(String(row.payload)))}})
      return true
    }
    if(db.prepare("SELECT 1 FROM local_repair_attempts WHERE attempt_id=?").get(attempt.id))return true
    const content={request:request.text,task,expectation:store.get("task_expectations",taskId,store.head("task_expectations",taskId)),observation,error,evidence:observation.evidence.map(ref=>runtime.evidence.require(ref)),priorRepairs:previous.map(row=>JSON.parse(String(row.payload))),contract:"Repair the failed leaf action under the unchanged goal, criteria, expectation and write scopes. A change of scope or assumption must be returned as requiresEscalation with evidence."}
    withTaskInvalidation(engine,taskId,observation.evidence,()=>engine.reopenTask(taskId,`Measured prediction failure ${observation.id}@${observation.version}`))
    const grant=this.controller.issueRepair(request,program,taskId,content,`local-repair:${attempt.id}`)
    const payload={priorAttempt:attempt.id,grantId:grant.id,expectation:observation.expectation,error,evidence:observation.evidence}
    db.prepare("INSERT INTO local_repair_attempts VALUES(?,?,?,?,?)").run(request.id,taskId,attempt.id,grant.id,canonical(payload))
    store.event({id:`local-repair:${attempt.id}`,type:"LocalRepairIssued",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload})
    return true
  }
}
