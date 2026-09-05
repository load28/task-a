import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskAgentService } from "#task-agent-core"
import { buildTaskContext, formatTaskContext } from "#task-context"

test("learnings recorded at completion feed the next run on the same topic", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const root = engine.createTask({ title: "Match Core", goal: "match core" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "first", title: "Binding Analyzer", goal: "binding 분석기 구현" },
      { key: "second", title: "Binding Analyzer 재구현", goal: "binding 분석기 개선", dependencies: ["first"] },
    ],
  })
  const [first, second] = [children[0]!, children[1]!]
  engine.startTask(first.id)
  engine.completeTask({
    taskId: first.id,
    summary: "done",
    verification: { passed: true },
    learnings: [
      { description: "binding 추출은 narrowing 이후에 해야 한다", kind: "pitfall", tags: ["Binding", "narrowing"] },
      { description: "전혀 관련 없는 배포 파이프라인 메모", tags: ["deploy"] },
    ],
  })
  assert.equal(store.allLearnings().length, 2)
  assert.ok(store.eventsFor(first.id).some((event) => event.type === "LEARNING_RECORDED"))

  const context = buildTaskContext(engine, second.id)
  assert.equal(context.learnings.length, 1)
  assert.equal(context.learnings[0]!.kind, "pitfall")
  assert.ok(context.learnings[0]!.description.includes("narrowing"))
  assert.ok(formatTaskContext(context).includes("[pitfall]"))
  assert.equal(store.findLearning(context.learnings[0]!.id)!.appliedCount, 1)

  const ownContext = buildTaskContext(engine, first.id)
  assert.equal(ownContext.learnings.length, 0)
})

test("learning inputs are validated by the engine", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  assert.throws(() => engine.recordLearning({ description: " " }), /description/)
  assert.throws(() => engine.recordLearning({ description: "ok", kind: "wisdom" as never }), /Invalid learning kind/)
  assert.throws(() => engine.recordLearning({ description: "ok", sourceTaskId: "missing" }), /Task not found/)
  assert.throws(() => engine.recordLearning({ description: "ok", importance: 11 }), /importance/)
  assert.throws(() => engine.recordLearning({ description: "ok", importance: 2.5 }), /importance/)
  const learning = engine.recordLearning({ description: "OK 학습", tags: [" Match ", "match", ""], importance: 8 })
  assert.deepEqual(learning.tags, ["match"])
  assert.equal(learning.kind, "insight")
  assert.equal(learning.importance, 8)
  assert.equal(learning.status, "active")
})

test("superseding keeps history but removes learnings from retrieval", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const outdated = engine.recordLearning({ description: "binding 추출은 narrowing 전에 수행한다", kind: "convention", tags: ["binding"] })
  const replacement = engine.recordLearning({ description: "binding 추출은 narrowing 이후에 수행해야 한다", kind: "convention", tags: ["binding"] })
  assert.throws(() => engine.supersedeLearning({ learningId: "missing", reason: "x" }), /Learning not found/)
  assert.throws(() => engine.supersedeLearning({ learningId: outdated.id, by: outdated.id, reason: "x" }), /supersede itself/)
  assert.throws(() => engine.supersedeLearning({ learningId: outdated.id, by: "missing", reason: "x" }), /Learning not found/)
  const superseded = engine.supersedeLearning({ learningId: outdated.id, by: replacement.id, reason: "narrowing 순서가 반대로 확인됨", invalidFrom: "2026-09-01T00:00:00.000Z" })
  assert.equal(superseded.status, "superseded")
  assert.equal(superseded.supersededBy, replacement.id)
  assert.equal(superseded.invalidFrom, "2026-09-01T00:00:00.000Z")
  assert.ok(superseded.supersededAt)
  assert.throws(() => engine.supersedeLearning({ learningId: outdated.id, reason: "again" }), /already superseded/)
  const found = engine.searchLearnings("binding narrowing")
  assert.deepEqual(found.map((learning) => learning.id), [replacement.id])
  assert.equal(store.findLearning(outdated.id)!.status, "superseded")
  const retracted = engine.supersedeLearning({ learningId: replacement.id, reason: "전부 잘못된 가정" })
  assert.equal(retracted.status, "retracted")
  assert.equal(retracted.supersededBy, undefined)
  assert.equal(engine.searchLearnings("binding").length, 0)
})

test("retrieval fuses relevance, recency, importance and proximity with RRF", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const weak = engine.recordLearning({ description: "binding 처리 시 캐시를 확인한다", tags: [] })
  const strong = engine.recordLearning({ description: "binding narrowing 순서는 항상 narrowing 먼저다", tags: ["binding", "narrowing"] })
  const results = engine.searchLearnings("binding narrowing")
  assert.deepEqual(results.map((learning) => learning.id), [strong.id, weak.id])
  const korean = engine.recordLearning({ description: "Pattern IR은 branch identity를 유지해야 한다", tags: [] })
  assert.deepEqual(engine.searchLearnings("identity").map((learning) => learning.id), [korean.id])
})

test("accumulated failure patterns trigger a reflection task", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store, { reflectionThreshold: 2 })
  const root = engine.createTask({ title: "Match Core", goal: "match" })
  const { children } = engine.proposeDecomposition({ taskId: root.id, children: [{ title: "A", goal: "a" }] })
  engine.recordLearning({ description: "첫 번째 실패 패턴", kind: "failure_pattern", sourceTaskId: children[0]!.id })
  assert.equal(store.lastEventOfType("REFLECTION_CREATED"), undefined)
  engine.recordLearning({ description: "두 번째 실패 패턴", kind: "failure_pattern", sourceTaskId: children[0]!.id })
  const event = store.lastEventOfType("REFLECTION_CREATED")
  assert.ok(event)
  const reflection = engine.requireTask(event!.taskId!)
  assert.equal(reflection.category, "diagnostic")
  assert.equal(reflection.parentId, root.id)
  assert.ok(reflection.title.startsWith("Reflect on 2"))
  assert.ok(reflection.goal.includes("supersede"))
  engine.recordLearning({ description: "세 번째 실패 패턴", kind: "failure_pattern", sourceTaskId: children[0]!.id })
  assert.equal(store.lastEventOfType("REFLECTION_CREATED")!.id, event!.id)
})

test("integration failures are saved as failure patterns and reach reopened tasks", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const root = engine.createTask({ title: "Match Core", goal: "match" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [{ key: "a", title: "Binding Analyzer", goal: "binding" }, { key: "b", title: "Match Checker", goal: "checker" }],
  })
  for (const child of children) {
    engine.startTask(child.id)
    engine.publishArtifact({ taskId: child.id, name: `art-${child.title}`, type: "code", contentRef: "x" })
    engine.completeTask({ taskId: child.id, summary: "done", verification: { passed: true } })
  }
  const proposal = integration.proposeIntegration({
    integrationSets: [{
      name: "Match pipeline",
      parentTaskId: root.id,
      members: ["art-Binding Analyzer", "art-Match Checker"],
      scenarios: [{ name: "binding flow", expectedBehavior: ["ok"] }],
    }],
  })
  const run = integration.startRun(proposal.sets[0]!.id)
  integration.reportRun(run.run.id, {
    scenarios: run.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "failed" as const, observed: "binding이 branch 경계에서 유실" })),
    failure: { type: "interaction_issue", affectedTaskIds: [children[0]!.id] },
  })
  const patterns = engine.searchLearnings("binding")
  assert.ok(patterns.some((learning) => learning.kind === "failure_pattern" && learning.description.includes("branch 경계에서 유실")))
  engine.reopenTask(children[0]!.id, "실패 수정")
  const context = buildTaskContext(engine, children[0]!.id)
  assert.ok(context.learnings.some((learning) => learning.kind === "failure_pattern"))
})

test("learning operations are exposed through the agent API", async (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const agent = new TaskAgentService(engine, new IntegrationEngine(engine))
  const task = await agent.createTask({ title: "Pattern IR", goal: "IR 구현" })
  const first = await agent.recordLearning({ description: "Pattern IR은 branch identity를 유지해야 한다", kind: "convention", tags: ["pattern"], sourceTaskId: task.id })
  assert.deepEqual(first.similar, [])
  const second = await agent.recordLearning({ description: "branch identity 규칙은 codegen에도 적용된다", tags: ["pattern"] })
  assert.deepEqual(second.similar.map((learning) => learning.id), [first.learning.id])
  const byQuery = await agent.searchLearnings({ query: "branch identity" })
  assert.equal(byQuery.length, 2)
  const sibling = await agent.createTask({ title: "Pattern IR 검증", goal: "IR 검증" })
  const byTask = await agent.searchLearnings({ taskId: sibling.id })
  assert.ok(byTask.some((learning) => learning.id === first.learning.id))
  const context = await agent.getContext({ taskId: sibling.id })
  assert.ok(context.text.includes("[convention]"))
  const superseded = await agent.supersedeLearning({ learningId: first.learning.id, by: second.learning.id, reason: "codegen까지 일반화" })
  assert.equal(superseded.status, "superseded")
  const after = await agent.searchLearnings({ taskId: sibling.id })
  assert.ok(!after.some((learning) => learning.id === first.learning.id))
})
