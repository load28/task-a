import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { createHash } from "node:crypto"
import { validateSpec, type InstanceSpec } from "./types.ts"

interface Checkpoint {
  version: 1; identity: string; completed: string[]; active?: string; state: string
  attempts: Record<string, number>; exitCode?: number; updated: string
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
export async function runInstance(spec: InstanceSpec, directory: string, instanceId: string): Promise<number> {
  validateSpec(spec)
  mkdirSync(directory, { recursive: true })
  mkdirSync(resolve(directory, "home"), { recursive: true })
  const workspace = resolve(directory, "workspace")
  const checkpointPath = resolve(directory, "checkpoint.json")
  const identity = createHash("sha256").update(JSON.stringify([instanceId, spec.taskId, spec.image, spec.repository, spec.stages])).digest("hex")
  const checkpoint: Checkpoint = existsSync(checkpointPath) ? JSON.parse(readFileSync(checkpointPath, "utf8")) :
    { version: 1, identity, completed: [], state: "Starting", attempts: {}, updated: "" }
  if (checkpoint.identity !== identity) throw new Error("Saved workspace does not match immutable task execution specification")
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
    child = spawn(command[0]!, command.slice(1), { cwd, detached: true, stdio: "inherit", env: {
      ...process.env, HOME: resolve(directory, "home"), TASK_ID: spec.taskId,
      TASK_CHECKPOINT: checkpointPath, TASK_RESUME_CONTEXT: resolve(directory, "resume.json"),
    } })
    child.once("error", fail)
    child.once("exit", code => { child = undefined; done(code ?? 143) })
  })
  try {
    // Initialization is separately marked so a killed clone is never treated as a ready checkout.
    if (!existsSync(resolve(directory, "initialized.json"))) {
      mkdirSync(workspace, { recursive: true })
      if (spec.repository) {
        for (const command of [["git", "init"], ["git", "fetch", "--depth=1", spec.repository.url, spec.repository.commit],
          ["git", "checkout", "--detach", spec.repository.commit]]) {
          const code = await execute(command, workspace)
          if (code !== 0) throw new Error(`Repository initialization exited ${code}`)
        }
      }
      atomicJson(resolve(directory, "initialized.json"), { identity })
    }
    atomicJson(resolve(directory, "resume.json"), { previous: checkpoint, instruction:
      "Inspect saved files and graph state before continuing. Completed stages are skipped. An interrupted stage may have partial effects; do not assume its commands or tests succeeded." })
    for (const stage of spec.stages) {
      if (checkpoint.completed.includes(stage.id)) continue
      if (stopping) break
      checkpoint.active = stage.id; checkpoint.state = "Running"
      checkpoint.attempts[stage.id] = (checkpoint.attempts[stage.id] ?? 0) + 1
      save()
      const code = await execute(stage.command, workspace)
      checkpoint.exitCode = code
      if (stopping || code !== 0) {
        checkpoint.state = stopping ? "Suspended" : "Failed"; save()
        return stopping ? 143 : code
      }
      checkpoint.completed.push(stage.id); delete checkpoint.active; save()
    }
    checkpoint.state = stopping ? "Suspended" : "Completed"; save()
    return stopping ? 143 : 0
  } catch (error) {
    checkpoint.state = stopping ? "Suspended" : "Failed"; save(); throw error
  } finally {
    if (force) clearTimeout(force)
    process.off("SIGTERM", stop); process.off("SIGINT", stop)
    // Kubernetes bind-mounts this individual file; replacing it with rename yields EBUSY.
    writeFileSync(process.env.TASK_TERMINATION_MESSAGE ?? resolve(directory, "termination.json"),
      JSON.stringify({ state: checkpoint.state, completed: checkpoint.completed, active: checkpoint.active }) + "\n")
  }
}
