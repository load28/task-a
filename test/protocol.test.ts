import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { OPERATIONS, TaskAgentService } from "#task-agent-core"
import { TaskAgentMcpServer, tools, READ_ONLY_TOOLS } from "../packages/protocol-mcp/src/index.ts"
import { TaskAgentHttpServer, dispatchHttpOperation } from "../packages/protocol-http/src/index.ts"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"

const reviewedDesign = {
  assignedRole: "implementer", acceptanceCriteria: ["입력 동작을 검증한다"],
  design: { inputs: ["기존 API"], outputs: ["수정 코드"], basis: ["src/input.ts: 기존 입력 경로 확인"], approach: "기존 API를 유지하며 입력 검증을 추가한다", verification: ["npm test -- input"], risks: ["기존 이벤트 순서 유지"] },
}

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
    nodes: [{ nodeId: "inspect", label: "현재 프로젝트 확인", stage: "research", researchTrack: "repository", outcome: "Understand the project", taskSpec: { ...reviewedDesign, goal: "Inspect repository", category: "research", writeScopes: [] } }],
  })
  assert.equal(draft.nodes[0].status, "not started")
  assert.equal(runtime.store.rootTasks().length, 0)
  const planId = draft.planId
  assert.equal(typeof planId, "string")
  const presented = await call("work_plan_present", { planId })
  assert.equal(presented.nodes[0].label, "현재 프로젝트 확인")
  assert.deepEqual(presented.nodes[0].taskSpec.design, reviewedDesign.design)
  const revision = await call("work_plan_revise", {
    operationId: "revise-details", planId, baseVersion: 1, summary: "검증 범위 수정", changeSummary: "기존 입력의 경계값도 검증한다",
    nodes: [{ nodeId: "inspect", label: "현재 프로젝트 확인", stage: "research", researchTrack: "repository", outcome: "Understand the project", taskSpec: { ...reviewedDesign, goal: "Inspect repository", writeScopes: [], design: { ...reviewedDesign.design, approach: "기존 입력 API와 경계값을 비교한다" } } }],
  })
  assert.equal(revision.userView.nodes[0].taskSpec.design.approach, "기존 입력 API와 경계값을 비교한다")
  assert.equal(runtime.store.rootTasks().length, 0)
  await call("work_plan_approve", { operationId: "approve-plan", planId, version: 2, approvalSource: "test user" })
  assert.equal(runtime.store.rootTasks().length, 1)
})

test("graph MCP resumes plan approval after reconnect without duplicate plans or tasks", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "plan-reconnect-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const database = join(directory, "graph.db")
  let runtime = createGraphMcp(database)
  t.after(() => runtime.store.close())
  const connect = async () => {
    await runtime.server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
    await runtime.server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
  }
  const call = async (name: string, args: Record<string, unknown>) => {
    const response = await runtime.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } })
    const result = response!.result as any
    assert.ok(!result.isError, result.content?.[0]?.text)
    return result.structuredContent
  }
  await connect()
  const input = { operationId: "create-before-reconnect", title: "재개 계획", goal: "입력 구현", requestText: "구현해주세요", summary: "설계 후 구현합니다", nodes: [
    { nodeId: "design", label: "설계", stage: "design", outcome: "API 결정", taskSpec: { ...reviewedDesign, goal: "설계", writeScopes: [] } },
    { nodeId: "build", label: "구현", stage: "implementation", outcome: "코드 구현", dependsOnNodeIds: ["design"], taskSpec: { ...reviewedDesign, goal: "구현", writeScopes: ["src"] } },
  ] }
  const draft = await call("work_plan_create_draft", input)
  runtime.store.close()
  runtime = createGraphMcp(database)
  await connect()
  assert.deepEqual(await call("work_plan_create_draft", input), draft)
  assert.equal((await call("work_plan_load", { planId: draft.planId })).plan.state, "awaiting_approval")
  const approved = await call("work_plan_approve", { operationId: "approve-after-reconnect", planId: draft.planId, version: 1, approvalSource: "실제 사용자 승인" })
  assert.equal(approved.createdTaskIds.length, 3)
  const loaded = await call("work_plan_load", { planId: draft.planId })
  assert.equal(loaded.userView.nodes[0].status, "ready")
  assert.notEqual(loaded.userView.nodes[1].status, "ready")
  assert.equal(runtime.store.rootTasks().length, 1)
  const retried = await call("work_plan_approve", { operationId: "approval-redelivery", planId: draft.planId, version: 1, approvalSource: "실제 사용자 승인" })
  assert.equal(retried.createdTaskIds.length, 0)
})

test("조사 근거와 상세 설계가 없는 신규 계획 및 과거 초안은 승인을 차단한다", async (t) => {
  const runtime = createGraphMcp(":memory:")
  t.after(() => runtime.store.close())
  await runtime.server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
  await runtime.server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
  const legacy = { title: "간략 계획", goal: "수정", requestText: "수정", summary: "조사 후 수정", nodes: [{ nodeId: "a", label: "수정", stage: "implementation" as const, outcome: "수정됨", dependsOnNodeIds: [], taskSpec: { goal: "수정" } }] }
  const call = async (name: string, args: any) => (await runtime.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } }))!.result as any
  assert.equal((await call("work_plan_create_draft", { ...legacy, operationId: "missing-design" })).isError, true)
  const engine = new TaskGraphEngine(runtime.store)
  const draft = engine.createDraftPlan(legacy)
  const rejected = await call("work_plan_approve", { planId: draft.planId, version: 1, approvalSource: "사용자", operationId: "old-approval" })
  assert.equal(rejected.isError, true)
  assert.match(rejected.content[0].text, /Detailed task design/)
  assert.equal(runtime.store.rootTasks().length, 0)
})
