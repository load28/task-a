import { cachedResult } from "./cognitive-cache.ts"
import { preflightResult } from "./task-preflight.ts"
import { randomUUID } from "node:crypto"
import { Ajv } from "ajv"
import { ControlStore } from "./store.ts"
import { canonical, digest, positive, unit } from "./value.ts"
import type { ActivationDecision, ActivationGrant, AgentOutput, ContextManifest, RoleVersion } from "../../task-cognition/src/model.ts"
import type { VersionVector } from "../../task-causality/src/model.ts"
import { validateProfile } from "../../task-cognition/src/precision.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { RoleRegistry } from "../../task-cognition/src/roles.ts"
import { attachExecutionInputBoundary,assertExecutionInputBoundary } from "./input-boundary.ts"

export class AdmissionBudgetUnavailableError extends Error {}

export class Admission {
  readonly store:ControlStore
  readonly roles:RoleRegistry
  constructor(store:ControlStore,roles=new RoleRegistry(store)){this.store=store;this.roles=roles}
  record(decision:ActivationDecision):ActivationDecision {
    const row=this.store.db.prepare("SELECT payload FROM activation_decisions WHERE event_id=? AND task_id=? AND role_id=? AND policy_version=?").get(decision.eventId,decision.taskId,decision.role.id,canonical(decision.policy))
    if(row) return JSON.parse(String(row.payload))
    this.store.db.prepare("INSERT INTO activation_decisions VALUES(?,?,?,?,?,?)").run(decision.id,decision.eventId,decision.taskId,decision.role.id,canonical(decision.policy),canonical(decision))
    return decision
  }
  issue(input:Omit<ActivationGrant,"id">,account:string,limit:number):ActivationGrant {
    return this.store.atomic(()=>{
      if(input.reuse||input.profile.level<2)throw new Error("Non-model execution must be selected from a validated controller record")
      const decisionRow=this.store.db.prepare("SELECT payload FROM activation_decisions WHERE id=?").get(input.decisionId)
      if(!decisionRow) throw new Error("Unknown activation decision")
      const decision=JSON.parse(String(decisionRow.payload)) as ActivationDecision
      if(decision.action!=="activate"||decision.taskId!==input.taskId||digest(decision.role)!==digest(input.role)||digest(decision.policy)!==digest(input.policy)) throw new Error("No matching activation authorization")
      if(input.expiresAt<=Date.now()) throw new Error("Expired grant")
      validateProfile(input.profile)
      if(input.profile.level===5) {
        const owner=this.store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(input.taskId)
        const row=owner&&this.store.db.prepare("SELECT payload FROM control_requests WHERE id=?").get(String(owner.request_id))
        const request=row&&JSON.parse(String(row.payload))
        const effective=input.policyProgram&&request&&this.store.db.prepare("SELECT request_id,payload FROM effective_policy_programs WHERE request_id=? AND hash=?").get(request.id,input.policyProgram.hash)
        const program=effective&&String(effective.request_id)===request?.id?JSON.parse(String(effective.payload)) as import("./requests.ts").ControllerProgram:request?.program&&this.store.get<import("./requests.ts").ControllerProgram>("controller_programs",request.program.id,request.program.version)
        const paths=program?[{...program.worker,mode:"task" as const},...(program.workerPrecision?.profiles??[]).map((profile:import("../../task-cognition/src/model.ts").ReasoningProfile)=>({role:program.worker.role,profile,mode:"task" as const})),{...program.planner,mode:"cognition" as const},...(program.replanner?[{...program.replanner,mode:"cognition" as const}]:[])]:[]
        if(!program?.adversarialValidator||!paths.some(path=>path.mode===input.executionMode&&digest(path.profile)===digest(input.profile)&&digest(path.role)===digest(input.role)))throw new Error("L5 grant requires the registered independent review execution protocol")
      }
      const role=this.store.get<RoleVersion>("role_versions",input.role.id,input.role.version)
      const context=this.store.get<ContextManifest>("context_manifests",input.context.id,input.context.version)
      if(!role||!this.roles.executable(input.role,ref=>new EvidenceStore(this.store).valid(ref))||!context||context.hash!==input.contextHash||context.taskId!==input.taskId||digest(context.role)!==digest(input.role)||digest(context.policy)!==digest(input.policy)) throw new Error("Uncertified role or unpinned context")
      const { hash: contextHash, ...contextValue } = context
      if(digest(contextValue)!==contextHash)throw new Error("Corrupted context manifest")
      if(context.tokens>input.profile.maxInputTokens+input.profile.maxOutputTokens)throw new Error("Context exceeds profile budget")
      if(input.allowedTools.some(t=>!role.allowedTools.includes(t))) throw new Error("Grant exceeds role tools")
      if(input.allowedTools.includes("task_graph_cognitive_replan_stage")) {
        const lease=input.replanLease&&this.store.get<import("../../task-causality/src/model.ts").ReplanLease>("replan_leases",input.replanLease.id,input.replanLease.version)
        const plan=lease&&this.store.db.prepare("SELECT root_task_id FROM work_plans WHERE id=?").get(lease.planId)
        const head=lease&&this.store.db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(lease.planId)
        if(!lease||plan?.root_task_id!==input.taskId||head?.generation!==lease.generation||lease.expiresAt<input.expiresAt)throw new Error("Replanning tool requires a current lease bound to the plan root")
      }
      const cached=input.policyControls?.cacheReuse==="disabled"?undefined:cachedResult(this.store,input)
      if(input.preflight&&(digest(input.preflight.requestedProfile)!==digest(input.profile)||!preflightResult(this.store,input.preflight.id,input)))throw new Error("No current deterministic task proof")
      const selected=input.preflight?{...input,profile:{...input.profile,id:`preflight:${input.profile.id}`,level:1 as const,maxToolCalls:0},allowedTools:[]}:cached?{...input,profile:{...input.profile,id:`cache:${input.profile.id}`,level:0 as const,maxToolCalls:0},reuse:{record:cached.record,requestedProfile:input.profile,accountLimit:limit}}:input
      const reserved=cached||input.preflight?0:input.profile.maxInputTokens+input.profile.maxOutputTokens
      positive(limit,"Account token limit")
      const used=Number(this.store.db.prepare("SELECT coalesce(sum(CASE WHEN state='reserved' THEN reserved ELSE coalesce(spent,reserved) END),0) AS total FROM budget_reservations WHERE account=?").get(account)?.total??0)
      if(used+reserved>limit) throw new AdmissionBudgetUnavailableError("Budget unavailable; obligations remain pending")
      const id=randomUUID(),boundary=attachExecutionInputBoundary(this.store,id,selected)
      const grant={...selected,id,inputBoundary:boundary}
      this.store.db.prepare("INSERT INTO activation_grants VALUES(?,?,?,?,?)").run(grant.id,grant.decisionId,grant.taskId,"issued",canonical(grant))
      this.store.db.prepare("INSERT INTO agent_runs VALUES(?,?,?,'candidate',?)").run(randomUUID(),grant.id,grant.taskId,canonical({grant,selectedAt:Date.now()}))
      this.store.db.prepare("INSERT INTO budget_reservations VALUES(?,?,?,NULL,'reserved')").run(grant.id,account,reserved)
      return grant
    })
  }
  claim(id:string,input:{worker:string;specHash:string;inputVector:VersionVector;graphHash:string;generation:number;now:number}):ActivationGrant {
    return this.store.atomic(()=>{
      const row=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(id)
      if(!row||row.state!=="issued") throw new Error("Grant is unknown, fenced or already consumed")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      assertExecutionInputBoundary(this.store,grant,input.now)
      if(!input.worker||grant.worker&&grant.worker!==input.worker||grant.expiresAt<=input.now||grant.specHash!==input.specHash||grant.graphHash!==input.graphHash||grant.generation!==input.generation||digest(grant.inputVector)!==digest(input.inputVector)) throw new Error("Stale or mismatched activation grant")
      if(!this.roles.executable(grant.role,ref=>new EvidenceStore(this.store).valid(ref)))throw new Error("Grant role lifecycle is no longer executable")
      grant.worker=input.worker
      this.store.db.prepare("UPDATE activation_grants SET state='claimed',payload=? WHERE id=?").run(canonical(grant),id)
      const run=this.store.db.prepare("SELECT state FROM agent_runs WHERE grant_id=?").get(id)
      if(run?.state!=="candidate")throw new Error("Grant has no dormant role candidate")
      this.store.db.prepare("UPDATE agent_runs SET state='active',payload=? WHERE grant_id=?").run(canonical({grant,startedAt:input.now}),id)
      return grant
    })
  }
  fence(taskId:string):void {this.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE task_id=? AND state IN ('issued','claimed')").run(taskId)}
  submit(id:string,worker:string,output:AgentOutput,usage:{inputTokens:number;outputTokens:number;toolCalls:number;elapsedMs:number}):void {
    this.store.atomic(()=>{
      const row=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(id)
      if(!row||row.state!=="claimed") throw new Error("Result has no active grant")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      assertExecutionInputBoundary(this.store,grant)
      if(grant.worker!==worker||output.taskId!==grant.taskId||grant.expiresAt<=Date.now()) throw new Error("Late or foreign role result")
      if(!this.roles.executable(grant.role,ref=>new EvidenceStore(this.store).valid(ref)))throw new Error("Grant role lifecycle is no longer executable")
      for(const value of Object.values(usage)) if(!Number.isFinite(value)||value<0) throw new Error("Missing actual usage")
      const p=grant.profile
      if(usage.inputTokens>p.maxInputTokens||usage.outputTokens>p.maxOutputTokens||usage.toolCalls>p.maxToolCalls||usage.elapsedMs>p.timeoutMs) throw new Error("Execution exceeded granted budget")
      const role=this.store.get<RoleVersion>("role_versions",grant.role.id,grant.role.version)!
      const validate=new Ajv({strict:false,allErrors:true}).compile(role.outputSchema)
      if(!validate(output)) throw new Error(`Invalid role result: ${JSON.stringify(validate.errors)}`)
      for(const field of ["findings","decisions","risks","unresolvedQuestions","evidence","proposedTasks"] as const) if(!Array.isArray(output[field])) throw new Error(`Missing structured ${field}`)
      unit(output.confidence,"Result confidence")
      if(typeof output.requiresEscalation!=="boolean") throw new Error("Missing escalation disposition")
      const evidence=new EvidenceStore(this.store)
      output.evidence.forEach(ref=>evidence.require(ref))
      this.store.db.prepare("UPDATE activation_grants SET state='completed' WHERE id=?").run(id)
      this.store.db.prepare("UPDATE agent_runs SET state='completed',payload=? WHERE grant_id=?").run(canonical({grant,output,usage}),id)
      this.store.db.prepare("UPDATE budget_reservations SET spent=?,state='settled' WHERE id=?").run(usage.inputTokens+usage.outputTokens,id)
      this.store.event({id:randomUUID(),type:"AgentCompleted",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:id,output,usage}})
    })
  }
}
