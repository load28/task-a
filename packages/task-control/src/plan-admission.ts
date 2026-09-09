import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { digest } from "./value.ts"

/** Rechecked by the engine when delayed worker stops finally permit activation. */
export function assertControlledPlanActivation(engine:TaskGraphEngine,planId:string,version:number):void {
  const db=engine.store.db
  if(!db.prepare("SELECT 1 FROM sqlite_master WHERE name='request_plan_admissions'").get())return
  const binding=db.prepare("SELECT request_id,state FROM request_plan_admissions WHERE plan_id=?").get(planId)
  if(!binding)return
  const evidence=new EvidenceStore(engine.store.control)
  if(version===1) {
    const request=JSON.parse(String(db.prepare("SELECT payload FROM control_requests WHERE id=?").get(String(binding.request_id))!.payload))
    const obligation=evidence.obligation(request.obligationId)
    if(!["activating","activated"].includes(String(binding.state))||!obligation||!evidence.satisfied(obligation)||digest(engine.store.planNodes(planId,1))!==digest(request.proposal.map((item:any)=>item.node)))throw new Error("Initial controller plan validation is missing, expired or changed")
    return
  }
  const row=db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? AND state IN ('activating','applied') AND json_extract(payload,'$.revision')=?").get(String(binding.request_id),version)
  if(!row)throw new Error("Revised request plan needs a validated regional activation")
  const repair=JSON.parse(String(row.payload)),stage=JSON.parse(String(db.prepare("SELECT payload FROM scoped_replan_stages WHERE id=? AND state='committed'").get(repair.stageId)?.payload??"null"))
  const obligation=stage&&evidence.obligation(stage.obligationId)
  if(!stage||!obligation||!evidence.satisfied(obligation)||stage.binding.lease.expiresAt<=Date.now()||digest(stage.revisionInput.nodes)!==digest(engine.store.planNodes(planId,version)))throw new Error("Regional activation validation is missing, expired or changed")
  const lease=stage.binding.lease
  if(db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(planId)?.generation!==lease.generation)throw new Error("Regional activation generation changed")
  const inputs=engine.store.planLinks(planId,lease.baseRevision).map(link=>({entityId:link.taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:engine.signals.capture(link.taskId).digest})).sort((a,b)=>a.entityId.localeCompare(b.entityId))
  if(digest(inputs)!==digest(lease.inputVector)||digest(engine.revisions.context(planId,lease.baseRevision))!==stage.binding.contextHash)throw new Error("Regional activation inputs changed while waiting for termination")
}
