import { unit } from "../../task-control/src/value.ts"
import type { Observation, PredictionError, TaskExpectation } from "./model.ts"

export interface PredictionPolicy { weights: { contract: number; behavior: number; dependency: number; goal: number }; enter: number; exit: number }
export type Stability = "stable" | "replanning" | "stabilizing"
function distance(expected: Record<string, unknown>, actual: Record<string, unknown> | null): number | null {
  if (actual===null) return null
  const keys=new Set([...Object.keys(expected),...Object.keys(actual)])
  return keys.size ? [...keys].filter(k=>!(k in expected)||!(k in actual)||expected[k]!==actual[k]).length/keys.size : 0
}
export function validatePredictionPolicy(policy: PredictionPolicy) {
  const sum=Object.values(policy.weights).reduce((n,w)=>n+unit(w,"Prediction weight"),0)
  if (Math.abs(sum-1)>1e-10) throw new Error("Prediction weights must sum to one")
  if (unit(policy.enter,"Enter threshold")<=unit(policy.exit,"Exit threshold")) throw new Error("Enter must exceed exit")
}
export function predictionError(expected: TaskExpectation, actual: Observation, policy: PredictionPolicy, criticalViolations: string[]): PredictionError {
  validatePredictionPolicy(policy)
  if (actual.expectation.id!==expected.id || actual.expectation.version!==expected.version || actual.taskId!==expected.taskId) throw new Error("Observation does not match pinned expectation")
  const dimensions={contract:distance(expected.expectedInterface,actual.state.contract),behavior:distance(expected.expectedBehavior,actual.state.behavior),dependency:distance(expected.expectedDependencies,actual.state.dependencies),goal:distance(expected.expectedGoals,actual.state.goals)}
  const known=Object.values(dimensions).every(x=>x!==null)
  return {...dimensions, artifacts:distance(expected.expectedArtifacts,actual.state.artifacts),
    riskResidual:actual.state.risk===null ? null : Math.abs(unit(actual.state.risk,"Actual risk")-unit(expected.expectedRisk,"Expected risk")),
    score:known ? (Object.keys(dimensions) as Array<keyof typeof dimensions>).reduce((sum,k)=>sum+dimensions[k]!*policy.weights[k],0) : null,
    criticalViolations:[...new Set(criticalViolations)],expectation:{id:expected.id,version:expected.version},observation:{id:actual.id,version:actual.version},evidence:actual.evidence}
}
export function nextStability(previous: Stability, error: PredictionError, policy: PredictionPolicy, locallyRestored: boolean): Stability {
  validatePredictionPolicy(policy)
  if (error.criticalViolations.length || error.score===null) return "replanning"
  if (previous==="stable") return error.score>policy.enter ? "replanning" : "stable"
  if (error.score<policy.exit && locallyRestored) return "stable"
  return locallyRestored ? "stabilizing" : "replanning"
}
export function shouldSwitch(keep: number, replan: number, executionChange: number, newFailure: number, currentValid: boolean): boolean {
  if ([keep,replan,executionChange,newFailure].some(x=>!Number.isFinite(x)||x<0)) throw new Error("Invalid switching cost")
  return !currentValid || replan+executionChange+newFailure<keep
}
