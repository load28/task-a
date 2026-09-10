import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { attemptInputVector } from "../packages/task-control/src/completion.ts"
import { INTEGRATION_DIMENSIONS } from "../packages/task-evidence/src/integration.ts"
import { digest } from "../packages/task-control/src/value.ts"

test("실제 binding 및 7차원 검증만 현재 경계의 전파를 멈춘다",async()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const source=r.engine.createTask({title:"source",goal:"source"}),outside=r.engine.createTask({title:"outside",goal:"outside"})
    const authorization=r.control.evidence.put({id:"boundary-authority",version:1,type:"user",source:"explicit complete boundary fixture",producer:"fixture",validatorVersion:"user/v1",timestamp:Date.now(),content:{boundary:"complete"},contentHash:digest({boundary:"complete"}),inputVector:[],confidence:1,expiresAt:null})
    const edge={id:"verified-exit",version:1,source:{entityId:source.id,port:"output",view:"semantic-state"},target:{entityId:outside.id,port:"input",view:"semantic-state"},relation:"depends_on" as const,changeTypes:["behavior" as const],impactWeight:1,critical:true,observedPropagationRate:{successes:1,trials:1,estimate:1,modelVersion:"actual-boundary/v1"},evidence:[authorization],completeness:"verified" as const}
    r.control.graph.put(edge,0)
    const state={artifacts:{},contract:{},behavior:{works:true},dependencies:{},goals:{},risk:0}
    r.control.pinExpectation({id:source.id,version:1,taskId:source.id,specHash:r.engine.signals.capture(source.id).specHash,expectedArtifacts:{},expectedInterface:{},expectedBehavior:{works:true},expectedDependencies:{},expectedGoals:{},expectedRisk:0,evidence:[authorization]},{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.7,exit:.3})
    r.engine.startTask(source.id)
    const tuple=attemptInputVector(r.engine,source.id)
    const observed=r.control.evidence.put({id:"boundary-observation",version:1,type:"runtime",source:"actual semantic observation fixture",producer:"fixture",validatorVersion:"semantic/v1",timestamp:Date.now(),content:{state},contentHash:digest({state}),inputVector:tuple,confidence:1,expiresAt:null})
    r.control.observe({id:"boundary-observation",version:1,taskId:source.id,expectation:{id:source.id,version:1},state,evidence:[observed],inputVector:tuple},{weights:{contract:.25,behavior:.25,dependency:.25,goal:.25},enter:.7,exit:.3},[])
    const validators=Object.fromEntries(INTEGRATION_DIMENSIONS.map(dimension=>[dimension,`boundary-${dimension}/v1`])) as Record<typeof INTEGRATION_DIMENSIONS[number],string>
    for(const id of ["boundary-bindings",...INTEGRATION_DIMENSIONS.map(d=>`boundary-${d}`)])r.control.validators.register({id,version:1,command:[process.execPath,"-e",`const fs=require('node:fs'),input=JSON.parse(fs.readFileSync(0,'utf8')),p=input.evidence.find(e=>e.validatorVersion==='integration-input/v1').content;process.exit(p.boundary.bindingsComplete&&p.boundary.exits[0]==='verified-exit'&&p.observations.length===1?0:2)`],cwd:".",environment:{},timeoutMs:2000,maxOutputBytes:2000,authorization:[authorization]})
    r.control.boundaries.register({id:"complete-boundary",version:1,members:[source.id],exits:[edge.id],invariants:["semantic output remains compatible"],bindingsComplete:true,validators,authorization:[authorization],bindingValidator:"boundary-bindings/v1",proofMaxAgeMs:60000})
    await r.control.validators.run(process.cwd(),{maxJobs:16,maxDurationMs:20000})
    r.engine.atomic(()=>r.control.boundaries.ingest())
    assert.equal(r.control.boundaries.preserves(edge,"behavior"),true)
    assert.deepEqual(r.control.boundaries.containment([source.id],["behavior"],[source.id,outside.id]),[source.id])
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM boundary_proofs").get()!.n,8)
    const receipt=JSON.parse(String(r.store.db.prepare("SELECT payload FROM validation_jobs WHERE state='passed' LIMIT 1").get()!.payload)).evidence
    r.control.evidence.retract(receipt,[authorization],"withdraw current boundary evidence")
    assert.equal(r.control.boundaries.preserves(edge,"behavior"),false)
    assert.equal(r.control.boundaries.containment([source.id],["behavior"],[source.id,outside.id]),undefined)
  }finally{r.close()}
})

test("불완전하거나 실제 crossing edge와 다른 경계는 보존 증거를 만들지 않는다",()=>{
  const r=createGraphRuntime(":memory:")
  try {
    const source=r.engine.createTask({title:"source",goal:"source"}),outside=r.engine.createTask({title:"outside",goal:"outside"})
    const authorization=r.control.evidence.put({id:"boundary-authority",version:1,type:"user",source:"fixture",producer:"fixture",validatorVersion:"user/v1",timestamp:Date.now(),content:{allow:true},contentHash:digest({allow:true}),inputVector:[],confidence:1,expiresAt:null})
    r.control.validators.register({id:"binding",version:1,command:[process.execPath,"-e","process.exit(0)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[authorization]})
    r.control.graph.put({id:"actual-crossing",version:1,source:{entityId:source.id,port:"out",view:"semantic"},target:{entityId:outside.id,port:"in",view:"semantic"},relation:"depends_on",changeTypes:["behavior"],impactWeight:1,critical:true,observedPropagationRate:{successes:0,trials:0,estimate:1,modelVersion:"unknown/v1"},evidence:[authorization],completeness:"unknown"},0)
    const validators=Object.fromEntries(INTEGRATION_DIMENSIONS.map(d=>[d,"binding/v1"])) as Record<typeof INTEGRATION_DIMENSIONS[number],string>
    assert.throws(()=>r.control.boundaries.register({id:"bad",version:1,members:[source.id],exits:["actual-crossing"],invariants:["x"],bindingsComplete:true,validators,authorization:[authorization],bindingValidator:"binding/v1",proofMaxAgeMs:1000}),/verified crossing edges/)
    assert.equal(r.store.control.head("planning_boundaries","bad"),0)
  }finally{r.close()}
})
