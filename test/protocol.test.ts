import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskAgentService } from "#task-agent-core"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../packages/protocol-mcp/src/index.ts"
import { TaskAgentHttpServer, dispatchHttpOperation } from "../packages/protocol-http/src/index.ts"

function service() {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  return { store, agent: new TaskAgentService(engine, new IntegrationEngine(engine)) }
}

test("MCP gateway serves the task graph operations end to end", async (t) => {
  const { store, agent } = service()
  t.after(() => store.close())
  const server = new TaskAgentMcpServer(agent)
  assert.ok(READ_ONLY_TOOLS.every((name) => tools.some((tool) => tool.name === name)))
  const uninitialized = await server.handle({ jsonrpc: "2.0", id: 1, method: "tools/list" })
  assert.equal((uninitialized!.error as any).code, -32002)
  const initialized = await server.handle({ jsonrpc: "2.0", id: 2, method: "initialize" })
  assert.equal((initialized!.result as any).protocolVersion, "2025-06-18")
  await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
  const list = await server.handle({ jsonrpc: "2.0", id: 3, method: "tools/list" })
  assert.equal((list!.result as any).tools.length, tools.length)

  const call = async (name: string, args: Record<string, unknown>) => {
    const outcome = await server.handle({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name, arguments: args } })
    const result = outcome!.result as any
    assert.ok(!result.isError, `${name}: ${JSON.stringify(result.content)}`)
    return result.structuredContent
  }
  const root = await call("task_create", { title: "MCP Root", goal: "goal", requirements: [{ description: "제약", kind: "constraint" }] })
  const decomposed = await call("task_propose_decomposition", {
    taskId: root.id,
    children: [{ key: "a", title: "A", goal: "a" }, { key: "b", title: "B", goal: "b", dependencies: ["a"] }],
  })
  const runnable = await call("task_get_runnable", { rootId: root.id })
  assert.equal(runnable.items.length, 1)
  const first = runnable.items[0].task
  await call("task_start", { taskId: first.id, agent: "test" })
  await call("task_complete", {
    taskId: first.id,
    summary: "done",
    artifacts: [{ name: "mcp-artifact", type: "code", contentRef: "git://a" }],
    verification: { passed: true },
  })
  const context = await call("task_get_context", { taskId: decomposed.children[1].id })
  assert.ok(context.text.includes("mcp-artifact@1"))
  assert.ok(context.context.inheritedConstraints.includes("제약"))
  const search = await call("task_search", { query: "MCP Root" })
  assert.equal(search.items[0].id, root.id)
  const failed = await server.handle({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "task_start", arguments: { taskId: root.id } } })
  assert.equal((failed!.result as any).isError, true)
  const unknown = await server.handle({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "task_sync", arguments: {} } })
  assert.equal((unknown!.error as any).code, -32602)
})

test("HTTP gateway maps /v1 routes onto the same operations", async (t) => {
  const { store, agent } = service()
  t.after(() => store.close())
  const created = await dispatchHttpOperation(agent, "/v1/task_create", { title: "HTTP Root", goal: "goal" }) as any
  const loaded = await dispatchHttpOperation(agent, "/v1/task_load", { taskId: created.id }) as any
  assert.equal(loaded.task.id, created.id)
  await assert.rejects(dispatchHttpOperation(agent, "/v1/task_sync", {}), /Not found/)
  await assert.rejects(dispatchHttpOperation(agent, "/v1/task_load", { taskId: "missing" }), /Task not found/)

  const server = new TaskAgentHttpServer(agent, { port: 0, token: "secret" })
  const { url } = await server.listen()
  t.after(() => server.close())
  const health = await fetch(`${url}/health`)
  assert.equal(health.status, 200)
  const denied = await fetch(`${url}/v1/task_search`, { method: "POST", body: "{}" })
  assert.equal(denied.status, 401)
  const headers = { Authorization: "Bearer secret", "Content-Type": "application/json" }
  const searched = await fetch(`${url}/v1/task_search`, { method: "POST", headers, body: JSON.stringify({ query: "HTTP" }) })
  assert.equal(searched.status, 200)
  assert.equal(((await searched.json()) as any)[0].id, created.id)
  const invalid = await fetch(`${url}/v1/task_create`, { method: "POST", headers, body: JSON.stringify({ title: "" }) })
  assert.equal(invalid.status, 400)
  const missing = await fetch(`${url}/v1/nope`, { method: "POST", headers, body: "{}" })
  assert.equal(missing.status, 404)
})
