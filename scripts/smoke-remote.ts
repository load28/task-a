import assert from "node:assert/strict"
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from "jose"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { createRemoteServer } from "../packages/protocol-mcp/src/remote.ts"
import { OwnerAuthenticator } from "../packages/task-auth/src/index.ts"
import { TaskAgentService } from "#task-agent-core"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"

// Local sockets and synthetic data only. No cloud or model requests.
const { privateKey, publicKey } = await generateKeyPair("RS256")
const config = { resource: "https://tasks.example.com/mcp", issuer: "https://issuer.example.com", jwksUri: "https://issuer.example.com/jwks", ownerSubject: "owner", clientIds: ["test-client"], readScope: "tasks/read", writeScope: "tasks/write" }
const auth = new OwnerAuthenticator(config, createLocalJWKSet({ keys: [await exportJWK(publicKey)] }))
async function token(sub: string, scope: string) {
  return new SignJWT({ sub, client_id: "test-client", token_use: "access", scope }).setProtectedHeader({ alg: "RS256" }).setIssuer(config.issuer).setAudience(config.resource).setIssuedAt().setExpirationTime("5m").sign(privateKey)
}
const store = new SqliteTaskRepository()
const engine = new TaskEngine(store)
const taskId = engine.createTask({ title: "비공개 테스트", objective: "타인 접근 차단" }).task.id
const server = createRemoteServer(new TaskAgentService(engine, {
  async selectTask() { return taskId }, async extractEvents() { return [{ type: "decision", content: "테스트 결정" }] }, async run() { return "ok" },
}), auth)
await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
const address = server.address()
const base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`
const clients: Client[] = []
try {
  assert.equal((await fetch(base + "/mcp", { method: "POST" })).status, 401)
  assert.equal((await fetch(base + "/mcp", { method: "POST", headers: { Authorization: `Bearer ${await token("stranger", "tasks/read tasks/write")}` } })).status, 403)
  assert.equal((await fetch(base + "/v1/context")).status, 404)
  assert.equal((await fetch(base + "/mcp", { headers: { Origin: "https://evil.example.com" } })).status, 403)
  const metadata = await (await fetch(base + "/.well-known/oauth-protected-resource/mcp")).json()
  assert.equal(metadata.resource, config.resource)
  for (const scope of ["tasks/read", "tasks/read tasks/write"]) {
    const client = new Client({ name: "smoke-host", version: "1" })
    clients.push(client)
    await client.connect(new StreamableHTTPClientTransport(new URL(base + "/mcp"), { requestInit: { headers: { Authorization: `Bearer ${await token("owner", scope)}` } } }))
    assert.match(client.getInstructions()!, /user need not say/)
    assert.equal((await client.listTools()).tools.length, 4)
    const context = await client.callTool({ name: "task_context", arguments: { taskId } })
    assert.ok(!context.isError)
    const write = await client.callTool({ name: "task_sync", arguments: { taskId, conversation: "확정", idempotencyKey: "smoke" } })
    assert.equal(Boolean(write.isError), !scope.includes("tasks/write"))
  }
  assert.equal(engine.getTask(taskId).events.length, 2)
  console.log("PASS: SDK client initialization, tool discovery, owner access, write scopes, OAuth discovery, origin rejection, and no legacy bypass")
} finally {
  await Promise.all(clients.map((client) => client.close()))
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  store.close()
}
