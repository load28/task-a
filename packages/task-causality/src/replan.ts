import { ControlStore } from "../../task-control/src/store.ts"
import { digest } from "../../task-control/src/value.ts"
import type { ReplanLease, VersionRef } from "./model.ts"

export interface ScopedPlanNode { id:string; parent?:string; dependencies:string[]; objective:string; expectedOutcome:unknown; decisionRefs:VersionRef[] }
export interface ReplanPatch {
  revisedTasks:ScopedPlanNode[];newTasks:ScopedPlanNode[];removedTasks:string[]
  newDependencies:Array<{from:string;to:string}>;preservedDecisions:VersionRef[]
  invalidatedAssumptions:VersionRef[];expectedOutcomes:Array<{taskId:string;value:unknown}>;confidence:number
}
export function validateScopedPatch(lease:ReplanLease,patch:ReplanPatch,current:{revision:number;graphHash:string;generation:number;nodes:ScopedPlanNode[];now:number;validEvidence:(ref:VersionRef)=>boolean}):ScopedPlanNode[] {
  if(current.revision!==lease.baseRevision||current.graphHash!==lease.graphHash||current.generation!==lease.generation||current.now>=lease.expiresAt) throw new Error("Stale replanning lease")
  if(!lease.evidence.length||!lease.evidence.every(current.validEvidence)) throw new Error("Missing invalidation evidence")
  if(!Number.isFinite(patch.confidence)||patch.confidence<0||patch.confidence>1) throw new Error("Invalid plan confidence")
  const allowed=new Set(lease.boundary),protectedNodes=new Set(lease.preservedNodes),nodes=new Map(current.nodes.map(n=>[n.id,structuredClone(n)]))
  const touched=new Set<string>()
  const touch=(id:string)=>{if(!allowed.has(id)||protectedNodes.has(id)||touched.has(id)) throw new Error("Patch escapes or overlaps the mutable region");touched.add(id)}
  for(const node of patch.revisedTasks) {touch(node.id);if(!nodes.has(node.id)) throw new Error("Unknown revised task");nodes.set(node.id,structuredClone(node))}
  for(const id of patch.removedTasks) {touch(id);if(!nodes.delete(id)) throw new Error("Unknown removed task")}
  for(const node of patch.newTasks) {
    if(!node.id.startsWith("proposal:")||nodes.has(node.id)||!node.parent||!allowed.has(node.parent)||protectedNodes.has(node.parent)) throw new Error("New task must have a local proposal ID and mutable parent in the region")
    nodes.set(node.id,structuredClone(node));allowed.add(node.id)
  }
  for(const edge of patch.newDependencies) {
    if(!allowed.has(edge.from)||!allowed.has(edge.to)||protectedNodes.has(edge.to)) throw new Error("New external dependency requires region escalation")
    if(!patch.revisedTasks.some(n=>n.id===edge.to)&&!patch.newTasks.some(n=>n.id===edge.to))throw new Error("Dependency changes require an explicit revised task and expectation")
    const target=nodes.get(edge.to)
    if(!target||!nodes.has(edge.from)) throw new Error("Unknown dependency node")
    target.dependencies=[...new Set([...target.dependencies,edge.from])]
  }
  for(const node of patch.revisedTasks) {
    const prior=current.nodes.find(n=>n.id===node.id)!
    if(node.parent!==prior.parent && (!node.parent||!allowed.has(node.parent))) throw new Error("Reparenting escapes the region")
    const immutable=prior.decisionRefs.filter(r=>lease.immutableDecisions.some(d=>digest(d)===digest(r)))
    if(immutable.some(r=>!node.decisionRefs.some(d=>digest(d)===digest(r))))throw new Error("Patch removes an immutable decision binding")
    if(node.dependencies.some(d=>!prior.dependencies.includes(d)&&!allowed.has(d))) throw new Error("New external read requires region escalation")
  }
  for(const node of patch.newTasks)if(node.dependencies.some(id=>!allowed.has(id)))throw new Error("New external read requires region escalation")
  for(const prior of current.nodes)if(protectedNodes.has(prior.id)||!allowed.has(prior.id)) {
    const before=current.nodes.filter(n=>n.parent===prior.id).map(n=>n.id).sort()
    const after=[...nodes.values()].filter(n=>n.parent===prior.id).map(n=>n.id).sort()
    if(digest(before)!==digest(after))throw new Error("Patch changes preserved or external child membership")
  }
  const refs=(items:VersionRef[])=>items.map(r=>digest(r)).sort()
  if(digest(refs(patch.preservedDecisions))!==digest(refs(lease.immutableDecisions))) throw new Error("Immutable decisions must be preserved exactly")
  if(patch.invalidatedAssumptions.some(r=>!lease.invalidAssumptions.some(a=>digest(a)===digest(r)))) throw new Error("Assumption invalidation lacks lease evidence")
  const changedIds=new Set([...patch.revisedTasks,...patch.newTasks].map(n=>n.id))
  if(patch.expectedOutcomes.length!==changedIds.size||new Set(patch.expectedOutcomes.map(e=>e.taskId)).size!==changedIds.size||patch.expectedOutcomes.some(e=>!changedIds.has(e.taskId)))throw new Error("Expected outcomes escape or duplicate the patch")
  for(const node of [...patch.revisedTasks,...patch.newTasks]) {
    if(!node.objective.trim()||node.expectedOutcome===undefined||!patch.expectedOutcomes.some(e=>e.taskId===node.id&&digest(e.value)===digest(node.expectedOutcome))) throw new Error("Every changed task requires a matching expectation")
  }
  const visiting=new Set<string>(),done=new Set<string>()
  const visit=(id:string)=>{
    if(done.has(id))return
    if(visiting.has(id))throw new Error("Execution/hierarchy cycle")
    const node=nodes.get(id);if(!node)throw new Error("Dangling plan reference")
    visiting.add(id)
    for(const dep of [...node.dependencies,...(node.parent?[node.parent]:[])]) visit(dep)
    visiting.delete(id);done.add(id)
  }
  for(const id of nodes.keys())visit(id)
  return [...nodes.values()]
}
export class ReplanLeases {
  readonly store:ControlStore
  constructor(store:ControlStore){this.store=store}
  issue(lease:ReplanLease):void {this.store.put("replan_leases",lease.id,lease.generation,lease)}
  get(id:string,generation:number):ReplanLease {const lease=this.store.get<ReplanLease>("replan_leases",id,generation);if(!lease)throw new Error("Unknown replan lease");return lease}
}
