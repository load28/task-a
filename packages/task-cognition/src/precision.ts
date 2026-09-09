import { positive } from "../../task-control/src/value.ts"
import type { ReasoningProfile } from "./model.ts"

export function validateProfile(profile:ReasoningProfile):void {
  if(!profile.id||![0,1,2,3,4,5].includes(profile.level)) throw new Error("Invalid reasoning profile")
  if(profile.level<2) return
  if(!profile.provider||!profile.model) throw new Error("A model profile must name an actual provider/model")
  for(const [k,v] of Object.entries({input:profile.maxInputTokens,output:profile.maxOutputTokens,tools:profile.maxToolCalls,time:profile.timeoutMs})) positive(v,k)
  if((["usage","tokenLimit","toolLimit","timeout"] as const).some(k=>profile.capability[k]!==true)) throw new Error("Adapter cannot enforce the requested profile")
  if(profile.level===5 && (new Set(profile.independentRoles).size<2||new Set(profile.independentRoles).size!==profile.independentRoles.length||profile.independentRoles.some(id=>!id.trim()))) throw new Error("Adversarial review requires independent roles")
}
export function selectPrecision(profiles:ReasoningProfile[],input:{cacheValid:boolean;deterministicallySolved:boolean;minimumLevel:2|3|4|5}):ReasoningProfile {
  const minimum=input.cacheValid?0:input.deterministicallySolved?1:input.minimumLevel
  for(const profile of profiles.filter(p=>p.level===minimum).sort((a,b)=>a.id.localeCompare(b.id))) {
    try {validateProfile(profile);return profile} catch { /* Unsupported profiles cannot receive grants. */ }
  }
  throw new Error(`No enforceable reasoning profile for L${minimum}`)
}
