import type { ActivationGrant,AgentOutput } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ControlledRequest,ControllerProgram,PermissionTransition,RequestController } from "./requests.ts"
import { currentInputVector } from "./completion.ts"
import { canonical,digest } from "./value.ts"

export interface RequestPermission {
  id:string;requestId:string;sessionId:string;grantId:string;transition:PermissionTransition
  state:"pending"|"approved"|"rejected"|"cancelled"|"superseded";source:VersionRef;reply?:"once"|"reject";evidence?:VersionRef
}

/** A permission reply selects one immutable, operator-registered program
 * transition. It never edits a role, scope, policy, or budget in place. */
export class RequestPermissions {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS request_permissions(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS request_permissions_request ON request_permissions(request_id,state)")
  }
  private save(permission:RequestPermission):void {
    this.controller.store.db.prepare("INSERT INTO request_permissions VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,payload=excluded.payload").run(permission.id,permission.requestId,permission.state,canonical(permission))
  }
  get(id:string):RequestPermission|undefined {
    const row=this.controller.store.db.prepare("SELECT payload FROM request_permissions WHERE id=?").get(id)
    return row?JSON.parse(String(row.payload)):undefined
  }
  pending(requestId:string):RequestPermission[] {
    return this.controller.store.db.prepare("SELECT payload FROM request_permissions WHERE request_id=? AND state='pending' ORDER BY rowid").all(requestId).map(row=>JSON.parse(String(row.payload)))
  }
  ask(request:ControlledRequest,program:ControllerProgram,output:AgentOutput):RequestPermission {
    if(!output.requiresEscalation||output.unresolvedQuestions.length!==1)throw new Error("Escalation permission needs one registered transition request")
    const requested=output.unresolvedQuestions[0] as {kind?:unknown;transitionId?:unknown}|null
    if(!requested||requested.kind!=="permission"||typeof requested.transitionId!=="string")throw new Error("Escalation permission must name a registered transition")
    const transition=program.permissionTransitions?.find(item=>item.id===requested.transitionId)
    if(!transition)throw new Error("Permission transition is not registered")
    if(!this.controller.store.get<ControllerProgram>("controller_programs",transition.program.id,transition.program.version))throw new Error("Permission transition target is unavailable")
    transition.authorization.forEach(ref=>this.controller.runtime.evidence.require(ref))
    const grantId=request.plannerGrant!,grant=this.assertGrantCurrent(request,grantId)
    const content={requestId:request.id,grantId,transition,output},id=`permission:${digest({requestId:request.id,grantId,transition:transition.id})}`
    const source=this.controller.runtime.evidence.put({id,version:1,type:"agent",source:grantId,producer:grant.role.id,validatorVersion:"permission-transition-request/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:grant.inputVector,confidence:output.confidence,expiresAt:null})
    const permission:RequestPermission={id,requestId:request.id,sessionId:request.sessionId,grantId,transition,state:"pending",source}
    this.save(permission)
    this.controller.store.event({id,type:"RequestPermissionRaised",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{permissionId:id,evidence:source,transition:transition.id}})
    return permission
  }
  answer(requestId:string,sessionId:string,id:string,reply:unknown):void {
    const controller=this.controller,store=controller.store
    store.atomic(()=>{
      const request=controller.get(requestId),permission=this.get(id)
      if(!request||request.sessionId!==sessionId||!permission||permission.requestId!==request.id||permission.sessionId!==sessionId)throw new Error("Permission does not belong to this request and session")
      if(reply!=="once"&&reply!=="reject")throw new Error("Permission reply must be once or reject")
      if(permission.state!=="pending") {
        if(permission.reply!==reply)throw new Error("Permission reply identity conflict")
        return
      }
      if(request.state!=="waiting")throw new Error("Permission is no longer pending")
      const grant=this.assertGrantCurrent(request,permission.grantId)
      permission.transition.authorization.forEach(ref=>controller.runtime.evidence.require(ref))
      if(!store.get<ControllerProgram>("controller_programs",permission.transition.program.id,permission.transition.program.version))throw new Error("Permission transition target is unavailable")
      const content={requestId,permissionId:id,reply,transition:permission.transition},evidence=controller.runtime.evidence.put({id:`permission-reply:${id}`,version:1,type:"user",source:sessionId,producer:"request-controller",validatorVersion:"permission-transition-reply/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:grant.inputVector,confidence:1,expiresAt:null})
      permission.reply=reply;permission.evidence=evidence;permission.state=reply==="once"?"approved":"rejected";this.save(permission)
      request.permissionChanges=[...(request.permissionChanges??[]),{permissionId:id,from:request.program!,to:permission.transition.program,reply,evidence,source:permission.source}]
      if(reply==="once") {request.program=permission.transition.program;request.state="resuming";delete request.reason}
      else {request.state="waiting";request.reason="등록된 권한 전이를 사용자가 거절했습니다."}
      store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
      store.event({id:`permission-reply:${id}`,type:reply==="once"?"RequestPermissionApproved":"RequestPermissionRejected",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{permissionId:id,evidence,transition:permission.transition.id}})
    })
  }
  assertCurrent(request:ControlledRequest,id:string):ActivationGrant {
    const permission=this.get(id)
    if(!permission||permission.requestId!==request.id||permission.state!=="approved")throw new Error("Permission transition is not approved")
    if(digest(request.program)!==digest(permission.transition.program)||!permission.evidence)throw new Error("Permission transition target changed")
    this.controller.runtime.evidence.require(permission.source)
    this.controller.runtime.evidence.require(permission.evidence)
    permission.transition.authorization.forEach(ref=>this.controller.runtime.evidence.require(ref))
    return this.assertGrantCurrent(request,permission.grantId)
  }
  private assertGrantCurrent(request:ControlledRequest,grantId:string):ActivationGrant {
    this.controller.runtime.files.assertObservedReadsCurrent(grantId)
    const row=this.controller.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
    const grant=row&&JSON.parse(String(row.payload)) as ActivationGrant|undefined
    const snapshot=this.controller.runtime.engine.signals.capture(request.taskId)
    if(row?.state!=="completed"||!grant||grantId!==request.plannerGrant||grant.specHash!==snapshot.specHash||digest(grant.inputVector)!==digest(currentInputVector(this.controller.runtime.engine,request.taskId)))throw new Error("Permission refers to stale planning inputs")
    return grant
  }
  cancel(requestId:string):void {
    for(const permission of this.pending(requestId)){permission.state="cancelled";this.save(permission)}
  }
  supersedeForChange(requestId:string,causeId:string):void {
    const request=this.controller.get(requestId)
    if(!request)return
    for(const permission of this.pending(requestId)) {
      permission.state="superseded";this.save(permission)
      this.controller.store.event({id:`permission-superseded:${permission.id}`,type:"RequestPermissionSuperseded",entityId:request.taskId,correlationId:request.id,causationId:causeId,schemaVersion:1,timestamp:Date.now(),payload:{permissionId:permission.id,causeId,source:permission.source}})
    }
  }
}
