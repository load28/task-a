import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync, appendFileSync, rmSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { createHash } from "node:crypto"
import { validateSpec, type InstanceSpec } from "./types.ts"
import { ensureWorktree } from "./workspace.ts"
import { saveWorkspace, restoreWorkspace, type WorkspaceArchive } from "./archive.ts"
import { stageKey, stageResultKey, publishStage, importStage } from "./stage-cache.ts"

interface Checkpoint {
  version: 1; identity: string; completed: string[]; active?: string; state: string
  attempts: Record<string, number>; exitCode?: number; updated: string
  resultKeys?: Record<string, string>; reused?: Record<string, string>
}
export function atomicJson(path: string, value: unknown) {
  const temp = `${path}.tmp`
  writeFileSync(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 })
  const fd = openSync(temp, "r")
  try { fsyncSync(fd) } finally { closeSync(fd) }
  renameSync(temp, path)
  const parent = openSync(dirname(path), "r")
  try { fsyncSync(parent) } finally { closeSync(parent) }
}
/** Checkpoints are stage boundaries, never a claim to restore process memory. */
export async function runInstance(spec: InstanceSpec, directory: string, instanceId: string, sourceDirectories: string[] = []): Promise<number> {
  validateSpec(spec)
  const restore: WorkspaceArchive | undefined = process.env.TASK_WORKSPACE_ARCHIVE ? JSON.parse(process.env.TASK_WORKSPACE_ARCHIVE) : undefined
  const archiveRoot = process.env.TASK_ARCHIVE_ROOT ?? "/archive"
  if (restore && !existsSync(resolve(directory, "restored.json"))) {
    if (restore.instanceId !== instanceId && !spec.restoreFromTaskId) throw new Error("Archive belongs to a different task instance")
    await restoreWorkspace(directory, process.env.TASK_RESTORE_ROOT ?? archiveRoot, restore)
    if (restore.instanceId !== instanceId) {
      const history = resolve(directory, "history", `source-${restore.instanceId}`)
      mkdirSync(history, { recursive: true })
      for (const file of ["checkpoint.json", "initialized.json", "resume.json", "termination.json"]) if (existsSync(resolve(directory, file))) renameSync(resolve(directory, file), resolve(history, file))
    }
    atomicJson(resolve(directory, "restored.json"), restore)
  }
  let savedArchive: WorkspaceArchive | undefined
  mkdirSync(directory, { recursive: true })
  mkdirSync(resolve(directory, "home"), { recursive: true })
  const workspace = resolve(directory, "workspace")
  const checkpointPath = resolve(directory, "checkpoint.json")
  const identity = createHash("sha256").update(JSON.stringify([instanceId, spec.taskId, spec.image, spec.repository, spec.stages])).digest("hex")
  const checkpoint: Checkpoint = existsSync(checkpointPath) ? JSON.parse(readFileSync(checkpointPath, "utf8")) :
    { version: 1, identity, completed: [], state: "Starting", attempts: {}, updated: "" }
  if (checkpoint.identity !== identity) throw new Error("Saved workspace does not match immutable task execution specification")
  checkpoint.resultKeys ??= {}; checkpoint.reused ??= {}
  let child: ChildProcess | undefined, stopping = false
  const save = () => { checkpoint.updated = new Date().toISOString(); atomicJson(checkpointPath, checkpoint) }
  let force: ReturnType<typeof setTimeout> | undefined
  const signal = (name: NodeJS.Signals) => {
    if (child?.pid) { try { process.kill(-child.pid, name) } catch (error: any) { if (error.code !== "ESRCH") throw error } }
  }
  const stop = () => {
    if (stopping) return
    stopping = true
    signal("SIGTERM")
    force = setTimeout(() => signal("SIGKILL"), 20000)
    force.unref()
  }
  process.on("SIGTERM", stop); process.on("SIGINT", stop)
  const execute = (command: string[], cwd: string) => new Promise<number>((done, fail) => {
    if (stopping) return done(143)
    child = spawn(command[0]!, command.slice(1), { cwd, detached: true, stdio: ["ignore", "pipe", "pipe"], env: {
      ...process.env, HOME: resolve(directory, "home"), TASK_ID: spec.taskId,
      TASK_CHECKPOINT: checkpointPath, TASK_RESUME_CONTEXT: resolve(directory, "resume.json"),
    } })
    child.stdout?.on("data", chunk => { appendFileSync(resolve(directory, "execution.log"), chunk); process.stdout.write(chunk) })
    child.stderr?.on("data", chunk => { appendFileSync(resolve(directory, "execution.log"), chunk); process.stderr.write(chunk) })
    child.once("error", fail)
    child.once("close", code => { child = undefined; done(code ?? 143) })
  })
  try {
    // Upgrade old plain checkouts without losing staged/untracked files, and repair
    // linked-worktree paths after an archive was restored to a new volume.
    ensureWorktree(spec, directory)
    if (!existsSync(resolve(directory, "initialized.json"))) atomicJson(resolve(directory, "initialized.json"), { identity })
    atomicJson(resolve(directory, "resume.json"), { previous: checkpoint, instruction:
      "Inspect saved files and graph state before continuing. Completed stages are skipped. An interrupted stage may have partial effects; do not assume its commands or tests succeeded." })
    const reuseArchives: Array<WorkspaceArchive | null> = JSON.parse(process.env.TASK_REUSE_ARCHIVES ?? "[]")
    for (const [index, archive] of reuseArchives.entries()) if (archive) {
      const target = resolve(directory, `reuse-source-${index}`)
      await restoreWorkspace(target, `/reuse/${index}`, archive)
      sourceDirectories[index] = target
    }
    for (const stage of spec.stages) {
      if (checkpoint.completed.includes(stage.id)) continue
      if (stopping) break
      const key = stageKey(spec, stage, checkpoint.resultKeys)
      let reused = false
      for (const [index, source] of (spec.reuseSources ?? []).entries()) {
        if (!source.stages.includes(stage.id)) continue
        const imported = importStage(sourceDirectories[index] ?? `/reuse/${index}`, workspace, stage, key)
        if (!imported) continue
        checkpoint.resultKeys[stage.id] = stageResultKey(imported, key)
        checkpoint.reused[stage.id] = source.taskId
        checkpoint.completed.push(stage.id)
        publishStage(directory, workspace, stage, key)
        save(); reused = true; break
      }
      if (reused) continue
      checkpoint.active = stage.id; checkpoint.state = "Running"
      checkpoint.attempts[stage.id] = (checkpoint.attempts[stage.id] ?? 0) + 1
      save()
      const code = await execute(stage.command, workspace)
      checkpoint.exitCode = code
      if (stopping || code !== 0) {
        checkpoint.state = stopping ? "Suspended" : "Failed"; save()
        return stopping ? 143 : code
      }
      const manifest = publishStage(directory, workspace, stage, key)
      checkpoint.resultKeys[stage.id] = stageResultKey(manifest, key)
      checkpoint.completed.push(stage.id); delete checkpoint.active; save()
    }
    for (const [index, archive] of reuseArchives.entries()) if (archive) rmSync(resolve(directory, `reuse-source-${index}`), { recursive: true, force: true })
    checkpoint.state = stopping ? "Suspended" : "Completed"; save()
    if (!stopping && spec.archive?.cleanupOnCompletion) savedArchive = await saveWorkspace(directory, archiveRoot, instanceId, spec.run)
    return stopping ? 143 : 0
  } catch (error) {
    checkpoint.state = stopping ? "Suspended" : "Failed"; save(); throw error
  } finally {
    if (force) clearTimeout(force)
    process.off("SIGTERM", stop); process.off("SIGINT", stop)
    // Kubernetes bind-mounts this individual file; replacing it with rename yields EBUSY.
    writeFileSync(process.env.TASK_TERMINATION_MESSAGE ?? resolve(directory, "termination.json"),
      JSON.stringify({ state: checkpoint.state, completed: checkpoint.completed, active: checkpoint.active, reused: checkpoint.reused, ...(savedArchive ? { archive: savedArchive } : {}) }) + "\n")
  }
}
