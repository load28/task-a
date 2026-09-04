import test from "node:test"
import assert from "node:assert/strict"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { TaskAgentService } from "#task-agent-core"
import { TaskAgentMcpServer } from "../packages/protocol-mcp/src/index.ts"
import { dispatchHttpOperation } from "../packages/protocol-http/src/index.ts"

test("context resolves a task and sync appends only durable event types", async () => {
  const repository = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(repository)
    const task = engine.createTask({ title: "RL compiler", objective: "Improve match inference", status: "active" }).task
    const agent = new TaskAgentService(engine, {
      async extractEvents() {
        return [
          { type: "decision", content: "Normalize patterns independently" },
          { type: "artifact", content: "Checker", metadata: { type: "file", uri: "src/checker.ts" } },
        ]
      },
      async selectTask({ candidates }) { return candidates[0]!.id },
      async run() { return "analysis" },
    })

    const synced = await agent.sync({ task: "RL compiler", conversation: "분리하기로 했다." })
    assert.equal(synced.appended.length, 2)
    assert.equal((await agent.context({ taskId: task.id })).context.importantDecisions[0], "Normalize patterns independently")
    assert.equal(engine.getTask(task.id).artifacts[0]!.uri, "src/checker.ts")
  } finally {
    repository.close()
  }
})

test("MCP server implements initialize, tools/list, and task_context", async () => {
  const repository = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(repository)
    const task = engine.createTask({ title: "Task Agent", objective: "Persist work state" }).task
    const server = new TaskAgentMcpServer(new TaskAgentService(engine))

    const initialized: any = await server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
    assert.equal(initialized.result.serverInfo.name, "task-agent")
    await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
    const listed: any = await server.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    assert.deepEqual(listed.result.tools.map((item: any) => item.name), ["task_context", "task_sync", "task_handoff", "task_run"])
    const called: any = await server.handle({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "task_context", arguments: { taskId: task.id } },
    })
    assert.equal(called.result.structuredContent.context.objective, "Persist work state")
  } finally {
    repository.close()
  }
})

test("sync idempotency prevents duplicate events", async () => {
  const repository = new SqliteTaskRepository()
  try {
    const engine = new TaskEngine(repository)
    const task = engine.createTask({ title: "Idempotent sync", objective: "Avoid duplicate history" }).task
    const agent = new TaskAgentService(engine, {
      async extractEvents() { return [{ type: "progress", content: "Done once" }] },
      async selectTask({ candidates }) { return candidates[0]!.id },
      async run() { return "ok" },
    })
    const request = { taskId: task.id, conversation: "완료했다.", idempotencyKey: "conversation-1" }
    assert.equal((await agent.sync(request)).appended.length, 1)
    assert.equal((await agent.sync(request)).appended.length, 1)
    assert.equal(engine.getTask(task.id).snapshot.recentProgress.length, 1)
  } finally {
    repository.close()
  }
})

test("HTTP gateway dispatches all four operations", async () => {
  const repository = new SqliteTaskRepository()
  const engine = new TaskEngine(repository)
  const task = engine.createTask({ title: "HTTP task", objective: "Serve all operations" }).task
  const agent = new TaskAgentService(engine, {
    async extractEvents() { return [] },
    async selectTask({ candidates }) { return candidates[0]!.id },
    async run({ instruction }) { return `ran: ${instruction}` },
  })
  try {
    const context: any = await dispatchHttpOperation(agent, "/v1/context", { taskId: task.id })
    assert.equal(context.context.objective, "Serve all operations")
    const handoff: any = await dispatchHttpOperation(agent, "/v1/handoff", { taskId: task.id, targetAgent: "Codex" })
    assert.equal(handoff.targetAgent, "Codex")
    const run: any = await dispatchHttpOperation(agent, "/v1/run", { instruction: "review", taskIds: [task.id] })
    assert.equal(run.text, "ran: review")
  } finally {
    repository.close()
  }
})
