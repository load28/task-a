import type { SemanticState } from "../../task-causality/src/model.ts"
import { digest } from "../../task-control/src/value.ts"

export interface SemanticOutput {state:SemanticState;criticalViolations:string[]}
/** Unknown must be explicit null. Missing dimensions are never interpreted as zero. */
export function decodeSemanticOutput(text:string):SemanticOutput {
  const value=JSON.parse(text) as SemanticOutput
  if(!value||typeof value!=="object"||Array.isArray(value)||Object.keys(value).sort().join(",")!=="criticalViolations,state"||!Array.isArray(value.criticalViolations)||value.criticalViolations.some(v=>typeof v!=="string"||!v.trim()))throw new Error("Invalid semantic observation envelope")
  const state=value.state
  if(!state||Object.keys(state).sort().join(",")!=="artifacts,behavior,contract,dependencies,goals,risk")throw new Error("Every semantic dimension must be present")
  for(const field of ["artifacts","contract","behavior","dependencies","goals"] as const) {
    const entries=state[field]
    if(entries===null)continue
    if(typeof entries!=="object"||Array.isArray(entries)||Object.values(entries).some(v=>typeof v!==(field==="behavior"?"boolean":"string")))throw new Error(`Invalid semantic dimension: ${field}`)
  }
  if(state.risk!==null&&(!Number.isFinite(state.risk)||state.risk<0||state.risk>1))throw new Error("Invalid observed risk")
  return value
}

export function aggregateSemanticOutputs(outputs:SemanticOutput[]):SemanticOutput {
  if(!outputs.length)throw new Error("No measured semantic outputs")
  const state:SemanticState={artifacts:null,contract:null,behavior:null,dependencies:null,goals:null,risk:null}
  for(const key of ["artifacts","contract","behavior","dependencies","goals","risk"] as const) {
    const values=outputs.map(output=>output.state[key])
    if(values.every(value=>value!==null&&digest(value)===digest(values[0])))Object.assign(state,{[key]:values[0]})
  }
  return {state,criticalViolations:[...new Set(outputs.flatMap(output=>output.criticalViolations))]}
}
