import type { RequestController,ControlledRequest,ControllerProgram } from "./requests.ts"
import type { RequestQuestion } from "./request-questions.ts"
import type { ActivationGrant,AgentOutput,RoleVersion,ActivationDecision } from "../../task-cognition/src/model.ts"
import { activation } from "../../task-cognition/src/activation.ts"
import { controlledContext } from "../../task-context/src/controlled.ts"
import { observationInputVector } from "./completion.ts"
import { canonical,digest } from "./value.ts"

/** A reply continues one review obligation; it never reopens the implementation. */
export class SpecialistQuestions {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS specialist_question_resumptions(question_id TEXT PRIMARY KEY,decision_id TEXT NOT NULL,old_grant TEXT NOT NULL UNIQUE,new_grant TEXT NOT NULL UNIQUE,old_obligation TEXT)")
  }
  superseded(grantId:string):boolean {return !!this.controller.store.db.prepare("SELECT 1 FROM specialist_question_resumptions WHERE old_grant=?").get(grantId)}
  advance(request:ControlledRequest,program:ControllerProgram,taskId:string):boolean {
    const {store}=this.controller
    for(const row of store.db.prepare("SELECT d.decision_id,d.grant_id,r.payload FROM specialist_demands d JOIN agent_runs r ON r.grant_id=d.grant_id WHERE d.task_id=? AND r.state='completed' ORDER BY d.rowid").all(taskId)) {
      const output=JSON.parse(String(row.payload)).output as AgentOutput
      if(!output.unresolvedQuestions.length&&!output.requiresEscalation)continue
      const existing=store.db.prepare("SELECT id FROM request_questions WHERE json_extract(payload,'$.grantId')=?").get(String(row.grant_id))
      const question=existing?this.controller.questions.get(String(existing.id))!:this.controller.questions.ask(request,program,output,{grantId:String(row.grant_id),target:{kind:"specialist",taskId,decisionId:String(row.decision_id)}})
      if(question.state!=="pending")throw new Error("Specialist clarification is not ready for another invocation")
      request.state="waiting";request.reason="Specialist review requires user clarification"
      store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
      return true
    }
    return false
  }
  assertQuestion(request:ControlledRequest,question:RequestQuestion):ActivationGrant {
    const {store,runtime}=this.controller,target=question.target
    if(target?.kind!=="specialist"||!this.controller.tasks(request.id).includes(target.taskId))throw new Error("Specialist question is outside the current request")
    const demand=store.db.prepare("SELECT grant_id FROM specialist_demands WHERE decision_id=? AND task_id=?").get(target.decisionId,target.taskId)
    const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(question.grantId),grant=row&&JSON.parse(String(row.payload)) as ActivationGrant|undefined
    const snapshot=runtime.engine.signals.capture(target.taskId)
    if(demand?.grant_id!==question.grantId||row?.state!=="completed"||!grant||grant.specHash!==snapshot.specHash||grant.inputVector[0]?.hash!==snapshot.digest||!runtime.engine.signals.matches(target.taskId))throw new Error("Specialist question has stale review inputs")
    runtime.evidence.require(question.source)
    return grant
  }
  resume(request:ControlledRequest,program:ControllerProgram,question:RequestQuestion):boolean {
    const old=this.assertQuestion(request,question),{store,runtime}=this.controller,target=question.target!
    if(target.kind!=="specialist"||question.state!=="answered"||!question.evidence)throw new Error("Specialist resume needs a current answered question")
    if(store.db.prepare("SELECT 1 FROM specialist_question_resumptions WHERE question_id=?").get(question.id))return true
    runtime.evidence.require(question.evidence)
    const entry=program.specialists?.find(entry=>digest(entry.role)===digest(old.role)),role=store.get<RoleVersion>("role_versions",old.role.id,old.role.version)
    if(!entry||!role||old.allowedTools.includes("task_graph_cognitive_write"))throw new Error("Specialist continuation must preserve the registered read-only role")
    const demand=store.db.prepare("SELECT payload,obligation_id FROM specialist_demands WHERE decision_id=?").get(target.decisionId)!,basis=JSON.parse(String(demand.payload))
    runtime.evidence.require(basis.proofRef)
    const obligation=runtime.evidence.obligation(basis.obligationId)
    if(!obligation||!runtime.evidence.applicable(obligation)||digest(obligation.tuple)!==digest(observationInputVector(runtime.engine,old.taskId)))throw new Error("Specialist continuation has stale failure evidence")
    const prior=store.db.prepare("SELECT d.payload FROM activation_decisions d JOIN activation_grants g ON g.decision_id=d.id WHERE d.task_id=? AND d.role_id=? ORDER BY d.rowid DESC").all(old.taskId,role.id)
    const last=prior[0]?JSON.parse(String(prior[0].payload)) as ActivationDecision:undefined
    const input={taskId:old.taskId,eventId:`answer:${question.id}`,eligible:runtime.engine.store.executionAllowed(old.taskId),role,policy:old.policy,signals:basis.signals,now:Date.now(),lastInvocation:last?.timestamp,invocations:prior.length,...(basis.requiredBy?{requiredBy:basis.requiredBy}:{})}
    const candidate=activation(input)
    if(candidate.action!=="activate") {
      runtime.admission.record({...candidate,eventId:`answer-deferred:${question.id}:${digest(candidate.reasons)}`})
      return false
    }
    const context=controlledContext(runtime,old.taskId,role,old.policy,old.profile,[{id:question.id,version:1,kind:"evidence",required:true,depth:0,relevance:1,level:0,dependencies:old.inputVector,path:[request.id,old.taskId],evidence:[basis.proofRef,question.source,question.evidence],content:canonical({originalReview:runtime.evidence.require(question.source),question:question.questions,answers:question.answers,answerEvidence:runtime.evidence.require(question.evidence),originalFailure:runtime.evidence.require(basis.proofRef),contract:"Continue the same read-only review under the unchanged task, role, tools and scopes. Return a fully independently verifiable review result."})}])
    store.put("context_manifests",context.id,1,context)
    const decision=runtime.policyReplay.recordActivation(input,request.id,[basis.proofRef,question.source,question.evidence]),{id,worker,...fields}=old
    const grant=runtime.admission.issue({...fields,decisionId:decision.id,graphHash:runtime.graph.hash(),context:{id:context.id,version:1},contextHash:context.hash,expiresAt:Date.now()+Math.min(program.grantLifetimeMs,old.profile.timeoutMs),generation:old.generation+1},program.account,program.tokenLimit)
    // The same mandatory demand remains unresolved until the NEW output passes
    // its validators. No receipt for the unanswered output is marked successful.
    store.db.prepare("INSERT INTO specialist_question_resumptions VALUES(?,?,?,?,?)").run(question.id,target.decisionId,old.id,grant.id,demand.obligation_id??null)
    store.db.prepare("UPDATE specialist_demands SET mandatory=1,state='issued',grant_id=?,obligation_id=NULL WHERE decision_id=?").run(grant.id,target.decisionId)
    store.event({id:`specialist-question-resumed:${question.id}`,type:"SpecialistQuestionResumed",entityId:old.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{questionId:question.id,previousGrant:old.id,grantId:grant.id,decisionId:target.decisionId,evidence:question.evidence}})
    return true
  }
}
