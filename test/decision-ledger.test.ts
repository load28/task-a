import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { controlCompletionMissing } from "../packages/task-control/src/completion.ts"
import type { CognitiveRecord } from "../packages/task-context/src/memory.ts"
import { digest } from "../packages/task-control/src/value.ts"

for(const mode of ["validated","invalid","unknown","retracted","assumption-loss"] as const)test(`결정의 실제 검증·원인 연결과 재사용 게이트: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"decision-ledger-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const content={basis:"registered fixture observations"}
    const auth=r.control.evidence.put({id:"auth",version:1,type:"user",source:"operator",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const source=r.control.evidence.put({id:"source",version:1,type:"code",source:"basis",producer:"fixture",validatorVersion:"fixture/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const task=r.engine.createTask({title:"consumer",goal:"Use verified decision"})
    const assumptions=mode==="assumption-loss"?[{id:"premise",version:1}]:[]
    if(assumptions.length) {
      r.control.validators.register({id:"premise",version:1,command:[process.execPath,"-e",`console.log(JSON.stringify({verdict:'valid',reason:'Fixture premise confirmed'}))`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[auth]})
      r.control.assumptions.register({id:"premise",version:1,statement:"Fixture premise",tasks:[task.id],evidence:[source],authorization:[auth],validator:"premise/v1"})
      await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:2000})
    }
    const verdict=mode==="invalid"?"invalid":mode==="unknown"?"unknown":"validated"
    r.control.validators.register({id:"decision",version:1,command:[process.execPath,"-e",`let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);if(!input.evidence.some(e=>e.validatorVersion==='decision-input/v1'&&e.content.decision.conclusion==='Preserve the fixture contract'))process.exit(1);console.log(JSON.stringify({verdict:${JSON.stringify(verdict)},reason:'Independent fixture comparison'}));`],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[auth]})
    const decision={id:"choice",version:1,conclusion:"Preserve the fixture contract",tasks:[task.id],assumptions,evidence:[source],authorization:[auth],validator:"decision/v1"}
    r.control.decisions.register(decision)
    assert.equal(r.control.decisions.valid(decision),false)
    assert.ok(controlCompletionMissing(r.engine,[task.id]).some(message=>message.includes("decision is not validated")))
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:2000})
    assert.equal(r.control.decisions.valid(decision),verdict==="validated")
    assert.equal(controlCompletionMissing(r.engine,[task.id]).some(message=>message.includes("decision is not validated")),verdict!=="validated")
    const dependency={entityId:decision.id,port:"conclusion",view:"decision",version:1,hash:digest(decision)}
    const record:CognitiveRecord={id:"memory",version:1,kind:"analysis",taskSpecHash:"spec",policy:{id:"p",version:1},role:{id:"r",version:1},validatorVersion:"v1",schemaVersion:"v1",assumptions:[],conclusions:["result"],unresolvedQuestions:[],evidenceIndex:[],dependencyVersion:[dependency],level:0,content:"analysis",expiresAt:null}
    r.control.memory.save(record)
    const input={dependencies:[dependency],policy:record.policy,role:record.role,taskSpecHash:"spec",validatorVersion:"v1",schemaVersion:"v1",now:Date.now(),validEvidence:()=>true,validAssumption:()=>true}
    assert.equal(!!r.control.memory.reuse(record,input),verdict==="validated")
    if(mode==="retracted"||mode==="assumption-loss") {
      r.control.evidence.retract(source,[auth],"Registered basis withdrawn")
      assert.equal(r.control.decisions.valid(decision),false)
      assert.equal(r.control.memory.reuse(record,input),undefined)
      r.control.memory.save({...record,id:"late-memory"})
      r.close();r=createGraphRuntime(file)
      assert.equal(r.control.memory.reuse({...record,id:"late-memory"},input),undefined)
      assert.ok(r.store.control.get("decision_versions",decision.id,1))
    }
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM decision_validity WHERE state='executed'").get()!.n,0)
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
