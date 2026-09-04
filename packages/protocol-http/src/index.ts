import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { TaskAgent } from "#task-agent-core"

export interface HttpServerOptions {
  hostname?: string
  port?: number
  token?: string
  maxBodyBytes?: number
}

export class TaskAgentHttpServer {
  private agent: TaskAgent
  private options: Required<Omit<HttpServerOptions, "token">> & { token?: string }
  private server?: Server

  constructor(agent: TaskAgent, options: HttpServerOptions = {}) {
    this.agent = agent
    this.options = {
      hostname: options.hostname ?? "127.0.0.1",
      port: options.port ?? 7331,
      token: options.token,
      maxBodyBytes: options.maxBodyBytes ?? 1_048_576,
    }
    if (!["127.0.0.1", "::1", "localhost"].includes(this.options.hostname) && !this.options.token) {
      throw new Error("TASK_AGENT_TOKEN is required for a non-loopback HTTP listener")
    }
  }

  async listen(): Promise<{ url: string }> {
    if (this.server) throw new Error("HTTP server is already running")
    this.server = createServer((request, response) => void this.handle(request, response))
    await new Promise<void>((resolve, reject) => {
      this.server!.once("error", reject)
      this.server!.listen(this.options.port, this.options.hostname, () => resolve())
    })
    const address = this.server.address()
    const port = typeof address === "object" && address ? address.port : this.options.port
    return { url: `http://${this.options.hostname}:${port}` }
  }

  async close(): Promise<void> {
    if (!this.server) return
    const server = this.server
    this.server = undefined
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      if (request.method === "GET" && request.url === "/health") {
        return json(response, 200, { healthy: true, service: "task-agent" })
      }
      if (!this.authorized(request)) return json(response, 401, { error: "Unauthorized" })
      if (request.method !== "POST") return json(response, 405, { error: "Method not allowed" })
      const body = await readJson(request, this.options.maxBodyBytes)
      const result = await dispatchHttpOperation(this.agent, request.url ?? "", body)
      return json(response, 200, result)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      json(response, statusFor(error, message), { error: message })
    }
  }

  private authorized(request: IncomingMessage): boolean {
    if (!this.options.token) return true
    return request.headers.authorization === `Bearer ${this.options.token}`
  }
}

export async function dispatchHttpOperation(agent: TaskAgent, path: string, body: Record<string, any>): Promise<unknown> {
  switch (path) {
    case "/v1/context":
      return await agent.context(body)
    case "/v1/sync":
      if (typeof body.conversation !== "string") throw new Error("conversation is required")
      return agent.sync(body as Parameters<TaskAgent["sync"]>[0])
    case "/v1/handoff":
      return await agent.handoff(body)
    case "/v1/run":
      if (typeof body.instruction !== "string") throw new Error("instruction is required")
      return agent.run(body as Parameters<TaskAgent["run"]>[0])
    default:
      throw new HttpRouteNotFoundError()
  }
}

class HttpRouteNotFoundError extends Error {
  constructor() { super("Not found") }
}

function statusFor(error: unknown, message: string): number {
  if (error instanceof HttpRouteNotFoundError || message.startsWith("Task not found") || message.startsWith("No task matched")) return 404
  if (error instanceof SyntaxError || /required|must|exceeds|JSON body/.test(message)) return 400
  return 500
}

async function readJson(request: IncomingMessage, maxBytes: number): Promise<Record<string, any>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > maxBytes) throw new Error("Request body exceeds the configured limit")
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON body must be an object")
  return parsed
}

function json(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return
  const encoded = JSON.stringify(body)
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(encoded) })
  response.end(encoded)
}
