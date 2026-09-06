import { posix } from "node:path"
import { resolve } from "node:path"
import { lstatSync } from "node:fs"
import type { TaskGraphEngine } from "./index.ts"

export function normalizeScopes(paths: string[]): string[] {
  if (!Array.isArray(paths)) throw new Error("writeScopes must be an array")
  return [...new Set(paths.map((path) => {
    if (typeof path !== "string" || !path.trim() || path.startsWith("/") || /^[a-z]:/i.test(path) || /[\\*?\[\]\x00]/.test(path))
      throw new Error("Scopes must be literal project-relative files or directories; use . for exclusive work")
    const normalized = posix.normalize(path).replace(/\/$/, "")
    if (normalized === ".." || normalized.startsWith("../")) throw new Error("Scope escapes project")
    return normalized.normalize("NFC").toLowerCase()
  }))].sort()
}
const overlaps = (a: string, b: string) => a === "." || b === "." || a === b || a.startsWith(b + "/") || b.startsWith(a + "/")

/** Durable reservations share the graph transaction; no model or execution loop. */
export class TaskScheduler {
  private engine: TaskGraphEngine
  readonly limit: number
  private workspace?: string
  constructor(engine: TaskGraphEngine, limit = 3, workspace?: string) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 16) throw new Error("maxWorkers must be 1–16")
    this.engine = engine
    this.limit = limit
    this.workspace = workspace
    engine.store.db.exec(`CREATE TABLE IF NOT EXISTS task_reservations (
      task_id TEXT PRIMARY KEY REFERENCES tasks(id), scopes TEXT NOT NULL, session_id TEXT
    )`)
  }
  private effectiveScopes(paths: string[]) {
    const scopes = normalizeScopes(paths)
    // Aliases through symlinks must not bypass reservations for the real target.
    if (this.workspace && paths.some((scope) => {
      let path = this.workspace!
      return scope.split("/").some((part) => {
        path = resolve(path, part)
        return lstatSync(path, { throwIfNoEntry: false })?.isSymbolicLink()
      })
    })) return ["."]
    return scopes
  }
  private active(): Array<{ task_id: string; scopes: string; session_id: string | null }> {
    return this.engine.store.db.prepare("SELECT * FROM task_reservations").all() as any
  }
  private blockers(taskId: string, scopes: string[]) {
    return this.active().filter((r) => {
      if (r.task_id === taskId) return false
      const held = JSON.parse(r.scopes) as string[]
      return held.includes(".") || scopes.includes(".") || held.some((a) => scopes.some((b) => overlaps(a, b)))
    })
  }
  claim(taskId: string, worker: { agent?: string; sessionId?: string; role?: string }) {
    return this.engine.atomic(() => {
      if (this.active().length >= this.limit) throw new Error(`Worker limit reached (${this.limit}); wait for a worker to finish`)
      const scopes = this.effectiveScopes(this.engine.loadTask(taskId).task.writeScopes ?? ["."])
      const conflicts = this.blockers(taskId, scopes)
      if (conflicts.length) throw new Error(`Write scope reserved by tasks: ${conflicts.map((r) => r.task_id).join(", ")}`)
      const task = this.engine.startTask(taskId, worker)
      this.engine.store.db.prepare("INSERT INTO task_reservations VALUES (?, ?, ?)")
        .run(taskId, JSON.stringify(scopes), worker.sessionId ?? null)
      return task
    })
  }
  expand(taskId: string, paths: string[]) {
    return this.engine.atomic(() => {
      const task = this.engine.loadTask(taskId).task
      const scopes = this.effectiveScopes([...(task.writeScopes ?? ["."]), ...paths])
      if (task.status !== "running" || !this.active().some((r) => r.task_id === taskId)) throw new Error("Task has no active reservation")
      const conflicts = this.blockers(taskId, scopes)
      if (conflicts.length) throw new Error(`Write scope expansion blocked by tasks: ${conflicts.map((r) => r.task_id).join(", ")}`)
      this.engine.store.db.prepare("UPDATE task_reservations SET scopes=? WHERE task_id=?").run(JSON.stringify(scopes), taskId)
      this.engine.store.setWriteScopes(taskId, scopes)
      return { taskId, writeScopes: scopes }
    })
  }
  release(taskId: string, workerStopped: boolean) {
    return this.engine.atomic(() => {
      if (!workerStopped) throw new Error("Confirm the worker has stopped before releasing its reservation")
      if (this.engine.loadTask(taskId).task.status === "running") throw new Error("Fail or complete the stopped task before releasing")
      this.engine.store.db.prepare("DELETE FROM task_reservations WHERE task_id=?").run(taskId)
      return { taskId, released: true }
    })
  }
  status(rootId?: string) {
    return this.engine.atomic(() => {
      const active = this.active()
      return {
        maxWorkers: this.limit,
        active: active.map((r) => ({ taskId: r.task_id, title: this.engine.loadTask(r.task_id).task.title, writeScopes: JSON.parse(r.scopes), sessionId: r.session_id })),
        runnable: this.engine.resolveRunnable(rootId).map((r) => ({ ...r,
          blockedBy: this.blockers(r.task.id, this.effectiveScopes(r.task.writeScopes ?? ["."])).map((x) => x.task_id),
          capacityAvailable: active.length < this.limit,
        })),
      }
    })
  }
}
