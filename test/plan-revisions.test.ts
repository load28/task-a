import { snapshotCode } from "../packages/task-snapshots/src/index.ts"
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { buildTaskContext } from "#task-context"
import type { PlanNode } from "#task-domain"

const node = (id: string, dependsOnNodeIds: string[] = []): PlanNode => ({ nodeId: id, label: id, stage: "implementation", outcome: `produce ${id}`, dependsOnNodeIds,
  taskSpec: { goal: `implement ${id}`, writeScopes: [id], acceptanceCriteria: ["tested"] } })
function fixture(path = ":memory:") {
  const store = new TaskGraphStore(path), engine = new TaskGraphEngine(store)
  return { store, engine }
}
function setup(engine: TaskGraphEngine, nodes: PlanNode[]) {
  engine.createDraftPlan({ title: "Revision", goal: "Deliver features", requestText: "build", summary: "initial", nodes })
  const id = String(engine.store.db.prepare("SELECT id FROM work_plans").get()!.id)
  engine.approveWorkPlan({ planId: id, version: 1, approvalSource: "user" })
  return id
}
const taskId = (e: TaskGraphEngine, plan: string, version: number, nodeId: string) => e.store.planLinks(plan, version).find(l => l.nodeId === nodeId)!.taskId
function attest(e: TaskGraphEngine, taskId: string, content: string) {
  const dir = mkdtempSync(join(tmpdir(), "verified-source-"))
  try { writeFileSync(join(dir, "code.ts"), content); e.signals.attest(taskId, e.requireTask(taskId).attemptToken!, snapshotCode(dir)) }
  finally { rmSync(dir, { recursive: true, force: true }) }
}
function complete(e: TaskGraphEngine, id: string, content = "result") {
  const task = e.startTask(id, { agent: "native", sessionId: `session-${id}` })
  attest(e, id, content)
  return e.completeTask({ taskId: id, attemptToken: task.attemptToken, summary: "done", artifacts: [{ name: id, type: "code", content }],
    verification: { passed: true, evidence: "actual test", criteriaSatisfied: task.acceptanceCriteria.map(c => c.id) } })
}
function revise(e: TaskGraphEngine, plan: string, version: number, nodes: PlanNode[]) {
  e.reviseWorkPlan({ planId: plan, baseVersion: version - 1, summary: "changed", nodes })
  return e.approveWorkPlan({ planId: plan, version, approvalSource: "user" })
}
test("mixed completed/running/failed/pending tasks switch selectively and quarantine late completion", () => {
  const { store, engine: e } = fixture()
  try {
    const nodes = [node("done"), node("keep"), node("change"), node("failed"), node("later", ["change"])]
    const plan = setup(e, nodes), done = taskId(e, plan, 1, "done"), keep = taskId(e, plan, 1, "keep"), change = taskId(e, plan, 1, "change")
    complete(e, done); e.startTask(keep); const oldAttempt = e.startTask(change)
    const failed = taskId(e, plan, 1, "failed"); const failedAttempt = e.startTask(failed); e.failTask(failed, "tool failed", failedAttempt.attemptToken)
    const changed = nodes.map(n => n.nodeId === "change" ? { ...n, taskSpec: { ...n.taskSpec, goal: "new direction" } } : n)
    const result = revise(e, plan, 2, changed)
    assert.equal(result.plan.activeRevision, 1)
    assert.deepEqual(result.transition!.stops.map(s => s.taskId), [change])
    assert.equal(store.executionAllowed(keep), true)
    assert.equal(store.executionAllowed(change), false)
    e.completeTask({ taskId: change, attemptToken: oldAttempt.attemptToken, summary: "late", verification: { passed: true, criteriaSatisfied: [], evidence: "late" } })
    assert.equal(store.db.prepare("SELECT count(*) AS n FROM late_task_reports").get()!.n, 1)
    const stop = result.transition!.stops[0]!
    e.revisions.confirmStopped(result.transition!.id, change, stop.token, "native process exited")
    e.reconcilePlanTransition(result.transition!.id)
    assert.equal(store.findWorkPlan(plan)!.activeRevision, 2)
    assert.equal(taskId(e, plan, 2, "done"), done)
    assert.equal(taskId(e, plan, 2, "keep"), keep)
    assert.equal(e.requireTask(keep).status, "running")
    const replacement = taskId(e, plan, 2, "change")
    assert.notEqual(replacement, change)
    assert.equal(e.requireTask(replacement).goal, "new direction")
    assert.equal(e.requireTask(taskId(e, plan, 2, "later")).dependencies[0], replacement)
    assert.ok(buildTaskContext(e, replacement).reuse)
    assert.equal(e.resolveRunnable().some(r => r.task.id === change), false)
  } finally { store.close() }
})
test("completed root accepts changed/removal/new work without old children or edges blocking it", () => {
  const { store, engine: e } = fixture()
  try {
    const plan = setup(e, [node("a"), node("b", ["a"])])
    const a = taskId(e, plan, 1, "a"), b = taskId(e, plan, 1, "b")
    complete(e, a); complete(e, b)
    const root = store.findWorkPlan(plan)!.rootTaskId!
    assert.equal(e.evaluateCompletion(root).complete, true)
    const next = revise(e, plan, 2, [node("b"), node("c")])
    assert.equal(next.transition!.state, "applied")
    const newB = taskId(e, plan, 2, "b")
    assert.deepEqual(e.requireTask(newB).dependencies, [])
    assert.equal(e.requireTask(root).childIds.includes(a), false)
    assert.equal(e.evaluateCompletion(root).complete, false)
    complete(e, newB); complete(e, taskId(e, plan, 2, "c"))
    assert.equal(e.evaluateCompletion(root).complete, true)
    assert.ok(store.db.prepare("SELECT payload FROM plan_revision_results WHERE version=1").get())
    assert.equal(e.requireTask(a).status, "verified")
  } finally { store.close() }
})
test("presentation-only edits preserve execution and completed results", () => {
  const { store, engine: e } = fixture()
  try {
    const n = node("a"), plan = setup(e, [n]), id = taskId(e, plan, 1, "a")
    complete(e, id)
    const result = revise(e, plan, 2, [{ ...n, label: "new display label" }])
    assert.equal(taskId(e, plan, 2, "a"), id)
    assert.equal(result.createdTaskIds.length, 0)
    assert.equal(result.transition!.stops.length, 0)
  } finally { store.close() }
})
test("rapid revisions and process restart retain stop intent and only activate newest approved revision", () => {
  const dir = mkdtempSync(join(tmpdir(), "plan-revision-")), path = join(dir, "graph.db")
  let { store, engine: e } = fixture(path)
  try {
    const n = node("a"), plan = setup(e, [n]), id = taskId(e, plan, 1, "a")
    e.startTask(id)
    const second = revise(e, plan, 2, [{ ...n, outcome: "second" }])
    const third = revise(e, plan, 3, [{ ...n, outcome: "third" }])
    assert.equal(e.revisions.transitions().find(t => t.id === second.transition!.id)!.state, "superseded")
    store.close(); ({ store, engine: e } = fixture(path))
    const stop = third.transition!.stops[0]!
    e.revisions.confirmStopped(third.transition!.id, id, stop.token, "stopped after restart")
    e.reconcilePlanTransition(second.transition!.id)
    assert.equal(store.findWorkPlan(plan)!.activeRevision, 1)
    e.reconcilePlanTransition(third.transition!.id)
    assert.equal(store.findWorkPlan(plan)!.activeRevision, 3)
    assert.equal(store.planLinks(plan, 2).length, 0)
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }) }
})
test("direction reversion reuses an older completed artifact and running inputs stay pinned", () => {
  const { store, engine: e } = fixture()
  try {
    const n = node("a"), plan = setup(e, [n]), id = taskId(e, plan, 1, "a")
    complete(e, id)
    revise(e, plan, 2, [{ ...n, taskSpec: { ...n.taskSpec, goal: "different" } }])
    const other = taskId(e, plan, 2, "a"); complete(e, other)
    revise(e, plan, 3, [n])
    assert.equal(taskId(e, plan, 3, "a"), id)
    const p = e.createTask({ title: "p", goal: "p" }); const first = complete(e, p.id)
    const c = e.createTask({ title: "c", goal: "c", dependencies: [p.id] }); e.startTask(c.id)
    const initial = buildTaskContext(e, c.id)
    e.reopenTask(p.id, "new version"); complete(e, p.id, "new result")
    assert.deepEqual(buildTaskContext(e, c.id).inputArtifacts, initial.inputArtifacts)
    assert.equal(initial.inputArtifacts[0]!.version, first.outputArtifactRefs[0]!.version)
  } finally { store.close() }
})

test("late attempt publications and failures cannot overwrite a restarted current task", () => {
  const { store, engine: e } = fixture()
  try {
    const plan = setup(e, [node("work")]), id = taskId(e, plan, 1, "work")
    const old = e.startTask(id)
    e.failTask(id, "retry", old.attemptToken)
    e.reopenTask(id, "retry")
    const current = e.startTask(id)
    const output = e.publishArtifact({ taskId: id, attemptToken: current.attemptToken, name: "current", type: "code", content: "new" })
    e.publishArtifact({ taskId: id, attemptToken: old.attemptToken, name: "current", type: "code", content: "late" })
    e.failTask(id, "late failure", old.attemptToken)
    assert.equal(e.requireTask(id).status, "running")
    assert.deepEqual(e.requireTask(id).outputArtifactRefs, [{ artifactId: output.artifactId, version: output.version }])
    assert.equal(store.findArtifactByName("current")!.latestVersion, 1)
  } finally { store.close() }
})

test("root requirements replace prior constraints and invalidate completed work", () => {
  const { store, engine: e } = fixture()
  try {
    const nodes = [node("work")], plan = setup(e, nodes), old = taskId(e, plan, 1, "work")
    complete(e, old)
    e.reviseWorkPlan({ planId: plan, baseVersion: 1, summary: "new constraints", nodes, requirements: ["오프라인 실행"], constraints: ["외부 네트워크 금지"] })
    e.approveWorkPlan({ planId: plan, version: 2, approvalSource: "user" })
    const next = taskId(e, plan, 2, "work")
    assert.notEqual(next, old)
    assert.equal(e.requireTask(old).status, "verified")
    assert.match(JSON.stringify(buildTaskContext(e, next)), /오프라인 실행/)
    e.reviseWorkPlan({ planId: plan, baseVersion: 2, summary: "replace constraints", nodes, requirements: [], constraints: ["승인된 네트워크 허용"] })
    e.approveWorkPlan({ planId: plan, version: 3, approvalSource: "user" })
    const context = JSON.stringify(buildTaskContext(e, taskId(e, plan, 3, "work")))
    assert.match(context, /승인된 네트워크 허용/)
    assert.doesNotMatch(context, /외부 네트워크 금지/)
  } finally { store.close() }
})

test("identical dependency content reuses verification only through explicit adoption", () => {
  const { store, engine: e } = fixture()
  try {
    const nodes = [node("producer"), node("consumer", ["producer"])], plan = setup(e, nodes)
    const finishProducer = (id: string) => {
      const task = e.startTask(id)
      attest(e, id, "same bytes")
      e.completeTask({ taskId: id, attemptToken: task.attemptToken, summary: "done", artifacts: [{ name: "stable-api", type: "code", content: "same bytes" }],
        verification: { passed: true, criteriaSatisfied: task.acceptanceCriteria.map(c => c.id) } })
    }
    finishProducer(taskId(e, plan, 1, "producer"))
    const oldConsumer = taskId(e, plan, 1, "consumer")
    complete(e, oldConsumer)
    revise(e, plan, 2, nodes.map(n => n.nodeId === "producer" ? { ...n, taskSpec: { ...n.taskSpec, goal: "new implementation" } } : n))
    finishProducer(taskId(e, plan, 2, "producer"))
    const consumer = taskId(e, plan, 2, "consumer")
    e.resolveRunnable()
    assert.equal(e.requireTask(consumer).status, "ready")
    assert.equal(e.reuseTask(consumer).reused, true)
    assert.equal(e.requireTask(consumer).status, "verified")
    const priorRef = e.requireTask(oldConsumer).outputArtifactRefs[0]!, newRef = e.requireTask(consumer).outputArtifactRefs[0]!
    assert.equal(newRef.artifactId, priorRef.artifactId)
    assert.ok(newRef.version > priorRef.version)
    assert.equal(e.requireArtifactVersion(newRef).content, e.requireArtifactVersion(priorRef).content)
    assert.deepEqual(e.requireArtifactVersion(newRef).inputs, e.requireTask(taskId(e, plan, 2, "producer")).outputArtifactRefs)
    assert.equal(store.currentAttempt(consumer)!.worker!.agent, "verified-result-cache")
  } finally { store.close() }
})
