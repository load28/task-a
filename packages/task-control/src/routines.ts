import { randomUUID } from "node:crypto"
import type { PlanNode } from "#task-domain"
import type { ControlRuntime } from "./runtime.ts"
import type { BoundaryProof,VersionRef,VersionVector } from "../../task-causality/src/model.ts"
import { granularity,validateRoutine,type GranularityObservation,type GranularityPolicy,type RoutineVersion } from "../../task-causality/src/granularity.ts"
import type { ValidatedBoundary } from "./boundary-validation.ts"
import { canonical,digest } from "./value.ts"

export interface RoutineExpectation {expectedArtifacts:Record<string,string>;expectedInterface:Record<string,string>;expectedBehavior:Record<string,boolean>;expectedDependencies:Record<string,string>;expectedGoals:Record<string,string>;expectedRisk:number}
export interface RoutineTemplate extends RoutineVersion {
  name:string;sourcePlan:{id:string;version:number;goal:string};nodes:Array<{node:PlanNode;expectation:RoutineExpectation}>
  observation:GranularityObservation;policy:GranularityPolicy;cost:{complexity:number;parallelism:number;riskIsolation:number;coordination:number}
}
export interface RoutineUse {routine:VersionRef;namespace:string;inputs:Record<string,string[]>;parentNodeId?:string}
export type RoutineProposalItem={node:PlanNode;expectation:RoutineExpectation}|{routineUse:RoutineUse}

const vector=(edges:ReturnType<ControlRuntime["graph"]["all"]>,members:Set<string>,direction:"input"|"output"):VersionVector=>edges.filter(edge=>direction==="input"?!members.has(edge.source.entityId)&&members.has(edge.target.entityId):members.has(edge.source.entityId)&&!members.has(edge.target.entityId)).map(edge=>({entityId:edge.id,port:"causal-edge",view:direction,version:edge.version,hash:digest(edge)})).sort((a,b)=>canonical(a).localeCompare(canonical(b)))

/** Stores only routines proven from an active graph, then expands immutable
 * templates into ordinary plan nodes. Execution never receives a macro node. */
export class RoutineRegistry {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime}
  register(routine:RoutineTemplate,expected:number):void {
    const {store,evidence,engine,graph}=this.runtime
    store.atomic(()=>{
      validateRoutine(routine)
      const existing=store.get<RoutineTemplate>("routine_versions",routine.id,routine.version)
      if(existing){if(digest(existing)!==digest(routine))throw new Error("Routine version identity conflict");return}
      if(!routine.name.trim()||routine.version!==expected+1||store.head("routine_versions",routine.id)!==expected)throw new Error("Stale or unnamed routine version")
      if(granularity(routine.observation,routine.policy,routine.cost,true)!=="chunk")throw new Error("Observed granularity does not justify a reusable routine")
      if(routine.evidence.some(ref=>!evidence.valid(ref))||routine.observation.evidence.some(ref=>!evidence.valid(ref)))throw new Error("Routine measurements are not current")
      const plan=engine.store.findWorkPlan(routine.sourcePlan.id)
      if(!plan||engine.store.activePlanVersion(plan.id)!==routine.sourcePlan.version||plan.goal!==routine.sourcePlan.goal)throw new Error("Routine source plan is not the active immutable revision")
      const links=engine.store.planLinks(plan.id,routine.sourcePlan.version),byTask=new Map(links.map(link=>[link.taskId,link.nodeId]))
      if(routine.members.some(member=>member.version!==routine.sourcePlan.version||!byTask.has(member.id)))throw new Error("Routine members must pin source plan tasks")
      if(routine.members.some(member=>!["verified","integrated"].includes(engine.requireTask(member.id).status)))throw new Error("Routine members require completed verified source tasks")
      const selected=new Set(routine.members.map(member=>byTask.get(member.id)!)),sourceNodes=engine.store.planNodes(plan.id,routine.sourcePlan.version).filter(node=>selected.has(node.nodeId))
      if(sourceNodes.length!==routine.nodes.length||digest(sourceNodes)!==digest(routine.nodes.map(item=>item.node)))throw new Error("Routine template changed from its source graph")
      for(const item of routine.nodes) {
        const taskId=links.find(link=>link.nodeId===item.node.nodeId)!.taskId,head=store.head("task_expectations",taskId)
        const expectation=head&&store.get<any>("task_expectations",taskId,head)
        const {id:_,version:__,taskId:___,specHash:____,evidence:_____,...expected}=expectation??{}
        if(!expectation||digest(expected)!==digest(item.expectation))throw new Error("Routine expectation changed from its source task")
      }
      this.assertCheckpoints(routine)
      const memberIds=new Set(routine.members.map(member=>member.id)),edges=graph.all(),crossing=edges.filter(edge=>memberIds.has(edge.source.entityId)!==memberIds.has(edge.target.entityId))
      if(crossing.some(edge=>edge.completeness!=="verified")||digest(routine.inputPorts)!==digest(vector(edges,memberIds,"input"))||digest(routine.outputPorts)!==digest(vector(edges,memberIds,"output")))throw new Error("Routine external ports are incomplete or changed")
      const proof=store.get<BoundaryProof>("boundary_proofs",routine.boundaryProof.id,routine.boundaryProof.version),boundary=proof&&store.get<ValidatedBoundary>("planning_boundaries",proof.boundary.id,proof.boundary.version)
      if(!proof||!boundary||store.head("planning_boundaries",boundary.id)!==boundary.version||digest(proof.boundary)!==digest({id:boundary.id,version:boundary.version})||!boundary.bindingsComplete||digest([...boundary.members].sort())!==digest([...memberIds].sort())||digest([...boundary.exits].sort())!==digest(crossing.map(edge=>edge.id).sort())||digest([...proof.exits].sort())!==digest(crossing.map(edge=>edge.id).sort())||proof.graphHash!==graph.hash()||proof.verdict!=="preserved"||!proof.observableComplete||!proof.validatorVersion||proof.expiresAt<=Date.now()||digest(proof.before)!==digest(proof.after)||proof.evidence.some(ref=>!evidence.valid(ref)))throw new Error("Routine requires a current complete boundary proof")
      store.put("routine_versions",routine.id,routine.version,routine);store.advance("routine_versions",routine.id,expected,routine.version)
      store.event({id:randomUUID(),type:"RoutineUpdated",entityId:routine.id,correlationId:routine.id,schemaVersion:1,timestamp:Date.now(),payload:{routine:{id:routine.id,version:routine.version},sourcePlan:routine.sourcePlan,boundaryProof:routine.boundaryProof}})
    })
  }
  get(ref:VersionRef):RoutineTemplate|undefined{return this.runtime.store.get("routine_versions",ref.id,ref.version)}
  current(ref:VersionRef):RoutineTemplate {
    const routine=this.get(ref)
    if(!routine||this.runtime.store.head("routine_versions",ref.id)!==ref.version)throw new Error("Routine is unknown or superseded")
    routine.evidence.forEach(item=>this.runtime.evidence.require(item));routine.observation.evidence.forEach(item=>this.runtime.evidence.require(item))
    this.assertCheckpoints(routine)
    const proof=this.runtime.store.get<BoundaryProof>("boundary_proofs",routine.boundaryProof.id,routine.boundaryProof.version),boundary=proof&&this.runtime.store.get<ValidatedBoundary>("planning_boundaries",proof.boundary.id,proof.boundary.version),members=new Set(routine.members.map(member=>member.id)),edges=this.runtime.graph.all(),crossing=edges.filter(edge=>members.has(edge.source.entityId)!==members.has(edge.target.entityId))
    if(!proof||!boundary||this.runtime.store.head("planning_boundaries",boundary.id)!==boundary.version||digest(proof.boundary)!==digest({id:boundary.id,version:boundary.version})||!boundary.bindingsComplete||digest([...boundary.members].sort())!==digest([...members].sort())||digest([...boundary.exits].sort())!==digest(crossing.map(edge=>edge.id).sort())||digest([...proof.exits].sort())!==digest(crossing.map(edge=>edge.id).sort())||crossing.some(edge=>edge.completeness!=="verified")||digest(routine.inputPorts)!==digest(vector(edges,members,"input"))||digest(routine.outputPorts)!==digest(vector(edges,members,"output"))||proof.graphHash!==this.runtime.graph.hash()||proof.verdict!=="preserved"||!proof.observableComplete||!proof.validatorVersion||proof.expiresAt<=Date.now()||digest(proof.before)!==digest(proof.after)||proof.evidence.some(item=>!this.runtime.evidence.valid(item)))throw new Error("Routine boundary proof is no longer current")
    return routine
  }
  available(allow?:VersionRef[]):Array<{routine:VersionRef;name:string;entryNodes:string[];exitNodes:string[];inputPorts:VersionVector;outputPorts:VersionVector}>{
    return this.runtime.store.db.prepare("SELECT id,version FROM control_heads WHERE collection='routine_versions' ORDER BY id").all().flatMap(row=>{try{const ref={id:String(row.id),version:Number(row.version)};if(allow&&!allow.some(item=>digest(item)===digest(ref)))return [];const routine=this.current(ref),ids=new Set(routine.nodes.map(item=>item.node.nodeId)),entries=routine.nodes.filter(item=>!item.node.dependsOnNodeIds.some(id=>ids.has(id))).map(item=>item.node.nodeId),depended=new Set(routine.nodes.flatMap(item=>item.node.dependsOnNodeIds));return [{routine:{id:routine.id,version:routine.version},name:routine.name,entryNodes:entries,exitNodes:routine.nodes.filter(item=>!depended.has(item.node.nodeId)).map(item=>item.node.nodeId),inputPorts:routine.inputPorts,outputPorts:routine.outputPorts}]}catch{return []}})
  }
  expand(items:RoutineProposalItem[],targetGoal:string,requestId:string,allow?:VersionRef[]):{proposal:Array<{node:PlanNode;expectation:RoutineExpectation}>;uses:RoutineUse[]} {
    if(!Array.isArray(items))throw new Error("Invalid routine proposal item")
    const ordinary=items.filter((item):item is {node:PlanNode;expectation:RoutineExpectation}=>!!item&&typeof item==="object"&&"node" in item),uses=items.filter((item):item is {routineUse:RoutineUse}=>!!item&&typeof item==="object"&&"routineUse" in item).map(item=>item.routineUse)
    if(ordinary.length+uses.length!==items.length||new Set(uses.map(use=>use.namespace)).size!==uses.length)throw new Error("Invalid or duplicate routine proposal item")
    if(!uses.length)return {proposal:ordinary,uses:[]}
    const proposal=[...ordinary],occupied=new Set(ordinary.map(item=>item.node.nodeId))
    for(const use of uses) {
      if(allow&&!allow.some(item=>digest(item)===digest(use.routine)))throw new Error("Routine is outside the pinned policy allowance")
      if(!use.namespace.trim()||use.namespace.includes("/")||Object.values(use.inputs).some(ids=>!Array.isArray(ids)||new Set(ids).size!==ids.length))throw new Error("Invalid routine namespace or input binding")
      const routine=this.current(use.routine),ids=new Set(routine.nodes.map(item=>item.node.nodeId)),entries=routine.nodes.filter(item=>!item.node.dependsOnNodeIds.some(id=>ids.has(id))).map(item=>item.node.nodeId).sort()
      if(digest(Object.keys(use.inputs).sort())!==digest(entries))throw new Error("Routine use must bind every entry node exactly once")
      const map=(id:string)=>`${use.namespace}/${id}`
      for(const item of routine.nodes) {
        const id=map(item.node.nodeId)
        if(occupied.has(id))throw new Error("Routine expansion collides with a plan node")
        occupied.add(id)
        proposal.push({expectation:structuredClone(item.expectation),node:{...structuredClone(item.node),nodeId:id,parentNodeId:item.node.parentNodeId?map(item.node.parentNodeId):use.parentNodeId,dependsOnNodeIds:[...item.node.dependsOnNodeIds.map(map),...(use.inputs[item.node.nodeId]??[])]}})
      }
      this.runtime.store.event({id:`routine-instantiated:${digest({requestId,targetGoal,use})}`,type:"RoutineInstantiated",entityId:requestId,correlationId:requestId,schemaVersion:1,timestamp:Date.now(),payload:{requestId,targetGoal,use,sourcePlan:routine.sourcePlan,boundaryProof:routine.boundaryProof}})
    }
    return {proposal,uses}
  }
  evidenceFor(uses:RoutineUse[]):VersionRef[]{return [...new Map(uses.flatMap(use=>{const routine=this.current(use.routine),proof=this.runtime.store.get<BoundaryProof>("boundary_proofs",routine.boundaryProof.id,routine.boundaryProof.version)!;return [...routine.evidence,...routine.observation.evidence,...routine.checkpoints.flatMap(item=>item.evidence),...proof.evidence]}).map(ref=>[canonical(ref),ref])).values()]}
  private assertCheckpoints(routine:RoutineTemplate):void {
    const {store,evidence}=this.runtime
    for(const checkpoint of routine.checkpoints)if(checkpoint.evidence.some(ref=>!evidence.valid(ref))||checkpoint.validators.some(id=>{
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(id),spec=match&&store.get<{authorization:VersionRef[]}>("validator_versions",match[1]!,Number(match[2]))
      return !spec||spec.authorization.some(ref=>!evidence.valid(ref))||!checkpoint.evidence.map(ref=>evidence.require(ref)).some(proof=>proof.validatorVersion===id&&["runtime","test"].includes(proof.type)&&(proof.content as {passed?:boolean}).passed===true&&digest((proof.content as {member?:VersionRef}).member)===digest(checkpoint.member))
    }))throw new Error("Routine checkpoint is not independently reproducible")
  }
}
