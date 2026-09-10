import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { snapshotCode } from "../packages/task-snapshots/src/index.ts"

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "signal-")), store = new TaskGraphStore(join(dir, "graph.db")), e = new TaskGraphEngine(store)
  const root = e.createTask({ title: "pipeline", goal: "pipeline" })
  const a = e.createTask({ parentId: root.id, title: "A", goal: "A" }), b = e.createTask({ parentId: root.id, title: "B", goal: "B", dependencies: [a.id] }), c = e.createTask({ parentId: root.id, title: "C", goal: "C", dependencies: [b.id] })
  const trees = join(dir, "trees"); mkdirSync(trees)
  function submit(id: string, bytes: string) {
    const task = e.requireTask(id), path = join(trees, id); mkdirSync(path, { recursive: true }); writeFileSync(join(path, "code.ts"), bytes)
    e.signals.attest(id, task.attemptToken!, snapshotCode(path))
    return e.completeTask({ taskId: id, attemptToken: task.attemptToken, summary: "same summary", artifacts: [{ name: task.title, type: "code", content: "same summary" }], verification: { passed: true, evidence: "actual tests", criteriaSatisfied: [] } })
  }
  function run(id: string, bytes: string) { e.startTask(id); return submit(id, bytes) }
  function rerun(id: string, bytes: string) { e.reopenTask(id, "code edit"); return run(id, bytes) }
  const close = () => { store.close(); rmSync(dir, { recursive: true, force: true }) }
  return { e, store, root, a, b, c, run, submit, rerun, dir, close }
}
test("real code tree hash includes untracked files, lockfiles, deletion and internal links; ignores Git bookkeeping", () => {
  const dir = mkdtempSync(join(tmpdir(), "source-hash-"))
  try {
    writeFileSync(join(dir, "code.ts"), "a"); const a = snapshotCode(dir)
    mkdirSync(join(dir, ".git")); writeFileSync(join(dir, ".git", "HEAD"), "different commit")
    assert.equal(snapshotCode(dir).hash, a.hash)
    writeFileSync(join(dir, "package-lock.json"), "one"); const b = snapshotCode(dir); assert.notEqual(b.hash, a.hash)
    writeFileSync(join(dir, "code.ts"), "b"); assert.notEqual(snapshotCode(dir).hash, b.hash)
    rmSync(join(dir, "code.ts")); const deleted = snapshotCode(dir); assert.notEqual(deleted.hash, b.hash)
    symlinkSync("package-lock.json", join(dir, "link")); assert.notEqual(snapshotCode(dir).hash, deleted.hash)
    symlinkSync("/etc/hosts", join(dir, "external")); assert.throws(() => snapshotCode(dir), /outside/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
test("push coalesces H2 and H3, fences old execution immediately, and pull waits for observed stop", () => {
  const f = fixture(), { e, a, b, run, rerun, close } = f
  try {
    run(a.id, "a1"); run(b.id, "b1")
    e.reopenTask(b.id, "running work"); const old = e.startTask(b.id)
    rerun(a.id, "a2"); rerun(a.id, "a3")
    assert.equal(e.signals.list().filter(s => s.taskId === b.id).length, 1)
    assert.equal(e.signals.stops().filter(s => s.taskId === b.id).length, 1)
    assert.equal(e.store.currentAttempt(b.id)!.state, "fenced")
    assert.throws(() => e.startTask(b.id), /not ready|termination/)
    const stopped = e.signals.stops().find(s => s.taskId === b.id)!
    e.signals.stopped(stopped.id, stopped.token, "PID exit observed")
    e.startTask(b.id)
    assert.deepEqual(e.signals.pinned(b.id)!.inputRefs, e.requireTask(a.id).outputArtifactRefs)
    const vector=e.signals.pinned(b.id)!.vector
    assert.ok(vector.some(input=>input.entityId===b.id&&input.port==="environment"&&input.view==="runtime-platform"))
    assert.ok(vector.some(input=>input.entityId===`artifact:${e.requireTask(a.id).outputArtifactRefs[0]!.artifactId}`&&input.port==="content"&&input.view==="artifact-code"))
    assert.equal(vector.some(input=>input.view==="legacy-complete-input"),false)
    const before = e.requireTask(b.id).outputArtifactRefs
    e.completeTask({ taskId: b.id, attemptToken: old.attemptToken, summary: "late", artifacts: [{ name: "B", type: "code", content: "late" }], verification: { passed: true } })
    assert.deepEqual(e.requireTask(b.id).outputArtifactRefs, before)
    assert.equal(e.requireTask(b.id).status, "running")
  } finally { close() }
})
for (const changed of [false, true]) test(`downstream result is held while upstream reruns; ${changed ? "changed" : "identical"} output ${changed ? "requires rework" : "adopts held result"}`, () => {
  const { e, a, b, c, run, rerun, submit, close } = fixture()
  try {
    run(a.id, "a1"); run(b.id, "b1"); run(c.id, "c1")
    e.reopenTask(c.id, "ongoing C"); const priorC = e.startTask(c.id)
    rerun(a.id, "a2")
    assert.equal(submit(c.id, "c2").status, "implemented")
    assert.equal(e.store.db.prepare("SELECT count(*) AS n FROM task_pending_results").get()!.n, 1)
    e.startTask(b.id); submit(b.id, changed ? "b2" : "b1")
    if (changed) {
      assert.equal(e.signals.dirty(c.id), true)
      assert.notEqual(e.requireTask(c.id).status, "verified")
      run(c.id, "c3")
      assert.notEqual(e.requireTask(c.id).attemptToken, priorC.attemptToken)
    } else {
      assert.equal(e.requireTask(c.id).status, "verified")
      assert.equal(e.requireTask(c.id).attemptToken, priorC.attemptToken)
    }
    assert.equal(e.store.db.prepare("SELECT count(*) AS n FROM task_pending_results").get()!.n, 0)
  } finally { close() }
})
test("identical summary cannot hide different code; same actual code does not invalidate consumers", () => {
  const { e, a, b, run, rerun, close } = fixture()
  try {
    run(a.id, "a1"); run(b.id, "b1")
    const prior = e.requireTask(b.id).attemptToken
    rerun(a.id, "a1")
    assert.equal(e.signals.dirty(b.id), false)
    assert.equal(e.requireTask(b.id).attemptToken, prior)
    rerun(a.id, "a2")
    assert.equal(e.signals.dirty(b.id), true)
  } finally { close() }
})
test("adoption rechecks spec and environment inside the write transaction", () => {
  const { e, a, run, close } = fixture()
  try {
    e.startTask(a.id)
    e.atomic(() => e.signals.setEnvironment(a.id, "changed runtime"))
    e.completeTask({ taskId: a.id, attemptToken: e.requireTask(a.id).attemptToken, summary: "stale env", artifacts: [{ name: "A", type: "code", content: "old" }], verification: { passed: true } })
    assert.equal(e.requireTask(a.id).status, "stale")
    assert.equal(e.store.findArtifactByName("A"), undefined)
  } finally { close() }
})

test("실행 환경은 포괄 digest가 아니라 독립된 입력 view로 고정된다", () => {
  const { e, a, close } = fixture()
  try {
    e.signals.setEnvironment(a.id,{runtime:"node",version:1})
    const before=e.signals.capture(a.id)
    const environment=before.vector.find(input=>input.port==="environment")!
    assert.equal(environment.entityId,a.id)
    assert.equal(environment.view,"runtime-platform")
    e.signals.setEnvironment(a.id,{runtime:"node",version:2})
    const after=e.signals.capture(a.id).vector.find(input=>input.port==="environment")!
    assert.notEqual(after.hash,environment.hash)
    assert.equal(after.version,environment.version)
  } finally { close() }
})

test("input snapshots and stop requests survive a second database connection; stale writer cannot adopt", () => {
  const { e, a, b, run, rerun, dir, close } = fixture()
  let second: TaskGraphStore | undefined
  try {
    run(a.id, "a1"); e.startTask(b.id)
    const prior = e.requireTask(b.id).attemptToken, snapshot = e.signals.pinned(b.id)
    rerun(a.id, "a2")
    second = new TaskGraphStore(join(dir, "graph.db"))
    const resumed = new TaskGraphEngine(second)
    assert.deepEqual(resumed.signals.pinned(b.id), snapshot)
    const stop = resumed.signals.stops().find(s => s.taskId === b.id)!
    resumed.signals.stopped(stop.id, stop.token, "worker termination observed after reconnect")
    resumed.startTask(b.id)
    e.completeTask({ taskId: b.id, attemptToken: prior, summary: "old result", verification: { passed: true } })
    assert.equal(resumed.requireTask(b.id).status, "running")
    assert.equal(second.db.prepare("SELECT count(*) AS n FROM late_task_reports").get()!.n, 1)
  } finally { second?.close(); close() }
})

test("missing actual code snapshot cannot use the verified result cache", () => {
  const { e, a, b, close } = fixture()
  try {
    const attempt = e.startTask(a.id)
    const version = e.publishArtifact({ taskId: a.id, attemptToken: attempt.attemptToken, name: "A", type: "code", content: "this is only a summary" })
    assert.equal(e.signals.signature(version).reusable, false)
  } finally { close() }
})
