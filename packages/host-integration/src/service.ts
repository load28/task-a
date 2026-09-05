import { createServer, request, type Server } from "node:http"
import { chmodSync, existsSync, unlinkSync } from "node:fs"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { OpenCodeServer, type HarnessServer } from "../../opencode-harness/src/server.ts"
import { RelayStore, type RelayRequest } from "./relay-store.ts"
import type { HostEvent } from "./store.ts"
import { workspaceFor, type HostConfig } from "./config.ts"

export function workspaceDatabase(config: HostConfig, workspace: string): string {
  if (config.workspaces[0]?.path === workspace) return config.database
  return resolve(config.directory, "graphs", `${createHash("sha256").update(workspace).digest("hex").slice(0, 24)}.db`)
}
/** Durable request delivery and session/event transport. No graph or execution decisions. */
export class HostService {
  store: RelayStore
  harness: HarnessServer
  server?: Server
  private ownsSocket = false
  private controls = new Map<string, Promise<Record<string, unknown>>>()
  private closed = false
  private draining?: Promise<void>
  private timer?: NodeJS.Timeout
  config: HostConfig
  constructor(config: HostConfig, harness?: HarnessServer) {
    this.config = structuredClone(config)
    this.store = new RelayStore(resolve(config.directory, "relay.db"))
    this.harness = harness ?? new OpenCodeServer(config)
  }
  async start(): Promise<void> {
    if (existsSync(this.config.socket)) {
      try {
        await callService(this.config.socket, "/health")
        throw new Error("Service already running")
      } catch (e) {
        if (e instanceof Error && e.message === "Service already running") throw e
        unlinkSync(this.config.socket)
      }
    }
    this.server = createServer(async (req, res) => {
      res.setHeader("content-type", "application/json")
      try {
        if (req.method === "GET" && req.url === "/health") {
          res.end(
            JSON.stringify({
              ok: true,
              pid: process.pid,
              architecture: "opencode-server",
              projects: this.store.projects(),
              ...this.store.summary(),
            }),
          )
          return
        }
        if (req.method === "GET" && req.url === "/doctor") {
          for (const path of new Set([...this.config.workspaces.map((w) => w.path), ...this.store.projects()]))
            await this.harness.prepare(path, workspaceDatabase(this.config, path))
          res.end(JSON.stringify(await this.harness.readiness()))
          return
        }
        if (req.method !== "POST") throw new Error("Unsupported request")
        let body = ""
        for await (const chunk of req) {
          body += chunk
          if (Buffer.byteLength(body) > 5 * 1024 * 1024) throw new Error("Request too large")
        }
        const input = body ? JSON.parse(body) : {}
        if (req.url === "/shutdown") {
          res.end("{}")
          void this.close()
          return
        }
        if (req.url === "/wake") {
          void this.wake()
          res.end("{}")
          return
        }
        if (req.url === "/workspace") {
          const workspace = workspaceFor(this.config, input.cwd)
          if (!workspace) throw new Error("No project detected")
          this.store.register(workspace.path)
          res.end(JSON.stringify({ workspace: workspace.path, ...this.store.summary() }))
          return
        }
        if (req.url === "/event") {
          const event = input as HostEvent
          if (workspaceFor(this.config, event.workspace)?.path !== event.workspace)
            throw new Error("Workspace is not enabled")
          this.store.register(event.workspace)
          if (
            !event.id ||
            !event.sessionId ||
            !["claude", "codex"].includes(event.host) ||
            typeof event.text !== "string"
          )
            throw new Error("Invalid host event")
          // Lifecycle events and host assistant output never become another model request.
          if (event.kind !== "UserPromptSubmit") {
            res.end("{}")
            return
          }
          const existing = this.store.get(event.id)
          const active = this.store.active().find((r) => r.workspace === event.workspace)
          const record = this.store.enqueue(event)
          if (!existing && event.interactive && active) {
            record.phase = "held"
            record.targetId = active.id
            this.store.save(record)
          }
          void this.wake()
          res.end(JSON.stringify(this.response(record)))
          return
        }
        if (req.url === "/foreground") {
          let latest = this.store.latest(input.host, input.sessionId)
          if (!latest || ["status", "cancel", "queue"].includes(latest.control ?? "")) {
            res.end("{}")
            return
          }
          if (latest.control === "reply" && latest.targetId) latest = this.store.get(latest.targetId)!
          const id = latest.id
          const deadline = Date.now() + 20000
          while (
            ["queued", "prepared", "sending", "submitted", "cancelling"].includes(latest.phase) &&
            latest.result?.state !== "waiting" &&
            !latest.error &&
            !this.closed &&
            Date.now() < deadline
          ) {
            void this.wake()
            await new Promise((ok) => setTimeout(ok, 200))
            latest = this.store.get(id)!
          }
          const waiting = latest.result?.state === "waiting"
          const finished = ["completed", "failed", "interrupted", "cancelled", "uncertain"].includes(latest.phase)
          if (waiting || finished) {
            const key = waiting
              ? `${id}:waiting:${JSON.stringify([latest.result?.questions, latest.result?.permissions])}`
              : id
            res.end(JSON.stringify(this.store.claimDelivery(key) ? { present: this.response(latest) } : {}))
            return
          }
          res.end(JSON.stringify({ pending: this.response(latest) }))
          return
        }
        const record = this.store.get(input.requestId)
        if (!record) throw new Error("Unknown requestId")
        if (req.url === "/control") {
          res.end(JSON.stringify(await this.control(record, input)))
          return
        }
        if (req.url === "/status") {
          const deadline = Date.now() + Math.max(0, Math.min(Number(input.waitMs) || 0, 25000))
          do {
            void this.wake()
            const latest = this.store.get(record.id)!
            const blocker = this.blocker(latest)
            if (
              !["queued", "prepared", "sending", "submitted"].includes(latest.phase) ||
              latest.result?.state === "waiting" ||
              blocker?.result?.state === "waiting" ||
              blocker?.phase === "uncertain"
            )
              break
            if (Date.now() >= deadline || this.closed) break
            await new Promise((r) => setTimeout(r, 200))
          } while (true)
          const latest = this.store.get(record.id)!
          if (["completed", "failed", "interrupted", "cancelled", "uncertain"].includes(latest.phase))
            this.store.claimDelivery(latest.id)
          res.end(JSON.stringify(this.response(latest)))
          return
        }
        if (req.url === "/reply") {
          if (record.phase !== "submitted") throw new Error("Request is not awaiting a server reply")
          await this.harness.reply(record, input)
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) {
            res.end(JSON.stringify(this.response(this.store.get(record.id)!)))
            return
          }
          record.result = undefined
          this.store.save(record)
          void this.wake()
          res.end(JSON.stringify(this.response(record)))
          return
        }
        if (req.url === "/cancel") {
          if (["completed", "failed", "interrupted", "cancelled"].includes(record.phase)) {
            res.end(JSON.stringify(this.response(record)))
            return
          }
          record.phase = ["sending", "submitted", "uncertain", "cancelling"].includes(record.phase)
            ? "cancelling"
            : "cancelled"
          record.error = undefined
          record.result = undefined
          this.store.save(record)
          // The durable cancelling state blocks later prompts until the server acknowledges abort.
          await this.draining
          await this.wake()
          res.end(JSON.stringify(this.response(this.store.get(record.id)!)))
          return
        }
        throw new Error("Unknown service operation")
      } catch (e) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
      }
    })
    await new Promise<void>((ok, fail) => {
      this.server!.once("error", fail)
      this.server!.listen(this.config.socket, ok)
    })
    this.ownsSocket = true
    chmodSync(this.config.socket, 0o600)
    this.timer = setInterval(() => {
      void this.wake()
    }, 1000)
    void this.wake()
  }
  response(r: RelayRequest): Record<string, unknown> {
    const blocker = this.blocker(r)
    return {
      requestId: r.id,
      sessionID: r.sessionID,
      phase: r.phase,
      ...r.result,
      error: r.error,
      ...(r.targetId ? { activeRequest: this.response(this.store.get(r.targetId)!) } : {}),
      ...(blocker
        ? { blockedBy: { requestId: blocker.id, phase: blocker.phase, ...blocker.result, error: blocker.error } }
        : {}),
    }
  }
  private control(record: RelayRequest, input: any): Promise<Record<string, unknown>> {
    if (record.control && record.control !== input.action)
      return Promise.reject(new Error("Control already selected for this message"))
    const existing = this.controls.get(record.id)
    if (existing) return existing
    const work = this.performControl(record, input).finally(() => this.controls.delete(record.id))
    this.controls.set(record.id, work)
    return work
  }
  private async performControl(record: RelayRequest, input: any) {
    const action = input.action
    if (!["status", "cancel", "steer", "queue", "reply"].includes(action))
      throw new Error("Invalid conversation control")
    if (record.control && record.control !== action) throw new Error("Control already selected for this message")
    if (record.phase !== "held") return this.response(record)
    const target = record.targetId ? this.store.get(record.targetId) : undefined
    if (!target || target.workspace !== record.workspace) throw new Error("Missing active request")
    record.control = action
    this.store.save(record)
    if (action === "cancel" || action === "steer") {
      for (const pending of this.store.active().filter((r) => r.workspace === record.workspace)) {
        if (action === "steer" && pending.id !== target.id) continue
        pending.phase = ["sending", "submitted", "uncertain", "cancelling"].includes(pending.phase)
          ? "cancelling"
          : "cancelled"
        pending.result = undefined
        this.store.save(pending)
      }
      await this.draining
      await this.wake()
      if (
        this.store
          .active()
          .some((r) => r.workspace === record.workspace && ["cancelling", "uncertain"].includes(r.phase))
      )
        throw new Error("서버의 중단 확인을 기다리고 있습니다. 같은 제어 요청을 다시 확인하세요.")
    }
    if (action === "reply") {
      await this.harness.reply(target, input)
      const latest = this.store.get(target.id)!
      latest.result = undefined
      this.store.save(latest)
    }
    record.phase = ["steer", "queue"].includes(action) ? "queued" : "completed"
    this.store.save(record)
    void this.wake()
    return this.response(record)
  }
  private blocker(r: RelayRequest): RelayRequest | undefined {
    if (r.phase !== "queued") return
    const first = this.store.active().find((active) => active.workspace === r.workspace)
    return first && first.id !== r.id ? first : undefined
  }
  wake(): Promise<void> {
    if (!this.draining)
      this.draining = this.drain().finally(() => {
        this.draining = undefined
      })
    return this.draining
  }
  private async drain(): Promise<void> {
    const workspaces = new Set<string>()
    for (const record of this.store.active()) {
      if (this.closed) return
      if (workspaces.has(record.workspace)) continue
      workspaces.add(record.workspace)
      // Ambiguous delivery blocks subsequent prompts until the user cancels this request.
      if (record.phase === "uncertain") continue
      try {
        await this.harness.prepare(record.workspace, workspaceDatabase(this.config, record.workspace))
        if (record.phase === "cancelling") {
          await this.harness.cancel(record)
          record.phase = "cancelled"
          record.result = undefined
          record.error = undefined
          this.store.save(record)
          continue
        }
        if (record.phase === "queued") {
          record.sessionID =
            this.store.session(record.workspace) ??
            (await this.harness.createSession(
              record.workspace,
              createHash("sha256")
                .update(record.workspace + this.config.directory)
                .digest("hex")
                .slice(0, 24),
            ))
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) continue
          this.store.bind(record.workspace, record.sessionID)
          record.phase = "prepared"
          this.store.save(record)
        }
        if (record.phase === "sending") {
          const received = await this.harness.hasMessage(record)
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) continue
          if (received) {
            record.phase = "submitted"
            this.store.save(record)
          } else {
            record.phase = "uncertain"
            record.error = "서버의 요청 수신 여부를 확인할 수 없습니다. 상태를 확인하고 취소한 뒤 다시 요청하세요."
            this.store.save(record)
            continue
          }
        }
        if (record.phase === "prepared") {
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) continue
          record.phase = "sending"
          this.store.save(record)
          await this.harness.submit(
            record,
            record.event.prompt ?? record.event.text,
            record.event.permissionMode === "plan",
            this.config.workspaces.find((w) => w.path === record.workspace)?.verifyCommand,
          )
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) continue
          record.phase = "submitted"
          this.store.save(record)
          continue
        }
        if (record.phase === "submitted") {
          const state = await this.harness.inspect(record)
          if (["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")) continue
          if (state.state === "interrupted" && Date.now() - record.updated < 5000) continue
          record.result = state
          if (["completed", "failed", "interrupted"].includes(state.state))
            record.phase = state.state as RelayRequest["phase"]
          record.error = undefined
          this.store.save(record)
        }
      } catch (e) {
        if (
          record.phase !== "cancelling" &&
          ["cancelling", "cancelled"].includes(this.store.get(record.id)?.phase ?? "")
        )
          continue
        if (record.phase === "cancelling") record.phase = "uncertain"
        record.error = e instanceof Error ? e.message : String(e)
        // Preparation has no task effects. Submission errors remain ambiguous until reconciled.
        if (["queued", "prepared"].includes(record.phase)) record.phase = "failed"
        this.store.save(record)
      }
    }
  }
  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    clearInterval(this.timer)
    await this.draining
    await this.harness.close()
    await new Promise<void>((ok) => (this.server ? this.server.close(() => ok()) : ok()))
    if (this.ownsSocket && existsSync(this.config.socket)) unlinkSync(this.config.socket)
    this.store.close()
  }
}
export function callService(socket: string, path: string, body?: unknown, timeout = 50000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = request(
      { socketPath: socket, agent: false, path, method: body === undefined ? "GET" : "POST", timeout },
      (res) => {
        let output = ""
        res.setEncoding("utf8")
        res.on("data", (c) => {
          output += c
        })
        res.on("end", () => {
          try {
            const data = JSON.parse(output)
            if (res.statusCode !== 200) reject(new Error(data.error ?? "Service request failed"))
            else resolve(data)
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.once("error", reject)
    req.once("timeout", () => req.destroy(new Error("Service request timed out")))
    req.end(body === undefined ? undefined : JSON.stringify(body))
  })
}
