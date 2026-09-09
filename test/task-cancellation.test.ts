import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { requestCancellation, advanceCancellation } from "../packages/task-instances/src/cancellation.ts"
import type { InstanceManager } from "../packages/task-instances/src/manager.ts"

test("취소는 새 실행과 늦은 완료를 차단하고 연결 복구 후 예약을 해제한다", async t => {
  const graph = createGraphRuntime(":memory:")
  t.after(() => graph.close())
  const a = graph.engine.createTask({ title: "실행", goal: "실행" })
  const b = graph.engine.createTask({ title: "대기", goal: "대기" })
  const scheduler = new TaskScheduler(graph.engine)
  scheduler.claim(a.id, { sessionId: "ses_worker" })
  requestCancellation(graph.engine, [a.id, b.id])
  assert.equal(graph.engine.resolveRunnable().length, 0)
  assert.throws(() => graph.engine.startTask(b.id), /fenced/)
  graph.engine.completeTask({ taskId: a.id, summary: "늦은 완료", verification: { passed: true } })
  assert.equal(graph.engine.requireTask(a.id).status, "failed")
  let rows = await advanceCancellation(graph.engine, undefined, { stopAndInspect: async () => { throw new Error("connection refused") } })
  assert.match(rows.find(r => r.taskId === a.id)!.error!, /connection refused/)
  assert.equal(scheduler.status().active.length, 1)
  rows = await advanceCancellation(graph.engine, undefined, { stopAndInspect: async () => ({ stopped: true, evidence: "idle" }) })
  assert.ok(rows.every(r => r.state === "stopped"))
  assert.equal(scheduler.status().active.length, 0)
})

test("세션 정보가 없는 기존 예약은 프로젝트 종료 증거가 있어야 해제한다", async t => {
  const graph = createGraphRuntime(":memory:")
  t.after(() => graph.close())
  const task = graph.engine.createTask({ title: "이전 작업", goal: "이전 작업" })
  const scheduler = new TaskScheduler(graph.engine)
  scheduler.claim(task.id, {})
  graph.engine.failTask(task.id, "기존 실패")
  requestCancellation(graph.engine, [task.id])
  await advanceCancellation(graph.engine)
  assert.equal(scheduler.status().active.length, 1)
  await advanceCancellation(graph.engine, undefined, undefined, { stopped: true, evidence: "전체 세션 idle 확인" })
  assert.equal(scheduler.status().active.length, 0)
})

test("Kubernetes 취소는 최신 세대의 실제 중지 관찰 전까지 완료되지 않는다", async t => {
  const graph = createGraphRuntime(":memory:")
  t.after(() => graph.close())
  const task = graph.engine.createTask({ title: "컨테이너", goal: "컨테이너" })
  graph.engine.startTask(task.id, { agent: "kubernetes", instanceTaskId: "physical" })
  requestCancellation(graph.engine, [task.id])
  let generation = 1
  const instances = { suspend: async (id: string) => { assert.equal(id, "physical") }, load: async () => ({ spec: { desiredState: "Suspended" }, metadata: { uid: "uid", generation: 2 }, status: { phase: "Suspended", observedGeneration: generation } }) } as unknown as InstanceManager
  assert.equal((await advanceCancellation(graph.engine, instances))[0]!.state, "requested")
  generation = 2
  assert.equal((await advanceCancellation(graph.engine, instances))[0]!.state, "stopped")
})
