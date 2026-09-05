import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SessionOutbox, transcriptDelta } from "../packages/host-integration/src/lifecycle.ts"

test("Codex launcher preserves CLI arguments and exit code without selecting a model", () => {
  const directory = mkdtempSync(join(tmpdir(), "codex-launch-test-"))
  const captured = join(directory, "args.json")
  try {
    writeFileSync(join(directory, "codex"), '#!/usr/bin/env node\nrequire("node:fs").writeFileSync(process.env.CAPTURE_ARGS, JSON.stringify(process.argv.slice(2))); process.exit(7)\n', { mode: 0o700 })
    const result = spawnSync(process.execPath, ["scripts/codex-task.ts", "resume", "session with spaces"], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, CAPTURE_ARGS: captured, TASK_AGENT_OUTBOX: join(directory, "outbox.db"), TASK_AGENT_RESOURCE: "https://example.invalid/mcp", TASK_AGENT_ACCESS_TOKEN: "" },
      timeout: 10000,
    })
    assert.equal(result.status, 7, result.stderr?.toString())
    assert.deepEqual(JSON.parse(readFileSync(captured, "utf8")), ["resume", "session with spaces"])
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test("Codex rollout captures canonical text without duplicate events or tool content", () => {
  const records = [
    { type: "session_meta", payload: {} },
    { type: "event_msg", payload: { type: "user_message", message: "중복" } },
    { type: "response_item", payload: { type: "function_call_output", output: "비밀" } },
    { type: "response_item", payload: { type: "message", role: "developer", content: [{ type: "input_text", text: "지침" }] } },
    { type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "분리하자" }] } },
    { type: "response_item", payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "반영했습니다" }] } },
  ]
  const bytes = Buffer.from(records.map((r) => JSON.stringify(r)).join("\n") + "\n")
  assert.equal(transcriptDelta(bytes, 0, "codex").conversation, "user: 분리하자\nassistant: 반영했습니다")
  assert.equal(transcriptDelta(bytes, bytes.length, "codex").conversation, "")
  assert.throws(() => transcriptDelta(Buffer.from('{"type":"new_format"}\n'), 0, "codex"), /Unsupported/)
})

test("Codex SessionEnd persists offline and a restarted worker keeps Codex provenance", async () => {
  const directory = mkdtempSync(join(tmpdir(), "codex-outbox-test-"))
  const path = join(directory, "outbox.db")
  const transcript = join(directory, "rollout.jsonl")
  const destination = "https://example.invalid/mcp"
  let box = new SessionOutbox(path, destination, "codex-cli-hook")
  try {
    writeFileSync(transcript, "")
    // realpath matters on macOS where /var is a symlink to /private/var.
    const { realpathSync } = await import("node:fs")
    box.bind("s", "t", realpathSync(transcript), 0)
    box.close()
    writeFileSync(transcript, JSON.stringify({ type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "확정하자" }] } }) + "\n")
    const run = (transcript_path: string | null) => spawnSync(process.execPath, ["scripts/session-hook.ts", "hook"], {
      input: JSON.stringify({ session_id: "s", hook_event_name: "SessionEnd", transcript_path }),
      env: { ...process.env, TASK_AGENT_HOST: "codex", TASK_AGENT_RESOURCE: destination, TASK_AGENT_OUTBOX: path, TASK_AGENT_ACCESS_TOKEN: "" },
      timeout: 3000,
    })
    assert.equal(run(null).status, 1)
    assert.equal(run(transcript).status, 0)
    assert.equal(run(transcript).status, 0)
    box = new SessionOutbox(path, destination, "codex-cli-hook")
    assert.equal(box.pending(), 2)
    const calls: string[] = []
    await box.drain({ async sync(request) { assert.equal(request.source.agent, "codex-cli-hook"); calls.push("sync") }, async handoff() { calls.push("handoff") } })
    assert.deepEqual(calls, ["sync", "handoff"])
  } finally { box.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("session exit syncs pending text before handoff and repeated exit is idempotent", async () => {
  const box = new SessionOutbox(":memory:", "destination")
  try {
    box.bind("session", "task", "/transcript", 0)
    box.capture("session", 0, 10, "user: 확정하자", true)
    box.capture("session", 10, 10, "", true)
    const calls: string[] = []
    await box.drain({ async sync(request) { assert.equal(request.taskId, "task"); calls.push("sync") }, async handoff() { calls.push("handoff"); return { text: "인계" } } })
    assert.deepEqual(calls, ["sync", "handoff"])
    assert.equal(box.pending(), 0)
    assert.match(String(box.latestHandoff("session")), /인계/)
  } finally { box.close() }
})

test("failed sync survives restart, keeps its request key and does not hand off early", async () => {
  const directory = mkdtempSync(join(tmpdir(), "task-outbox-test-"))
  const path = join(directory, "outbox.db")
  let box = new SessionOutbox(path, "destination")
  try {
    box.bind("session", "task", "/transcript", 0)
    box.capture("session", 0, 1, "user: 결정", true)
    let key = ""
    await assert.rejects(box.drain({ async sync(request) { key = request.idempotencyKey; throw new Error("401") }, async handoff() { assert.fail("Must not run") } }), /401/)
    assert.equal(box.pending(), 2)
    box.close()
    box = new SessionOutbox(path, "destination")
    await box.drain({ async sync(request) { assert.equal(request.idempotencyKey, key) }, async handoff() { return "ready" } })
    assert.equal(box.pending(), 0)
  } finally { box.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("failed handoff retries without repeating acknowledged sync", async () => {
  const box = new SessionOutbox(":memory:", "destination")
  try {
    box.bind("s", "t", "/transcript", 0)
    box.capture("s", 0, 10, "user: 결정", true)
    await assert.rejects(box.drain({ async sync() {}, async handoff() { throw new Error("offline") } }), /offline/)
    assert.equal(box.pending(), 1)
    await box.drain({ async sync() { assert.fail("Already saved") }, async handoff() { return "ready" } })
    assert.equal(box.pending(), 0)
  } finally { box.close() }
})

test("concurrent workers do not duplicate delivery and task switching is refused", async () => {
  const box = new SessionOutbox(":memory:", "destination")
  try {
    box.bind("s", "t", "/transcript", 0)
    assert.throws(() => box.bind("s", "another", "/transcript", 0), /already bound/)
    box.capture("s", 0, 10, "user: 결정", true)
    assert.throws(() => box.capture("s", 0, 11, "stale", true), /concurrently/)
    let calls = 0
    const client = { async sync() { calls++; await Promise.resolve() }, async handoff() { calls++ } }
    await Promise.all([box.drain(client), box.drain(client)])
    assert.equal(calls, 2)
  } finally { box.close() }
})

test("transcript capture excludes tool/thinking content and waits for complete JSONL", () => {
  const lines = [
    { type: "user", message: { role: "user", content: "분리하자" } },
    { type: "assistant", message: { role: "assistant", content: [{ type: "thinking", thinking: "private" }, { type: "text", text: "반영했습니다" }] } },
    { type: "user", message: { role: "user", content: [{ type: "tool_result", content: "file secret" }] } },
    { type: "assistant", isSidechain: true, message: { role: "assistant", content: "other task" } },
  ].map((item) => JSON.stringify(item)).join("\n") + "\n"
  const result = transcriptDelta(Buffer.from(lines + '{"partial"'), 0)
  assert.equal(result.conversation, "user: 분리하자\nassistant: 반영했습니다")
  assert.equal(result.nextCursor, Buffer.byteLength(lines))
  assert.equal(transcriptDelta(Buffer.from(lines), result.nextCursor).conversation, "")
  assert.throws(() => transcriptDelta(Buffer.from(""), result.nextCursor), /truncated/)
})

test("pausing stops capture and pending transmission without deleting recoverable data", async () => {
  const box = new SessionOutbox(":memory:", "destination")
  try {
    box.bind("s", "t", "/transcript", 0)
    box.capture("s", 0, 10, "user: 보류할 대화", true)
    box.pause("s")
    assert.throws(() => box.capture("s", 10, 20, "더 수집하지 않음", true), /paused/)
    await box.drain({ async sync() { assert.fail("Paused") }, async handoff() { assert.fail("Paused") } })
    assert.equal(box.pending(), 2)
  } finally { box.close() }
})
