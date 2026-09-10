export interface RegionCandidate { id: string; nodes: string[]; cost: number; feasible: boolean }
export function minimumRegion(candidates: RegionCandidate[], affected: string[], evaluationBudget=Infinity) {
  const ordered=candidates.map(c=>{
    if(!Number.isFinite(c.cost)||c.cost<0||!c.id) throw new Error("Invalid region cost")
    return c
  }).sort((a,b)=>a.cost-b.cost||a.id.localeCompare(b.id))
  let examined=0
  for(const candidate of ordered) {
    if(examined++>=evaluationBudget) return {minimumProven:false,reason:"candidate evaluation budget exhausted" as const}
    if(candidate.feasible && affected.every(n=>candidate.nodes.includes(n)))
      return {minimumProven:true,region:candidate,domain:ordered.map(c=>c.id)}
  }
  return {minimumProven:true,reason:"no feasible region" as const}
}
export function mergeRegions(regions: Array<{nodes:string[];boundaries:string[];resources:string[]}>) {
  const merged:Array<{nodes:Set<string>;boundaries:Set<string>;resources:Set<string>}>=[]
  for(const region of regions) {
    const value={nodes:new Set(region.nodes),boundaries:new Set(region.boundaries),resources:new Set(region.resources)}
    for(let index=0;index<merged.length;) {
      const other=merged[index]!
      if((Object.keys(value) as Array<keyof typeof value>).some(k=>[...value[k]].some(n=>other[k].has(n)))) {
        for(const k of Object.keys(value) as Array<keyof typeof value>) for(const n of other[k]) value[k].add(n)
        merged.splice(index,1); index=0
      } else index++
    }
    merged.push(value)
  }
  return merged.map(r=>({nodes:[...r.nodes].sort(),boundaries:[...r.boundaries].sort(),resources:[...r.resources].sort()}))
}

export interface FiniteRegion {id:string;nodes:string[];lowerBound:number}
export interface SwitchingEstimate {currentValid:boolean;keep:{estimate:number;lower:number;upper:number};newFailure:{estimate:number;lower:number;upper:number}}
export interface RegionEvaluation {feasible:true|false|"unknown";cost:number|null;evidence:string[];reason:string;switching?:SwitchingEstimate;costComponents?:Record<string,number>;rawCostComponents?:Record<string,number>}
/** Search a registered finite domain; an unknown cheaper candidate remains in
 * the optimality gap. Evaluation is deterministic/validated controller work. */
export function searchRegions(input:{candidates:FiniteRegion[];affected:string[];budget:number;domainComplete:boolean;evaluate:(candidate:FiniteRegion)=>RegionEvaluation}) {
  if(!Number.isSafeInteger(input.budget)||input.budget<0||new Set(input.candidates.map(c=>c.id)).size!==input.candidates.length)throw new Error("Invalid finite search budget or duplicate candidate")
  const candidates=input.candidates.map(candidate=>{
    if(!candidate.id||!candidate.nodes.length||new Set(candidate.nodes).size!==candidate.nodes.length||!Number.isFinite(candidate.lowerBound)||candidate.lowerBound<0)throw new Error("Invalid region lower bound or members")
    return candidate
  }).sort((a,b)=>a.lowerBound-b.lowerBound||a.id.localeCompare(b.id))
  const trace:Array<{id:string;state:string;lowerBound:number;evaluation?:RegionEvaluation}>=[]
  let incumbent:{region:FiniteRegion;evaluation:RegionEvaluation;cost:number}|undefined,examined=0
  const unresolved:number[]=[]
  for(const candidate of candidates) {
    if(!input.affected.every(id=>candidate.nodes.includes(id))){trace.push({id:candidate.id,state:"outside required closure",lowerBound:candidate.lowerBound});continue}
    if(incumbent&&candidate.lowerBound>=incumbent.cost){trace.push({id:candidate.id,state:"cost bound pruned",lowerBound:candidate.lowerBound});continue}
    if(examined>=input.budget){unresolved.push(candidate.lowerBound);trace.push({id:candidate.id,state:"budget deferred",lowerBound:candidate.lowerBound});continue}
    const evaluation=input.evaluate(candidate);examined++
    if(![true,false,"unknown"].includes(evaluation.feasible)||!evaluation.reason||!evaluation.evidence.length||evaluation.cost!==null&&(!Number.isFinite(evaluation.cost)||evaluation.cost<candidate.lowerBound))throw new Error("Invalid feasibility evidence or non-admissible cost bound")
    trace.push({id:candidate.id,state:"evaluated",lowerBound:candidate.lowerBound,evaluation})
    if(evaluation.feasible==="unknown"||evaluation.feasible===true&&evaluation.cost===null)unresolved.push(candidate.lowerBound)
    else if(evaluation.feasible===true&&evaluation.cost!==null&&(!incumbent||evaluation.cost<incumbent.cost))incumbent={region:candidate,evaluation,cost:evaluation.cost}
  }
  if(!input.domainComplete)unresolved.push(0)
  const lowerBound=Math.min(incumbent?.cost??Infinity,...unresolved)
  const minimumProven=input.domainComplete&&(!unresolved.length||!!incumbent&&lowerBound>=incumbent.cost)
  return {region:incumbent?.region,cost:incumbent?.cost??null,lowerBound:Number.isFinite(lowerBound)?lowerBound:null,gap:incumbent?incumbent.cost-lowerBound:null,minimumProven,examined,domain:candidates.map(c=>c.id),trace,reason:minimumProven?(incumbent?"minimum within the registered finite domain":"no feasible region in the registered finite domain"):"unresolved feasibility, cost, or candidate domain"}
}

/** Enumerate connected unions; never claim exhaustion when the cap truncated them. */
export function connectedRegionDomain(boundaries:Array<{id:string;nodes:string[]}>,links:Array<[string,string]>,maxCandidates:number) {
  if(!Number.isSafeInteger(maxCandidates)||maxCandidates<1||new Set(boundaries.map(b=>b.id)).size!==boundaries.length||boundaries.some(b=>!b.id||!b.nodes.length||new Set(b.nodes).size!==b.nodes.length))throw new Error("Invalid boundary domain")
  const ordered=[...boundaries].sort((a,b)=>a.id.localeCompare(b.id)),result:Array<{id:string;nodes:string[];boundaries:string[]}>=[],seen=new Set<string>()
  const queue=ordered.map(b=>[b.id]),byId=new Map(ordered.map(b=>[b.id,b]))
  for(let index=0;index<queue.length;index++) {
    const ids=queue[index]!.sort(),key=JSON.stringify(ids)
    if(seen.has(key))continue
    if(result.length>=maxCandidates)return {candidates:result,complete:false}
    seen.add(key)
    const nodes=[...new Set(ids.flatMap(id=>byId.get(id)!.nodes))].sort()
    result.push({id:key,nodes,boundaries:ids})
    for(const boundary of ordered)if(!ids.includes(boundary.id)&&(boundary.nodes.some(n=>nodes.includes(n))||links.some(([a,b])=>nodes.includes(a)&&boundary.nodes.includes(b)||nodes.includes(b)&&boundary.nodes.includes(a))))queue.push([...ids,boundary.id])
  }
  return {candidates:result,complete:true}
}
