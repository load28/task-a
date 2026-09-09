import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

for(const prompt of [[],["unbounded prompt"]])test(`Pod 구 진입점은 허가 없이 자격 증명과 CLI를 시작하지 않는다: ${prompt.length}`,()=>{
  const root=mkdtempSync(join(tmpdir(),"model-stage-")),bin=join(root,"bin"),marker=join(root,"called")
  mkdirSync(bin)
  writeFileSync(join(bin,"opencode"),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'called')`,{mode:0o755})
  try {
    const result=spawnSync(process.execPath,[resolve("scripts/instance-model-stage.ts"),...prompt],{encoding:"utf8",env:{...process.env,PATH:`${bin}:${process.env.PATH}`,XDG_DATA_HOME:join(root,"data"),TASK_GRANT_BINDING:"",TASK_MODEL_AUTH_JSON:'{"openai":{"type":"api","key":"test-only"}}'}})
    assert.equal(result.status,1)
    assert.match(result.stderr,prompt.length?/controller-issued context manifest/:/activation capability/)
    assert.equal(existsSync(marker),false)
    assert.equal(existsSync(join(root,"data","opencode","auth.json")),false)
    assert.ok(!result.stderr.includes("test-only"))
  }finally{rmSync(root,{recursive:true,force:true})}
})

test("실패 원인이 호스트 진행 상황에서 사라지지 않는다", async () => {
  const { executionProgress } = await import("../packages/host-integration/src/presentation.ts")
  const failure = { stage: "verify", message: "Python 없음", logTail: "python3: command not found" }
  const parts = [{ type: "tool", tool: "task_graph_task_instance_status", state: { status: "completed", output: JSON.stringify({ status: { phase: "Failed", result: { failure } } }) } }]
  assert.deepEqual(executionProgress(parts).failure, failure)
  assert.match(executionProgress(parts).currentAction, /Python 없음/)
})
