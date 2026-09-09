import { randomUUID } from "node:crypto"
import { digest, positive, unit } from "../../task-control/src/value.ts"
import type { ContextItem, ContextManifest, RoleVersion } from "../../task-cognition/src/model.ts"
import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"

export class ContextBudgetExceeded extends Error { readonly missing:string[]; constructor(missing:string[]) {super("Required context cannot fit the granted budget");this.missing=missing} }
export function budgetContext(input:{taskId:string;role:RoleVersion;policy:VersionRef;items:ContextItem[];scaffold:string;outputReservation:number;countTokens:(serialized:string)=>number}):ContextManifest {
  const budget=input.role.contextBudget
  for(const [key,value] of Object.entries(budget)) if(!Number.isSafeInteger(value)||value<0) throw new Error(`Invalid context budget: ${key}`)
  positive(budget.maxTokens,"Context tokens")
  if(!Number.isSafeInteger(input.outputReservation)||input.outputReservation<0) throw new Error("Invalid output reservation")
  const included:ContextItem[]=[],excluded:ContextManifest["excluded"]=[],missing:string[]=[],seen=new Set<string>()
  const count=(items:ContextItem[])=>{
    const tokens=input.countTokens(JSON.stringify({scaffold:input.scaffold,items}))+input.outputReservation
    if(!Number.isSafeInteger(tokens)||tokens<0) throw new Error("Invalid tokenizer result")
    return tokens
  }
  if(count([])>budget.maxTokens) throw new ContextBudgetExceeded(["system/role/tool schema/output reservation"])
  for(const item of [...input.items].sort((a,b)=>Number(b.required)-Number(a.required)||b.relevance-a.relevance||a.id.localeCompare(b.id))) {
    unit(item.relevance,"Context relevance")
    const key=JSON.stringify([item.id,item.version])
    if(seen.has(key)) continue
    seen.add(key)
    let reason:string|undefined
    if(item.depth>budget.maxDependencyDepth) reason="dependency depth"
    else if(item.kind==="evidence" && included.filter(i=>i.kind==="evidence").length>=budget.maxEvidenceItems) reason="evidence budget"
    else if(item.kind==="history" && included.filter(i=>i.kind==="history").length>=budget.maxHistoricalDecisions) reason="historical decision budget"
    else if(count([...included,item])>budget.maxTokens) reason="serialized token budget"
    if(reason) {excluded.push({id:item.id,reason});if(item.required) missing.push(item.id)}
    else included.push(item)
  }
  if(missing.length) throw new ContextBudgetExceeded(missing)
  const dependencies=new Map<string,VersionVector[number]>()
  for(const item of included) for(const dep of item.dependencies) {
    const key=JSON.stringify([dep.entityId,dep.port,dep.view]),old=dependencies.get(key)
    if(old && (old.version!==dep.version||old.hash!==dep.hash)) throw new Error("Conflicting context dependency versions")
    dependencies.set(key,dep)
  }
  const value={id:randomUUID(),version:1,taskId:input.taskId,role:{id:input.role.id,version:input.role.version},policy:input.policy,included,excluded,tokens:count(included),budget,dependencyVector:[...dependencies.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))}
  return {...value,hash:digest(value)}
}
