import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { OPERATIONS, TaskAgentService } from "#task-agent-core"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../packages/protocol-mcp/src/index.ts"
import { TaskAgentHttpServer, dispatchHttpOperation } from "../packages/protocol-http/src/index.ts"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"

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
    const outcome = await server.handle({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name, arguments: args },
    })
    const result = outcome!.result as any
    assert.ok(!result.isError, `${name}: ${JSON.stringify(result.content)}`)
    return result.structuredContent
  }
  const root = await call("task_create", {
    title: "MCP Root",
    goal: "goal",
    requirements: [{ description: "제약", kind: "constraint" }],
  })
  const decomposed = await call("task_propose_decomposition", {
    taskId: root.id,
    children: [
      { key: "a", title: "A", goal: "a" },
      { key: "b", title: "B", goal: "b", dependencies: ["a"] },
    ],
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
  const failed = await server.handle({
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: { name: "task_start", arguments: { taskId: root.id } },
  })
  assert.equal((failed!.result as any).isError, true)
  const unknown = await server.handle({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: { name: "task_sync", arguments: {} },
  })
  assert.equal((unknown!.error as any).code, -32602)
})

test("HTTP gateway maps /v1 routes onto the same operations", async (t) => {
  const { store, agent } = service()
  t.after(() => store.close())
  const created = (await dispatchHttpOperation(agent, "/v1/task_create", { title: "HTTP Root", goal: "goal" })) as any
  const loaded = (await dispatchHttpOperation(agent, "/v1/task_load", { taskId: created.id })) as any
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
  const searched = await fetch(`${url}/v1/task_search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "HTTP" }),
  })
  assert.equal(searched.status, 200)
  assert.equal(((await searched.json()) as any)[0].id, created.id)
  const invalid = await fetch(`${url}/v1/task_create`, { method: "POST", headers, body: JSON.stringify({ title: "" }) })
  assert.equal(invalid.status, 400)
  const missing = await fetch(`${url}/v1/nope`, { method: "POST", headers, body: "{}" })
  assert.equal(missing.status, 404)
})

test("그래프 MCP는 Role만 노출하고 별도 Orchestration 도구는 제공하지 않는다", async (t) => {
  const { store, agent } = service()
  t.after(() => store.close())

  for (const name of ["role_define", "role_list"]) {
    assert.ok(OPERATIONS.includes(name as (typeof OPERATIONS)[number]), `${name} is missing from OPERATIONS`)
    assert.ok(
      tools.some((tool) => tool.name === name),
      `${name} is missing from the MCP tool list`,
    )
  }
  assert.equal(
    tools.some((tool) => tool.name === "orchestrate_run"),
    false,
  )
  assert.ok(READ_ONLY_TOOLS.includes("role_list"))

  await dispatchHttpOperation(agent, "/v1/role_define", {
    id: "reviewer",
    name: "Reviewer",
    description: "변경을 검토한다",
    allowedTools: ["Read", "Grep"],
  })
  const roles = (await dispatchHttpOperation(agent, "/v1/role_list", {})) as Array<{ id: string }>
  assert.ok(roles.some((role) => role.id === "reviewer"))
  await assert.rejects(
    dispatchHttpOperation(agent, "/v1/orchestrate_run", { title: "x", goal: "y" }),
    /Orchestrator is not configured/,
  )
})

test("graph MCP persists approval-gated plans and keeps plan reads read-only", async (t) => {
  const runtime = createGraphMcp(":memory:")
  t.after(() => runtime.store.close())
  const server = runtime.server
  await server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
  await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
  const call = async (name: string, arguments_: Record<string, unknown>) => {
    const response = await server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: arguments_ } })
    const result = response!.result as any
    assert.ok(!result.isError, result.content?.[0]?.text)
    return result.structuredContent
  }
  const draft = await call("work_plan_create_draft", {
    operationId: "draft-plan", title: "Readable plan", goal: "Build safely", requestText: "build it", summary: "Inspect then build.",
    nodes: [{ nodeId: "inspect", label: "현재 프로젝트 확인", stage: "research", researchTrack: "repository", outcome: "Understand the project", dependsOnNodeIds: [], taskSpec: { goal: "Inspect repository", category: "research", writeScopes: [] } }],
  })
  assert.equal(draft.nodes[0].status, "not started")
  assert.equal(runtime.store.rootTasks().length, 0)
  const planId = (runtime.store.db.prepare("SELECT id FROM work_plans").get() as any).id
  const presented = await call("work_plan_present", { planId })
  assert.equal(presented.nodes[0].label, "현재 프로젝트 확인")
  await call("work_plan_approve", { operationId: "approve-plan", planId, version: 1, approvalSource: "test user" })
  assert.equal(runtime.store.rootTasks().length, 1)
})
