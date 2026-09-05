import { DatabaseSync } from "node:sqlite"
import { createHash, randomUUID } from "node:crypto"
import { mkdirSync, chmodSync } from "node:fs"
import { dirname } from "node:path"

export interface LifecycleClient {
  sync(request: { taskId: string; conversation: string; idempotencyKey: string; source: { agent: string; sessionId: string } }): Promise<unknown>
  handoff(request: { taskId: string }): Promise<unknown>
}

/** One outbox per destination. A session is explicitly bound before recording. */
export class SessionOutbox {
  private db: DatabaseSync
  private agent: string
  constructor(path: string, destination: string, agent = "claude-code-hook") {
    this.agent = agent
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    this.db = new DatabaseSync(path)
    if (path !== ":memory:") chmodSync(path, 0o600)
    this.db.exec(`PRAGMA busy_timeout=250;
      CREATE TABLE IF NOT EXISTS destination (id INTEGER PRIMARY KEY, url TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, task TEXT NOT NULL, transcript TEXT NOT NULL, cursor INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, session TEXT NOT NULL, task TEXT NOT NULL, conversation TEXT NOT NULL, kind TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, result TEXT);
      CREATE TABLE IF NOT EXISTS worker (id INTEGER PRIMARY KEY, token TEXT NOT NULL, expires INTEGER NOT NULL);`)
    this.db.exec("CREATE TABLE IF NOT EXISTS paused_sessions (session TEXT PRIMARY KEY)")
    this.db.exec("CREATE TABLE IF NOT EXISTS host_identity (id INTEGER PRIMARY KEY, agent TEXT NOT NULL)")
    this.db.exec("CREATE TABLE IF NOT EXISTS launches (id TEXT PRIMARY KEY, task TEXT NOT NULL, context TEXT NOT NULL, session TEXT)")
    this.db.exec("CREATE TABLE IF NOT EXISTS host_sessions (handle TEXT PRIMARY KEY, session TEXT UNIQUE NOT NULL, transcript TEXT NOT NULL)")
    this.atomic(() => {
      const host = this.db.prepare("SELECT agent FROM host_identity WHERE id=1").get()
      const legacy = this.db.prepare("SELECT id FROM sessions LIMIT 1").get()
      if ((host && host.agent !== agent) || (!host && legacy && agent !== "claude-code-hook")) throw new Error("Use a separate outbox for each host")
      this.db.prepare("INSERT OR IGNORE INTO host_identity VALUES (1, ?)").run(agent)
      const prior = this.db.prepare("SELECT url FROM destination WHERE id=1").get()
      if (prior && prior.url !== destination) throw new Error("Outbox belongs to another destination")
      this.db.prepare("INSERT OR IGNORE INTO destination VALUES (1, ?)").run(destination)
    })
  }
  close() { this.db.close() }
  transcriptHost(): "codex" | "claude" { return this.agent === "codex-cli-hook" ? "codex" : "claude" }
  registerHostSession(session: string, transcript: string) {
    if (!session || !transcript) throw new Error("Invalid host session")
    return this.atomic(() => {
      const prior = this.db.prepare("SELECT * FROM host_sessions WHERE session=?").get(session)
      if (prior && prior.transcript !== transcript) throw new Error("Transcript changed for host session")
      if (prior) return String(prior.handle)
      const handle = randomUUID()
      this.db.prepare("INSERT INTO host_sessions VALUES (?,?,?)").run(handle, session, transcript)
      return handle
    })
  }
  hostSession(handle: string) { return this.db.prepare("SELECT * FROM host_sessions WHERE handle=?").get(handle) as { handle: string; session: string; transcript: string } | undefined }
  prepareLaunch(id: string, task: string, context: string) {
    if (!id || !task || !context) throw new Error("Invalid launch context")
    this.db.prepare("INSERT INTO launches (id,task,context) VALUES (?,?,?)").run(id, task, context)
  }
  launch(id: string) { return this.db.prepare("SELECT * FROM launches WHERE id=?").get(id) as { id: string; task: string; context: string; session: string | null } | undefined }
  startLaunch(id: string, session: string, transcript: string, cursor: number) {
    return this.atomic(() => {
      const launch = this.launch(id)
      if (!launch || (launch.session && launch.session !== session)) throw new Error("Launch does not match this session")
      if (!session || !transcript || !Number.isSafeInteger(cursor) || cursor < 0) throw new Error("Invalid launch binding")
      const prior = this.binding(session)
      if (prior && (prior.task !== launch.task || prior.transcript !== transcript)) throw new Error("Session is already bound; start a new session for another task")
      this.db.prepare("INSERT OR IGNORE INTO sessions VALUES (?, ?, ?, ?)").run(session, launch.task, transcript, cursor)
      this.db.prepare("UPDATE launches SET session=? WHERE id=?").run(session, id)
      return launch.context
    })
  }
  pause(session: string) { this.db.prepare("INSERT OR IGNORE INTO paused_sessions VALUES (?)").run(session) }
  isPaused(session: string) { return Boolean(this.db.prepare("SELECT session FROM paused_sessions WHERE session=?").get(session)) }
  binding(session: string) { return this.db.prepare("SELECT * FROM sessions WHERE id=?").get(session) as { id: string; task: string; transcript: string; cursor: number } | undefined }
  bind(session: string, task: string, transcript: string, cursor: number) {
    if (![session, task, transcript].every((v) => v.trim()) || !Number.isSafeInteger(cursor) || cursor < 0) throw new Error("Invalid session binding")
    this.atomic(() => {
      const prior = this.binding(session)
      if (prior && (prior.task !== task || prior.transcript !== transcript)) throw new Error("Session is already bound; start a new session for another task")
      this.db.prepare("INSERT OR IGNORE INTO sessions VALUES (?, ?, ?, ?)").run(session, task, transcript, cursor)
    })
  }
  capture(session: string, expectedCursor: number, nextCursor: number, conversation: string, ending: boolean) {
    this.atomic(() => {
      const bound = this.binding(session)
      if (!bound) throw new Error("Session is not bound")
      if (this.isPaused(session)) throw new Error("Session recording is paused")
      if (bound.cursor !== expectedCursor) throw new Error("Transcript changed concurrently; retry capture")
      if (nextCursor < expectedCursor) throw new Error("Transcript was truncated; explicit rebind required")
      if (conversation.trim()) this.enqueue(session, bound.task, `${expectedCursor}:${nextCursor}`, "sync", conversation)
      if (ending) this.enqueue(session, bound.task, String(nextCursor), "handoff", "")
      this.db.prepare("UPDATE sessions SET cursor=? WHERE id=?").run(nextCursor, session)
    })
  }
  pending() { return Number(this.db.prepare("SELECT count(*) AS n FROM jobs WHERE done=0").get()!.n) }
  latestHandoff(session: string) { return this.db.prepare("SELECT result FROM jobs WHERE session=? AND kind='handoff' AND done=1 ORDER BY rowid DESC LIMIT 1").get(session)?.result }

  async drain(client: LifecycleClient): Promise<void> {
    const token = randomUUID()
    const acquired = this.atomic(() => {
      const lock = this.db.prepare("SELECT expires FROM worker WHERE id=1").get()
      if (lock && Number(lock.expires) > Date.now()) return false
      this.db.prepare("INSERT OR REPLACE INTO worker VALUES (1, ?, ?)").run(token, Date.now() + 600000)
      return true
    })
    if (!acquired) return
    try {
      while (true) {
        const job = this.db.prepare("SELECT * FROM jobs WHERE done=0 AND session NOT IN (SELECT session FROM paused_sessions) ORDER BY rowid LIMIT 1").get() as { id: string; task: string; session: string; kind: string; conversation: string } | undefined
        if (!job) return
        const result = job.kind === "sync"
          ? await client.sync({ taskId: job.task, conversation: job.conversation, idempotencyKey: job.id, source: { agent: this.agent, sessionId: job.session } })
          : await client.handoff({ taskId: job.task })
        this.atomic(() => {
          if (this.db.prepare("SELECT token FROM worker WHERE id=1").get()?.token !== token) throw new Error("Worker lease expired; retry safely")
          this.db.prepare("UPDATE jobs SET done=1, conversation='', result=? WHERE id=?").run(job.kind === "handoff" ? JSON.stringify(result ?? null) : null, job.id)
          this.db.prepare("UPDATE worker SET expires=? WHERE token=?").run(Date.now() + 600000, token)
        })
      }
    } finally { this.db.prepare("DELETE FROM worker WHERE token=?").run(token) }
  }
  private enqueue(session: string, task: string, position: string, kind: string, conversation: string) {
    const identity = [session, task, position, kind]
    if (this.agent !== "claude-code-hook") identity.unshift(this.agent)
    const id = createHash("sha256").update(JSON.stringify(identity)).digest("hex")
    this.db.prepare("INSERT OR IGNORE INTO jobs (id,session,task,conversation,kind) VALUES (?,?,?,?,?)").run(id, session, task, conversation, kind)
  }
  private atomic<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE")
    try { const result = fn(); this.db.exec("COMMIT"); return result } catch (error) { this.db.exec("ROLLBACK"); throw error }
  }
}

/** Only user/assistant text. Excludes thinking, tool results and non-text attachment blocks.
 * Secrets typed into plain text cannot be detected reliably; binding requires consent. */
export function transcriptDelta(bytes: Buffer, cursor: number, host: "claude" | "codex" = "claude"): { nextCursor: number; conversation: string } {
  if (bytes.length < cursor) throw new Error("Transcript was truncated")
  const end = bytes.lastIndexOf(10) + 1
  if (end < cursor) throw new Error("Invalid transcript cursor")
  const lines = bytes.subarray(cursor, end).toString("utf8").split("\n").filter(Boolean)
  const text: string[] = []
  for (const line of lines) {
    const item = JSON.parse(line)
    if (host === "codex") {
      // Rollout response items are canonical; event_msg contains duplicate display text.
      if (!["session_meta", "turn_context", "event_msg", "response_item", "compacted"].includes(item.type)) throw new Error("Unsupported Codex rollout record")
      if (item.type !== "response_item" || item.payload?.type !== "message") continue
      const message = item.payload
      if (!["user", "assistant"].includes(message.role)) continue
      if (!Array.isArray(message.content)) throw new Error("Unsupported Codex message content")
      const parts: string[] = []
      for (const part of message.content) {
        if (["input_text", "output_text"].includes(part.type)) {
          if (typeof part.text !== "string") throw new Error("Invalid Codex text")
          parts.push(part.text)
        } else if (!["input_image", "output_image", "input_audio", "output_audio"].includes(part.type)) throw new Error("Unsupported Codex content block")
      }
      if (parts.length) text.push(`${message.role}: ${parts.join("\n")}`)
      continue
    }
    if (item.isSidechain || !["user", "assistant"].includes(item.type) || item.message?.role !== item.type) continue
    const content = item.message.content
    const parts = typeof content === "string" ? [content] : Array.isArray(content) ? content.filter((p: any) => p.type === "text" && typeof p.text === "string").map((p: any) => p.text) : []
    if (parts.length) text.push(`${item.type}: ${parts.join("\n")}`)
  }
  const conversation = text.join("\n")
  if (Buffer.byteLength(conversation) > 500000) throw new Error("Pending conversation too large; manual review required")
  return { nextCursor: end, conversation }
}

/** Start at the latest actual user prompt, not earlier unrelated conversation or tool results. */
export function latestUserMessageStart(bytes: Buffer, host: "codex" | "claude") {
  const end = bytes.lastIndexOf(10) + 1
  let offset = 0
  let start = end
  for (const line of bytes.subarray(0, end).toString("utf8").split("\n")) {
    if (!line) { offset++; continue }
    const item = JSON.parse(line)
    const message = host === "codex" ? (item.type === "response_item" && item.payload?.type === "message" ? item.payload : undefined) : (!item.isSidechain && item.type === "user" ? item.message : undefined)
    if (message?.role === "user") {
      const content = message.content
      if (typeof content === "string" || (Array.isArray(content) && content.some((p: any) => ["text", "input_text"].includes(p.type) && typeof p.text === "string"))) start = offset
    }
    offset += Buffer.byteLength(line) + 1
  }
  return start
}
