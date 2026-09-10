import type { AgentOutput, ActivationGrant } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ControlledRequest, ControllerProgram, RequestController } from "./requests.ts"
import { canonical, digest } from "./value.ts"

export interface RequestQuestion {
  id:string;requestId:string;sessionId:string;grantId:string;questions:string[]
  target?:{kind:"specialist";taskId:string;decisionId:string}|{kind:"regional";repairId:string}|{kind:"worker";taskId:string;attemptId:string;expectationVersion:number}
  state:"pending"|"answered"|"cancelled"|"superseded";source:VersionRef;answers?:string[][];evidence?:VersionRef
}

/** User clarification is evidence for a new bounded decision, never permission
 * to replay a completed invocation or expand its capabilities. */
export class RequestQuestions {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS request_questions(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL); CREATE INDEX IF NOT EXISTS request_questions_request ON request_questions(request_id,state)")
  }
  private save(question:RequestQuestion):void {
    this.controller.store.db.prepare("INSERT INTO request_questions VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,payload=excluded.payload").run(question.id,question.requestId,question.state,canonical(question))
  }
  get(id:string):RequestQuestion|undefined {
    const row=this.controller.store.db.prepare("SELECT payload FROM request_questions WHERE id=?").get(id)
    return row?JSON.parse(String(row.payload)):undefined
  }
  pending(requestId:string):RequestQuestion[] {
    return this.controller.store.db.prepare("SELECT payload FROM request_questions WHERE request_id=? AND state='pending' ORDER BY rowid").all(requestId).map(row=>JSON.parse(String(row.payload)))
  }
  ask(request:ControlledRequest,program:ControllerProgram,output:AgentOutput,continuation?:{grantId:string;target:NonNullable<RequestQuestion["target"]>}):RequestQuestion {
    const controller=this.controller,store=controller.store,grantId=continuation?.grantId??request.plannerGrant!
    if(output.requiresEscalation)throw new Error("Escalation requires independent scoped policy review, not a clarification reply")
    const count=Number(store.db.prepare("SELECT count(*) n FROM request_questions WHERE request_id=?").get(request.id)!.n)
    if(count>=(program.maxClarifications??0))throw new Error("User clarification quota exhausted; the unresolved request remains waiting")
    if(!output.unresolvedQuestions.length||output.unresolvedQuestions.length>3)throw new Error("Clarification must contain one to three explicit user questions")
    const questions=output.unresolvedQuestions.map(value=>{
      const entry=value as {kind?:unknown;question?:unknown}|null
      if(!entry||entry.kind!=="user"||typeof entry.question!=="string"||!entry.question.trim()||entry.question.length>4000)throw new Error("Only explicit structured user questions can enter the reply channel")
      return entry.question
    })
    const grant=JSON.parse(String(store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grantId)!.payload)) as ActivationGrant
    const content={requestId:request.id,grantId,output},id=`question:${digest({requestId:request.id,grantId})}`
    const source=controller.runtime.evidence.put({id,version:1,type:"agent",source:grantId,producer:grant.role.id,validatorVersion:"user-question/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:grant.inputVector,confidence:output.confidence,expiresAt:null})
    const question:RequestQuestion={id,requestId:request.id,sessionId:request.sessionId,grantId,questions,state:"pending",source,...(continuation?{target:continuation.target}:{})}
    this.save(question)
    store.event({id,type:"RequestQuestionRaised",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{questionId:id,evidence:source}})
    return question
  }
  answer(requestId:string,sessionId:string,id:string,answers:unknown):void {
    const controller=this.controller,store=controller.store
    store.atomic(()=>{
      const request=controller.get(requestId),question=this.get(id)
      if(!request||request.sessionId!==sessionId||!question||question.requestId!==request.id||question.sessionId!==sessionId)throw new Error("Question does not belong to this request and session")
      if(!Array.isArray(answers)||answers.length!==question.questions.length||!answers.every(a=>Array.isArray(a)&&a.length===1&&typeof a[0]==="string"&&a[0].trim()&&a[0].length<=16000))throw new Error("Each pending question requires one nonempty answer")
      if(question.state==="answered") {
        if(digest(question.answers)!==digest(answers))throw new Error("Reply identity conflict")
        return
      }
      if(question.state!=="pending"||request.state!=="waiting")throw new Error("Question is no longer pending")
      const grant=this.assertCurrent(request,id)
      const content={requestId,questionId:id,questions:question.questions,answers},evidence=controller.runtime.evidence.put({id:`answer:${id}`,version:1,type:"user",source:sessionId,producer:"request-controller",validatorVersion:"user-answer/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:grant.inputVector,confidence:1,expiresAt:null})
      question.answers=answers;question.evidence=evidence;question.state="answered";this.save(question)
      request.clarifications=[...(request.clarifications??[]),{questionId:id,questions:question.questions,answers,evidence,source:question.source}]
      request.state="resuming";delete request.reason
      store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
      store.event({id:`answer:${id}`,type:"RequestQuestionAnswered",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{questionId:id,evidence}})
    })
  }
  assertCurrent(request:ControlledRequest,id:string):ActivationGrant {
    const question=this.get(id),controller=this.controller
    if(!question||question.requestId!==request.id)throw new Error("Question refers to stale planning inputs")
    controller.runtime.files.assertObservedReadsCurrent(question.grantId)
    if(question.target?.kind==="specialist")return controller.specialistQuestions.assertQuestion(request,question)
    if(question.target?.kind==="worker")return controller.workerQuestions.assertQuestion(request,question)
    if(question.target?.kind==="regional")controller.regional.assertQuestion(request,question)
    else if(question.grantId!==request.plannerGrant)throw new Error("Question refers to stale planning inputs")
    const row=controller.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(question.grantId)
    const grant=row&&JSON.parse(String(row.payload)) as ActivationGrant|undefined
    const snapshot=controller.runtime.engine.signals.capture(request.taskId)
    if(row?.state!=="completed"||!grant||grant.specHash!==snapshot.specHash||grant.inputVector[0]?.hash!==snapshot.digest)throw new Error("Question refers to stale planning inputs")
    return grant
  }
  history(requestId:string):RequestQuestion[] {
    return this.controller.store.db.prepare("SELECT payload FROM request_questions WHERE request_id=? ORDER BY rowid").all(requestId).map(row=>JSON.parse(String(row.payload)))
  }
  supersedeForChange(requestId:string,causeId:string,planning=false):void {
    const request=this.controller.get(requestId)
    if(!request||!request.planId&&!planning||!["waiting","resuming"].includes(request.state)||!request.program)return
    const program=this.controller.store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version)
    if(!program?.replanner&&!planning)return
    const questions=this.history(requestId).filter(question=>question.state==="pending"||request.state==="resuming"&&question.state==="answered"&&question.id===request.clarifications?.at(-1)?.questionId)
    if(!questions.length)return
    for(const question of questions) {
      question.state="superseded";this.save(question)
      this.controller.store.event({id:`question-superseded:${question.id}`,type:"RequestQuestionSuperseded",entityId:request.taskId,correlationId:request.id,causationId:causeId,schemaVersion:1,timestamp:Date.now(),payload:{questionId:question.id,causeId,source:question.source,answer:question.evidence??null}})
    }
    request.state=planning?"pending":"executing";delete request.reason
    this.controller.store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
  }
  cancel(requestId:string):void {
    for(const question of this.pending(requestId)){question.state="cancelled";this.save(question)}
  }
}
