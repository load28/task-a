import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync, symlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { TaskScheduler, normalizeScopes } from "../packages/task-engine/src/scheduling.ts"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

test("독립 작업은 병렬 점유하고 겹치는 범위·동시 실행 상한·의존 작업은 대기한다", () => {
  const graph = createGraphRuntime(":memory:")
  const scheduler = new TaskScheduler(graph.engine, 2)
  const make = (title: string, writeScopes: string[], dependencies: string[] = []) => graph.engine.createTask({ title, goal: title, writeScopes, dependencies })
  try {
    const a = make("컴포넌트 A", ["src/a.ts"]), b = make("컴포넌트 B", ["src/b.ts"])
    const overlap = make("전체 src", ["src"]), build = make("최종 빌드", ["."], [a.id, b.id])
    scheduler.claim(a.id, {})
    assert.throws(() => scheduler.claim(overlap.id, {}), /reserved/)
    scheduler.claim(b.id, {})
    assert.throws(() => scheduler.claim(make("작업 C", ["other"]).id, {}), /limit/)
    assert.throws(() => scheduler.expand(a.id, ["src/b.ts"]), /blocked/)
    assert.deepEqual(graph.engine.loadTask(a.id).task.writeScopes, ["src/a.ts"])
    scheduler.expand(a.id, ["src/a.test.ts"])
    graph.engine.completeTask({ taskId: a.id, summary: "완료", verification: { passed: true, evidence: "검사 통과" } })
    scheduler.release(a.id, true)
    assert.throws(() => scheduler.claim(build.id, {}), /reserved|dependencies/)
    graph.engine.completeTask({ taskId: b.id, summary: "완료", verification: { passed: true, evidence: "검사 통과" } })
    scheduler.release(b.id, true)
    assert.equal(scheduler.claim(build.id, {}).status, "running")
    assert.equal(scheduler.status().active.length, 1)
  } finally { graph.close() }
})

test("재시작·실패 이후에도 예약을 유지하고 작업자 종료 확인 후에만 해제한다", (t) => {
  const dir = mkdtempSync(resolve(tmpdir(), "task-reservations-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = resolve(dir, "graph.db")
  const first = createGraphRuntime(path)
  const a = first.engine.createTask({ title: "A", goal: "A", writeScopes: ["src"] })
  const b = first.engine.createTask({ title: "B", goal: "B", writeScopes: ["src/file.ts"] })
  new TaskScheduler(first.engine).claim(a.id, { sessionId: "worker-a" })
  first.close()
  const second = createGraphRuntime(path)
  const scheduler = new TaskScheduler(second.engine)
  try {
    second.engine.failTask(a.id, "작업 중단")
    assert.throws(() => scheduler.claim(b.id, {}), /reserved/)
    assert.throws(() => scheduler.release(a.id, false), /stopped/)
    scheduler.release(a.id, true)
    assert.equal(scheduler.claim(b.id, {}).status, "running")
  } finally { second.close() }
})

test("경로 경계와 심볼릭 링크 별칭으로 범위 충돌 검사를 우회하지 않는다", (t) => {
  assert.throws(() => normalizeScopes(["../outside"]), /escapes/)
  assert.throws(() => normalizeScopes(["src/**"]), /literal/)
  assert.deepEqual(normalizeScopes(["src/./A.ts", "src/a.ts"]), ["src/a.ts"])
  const dir = mkdtempSync(resolve(tmpdir(), "task-scope-alias-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  mkdirSync(resolve(dir, "real"))
  symlinkSync(resolve(dir, "real"), resolve(dir, "alias"))
  const graph = createGraphRuntime(":memory:"), scheduler = new TaskScheduler(graph.engine, 3, dir)
  try {
    const a = graph.engine.createTask({ title: "원본", goal: "수정", writeScopes: ["real/file"] })
    const b = graph.engine.createTask({ title: "별칭", goal: "수정", writeScopes: ["alias/file"] })
    scheduler.claim(a.id, {})
    assert.throws(() => scheduler.claim(b.id, {}), /reserved/)
  } finally { graph.close() }
})

test("별도 MCP 작업자 프로세스가 동시에 같은 파일을 점유하면 하나만 시작한다", async (t) => {
  const dir = mkdtempSync(resolve(tmpdir(), "task-parallel-mcp-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const path = resolve(dir, "graph.db"), graph = createGraphRuntime(path)
  const a = graph.engine.createTask({ title: "작업 A", goal: "수정", writeScopes: ["same.ts"] })
  const b = graph.engine.createTask({ title: "작업 B", goal: "수정", writeScopes: ["same.ts"] })
  graph.close()
  const clients = [new Client({ name: "a", version: "1" }), new Client({ name: "b", version: "1" })]
  try {
    for (const client of clients) await client.connect(new StdioClientTransport({ command: process.execPath, args: [resolve("scripts/graph-mcp.ts"), path], stderr: "pipe" }))
    const results = await Promise.allSettled(clients.map((client, index) => client.callTool({ name: "task_start", arguments: { taskId: [a.id, b.id][index], operationId: `claim-${index}` } })))
    const successes = results.filter((r) => r.status === "fulfilled" && !r.value.isError)
    assert.equal(successes.length, 1)
    const persisted = createGraphRuntime(path)
    try { assert.equal(new TaskScheduler(persisted.engine).status().active.length, 1) }
    finally { persisted.close() }
  } finally { await Promise.all(clients.map((c) => c.close())) }
})
