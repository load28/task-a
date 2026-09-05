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
  const learning = engine.recordLearning({ description: "OK 학습", tags: [" Match ", "match", ""] })
  assert.deepEqual(learning.tags, ["match"])
  assert.equal(learning.kind, "insight")
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
  const recorded = await agent.recordLearning({ description: "Pattern IR은 branch identity를 유지해야 한다", kind: "convention", tags: ["pattern"], sourceTaskId: task.id })
  const byQuery = await agent.searchLearnings({ query: "branch identity" })
  assert.equal(byQuery[0]!.id, recorded.id)
  const sibling = await agent.createTask({ title: "Pattern IR 검증", goal: "IR 검증" })
  const byTask = await agent.searchLearnings({ taskId: sibling.id })
  assert.equal(byTask[0]!.id, recorded.id)
  const context = await agent.getContext({ taskId: sibling.id })
  assert.ok(context.text.includes("[convention]"))
})
