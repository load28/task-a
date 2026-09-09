import { unit } from "../../task-control/src/value.ts"
import type { CausalEdge, ChangeScope, PropagationResult, Relation } from "./model.ts"

const allowed: Record<ChangeScope, readonly Relation[]> = {
  syntactic:["depends_on","generated_from","derived_from","validates"],
  implementation:["depends_on","generated_from","derived_from","validates","integrates_with","constrained_by","shares_resource","conflicts_with"],
  behavior:["depends_on","validates","integrates_with","constrained_by","shares_resource","conflicts_with","derived_from"],
  contract:["depends_on","shares_contract","implements","integrates_with","validates","constrained_by","derived_from"],
  dependency:["depends_on","shares_resource","shares_contract","conflicts_with","integrates_with","generated_from","derived_from","validates","blocks","supersedes","constrained_by"],
  assumption:["assumes","depends_on","derived_from","constrained_by","validates","integrates_with"],
  subgoal:["implements_goal","derived_from","assumes","depends_on","implements","constrained_by","validates","integrates_with"],
  goal:["implements_goal","derived_from","assumes","depends_on","implements","constrained_by","validates","integrates_with"],
}
/** Indexed outgoing lookup; cycles terminate because only strictly improving states enter the worklist. */
export function propagate(input: {
  sources: string[]; scopes: ChangeScope[]; graphComplete: boolean; universe?: string[]; outgoing: (entity: string) => CausalEdge[]
  threshold: (entity: string) => number; preserved: (edge: CausalEdge, scope: ChangeScope) => boolean
  sourceCritical?: boolean
}): PropagationResult {
  if (!input.sources.length || !input.scopes.length) throw new Error("A propagation source and scope are required")
  if(!input.graphComplete&&!input.universe?.length)throw new Error("An incomplete causal graph requires a conservative universe")
  const score=new Map<string,number>(), hardState=new Set<string>(), unknownState=new Set<string>()
  const nodes=new Set<string>(), hard=new Set<string>(), unknown=new Set<string>(), impact: Record<string,number>={}
  const trace: PropagationResult["trace"]=[], queue:Array<{id:string;scope:ChangeScope;impact:number;hard:boolean;unknown:boolean}>=[]
  const visit=(id:string,scope:ChangeScope,value:number,isHard:boolean,isUnknown:boolean) => {
    const key=JSON.stringify([id,scope])
    if ((score.get(key)??-1)>=value && (!isHard||hardState.has(key)) && (!isUnknown||unknownState.has(key))) return
    score.set(key,Math.max(score.get(key)??0,value)); if(isHard) hardState.add(key); if(isUnknown) unknownState.add(key)
    nodes.add(id); impact[id]=Math.max(impact[id]??0,value); if(isHard) hard.add(id); if(isUnknown) unknown.add(id)
    queue.push({id,scope,impact:score.get(key)!,hard:hardState.has(key),unknown:unknownState.has(key)})
  }
  for(const source of input.sources) for(const scope of input.scopes) visit(source,scope,1,input.sourceCritical??false,false)
  for(let index=0;index<queue.length;index++) {
    const next=queue[index]!
    for(const edge of input.outgoing(next.id)) {
      if(edge.source.entityId!==next.id) throw new Error("Outgoing index returned an unrelated edge")
      unit(edge.impactWeight,"Impact weight")
      if(edge.critical && edge.impactWeight!==1) throw new Error("Critical edge cannot attenuate")
      if(!edge.changeTypes.includes(next.scope)||!allowed[next.scope].includes(edge.relation)) continue
      if(input.preserved(edge,next.scope)) { trace.push({edgeId:edge.id,scope:next.scope,reason:"proven boundary preservation",impact:0}); continue }
      const isHard=next.hard||edge.critical, isUnknown=next.unknown||edge.completeness!=="verified"
      const value=isHard ? 1 : next.impact*edge.impactWeight
      trace.push({edgeId:edge.id,scope:next.scope,reason:isHard?"critical obligation":isUnknown?"unproven dependency completeness":"typed influence",impact:value})
      visit(edge.target.entityId,next.scope,value,isHard,isUnknown)
    }
  }
  if(!input.graphComplete)for(const id of input.universe!) {nodes.add(id);unknown.add(id);impact[id]=Math.max(impact[id]??0,1)}
  const affected=[...nodes].filter(id=>input.sources.includes(id)||hard.has(id)||unknown.has(id)||(impact[id]??0)>=unit(input.threshold(id),"Propagation threshold")).sort()
  return {affected,preserved:[...nodes].filter(n=>!affected.includes(n)).sort(),hard:[...hard].sort(),unknown:[...unknown].sort(),impact,trace}
}
