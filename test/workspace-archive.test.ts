import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync, symlinkSync, readlinkSync, chmodSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { runInstance } from "../packages/task-instances/src/worker.ts"
import { restoreWorkspace } from "../packages/task-instances/src/archive.ts"
import type { InstanceSpec } from "../packages/task-instances/src/types.ts"
function git(cwd: string, args: string[]) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim()
}
test("full archive restores worktree history, index, dirty files, untracked files and model history into a new directory", async () => {
  const root = mkdtempSync(join(tmpdir(), "task-archive-")), data = join(root, "old"), restored = join(root, "new"), archives = join(root, "archives")
  const oldRoot = process.env.TASK_ARCHIVE_ROOT, oldRestore = process.env.TASK_WORKSPACE_ARCHIVE
  process.env.TASK_ARCHIVE_ROOT = archives
  const spec: InstanceSpec = { taskId: "archive-work", image: "test", desiredState: "Running", run: 1, storage: { size: "1Gi" }, deletionPolicy: "Retain", archive: { claimName: "archives", cleanupOnCompletion: true }, stages: [{ id: "work", command: [process.execPath, "-e", "require('fs').appendFileSync('runs.txt','once\\n')"] }] }
  try {
    // An existing ordinary repository must be migrated without changing its index.
    const workspace = join(data, "workspace"); mkdirSync(workspace, { recursive: true }); git(workspace, ["init"])
    writeFileSync(join(workspace, "tracked"), "base"); git(workspace, ["add", "tracked"])
    git(workspace, ["-c", "commit.gpgsign=false", "-c", "user.name=Test", "-c", "user.email=test@localhost", "commit", "-m", "base"])
    const commit = git(workspace, ["rev-parse", "HEAD"])
    writeFileSync(join(workspace, "tracked"), "staged"); git(workspace, ["add", "tracked"]); writeFileSync(join(workspace, "tracked"), "dirty")
    writeFileSync(join(workspace, "untracked"), "preserve"); chmodSync(join(workspace, "untracked"), 0o751); symlinkSync("tracked", join(workspace, "link"))
    mkdirSync(join(data, "home"), { recursive: true }); writeFileSync(join(data, "home", "session.db"), Buffer.from([0, 1, 2, 255]))
    assert.equal(await runInstance(spec, data, "uid-archive"), 0)
    assert.match(readFileSync(join(workspace, ".git"), "utf8"), /gitdir:/)
    const receipt = JSON.parse(readFileSync(join(data, "termination.json"), "utf8")).archive
    assert.ok(receipt.sha256)
    assert.ok(receipt.bytes>0);assert.ok(receipt.elapsedMs>=0)
    rmSync(data, { recursive: true })
    process.env.TASK_WORKSPACE_ARCHIVE = JSON.stringify(Object.fromEntries(Object.entries(receipt).reverse()))
    assert.equal(await runInstance({ ...spec, run: 2, archive: { ...spec.archive!, cleanupOnCompletion: false } }, restored, "uid-archive"), 0)
    const migration=JSON.parse(readFileSync(join(restored,"termination.json"),"utf8")).operationalReceipts.find((item:any)=>item.category==="dataMigration")
    assert.equal(migration.bytes,receipt.bytes);assert.ok(migration.elapsedMs>=0)
    const next = join(restored, "workspace")
    assert.equal(git(next, ["rev-parse", "HEAD"]), commit)
    assert.equal(git(next, ["show", ":tracked"]), "staged")
    assert.equal(readFileSync(join(next, "tracked"), "utf8"), "dirty")
    assert.equal(readFileSync(join(next, "untracked"), "utf8"), "preserve")
    assert.equal(readlinkSync(join(next, "link")), "tracked")
    assert.equal(statSync(join(next, "untracked")).mode & 0o777, 0o751)
    assert.equal(readFileSync(join(next, "runs.txt"), "utf8"), "once\n")
    assert.deepEqual(readFileSync(join(restored, "home", "session.db")), Buffer.from([0, 1, 2, 255]))
    const fork = join(root, "fork")
    assert.equal(await runInstance({ ...spec, taskId: "forked-work", restoreFromTaskId: spec.taskId, archive: { ...spec.archive!, cleanupOnCompletion: false } }, fork, "uid-fork"), 0)
    assert.equal(readFileSync(join(fork, "workspace", "runs.txt"), "utf8"), "once\nonce\n")
    assert.ok(readFileSync(join(fork, "history", "source-uid-archive", "checkpoint.json"), "utf8").includes("Completed"))
    assert.notEqual(git(next, ["branch", "--show-current"]), git(join(fork, "workspace"), ["branch", "--show-current"]))
    const archiveDir = join(archives, readdirSync(archives)[0]!)
    writeFileSync(join(archiveDir, receipt.file), "corrupted")
    await assert.rejects(restoreWorkspace(join(root, "broken"), archives, receipt), /checksum mismatch/)
  } finally {
    if (oldRoot === undefined) delete process.env.TASK_ARCHIVE_ROOT; else process.env.TASK_ARCHIVE_ROOT = oldRoot
    if (oldRestore === undefined) delete process.env.TASK_WORKSPACE_ARCHIVE; else process.env.TASK_WORKSPACE_ARCHIVE = oldRestore
    rmSync(root, { recursive: true, force: true })
  }
})
