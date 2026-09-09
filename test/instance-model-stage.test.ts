import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

test("model stage resumes its own session, preserves refreshed auth and rejects CLI error events", () => {
  const root = mkdtempSync(join(tmpdir(), "model-stage-")), bin = join(root, "bin"), data = join(root, "data")
  mkdirSync(bin)
  writeFileSync(join(bin, "opencode"), `#!${process.execPath}
const fs=require('fs');
if(process.env.TASK_MODEL_AUTH_JSON) process.exit(9);
fs.writeFileSync(process.env.ARGS,JSON.stringify(process.argv.slice(2)));
console.log(JSON.stringify({type:'step_start',sessionID:'ses_test'}));
console.log(JSON.stringify(process.env.FAIL_MODEL ? {type:'error',error:{message:'provider failed'}} : {type:'step_finish',part:{reason:'stop'}}));
`, { mode: 0o755 })
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, XDG_DATA_HOME: data, ARGS: join(root, "args.json"), TASK_MODEL_AUTH_JSON: '{"openai":{"type":"api","key":"test-only"}}' }
  const run = (fail = false) => spawnSync(process.execPath, [resolve("scripts/instance-model-stage.ts"), "runtime test"], { env: { ...env, ...(fail ? { FAIL_MODEL: "1" } : {}) }, encoding: "utf8" })
  try {
    const first = run(); assert.equal(first.status, 0, first.stderr)
    assert.ok(!JSON.parse(readFileSync(env.ARGS, "utf8")).includes("--session"))
    const authPath = join(data, "opencode/auth.json")
    writeFileSync(authPath, '{"refreshed":true}')
    const second = run(); assert.equal(second.status, 0, second.stderr)
    const args = JSON.parse(readFileSync(env.ARGS, "utf8"))
    assert.equal(args[args.indexOf("--session") + 1], "ses_test")
    assert.equal(readFileSync(authPath, "utf8"), '{"refreshed":true}')
    assert.equal(run(true).status, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("모델 미완료 시 마지막 명령 오류와 실제 종료 상태를 보존한다", () => {
  const root = mkdtempSync(join(tmpdir(), "model-diagnostic-"))
  mkdirSync(join(root, "bin"))
  writeFileSync(join(root, "bin/opencode"), `#!${process.execPath}
console.log(JSON.stringify({type:'tool_use',part:{type:'tool',tool:'bash',state:{status:'completed',input:{command:'python3 -m pytest'},metadata:{exit:127},output:'python3: command not found'}}}));
`, { mode: 0o755 })
  try {
    const result = spawnSync(process.execPath, [resolve("scripts/instance-model-stage.ts"), "verify"], { encoding: "utf8", env: { ...process.env, PATH: `${root}/bin:${process.env.PATH}`, XDG_DATA_HOME: root } })
    assert.equal(result.status, 1)
    const receipt = JSON.parse(result.stderr.trim())
    assert.equal(receipt.childExitCode, 0)
    assert.equal(receipt.completed, false)
    assert.match(receipt.message, /python3: command not found/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test("실패 원인이 호스트 진행 상황에서 사라지지 않는다", async () => {
  const { executionProgress } = await import("../packages/host-integration/src/presentation.ts")
  const failure = { stage: "verify", message: "Python 없음", logTail: "python3: command not found" }
  const parts = [{ type: "tool", tool: "task_graph_task_instance_status", state: { status: "completed", output: JSON.stringify({ status: { phase: "Failed", result: { failure } } }) } }]
  assert.deepEqual(executionProgress(parts).failure, failure)
  assert.match(executionProgress(parts).currentAction, /Python 없음/)
})
