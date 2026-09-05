import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, realpathSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { HostBridge } from "../packages/host-integration/src/bridge.ts"
import { LoginRequiredError } from "../packages/host-integration/src/oauth.ts"
import { SessionOutbox, transcriptDelta, latestUserMessageStart } from "../packages/host-integration/src/lifecycle.ts"

test("conversation tool returns login link then binds selected work without any CLI or user-entered ID", async () => {
  const directory = mkdtempSync(join(tmpdir(), "host-bridge-"))
  const transcript = join(directory, "rollout.jsonl")
  writeFileSync(transcript, JSON.stringify({ type: "session_meta" }) + "\n")
  const box = new SessionOutbox(":memory:", "server", "codex-cli-hook")
  let authenticated = false
  const login = { async start() { return { status: "login_required", loginUrl: "https://login.example/authorize" } }, status() { return { status: authenticated ? "authenticated" : "login_required" } } }
  let selected = "task-a"
  const bridge = new HostBridge(box, async (name, args) => {
    assert.equal(name, "task_context")
    assert.equal(args.recordingSession, undefined)
    assert.equal(args.record, undefined)
    if (!authenticated) throw new LoginRequiredError()
    return { context: { task: { id: selected } }, text: "이전 결정" }
  }, login)
  try {
    const handle = box.registerHostSession("host-session", realpathSync(transcript))
    const request = { query: "compiler 작업 이어가자", record: true, recordingSession: handle }
    const needsLogin = await bridge.call("task_context", request)
    assert.equal(needsLogin.status, "login_required")
    assert.equal(box.binding("host-session"), undefined)
    authenticated = true
    const connected = await bridge.call("task_context", request)
    assert.equal(connected.recording.connected, true)
    assert.equal(box.binding("host-session")?.task, "task-a")
    const bound = box.binding("host-session")!
    const bytes = Buffer.from(JSON.stringify({ type: "session_meta" }) + "\n" + JSON.stringify({ type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "정규화 단계를 분리하자" }] } }) + "\n")
    const delta = transcriptDelta(bytes, bound.cursor, "codex")
    box.capture(bound.id, bound.cursor, delta.nextCursor, delta.conversation, false)
    assert.equal(box.pending(), 1)
    selected = "task-b"
    await assert.rejects(bridge.call("task_context", request), /already bound/)
    assert.equal(box.binding("host-session")?.task, "task-a")
    assert.equal((await bridge.call("task_recording", { recordingSession: handle, action: "pause" })).paused, true)
    selected = "task-a"
    await assert.rejects(bridge.call("task_context", request), /paused/)
  } finally { box.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("read-only context never starts recording; missing session handle never silently binds", async () => {
  const box = new SessionOutbox(":memory:", "server")
  let reads = 0
  const bridge = new HostBridge(box, async () => { reads++; return { context: { task: { id: "task" } } } }, { async start() { return {} }, status() { return {} } })
  try {
    await bridge.call("task_context", { query: "진행 상황만 알려줘" })
    assert.equal(reads, 1)
    await assert.rejects(bridge.call("task_context", { query: "이어가자", record: true }), /SessionStart/)
    await assert.rejects(bridge.call("task_context", { query: "이어가자", record: true, recordingSession: "invented" }), /Unknown/)
    assert.equal(reads, 1)
    assert.equal(box.pending(), 0)
  } finally { box.close() }
})

test("installed connection serves MCP and registers hooks without environment exports or a wrapper", async () => {
  const directory = mkdtempSync(join(tmpdir(), "host-installed-"))
  const configPath = join(directory, "connection.json")
  const transcript = join(directory, "rollout.jsonl")
  const config = { TASK_AGENT_HOST: "codex", TASK_AGENT_RESOURCE: "https://tasks.example/mcp", TASK_AGENT_OUTBOX: join(directory, "outbox.db"), TASK_AGENT_CREDENTIALS: join(directory, "credentials.db"), TASK_AGENT_OAUTH_ISSUER: "https://issuer.example/pool", TASK_AGENT_OAUTH_ORIGIN: "https://login.example", TASK_AGENT_OAUTH_CLIENT_ID: "work-client" }
  writeFileSync(configPath, JSON.stringify(config))
  writeFileSync(transcript, "")
  const client = new Client({ name: "synthetic-host", version: "1" })
  try {
    const hook = spawnSync(process.execPath, ["scripts/host-entry.ts", "hook", configPath], { input: JSON.stringify({ hook_event_name: "SessionStart", session_id: "session", transcript_path: transcript }), timeout: 3000 })
    assert.equal(hook.status, 0, hook.stderr.toString())
    const context = JSON.parse(hook.stdout.toString()).hookSpecificOutput.additionalContext
    const handle = context.match(/handle: ([a-f0-9-]+)/)[1]
    await client.connect(new StdioClientTransport({ command: process.execPath, args: ["scripts/host-entry.ts", "mcp", configPath], stderr: "pipe" }))
    assert.match(client.getInstructions()!, /Never ask the user to run/)
    const tools = await client.listTools()
    assert.equal(tools.tools.length, 6)
    assert.ok(tools.tools.some((tool) => tool.name === "task_connect"))
    const status = await client.callTool({ name: "task_recording", arguments: { recordingSession: handle, action: "status" } })
    assert.equal((status.structuredContent as Record<string, unknown>)?.connected, false)
    assert.equal((status.structuredContent as Record<string, unknown>)?.pending, 0)
  } finally { await client.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("recording includes the initiating decision but excludes earlier unrelated conversation", () => {
  const row = (text: string) => JSON.stringify({ type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text }] } }) + "\n"
  const older = row("이전의 무관한 대화")
  const bytes = Buffer.from(older + row("compiler 작업 이어가자. 정규화는 분리하자"))
  const start = latestUserMessageStart(bytes, "codex")
  assert.equal(start, Buffer.byteLength(older))
  assert.equal(transcriptDelta(bytes, start, "codex").conversation, "user: compiler 작업 이어가자. 정규화는 분리하자")
})
