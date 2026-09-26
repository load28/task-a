import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { canonical, digest } from "../contracts/canonical.ts"

export interface StoredState<T> { revision: number; value: T }
export interface StoredEvent { sequence: number; graphId: string; revision: number; schemaVersion: 1; type: string; payload: unknown }
export interface Intent { id: string; graphId: string; type: string; payload: unknown; attempts: number; error?: string }
export interface Transaction {
  emit(type: string, payload: unknown): void
  enqueue(id: string, type: string, payload: unknown): void
  completeIntent(id: string): void
}
export class RevisionConflict extends Error {
  readonly code = "revision_conflict"
  readonly expected: number
  readonly actual: number
  constructor(expected: number, actual: number) { super(`Expected revision ${expected}, current revision ${actual}`); this.expected = expected; this.actual = actual }
}

const encoded = canonical

/** One transaction boundary owns aggregate state, command receipts, events and outbox. */
export class StateStore<T> {
  private readonly db: DatabaseSync
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true })
    this.db = new DatabaseSync(path)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS graphs (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commands (graph_id TEXT, id TEXT, digest TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(graph_id,id));
      CREATE TABLE IF NOT EXISTS events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, graph_id TEXT NOT NULL, revision INTEGER NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS intents (id TEXT PRIMARY KEY, graph_id TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, owner TEXT, lease_until INTEGER NOT NULL DEFAULT 0, error TEXT);
      CREATE TABLE IF NOT EXISTS immutable_records (kind TEXT, id TEXT, payload TEXT NOT NULL, PRIMARY KEY(kind,id));`)
  }
  close() { this.db.close() }
  read(id: string): StoredState<T> | undefined {
    const row = this.db.prepare("SELECT revision,payload FROM graphs WHERE id=?").get(id)
    return row ? { revision: Number(row.revision), value: JSON.parse(String(row.payload)) } : undefined
  }
  list() { return this.db.prepare("SELECT id,revision FROM graphs ORDER BY id").all().map(r => ({ id: String(r.id), revision: Number(r.revision) })) }

  receipt<R = unknown>(args: { graphId: string; operationId: string; expectedRevision: number; payload: unknown }): { revision: number; result: R } | undefined {
    const old = this.db.prepare("SELECT digest,response FROM commands WHERE graph_id=? AND id=?").get(args.graphId, args.operationId)
    if (!old) return undefined
    if (old.digest !== digest({ expectedRevision: args.expectedRevision, payload: args.payload })) throw new Error("operation_conflict: operationId was already used with another payload")
    return JSON.parse(String(old.response))
  }

  command<R>(args: { graphId: string; operationId: string; expectedRevision: number; payload: unknown; initial?: () => T },
    change: (draft: T, tx: Transaction) => R): { revision: number; result: R } {
    if (!args.graphId || !args.operationId || !Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 0) throw new Error("Invalid command envelope")
    const fingerprint = digest({ expectedRevision: args.expectedRevision, payload: args.payload })
    this.db.exec("BEGIN IMMEDIATE")
    try {
      const old = this.db.prepare("SELECT digest,response FROM commands WHERE graph_id=? AND id=?").get(args.graphId, args.operationId)
      if (old) {
        if (old.digest !== fingerprint) throw new Error("operation_conflict: operationId was already used with another payload")
        this.db.exec("COMMIT")
        return JSON.parse(String(old.response))
      }
      const state = this.read(args.graphId)
      const revision = state?.revision ?? 0
      if (revision !== args.expectedRevision) throw new RevisionConflict(args.expectedRevision, revision)
      const draft = state?.value ?? args.initial?.()
      if (draft === undefined) throw new Error(`Unknown graph: ${args.graphId}`)
      const nextRevision = revision + 1
      const tx: Transaction = {
        emit: (type, payload) => { this.db.prepare("INSERT INTO events(graph_id,revision,kind,payload) VALUES(?,?,?,?)").run(args.graphId, nextRevision, type, encoded(payload)) },
        enqueue: (id, type, payload) => {
          const text = encoded(payload)
          const prior = this.db.prepare("SELECT graph_id,kind,payload FROM intents WHERE id=?").get(id)
          if (prior) {
            if (prior.graph_id !== args.graphId || prior.kind !== type || prior.payload !== text) throw new Error("Intent identity conflict")
            return
          }
          this.db.prepare("INSERT INTO intents(id,graph_id,kind,payload) VALUES(?,?,?,?)").run(id, args.graphId, type, text)
        },
        completeIntent: id => {
          const result = this.db.prepare("UPDATE intents SET completed=1,owner=NULL,lease_until=0,error=NULL WHERE id=? AND graph_id=?").run(id, args.graphId)
          if (!result.changes) throw new Error(`Unknown intent: ${id}`)
        },
      }
      const result = change(draft, tx)
      if (result && typeof (result as any).then === "function") throw new Error("State transactions must not perform asynchronous work")
      this.db.prepare("INSERT INTO graphs VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload")
        .run(args.graphId, nextRevision, encoded(draft))
      const response = { revision: nextRevision, result: result ?? null }
      this.db.prepare("INSERT INTO commands VALUES(?,?,?,?)").run(args.graphId, args.operationId, fingerprint, encoded(response))
      this.db.exec("COMMIT")
      return response as { revision: number; result: R }
    } catch (error) { this.db.exec("ROLLBACK"); throw error }
  }

  events(graphId: string, after = 0): StoredEvent[] {
    return this.db.prepare("SELECT * FROM events WHERE graph_id=? AND sequence>? ORDER BY sequence LIMIT 1000").all(graphId, after)
      .map(row => ({ sequence: Number(row.sequence), graphId: String(row.graph_id), revision: Number(row.revision), schemaVersion: 1,
        type: String(row.kind), payload: JSON.parse(String(row.payload)) }))
  }
  pending(graphId?: string): Intent[] {
    const rows = graphId ? this.db.prepare("SELECT * FROM intents WHERE completed=0 AND graph_id=? ORDER BY rowid").all(graphId)
      : this.db.prepare("SELECT * FROM intents WHERE completed=0 ORDER BY rowid").all()
    return rows.map(row => ({ id: String(row.id), graphId: String(row.graph_id), type: String(row.kind), payload: JSON.parse(String(row.payload)),
      attempts: Number(row.attempts), ...(row.error ? { error: String(row.error) } : {}) }))
  }
  claim(id: string, owner: string, leaseMs = 30_000, now = Date.now()) {
    return this.db.prepare("UPDATE intents SET owner=?,lease_until=?,attempts=attempts+1 WHERE id=? AND completed=0 AND (lease_until<=? OR owner=?)")
      .run(owner, now + leaseMs, id, now, owner).changes === 1
  }
  release(id: string, owner: string, error?: string) {
    this.db.prepare("UPDATE intents SET owner=NULL,lease_until=0,error=? WHERE id=? AND owner=? AND completed=0").run(error?.slice(0, 2000) ?? null, id, owner)
  }
  /** Immutable observations/specifications can be retained outside a graph's active projection. */
  putRecord(kind: string, id: string, value: unknown) {
    const payload = encoded(value)
    this.db.exec("BEGIN IMMEDIATE")
    try {
      const prior = this.db.prepare("SELECT payload FROM immutable_records WHERE kind=? AND id=?").get(kind, id)
      if (prior && prior.payload !== payload) throw new Error("Immutable record conflict")
      if (!prior) this.db.prepare("INSERT INTO immutable_records VALUES(?,?,?)").run(kind, id, payload)
      this.db.exec("COMMIT")
    } catch (error) { this.db.exec("ROLLBACK"); throw error }
  }
  record<U>(kind: string, id: string): U | undefined {
    const row = this.db.prepare("SELECT payload FROM immutable_records WHERE kind=? AND id=?").get(kind, id)
    return row ? JSON.parse(String(row.payload)) : undefined
  }
}
