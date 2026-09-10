import { randomUUID } from "node:crypto"
import type { PlanNode } from "#task-domain"
import type { TaskGraphEngine, ReviseWorkPlanInput } from "../../task-engine/src/index.ts"
import { CausalGraph } from "../../task-causality/src/graph.ts"
import { ReplanLeases, validateScopedPatch, type ReplanPatch, type ScopedPlanNode } from "../../task-causality/src/replan.ts"
import type { ReplanLease, VersionVector, VersionRef } from "../../task-causality/src/model.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { decisionValid } from "./decisions.ts"
import { canonical, digest } from "./value.ts"
import { currentInputVector } from "./completion.ts"

interface LeaseBinding { lease:ReplanLease; validators:string[]; nodes:ScopedPlanNode[]; planNodes:PlanNode[]; contextHash:string }
interface Stage { binding:LeaseBinding; patch:ReplanPatch; revisionInput:ReviseWorkPlanInput; tuple:VersionVector; obligationId:string; assigned?:Record<string,string>; metadata?:unknown; result?:ReturnType<TaskGraphEngine["reviseWorkPlan"]> }

/** This check runs inside the engine, including calls through legacy Graph MCP.
 * The committing row exists only inside the coordinator's atomic commit. */
export function assertScopedRevision(engine:TaskGraphEngine,input:ReviseWorkPlanInput):void {
  const db=engine.store.db
  if(!db.prepare("SELECT 1 FROM controlled_plans WHERE plan_id=?").get(input.planId))return
  const row=db.prepare("SELECT payload FROM scoped_replan_stages WHERE plan_id=? AND state='committing'").get(input.planId)
  if(!row||digest((JSON.parse(String(row.payload)) as Stage).revisionInput)!==digest(input))throw new Error("Controlled plan revisions require a validated scoped commit")
}

/** Controller-only lease issuance. Models submit bounded patches, never complete graphs. */
export class ScopedReplanning {
  readonly engine:TaskGraphEngine
  readonly evidence:EvidenceStore
  readonly leases:ReplanLeases
  constructor(engine:TaskGraphEngine) {
    this.engine=engine;this.evidence=new EvidenceStore(engine.store.control);this.leases=new ReplanLeases(engine.store.control)
  }
  get store(){return this.engine.store.control}
  private inputs(planId:string,revision:number):VersionVector {
    return this.engine.store.planLinks(planId,revision).flatMap(link=>currentInputVector(this.engine,link.taskId)).sort((a,b)=>canonical(a).localeCompare(canonical(b)))
  }
  /** Revision numbers never rewind. A retired, unactivated head may be replaced
   * from the still active execution graph, with a distinct CAS head revision. */
  sourceRevision(planId:string):number {
    const plan=this.engine.store.findWorkPlan(planId)
    if(!plan)throw new Error("Unknown replanning plan")
    const active=this.engine.store.activePlanVersion(planId)
    if(active===plan.currentRevision)return active
    const retired=this.store.get<{stageId:string;sourceRevision:number}>("replan_supersessions",planId,plan.currentRevision)
    if(!active||!retired||retired.sourceRevision!==active)throw new Error("Replanning needs a settled active plan revision or a retired pending revision")
    const stage=this.describe(retired.stageId)
    if(stage.result?.revision.version!==plan.currentRevision||stage.binding.lease.planId!==planId)throw new Error("Invalid retired revision lineage")
    return active
  }
  supersedeCommitted(stageId:string,evidence:VersionRef[]):void {
    this.engine.atomic(()=>{
      const row=this.store.db.prepare("SELECT state FROM scoped_replan_stages WHERE id=?").get(stageId),stage=this.describe(stageId)
      const plan=this.engine.store.findWorkPlan(stage.binding.lease.planId)!,version=stage.result?.revision.version,sourceRevision=this.engine.store.activePlanVersion(plan.id)
      if(row?.state!=="committed"||!version||version!==plan.currentRevision||version===sourceRevision||!evidence.length)throw new Error("Only a committed pending revision can be superseded by evidence")
      evidence.forEach(ref=>this.evidence.require(ref))
      if(this.store.get("replan_supersessions",plan.id,version))return
      this.store.put("replan_supersessions",plan.id,version,{stageId,sourceRevision,evidence})
      const revision=this.engine.store.findPlanRevision(plan.id,version)!
      this.engine.store.updatePlanRevision({...revision,state:"superseded"})
      this.store.db.prepare("UPDATE controlled_plans SET generation=generation+1 WHERE plan_id=? AND generation=?").run(plan.id,stage.binding.lease.generation)
      this.event("PendingScopedRevisionSuperseded",plan.id,{stageId,revision:version,sourceRevision,evidence})
    })
  }
  issue(input:Omit<ReplanLease,"id"|"baseRevision"|"graphHash"|"inputVector"|"generation"|"sourceRevision"> & {validators:string[]}):ReplanLease {
    return this.engine.atomic(()=>{
      const plan=this.engine.store.findWorkPlan(input.planId)
      if(!plan)throw new Error("Unknown replanning plan")
      const sourceRevision=this.sourceRevision(plan.id)
      if(sourceRevision!==plan.currentRevision&&this.engine.revisions.transitions(plan.id).some(t=>t.state==="waiting"&&t.stops.some(stop=>stop.state!=="stopped")))throw new Error("Replanning waits for confirmed execution stops")
      if(!input.validators.length||new Set(input.validators).size!==input.validators.length||!input.evidence.length||input.expiresAt<=Date.now())throw new Error("Lease needs validation, invalidation evidence and a deadline")
      input.evidence.forEach(ref=>this.evidence.require(ref))
      const planNodes=this.engine.store.planNodes(plan.id,sourceRevision),ids=new Set(planNodes.map(n=>n.nodeId))
      for(const list of [input.boundary,input.changedNodes,input.invalidatedNodes,input.preservedNodes])if(new Set(list).size!==list.length||list.some(id=>!ids.has(id)))throw new Error("Lease references unknown or duplicate plan nodes")
      if(!input.boundary.length||input.changedNodes.some(id=>!input.boundary.includes(id))||input.invalidatedNodes.some(id=>!input.boundary.includes(id))||input.preservedNodes.some(id=>input.invalidatedNodes.includes(id)))throw new Error("Invalid mutable boundary")
      const prior=this.store.db.prepare("SELECT payload FROM scoped_revision_bindings WHERE plan_id=? AND version=?").get(plan.id,sourceRevision)
      const nodes:ScopedPlanNode[]=prior?JSON.parse(String(prior.payload)):planNodes.map(n=>({id:n.nodeId,parent:n.parentNodeId,dependencies:n.dependsOnNodeIds,objective:n.taskSpec.goal||n.outcome,expectedOutcome:n.outcome,decisionRefs:[]}))
      if(this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='decision_task_consumers'").get())for(const node of nodes) {
        const link=this.engine.store.planLinks(plan.id,sourceRevision).find(link=>link.nodeId===node.id)
        if(link)for(const row of this.store.db.prepare("SELECT id,version FROM decision_task_consumers WHERE task_id=?").all(link.taskId)) {
          const ref={id:String(row.id),version:Number(row.version)}
          if(!node.decisionRefs.some(existing=>digest(existing)===digest(ref)))node.decisionRefs.push(ref)
        }
      }
      if(this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='assumption_task_consumers'").get())for(const node of nodes) {
        const link=this.engine.store.planLinks(plan.id,sourceRevision).find(link=>link.nodeId===node.id)
        if(link)for(const row of this.store.db.prepare("SELECT id,version FROM assumption_task_consumers WHERE task_id=?").all(link.taskId)) {
          const ref={id:String(row.id),version:Number(row.version)}
          node.assumptionRefs??=[]
          if(!node.assumptionRefs.some(existing=>digest(existing)===digest(ref)))node.assumptionRefs.push(ref)
        }
      }
      const immutableAssumptions=[...new Map(nodes.flatMap(node=>node.assumptionRefs??[]).filter(ref=>!input.invalidAssumptions.some(invalid=>digest(invalid)===digest(ref))).map(ref=>[digest(ref),ref])).values()]
      for(const ref of input.immutableDecisions)if(!nodes.some(n=>n.decisionRefs.some(r=>digest(r)===digest(ref))))throw new Error("Unknown immutable decision binding")
      const generation=Number(this.store.db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(plan.id)?.generation??0)+1
      const {validators,...fields}=input
      const lease:ReplanLease={...fields,immutableAssumptions,id:randomUUID(),baseRevision:plan.currentRevision,...(sourceRevision===plan.currentRevision?{}:{sourceRevision}),graphHash:new CausalGraph(this.store).hash(),inputVector:this.inputs(plan.id,sourceRevision),generation}
      this.assertManagedBindings(lease)
      this.leases.issue(lease)
      this.store.db.prepare("INSERT INTO controlled_plans VALUES(?,?) ON CONFLICT(plan_id) DO UPDATE SET generation=excluded.generation").run(plan.id,generation)
      this.store.db.prepare("UPDATE scoped_replan_stages SET state='fenced' WHERE plan_id=? AND state IN ('lease','staged')").run(plan.id)
      const binding:LeaseBinding={lease,validators,nodes,planNodes,contextHash:digest(this.engine.revisions.context(plan.id,sourceRevision))}
      this.store.db.prepare("INSERT INTO scoped_replan_stages VALUES(?,?,?,'lease',?)").run(lease.id,plan.id,generation,canonical(binding))
      this.event("ReplanLeaseIssued",plan.id,{leaseId:lease.id,generation})
      return lease
    })
  }
  private assertManagedBindings(lease:ReplanLease):void {
    for(const ref of lease.immutableAssumptions??[]) {
      const row=this.store.db.prepare("SELECT state,obligation_id FROM assumption_validity WHERE id=? AND version=?").get(ref.id,ref.version)
      if(row?.state!=="valid"||!this.evidence.satisfied(this.evidence.obligation(String(row.obligation_id))!))throw new Error("Replanning assumption is not currently validated")
    }
    if(this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='decision_validity'").get())for(const ref of lease.immutableDecisions) {
      if(this.store.db.prepare("SELECT 1 FROM decision_validity WHERE id=? AND version=?").get(ref.id,ref.version)&&!decisionValid(this.store,ref))throw new Error("Replanning decision is not currently validated")
    }
  }
  assertCurrent(leaseId:string):ReplanLease {
    const row=this.store.db.prepare("SELECT state,payload FROM scoped_replan_stages WHERE id=?").get(leaseId)
    if(!row||row.state!=="lease")throw new Error("Lease is unknown, fenced or already staged")
    const binding=JSON.parse(String(row.payload)) as LeaseBinding,lease=binding.lease
    const plan=this.engine.store.findWorkPlan(lease.planId)
    if(!plan||plan.currentRevision!==lease.baseRevision||this.engine.store.activePlanVersion(plan.id)!==(lease.sourceRevision??lease.baseRevision)||lease.expiresAt<=Date.now()||this.store.db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(plan.id)?.generation!==lease.generation||new CausalGraph(this.store).hash()!==lease.graphHash)throw new Error("Replanning lease is stale or expired")
    if(digest(this.inputs(plan.id,lease.sourceRevision??lease.baseRevision))!==digest(lease.inputVector)||digest(this.engine.revisions.context(plan.id,lease.sourceRevision??lease.baseRevision))!==binding.contextHash)throw new Error("Replanning inputs changed")
    this.assertManagedBindings(lease)
    lease.evidence.forEach(ref=>this.evidence.require(ref))
    return lease
  }
  private check(binding:LeaseBinding,patch:ReplanPatch):ScopedPlanNode[] {
    const lease=binding.lease
    this.assertManagedBindings(lease)
    const plan=this.engine.store.findWorkPlan(lease.planId)!
    if(this.engine.store.activePlanVersion(plan.id)!==(lease.sourceRevision??lease.baseRevision))throw new Error("Replanning execution revision changed")
    if(digest(this.inputs(plan.id,lease.sourceRevision??lease.baseRevision))!==digest(lease.inputVector)||digest(this.engine.revisions.context(plan.id,lease.sourceRevision??lease.baseRevision))!==binding.contextHash)throw new Error("Replanning inputs changed")
    return validateScopedPatch(lease,patch,{revision:plan.currentRevision,graphHash:new CausalGraph(this.store).hash(),generation:Number(this.store.db.prepare("SELECT generation FROM controlled_plans WHERE plan_id=?").get(plan.id)?.generation),nodes:binding.nodes,now:Date.now(),validEvidence:ref=>this.evidence.valid(ref)})
  }
  stage(leaseId:string,patch:ReplanPatch,specifications:PlanNode[],summary:string,metadata?:unknown):{id:string;obligationId:string;tuple:VersionVector} {
    return this.engine.atomic(()=>{
      const row=this.store.db.prepare("SELECT state,payload FROM scoped_replan_stages WHERE id=?").get(leaseId)
      if(!row||row.state!=="lease")throw new Error("Lease is unknown, fenced or already staged")
      const binding=JSON.parse(String(row.payload)) as LeaseBinding,next=this.check(binding,patch)
      const changed=[...patch.revisedTasks,...patch.newTasks],specs=new Map(specifications.map(n=>[n.nodeId,n]))
      if(specifications.length!==changed.length||specs.size!==changed.length||changed.some(n=>!specs.has(n.id)))throw new Error("Specifications must match exactly the changed nodes")
      for(const n of changed) {
        const spec=specs.get(n.id)!,resolved=next.find(item=>item.id===n.id)!
        if(spec.parentNodeId!==n.parent||spec.taskSpec.goal!==n.objective||digest(spec.outcome)!==digest(n.expectedOutcome)||digest([...spec.dependsOnNodeIds].sort())!==digest([...resolved.dependencies].sort()))throw new Error("Task specification differs from its scoped proposal")
      }
      // Materialize full plan exclusively from unchanged server snapshots and the patch.
      const assigned=new Map(patch.newTasks.map(n=>[n.id,randomUUID()]))
      const id=(value:string)=>assigned.get(value)??value
      const nodes=next.map(n=>{
        const spec=structuredClone(specs.get(n.id)??binding.planNodes.find(p=>p.nodeId===n.id)!)
        return {...spec,nodeId:id(spec.nodeId),parentNodeId:spec.parentNodeId?id(spec.parentNodeId):undefined,dependsOnNodeIds:spec.dependsOnNodeIds.map(id)}
      })
      const revisionInput:ReviseWorkPlanInput={planId:binding.lease.planId,baseVersion:binding.lease.baseRevision,summary,nodes,...(binding.lease.sourceRevision?this.engine.revisions.context(binding.lease.planId,binding.lease.sourceRevision):{})}
      // Use the same engine validation in a rollback-only savepoint. No candidate
      // revision, supersession, stop, or projection is visible before validation.
      const stageId=randomUUID()
      const tuple:VersionVector=[{entityId:stageId,port:"plan",view:"scoped-revision",version:1,hash:digest({revisionInput,lease:binding.lease,contextHash:binding.contextHash,metadata:metadata??null})}]
      const content={lease:binding.lease,baseNodes:binding.planNodes,patch,revisionInput,contextHash:binding.contextHash,metadata:metadata??null}
      const proposal=this.evidence.put({id:`scoped-proposal:${stageId}`,version:1,type:"agent",source:leaseId,producer:"scoped-replanning",validatorVersion:"scoped-proposal/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:patch.confidence,expiresAt:binding.lease.expiresAt})
      const obligation=this.evidence.createObligation({entityId:stageId,tuple,kind:"scoped-plan-validation",mandatory:true,validators:binding.validators,reason:[...binding.lease.evidence,proposal]})
      const stage:Stage={binding,patch,revisionInput,tuple,obligationId:obligation.id,assigned:Object.fromEntries(assigned),...(metadata===undefined?{}:{metadata})}
      this.store.db.prepare("INSERT INTO scoped_replan_stages VALUES(?,?,?,'committing',?)").run(stageId,binding.lease.planId,binding.lease.generation,canonical(stage))
      this.store.db.exec("SAVEPOINT scoped_plan_preflight")
      try {
        const preflight=this.engine.reviseWorkPlan(revisionInput)
        if(digest(this.engine.store.planNodes(binding.lease.planId,preflight.revision.version))!==digest(nodes))throw new Error("Revision engine changed the proposed patch")
      } finally {this.store.db.exec("ROLLBACK TO scoped_plan_preflight");this.store.db.exec("RELEASE scoped_plan_preflight")}
      this.store.db.prepare("UPDATE scoped_replan_stages SET state='staged' WHERE id=?").run(stageId)
      this.store.db.prepare("UPDATE scoped_replan_stages SET state='consumed' WHERE id=?").run(leaseId)
      this.event("ScopedReplanStaged",binding.lease.planId,{stageId,obligationId:obligation.id,tuple})
      return {id:stageId,obligationId:obligation.id,tuple}
    })
  }
  describe(stageId:string):Stage {
    const row=this.store.db.prepare("SELECT payload FROM scoped_replan_stages WHERE id=?").get(stageId)
    if(!row)throw new Error("Unknown scoped stage")
    return JSON.parse(String(row.payload)) as Stage
  }
  commit(stageId:string):ReturnType<TaskGraphEngine["reviseWorkPlan"]> {
    return this.engine.atomic(()=>{
      const row=this.store.db.prepare("SELECT state,payload FROM scoped_replan_stages WHERE id=?").get(stageId)
      if(!row)throw new Error("Unknown staged revision")
      const stage=JSON.parse(String(row.payload)) as Stage
      if(row.state==="committed")return stage.result!
      if(row.state!=="staged")throw new Error("Staged revision was fenced")
      const next=this.check(stage.binding,stage.patch)
      const obligation=this.evidence.obligation(stage.obligationId)
      if(!obligation||!this.evidence.independentlySatisfied(obligation))throw new Error("Staged revision validation is pending or expired")
      this.store.db.prepare("UPDATE scoped_replan_stages SET state='committing' WHERE id=?").run(stageId)
      const result=this.engine.reviseWorkPlan(stage.revisionInput)
      const actual=this.engine.store.planNodes(stage.revisionInput.planId,result.revision.version)
      if(digest(actual)!==digest(stage.revisionInput.nodes))throw new Error("Revision engine changed the validated patch")
      const bindings=next.map((n,index)=>({...n,id:actual[index]!.nodeId,parent:actual[index]!.parentNodeId,dependencies:actual[index]!.dependsOnNodeIds}))
      this.store.db.prepare("INSERT INTO scoped_revision_bindings VALUES(?,?,?)").run(stage.revisionInput.planId,result.revision.version,canonical(bindings))
      this.store.db.prepare("UPDATE scoped_replan_stages SET state='committed',payload=? WHERE id=?").run(canonical({...stage,result}),stageId)
      this.event("ScopedReplanCommitted",stage.revisionInput.planId,{stageId,revision:result.revision.version,obligationId:stage.obligationId})
      return JSON.parse(canonical(result)) as typeof result
    })
  }
  private event(type:string,planId:string,payload:unknown):void {this.store.event({id:randomUUID(),type,entityId:planId,correlationId:planId,schemaVersion:1,timestamp:Date.now(),payload})}
}
