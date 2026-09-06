import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { spawn } from "node:child_process"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { install, uninstall } from "../packages/host-integration/src/install.ts"
import { importLegacy } from "../packages/host-integration/src/migration.ts"
import { HostService, callService, workspaceDatabase } from "../packages/host-integration/src/service.ts"
import { socketPath, loadConfig, workspaceFor, type HostConfig } from "../packages/host-integration/src/config.ts"
import { createBridge, hostToolAllowed } from "../packages/host-integration/src/bridge.ts"
import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import type { HarnessServer, ServerBinding, ServerState } from "../packages/opencode-harness/src/server.ts"
import type { HostEvent } from "../packages/host-integration/src/store.ts"

function setup(t: any) {
  const directory = realpathSync(mkdtempSync(resolve(tmpdir(), "task-relay-")))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return { directory }
}
class NativeServer implements HarnessServer {
  submitted: Array<{ binding: ServerBinding; text: string; plan: boolean }> = []
  cancelled: string[] = []
  replyCount = 0
  received = new Set<string>()
  sendError = false
  states = new Map<string, ServerState>()
  async prepare() {}
  async createSession() {
    return "ses_native"
  }
  async submit(binding: ServerBinding, text: string, plan: boolean) {
    this.submitted.push({ binding: { ...binding }, text, plan })
    if (this.sendError) throw new Error("connection lost before acknowledgement")
    this.received.add(binding.messageID)
  }
  async hasMessage(b: ServerBinding) {
    return this.received.has(b.messageID)
  }
  async inspect(b: ServerBinding): Promise<ServerState> {
    return (
      this.states.get(b.messageID) ?? {
        state: "running",
        text: "server working",
        questions: [],
        permissions: [],
        activity: [],
      }
    )
  }
  async reply() {
    this.replyCount++
  }
  async cancel(b: ServerBinding) {
    this.cancelled.push(b.sessionID)
  }
  async readiness() {
    return { healthy: true }
  }
  close() {}
}
function config(directory: string): HostConfig {
  return {
    version: 1,
    directory,
    database: resolve(directory, "graph.db"),
    socket: socketPath(directory),
    workspaces: [{ path: directory, verifyCommand: "must-never-execute-in-host" }],
    autoContinue: true,
    maxRuns: 20,
  }
}
function event(directory: string, id = "one", host: "claude" | "codex" = "claude"): HostEvent {
  return {
    id,
    host,
    sessionId: host,
    workspace: directory,
    kind: "UserPromptSubmit",
    text: "검색 기능을 구현하고 검증해 주세요",
  }
}
async function ready(server: { handle(input: any): Promise<any> }) {
  await server.handle({ jsonrpc: "2.0", id: 1, method: "initialize" })
  await server.handle({ jsonrpc: "2.0", method: "notifications/initialized" })
}
const rpc = (server: any, name: string, args: any) =>
  server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } })

test("설치 반복은 훅을 중복하지 않고 기존 설정을 보존하며 제거 시 복원한다", (t) => {
  const f = setup(t)
  const home = resolve(f.directory, "home")
  mkdirSync(resolve(home, ".claude"), { recursive: true })
  mkdirSync(resolve(home, ".codex"), { recursive: true })
  writeFileSync(
    resolve(home, ".claude/settings.json"),
    JSON.stringify({
      model: "existing",
      hooks: { Stop: [{ hooks: [{ type: "command", command: "existing-hook" }] }] },
    }),
  )
  writeFileSync(
    resolve(home, ".codex/config.toml"),
    'model = "existing"\n[mcp_servers.other]\ncommand = "other"\n[mcp_servers.task-agent]\ncommand = "old"\n',
  )
  const opts = { home, workspace: f.directory, hosts: ["claude", "codex"] as Array<"claude" | "codex"> }
  install(opts)
  install(opts)
  const config = JSON.parse(readFileSync(resolve(home, ".claude/settings.json"), "utf8"))
  assert.equal(config.model, "existing")
  assert.equal(config.hooks.Stop.length, 2)
  assert.equal(
    (readFileSync(resolve(home, ".codex/config.toml"), "utf8").match(/\[mcp_servers.task-agent\]/g) ?? []).length,
    1,
  )
  uninstall(home, opts.hosts)
  assert.equal(JSON.parse(readFileSync(resolve(home, ".claude/settings.json"), "utf8")).hooks.Stop.length, 1)
  const toml = readFileSync(resolve(home, ".codex/config.toml"), "utf8")
  assert.match(toml, /command = "old"/)
  assert.match(toml, /command = "other"/)
})
test("구버전 이전은 원본과 이벤트를 보존하고 반복해도 중복하지 않는다", (t) => {
  const f = setup(t)
  const source = resolve(f.directory, "legacy.db"),
    target = resolve(f.directory, "import.db")
  const old = new DatabaseSync(source)
  old.exec(
    "CREATE TABLE tasks(id TEXT PRIMARY KEY,title TEXT,objective TEXT,status TEXT,parent_task_id TEXT,created_at TEXT,updated_at TEXT);CREATE TABLE task_events(id TEXT,task_id TEXT,content TEXT);",
  )
  old
    .prepare("INSERT INTO tasks VALUES(?,?,?,?,?,?,?)")
    .run("old", "이전 작업", "목표", "completed", null, "2026-01-01", "2026-01-01")
  old.prepare("INSERT INTO task_events VALUES(?,?,?)").run("event", "old", "기존 결정")
  old.close()
  const original = readFileSync(source)
  assert.equal(importLegacy(source, target, f.directory).imported, 1)
  assert.equal(importLegacy(source, target, f.directory).imported, 0)
  assert.deepEqual(readFileSync(source), original)
  const runtime = createGraphRuntime(target)
  try {
    const task = runtime.engine.rootTasks()[0]!
    assert.equal(task.status, "implemented")
    assert.match(
      runtime.store.db.prepare("SELECT content FROM artifact_versions").get()!.content as string,
      /기존 결정/,
    )
  } finally {
    runtime.close()
  }
})

test("호스트는 원문을 한 번 전달하며 그래프와 검증을 실행하지 않는다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    const e = event(directory)
    await callService(service.config.socket, "/event", e)
    await service.wake()
    await callService(service.config.socket, "/event", e)
    await service.wake()
    assert.equal(native.submitted.length, 1)
    assert.equal(native.submitted[0]!.text, e.text)
    assert.equal(existsSync(service.config.database), false, "Host must never open/mutate the task graph")
    await callService(service.config.socket, "/event", { ...e, id: "stop", kind: "Stop", text: "assistant: completed" })
    await service.wake()
    assert.equal(native.submitted.length, 1, "Stop must not create another prompt")
    assert.equal(service.store.get("stop"), undefined)
    await assert.rejects(callService(service.config.socket, "/event", { ...e, text: "different" }), /different payload/)
  } finally {
    await service.close()
  }
})

test("재시작은 서버 세션과 메시지를 재사용하고 완료 결과를 그대로 전달한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    c = config(directory)
  let service = new HostService(c, native)
  await service.start()
  await callService(c.socket, "/event", event(directory))
  await service.wake()
  const binding = service.store.get("one")!
  await service.close()
  service = new HostService(c, native)
  await service.start()
  try {
    native.states.set(binding.messageID, {
      state: "completed",
      text: "서버가 구현과 검증을 완료했습니다",
      questions: [],
      permissions: [],
      activity: [],
    })
    await service.wake()
    const status = await callService(c.socket, "/status", { requestId: "one", waitMs: 2000 })
    assert.equal(status.phase, "completed")
    assert.equal(status.text, "서버가 구현과 검증을 완료했습니다")
    assert.equal(native.submitted.length, 1)
    await callService(c.socket, "/event", event(directory, "two", "codex"))
    await service.wake()
    assert.equal(native.submitted[1]!.binding.sessionID, binding.sessionID)
  } finally {
    await service.close()
  }
})

test("수신 확인이 불분명하면 재실행하지 않고 이후 요청도 대기한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  native.sendError = true
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    await service.wake()
    assert.equal(service.store.get("one")!.phase, "uncertain")
    await callService(service.config.socket, "/event", event(directory, "two"))
    await service.wake()
    assert.equal(native.submitted.length, 1)
    await callService(service.config.socket, "/cancel", { requestId: "one" })
    assert.equal(service.store.get("one")!.phase, "cancelled")
    native.sendError = false
    await service.wake()
    assert.equal(native.submitted.length, 2)
  } finally {
    await service.close()
  }
})

test("전송 직후 중단되어도 서버에 메시지가 있으면 중복 전송하지 않는다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  const r = service.store.enqueue(event(directory))
  r.sessionID = "ses_native"
  r.phase = "sending"
  service.store.save(r)
  native.received.add(r.messageID)
  await service.wake()
  assert.equal(service.store.get(r.id)!.phase, "submitted")
  assert.equal(native.submitted.length, 0)
  await service.close()
})

test("질문과 승인은 서버에서 전달하고 취소는 해당 세션으로 보낸다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    const r = service.store.get("one")!
    native.states.set(r.messageID, {
      state: "waiting",
      text: "",
      questions: [],
      permissions: [
        {
          id: "permission-1",
          sessionID: r.sessionID,
          permission: "bash",
          patterns: ["npm test"],
          metadata: {},
          always: [],
        },
      ],
      activity: [],
    })
    await service.wake()
    const status = await callService(service.config.socket, "/status", { requestId: r.id })
    assert.equal(status.permissions[0].patterns[0], "npm test")
    assert.equal(native.replyCount, 0)
    await callService(service.config.socket, "/reply", {
      requestId: r.id,
      requestID: "permission-1",
      kind: "permission",
      reply: "once",
    })
    assert.equal(native.replyCount, 1)
    await callService(service.config.socket, "/cancel", { requestId: r.id })
    assert.deepEqual(native.cancelled, [r.sessionID])
  } finally {
    await service.close()
  }
})

test("그래프 MCP는 오케스트레이터를 노출하지 않고 변경과 처리 이력을 원자적으로 저장한다", async (t) => {
  const { directory } = setup(t),
    graph = createGraphMcp(resolve(directory, "graph.db"))
  try {
    await ready(graph.server)
    const listing: any = await graph.server.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" })
    assert.equal(
      listing.result.tools.some((x: any) => x.name === "orchestrate_run"),
      false,
    )
    const input = { title: "검색", goal: "검색 구현", operationId: "create-1" }
    const first = await rpc(graph.server, "task_create", input)
    const again = await rpc(graph.server, "task_create", { operationId: "create-1", goal: "검색 구현", title: "검색" })
    assert.deepEqual(again.result.structuredContent, first.result.structuredContent)
    assert.equal(graph.engine.rootTasks().length, 1)
    assert.equal((await rpc(graph.server, "task_create", { ...input, title: "다른 작업" })).result.isError, true)
    const parent = graph.engine.rootTasks()[0]!
    const bad = await rpc(graph.server, "task_propose_decomposition", {
      taskId: parent.id,
      operationId: "invalid-decomposition",
      children: [
        { key: "a", title: "a", goal: "a", dependencies: ["b"] },
        { key: "b", title: "b", goal: "b", dependencies: ["a"] },
      ],
    })
    assert.equal(bad.result.isError, true)
    assert.equal(graph.engine.requireTask(parent.id).childIds.length, 0)
    assert.equal(
      graph.store.db.prepare("SELECT count(*) n FROM graph_receipts WHERE id='invalid-decomposition'").get()!.n,
      0,
    )
    assert.equal((await rpc(graph.server, "task_create", { title: "x", goal: "x" })).result.isError, true)
  } finally {
    graph.close()
  }
})

test("호스트 MCP는 대화 제어와 전달 도구만 제공하고 실행 도구는 차단한다", async (t) => {
  const { directory } = setup(t)
  const bridge = createBridge("unused", config(directory))
  await ready(bridge)
  const response: any = await bridge.handle({ jsonrpc: "2.0", id: 2, method: "tools/list" })
  assert.deepEqual(
    response.result.tools.map((x: any) => x.name),
    ["agent_control", "agent_status", "agent_reply", "agent_cancel"],
  )
  assert.ok((await rpc(bridge, "task_create", {})).error)
  for (const name of ["Bash", "Read", "apply_patch", "mcp__other__agent_status", "mcp__task-agent__task_create"])
    assert.equal(hostToolAllowed(name), false)
  assert.equal(hostToolAllowed("mcp__task-agent__agent_status"), true)
  assert.equal(hostToolAllowed("mcp__task_agent__agent_reply"), true)
})

test("프로젝트별 그래프 DB 분리와 기존 DB 경로 유지", (t) => {
  const { directory } = setup(t),
    c = config(directory)
  assert.equal(workspaceDatabase(c, directory), c.database)
  assert.notEqual(workspaceDatabase(c, directory + "/two"), c.database)
  assert.notEqual(workspaceDatabase(c, directory + "/two"), workspaceDatabase(c, directory + "/three"))
})

test("두 번째 서비스의 기동 실패가 기존 소켓을 지우지 않는다", async (t) => {
  const { directory } = setup(t),
    c = config(directory),
    first = new HostService(c, new NativeServer()),
    second = new HostService(c, new NativeServer())
  await first.start()
  try {
    await assert.rejects(second.start(), /already running/)
    await second.close()
    assert.equal((await callService(c.socket, "/health")).ok, true)
  } finally {
    await first.close()
  }
})

async function hook(path: string, host: string, input: unknown): Promise<any> {
  return new Promise((ok, fail) => {
    const child = spawn(process.execPath, [resolve("scripts/host-hook.ts"), path, host], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, TASK_AGENT_INTERNAL: "" },
    })
    let out = "",
      err = ""
    child.stdout.on("data", (x) => (out += x))
    child.stderr.on("data", (x) => (err += x))
    child.on("error", fail)
    child.on("exit", (code) => {
      try {
        if (code) throw new Error(err)
        ok(JSON.parse(out))
      } catch (e) {
        fail(e)
      }
    })
    child.stdin.end(JSON.stringify(input))
  })
}

test("실제 Claude/Codex 훅이 원문을 보내고 로컬 실행을 차단한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    c = config(directory),
    path = resolve(directory, "host.json"),
    service = new HostService(c, native)
  writeFileSync(path, JSON.stringify(c))
  await service.start()
  try {
    for (const host of ["claude", "codex"]) {
      const input = { hook_event_name: "PreToolUse", cwd: directory, session_id: host, tool_name: "Bash" }
      const denied = await hook(path, host, input)
      assert.equal(denied.hookSpecificOutput.permissionDecision, "deny")
      const allowed = await hook(path, host, { ...input, tool_name: "mcp__task-agent__agent_status" })
      assert.deepEqual(allowed, {})
      const prompt = await hook(path, host, {
        ...input,
        hook_event_name: "UserPromptSubmit",
        prompt: "원본 요청",
        turn_id: host,
      })
      assert.match(prompt.hookSpecificOutput.additionalContext, /태스크 에이전트 requestId:/)
      assert.deepEqual(await hook(path, host, { ...input, session_id: "unbound", hook_event_name: "Stop" }), {})
    }
    await service.wake()
    assert.equal(native.submitted[0]!.text, "원본 요청")
    assert.equal(existsSync(c.database), false)
  } finally {
    await service.close()
  }
  const denied = await hook(path, "claude", {
    hook_event_name: "PreToolUse",
    cwd: directory,
    session_id: "offline",
    tool_name: "Edit",
  })
  assert.equal(denied.hookSpecificOutput.permissionDecision, "deny", "Server offline must not enable host execution")
})

test("Claude 첫 요청은 대화 기록이 없어도 전달되고 빈 기록 생성 후 재전송도 중복되지 않는다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    c = config(directory),
    path = resolve(directory, "host.json"),
    transcript = resolve(directory, "not-created.jsonl"),
    service = new HostService(c, native)
  writeFileSync(path, JSON.stringify(c))
  await service.start()
  try {
    const input = {
      hook_event_name: "UserPromptSubmit",
      cwd: directory,
      session_id: "first-claude-session",
      transcript_path: transcript,
      prompt: "디자인 시스템을 구축해보자",
    }
    const first = await hook(path, "claude", input)
    assert.match(first.hookSpecificOutput?.additionalContext ?? "", /태스크 에이전트 requestId:/)
    assert.equal(existsSync(transcript), false)
    writeFileSync(transcript, "")
    const retry = await hook(path, "claude", input)
    const requestId = (output: any) => output.hookSpecificOutput.additionalContext.match(/태스크 에이전트 requestId: ([^.]+)\./)[1]
    assert.equal(requestId(first), requestId(retry))
    await service.wake()
    assert.equal(native.submitted.length, 1)
    assert.equal(native.submitted[0]!.text, input.prompt)
  } finally {
    await service.close()
  }
})

test("실제 stdio Graph MCP가 검증 증거와 수락 조건을 확인하며 중복 제출을 보존한다", async (t) => {
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js")
  const { directory } = setup(t)
  const client = new Client({ name: "native-graph-test", version: "1.0" })
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve("scripts/graph-mcp.ts"), resolve(directory, "graph.db")],
    stderr: "pipe",
  })
  try {
    await client.connect(transport)
    const list = await client.listTools()
    const toolNames = new Set(list.tools.map((tool) => tool.name))
    for (const name of [
      "task_create",
      "task_search",
      "task_load",
      "task_get_runnable",
      "task_propose_decomposition",
      "task_start",
      "task_complete",
      "task_fail",
      "task_reopen",
      "task_get_context",
      "artifact_publish",
      "contract_define",
      "requirement_add",
      "impact_analyze",
      "learning_record",
      "learning_supersede",
      "learning_search",
      "integration_propose",
      "integration_run",
      "integration_report",
      "role_define",
      "role_list",
    ])
      assert.ok(toolNames.has(name), `Graph MCP must expose its core ${name} tool`)
    for (const name of [
      "work_plan_create_draft",
      "work_plan_load",
      "work_plan_approve",
      "work_plan_revise",
      "work_plan_impact",
      "work_plan_present",
    ])
      assert.ok(toolNames.has(name), `Graph MCP must expose the ${name} work-plan tool`)
    const created = await client.callTool({
      name: "task_create",
      arguments: {
        operationId: "create",
        title: "검색 검증",
        goal: "검색 검증",
        acceptanceCriteria: ["부분 일치 검색을 검증한다"],
      },
    })
    const task = created.structuredContent as any
    await client.callTool({
      name: "task_start",
      arguments: { operationId: "start", taskId: task.id, agent: "opencode" },
    })
    const incomplete = await client.callTool({
      name: "task_complete",
      arguments: {
        operationId: "incomplete",
        taskId: task.id,
        summary: "명령만 통과",
        verification: { passed: true, evidence: "exit 0" },
      },
    })
    assert.equal(incomplete.isError, true)
    assert.match(JSON.stringify(incomplete.content), /Acceptance criteria/)
    const unchanged = await client.callTool({ name: "task_load", arguments: { taskId: task.id } })
    assert.equal((unchanged.structuredContent as any).task.status, "running")
    const args = {
      operationId: "verified",
      taskId: task.id,
      summary: "부분 일치 결과 확인",
      verification: {
        passed: true,
        evidence: "fixture에서 기대한 검색 결과와 일치",
        criteriaSatisfied: [task.acceptanceCriteria[0].id],
      },
    }
    const complete = await client.callTool({ name: "task_complete", arguments: args })
    assert.equal((complete.structuredContent as any).status, "verified")
    const replay = await client.callTool({ name: "task_complete", arguments: args })
    assert.deepEqual(replay.structuredContent, complete.structuredContent)
  } finally {
    await client.close()
  }
})

test("전송 중 취소는 늦게 도착한 서버 요청도 중단하고 취소 상태를 유지한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  let release!: () => void
  let started!: () => void
  const entered = new Promise<void>((ok) => {
    started = ok
  })
  const gate = new Promise<void>((ok) => {
    release = ok
  })
  native.submit = async (b) => {
    started()
    await gate
    native.received.add(b.messageID)
  }
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await entered
    const cancelled = callService(service.config.socket, "/cancel", { requestId: "one" })
    // Wait until the durable cancel flag is visible before releasing the in-flight delivery.
    const deadline = Date.now() + 2000
    while (service.store.get("one")!.phase !== "cancelling" && Date.now() < deadline)
      await new Promise((ok) => setTimeout(ok, 10))
    assert.equal(service.store.get("one")!.phase, "cancelling")
    release()
    await cancelled
    assert.equal(service.store.get("one")!.phase, "cancelled")
    assert.deepEqual(native.cancelled, ["ses_native"])
  } finally {
    release()
    await service.close()
  }
})

test("후속 요청 대기 중 앞선 서버 작업이 승인을 요구해도 질문을 전달한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    await callService(service.config.socket, "/event", event(directory, "follow-up", "codex"))
    const r = service.store.get("one")!
    native.states.set(r.messageID, {
      state: "waiting",
      text: "사용자 답변 필요",
      questions: [{ id: "q1", sessionID: r.sessionID, questions: [] }],
      permissions: [],
      activity: [],
    })
    await service.wake()
    const status = await callService(service.config.socket, "/status", { requestId: "follow-up", waitMs: 2000 })
    assert.equal(status.phase, "queued")
    assert.equal(status.blockedBy.requestId, "one")
    assert.equal(status.blockedBy.questions[0].id, "q1")
    const bridge = createBridge("unused-config-path", service.config)
    await ready(bridge)
    const result = await rpc(bridge, "agent_status", { requestId: "follow-up" })
    const visible = JSON.parse(result.result.content[0].text)
    assert.equal(visible.blockedBy.questions[0].id, "q1", "Text-only MCP clients must receive pending questions too")
    assert.equal(native.submitted.length, 1)
  } finally {
    await service.close()
  }
})

test("프로젝트 경로 없이 설치하고 현재 git 프로젝트와 worktree를 자동 인식한다", (t) => {
  const { directory } = setup(t)
  const home = resolve(directory, "home"),
    project = resolve(directory, "project"),
    nested = resolve(project, "src")
  mkdirSync(nested, { recursive: true })
  mkdirSync(resolve(project, ".git"))
  const result = install({ home, hosts: ["claude", "codex"] })
  const c = loadConfig(result.config)
  assert.equal(c.autoDiscover, true)
  assert.equal(c.workspaces.length, 0)
  assert.equal(workspaceFor(c, nested)!.path, project)
  const worktree = resolve(directory, "worktree")
  mkdirSync(worktree)
  writeFileSync(resolve(worktree, ".git"), "gitdir: /unused")
  assert.equal(workspaceFor(c, worktree)!.path, worktree)
  assert.notEqual(workspaceDatabase(c, project), workspaceDatabase(c, worktree))
})

test("자동 인식 프로젝트는 서비스 재시작 후에도 보존하며 명시적 DB는 바꾸지 않는다", async (t) => {
  const { directory } = setup(t),
    project = resolve(directory, "new-project")
  mkdirSync(project)
  mkdirSync(resolve(project, ".git"))
  const c = { ...config(directory), workspaces: [], autoDiscover: true }
  let service = new HostService(c, new NativeServer())
  await service.start()
  await callService(c.socket, "/event", event(project))
  await service.wake()
  assert.deepEqual(service.store.projects(), [project])
  await service.close()
  service = new HostService(c, new NativeServer())
  try {
    assert.deepEqual(service.store.projects(), [project])
    assert.notEqual(workspaceDatabase(c, project), c.database)
  } finally {
    await service.close()
  }
})

test("실행 중 상태 질문은 새 모델 작업을 만들지 않고 즉시 진행 상태를 반환한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    const e = { ...event(directory, "status-question"), interactive: true, text: "어디까지 했어?" }
    const held = await callService(service.config.socket, "/event", e)
    assert.equal(held.phase, "held")
    const response = await callService(service.config.socket, "/control", { requestId: e.id, action: "status" })
    assert.equal(response.activeRequest.requestId, "one")
    await service.wake()
    assert.equal(native.submitted.length, 1)
    await callService(service.config.socket, "/control", { requestId: e.id, action: "status" })
    assert.equal(native.submitted.length, 1)
  } finally {
    await service.close()
  }
})

test("조건 변경은 현재 native 실행을 중단하고 같은 세션에서 원문으로 재개한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    const e = { ...event(directory, "correction"), interactive: true, text: "대소문자 구분도 없애고 계속해" }
    await callService(service.config.socket, "/event", e)
    await callService(service.config.socket, "/control", { requestId: e.id, action: "steer" })
    await service.wake()
    assert.deepEqual(native.cancelled, ["ses_native"])
    assert.equal(native.submitted[1]!.text, e.text)
    assert.equal(native.submitted[1]!.binding.sessionID, native.submitted[0]!.binding.sessionID)
    await callService(service.config.socket, "/control", { requestId: e.id, action: "steer" })
    assert.equal(native.submitted.length, 2)
  } finally {
    await service.close()
  }
})

test("대화 중 중단 요청은 현재 실행과 대기 작업을 취소하고 자체 실행하지 않는다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    await callService(service.config.socket, "/event", event(directory, "queued"))
    await callService(service.config.socket, "/event", {
      ...event(directory, "stop-now"),
      interactive: true,
      text: "멈춰",
    })
    await callService(service.config.socket, "/control", { requestId: "stop-now", action: "cancel" })
    await service.wake()
    assert.equal(service.store.get("one")!.phase, "cancelled")
    assert.equal(service.store.get("queued")!.phase, "cancelled")
    assert.equal(native.submitted.length, 1)
  } finally {
    await service.close()
  }
})

test("완료 결과는 대화 종료 시 한 번만 자동 전달한다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    c = config(directory),
    service = new HostService(c, native)
  const path = resolve(directory, "host.json")
  writeFileSync(path, JSON.stringify(c))
  await service.start()
  try {
    await callService(c.socket, "/event", event(directory))
    await service.wake()
    const record = service.store.get("one")!
    native.states.set(record.messageID, {
      state: "completed",
      text: "구현과 검증 결과",
      questions: [],
      permissions: [],
      activity: [],
    })
    await service.wake()
    const input = { hook_event_name: "Stop", cwd: directory, session_id: "claude" }
    const first = await hook(path, "claude", input)
    assert.equal(first.decision, "block")
    assert.match(first.reason, /구현과 검증 결과/)
    assert.deepEqual(await hook(path, "claude", input), {})
    assert.equal(native.submitted.length, 1)
  } finally {
    await service.close()
  }
})

test("상태 확인 대화는 실행 중인 작업이 있어도 바로 종료할 수 있다", async (t) => {
  const { directory } = setup(t),
    native = new NativeServer(),
    service = new HostService(config(directory), native)
  await service.start()
  try {
    await callService(service.config.socket, "/event", event(directory))
    await service.wake()
    await callService(service.config.socket, "/event", {
      ...event(directory, "status"),
      interactive: true,
      text: "어디까지 했어?",
    })
    await callService(service.config.socket, "/control", { requestId: "status", action: "status" })
    assert.deepEqual(
      await callService(service.config.socket, "/foreground", { host: "claude", sessionId: "claude" }),
      {},
    )
  } finally {
    await service.close()
  }
})
