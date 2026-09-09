import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync,writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { controlCompletionMissing } from "../packages/task-control/src/completion.ts"
import type { CognitiveRecord } from "../packages/task-context/src/memory.ts"
import { digest } from "../packages/task-control/src/value.ts"

for(const mode of ["valid","invalid","unknown","failed","retracted","receipt-retracted"] as const)test(`등록 가정의 실제 검증과 완료·인지 무효화: ${mode}`,async()=>{
  const dir=mkdtempSync(join(tmpdir(),"assumption-ledger-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const now=Date.now(),content={statement:"premise file is valid"}
    const auth=r.control.evidence.put({id:"operator",version:1,type:"user",source:"operator",producer:"fixture",validatorVersion:"fixture/v1",timestamp:now,content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const source=r.control.evidence.put({id:"premise-source",version:1,type:"code",source:"registered source",producer:"fixture",validatorVersion:"fixture/v1",timestamp:now,content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const task=r.engine.createTask({title:"consumer",goal:"consume verified premise"})
    const command=mode==="failed"?'process.exit(1)':`const value=require('node:fs').readFileSync('premise.txt','utf8');console.log(JSON.stringify({verdict:value,reason:'Observed registered premise file'}));`
    writeFileSync(join(dir,"premise.txt"),mode==="invalid"?"invalid":mode==="unknown"?"unknown":"valid")
    r.control.validators.register({id:"premise",version:1,command:[process.execPath,"-e",command],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[auth]})
    const assumption={id:"premise",version:1,statement:"The registered premise is valid",tasks:[task.id],evidence:[source],authorization:[auth],validator:"premise/v1"}
    r.control.assumptions.register(assumption)
    assert.ok(controlCompletionMissing(r.engine,[task.id]).some(value=>value.includes("assumption is not validated")))
    assert.equal(r.control.assumptions.valid(assumption),false)
    await r.control.validators.run(dir,{maxJobs:2,maxDurationMs:2000})
    const good=["valid","retracted","receipt-retracted"].includes(mode)
    assert.equal(r.control.assumptions.valid(assumption),good)
    assert.equal(controlCompletionMissing(r.engine,[task.id]).some(value=>value.includes("assumption is not validated")),!good)
    const record:CognitiveRecord={id:"dependent",version:1,kind:"analysis",taskSpecHash:"spec",policy:{id:"p",version:1},role:{id:"r",version:1},validatorVersion:"v1",schemaVersion:"v1",assumptions:[{id:assumption.id,version:1}],conclusions:["result"],unresolvedQuestions:[],evidenceIndex:[],dependencyVersion:[],level:0,content:"analysis",expiresAt:null}
    r.control.memory.save(record)
    const reuse={dependencies:[],policy:record.policy,role:record.role,taskSpecHash:"spec",validatorVersion:"v1",schemaVersion:"v1",now:Date.now(),validEvidence:()=>true,validAssumption:()=>true}
    assert.equal(!!r.control.memory.reuse(record,reuse),good)
    if(mode==="retracted"||mode==="receipt-retracted") {
      const row=r.store.db.prepare("SELECT obligation_id FROM assumption_validity WHERE id='premise'").get()!
      const ref=mode==="retracted"?source:r.control.evidence.obligation(String(row.obligation_id))!.evidence[0]!
      r.control.evidence.retract(ref,[auth],"Premise observation is withdrawn")
      assert.equal(r.control.assumptions.valid(assumption),false)
      assert.equal(r.control.memory.reuse(record,reuse),undefined)
      assert.ok(controlCompletionMissing(r.engine,[task.id]).some(value=>value.includes("assumption is not validated")))
      r.close();r=createGraphRuntime(file)
      assert.equal(r.control.assumptions.valid(assumption),false)
      assert.equal(r.control.memory.reuse(record,reuse),undefined)
    }
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
