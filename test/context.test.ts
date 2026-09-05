import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { buildTaskContext, formatTaskContext } from "#task-context"

test("context is compiled from the graph, not from conversation history", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const root = engine.createTask({
    title: "TT Match 개선",
    goal: "match 시스템 개선",
    requirements: [
      { description: "특정 케이스 hack 금지", kind: "constraint" },
      { description: "Union pattern inference 정확성" },
    ],
  })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "arch", title: "Architecture", goal: "설계", category: "architecture" },
      { key: "impl", title: "Binding Analyzer", goal: "binding 구현", dependencies: ["arch"], acceptanceCriteria: ["branch identity 유지"] },
    ],
  })
  const [architecture, implementation] = [children[0]!, children[1]!]
  engine.startTask(architecture.id)
  engine.publishArtifact({ taskId: architecture.id, name: "MatchArchitecture", type: "architecture", content: "branch-aware 설계" })
  engine.completeTask({ taskId: architecture.id, summary: "설계 완료", verification: { passed: true } })
  const contract = engine.defineContract({
    providerTaskId: architecture.id,
    consumerTaskId: implementation.id,
    provides: [{ name: "BindingSet[]" }],
    invariants: ["binding name consistency"],
  })
  const context = buildTaskContext(engine, implementation.id)
  assert.equal(context.rootGoal, root.goal)
  assert.equal(context.parentGoal, root.goal)
  assert.deepEqual(context.path, ["TT Match 개선", "Binding Analyzer"])
  assert.deepEqual(context.inheritedConstraints, ["특정 케이스 hack 금지"])
  assert.deepEqual(context.inheritedRequirements, ["Union pattern inference 정확성"])
  assert.equal(context.architectureDecisions[0]!.name, "MatchArchitecture")
  assert.equal(context.inputArtifacts[0]!.name, "MatchArchitecture")
  assert.equal(context.contracts[0]!.contractId, contract.id)
  assert.equal(context.contracts[0]!.role, "consumer")
  assert.deepEqual(context.dependencies, [{ id: architecture.id, title: "Architecture", status: "verified" }])
  assert.equal(context.acceptanceCriteria.length, 1)
  const text = formatTaskContext(context)
  assert.ok(text.includes("특정 케이스 hack 금지"))
  assert.ok(text.includes("MatchArchitecture@1"))
})

test("context policy controls inheritance and parents see bundles instead of raw artifacts", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const root = engine.createTask({ title: "Root", goal: "root", requirements: [{ description: "제약", kind: "constraint" }] })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "a", title: "A", goal: "a" },
      { key: "b", title: "B", goal: "b" },
      { key: "consumer", title: "Consumer", goal: "uses bundle", dependencies: ["a", "b"], contextPolicy: { inheritConstraints: false, inheritGoal: false } },
    ],
  })
  const [a, b, consumer] = [children[0]!, children[1]!, children[2]!]
  for (const task of [a, b]) {
    engine.startTask(task.id)
    engine.publishArtifact({ taskId: task.id, name: `artifact-${task.title}`, type: "code", contentRef: `git://${task.title}` })
    engine.completeTask({ taskId: task.id, summary: "done", verification: { passed: true } })
  }
  const proposal = integration.proposeIntegration({
    integrationSets: [{
      name: "AB",
      parentTaskId: root.id,
      members: ["artifact-A", "artifact-B"],
      scenarios: [{ name: "together", expectedBehavior: ["ok"] }],
    }],
  })
  const run = integration.startRun(proposal.sets[0]!.id)
  integration.reportRun(run.run.id, { scenarios: run.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })) })
  const context = buildTaskContext(engine, consumer.id)
  assert.equal(context.rootGoal, undefined)
  assert.deepEqual(context.inheritedConstraints, [])
  assert.equal(context.verifiedBundles.length, 1)
  assert.equal(context.verifiedBundles[0]!.name, "bundle:AB")
  assert.deepEqual(context.inputArtifacts, [])
})

test("known integration failures surface in dependent context", (t) => {
  const store = new TaskGraphStore()
  t.after(() => store.close())
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const root = engine.createTask({ title: "Root", goal: "root" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [{ key: "a", title: "A", goal: "a" }, { key: "b", title: "B", goal: "b" }],
  })
  for (const task of children) {
    engine.startTask(task.id)
    engine.publishArtifact({ taskId: task.id, name: `part-${task.title}`, type: "code", contentRef: "x" })
    engine.completeTask({ taskId: task.id, summary: "done", verification: { passed: true } })
  }
  const proposal = integration.proposeIntegration({
    integrationSets: [{ name: "AB", parentTaskId: root.id, members: ["part-A", "part-B"], scenarios: [{ name: "join", expectedBehavior: ["ok"] }] }],
  })
  const run = integration.startRun(proposal.sets[0]!.id)
  integration.reportRun(run.run.id, {
    scenarios: run.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "failed" as const, observed: "A와 B의 상호작용 오류" })),
    failure: { type: "interaction_issue", affectedTaskIds: children.map((child) => child.id) },
  })
  const context = buildTaskContext(engine, children[0]!.id)
  assert.ok(context.knownFailures.length > 0)
  assert.ok(context.knownFailures.some((failure) => failure.includes("interaction_issue")))
  assert.ok(context.knownFailures.some((failure) => failure.includes("A와 B의 상호작용 오류")))
})
