import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync,rmSync,existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { digest } from "../packages/task-control/src/value.ts"

test("등록된 결정론 검증은 event로 예약되고 예산 확보 후 실제 프로세스로 의무를 해결한다",async()=>{
  const workspace=mkdtempSync(join(tmpdir(),"validator-registry-")),r=createGraphRuntime(":memory:")
  try {
    const task=r.engine.createTask({title:"verify",goal:"verify"})
    const content={authorized:"Node exit-code check"}
    const cause=r.control.evidence.put({id:"authorization",version:1,type:"user",source:"test operator",producer:"test",validatorVersion:"operator/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
    r.control.validators.register({id:"check",version:1,command:[process.execPath,"-e","process.exit(0)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[cause]})
    const obligation=r.control.evidence.createObligation({entityId:task.id,tuple:[],kind:"local-test",mandatory:true,validators:["check/v1"],reason:[cause]})
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM validation_jobs").get()!.n,1)
    assert.equal((await r.control.validators.run(workspace,{maxJobs:1,maxDurationMs:500}))[0]?.state,"deferred")
    assert.equal(r.control.evidence.unresolved(task.id).length,1)
    assert.equal((await r.control.validators.run(workspace,{maxJobs:1,maxDurationMs:2000}))[0]?.state,"passed")
    assert.equal(r.control.evidence.unresolved(task.id).length,0)
    assert.equal(r.control.evidence.obligation(obligation.id)?.evidence.length,1)
    assert.equal(r.store.db.prepare("SELECT count(*) AS n FROM agent_runs").get()!.n,0)
    assert.deepEqual(await r.control.validators.run(workspace,{maxJobs:1,maxDurationMs:2000}),[])
  } finally {r.close();rmSync(workspace,{recursive:true,force:true})}
})

test("알 수 없는 validator는 실행하지 않고 실패한 검증은 필수 의무를 유지한다",async()=>{
  const workspace=mkdtempSync(join(tmpdir(),"validator-deny-")),r=createGraphRuntime(":memory:")
  try {
    const content={authorized:true}
    const cause=r.control.evidence.put({id:"authorization",version:1,type:"user",source:"test operator",producer:"test",validatorVersion:"operator/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
    r.control.validators.register({id:"fail",version:1,command:[process.execPath,"-e","process.exit(1)"],cwd:".",environment:{},timeoutMs:1000,maxOutputBytes:1000,authorization:[cause]})
    r.control.evidence.createObligation({entityId:"unknown",tuple:[],kind:"check",mandatory:true,validators:["unregistered/v1"],reason:[cause]})
    r.control.evidence.createObligation({entityId:"failed",tuple:[],kind:"check",mandatory:true,validators:["fail/v1"],reason:[cause]})
    const results=await r.control.validators.run(workspace,{maxJobs:2,maxDurationMs:3000})
    assert.deepEqual(results.map(result=>result.state),["deferred","failed"])
    assert.equal(r.control.evidence.unresolved("unknown").length,1)
    assert.equal(r.control.evidence.unresolved("failed")[0]?.state,"failed")
    assert.equal(existsSync(join(workspace,"unexpected")),false)
  } finally {r.close();rmSync(workspace,{recursive:true,force:true})}
})
