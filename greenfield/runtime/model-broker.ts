import { readFileSync, writeSync, readdirSync, lstatSync, openSync, closeSync, fstatSync, constants, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { atomicJson, RuntimeError } from "./files.ts"

export const CHATGPT_HOST = "chatgpt.com"
export const CHATGPT_SECRET = "codex-chatgpt"
const LIMIT = 16 * 1024 * 1024
export interface ChatGPTBrokerOptions { authFile: string }

/** Fixed-destination inference gateway. Worker requests never choose credentials, hosts or headers. */
export class ChatGPTModelBroker {
  private active = new Map<string, AbortController>()
  private closed = false
  private options: ChatGPTBrokerOptions
  private transport: typeof fetch
  constructor(options: ChatGPTBrokerOptions, transport: typeof fetch = fetch) { this.options = options; this.transport = transport }
  private credentials() {
    const value = JSON.parse(readFileSync(this.options.authFile, "utf8"))
    const tokens = value.auth_mode === "chatgpt" ? value.tokens : undefined
    if (!tokens?.access_token || !tokens.account_id) throw new RuntimeError("unauthorized", "ChatGPT login is unavailable; sign in with Codex on the host")
    return { authorization: `Bearer ${tokens.access_token}`, "chatgpt-account-id": String(tokens.account_id) }
  }
  preflight() { this.credentials() }
  pump(directory: string) {
    if (this.closed || !existsSync(join(directory, "requests"))) return
    for (const id of readdirSync(join(directory, "requests"))) {
      if (!/^[a-f0-9-]{36}\.json$/.test(id)) continue
      const key = join(directory, id), response = join(directory, "responses", id)
      if (this.active.has(key) || existsSync(response)) continue
      if (this.active.size >= 4) break
      const abort = new AbortController(); this.active.set(key, abort)
      void this.respond(directory, id, abort).finally(() => this.active.delete(key))
    }
  }
  private async respond(directory: string, id: string, abort: AbortController) {
    const response = join(directory, "responses", id), claim = join(directory, "claims", id)
    const timeout = setTimeout(() => abort.abort(), 180000)
    try {
      mkdirSync(join(directory, "claims"), { recursive: true, mode: 0o700 })
      if (existsSync(claim)) {
        const owner = JSON.parse(readFileSync(claim, "utf8"))
        try { process.kill(owner.pid, 0); if (Date.now() - owner.startedAt < 200000) return } catch {}
        throw new Error("An interrupted model request is not automatically replayed")
      }
      const path = join(directory, "requests", id)
      if (!lstatSync(path).isFile()) throw new Error("Invalid model request file")
      const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
      let request
      try { if (!fstatSync(fd).isFile() || fstatSync(fd).size > LIMIT) throw new Error("Model request exceeds limit"); request = JSON.parse(readFileSync(fd, "utf8")) } finally { closeSync(fd) }
      if (request.method !== "POST" || !["/responses", "/responses/compact"].includes(request.path) || typeof request.body !== "string" || Buffer.byteLength(request.body) > LIMIT) throw new Error("Unsupported model request")
      const body = JSON.parse(request.body)
      if (!body || typeof body !== "object" || typeof body.model !== "string") throw new Error("A model is required")
      if (request.path === "/responses") body.store = false
      if (body.tools?.some((tool: { type: string }) => !["function", "custom", "local_shell"].includes(tool.type))) throw new Error("Remote tools are not permitted by the inference policy")
      const credentials = this.credentials()
      // Exclusive claim survives controller replacement. Unknown billed calls are not replayed by the broker.
      let claimFd
      try { claimFd = openSync(claim, "wx", 0o600) } catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") return; throw error }
      try { writeSync(claimFd, JSON.stringify({ pid: process.pid, startedAt: Date.now() })) } finally { closeSync(claimFd) }
      const upstream = await this.transport(`https://${CHATGPT_HOST}/backend-api/codex${request.path}`, {
        method: "POST", redirect: "error", signal: abort.signal,
        headers: { ...credentials, "content-type": "application/json", accept: "text/event-stream", "OpenAI-Beta": "responses=experimental", originator: "codex_cli_rs" }, body: JSON.stringify(body),
      })
      let size = 0; const chunks: Uint8Array[] = []
      if (upstream.body) for await (const chunk of upstream.body) { size += chunk.length; if (size > 32 * 1024 * 1024) throw new Error("Model response exceeds limit"); chunks.push(chunk) }
      // Never return authentication error payloads or arbitrary upstream headers to the workspace.
      const text = upstream.ok ? Buffer.concat(chunks).toString("utf8") : JSON.stringify({ error: { message: `Model service returned HTTP ${upstream.status}; check host Codex login and model access` } })
      atomicJson(response, { status: upstream.status, contentType: upstream.headers.get("content-type") ?? "application/json", body: text })
    } catch {
      atomicJson(response, { status: 502, contentType: "application/json", body: JSON.stringify({ error: { message: "Model gateway unavailable or request rejected; check host login and runtime policy" } }) })
    } finally { clearTimeout(timeout) }
  }
  stop(directory: string) { for (const [key, controller] of this.active) if (key.startsWith(directory + "/")) controller.abort() }
  close() { this.closed = true; for (const controller of this.active.values()) controller.abort() }
}
