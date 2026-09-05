import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { AGENT_INSTRUCTIONS, READ_ONLY_TOOLS, TaskAgentMcpServer, tools } from "./index.ts"
import { OwnerAuthenticator, AccessError, type Principal } from "../../task-auth/src/index.ts"
import type { TaskAgent } from "#task-agent-core"

export function createRemoteServer(agent: TaskAgent, auth: OwnerAuthenticator) {
  let active = 0
  let windowStart = Date.now()
  let requests = 0
  const origin = new URL(auth.config.resource).origin
  return createServer({ requestTimeout: 150000, headersTimeout: 10000 }, (req, res) => {
    void handle(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, { error: "Internal server error" })
      else res.end()
    })
  })

  async function handle(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("X-Content-Type-Options", "nosniff")
    if (req.headers.origin && req.headers.origin !== origin) return send(res, 403, { error: "Origin denied" })
    if (req.method === "GET" && req.url === "/health") return send(res, 200, { healthy: true })
    if (req.method === "GET" && ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"].includes(req.url ?? "")) return send(res, 200, auth.metadata())
    if (req.url !== "/mcp") return send(res, 404, { error: "Not found" })
    if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0 }
    if (++requests > 120 || active >= 4) { res.setHeader("Retry-After", "60"); return send(res, 429, { error: "Rate limit exceeded" }) }
    let principal: Principal
    try { principal = await auth.authenticate(req.headers.authorization) }
    catch (error) {
      if (!(error instanceof AccessError)) throw error
      res.setHeader("WWW-Authenticate", auth.challenge())
      return send(res, error.status, { error: error.message })
    }
    if (!principal.scopes.has(auth.config.readScope)) {
      res.setHeader("WWW-Authenticate", auth.challenge())
      return send(res, 403, { error: "Read scope required" })
    }
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "Method not allowed" }) }
    // Authentication awaits JWKS retrieval; recheck after the await to bound concurrency.
    if (active >= 4) { res.setHeader("Retry-After", "5"); return send(res, 429, { error: "Too many active requests" }) }
    active++
    let sdk: Server | undefined
    try {
      let size = 0
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        size += chunk.length
        if (size > 1048576) return send(res, 413, { error: "Request too large" })
        chunks.push(Buffer.from(chunk))
      }
      let body: unknown
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")) }
      catch { return send(res, 400, { error: "Invalid JSON" }) }
      const delegate = new TaskAgentMcpServer(agent)
      await delegate.handle({ jsonrpc: "2.0", id: 0, method: "initialize" })
      await delegate.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
      sdk = new Server({ name: "task-agent", version: "1.0.0" }, { capabilities: { tools: {} }, instructions: AGENT_INSTRUCTIONS })
      sdk.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: tools.map((tool) => {
        const readOnly = READ_ONLY_TOOLS.includes(tool.name)
        const securitySchemes = [{ type: "oauth2", scopes: readOnly ? [auth.config.readScope] : [auth.config.readScope, auth.config.writeScope] }]
        return { ...tool, inputSchema: { ...tool.inputSchema, type: "object" as const }, securitySchemes, _meta: { securitySchemes }, annotations: { readOnlyHint: readOnly, destructiveHint: !readOnly, openWorldHint: false } }
      }) }))
      sdk.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
        if (!READ_ONLY_TOOLS.includes(params.name) && !principal.scopes.has(auth.config.writeScope)) return {
          isError: true, content: [{ type: "text" as const, text: "Write authorization required" }], _meta: { "mcp/www_authenticate": [auth.challenge(auth.config.writeScope)] },
        }
        const result = await delegate.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params })
        if (result?.error) return { isError: true, content: [{ type: "text" as const, text: "Invalid tool request" }] }
        return result!.result as { content: { type: "text"; text: string }[] }
      })
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      await sdk.connect(transport)
      await transport.handleRequest(req, res, body)
    } finally { active--; await sdk?.close() }
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}
