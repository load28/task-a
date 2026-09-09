import type { RequestController,ControllerProgram,ControlledRequest,ProposedTask } from "./requests.ts"
import type { ReplanPatch } from "../../task-causality/src/replan.ts"
import type { PredictionError,ReplanLease,VersionRef } from "../../task-causality/src/model.ts"
import type { RequestQuestion } from "./request-questions.ts"
import type { AgentOutput } from "../../task-cognition/src/model.ts"
import { RegionSelection } from "./region-selection.ts"
import { connectedRegionDomain } from "../../task-causality/src/regions.ts"
import { propagate } from "../../task-causality/src/propagation.ts"
import { observationInputVector } from "./completion.ts"
import { canonical,digest } from "./value.ts"

interface Repair {
  id:string;requestId:string;state:"planning"|"waiting"|"validating"|"activating"|"applied"|"rejected"|"superseded"
  questionId?:string;causes:string[];lease:ReplanLease;grantId:string;stageId?:string;revision?:number;proposal?:Proposal
}
interface Proposal {patch:ReplanPatch;tasks:ProposedTask[];summary:string}
interface Cause {adversarialReview?:{grantId:string};attemptId?:string;error?:PredictionError;evidence:VersionRef[];reason:string;taskIds?:string[];invalidAssumptions?:VersionRef[];invalidDecisions?:VersionRef[];input?:{entityId:string;version:number;hash:string};integrationBoundary?:{id:string;version:number;tupleHash:string}}

/** Local exhaustion is causal evidence, not permission to replace an entire plan.
 * Incomplete dependency observations force a conservative region and explicitly
 * prohibit a locality/minimum claim. Feasibility still needs real validators. */
export class RegionalRepairs {
  readonly controller:RequestController
  readonly selection:RegionSelection
  constructor(controller:RequestController) {
    this.controller=controller
    this.selection=new RegionSelection(controller.runtime)
    controller.store.db.exec("CREATE TABLE IF NOT EXISTS request_region_repairs(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS request_task_history(request_id TEXT NOT NULL,task_id TEXT NOT NULL,node_id TEXT NOT NULL,PRIMARY KEY(request_id,task_id))")
  }
  private save(repair:Repair):void {this.controller.store.db.prepare("UPDATE request_region_repairs SET state=?,payload=? WHERE id=?").run(repair.state,canonical(repair),repair.id)}
  advance(request:ControlledRequest,program:ControllerProgram):boolean {
    if(!program.replanner||!request.planId)return false
    const runtime=this.controller.runtime,engine=runtime.engine,store=runtime.store,db=store.db
    const rows=db.prepare("SELECT payload FROM request_region_repairs WHERE request_id=? ORDER BY rowid").all(request.id)
    const repairs=rows.map(row=>JSON.parse(String(row.payload)) as Repair),active=repairs.find(item=>!["applied","rejected","superseded"].includes(item.state))
    const used=new Set(repairs.filter(item=>item.state!=="superseded").flatMap(item=>item.causes))
    const events=db.prepare("SELECT id,payload FROM event_outbox WHERE type IN ('LocalRepairExhausted','RequestChangeRequested','JointIntegrationFailed','InputObservationChanged','AssumptionValidityLost','DecisionValidityLost','AdversarialReviewFailed') AND correlation_id=? ORDER BY sequence").all(request.id)
      .filter(row=>!used.has(String(row.id)))
      .map(row=>({id:String(row.id),payload:JSON.parse(String(row.payload)).payload as Cause}))
        .filter(event=>event.payload.reason==="adversarial review failure"&&!!event.payload.adversarialReview&&(()=>{
          const review=db.prepare("SELECT * FROM adversarial_reviews WHERE source_grant=? AND state='failed'").get(event.payload.adversarialReview!.grantId)
          return !!review&&this.controller.tasks(request.id).includes(String(review.task_id))&&digest(JSON.parse(String(review.payload)).tuple)===digest(observationInputVector(engine,String(review.task_id)))&&event.payload.evidence.every(ref=>runtime.evidence.valid(ref))
        })()||event.payload.reason==="decision validity lost"&&!!event.payload.invalidDecisions?.length&&event.payload.invalidDecisions.every(ref=>!runtime.decisions.valid(ref))&&event.payload.taskIds?.every(id=>this.controller.tasks(request.id).includes(id))&&event.payload.evidence.every(ref=>runtime.evidence.valid(ref))||event.payload.reason==="assumption validity lost"&&!!event.payload.invalidAssumptions?.length&&event.payload.invalidAssumptions.every(ref=>!runtime.assumptions.valid(ref))&&event.payload.taskIds?.every(id=>this.controller.tasks(request.id).includes(id))&&event.payload.evidence.every(ref=>runtime.evidence.valid(ref))||event.payload.reason==="observed input change"&&!!event.payload.input&&(()=>{
        const input=event.payload.input!,head=db.prepare("SELECT version FROM observed_file_heads WHERE id=?").get(input.entityId)
        return head?.version===input.version&&event.payload.taskIds?.every(id=>this.controller.tasks(request.id).includes(id))&&event.payload.evidence.every(ref=>runtime.evidence.valid(ref))
      })()||event.payload.reason==="joint integration failure"&&!!event.payload.integrationBoundary&&(()=>{
        const boundary=event.payload.integrationBoundary!,state=db.prepare("SELECT version,tuple_hash FROM boundary_validation_state WHERE boundary_id=?").get(boundary.id)
        return state?.version===boundary.version&&state?.tuple_hash===boundary.tupleHash&&event.payload.taskIds?.every(id=>this.controller.tasks(request.id).includes(id))&&event.payload.evidence.every(ref=>runtime.evidence.valid(ref))
      })()||event.payload.reason==="explicit user steering"||event.payload.reason==="local repair quota exhausted"&&this.controller.tasks(request.id).some(id=>engine.store.currentAttempt(id)?.id===event.payload.attemptId))
    if(active) {
      if(events.length&&["planning","waiting","validating"].includes(active.state)) {
        // A later measured episode cannot be folded into an already authorized
        // prompt. Retire its grant/lease and wait for the execution adapter to
        // acknowledge any live worker before issuing a replacement below.
        store.atomic(()=>{
          db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(active.grantId)
          db.prepare("UPDATE scoped_replan_stages SET state='fenced' WHERE plan_id=? AND generation=? AND state IN ('lease','staged')").run(active.lease.planId,active.lease.generation)
          db.prepare("UPDATE controlled_plans SET generation=generation+1 WHERE plan_id=? AND generation=?").run(active.lease.planId,active.lease.generation)
          active.state="superseded";this.save(active)
          store.event({id:`regional-superseded:${active.id}`,type:"RegionalRepairSuperseded",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{repairId:active.id,grantId:active.grantId,leaseId:active.lease.id,newCauses:events.map(event=>event.id),previousCauses:active.causes}})
        })
      }else this.progress(active,request,program)
      return true
    }
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
    let boundary=links.filter(link=>closure.affected.includes(link.taskId)).map(link=>link.nodeId),changed=links.filter(link=>sources.includes(link.taskId)).map(link=>link.nodeId)
    const evidence=[...new Map(events.flatMap(event=>event.payload.evidence).map(ref=>[canonical(ref),ref])).values()]
    const cause=digest({requestId:request.id,events:events.map(event=>event.id),revision:plan.currentRevision})
    const domain=connectedRegionDomain(nodes.map(node=>({id:node.nodeId,nodes:[node.nodeId]})),nodes.flatMap(node=>[...node.dependsOnNodeIds.map(id=>[id,node.nodeId] as [string,string]),...(node.parentNodeId?[[node.parentNodeId,node.nodeId] as [string,string]]:[])]),program.replanner.selection?.candidateLimit??1024)
    const candidateDomain=[...domain.candidates.map(candidate=>candidate.nodes),boundary]
    const evaluated=program.replanner.selection?this.selection.choose({id:cause,required:boundary,candidates:candidateDomain,domainComplete:domain.complete,context:{planId:plan.id,revision:plan.currentRevision,graphHash:runtime.graph.hash(),inputs:links.map(link=>engine.signals.capture(link.taskId)),goal:request.text,nodes,expectations:request.proposal,evidence},evidence},program.replanner.selection):undefined
    if(program.replanner.selection&&!evaluated)return true
    if(evaluated) {
      if(!evaluated.region)throw new Error("No proven feasible region within the registered selection budget")
      boundary=evaluated.region.nodes
    }
    const selection={sources,closure,boundary,candidateDomain,candidateDomainComplete:domain.complete,optimalityScope:"registered finite domain constrained by conservative closure",evaluation:evaluated??null,minimumProven:evaluated?.minimumProven??false,reason:"process/read completeness is not attested; conservative containing region requires independent feasibility validation"}
    const selectionRef=runtime.evidence.put({id:`region-selection:${cause}`,version:1,type:"runtime",source:"causal propagation with unknown completeness",producer:"regional-repairs",validatorVersion:"region-selection/v1",timestamp:Date.now(),content:selection,contentHash:digest(selection),inputVector:[],confidence:1,expiresAt:null})
    const prior=db.prepare("SELECT payload FROM scoped_revision_bindings WHERE plan_id=? AND version=?").get(plan.id,plan.currentRevision)
    const previousDecisions:VersionRef[]=prior?(JSON.parse(String(prior.payload)) as Array<{decisionRefs:VersionRef[];assumptionRefs?:VersionRef[]}>).flatMap(node=>node.decisionRefs):[]
    const boundDecisions=links.flatMap(link=>db.prepare("SELECT id,version FROM decision_task_consumers WHERE task_id=?").all(link.taskId).map(row=>({id:String(row.id),version:Number(row.version)})))
    const invalidDecisions=events.flatMap(event=>event.payload.invalidDecisions??[])
    const immutableDecisions=[...new Map([...previousDecisions,...boundDecisions].filter(ref=>!invalidDecisions.some(invalid=>canonical(invalid)===canonical(ref))).map(ref=>[canonical(ref),ref])).values()]
    const lease=runtime.replanning.issue({planId:plan.id,boundary,changedNodes:changed,invalidatedNodes:changed,preservedNodes:nodes.filter(node=>!boundary.includes(node.nodeId)).map(node=>node.nodeId),immutableDecisions,invalidDecisions:[...new Map(events.flatMap(event=>event.payload.invalidDecisions??[]).map(ref=>[canonical(ref),ref])).values()],invalidAssumptions:[...new Map(events.flatMap(event=>event.payload.invalidAssumptions??[]).map(ref=>[canonical(ref),ref])).values()],predictionErrors:events.flatMap(event=>event.payload.error?[event.payload.error]:[]),violatedInvariants:events.flatMap(event=>event.payload.error?event.payload.error.criticalViolations.length?event.payload.error.criticalViolations:[`failed expectation ${event.payload.error.expectation.id}@${event.payload.error.expectation.version}`]:event.payload.reason==="joint integration failure"?[`Failed integration boundary ${event.payload.integrationBoundary!.id}@${event.payload.integrationBoundary!.version}`]:event.payload.reason==="adversarial review failure"?["Independent adversarial conclusions did not reconcile"]:event.payload.reason==="observed input change"?["Observed execution input changed"]:event.payload.reason==="assumption validity lost"?["A registered assumption lost its validated basis"]:event.payload.reason==="decision validity lost"?["A registered decision lost its validated basis"]:["Explicit user amendment requires plan consistency validation"]),evidence:[...evidence,selectionRef],expiresAt:Date.now()+program.grantLifetimeMs,validators:program.replanner.validators})
    const grant=this.controller.issueReplanner(request,program,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],questionHistory:this.controller.questions.history(request.id),lease,assumptions:this.assumptionContext(lease),decisions:this.decisionContext([...lease.immutableDecisions,...(lease.invalidDecisions??[])]),region:nodes.filter(node=>boundary.includes(node.nodeId)),expectations:request.proposal,selection,failures:evidence.map(ref=>runtime.evidence.require(ref)),contract:"For missing user information, return unresolvedQuestions as {kind: user, question: string}, with requiresEscalation=false. Otherwise return exactly one proposedTasks item {patch: ReplanPatch, tasks: [{node: PlanNode, expectation: six dimensions}], summary}. Preserve the original goal and immutable decisions, applying only explicit user amendments. tasks must describe exactly revised/new nodes; never relax expected outcomes to observed failures."},`regional-repair:${cause}`,lease.expiresAt)
    const repair:Repair={id:cause,requestId:request.id,state:"planning",causes:events.map(event=>event.id),lease,grantId:grant.id}
    db.prepare("INSERT INTO request_region_repairs VALUES(?,?,?,?)").run(repair.id,request.id,repair.state,canonical(repair))
    return true
  }
  private assumptionContext(lease:ReplanLease) {
    return [...(lease.immutableAssumptions??[]),...lease.invalidAssumptions].map(ref=>({ref,definition:this.controller.store.get("assumptions",ref.id,ref.version)??null}))
  }
  private decisionContext(refs:VersionRef[]) {
    return refs.map(ref=>({ref,definition:this.controller.store.get("decision_versions",ref.id,ref.version)??null}))
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
    const grant=this.controller.issueReplanner(request,program,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],questionHistory:this.controller.questions.history(request.id),lease:repair.lease,assumptions:this.assumptionContext(repair.lease),decisions:this.decisionContext([...repair.lease.immutableDecisions,...(repair.lease.invalidDecisions??[])]),region:runtime.engine.store.planNodes(repair.lease.planId,repair.lease.baseRevision).filter(node=>repair.lease.boundary.includes(node.nodeId)),expectations:request.proposal,failures:repair.lease.evidence.map(ref=>runtime.evidence.require(ref)),contract:"Continue the scoped repair using the original lease, goal, preserved nodes, immutable decisions and invariants. Return one proposedTasks item {patch: ReplanPatch,tasks:[{node:PlanNode,expectation:six dimensions}],summary}. Answers do not extend scope or relax expected outcomes."},`answer:${question.id}`,repair.lease.expiresAt)
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
      const stage=runtime.replanning.stage(repair.lease.id,proposal.patch,proposal.tasks.map(item=>item.node),proposal.summary,{goal:request.text,goalEvidence:request.evidence,amendments:request.amendments??[],clarifications:request.clarifications??[],questionHistory:this.controller.questions.history(request.id),expectations:proposal.tasks.map(item=>({nodeId:item.node.nodeId,expectation:item.expectation})),previousExpectations:request.proposal,assumptions:this.assumptionContext(repair.lease),decisions:this.decisionContext([...repair.lease.immutableDecisions,...(repair.lease.invalidDecisions??[])])})
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
      const decisionBindings=JSON.parse(String(store.db.prepare("SELECT payload FROM scoped_revision_bindings WHERE plan_id=? AND version=?").get(repair.lease.planId,repair.revision!)!.payload)) as Array<{id:string;decisionRefs:VersionRef[];assumptionRefs?:VersionRef[]}>
      for(const link of links) {
        for(const ref of decisionBindings.find(node=>node.id===link.nodeId)?.assumptionRefs??[])db.prepare("INSERT OR IGNORE INTO assumption_task_consumers VALUES(?,?,?)").run(link.taskId,ref.id,ref.version)
        for(const ref of decisionBindings.find(node=>node.id===link.nodeId)?.decisionRefs??[])if(store.db.prepare("SELECT 1 FROM decision_validity WHERE id=? AND version=?").get(ref.id,ref.version))db.prepare("INSERT OR IGNORE INTO decision_task_consumers VALUES(?,?,?)").run(link.taskId,ref.id,ref.version)
        db.prepare("INSERT INTO control_request_tasks VALUES(?,?,?)").run(request.id,link.taskId,link.nodeId)
        db.prepare("INSERT OR IGNORE INTO controlled_tasks VALUES(?,?)").run(link.taskId,request.id)
        if(engine.store.childTasks(link.taskId).length||store.head("task_expectations",link.taskId))continue
        const expectation=proposed.get(link.nodeId)
        if(!expectation)throw new Error("Replacement task lacks a validated expectation")
        runtime.pinExpectation({...expectation,id:link.taskId,taskId:link.taskId,version:1,specHash:engine.signals.capture(link.taskId).specHash,evidence:proof.evidence},program.predictionPolicy,program.observationValidators)
      }
      db.prepare("UPDATE control_requests SET payload=? WHERE id=?").run(canonical(request),request.id)
      this.controller.registerIntegration(request,program)
      repair.state="applied";this.save(repair)
      store.event({id:`regional-applied:${repair.id}`,type:"RegionalRepairApplied",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{repairId:repair.id,revision:repair.revision,obligationId:proof.id}})
    }
  }
}
