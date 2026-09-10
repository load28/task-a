import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { digest } from "./value.ts"

/** Rechecked by the engine when delayed worker stops finally permit activation. */
export function assertControlledPlanActivation(engine:TaskGraphEngine,planId:string,version:number):void {
  const db=engine.store.db
  const hasRequests=db.prepare("SELECT 1 FROM sqlite_master WHERE name='request_plan_admissions'").get()
  const binding=hasRequests?db.prepare("SELECT request_id,state FROM request_plan_admissions WHERE plan_id=?").get(planId):undefined
  if(!binding&&!db.prepare("SELECT 1 FROM controlled_plans WHERE plan_id=?").get(planId))return
  const evidence=new EvidenceStore(engine.store.control)
  if(version===1) {
    if(!binding)return
    const request=JSON.parse(String(db.prepare("SELECT payload FROM control_requests WHERE id=?").get(String(binding.request_id))!.payload))
    const obligation=evidence.obligation(request.obligationId)
    if(request.planId!==planId||!["activating","activated"].includes(String(binding.state))||!obligation||!evidence.independentlySatisfied(obligation)||!obligation.tuple.some(input=>input.entityId===planId&&input.port==="proposal"&&input.view==="request-plan")||digest(engine.store.planNodes(planId,1))!==digest(request.proposal.map((item:any)=>item.node)))throw new Error("Initial controller plan validation is missing, expired or changed")
    return
  }
  let stage
  if(binding) {
    const row=db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? AND state IN ('activating','applied') AND json_extract(payload,'$.revision')=?").get(String(binding.request_id),version)
    if(!row)throw new Error("Revised request plan needs a validated regional activation")
    const repair=JSON.parse(String(row.payload))
    stage=JSON.parse(String(db.prepare("SELECT payload FROM scoped_replan_stages WHERE id=? AND plan_id=? AND state='committed'").get(repair.stageId,planId)?.payload??"null"))
  }else {
    // Legacy controller callers share the same final admission boundary. A
    // previously committed patch is not permanent authority to activate it.
    stage=JSON.parse(String(db.prepare("SELECT payload FROM scoped_replan_stages WHERE plan_id=? AND state='committed' AND json_extract(payload,'$.result.revision.version')=?").get(planId,version)?.payload??"null"))
  }
  const obligation=stage&&evidence.obligation(stage.obligationId)
  if(!stage||!obligation||!evidence.independentlySatisfied(obligation)||stage.binding.lease.expiresAt<=Date.now()||digest(stage.revisionInput.nodes)!==digest(engine.store.planNodes(planId,version)))throw new Error("Regional activation validation is missing, expired or changed")
  const lease=stage.binding.lease
  if(db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(planId)?.generation!==lease.generation)throw new Error("Regional activation generation changed")
  const inputs=engine.store.planLinks(planId,lease.sourceRevision??lease.baseRevision).map(link=>({entityId:link.taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:engine.signals.capture(link.taskId).digest})).sort((a,b)=>a.entityId.localeCompare(b.entityId))
  if(digest(inputs)!==digest(lease.inputVector)||digest(engine.revisions.context(planId,lease.sourceRevision??lease.baseRevision))!==stage.binding.contextHash)throw new Error("Regional activation inputs changed while waiting for termination")
}
