import test, { type TestContext } from "node:test"
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { StateStore } from "../store/index.ts"
import { FileArtifactStore, inspectTree } from "../artifacts/index.ts"
import { digest } from "../contracts/canonical.ts"
import type { BlobRef } from "../contracts/model.ts"

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "task-agent-transaction-crash-"))
  t.after(() => {
    for (const entry of inspectTree(root).filter(entry => entry.kind === "directory")) chmodSync(join(root, entry.path), 0o700)
    rmSync(root, { recursive: true, force: true })
  })
  return { root, database: join(root, "state.sqlite"), artifacts: join(root, "artifacts") }
}

/** No mocks: an independent Node process commits/publishes and then kills itself. */
async function killBeforeReply(script: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "-e", script], { stdio: ["ignore", "pipe", "pipe"] })
    let stdout = "", stderr = "", timedOut = false
    child.stdout.on("data", chunk => { stdout += chunk })
    child.stderr.on("data", chunk => { stderr += chunk })
    child.once("error", reject)
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL") }, 10000)
    child.once("close", (code, signal) => {
      clearTimeout(timer)
      try {
        assert.equal(timedOut, false, "Crash injection process did not reach its intended kill point")
        assert.equal(signal, "SIGKILL", `Expected injected SIGKILL, received ${code}/${signal}: ${stderr}`)
        assert.equal(stdout, "", "Caller must receive no success response before the crash")
        resolve()
      } catch (error) { reject(error) }
    })
  })
}

test("SIGKILL after SQLite commit but before reply recovers one receipt, event and intent", { timeout: 15000 }, async t => {
  const paths = fixture(t)
  const command = { graphId: "committed", operationId: "start-once", expectedRevision: 0, payload: { kind: "run" } }
  await killBeforeReply(`
    import { StateStore } from ${JSON.stringify(new URL("../store/index.ts", import.meta.url).href)};
    const store = new StateStore(${JSON.stringify(paths.database)});
    store.command({ ...${JSON.stringify(command)}, initial: () => ({ runs: 0 }) }, (state, tx) => {
      state.runs++;
      tx.emit("attempt.scheduled", { attemptId: "attempt-one" });
      tx.enqueue("start-attempt-one", "start", { attemptId: "attempt-one" });
      return { attemptId: "attempt-one" };
    });
    process.kill(process.pid, "SIGKILL");
  `)

  const store = new StateStore<{ runs: number }>(paths.database)
  t.after(() => store.close())
  assert.deepEqual(store.read("committed"), { revision: 1, value: { runs: 1 } })
  const replay = store.command(command, () => { assert.fail("A committed operation must never execute again") })
  assert.deepEqual(replay, { revision: 1, result: { attemptId: "attempt-one" } })
  assert.equal(store.events("committed").length, 1)
  assert.equal(store.pending("committed").length, 1)
  assert.equal(store.pending("committed")[0]!.id, "start-attempt-one")
  const cursor = store.events("committed")[0]!.sequence
  assert.deepEqual(store.events("committed", cursor), [])
  assert.deepEqual(store.command(command, () => { assert.fail("A duplicate reply must use its stored receipt") }), replay)
})

test("SIGKILL after CAS publication leaves bytes unadopted until an explicit verified recovery transaction", { timeout: 15000 }, async t => {
  const paths = fixture(t), source = join(paths.root, "source")
  mkdirSync(source); writeFileSync(join(source, "result.txt"), "보존된 미채택 결과")
  const files = inspectTree(source), contentDigest = digest(files)
  const reference: BlobRef = { uri: `tree:${contentDigest}`, digest: contentDigest, size: files.reduce((size, entry) => size + entry.size, 0) }
  await killBeforeReply(`
    import { StateStore } from ${JSON.stringify(new URL("../store/index.ts", import.meta.url).href)};
    import { FileArtifactStore } from ${JSON.stringify(new URL("../artifacts/index.ts", import.meta.url).href)};
    const store = new StateStore(${JSON.stringify(paths.database)});
    const artifacts = new FileArtifactStore(${JSON.stringify(paths.artifacts)});
    artifacts.ingestDirectory(${JSON.stringify(source)});
    process.kill(process.pid, "SIGKILL");
  `)

  const store = new StateStore<{ artifact: BlobRef }>(paths.database), artifacts = new FileArtifactStore(paths.artifacts)
  t.after(() => store.close())
  assert.equal(store.read("recovered"), undefined)
  assert.deepEqual(store.events("recovered"), [])
  assert.deepEqual(store.pending("recovered"), [])
  assert.equal(await artifacts.verify(reference), true)
  const command = { graphId: "recovered", operationId: "adopt-verified-orphan", expectedRevision: 0, payload: { artifact: reference } }
  const adopted = store.command({ ...command, initial: () => ({ artifact: reference }) }, (_state, tx) => {
    tx.emit("artifact.adopted", { artifact: reference }); return { artifact: reference }
  })
  assert.deepEqual(store.read("recovered")?.value.artifact, reference)
  assert.deepEqual(store.command(command, () => { assert.fail("Recovery adoption cannot duplicate") }), adopted)
  assert.equal(store.events("recovered").length, 1)
  assert.equal(await artifacts.verify(reference), true)
})
