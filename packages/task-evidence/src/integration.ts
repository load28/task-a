import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"
import { EvidenceStore, type Obligation } from "./index.ts"

export const INTEGRATION_DIMENSIONS=["behavior","interface","data","temporal","error-propagation","resource-contention","semantic"] as const
export interface BoundaryMutation {taskId:string;boundary:VersionRef;outputs:VersionVector;evidence:VersionRef[]}
export function integrationObligations(store:EvidenceStore,mutations:BoundaryMutation[],validatorFor:(dimension:typeof INTEGRATION_DIMENSIONS[number],boundary:VersionRef)=>string):Obligation[] {
  const groups=new Map<string,BoundaryMutation[]>()
  for(const mutation of mutations) {
    const key=JSON.stringify(mutation.boundary)
    groups.set(key,[...(groups.get(key)??[]),mutation])
  }
  const result:Obligation[]=[]
  for(const group of groups.values()) {
    if(new Set(group.map(m=>m.taskId)).size<2)continue
    const boundary=group[0]!.boundary
    const tuple=group.flatMap(m=>m.outputs).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
    const evidence=group.flatMap(m=>m.evidence)
    for(const dimension of INTEGRATION_DIMENSIONS) result.push(store.createObligation({entityId:boundary.id,tuple,kind:`integration:${dimension}`,mandatory:true,validators:[validatorFor(dimension,boundary)],reason:evidence}))
  }
  return result
}
