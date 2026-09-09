import { observationInputVector } from "./completion.ts"
import type { PredictionError } from "../../task-causality/src/model.ts"
import { randomUUID } from "node:crypto"
import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram,ControlledRequest } from "./requests.ts"
import type { RoleVersion,Signals,ActivationGrant,AgentOutput,ActivationDecision } from "../../task-cognition/src/model.ts"
import { FEATURES } from "../../task-cognition/src/model.ts"
import { activation } from "../../task-cognition/src/activation.ts"
import { controlledContext } from "../../task-context/src/controlled.ts"
import { digest } from "./value.ts"

/** Optional specialists are reactions to measured evidence, never a fixed sequence. */
export class RoleRouter {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){
    this.runtime=runtime
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS specialist_demands(decision_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,mandatory INTEGER NOT NULL,state TEXT NOT NULL,grant_id TEXT,obligation_id TEXT,payload TEXT NOT NULL)")
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS specialist_timers(id TEXT PRIMARY KEY,decision_id TEXT NOT NULL,due_at INTEGER NOT NULL,state TEXT NOT NULL)")
  }
  private cooldown(decision:ActivationDecision,lastInvocation?:number,cooldownMs=0):void {
    if(decision.action!=="defer"||!decision.reasons.includes("cooldown; obligations remain pending")||lastInvocation===undefined)return
    this.runtime.store.db.prepare("INSERT OR IGNORE INTO specialist_timers VALUES(?,?,?,'pending')").run(`cooldown:${decision.id}`,decision.id,lastInvocation+cooldownMs)
  }
  ingest():number {
    const runtime=this.runtime,store=runtime.store
    return store.consume("specialist-router/v1","measured-failure/v1",event=>{
      if(event.type==="ValidationSatisfied") {
        const id=(event.payload as {obligationId:string}).obligationId,obligation=runtime.evidence.obligation(id)
        if(obligation?.kind==="role-output"&&runtime.evidence.satisfied(obligation))store.db.prepare("UPDATE specialist_demands SET state='satisfied' WHERE obligation_id=?").run(id)
        return
      }
      if(!["ValidatorFailed","PredictionObserved","AgentCompleted"].includes(event.type))return
      const row=store.db.prepare("SELECT r.payload FROM control_requests r JOIN control_request_tasks t ON t.request_id=r.id WHERE t.task_id=? ORDER BY r.rowid DESC LIMIT 1").get(event.entityId)
      if(!row)return
      const request=JSON.parse(String(row.payload)) as ControlledRequest
      if(["completed","cancelled"].includes(request.state)||!request.program)return
      const program=store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version)
      if(!program?.specialists?.length)return
      if(event.type==="AgentCompleted") {
        const payload=event.payload as {grantId:string;output:AgentOutput}
        const row=store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(payload.grantId)
        if(!row)return
        const grant=JSON.parse(String(row.payload)) as ActivationGrant
        const entry=program.specialists.find(entry=>digest(entry.role)===digest(grant.role))
        if(!entry)return
        const role=store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!
        const content={grantId:grant.id,output:payload.output}
        const reason=runtime.evidence.put({id:`role-output:${grant.id}`,version:1,type:"agent",source:grant.worker!,producer:role.id,validatorVersion:"role-result/v1",timestamp:event.timestamp,content,contentHash:digest(content),inputVector:grant.inputVector,confidence:payload.output.confidence,expiresAt:null})
        const obligation=runtime.evidence.createObligation({entityId:grant.taskId,tuple:[...grant.inputVector,{entityId:grant.id,port:"role-result",view:"structured-output",version:1,hash:digest(content)}],kind:"role-output",mandatory:true,validators:role.validators,reason:[reason]})
        store.db.prepare("UPDATE specialist_demands SET state='validating',obligation_id=? WHERE grant_id=?").run(obligation.id,grant.id)
        return
      }
      let proofRef:{id:string;version:number},obligationId:string
      if(event.type==="PredictionObserved") {
        const error=(event.payload as {error:PredictionError}).error
        if(!error.criticalViolations.length&&!([error.contract,error.behavior,error.dependency,error.goal,error.artifacts,error.riskResidual].some(value=>value!==null&&value>0)))return
        proofRef=error.evidence[0]!
        if(!proofRef||!runtime.evidence.valid(proofRef))return
        const proof=runtime.evidence.require(proofRef)
        const match=store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=?").all(event.entityId).map(row=>JSON.parse(String(row.payload))).find(item=>item.kind==="prediction-state"&&digest(item.tuple)===digest(proof.inputVector))
        if(!match)return
        obligationId=match.id
      }else {
        const payload=event.payload as {evidence:{id:string;version:number};obligationId:string}
        proofRef=payload.evidence;obligationId=payload.obligationId
      }
      const obligation=runtime.evidence.obligation(obligationId)
      // A specialist validator failure is not permission for a recursive QA storm.
      if(obligation?.kind!=="prediction-state"||!runtime.evidence.applicable(obligation))return
      if(!runtime.evidence.valid(proofRef))return
      const evidence=runtime.evidence.require(proofRef)
      if(!["test","runtime"].includes(evidence.type)||event.type==="ValidatorFailed"&&(evidence.content as {passed?:boolean}).passed!==false||digest(evidence.inputVector)!==digest(obligation.tuple)||digest(obligation.tuple)!==digest(observationInputVector(runtime.engine,event.entityId))||!runtime.engine.signals.matches(event.entityId))return
      const signals=Object.fromEntries(FEATURES.map(feature=>[feature,feature==="failure"?1:null])) as Signals
      for(const entry of program.specialists) {
        const role=store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!
        const previous=store.db.prepare("SELECT d.payload FROM activation_decisions d JOIN activation_grants g ON g.decision_id=d.id WHERE d.task_id=? AND d.role_id=? ORDER BY d.rowid DESC").all(event.entityId,role.id)
        const decision=runtime.admission.record(activation({taskId:event.entityId,eventId:event.id,eligible:runtime.engine.store.executionAllowed(event.entityId),role,policy:program.policy,signals,now:event.timestamp,lastInvocation:previous[0]?JSON.parse(String(previous[0].payload)).timestamp:undefined,invocations:previous.length}))
        if(decision.action==="skip"||decision.action==="defer"&&!decision.hard.length)continue
        const demand={requestId:request.id,entry,proofRef,obligationId:obligation.id,signals,budget:this.budget(program.account)}
        store.db.prepare("INSERT OR IGNORE INTO specialist_demands VALUES(?,?,?,'deferred',NULL,NULL,?)").run(decision.id,event.entityId,Number(decision.hard.length>0),JSON.stringify(demand))
        this.cooldown(decision,previous[0]?JSON.parse(String(previous[0].payload)).timestamp:undefined,role.activationPolicy.cooldownMs)
        if(decision.action!=="activate")continue
        try {
          store.atomic(()=>{
            const snapshot=runtime.engine.signals.capture(event.entityId),inputVector=[{entityId:event.entityId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
            const context=controlledContext(runtime,event.entityId,role,program.policy,entry.profile,[{id:proofRef.id,version:proofRef.version,kind:"evidence",content:JSON.stringify({failedValidation:evidence,expectation:store.get("task_expectations",event.entityId,store.head("task_expectations",event.entityId))}),required:true,depth:0,relevance:1,level:0,dependencies:inputVector,path:[request.id,event.entityId],evidence:[proofRef]}])
            store.put("context_manifests",context.id,1,context)
            const grant=runtime.admission.issue({taskId:event.entityId,decisionId:decision.id,specHash:snapshot.specHash,inputVector,graphHash:runtime.graph.hash(),role:entry.role,policy:program.policy,profile:entry.profile,context:{id:context.id,version:1},contextHash:context.hash,readScopes:program.readScopes,writeScopes:[],allowedTools:role.allowedTools,obligations:[obligation.id],expiresAt:Date.now()+Math.min(program.grantLifetimeMs,entry.profile.timeoutMs),generation:1,executionMode:"cognition"},program.account,program.tokenLimit)
            store.db.prepare("UPDATE specialist_demands SET state='issued',grant_id=? WHERE decision_id=?").run(grant.id,decision.id)
          })
        }catch(error) {
          // The failed validation remains mandatory. Lack of budget is not a skip.
          store.event({id:randomUUID(),type:"SpecialistAdmissionDeferred",entityId:event.entityId,correlationId:event.correlationId,schemaVersion:1,timestamp:Date.now(),payload:{decisionId:decision.id,obligationId:obligation.id,reason:error instanceof Error?error.message:"Specialist budget unavailable"}})
        }
      }
    },1000)
  }
  private budget(account:string):string {
    return digest(this.runtime.store.db.prepare("SELECT id,reserved,spent,state FROM budget_reservations WHERE account=? ORDER BY id").all(account).map(row=>({...row})))
  }
  /** Budget changes and durable cooldown expiry re-evaluate permission; polling never calls a model. */
  retry(now=Date.now()):void {
    const runtime=this.runtime,store=runtime.store
    for(const row of store.db.prepare("SELECT * FROM specialist_demands WHERE state='deferred'").all())store.atomic(()=>{
      const demand=JSON.parse(String(row.payload)),request=runtime.requests.get(demand.requestId),taskId=String(row.task_id)
      if(!request?.program||["completed","cancelled"].includes(request.state))return
      const program=store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version)!
      let authorization=JSON.parse(String(store.db.prepare("SELECT payload FROM activation_decisions WHERE id=?").get(demand.authorizationDecisionId??String(row.decision_id))!.payload)) as ActivationDecision
      const entry=demand.entry as ControllerProgram["planner"],role=store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!
      const previous=store.db.prepare("SELECT d.payload FROM activation_decisions d JOIN activation_grants g ON g.decision_id=d.id WHERE d.task_id=? AND d.role_id=? ORDER BY d.rowid DESC").all(taskId,role.id)
      const lastInvocation=previous[0]?JSON.parse(String(previous[0].payload)).timestamp:undefined
      // Also recovers deferred demands written before durable timers existed.
      this.cooldown(authorization,lastInvocation,role.activationPolicy.cooldownMs)
      const timer=store.db.prepare("SELECT * FROM specialist_timers WHERE decision_id=? AND state='pending' AND due_at<=?").get(authorization.id,now)
      const budget=this.budget(program.account)
      if(!timer&&budget===demand.budget)return
      demand.budget=budget
      const persist=()=>store.db.prepare("UPDATE specialist_demands SET payload=? WHERE decision_id=?").run(JSON.stringify(demand),String(row.decision_id))
      persist()
      if(timer) {
        store.db.prepare("UPDATE specialist_timers SET state='fired' WHERE id=?").run(String(timer.id))
        store.event({id:String(timer.id),type:"SpecialistCooldownElapsed",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:now,payload:{decisionId:authorization.id,dueAt:Number(timer.due_at)}})
      }
      if(!runtime.evidence.valid(demand.proofRef)||!runtime.engine.signals.matches(taskId))return
      const obligation=runtime.evidence.obligation(demand.obligationId)
      if(!obligation||!runtime.evidence.applicable(obligation)||digest(obligation.tuple)!==digest(observationInputVector(runtime.engine,taskId)))return
      if(authorization.action!=="activate"&&!timer)return
      const eligibility=activation({...authorization,eventId:timer?String(timer.id):`admission-recheck:${authorization.id}:${budget}`,role,signals:demand.signals,eligible:runtime.engine.store.executionAllowed(taskId),now,lastInvocation,invocations:previous.length})
      if(timer||eligibility.action!=="activate") {
        authorization=runtime.admission.record(eligibility)
        demand.authorizationDecisionId=authorization.id;persist()
        this.cooldown(authorization,lastInvocation,role.activationPolicy.cooldownMs)
      }
      if(eligibility.action!=="activate")return
      try {store.atomic(()=>{
        const proof=runtime.evidence.require(demand.proofRef),snapshot=runtime.engine.signals.capture(taskId),inputVector=[{entityId:taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
        const context=controlledContext(runtime,taskId,role,program.policy,entry.profile,[{id:proof.id,version:proof.version,kind:"evidence",content:JSON.stringify({failedValidation:proof,expectation:store.get("task_expectations",taskId,store.head("task_expectations",taskId))}),required:true,depth:0,relevance:1,level:0,dependencies:inputVector,path:[request.id,taskId],evidence:[demand.proofRef]}])
        store.put("context_manifests",context.id,1,context)
        const grant=runtime.admission.issue({taskId,decisionId:authorization.id,specHash:snapshot.specHash,inputVector,graphHash:runtime.graph.hash(),role:entry.role,policy:program.policy,profile:entry.profile,context:{id:context.id,version:1},contextHash:context.hash,readScopes:program.readScopes,writeScopes:[],allowedTools:role.allowedTools,obligations:[obligation.id],expiresAt:Date.now()+Math.min(program.grantLifetimeMs,entry.profile.timeoutMs),generation:1,executionMode:"cognition"},program.account,program.tokenLimit)
        store.db.prepare("UPDATE specialist_demands SET state='issued',grant_id=? WHERE decision_id=?").run(grant.id,String(row.decision_id))
      })}catch(error){
        store.event({id:randomUUID(),type:"SpecialistAdmissionDeferred",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{decisionId:String(row.decision_id),reason:error instanceof Error?error.message:"Specialist admission remains deferred"}})
      }
    })
  }
}
