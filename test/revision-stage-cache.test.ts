import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { runInstance } from "../packages/task-instances/src/worker.ts"
import type { InstanceSpec } from "../packages/task-instances/src/types.ts"
const spec = (): InstanceSpec => ({ taskId: "old", image: "image@sha256:fixed", run: 1, desiredState: "Running", deletionPolicy: "Retain", storage: { size: "1Gi" }, stages: [
  { id: "research", inputDigest: "a".repeat(64), outputs: ["notes.txt"], command: [process.execPath, "-e", "require('fs').writeFileSync('notes.txt','verified research')"] },
  { id: "implementation", outputs: ["old-feature.txt"], command: [process.execPath, "-e", "require('fs').writeFileSync('old-feature.txt','old direction')"] },
] })
test("new specification imports only a compatible completed stage and executes changed work", async t => {
  const root = mkdtempSync(join(tmpdir(), "stage-revision-")); t.after(() => rmSync(root, { recursive: true, force: true }))
  const old = join(root, "old"), next = join(root, "next"), input = spec()
  assert.equal(await runInstance(input, old, "old-uid"), 0)
  const target: InstanceSpec = { ...input, taskId: "next", reuseSources: [{ taskId: "old", stages: ["research"] }], stages: [input.stages[0]!,
    { id: "implementation", command: [process.execPath, "-e", "const f=require('fs');if(f.existsSync('old-feature.txt'))process.exit(1);f.writeFileSync('new-feature.txt',f.readFileSync('notes.txt'))"] }] }
  assert.equal(await runInstance(target, next, "new-uid", [old]), 0)
  const checkpoint = JSON.parse(readFileSync(join(next, "checkpoint.json"), "utf8"))
  assert.equal(checkpoint.attempts.research, undefined)
  assert.equal(checkpoint.reused.research, "old")
  assert.equal(checkpoint.attempts.implementation, 1)
  assert.equal(existsSync(join(next, "workspace/old-feature.txt")), false)
  assert.equal(readFileSync(join(next, "workspace/new-feature.txt"), "utf8"), "verified research")
})
test("changed input digest prevents reuse and corrupted artifacts are rejected", async t => {
  const root = mkdtempSync(join(tmpdir(), "stage-validate-")); t.after(() => rmSync(root, { recursive: true, force: true }))
  const old = join(root, "old"), input = spec(); await runInstance(input, old, "old-uid")
  const target: InstanceSpec = { ...input, taskId: "new", reuseSources: [{ taskId: "old", stages: ["research"] }],
    stages: [{ ...input.stages[0]!, inputDigest: "b".repeat(64) }] }
  const next = join(root, "new"); await runInstance(target, next, "new-uid", [old])
  assert.equal(JSON.parse(readFileSync(join(next, "checkpoint.json"), "utf8")).attempts.research, 1)
  writeFileSync(join(old, "stage-cache/research/files/notes.txt"), "tampered")
  await assert.rejects(runInstance({ ...target, stages: [input.stages[0]!] }, join(root, "tampered"), "another", [old]), /digest mismatch/)
})
