import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import type { ActivationGrant,AgentOutput,RoleVersion,Signals } from "../../task-cognition/src/model.ts"
import { FEATURES } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { observationInputVector } from "./completion.ts"
import { canonical,digest } from "./value.ts"
import { inputBoundaryEvidence } from "./input-boundary.ts"

/** L5 is an execution protocol: separate read-only grants and a joint verdict. */
export class AdversarialReview {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS adversarial_reviews(source_grant TEXT PRIMARY KEY,request_id TEXT NOT NULL,task_id TEXT NOT NULL,state TEXT NOT NULL,obligation_id TEXT,payload TEXT NOT NULL)")
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("adversarial-review/v1","independent-grants-and-joint-verdict/v1",event=>{
      if(event.type==="AgentCompleted") {
        const {grantId,output}=event.payload as {grantId:string;output:AgentOutput}
        const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
        const grant=row&&JSON.parse(String(row.payload)) as ActivationGrant|undefined
        if(!grant||row?.state!=="completed"||grant.executionMode!=="task"||grant.profile.level!==5||output.unresolvedQuestions.length||output.requiresEscalation)return
        const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(grant.taskId),request=owner&&this.runtime.requests.get(String(owner.request_id))
        if(!request?.program)return
        const program=store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version)!
        if(!program.adversarialValidator)throw new Error("L5 needs a registered joint review validator")
        const tuple=observationInputVector(this.runtime.engine,grant.taskId)
        const observation=store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=? AND json_extract(payload,'$.kind')='prediction-state' ORDER BY rowid DESC").all(grant.taskId).map(row=>JSON.parse(String(row.payload))).find(obligation=>digest(obligation.tuple)===digest(tuple))
        if(!observation)throw new Error("L5 requires a pinned current observation obligation")
        const content={sourceGrant:grant.id,output,policy:grant.policy,profile:grant.profile,requirement:"Independent adversarial review required by the registered L5 profile"}
        const proof=evidence.put({id:`adversarial-source:${grant.id}`,version:1,type:"runtime",source:"accepted L5 result",producer:"adversarial-review",validatorVersion:"adversarial-source/v1",timestamp:event.timestamp,content,contentHash:digest(content),confidence:1,inputVector:grant.inputVector,expiresAt:null})
        const decisions:string[]=[]
        for(const id of grant.profile.independentRoles) {
          const entry=program.specialists!.find(entry=>entry.role.id===id)!,role=store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!
          const prior=store.db.prepare("SELECT d.payload FROM activation_decisions d JOIN activation_grants g ON g.decision_id=d.id WHERE d.task_id=? AND d.role_id=? ORDER BY d.rowid DESC").all(grant.taskId,id)
          const signals=Object.fromEntries(FEATURES.map(feature=>[feature,null])) as Signals
          const decision=this.runtime.policyReplay.recordActivation({taskId:grant.taskId,eventId:`adversarial:${grant.id}:${id}`,eligible:this.runtime.engine.store.executionAllowed(grant.taskId),role,policy:grant.policy,signals,now:event.timestamp,invocations:prior.length,lastInvocation:prior[0]?JSON.parse(String(prior[0].payload)).timestamp:undefined,requiredBy:proof},request.id,[proof,...inputBoundaryEvidence(grant)])
          decisions.push(decision.id)
          store.db.prepare("INSERT INTO specialist_demands VALUES(?,?,1,'deferred',NULL,NULL,?)").run(decision.id,grant.taskId,canonical({requestId:request.id,entry,proofRef:proof,obligationId:observation.id,signals,budget:"",kind:"adversarial",sourceGrant:grant.id,requiredBy:proof}))
        }
        store.db.prepare("INSERT INTO adversarial_reviews VALUES(?,?,?,'reviewing',NULL,?)").run(grant.id,request.id,grant.taskId,canonical({decisions,proof,validator:program.adversarialValidator,tuple}))
      }
      if(!["AgentCompleted","ValidationSatisfied","ValidatorFailed","ValidatorExecutionFailed","SpecialistReviewValidated"].includes(event.type))return
      for(const row of store.db.prepare("SELECT * FROM adversarial_reviews WHERE task_id=? AND state IN ('reviewing','validating')").all(event.entityId))this.advance(row)
      if(event.type==="ValidatorFailed") {
        const {obligationId,evidence:failure}=event.payload as {obligationId:string;evidence:VersionRef}
        const row=store.db.prepare("SELECT * FROM adversarial_reviews WHERE obligation_id=? AND state='validating'").get(obligationId)
        const obligation=evidence.obligation(obligationId),proof=evidence.valid(failure)?evidence.require(failure):undefined
        if(row&&obligation&&proof&&(proof.content as {passed?:boolean}).passed===false&&digest(proof.inputVector)===digest(obligation.tuple)) {
          const payload=JSON.parse(String(row.payload))
          if(digest(payload.tuple)===digest(observationInputVector(this.runtime.engine,String(row.task_id)))) {
            store.db.prepare("UPDATE adversarial_reviews SET state='failed' WHERE source_grant=?").run(String(row.source_grant))
            store.event({id:`adversarial-failed:${row.source_grant}`,type:"AdversarialReviewFailed",entityId:String(row.task_id),correlationId:String(row.request_id),causationId:event.id,schemaVersion:1,timestamp:event.timestamp,payload:{taskIds:[String(row.task_id)],reason:"adversarial review failure",adversarialReview:{grantId:row.source_grant},evidence:[failure]}})
          }
        }
      }
      // Validation events for the joint obligation identify the source grant.
      if(event.type!=="AgentCompleted") {
        const obligationId=(event.payload as {obligationId?:string}).obligationId
        const row=obligationId&&store.db.prepare("SELECT * FROM adversarial_reviews WHERE obligation_id=?").get(obligationId)
        if(row)this.advance(row)
      }
    },1000)
  }
  private advance(row:Record<string,unknown>):void {
    const {store,evidence}=this.runtime,payload=JSON.parse(String(row.payload)) as {decisions:string[];proof:VersionRef;validator:string;tuple:ReturnType<typeof observationInputVector>}
    if(digest(payload.tuple)!==digest(observationInputVector(this.runtime.engine,String(row.task_id))))return
    if(row.state==="validating") {
      const obligation=evidence.obligation(String(row.obligation_id))!
      if(evidence.satisfied(obligation)) {
        store.db.prepare("UPDATE adversarial_reviews SET state='satisfied' WHERE source_grant=?").run(String(row.source_grant))
        this.runtime.completeObserved(String(row.task_id))
        store.event({id:`adversarial-validated:${row.source_grant}`,type:"AdversarialReviewValidated",entityId:String(row.task_id),correlationId:String(row.request_id),schemaVersion:1,timestamp:Date.now(),payload:{sourceGrant:row.source_grant,obligationId:obligation.id,evidence:obligation.evidence}})
      }
      return
    }
    if(row.state!=="reviewing")return
    const reviews=payload.decisions.map(id=>store.db.prepare("SELECT * FROM specialist_demands WHERE decision_id=?").get(id))
    if(reviews.some(row=>row?.state!=="satisfied"))return
    const proofs:VersionRef[]=[payload.proof],outputs=[]
    for(const review of reviews) {
      const obligation=evidence.obligation(String(review!.obligation_id))!
      if(!evidence.satisfied(obligation))return
      const run=store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=? AND state='completed'").get(String(review!.grant_id))
      if(!run)return
      const value=JSON.parse(String(run.payload))
      if(value.output.unresolvedQuestions.length||value.output.requiresEscalation)return
      proofs.push(...obligation.evidence,...obligation.reason)
      outputs.push({grantId:review!.grant_id,role:value.grant.role,output:value.output,validation:obligation.evidence})
    }
    const content={source:evidence.require(payload.proof),reviews:outputs,contract:"Independently reconcile all review conclusions against the accepted source result. Conflicting or unknown conclusions must fail; each reviewer passing alone is insufficient."}
    const tuple=[...payload.tuple,{entityId:String(row.source_grant),port:"adversarial-reviews",view:"joint-review",version:1,hash:digest(content)}]
    const proof=evidence.put({id:`adversarial-joint:${row.source_grant}`,version:1,type:"runtime",source:"separately validated review results",producer:"adversarial-review",validatorVersion:"adversarial-joint/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:tuple,expiresAt:null})
    const obligation=evidence.createObligation({entityId:String(row.task_id),tuple,kind:"adversarial-joint",mandatory:true,validators:[payload.validator],reason:[...new Map([...proofs,proof].map(ref=>[canonical(ref),ref])).values()]})
    store.db.prepare("UPDATE adversarial_reviews SET state='validating',obligation_id=? WHERE source_grant=?").run(obligation.id,String(row.source_grant))
  }
}
