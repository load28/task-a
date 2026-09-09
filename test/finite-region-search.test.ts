import test from "node:test"
import assert from "node:assert/strict"
import { searchRegions,connectedRegionDomain } from "../packages/task-causality/src/regions.ts"

test("하한 탐색은 실제 평가 비용의 전수 oracle과 같은 최소 영역을 찾는다",()=>{
  for(let seed=0;seed<40;seed++) {
    const candidates=Array.from({length:8},(_,i)=>({id:`r${i}`,nodes:["required",`n${i}`],lowerBound:(seed+i*3)%5}))
    const values=candidates.map((c,i)=>({feasible:(seed+i)%3!==0,cost:c.lowerBound+(seed*i+7)%13,evidence:[`evaluated:${seed}:${i}`],reason:"fixture feasibility"}))
    const result=searchRegions({candidates,affected:["required"],budget:8,domainComplete:true,evaluate:c=>values[Number(c.id.slice(1))]!})
    assert.equal(result.cost,Math.min(...values.filter(v=>v.feasible).map(v=>v.cost)))
    assert.equal(result.minimumProven,true);assert.equal(result.gap,0)
  }
})

test("낮은 하한의 unknown·평가 한도·후보 누락은 최소성 주장 대신 gap을 유지한다",()=>{
  const candidates=[{id:"unknown",nodes:["x"],lowerBound:1},{id:"feasible",nodes:["x"],lowerBound:2}]
  const evaluate=(c:{id:string})=>({feasible:c.id==="unknown"?"unknown" as const:true,cost:c.id==="unknown"?null:5,evidence:[c.id],reason:"bounded evaluation"})
  const result=searchRegions({candidates,affected:["x"],budget:2,domainComplete:true,evaluate})
  assert.equal(result.cost,5);assert.equal(result.lowerBound,1);assert.equal(result.gap,4);assert.equal(result.minimumProven,false)
  assert.equal(searchRegions({candidates,affected:["x"],budget:1,domainComplete:true,evaluate}).minimumProven,false)
  assert.equal(searchRegions({candidates:candidates.slice(1),affected:["x"],budget:1,domainComplete:false,evaluate}).minimumProven,false)
  assert.throws(()=>searchRegions({candidates,affected:["x"],budget:2,domainComplete:true,evaluate:()=>({feasible:true,cost:0,evidence:["e"],reason:"invalid lower bound"})}),/non-admissible/)
})

test("경계 후보는 연결된 합집합을 열거하고 잘린 탐색을 명시한다",()=>{
  const boundaries=[{id:"a",nodes:["a"]},{id:"b",nodes:["b"]},{id:"c",nodes:["c"]}]
  const full=connectedRegionDomain(boundaries,[["a","b"],["b","c"]],20)
  assert.equal(full.complete,true)
  assert.equal(full.candidates.length,6)
  assert.ok(full.candidates.some(c=>c.nodes.join(",")==="a,b,c"))
  assert.ok(!full.candidates.some(c=>c.nodes.join(",")==="a,c"))
  assert.equal(connectedRegionDomain(boundaries,[["a","b"],["b","c"]],3).complete,false)
})
