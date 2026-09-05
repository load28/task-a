import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"
import type { ArtifactRef, Task, TaskEvent, TaskRelation, TaskRelationType, TaskSnapshot, TaskStatus } from "#task-domain"
import type { TaskRepository } from "#task-engine"

interface Row { [key: string]: unknown }

export class SqliteTaskRepository implements TaskRepository {
  private db: DatabaseSync
  private transactionDepth = 0

  constructor(filename = ":memory:") {
    if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true })
    this.db = new DatabaseSync(filename)
    this.db.exec("PRAGMA busy_timeout = 10000")
    this.db.exec("PRAGMA foreign_keys = ON")
    this.db.exec("PRAGMA journal_mode = WAL")
    this.migrate()
  }

  close(): void {
    this.db.close()
  }

  bindOwner(issuer: string, subject: string): void {
    if (!issuer.trim() || !subject.trim()) throw new Error("Owner identity is required")
    this.transaction(() => {
      this.db.exec("CREATE TABLE IF NOT EXISTS service_owner (id INTEGER PRIMARY KEY CHECK(id = 1), issuer TEXT NOT NULL, subject TEXT NOT NULL)")
      const owner = this.db.prepare("SELECT issuer, subject FROM service_owner WHERE id = 1").get()
      if (owner && (owner.issuer !== issuer || owner.subject !== subject)) throw new Error("Database belongs to another owner; refusing to reassign it")
      if (!owner) this.db.prepare("INSERT INTO service_owner (id, issuer, subject) VALUES (1, ?, ?)").run(issuer, subject)
    })
  }

  create(task: Task, event: TaskEvent, snapshot: TaskSnapshot): void {
    this.transaction(() => {
      this.insertTask(task)
      this.insertEvent(event)
      this.upsertSnapshot(task.id, snapshot)
    })
  }

  find(id: string): Task | undefined {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Row | undefined
    return row ? toTask(row) : undefined
  }

  search(query: string, limit: number): Task[] {
    if (!query) {
      return (this.db.prepare("SELECT * FROM tasks ORDER BY updated_at DESC LIMIT ?").all(limit) as Row[]).map(toTask)
    }
    const terms = [...new Set([query, ...query.split(/\s+/).filter((term) => term.length > 1)])]
    const patterns = terms.map((term) => `%${escapeLike(term)}%`)
    const clauses = terms.map(() => "(title LIKE ? ESCAPE '\\' COLLATE NOCASE OR objective LIKE ? ESCAPE '\\' COLLATE NOCASE)").join(" OR ")
    const matchArgs = patterns.flatMap((pattern) => [pattern, pattern])
    const fullPattern = patterns[0]!
    return (this.db.prepare(`
      SELECT * FROM tasks
      WHERE ${clauses}
      ORDER BY CASE WHEN title LIKE ? ESCAPE '\\' COLLATE NOCASE THEN 0 ELSE 1 END, updated_at DESC
      LIMIT ?
    `).all(...matchArgs, fullPattern, limit) as Row[]).map(toTask)
  }

  events(taskId: string): TaskEvent[] {
    return (this.db.prepare("SELECT * FROM task_events WHERE task_id = ? ORDER BY rowid").all(taskId) as Row[]).map(toEvent)
  }

  artifacts(taskId: string): ArtifactRef[] {
    return (this.db.prepare("SELECT * FROM artifacts WHERE task_id = ? ORDER BY created_at, rowid").all(taskId) as Row[]).map(toArtifact)
  }

  snapshot(taskId: string): TaskSnapshot | undefined {
    const row = this.db.prepare("SELECT snapshot_json FROM task_snapshots WHERE task_id = ?").get(taskId) as Row | undefined
    return row ? JSON.parse(String(row.snapshot_json)) as TaskSnapshot : undefined
  }

  append(event: TaskEvent, task: Task, snapshot: TaskSnapshot): void {
    this.transaction(() => {
      this.updateTaskRow(task)
      this.insertEvent(event)
      this.upsertSnapshot(task.id, snapshot)
    })
  }

  addArtifact(artifact: ArtifactRef, event: TaskEvent, task: Task, snapshot: TaskSnapshot): void {
    this.transaction(() => {
      this.updateTaskRow(task)
      this.db.prepare(`
        INSERT INTO artifacts (id, task_id, type, uri, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(artifact.id, artifact.taskId, artifact.type, artifact.uri, artifact.description ?? null, artifact.createdAt)
      this.insertEvent(event)
      this.upsertSnapshot(task.id, snapshot)
    })
  }

  findEventByDedupeKey(taskId: string, dedupeKey: string): TaskEvent | undefined {
    const row = this.db.prepare("SELECT * FROM task_events WHERE task_id = ? AND dedupe_key = ?").get(taskId, dedupeKey) as Row | undefined
    return row ? toEvent(row) : undefined
  }

  addRelation(relation: TaskRelation): void {
    this.db.prepare(`
      INSERT OR IGNORE INTO task_relations (id, from_task_id, to_task_id, type, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(relation.id, relation.fromTaskId, relation.toTaskId, relation.type, relation.createdAt)
  }

  relations(taskId: string): TaskRelation[] {
    return (this.db.prepare(`
      SELECT * FROM task_relations WHERE from_task_id = ? OR to_task_id = ? ORDER BY created_at, rowid
    `).all(taskId, taskId) as Row[]).map(toRelation)
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        objective TEXT NOT NULL,
        status TEXT NOT NULL,
        parent_task_id TEXT REFERENCES tasks(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);

      CREATE TABLE IF NOT EXISTS task_events (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata_json TEXT,
        source_json TEXT,
        dedupe_key TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_events_task_created ON task_events(task_id, created_at);

      CREATE TABLE IF NOT EXISTS task_snapshots (
        task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
        snapshot_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_task ON artifacts(task_id, created_at);

      CREATE TABLE IF NOT EXISTS task_relations (
        id TEXT PRIMARY KEY,
        from_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        to_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(from_task_id, to_task_id, type)
      );
      CREATE INDEX IF NOT EXISTS idx_relations_from ON task_relations(from_task_id);
      CREATE INDEX IF NOT EXISTS idx_relations_to ON task_relations(to_task_id);
    `)
    const columns = this.db.prepare("PRAGMA table_info(task_events)").all() as Row[]
    if (!columns.some((column) => column.name === "dedupe_key")) {
      this.db.exec("ALTER TABLE task_events ADD COLUMN dedupe_key TEXT")
    }
    this.db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_events_task_dedupe ON task_events(task_id, dedupe_key) WHERE dedupe_key IS NOT NULL")
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_receipts (
        task_id TEXT NOT NULL REFERENCES tasks(id),
        key TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        result TEXT NOT NULL,
        PRIMARY KEY (task_id, key)
      )
    `)
  }

  receipt(taskId: string, key: string): { fingerprint: string; result: string } | undefined {
    const row = this.db.prepare("SELECT fingerprint, result FROM sync_receipts WHERE task_id = ? AND key = ?").get(taskId, key)
    return row ? { fingerprint: String(row.fingerprint), result: String(row.result) } : undefined
  }

  saveReceipt(taskId: string, key: string, fingerprint: string, result: string): void {
    this.db.prepare("INSERT INTO sync_receipts (task_id, key, fingerprint, result) VALUES (?, ?, ?, ?)").run(taskId, key, fingerprint, result)
  }

  transaction<T>(operation: () => T): T {
    const depth = this.transactionDepth++
    const savepoint = `task_tx_${depth}`
    try {
      this.db.exec(depth === 0 ? "BEGIN IMMEDIATE" : `SAVEPOINT ${savepoint}`)
      try {
        const result = operation()
        if (result instanceof Promise) throw new Error("Transactions must be synchronous")
        this.db.exec(depth === 0 ? "COMMIT" : `RELEASE ${savepoint}`)
        return result
      } catch (error) {
        this.db.exec(depth === 0 ? "ROLLBACK" : `ROLLBACK TO ${savepoint}`)
        if (depth > 0) this.db.exec(`RELEASE ${savepoint}`)
        throw error
      }
    } finally {
      this.transactionDepth--
    }
  }

  private insertTask(task: Task): void {
    this.db.prepare(`
      INSERT INTO tasks (id, title, objective, status, parent_task_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(task.id, task.title, task.objective, task.status, task.parentTaskId ?? null, task.createdAt, task.updatedAt)
  }

  private updateTaskRow(task: Task): void {
    this.db.prepare(`
      UPDATE tasks SET title = ?, objective = ?, status = ?, parent_task_id = ?, updated_at = ? WHERE id = ?
    `).run(task.title, task.objective, task.status, task.parentTaskId ?? null, task.updatedAt, task.id)
  }

  private insertEvent(event: TaskEvent): void {
    this.db.prepare(`
      INSERT INTO task_events (id, task_id, type, content, metadata_json, source_json, dedupe_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.taskId,
      event.type,
      event.content,
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.source ? JSON.stringify(event.source) : null,
      event.dedupeKey ?? null,
      event.createdAt,
    )
  }

  private upsertSnapshot(taskId: string, snapshot: TaskSnapshot): void {
    this.db.prepare(`
      INSERT INTO task_snapshots (task_id, snapshot_json, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at
    `).run(taskId, JSON.stringify(snapshot), snapshot.updatedAt)
  }
}

function toTask(row: Row): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    objective: String(row.objective),
    status: String(row.status) as TaskStatus,
    parentTaskId: row.parent_task_id == null ? undefined : String(row.parent_task_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function toEvent(row: Row): TaskEvent {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    type: String(row.type) as TaskEvent["type"],
    content: String(row.content),
    metadata: parseJson(row.metadata_json),
    source: parseJson(row.source_json),
    dedupeKey: row.dedupe_key == null ? undefined : String(row.dedupe_key),
    createdAt: String(row.created_at),
  }
}

function toRelation(row: Row): TaskRelation {
  return {
    id: String(row.id),
    fromTaskId: String(row.from_task_id),
    toTaskId: String(row.to_task_id),
    type: String(row.type) as TaskRelationType,
    createdAt: String(row.created_at),
  }
}

function toArtifact(row: Row): ArtifactRef {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    type: String(row.type) as ArtifactRef["type"],
    uri: String(row.uri),
    description: row.description == null ? undefined : String(row.description),
    createdAt: String(row.created_at),
  }
}

function parseJson(value: unknown): any {
  return typeof value === "string" ? JSON.parse(value) : undefined
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&")
}
