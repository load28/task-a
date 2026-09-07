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
