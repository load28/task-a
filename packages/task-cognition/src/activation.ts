import { randomUUID } from "node:crypto"
import { unit } from "../../task-control/src/value.ts"
import { FEATURES, type ActivationDecision, type RoleVersion, type Signals } from "./model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"

export function activation(input:{taskId:string;eventId:string;eligible:boolean;role:RoleVersion;policy:VersionRef;signals:Signals;now:number;lastInvocation?:number;invocations:number;requiredBy?:VersionRef}):ActivationDecision {
  const {role,signals}=input, policy=role.activationPolicy
  unit(policy.threshold,"Activation threshold")
  if(!Number.isSafeInteger(policy.maxInvocationsPerTask)||policy.maxInvocationsPerTask<1||!Number.isFinite(policy.cooldownMs)||policy.cooldownMs<0) throw new Error("Invalid activation limits")
  for(const feature of FEATURES) if(signals[feature]!==null) unit(signals[feature],feature)
  const hard=policy.hardTriggers.filter(f=>signals[f]!==null&&signals[f]!>0)
  let score=0, unknown=false
  for(const [key,weight] of Object.entries(policy.softSignals)) {
    if(!FEATURES.includes(key as typeof FEATURES[number])) throw new Error("Unknown activation feature")
    unit(weight!,"Signal weight")
    const value=signals[key as typeof FEATURES[number]]
    if(value===null) unknown=true
    else score+=value*weight!
  }
  const reasons:string[]=[]
  let action:ActivationDecision["action"]="skip"
  if(!input.eligible) reasons.push("outside causal eligibility")
  else if(role.lifecycle==="candidate") reasons.push("role has no evaluated execution lifecycle")
  else {
    const wanted=!!input.requiredBy||hard.length>0||score>policy.threshold
    const unknownHard=policy.hardTriggers.some(f=>signals[f]===null)
    if(wanted||unknown||unknownHard) {
      if(input.invocations>=policy.maxInvocationsPerTask) {action="defer";reasons.push("invocation quota; obligations remain pending")}
      else if(input.lastInvocation!==undefined && input.now-input.lastInvocation<policy.cooldownMs) {action="defer";reasons.push("cooldown; obligations remain pending")}
      else if(!wanted&&(unknown||unknownHard)) {action="defer";reasons.push("unknown evidence requires deterministic resolution")}
      else {action="activate";reasons.push(input.requiredBy?"registered mandatory review":hard.length?"hard evidence trigger":"soft score exceeded threshold")}
    } else reasons.push("score below activation threshold")
  }
  return {id:randomUUID(),eventId:input.eventId,taskId:input.taskId,role:{id:role.id,version:role.version},policy:input.policy,signals,score,hard,action,reasons,timestamp:input.now}
}
