import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { OpenCodeServer } from "../packages/opencode-harness/src/server.ts"
import type { HostConfig } from "../packages/host-integration/src/config.ts"

test("실제 SDK가 OpenCode 기본·하위 에이전트와 그래프 MCP를 구성하고 비동기 세션을 사용한다", async () => {
  const calls: Array<{ path: string; method: string; body: any }> = []
  let connected = true,
    modelAvailable = true,
    waiting = true,
    busy = true,
    finish = "stop"
  const server = createServer(async (req, res) => {
    let text = ""
    for await (const chunk of req) text += chunk
    const body = text ? JSON.parse(text) : {},
      path = new URL(req.url!, "http://localhost").pathname
    calls.push({ path, method: req.method!, body })
    res.setHeader("content-type", "application/json")
    let result: unknown = {}
    if (path === "/provider")
      result = {
        connected: connected ? ["anthropic"] : ["opencode"],
        default: { anthropic: "claude-test", opencode: "free" },
        all: [],
      }
    else if (path === "/config/providers")
      result = {
        providers: [{ id: "anthropic", models: modelAvailable ? { "claude-test": { id: "claude-test" } } : {} }],
        default: { anthropic: "claude-test" },
      }
    else if (path === "/config") result = body
    else if (path === "/mcp") result = { task_graph: { status: "connected" } }
    else if (path === "/session" && req.method === "GET") result = []
    else if (path === "/session" && req.method === "POST") result = { id: "ses_main" }
    else if (path === "/session/status")
      result = busy ? { ses_main: { type: "busy" }, ses_child: { type: "busy" } } : {}
    else if (path === "/session/ses_main/children") result = [{ id: "ses_child" }]
    else if (path.endsWith("/children")) result = []
    else if (path === "/session/ses_main/message")
      result = [
        { info: { id: "msg_one", role: "user" }, parts: [] },
        {
          info: { id: "msg_answer", role: "assistant", parentID: "msg_one", time: { completed: 1 }, finish },
          parts: [
            { type: "text", text: "서버 결과" },
            { type: "tool", tool: "task_graph_task_complete", state: { status: "completed" } },
          ],
        },
        {
          info: { id: "msg_old", role: "assistant", parentID: "msg_other", time: { completed: 1 }, finish: "stop" },
          parts: [{ type: "text", text: "다른 요청 결과" }],
        },
      ]
    else if (path === "/question")
      result = waiting
        ? [
            { id: "q_child", sessionID: "ses_child", questions: [] },
            { id: "q_other", sessionID: "ses_other", questions: [] },
          ]
        : []
    else if (path === "/permission")
      result = waiting
        ? [
            {
              id: "p_child",
              sessionID: "ses_child",
              permission: "bash",
              patterns: ["npm test"],
              metadata: {},
              always: [],
            },
          ]
        : []
    res.end(JSON.stringify(result))
  })
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok))
  const port = (server.address() as { port: number }).port
  const config: HostConfig = {
    version: 1,
    directory: process.cwd(),
    database: ":memory:",
    socket: "unused",
    workspaces: [{ path: process.cwd() }],
    opencodeUrl: `http://127.0.0.1:${port}`,
    model: "claude",
    autoContinue: true,
    maxRuns: 50,
  }
  const native = new OpenCodeServer(config)
  try {
    await native.prepare(process.cwd(), "/tmp/test-graph.db")
    const agents = calls.find((c) => c.path === "/config" && c.method === "PATCH")!.body.agent
    assert.equal(agents["task-manager"].mode, "primary")
    assert.equal(agents["task-worker"].mode, "subagent")
    for (const name of ["task-manager", "task-worker"]) {
      assert.equal(agents[name].permission["*"], "allow")
      assert.equal(agents[name].permission.bash, "allow")
    }
    assert.equal(agents["task-planner"].permission["*"], "deny")
    const mcp = calls.find((c) => c.path === "/mcp")!.body
    assert.equal(mcp.name, "task_graph")
    assert.match(mcp.config.command[1], /scripts\/graph-mcp.ts$/)
    assert.equal(mcp.config.command[2], "/tmp/test-graph.db")
    const sessionID = await native.createSession(process.cwd(), "host-session")
    const b = { sessionID, workspace: process.cwd(), messageID: "msg_one" }
    await native.submit(b, "원본 요청", false, "npm test")
    const prompt = calls.find((c) => c.path.endsWith("/prompt_async"))!
    assert.equal(prompt.body.agent, "task-manager")
    assert.deepEqual(prompt.body.model, { providerID: "anthropic", modelID: "claude-test" })
    assert.deepEqual(prompt.body.parts, [{ type: "text", text: "원본 요청" }])
    assert.equal(prompt.body.format, undefined, "Host must not request planning decision JSON")
    assert.equal(await native.hasMessage(b), true)
    const state = await native.inspect(b)
    assert.equal(state.state, "waiting")
    assert.equal(state.text, "서버 결과")
    assert.deepEqual(
      state.questions.map((q) => q.id),
      ["q_child"],
    )
    await assert.rejects(native.reply(b, { kind: "question", requestID: "q_other", answers: [["no"]] }), /not pending/)
    await native.reply(b, { kind: "question", requestID: "q_child", answers: [["사용자 답변"]] })
    await native.reply(b, { kind: "permission", requestID: "p_child", reply: "once" })
    assert.equal(calls.find((c) => c.path === "/permission/p_child/reply")!.body.reply, "once")
    await native.cancel(b)
    assert.ok(calls.some((c) => c.path === "/session/ses_child/abort"))
    assert.ok(calls.some((c) => c.path === "/session/ses_main/abort"))
    waiting = false
    busy = false
    assert.equal((await native.inspect(b)).state, "completed")
    finish = "tool-calls"
    assert.equal((await native.inspect(b)).state, "interrupted")
    modelAvailable = false
    await assert.rejects(native.createSession(process.cwd(), "unavailable-model"), /not available/)
    connected = false
    await assert.rejects(native.createSession(process.cwd(), "new-session"), /인증/)
    assert.equal(
      calls.filter((c) => c.path === "/session" && c.method === "POST").length,
      1,
      "No fallback to another provider",
    )
  } finally {
    await native.close()
    await new Promise<void>((ok) => server.close(() => ok()))
  }
})
