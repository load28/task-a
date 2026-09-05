import { DatabaseSync } from "node:sqlite"
import { resolve } from "node:path"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"

/** Import into a different DB. The legacy DB is opened read-only, including its WAL. */
export function importLegacy(source: string, target: string, workspace: string): { imported: number; total: number } {
  if (resolve(source) === resolve(target)) throw new Error("Legacy import requires a separate target database")
  const old = new DatabaseSync(source, { readOnly: true })
  let store: TaskGraphStore | undefined
  try {
    const columns = old
      .prepare("PRAGMA table_info(tasks)")
      .all()
      .map((r) => r.name)
    if (!columns.includes("objective") || !columns.includes("parent_task_id"))
      throw new Error("Source is not a legacy Task Agent database")
    store = new TaskGraphStore(target)
    const engine = new TaskGraphEngine(store)
    store.db.exec(
      "CREATE TABLE IF NOT EXISTS host_projects(workspace TEXT NOT NULL,root TEXT NOT NULL,PRIMARY KEY(workspace,root))",
    )
    store.db
      .exec(`CREATE TABLE IF NOT EXISTS legacy_imports(source TEXT NOT NULL,old_id TEXT NOT NULL,new_id TEXT NOT NULL,PRIMARY KEY(source,old_id));
      CREATE TABLE IF NOT EXISTS legacy_records(source TEXT NOT NULL,table_name TEXT NOT NULL,record_key TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(source,table_name,record_key));`)
    const sourceKey = resolve(source)
    const tasks = old.prepare("SELECT * FROM tasks").all()
    return store.transaction(() => {
      const tables = old.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
      for (const table of tables) {
        const name = String(table.name)
        if (!/^[a-z_]+$/.test(name)) throw new Error("Unexpected legacy table name")
        const rows = old.prepare(`SELECT * FROM "${name}"`).all()
        rows.forEach((row, index) =>
          store!.db
            .prepare("INSERT OR IGNORE INTO legacy_records VALUES(?,?,?,?)")
            .run(sourceKey, name, String(row.id ?? row.task_id ?? index), JSON.stringify(row)),
        )
      }
      if (tables.some((t) => t.name === "service_owner")) {
        const owner = old.prepare("SELECT issuer,subject FROM service_owner WHERE id=1").get()
        if (owner) store!.bindOwner(String(owner.issuer), String(owner.subject))
      }
      let imported = 0
      const pending = [...tasks]
      while (pending.length) {
        let progress = false
        for (let i = pending.length - 1; i >= 0; i--) {
          const row = pending[i]!
          const existing = store!.db
            .prepare("SELECT new_id FROM legacy_imports WHERE source=? AND old_id=?")
            .get(sourceKey, String(row.id))
          if (existing) {
            pending.splice(i, 1)
            progress = true
            continue
          }
          const parent = row.parent_task_id
            ? store!.db
                .prepare("SELECT new_id FROM legacy_imports WHERE source=? AND old_id=?")
                .get(sourceKey, String(row.parent_task_id))
            : undefined
          if (row.parent_task_id && !parent) continue
          const task = engine.createTask({ title: String(row.title), goal: String(row.objective) })
          engine.startTask(task.id)
          const records = store!.db
            .prepare(
              "SELECT table_name,payload FROM legacy_records WHERE source=? AND (json_extract(payload,'$.task_id')=? OR json_extract(payload,'$.id')=?)",
            )
            .all(sourceKey, String(row.id), String(row.id))
          engine.publishArtifact({
            taskId: task.id,
            name: `legacy-${task.id}`,
            type: "note",
            content: JSON.stringify({ originalTask: row, records }, null, 2),
          })
          const updated = engine.requireTask(task.id)
          updated.parentId = parent ? String(parent.new_id) : undefined
          updated.status = row.status === "completed" ? "implemented" : row.status === "blocked" ? "blocked" : "pending"
          updated.statusReason = `구버전 상태 ${row.status}에서 가져옴. 검증 근거 재확인이 필요합니다.`
          updated.createdAt = String(row.created_at)
          updated.updatedAt = String(row.updated_at)
          store!.updateTask(updated)
          store!.db.prepare("INSERT INTO legacy_imports VALUES(?,?,?)").run(sourceKey, String(row.id), task.id)
          if (!parent)
            store!.db.prepare("INSERT OR IGNORE INTO host_projects VALUES(?,?)").run(resolve(workspace), task.id)
          imported++
          pending.splice(i, 1)
          progress = true
        }
        if (!progress) throw new Error("Legacy parent graph has missing parents or a cycle; import rolled back")
      }
      return { imported, total: tasks.length }
    })
  } finally {
    old.close()
    store?.close()
  }
}
