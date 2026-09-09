import type { RequestController,ControllerProgram,ControlledRequest,ProposedTask } from "./requests.ts"
import type { ReplanPatch } from "../../task-causality/src/replan.ts"
import type { PredictionError,ReplanLease,VersionRef } from "../../task-causality/src/model.ts"
import type { RequestQuestion } from "./request-questions.ts"
import type { AgentOutput } from "../../task-cognition/src/model.ts"
import { propagate } from "../../task-causality/src/propagation.ts"
import { canonical,digest } from "./value.ts"

interface Repair {
  id:string;requestId:string;state:"planning"|"waiting"|"validating"|"activating"|"applied"|"rejected"
  questionId?:string;causes:string[];lease:ReplanLease;grantId:string;stageId?:string;revision?:number;proposal?:Proposal
}
interface Proposal {patch:ReplanPatch;tasks:ProposedTask[];summary:string}
interface Cause {attemptId?:string;error?:PredictionError;evidence:VersionRef[];reason:string;taskIds?:string[]}

/** Local exhaustion is causal evidence, not permission to replace an entire plan.
 * Incomplete dependency observations force a conservative region and explicitly
 * prohibit a locality/minimum claim. Feasibility still needs real validators. */
export class RegionalRepairs {
  readonly controller:RequestController
  constructor(controller:RequestController) {
    this.controller=controller
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS request_region_repairs(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS request_task_history(request_id TEXT NOT NULL,task_id TEXT NOT NULL,node_id TEXT NOT NULL,PRIMARY KEY(request_id,task_id))")
  }
  private save(repair:Repair):void {this.controller.store.db.prepare("UPDATE request_region_repairs SET state=?,payload=? WHERE id=?").run(repair.state,canonical(repair),repair.id)}
  advance(request:ControlledRequest,program:ControllerProgram):boolean {
    if(!program.replanner||!request.planId)return false
    const runtime=this.controller.runtime,engine=runtime.engine,store=runtime.store,db=store.db
    const rows=db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? ORDER BY rowid").all(request.id)
    const repairs=rows.map(row=>JSON.parse(String(row.payload)) as Repair),active=repairs.find(item=>!["applied","rejected"].includes(item.state))
    if(active) {
      this.progress(active,request,program);return true
    }
    const used=new Set(repairs.flatMap(item=>item.causes))
    const events=db.prepare("SELECT id,payload FROM event_outbox WHERE type IN ('LocalRepairExhausted','RequestChangeRequested') AND correlation_id=? ORDER BY sequence").all(request.id)
      .filter(row=>!used.has(String(row.id)))
      .map(row=>({id:String(row.id),payload:JSON.parse(String(row.payload)).payload as Cause}))
      .filter(event=>event.payload.reason==="explicit user steering"||event.payload.reason==="local repair quota exhausted"&&this.controller.tasks(request.id).some(id=>engine.store.currentAttempt(id)?.id===event.payload.attemptId))
    if(!events.length)return false
    if(repairs.length>=program.replanner.maxAttempts)throw new Error("Regional repair quota exhausted; unresolved invariants remain")
    // All live role work must settle before pinning the input vector. No request
    // is resubmitted merely because its acknowledgement was lost.
    const ids=[request.taskId,...this.controller.tasks(request.id)]
    for(const id of ids) {
      if(db.prepare("SELECT 1 FROM activation_grants WHERE task_id=? AND state IN ('issued','claimed')").get(id))return true
      if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()&&db.prepare("SELECT 1 FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE g.task_id=? AND d.state IN ('pending','dispatching','stopping')").get(id))return true
    }
    const plan=engine.store.findWorkPlan(request.planId)!,links=engine.store.planLinks(plan.id,plan.currentRevision),nodes=engine.store.planNodes(plan.id,plan.currentRevision)
    const sources=links.filter(link=>events.some(event=>event.payload.taskIds?.includes(link.taskId)||!!event.payload.attemptId&&engine.store.currentAttempt(link.taskId)?.id===event.payload.attemptId)).map(link=>link.taskId)
    const closure=propagate({sources,scopes:["implementation","behavior","contract","dependency","assumption","subgoal","goal"],graphComplete:false,universe:links.map(link=>link.taskId),outgoing:id=>runtime.graph.outgoing(id),threshold:()=>1,preserved:()=>false,sourceCritical:events.some(event=>(event.payload.error?.criticalViolations.length??0)>0)})
    const boundary=links.filter(link=>closure.affected.includes(link.taskId)).map(link=>link.nodeId),changed=links.filter(link=>sources.includes(link.taskId)).map(link=>link.nodeId)
    const evidence=[...new Map(events.flatMap(event=>event.payload.evidence).map(ref=>[canonical(ref),ref])).values()]
    const selection={sources,closure,boundary,candidateDomain:[boundary],minimumProven:false,reason:"process/read completeness is not attested; conservative containing region requires independent feasibility validation"}
    const cause=digest({requestId:request.id,events:events.map(event=>event.id),revision:plan.currentRevision})
    const selectionRef=runtime.evidence.put({id:`region-selection:${cause}`,version:1,type:"runtime",source:"causal propagation with unknown completeness",producer:"regional-repairs",validatorVersion:"region-selection/v1",timestamp:Date.now(),content:selection,contentHash:digest(selection),inputVector:[],confidence:1,expiresAt:null})
    const prior=db.prepare("SELECT payload FROM scoped_revision_bindings WHERE plan_id=? AND version=?").get(plan.id,plan.currentRevision)
    const immutableDecisions:VersionRef[]=prior?[...new Map((JSON.parse(String(prior.payload)) as Array<{decisionRefs:VersionRef[]}>).flatMap(node=>node.decisionRefs).map(ref=>[canonical(ref),ref])).values()]:[]
    const lease=runtime.replanning.issue({planId:plan.id,boundary,changedNodes:changed,invalidatedNodes:changed,preservedNodes:nodes.filter(node=>!boundary.includes(node.nodeId)).map(node=>node.nodeId),immutableDecisions,invalidAssumptions:[],predictionErrors:events.flatMap(event=>event.payload.error?[event.payload.error]:[]),violatedInvariants:events.flatMap(event=>event.payload.error?event.payload.error.criticalViolations.length?event.payload.error.criticalViolations:[`failed expectation ${event.payload.error.expectation.id}@${event.payload.error.expectation.version}`]:["Explicit user amendment requires plan consistency validation"]),evidence:[...evidence,selectionRef],expiresAt:Date.now()+program.grantLifetimeMs,validators:program.replanner.validators})
    const grant=this.controller.issueReplanner(request,program,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],lease,region:nodes.filter(node=>boundary.includes(node.nodeId)),expectations:request.proposal,selection,failures:evidence.map(ref=>runtime.evidence.require(ref)),contract:"For missing user information, return unresolvedQuestions as {kind: user, question: string}, with requiresEscalation=false. Otherwise return exactly one proposedTasks item {patch: ReplanPatch, tasks: [{node: PlanNode, expectation: six dimensions}], summary}. Preserve the original goal and immutable decisions, applying only explicit user amendments. tasks must describe exactly revised/new nodes; never relax expected outcomes to observed failures."},`regional-repair:${cause}`,lease.expiresAt)
    const repair:Repair={id:cause,requestId:request.id,state:"planning",causes:events.map(event=>event.id),lease,grantId:grant.id}
    db.prepare("INSERT INTO request_region_repairs VALUES(?,?,?,?)").run(repair.id,request.id,repair.state,canonical(repair))
    return true
  }
  assertQuestion(request:ControlledRequest,question:RequestQuestion):Repair {
    const row=this.controller.store.db.prepare("SELECT payload FROM request_region_repairs WHERE id=? AND request_id=?").get(question.target?.kind==="regional"?question.target.repairId:"",request.id)
    const repair=row&&JSON.parse(String(row.payload)) as Repair|undefined
    if(!repair||repair.state!=="waiting"||repair.questionId!==question.id||repair.grantId!==question.grantId||repair.lease.planId!==request.planId)throw new Error("Regional question is no longer current")
    this.controller.runtime.replanning.assertCurrent(repair.lease.id)
    return repair
  }
  resume(request:ControlledRequest,program:ControllerProgram,question:RequestQuestion):void {
    const repair=this.assertQuestion(request,question),runtime=this.controller.runtime
    if(question.state!=="answered"||!program.replanner)throw new Error("Regional resume requires an answered question and registered replanner")
    const grant=this.controller.issueReplanner(request,program,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],lease:repair.lease,region:runtime.engine.store.planNodes(repair.lease.planId,repair.lease.baseRevision).filter(node=>repair.lease.boundary.includes(node.nodeId)),expectations:request.proposal,failures:repair.lease.evidence.map(ref=>runtime.evidence.require(ref)),contract:"Continue the scoped repair using the original lease, goal, preserved nodes, immutable decisions and invariants. Return one proposedTasks item {patch: ReplanPatch,tasks:[{node:PlanNode,expectation:six dimensions}],summary}. Answers do not extend scope or relax expected outcomes."},`answer:${question.id}`,repair.lease.expiresAt)
    repair.grantId=grant.id;repair.state="planning";delete repair.questionId;this.save(repair)
  }
  private progress(repair:Repair,request:ControlledRequest,program:ControllerProgram):void {
    const runtime=this.controller.runtime,engine=runtime.engine,store=runtime.store,db=store.db
    if(repair.state!=="activating"&&Date.now()>=repair.lease.expiresAt)throw new Error("Regional repair lease expired; stale output cannot be adopted")
    if(repair.state==="planning") {
      const state=db.prepare("SELECT state FROM activation_grants WHERE id=?").get(repair.grantId)?.state
      if(state==="fenced")throw new Error("Regional cognition grant was fenced; no blind retry")
      if(state!=="completed")return
      if(db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()&&db.prepare("SELECT state FROM grant_dispatches WHERE grant_id=?").get(repair.grantId)?.state!=="completed")return
      const output=JSON.parse(String(db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(repair.grantId)!.payload)).output as AgentOutput
      if(output.unresolvedQuestions.length) {
        runtime.replanning.assertCurrent(repair.lease.id)
        const question=this.controller.questions.ask(request,program,output,{grantId:repair.grantId,target:{kind:"regional",repairId:repair.id}})
        repair.questionId=question.id;repair.state="waiting";this.save(repair)
        request.state="waiting";request.reason="재계획에 필요한 사용자 답변을 기다리고 있습니다."
        db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)
        return
      }
      if(output.requiresEscalation||output.proposedTasks.length!==1)throw new Error("Regional proposal left unresolved escalation or has no unique patch")
      const proposal=output.proposedTasks[0] as Proposal
      if(!proposal.patch||!proposal.summary?.trim())throw new Error("Incomplete regional patch")
      this.controller.validateProposal(proposal.tasks,program)
      const stage=runtime.replanning.stage(repair.lease.id,proposal.patch,proposal.tasks.map(item=>item.node),proposal.summary,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],expectations:proposal.tasks.map(item=>({nodeId:item.node.nodeId,expectation:item.expectation})),previousExpectations:request.proposal})
      repair.stageId=stage.id;repair.proposal=proposal;repair.state="validating";this.save(repair);return
    }
    if(repair.state==="validating") {
      const stage=runtime.replanning.describe(repair.stageId!),obligation=runtime.evidence.obligation(stage.obligationId)!
      if(!runtime.evidence.satisfied(obligation))return
      const result=runtime.replanning.commit(repair.stageId!)
      repair.revision=result.revision.version;repair.state="activating";this.save(repair)
      engine.approveWorkPlan({planId:repair.lease.planId,version:repair.revision,approvalSource:`validated regional repair:${repair.id}`})
    }
    if(repair.state==="activating") {
      if(engine.store.activePlanVersion(repair.lease.planId)!==repair.revision)return
      const stage=runtime.replanning.describe(repair.stageId!),proof=runtime.evidence.obligation(stage.obligationId)!
      if(!runtime.evidence.satisfied(proof))throw new Error("Regional validation expired before expectation activation")
      const proposed=new Map(request.proposal!.map(item=>[item.node.nodeId,item.expectation]))
      for(const item of repair.proposal!.tasks)proposed.set(stage.assigned?.[item.node.nodeId]??item.node.nodeId,item.expectation)
      db.prepare("INSERT OR IGNORE INTO request_task_history SELECT * FROM control_request_tasks WHERE request_id=?").run(request.id)
      db.prepare("DELETE FROM control_request_tasks WHERE request_id=?").run(request.id)
      const nodes=engine.store.planNodes(repair.lease.planId,repair.revision!),links=engine.store.planLinks(repair.lease.planId,repair.revision!)
      request.proposal=nodes.map(node=>({node,expectation:proposed.get(node.nodeId)!}))
      for(const link of links) {
        db.prepare("INSERT INTO control_request_tasks VALUES(?,?,?)").run(request.id,link.taskId,link.nodeId)
        db.prepare("INSERT OR IGNORE INTO controlled_tasks VALUES(?,?)").run(link.taskId,request.id)
        if(engine.store.childTasks(link.taskId).length||store.head("task_expectations",link.taskId))continue
        const expectation=proposed.get(link.nodeId)
        if(!expectation)throw new Error("Replacement task lacks a validated expectation")
        runtime.pinExpectation({...expectation,id:link.taskId,taskId:link.taskId,version:1,specHash:engine.signals.capture(link.taskId).specHash,evidence:proof.evidence},program.predictionPolicy,program.observationValidators)
      }
      db.prepare("UPDATE control_requests SET payload=? WHERE id=?").run(canonical(request),request.id)
      repair.state="applied";this.save(repair)
      store.event({id:`regional-applied:${repair.id}`,type:"RegionalRepairApplied",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{repairId:repair.id,revision:repair.revision,obligationId:proof.id}})
    }
  }
}
