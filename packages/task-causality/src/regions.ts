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
