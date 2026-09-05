import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { launchHost, serviceRoot, taskTools } from "../packages/opencode-harness/src/host.ts"
import { HOST_TASK_INSTRUCTIONS } from "../packages/host-integration/src/index.ts"

// Explicit opt-in. Synthetic conversations are sent to the configured model.
// The Host sees only Gateway MCP tools; it cannot call internal Engine tools.
const database = join(mkdtempSync(join(tmpdir(), "task-host-eval-")), "tasks.db")
const store = new SqliteTaskRepository(database)
const engine = new TaskEngine(store)
const taskId = engine.createTask({ title: "가상 컴파일러 개선", objective: "정규화 설계와 테스트 계획 수립" }).task.id
const host = await launchHost({ hostMcpDatabase: database })
try {
  console.log(`Evaluation database: ${database}`)
  const mcp = await host.client.mcp.status({ directory: serviceRoot }, { throwOnError: true })
  assert.equal(mcp.data?.persistent_task?.status, "connected", "Host Gateway MCP must be connected")
  const session = await host.client.session.create({ directory: serviceRoot, title: "Synthetic Host evaluation", permission: [
    { permission: "*", pattern: "*", action: "deny" }, { permission: "persistent_task_*", pattern: "*", action: "allow" },
  ] }, { throwOnError: true })
  assert.ok(session.data?.id)
  const traces: string[][] = []
  const seenParts = new Set<string>()
  for (const conversation of [
    "가상 컴파일러 개선 작업 이어서 하자. 지금 어디까지 했는지 알려줘.",
    "정규화 단계를 따로 두는 것도 괜찮을 것 같은데? 아직은 후보로만 생각하자.",
    "그래, 정규화 단계를 독립적으로 분리하자. 기존 TypeScript 호환성은 유지해야 해. 다음에는 회귀 테스트를 추가하자.",
    "오늘은 여기까지 하자. 다음에는 다른 에이전트랑 이어갈게.",
  ]) {
    const result = await host.client.session.prompt({
      sessionID: session.data.id, agent: "host-evaluation", directory: serviceRoot, system: HOST_TASK_INSTRUCTIONS,
      tools: Object.fromEntries(taskTools.map((name) => [name, false])),
      parts: [{ type: "text", text: conversation }],
    }, { throwOnError: true, signal: AbortSignal.timeout(240000) })
    if (result.data?.info.error) throw new Error(`Host failed: ${result.data.info.error.name}`)
    const history = await host.client.session.messages({ sessionID: session.data.id, directory: serviceRoot }, { throwOnError: true })
    const calls: string[] = []
    for (const message of history.data ?? []) for (const part of message.parts) {
      if (part.type === "tool" && !seenParts.has(part.id)) {
        calls.push(part.tool); seenParts.add(part.id)
        if (process.env.TASK_AGENT_EVAL_TRACE === "1") console.log(JSON.stringify({ tool: part.tool, state: part.state }))
      }
    }
    traces.push(calls)
    console.log(JSON.stringify({ turn: traces.length, calls }))
    if (traces.length === 1) assert.ok(calls.every((name) => name.endsWith("task_context")), "Resuming existing work must be read-only")
    if (traces.length === 2) assert.ok(!calls.some((name) => /task_sync|task_run/.test(name)), "Pure proposals should not trigger writes or extraction")
    if (traces.length === 2) assert.equal(engine.getTask(taskId).snapshot.activeDecisions.length, 0, "Tentative idea must not be confirmed")
  }
  assert.ok(traces[0]!.some((name) => name.endsWith("task_context")), "Host must recall context without a tool command")
  assert.ok(traces[2]!.some((name) => name.endsWith("task_sync")), "Host must sync confirmed work without a save command")
  assert.ok(traces[3]!.some((name) => name.endsWith("task_handoff")), "Host must hand off at the work boundary")
  const snapshot = engine.getTask(taskId).snapshot
  assert.equal(snapshot.activeDecisions.length, 1)
  assert.equal(snapshot.constraints.length, 1)
  assert.equal(snapshot.nextActions.length, 1)
  assert.equal(engine.searchTasks("").length, 1, "Host must not create duplicate tasks")
  console.log("PASS: Natural Host context, proposal handling, automatic sync, and handoff")
} finally { host.close(); store.close() }
