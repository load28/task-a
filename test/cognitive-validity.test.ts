import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import type { CognitiveRecord } from "../packages/task-context/src/memory.ts"
import { PolicyLearning,type PolicyProposal } from "../packages/task-policy/src/index.ts"
import { digest } from "../packages/task-control/src/value.ts"

for(const change of ["retraction","expiration","rollback"] as const)test(`실제 ${change} event가 소비한 인지 기록만 무효화하며 재시작에도 유지된다`,()=>{
  const dir=mkdtempSync(join(tmpdir(),"cognitive-validity-")),file=join(dir,"graph.db")
  let r=createGraphRuntime(file)
  try {
    const content={fact:"registered observation"},now=Date.now()
    const auth=r.control.evidence.put({id:"operator",version:1,type:"user",source:"operator",producer:"test",validatorVersion:"fixture/v1",timestamp:now,content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
    const proof=r.control.evidence.put({id:"source",version:1,type:"runtime",source:"observation",producer:"test",validatorVersion:"fixture/v1",timestamp:now-2000,content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:change==="expiration"?now-1:null})
    const record:CognitiveRecord={id:"dependent",version:1,kind:"analysis",taskSpecHash:"spec",policy:{id:"policy",version:2},role:{id:"role",version:1},validatorVersion:"fixture/v1",schemaVersion:"v1",assumptions:[],conclusions:["conclusion"],unresolvedQuestions:[],evidenceIndex:[proof],dependencyVersion:[],level:0,content:"analysis",expiresAt:null}
    r.control.memory.save(record)
    r.control.memory.save({...record,id:"unrelated",policy:{id:"other",version:1},evidenceIndex:[auth]})
    if(change==="retraction") {
      assert.throws(()=>r.control.evidence.retract(auth,[auth],"self"),/own retraction/)
      r.control.evidence.retract(proof,[auth],"관찰이 철회됨")
      r.control.evidence.retract(proof,[auth],"같은 철회 재전달")
      assert.equal(r.control.evidence.valid(proof),false)
    }else if(change==="expiration")r.engine.atomic(()=>r.control.evidence.expire())
    else {
      const policy:PolicyProposal={id:"policy",version:1,target:"activation",observedPattern:"pattern",rootCause:"cause",proposedInvariant:"invariant",proposedRule:{op:"gte",feature:"risk",value:.5},expectedBenefit:1,regressionRisk:0,evidence:[auth],counterexamples:[],rollback:{id:"policy",version:1}}
      r.store.control.put("policy_versions",policy.id,1,policy)
      r.store.control.put("policy_versions",policy.id,2,{...policy,version:2})
      r.store.db.prepare("INSERT INTO policy_heads VALUES('activation','policy',2)").run()
      new PolicyLearning(r.store.control).rollback("activation",{id:"policy",version:1},[auth],ref=>r.control.evidence.valid(ref))
    }
    const input={dependencies:[],policy:record.policy,role:record.role,taskSpecHash:record.taskSpecHash,validatorVersion:record.validatorVersion,schemaVersion:record.schemaVersion,now:Date.now(),validEvidence:()=>true,validAssumption:()=>true}
    // Even a caller retaining an outdated validity predicate cannot revive an invalidated record.
    assert.equal(r.control.memory.reuse({id:record.id,version:1},input),undefined)
    assert.ok(r.control.memory.reuse({id:"unrelated",version:1},{...input,policy:{id:"other",version:1}}))
    r.control.memory.save({...record,id:"late-result"})
    assert.equal(r.control.memory.reuse({id:"late-result",version:1},input),undefined)
    r.close();r=createGraphRuntime(file)
    assert.equal(r.control.memory.reuse({id:"late-result",version:1},input),undefined)
    for(let i=0;i<3;i++)r.engine.atomic(()=>r.control.memory.ingest())
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM cognitive_invalidations WHERE record_id='dependent'").get()!.n,1)
    assert.equal(r.store.db.prepare("SELECT count(*) n FROM cognitive_invalidations WHERE record_id='unrelated'").get()!.n,0)
    assert.ok(r.store.control.get("evidence_versions",proof.id,proof.version))
  }finally{r.close();rmSync(dir,{recursive:true,force:true})}
})
