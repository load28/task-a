import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { randomBytes } from "node:crypto"
import type { HostEvent } from "./store.ts"
import type { ServerBinding, ServerState } from "../../opencode-harness/src/server.ts"

export interface RelayRequest extends ServerBinding {
  id: string
  event: HostEvent
  phase:
    | "held"
    | "queued"
    | "prepared"
    | "sending"
    | "submitted"
    | "completed"
    | "failed"
    | "uncertain"
    | "cancelling"
    | "cancelled"
    | "interrupted"
  targetId?: string
  control?: string
  result?: ServerState
  error?: string
  updated: number
}
export class RelayStore {
  readonly db: DatabaseSync
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    this.db = new DatabaseSync(path)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;
      CREATE TABLE IF NOT EXISTS relay_requests(id TEXT PRIMARY KEY, workspace TEXT NOT NULL, event TEXT NOT NULL, record TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS relay_deliveries(id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS relay_projects(path TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS relay_sessions(workspace TEXT PRIMARY KEY, session TEXT NOT NULL);
    `)
  }
  enqueue(event: HostEvent): RelayRequest {
    const existing = this.get(event.id)
    if (existing) {
      if (JSON.stringify(existing.event) !== JSON.stringify(event))
        throw new Error("Request ID reused with different payload")
      return existing
    }
    const record: RelayRequest = {
      id: event.id,
      event,
      workspace: event.workspace,
      sessionID: "",
      messageID: `msg_${Date.now().toString(16)}${randomBytes(12).toString("hex")}`,
      phase: "queued",
      updated: Date.now(),
    }
    this.db
      .prepare("INSERT INTO relay_requests VALUES(?,?,?,?)")
      .run(event.id, event.workspace, JSON.stringify(event), JSON.stringify(record))
    return record
  }
  get(id: string): RelayRequest | undefined {
    const row = this.db.prepare("SELECT record FROM relay_requests WHERE id=?").get(id)
    return row ? JSON.parse(String(row.record)) : undefined
  }
  save(record: RelayRequest): void {
    record.updated = Date.now()
    this.db.prepare("UPDATE relay_requests SET record=? WHERE id=?").run(JSON.stringify(record), record.id)
  }
  session(workspace: string): string | undefined {
    return this.db.prepare("SELECT session FROM relay_sessions WHERE workspace=?").get(workspace)?.session as
      string | undefined
  }
  bind(workspace: string, session: string): void {
    this.db.prepare("INSERT OR REPLACE INTO relay_sessions VALUES(?,?)").run(workspace, session)
  }
  active(): RelayRequest[] {
    return this.db
      .prepare(
        "SELECT record FROM relay_requests WHERE json_extract(record,'$.phase') IN ('queued','prepared','sending','submitted','uncertain','cancelling') ORDER BY rowid",
      )
      .all()
      .map((r) => JSON.parse(String(r.record)))
  }
  latest(host: string, session: string): RelayRequest | undefined {
    const row = this.db
      .prepare(
        "SELECT record FROM relay_requests WHERE json_extract(event,'$.host')=? AND json_extract(event,'$.sessionId')=? ORDER BY rowid DESC LIMIT 1",
      )
      .get(host, session)
    return row ? JSON.parse(String(row.record)) : undefined
  }
  claimDelivery(key: string): boolean {
    return Number(this.db.prepare("INSERT OR IGNORE INTO relay_deliveries VALUES(?)").run(key).changes) === 1
  }
  register(path: string): void {
    this.db.prepare("INSERT OR IGNORE INTO relay_projects VALUES(?)").run(path)
  }
  projects(): string[] {
    return this.db
      .prepare("SELECT path FROM relay_projects ORDER BY rowid")
      .all()
      .map((r) => String(r.path))
  }
  summary() {
    return {
      requests: this.active().map((r) => ({
        id: r.id,
        workspace: r.workspace,
        sessionID: r.sessionID,
        phase: r.phase,
        state: r.result?.state,
        error: r.error,
      })),
    }
  }
  close(): void {
    this.db.close()
  }
}
