import type { AgentOutput,ActivationGrant } from "../../task-cognition/src/model.ts"
import type { RequestController,ControlledRequest,ControllerProgram } from "./requests.ts"
import type { RequestQuestion } from "./request-questions.ts"
import { withTaskInvalidation } from "./task-admission.ts"
import { canonical } from "./value.ts"

/** A user reply starts a new attempt under the existing validated expectation. */
export class WorkerQuestions {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS worker_question_resumptions(question_id TEXT PRIMARY KEY,task_id TEXT NOT NULL,attempt_id TEXT NOT NULL,grant_id TEXT NOT NULL)")
  }
  advance(request:ControlledRequest,program:ControllerProgram,taskId:string):boolean {
    const {runtime,store}=this.controller,attempt=runtime.engine.store.currentAttempt(taskId)
    if(!attempt?.worker?.sessionId)return false
    const row=store.db.prepare("SELECT g.id,r.payload FROM activation_grants g JOIN agent_runs r ON r.grant_id=g.id WHERE g.task_id=? AND json_extract(g.payload,'$.worker')=? AND json_extract(g.payload,'$.executionMode')='task' AND r.state='completed'").get(taskId,attempt.worker.sessionId)
    if(!row)return false
    const output=JSON.parse(String(row.payload)).output as AgentOutput
    if(!output.unresolvedQuestions.length&&!output.requiresEscalation)return false
    if(store.db.prepare("SELECT 1 FROM worker_question_resumptions WHERE task_id=? AND attempt_id=?").get(taskId,attempt.id))return false
    if(output.requiresEscalation)throw new Error("Worker escalation requires scoped evidence review")
    if(runtime.engine.requireTask(taskId).status!=="implemented")throw new Error("Worker question has no settled implemented result")
    const question=this.controller.questions.ask(request,program,output,{grantId:String(row.id),target:{kind:"worker",taskId,attemptId:attempt.id,expectationVersion:store.head("task_expectations",taskId)}})
    request.state="waiting";request.reason="작업을 이어가기 위한 사용자 답변을 기다리고 있습니다."
    store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
    return !!question
  }
  assertQuestion(request:ControlledRequest,question:RequestQuestion):ActivationGrant {
    const target=question.target
    if(target?.kind!=="worker")throw new Error("Not a worker question")
    const {runtime,store}=this.controller,engine=runtime.engine,attempt=engine.store.currentAttempt(target.taskId)
    const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(question.grantId)
    const grant=row&&JSON.parse(String(row.payload)) as ActivationGrant|undefined
    if(!this.controller.tasks(request.id).includes(target.taskId)||!attempt||attempt.id!==target.attemptId||!grant||grant.executionMode!=="task"||grant.taskId!==target.taskId||grant.worker!==attempt.worker?.sessionId||row?.state!=="completed"||engine.requireTask(target.taskId).status!=="implemented"||!engine.store.executionAllowed(target.taskId)||!engine.signals.matches(target.taskId)||store.head("task_expectations",target.taskId)!==target.expectationVersion)throw new Error("Worker question refers to stale execution inputs or expectation")
    const expectation=store.get<import("./completion.ts").PinnedExpectation>("task_expectations",target.taskId,target.expectationVersion)
    if(!expectation||expectation.specHash!==engine.signals.capture(target.taskId).specHash)throw new Error("Worker question has a stale expectation")
    expectation.evidence.forEach(ref=>runtime.evidence.require(ref))
    return grant
  }
  resume(request:ControlledRequest,program:ControllerProgram,question:RequestQuestion):boolean {
    const previous=this.assertQuestion(request,question)
    if(question.target?.kind!=="worker"||question.state!=="answered"||!question.evidence)throw new Error("Worker resume requires an answered question")
    const {runtime,store}=this.controller,engine=runtime.engine,{taskId,attemptId}=question.target
    if(store.db.prepare("SELECT 1 FROM activation_grants WHERE task_id=? AND state IN ('issued','claimed')").get(taskId))return false
    const expectation=store.get("task_expectations",taskId,question.target.expectationVersion)
    withTaskInvalidation(engine,taskId,[question.source,question.evidence],()=>engine.reopenTask(taskId,`User clarified worker question ${question.id}`))
    const grant=this.controller.issueRepair(request,program,taskId,{request:request.text,task:engine.requireTask(taskId),expectation,clarifications:request.clarifications,contract:"Continue the interrupted work using the user's clarification. Keep the original goal, expectation, acceptance criteria, and write scopes. Scope changes require evidence-based escalation."},`answer:${question.id}`,previous.profile)
    store.db.prepare("INSERT INTO worker_question_resumptions VALUES(?,?,?,?)").run(question.id,taskId,attemptId,grant.id)
    store.event({id:`worker-resume:${question.id}`,type:"WorkerQuestionResumed",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{questionId:question.id,attemptId,grantId:grant.id,evidence:question.evidence}})
    return true
  }
}
