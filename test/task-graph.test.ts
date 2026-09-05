import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"

function fixture() {
  const store = new TaskGraphStore()
  return { store, engine: new TaskGraphEngine(store) }
}

test("a prompt becomes a persistent root task and decomposes progressively", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const root = engine.createTask({
    title: "TT Match 개선",
    goal: "match 시스템을 구조적으로 개선한다",
    requirements: [{ description: "특정 케이스 hack 금지", kind: "constraint" }],
  })
  assert.equal(root.status, "ready")
  const { parent, children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "req", title: "Requirement", goal: "요구사항 정리", category: "requirement" },
      { key: "research", title: "Research", goal: "현재 구조 분석", category: "research" },
      { key: "arch", title: "Architecture", goal: "아키텍처 설계", category: "architecture", dependencies: ["req", "research"] },
      { key: "impl", title: "Implementation", goal: "구현", category: "implementation", dependencies: ["arch"] },
      { key: "qa", title: "Final QA", goal: "최종 검증", category: "qa", dependencies: ["impl"] },
    ],
  })
  assert.equal(parent.childIds.length, 5)
  assert.equal(parent.status, "pending")
  const runnable = engine.resolveRunnable(root.id)
  assert.deepEqual(runnable.map((item) => item.task.title).sort(), ["Requirement", "Research"])
  assert.equal(runnable[0]!.rootId, root.id)
  const architecture = children[2]!
  assert.equal(engine.requireTask(architecture.id).status, "pending")
  const found = engine.searchTasks("match")
  assert.equal(found[0]!.id, root.id)
})

test("decomposition proposals are validated before mutation", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const root = engine.createTask({ title: "Root", goal: "goal" })
  assert.throws(() => engine.proposeDecomposition({ taskId: "missing", children: [{ title: "a", goal: "b" }] }), /Missing parent/)
  assert.throws(() => engine.proposeDecomposition({ taskId: root.id, children: [] }), /at least one child/)
  assert.throws(() => engine.proposeDecomposition({
    taskId: root.id,
    children: [{ title: "A", goal: "a" }, { title: " a ", goal: "duplicate" }],
  }), /Duplicate responsibility/)
  assert.throws(() => engine.proposeDecomposition({
    taskId: root.id,
    children: [{ key: "a", title: "A", goal: "a", dependencies: ["b"] }, { key: "b", title: "B", goal: "b", dependencies: ["a"] }],
  }), /cycle/)
  assert.throws(() => engine.proposeDecomposition({
    taskId: root.id,
    children: [{ title: "A", goal: "a", dependencies: ["nowhere"] }],
  }), /Invalid dependency/)
  assert.throws(() => engine.proposeDecomposition({
    taskId: root.id,
    children: [{ title: "A", goal: "a", dependencies: [root.id] }],
  }), /ancestor/)
  assert.equal(engine.requireTask(root.id).childIds.length, 0)
  const { children } = engine.proposeDecomposition({ taskId: root.id, children: [{ title: "Child", goal: "c" }] })
  engine.startTask(children[0]!.id)
  engine.completeTask({ taskId: children[0]!.id, summary: "done", verification: { passed: true } })
  assert.equal(engine.requireTask(root.id).status, "verified")
  assert.throws(() => engine.proposeDecomposition({ taskId: root.id, children: [{ title: "Late", goal: "l" }] }), /reopen/)
})

test("atomic lifecycle: engine decides transitions from submitted results", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const root = engine.createTask({ title: "Root", goal: "goal" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "a", title: "A", goal: "a", acceptanceCriteria: ["unit tests pass"] },
      { key: "b", title: "B", goal: "b", dependencies: ["a"] },
    ],
  })
  const [a, b] = [children[0]!, children[1]!]
  assert.equal(engine.requireTask(a.id).status, "ready")
  assert.equal(engine.requireTask(b.id).status, "pending")
  assert.throws(() => engine.startTask(b.id), /waiting on dependencies/)
  assert.throws(() => engine.startTask(root.id), /atomic/)
  engine.startTask(a.id, { agent: "claude", sessionId: "s1" })
  assert.equal(engine.requireTask(a.id).status, "running")
  const criterion = engine.requireTask(a.id).acceptanceCriteria[0]!
  assert.throws(() => engine.completeTask({ taskId: a.id, summary: "done", verification: { passed: true } }), /Acceptance criteria/)
  const implemented = engine.completeTask({ taskId: a.id, summary: "done", verification: { passed: false, evidence: "test failed" } })
  assert.equal(implemented.status, "implemented")
  const verified = engine.completeTask({ taskId: a.id, summary: "fixed", verification: { passed: true, criteriaSatisfied: [criterion.id] } })
  assert.equal(verified.status, "verified")
  assert.equal(engine.requireTask(b.id).status, "ready")
  engine.startTask(b.id)
  engine.completeTask({ taskId: b.id, summary: "done", verification: { passed: true } })
  assert.equal(engine.requireTask(root.id).status, "verified")
  const load = engine.loadTask(root.id)
  assert.equal(load.completion.complete, true)
  assert.deepEqual(load.summary.completedWork.sort(), ["A", "B"])
})

test("failure blocks dependents and composite parents; reopen recovers", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const root = engine.createTask({ title: "Root", goal: "goal" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "a", title: "A", goal: "a" },
      { key: "b", title: "B", goal: "b", dependencies: ["a"] },
    ],
  })
  const [a, b] = [children[0]!, children[1]!]
  engine.startTask(a.id)
  engine.failTask(a.id, "cannot proceed")
  assert.equal(engine.requireTask(a.id).status, "failed")
  assert.equal(engine.requireTask(b.id).status, "blocked")
  assert.equal(engine.requireTask(root.id).status, "blocked")
  assert.equal(engine.resolveRunnable(root.id).length, 0)
  engine.reopenTask(a.id, "retry with new approach")
  assert.equal(engine.requireTask(a.id).status, "ready")
  assert.equal(engine.requireTask(b.id).status, "pending")
  assert.notEqual(engine.requireTask(root.id).status, "blocked")
  const events = store.eventsFor(a.id).map((event) => event.type)
  assert.ok(events.includes("TASK_FAILED"))
  assert.ok(events.includes("TASK_REOPENED"))
})

test("dependency cycles across hierarchy and dependency graph are rejected", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const a = engine.createTask({ title: "A", goal: "a" })
  const b = engine.createTask({ title: "B", goal: "b", dependencies: [a.id] })
  engine.createTask({ title: "C", goal: "c", dependencies: [b.id] })
  assert.throws(() => engine.proposeDecomposition({
    taskId: a.id,
    children: [{ title: "inner", goal: "i", dependencies: [b.id] }],
  }), /cycle/)
})

test("recursive decomposition keeps hierarchy and dependencies separate", (t) => {
  const { store, engine } = fixture()
  t.after(() => store.close())
  const root = engine.createTask({ title: "Implementation", goal: "구현" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "ir", title: "Pattern IR", goal: "IR" },
      { key: "binding", title: "Binding Analyzer", goal: "binding", dependencies: ["ir"] },
      { key: "checker", title: "Checker Integration", goal: "checker", dependencies: ["binding"] },
    ],
  })
  const binding = children[1]!
  const deeper = engine.proposeDecomposition({
    taskId: binding.id,
    children: [
      { key: "alt", title: "Alternative Pattern", goal: "alt" },
      { key: "nested", title: "Nested Pattern", goal: "nested" },
      { key: "merge", title: "Constraint Merge", goal: "merge", dependencies: ["alt", "nested"] },
    ],
  })
  assert.equal(deeper.parent.parentId, root.id)
  assert.equal(engine.requireTask(deeper.children[2]!.id).dependencies.length, 2)
  const runnable = engine.resolveRunnable(root.id)
  assert.deepEqual(runnable.map((item) => item.task.title).sort(), ["Alternative Pattern", "Nested Pattern", "Pattern IR"])
  assert.deepEqual(engine.pathOf(deeper.children[0]!.id), ["Implementation", "Binding Analyzer", "Alternative Pattern"])
})
