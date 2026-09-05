import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { TaskEngine, projectSnapshot } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { TaskAgentService, type ExtractedEvent, type TaskReasoner } from "#task-agent-core"
import { OpenCodeReasoner } from "#opencode-harness"
import { TaskAgentMcpServer } from "../packages/protocol-mcp/src/index.ts"
import { TaskAgentHttpServer } from "../packages/protocol-http/src/index.ts"

const exec = promisify(execFile)
const reasoner = (events: ExtractedEvent[], selected = ""): TaskReasoner => ({
  async extractEvents() { return events },
  async selectTask() { return selected },
  async run() { return "ok" },
})

test("completed actions and withdrawn constraints disappear without losing history", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "연속성", objective: "현재 유효 상태만 제공" }).task.id
    const constraint = engine.appendEvent({ taskId, type: "constraint", content: "기존 제약" }).events.at(-1)!
    const action = engine.appendEvent({ taskId, type: "next_action", content: "테스트 추가" }).events.at(-1)!
    for (let i = 0; i < 12; i++) engine.appendEvent({ taskId, type: "next_action", content: `남은 작업 ${i}` })
    engine.appendEvent({ taskId, type: "constraint_removed", content: "제약 철회", metadata: { resolves: constraint.id } })
    engine.appendEvent({ taskId, type: "next_action_completed", content: "테스트 추가 완료", metadata: { resolves: action.id } })
    assert.throws(() => engine.appendEvent({ taskId, type: "next_action_completed", content: "중복 완료", metadata: { resolves: action.id } }), /active next_action/)
    assert.throws(() => engine.appendEvent({ taskId, type: "constraint_removed", content: "잘못된 참조", metadata: { resolves: action.id } }), /active constraint/)
    const context = await new TaskAgentService(engine).handoff({ taskId })
    assert.deepEqual(context.context.constraints, [])
    assert.equal(context.context.nextActions.length, 12)
    assert.ok(!context.context.nextActions.includes("테스트 추가"))
    const record = engine.getTask(taskId)
    assert.ok(record.events.some((event) => event.id === action.id))
    assert.deepEqual(record.snapshot, projectSnapshot(record.task, record.events, record.artifacts))
  } finally { store.close() }
})

test("sync re-extracts against fresh state after another agent writes", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "동시 판단", objective: "낡은 판단 방지" }).task.id
    let calls = 0
    const agent = new TaskAgentService(engine, { ...reasoner([]), async extractEvents({ task }) {
      if (++calls === 1) {
        engine.appendEvent({ taskId, type: "decision", content: "다른 에이전트의 결정" })
        return [{ type: "decision", content: "낡은 판단" }]
      }
      assert.equal(task.snapshot.activeDecisions[0], "다른 에이전트의 결정")
      return [{ type: "finding", content: "최신 상태에 근거한 발견" }]
    } })
    const result = await agent.sync({ taskId, conversation: "발견 반영", idempotencyKey: "concurrent" })
    assert.equal(calls, 2)
    assert.equal(result.appended[0]?.content, "최신 상태에 근거한 발견")
    assert.equal(engine.getTask(taskId).events.length, 3)
  } finally { store.close() }
})

test("OpenCode extraction requires exact evidence and preserves old active lifecycle IDs", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "근거", objective: "대화 기반 기록" }).task.id
    const action = engine.appendEvent({ taskId, type: "next_action", content: "테스트 추가" }).events.at(-1)!
    for (let i = 0; i < 40; i++) engine.appendEvent({ taskId, type: "progress", content: `진행 ${i}` })
    let evidence = "테스트 추가를 완료했습니다."
    const client = { session: {
      async create() { return { data: { id: "audit-session" } } },
      async prompt(input: any) {
        assert.ok(input.parts[0].text.includes(action.id))
        return { data: { info: { sessionID: "audit-session", structured: { events: [{ type: "next_action_completed", content: "테스트 완료", evidence, metadata: { resolves: action.id } }] } }, parts: [] } }
      },
    } }
    const agent = new TaskAgentService(engine, new OpenCodeReasoner(client as never))
    const result = await agent.sync({ taskId, conversation: "에이전트: 테스트 추가를 완료했습니다." })
    assert.equal(result.appended[0]?.metadata?.evidence, evidence)
    assert.equal(result.appended[0]?.metadata?.harnessSessionId, "audit-session")
    evidence = "대화에 없는 문장"
    await assert.rejects(agent.sync({ taskId, conversation: "그렇군요." }), /quote the conversation/)
    assert.equal(engine.getTask(taskId).events.length, 43)
  } finally { store.close() }
})

test("continuous concurrent changes stop after three attempts without storing stale output", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "경합", objective: "유한 재시도" }).task.id
    let calls = 0
    const agent = new TaskAgentService(engine, { ...reasoner([]), async extractEvents() {
      engine.appendEvent({ taskId, type: "progress", content: `다른 작업 ${++calls}` })
      return [{ type: "decision", content: "낡은 판단" }]
    } })
    await assert.rejects(agent.sync({ taskId, conversation: "반영", idempotencyKey: "busy" }), /Task changed during sync/)
    assert.equal(calls, 3)
    assert.equal(engine.getTask(taskId).events.length, 4)
    assert.equal(store.receipt(taskId, "busy"), undefined)
  } finally { store.close() }
})

test("artifact sync retains its evidence alongside deterministic artifact metadata", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "산출물", objective: "근거 보존" }).task.id
    const agent = new TaskAgentService(engine, reasoner([{ type: "artifact", content: "테스트 결과", metadata: {
      type: "test", uri: "test-result.txt", evidence: "테스트 결과를 저장했습니다.", harnessSessionId: "audit", artifactId: "forged",
    } }]))
    const result = await agent.sync({ taskId, conversation: "테스트 결과를 저장했습니다." })
    assert.equal(result.appended[0]?.metadata?.evidence, "테스트 결과를 저장했습니다.")
    assert.equal(result.appended[0]?.metadata?.harnessSessionId, "audit")
    assert.notEqual(result.appended[0]?.metadata?.artifactId, "forged")
    assert.equal(result.appended[0]?.metadata?.artifactId, engine.getTask(taskId).artifacts[0]?.id)
  } finally { store.close() }
})

test("a rejected event rolls back the entire sync, including artifacts and receipts", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "동기화", objective: "원자적 반영" }).task.id
    const agent = new TaskAgentService(engine, reasoner([
      { type: "artifact", content: "결과", metadata: { type: "file", uri: "result.txt" } },
      { type: "status", content: "잘못된 상태", metadata: { status: "invalid" } },
    ]))
    await assert.rejects(agent.sync({ taskId, conversation: "작업 결과", idempotencyKey: "retry" }), /status/)
    const record = engine.getTask(taskId)
    assert.equal(record.events.length, 1)
    assert.equal(record.artifacts.length, 0)
    assert.equal(store.receipt(taskId, "retry"), undefined)
  } finally { store.close() }
})

test("sync receipts survive restart, return the original response, and reject key reuse", async () => {
  const directory = mkdtempSync(join(tmpdir(), "task-receipts-"))
  const path = join(directory, "tasks.db")
  let store = new SqliteTaskRepository(path)
  try {
    let engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "재시도", objective: "중복 없음" }).task.id
    const request = { taskId, conversation: "완료", idempotencyKey: "request-1" }
    const initial = await new TaskAgentService(engine, reasoner([{ type: "progress", content: "완료" }])).sync(request)
    store.close()
    store = new SqliteTaskRepository(path)
    engine = new TaskEngine(store)
    const failIfCalled: TaskReasoner = { ...reasoner([]), async extractEvents() { throw new Error("Model must not be called") } }
    const agent = new TaskAgentService(engine, failIfCalled)
    assert.deepEqual(await agent.sync(request), JSON.parse(JSON.stringify(initial)))
    await assert.rejects(agent.sync({ ...request, conversation: "다른 요청" }), /idempotencyKey/)
    assert.equal(engine.getTask(taskId).events.length, 2)
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("empty sync results are idempotent and Host agents cannot inject events", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "제안", objective: "확정만 기록" }).task.id
    let calls = 0
    const agent = new TaskAgentService(engine, { ...reasoner([]), async extractEvents() { calls++; return [] } })
    const request = { taskId, conversation: "이렇게 할까요?", idempotencyKey: "proposal" }
    await agent.sync(request)
    await agent.sync(request)
    assert.equal(calls, 1)
    await assert.rejects(agent.sync({ ...request, events: [{ type: "decision", content: "강제" }] } as never), /Host Agent/)
    assert.equal(engine.getTask(taskId).events.length, 1)
  } finally { store.close() }
})

test("ambiguous or invalid semantic task selections never silently select a task", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    engine.createTask({ title: "compiler A", objective: "A" })
    engine.createTask({ title: "compiler B", objective: "B" })
    await assert.rejects(new TaskAgentService(engine).context({ query: "compiler" }), /Multiple tasks/)
    await assert.rejects(new TaskAgentService(engine, reasoner([], "invented-id")).context({ query: "compiler" }), /unambiguously/)
    await assert.rejects(new TaskAgentService(engine).context({ query: 123 } as never), /query must/)
  } finally { store.close() }
})

test("hierarchy rejects cycles and duplicate links return their persisted IDs", () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const a = engine.createTask({ title: "A", objective: "A" }).task.id
    const b = engine.createTask({ title: "B", objective: "B" }).task.id
    const relation = engine.addRelation(a, b, "parent")
    assert.equal(engine.getTask(b).task.parentTaskId, a)
    assert.equal(engine.addRelation(a, b, "parent").id, relation.id)
    assert.equal(engine.addRelation(b, a, "child").id, relation.id)
    assert.throws(() => engine.addRelation(b, a, "parent"), /cycle/)
    assert.equal(engine.getTask(a).task.parentTaskId, undefined)
  } finally { store.close() }
})

test("concurrent Node workers preserve every event in the materialized snapshot", async () => {
  const directory = mkdtempSync(join(tmpdir(), "task-concurrent-"))
  const path = join(directory, "tasks.db")
  const store = new SqliteTaskRepository(path)
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "동시 작업", objective: "모든 결정을 보존" }).task.id
    const engineURL = new URL("../packages/task-engine/src/index.ts", import.meta.url).href
    const storeURL = new URL("../packages/task-store/src/index.ts", import.meta.url).href
    const program = `
      const { TaskEngine } = await import(${JSON.stringify(engineURL)});
      const { SqliteTaskRepository } = await import(${JSON.stringify(storeURL)});
      const store = new SqliteTaskRepository(process.argv[1]);
      const engine = new TaskEngine(store);
      try {
        for (let i = 0; i < 20; i++) engine.appendEvent({
          taskId: process.argv[2], type: "decision", content: process.argv[3] + ":" + i
        });
      } finally { store.close(); }
    `
    await Promise.all([0, 1, 2, 3].map((worker) =>
      exec(process.execPath, ["--input-type=module", "-e", program, path, taskId, String(worker)])))
    const record = engine.getTask(taskId)
    assert.equal(record.events.length, 81)
    assert.equal(new Set(record.snapshot.activeDecisions).size, 80)
    assert.deepEqual(record.snapshot, projectSnapshot(record.task, record.events, record.artifacts))
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("event creation metadata preserves the original objective and status for replay", () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const record = engine.createTask({ title: "목표", objective: "원래 목표", status: "active" })
    const snapshot = projectSnapshot({ ...record.task, objective: "잘못된 투영", status: "completed" }, record.events, [])
    assert.equal(snapshot.objective, "원래 목표")
    assert.equal(snapshot.status, "active")
  } finally { store.close() }
})

test("context uses the materialized snapshot without loading event history", async () => {
  const store = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(store)
    const taskId = engine.createTask({ title: "Context", objective: "현재 상태만 조회" }).task.id
    engine.appendEvent({ taskId, type: "finding", content: "중요한 실패 원인" })
    store.events = () => { throw new Error("History must not be loaded") }
    const context = await new TaskAgentService(engine).context({ taskId, mode: "handoff" })
    assert.deepEqual(context.context.findings, ["중요한 실패 원인"])
    assert.match(context.text, /Recent Progress\nNone recorded/)
    assert.match(context.text, /No progress has been recorded/)
  } finally { store.close() }
})

test("OpenCode selection uses system instructions, denies mutations, and retains its audit session", async () => {
  const prompts: any[] = []
  const sessions: any[] = []
  const client = {
    session: {
      async create(input: unknown) { sessions.push(input); return { data: { id: "session-1" } } },
      async prompt(input: unknown) { prompts.push(input); return { data: { info: { structured: { taskId: "" } }, parts: [] } } },
      async delete() { throw new Error("Audit session must not be deleted") },
    },
  }
  const harness = new OpenCodeReasoner(client as never)
  assert.equal(await harness.selectTask({ query: "없음", candidates: [] }), "")
  assert.match(prompts[0].system, /untrusted evidence/)
  assert.equal(prompts[0].agent, "task-state")
  assert.equal(prompts[0].tools.append_event, false)
  assert.equal(prompts[0].tools.StructuredOutput, true)
  assert.match(prompts[0].parts[0].text, /MUST call the StructuredOutput/)
  assert.deepEqual(sessions[0].permission[0], { permission: "*", pattern: "*", action: "deny" })
})

test("MCP validates lifecycle and unknown tools; HTTP forbids unauthenticated public binding", async () => {
  const store = new SqliteTaskRepository()
  try {
    const agent = new TaskAgentService(new TaskEngine(store))
    const server = new TaskAgentMcpServer(agent)
    assert.equal((await server.handle(null as never) as any).error.code, -32600)
    assert.equal((await server.handle({ jsonrpc: "2.0", id: 1, method: "tools/list" }) as any).error.code, -32002)
    await server.handle({ jsonrpc: "2.0", id: 2, method: "initialize" })
    await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
    const result: any = await server.handle({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "unknown" } })
    assert.equal(result.error.code, -32602)
    assert.throws(() => new TaskAgentHttpServer(agent, { hostname: "0.0.0.0" }), /TOKEN/)
  } finally { store.close() }
})
