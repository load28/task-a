import { unit } from "../../task-control/src/value.ts"
import type { VersionRef, VersionVector } from "./model.ts"

export interface GranularityObservation {episodes:string[];failureRate:number;uncertainty:number;replanningRate:number;independentChangeUpperBound:number;coexecutionRate:number;sharedFailureRate:number;evidence:VersionRef[]}
export interface GranularityPolicy {minimumEpisodes:number;splitWeights:{failure:number;uncertainty:number;replanning:number};splitThreshold:number;maxIndependentChange:number;minCoexecution:number;sharedFailureThreshold:number}
export function granularity(observation:GranularityObservation,policy:GranularityPolicy,cost:{complexity:number;parallelism:number;riskIsolation:number;coordination:number},portsPreserved:boolean):"split"|"chunk"|"joint-boundary"|"separate-boundary"|"preserve" {
  if(!observation.evidence.length||new Set(observation.episodes).size<policy.minimumEpisodes)return "preserve"
  for(const v of [observation.failureRate,observation.uncertainty,observation.replanningRate,observation.independentChangeUpperBound,observation.coexecutionRate,observation.sharedFailureRate])unit(v,"Granularity observation")
  if(Object.values(cost).some(v=>!Number.isFinite(v)||v<0))throw new Error("Invalid decomposition cost")
  for(const w of Object.values(policy.splitWeights))unit(w,"Split weight")
  const score=policy.splitWeights.failure*observation.failureRate+policy.splitWeights.uncertainty*observation.uncertainty+policy.splitWeights.replanning*observation.replanningRate
  if(score>policy.splitThreshold&&cost.complexity+cost.parallelism+cost.riskIsolation>cost.coordination)return "split"
  if(observation.sharedFailureRate>policy.sharedFailureThreshold)return "joint-boundary"
  if(observation.independentChangeUpperBound<=policy.maxIndependentChange&&observation.coexecutionRate>=policy.minCoexecution&&portsPreserved)return "chunk"
  if(observation.independentChangeUpperBound>policy.maxIndependentChange&&observation.coexecutionRate<policy.minCoexecution)return "separate-boundary"
  return "preserve"
}
export interface RoutineVersion {
  id:string;version:number;members:VersionRef[];inputPorts:VersionVector;outputPorts:VersionVector
  checkpoints:Array<{member:VersionRef;validators:string[];evidence:VersionRef[]}>
  evidence:VersionRef[];boundaryProof:VersionRef
}
export function validateRoutine(routine:RoutineVersion):void {
  if(routine.members.length<2||new Set(routine.members.map(m=>m.id)).size!==routine.members.length||!routine.evidence.length||!routine.boundaryProof)throw new Error("Routine requires lineage and boundary evidence")
  for(const member of routine.members)if(!routine.checkpoints.some(c=>c.member.id===member.id&&c.member.version===member.version&&c.validators.length&&c.evidence.length))throw new Error("Routine cannot erase internal validation checkpoints")
}
