import test from "node:test"
import assert from "node:assert/strict"
import {mkdtempSync,rmSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {createGraphRuntime} from "../apps/task-agent/src/graph-runtime.ts"
import {provisionDefaultProgram} from "../packages/host-integration/src/default-program.ts"

test("모델이 설정된 로컬 호스트는 프로젝트마다 완전한 기본 제어 프로그램을 멱등 등록한다",()=>{
  const directory=mkdtempSync(join(tmpdir(),"default-program-")),runtime=createGraphRuntime(join(directory,"graph.db"))
  try {
    const ref=provisionDefaultProgram(runtime.control,"openai/gpt-5.6-terra")
    assert.deepEqual(provisionDefaultProgram(runtime.control,"openai/gpt-5.6-terra"),ref)
    const program=runtime.store.control.get<any>("controller_programs",ref.id,ref.version)!
    assert.equal(program.planner.profile.maxOutputTokens,null)
    assert.equal(program.planner.profile.maxInputTokens,null)
    assert.equal(program.planner.profile.maxToolCalls,null)
    assert.equal(program.tokenLimit,null)
    const planner=runtime.store.control.get<any>("role_versions",program.planner.role.id,program.planner.role.version)!
    assert.deepEqual(planner.outputSchema.properties.evidence.items,{type:"object",required:["id","version"],properties:{id:{type:"string",minLength:1},version:{type:"integer",minimum:1}},additionalProperties:false})
    assert.ok(planner.outputSchema.properties.proposedTasks.items.properties.node.properties.taskSpec.required.includes("assignedRole"))
    assert.equal(planner.outputSchema.properties.proposedTasks.items.properties.node.properties.taskSpec.properties.assignedRole.const,program.worker.role.id)
    assert.equal(runtime.store.findRole(program.worker.role.id)?.id,program.worker.role.id)
    assert.equal(runtime.control.evidence.valid({path:"conventions/python.json"} as any),false)
    assert.throws(()=>runtime.control.evidence.require({path:"conventions/python.json"} as any),/Missing or expired evidence/)
    assert.ok(runtime.store.control.get("validator_versions",program.planValidators[0].split("/")[0],1))
    assert.ok(runtime.store.control.get("validator_versions",program.observationValidators[0].split("/")[0],1))
    const request=runtime.control.requests.submit({id:"request",sessionId:"session",text:"러스트 컨벤션을 추가하세요.",planOnly:false})
    runtime.control.requests.tick();assert.equal(runtime.control.requests.get(request.id)!.state,"waiting")
    assert.equal(runtime.control.requests.attachProgramToUnconfigured(ref),1)
    runtime.control.requests.tick()
    const configured=runtime.control.requests.get(request.id)!
    assert.equal(configured.state,"planning")
    assert.ok(configured.plannerGrant)
    runtime.store.db.exec("CREATE TABLE grant_dispatches(grant_id TEXT PRIMARY KEY,state TEXT NOT NULL,payload TEXT NOT NULL)")
    runtime.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=?").run(configured.plannerGrant)
    runtime.store.db.prepare("INSERT INTO grant_dispatches VALUES(?,'failed',?)").run(configured.plannerGrant,JSON.stringify({error:"OpenCode exited (1)"}))
    configured.state="waiting";configured.reason="Planning grant was fenced";runtime.store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(configured.state,JSON.stringify(configured),configured.id)
    assert.equal(runtime.control.requests.retryPreAdmissionInfrastructureFailure(),1)
    assert.equal(runtime.control.requests.retryPreAdmissionInfrastructureFailure(),0)
    assert.equal(runtime.control.requests.get(request.id)!.state,"pending")
    assert.equal(runtime.control.requests.get(request.id)!.plannerGrant,undefined)
    runtime.control.requests.tick()
    assert.equal(runtime.control.requests.get(request.id)!.state,"planning")
    assert.notEqual(runtime.control.requests.get(request.id)!.plannerGrant,configured.plannerGrant)
  }finally{runtime.close();rmSync(directory,{recursive:true,force:true})}
})
