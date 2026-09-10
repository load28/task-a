import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { CausalGraph } from "../../task-causality/src/graph.ts"
import { digest } from "./value.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { currentInputVector } from "./completion.ts"

/** An operator string is not invalidation evidence for an enrolled task. */
export function withTaskInvalidation<T>(engine:TaskGraphEngine,taskId:string,evidence:VersionRef[],operation:()=>T):T {
  return engine.atomic(()=>{
    if(!evidence.length)throw new Error("Controlled invalidation requires evidence")
    const proofs=new EvidenceStore(engine.store.control)
    evidence.forEach(ref=>proofs.require(ref))
    const db=engine.store.db
    db.exec("CREATE TABLE IF NOT EXISTS task_invalidation_intents(task_id TEXT PRIMARY KEY,evidence TEXT NOT NULL)")
    db.prepare("INSERT INTO task_invalidation_intents VALUES(?,?)").run(taskId,JSON.stringify(evidence))
    try{return operation()}finally{db.prepare("DELETE FROM task_invalidation_intents WHERE task_id=?").run(taskId)}
  })
}
export function assertTaskInvalidation(engine:TaskGraphEngine,taskId:string):void {
  const db=engine.store.db
  if(!db.prepare("SELECT 1 FROM controlled_tasks WHERE task_id=?").get(taskId))return
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_invalidation_intents'").get()||!db.prepare("SELECT 1 FROM task_invalidation_intents WHERE task_id=?").get(taskId))throw new Error("Controlled task reopening requires evidence-bound invalidation")
}

/** The intent exists only during the adapter's graph transaction. */
export function withTaskAdmission<T>(engine:TaskGraphEngine,grantId:string,worker:string,operation:()=>T):T {
  return engine.atomic(()=>{
    const db=engine.store.db,row=db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
    if(!row||row.state!=="issued")throw new Error("Task execution requires an unused grant")
    const grant=JSON.parse(String(row.payload)) as ActivationGrant,snapshot=engine.signals.capture(grant.taskId)
    const vector=currentInputVector(engine,grant.taskId)
    if(!worker||grant.executionMode!=="task"||grant.expiresAt<=Date.now()||grant.specHash!==snapshot.specHash||digest(grant.inputVector)!==digest(vector)||grant.graphHash!==new CausalGraph(engine.store.control).hash())throw new Error("Task admission has stale or foreign inputs")
    db.prepare("INSERT INTO task_admission_intents VALUES(?,?,?)").run(grant.taskId,grant.id,worker)
    try {return operation()} finally {db.prepare("DELETE FROM task_admission_intents WHERE task_id=?").run(grant.taskId)}
  })
}
export function assertTaskAdmission(engine:TaskGraphEngine,taskId:string,worker?:string):void {
  const db=engine.store.db
  if(!db.prepare("SELECT 1 FROM controlled_tasks WHERE task_id=?").get(taskId))return
  const intent=db.prepare("SELECT worker FROM task_admission_intents WHERE task_id=?").get(taskId)
  if(!intent||intent.worker!==worker)throw new Error("Controlled task requires adapter admission; raw task_start is unavailable")
}
export function assertTaskResult(engine:TaskGraphEngine,taskId:string):void {
  const db=engine.store.db
  if(!db.prepare("SELECT 1 FROM controlled_tasks WHERE task_id=?").get(taskId))return
  const attempt=engine.store.currentAttempt(taskId)
  if(!attempt?.worker?.sessionId||!db.prepare("SELECT 1 FROM activation_grants WHERE task_id=? AND state='completed' AND json_extract(payload,'$.worker')=?").get(taskId,attempt.worker.sessionId))throw new Error("Controlled task result requires accepted structured output and measured usage")
}
