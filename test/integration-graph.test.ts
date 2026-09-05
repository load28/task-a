import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine, bundleArtifactName } from "#integration-engine"

function verifiedPipeline() {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const root = engine.createTask({ title: "Match Core", goal: "match core 개선" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "a", title: "Pattern IR", goal: "ir" },
      { key: "b", title: "Binding Analyzer", goal: "binding" },
      { key: "c", title: "Match Checker", goal: "checker" },
    ],
  })
  const artifacts: Record<string, { artifactId: string; version: number }> = {}
  for (const [index, name] of ["PatternIR", "BindingAnalyzer", "MatchChecker"].entries()) {
    const task = children[index]!
    engine.startTask(task.id)
    const version = engine.publishArtifact({ taskId: task.id, name, type: "code", contentRef: `git://${name}` })
    artifacts[name] = { artifactId: version.artifactId, version: version.version }
    engine.completeTask({ taskId: task.id, summary: `${name} done`, verification: { passed: true } })
  }
  return { store, engine, integration, root, children, artifacts }
}

test("integration proposals are validated before mutation", (t) => {
  const { store, engine, integration, root } = verifiedPipeline()
  t.after(() => store.close())
  const propose = (overrides: Record<string, unknown>) => integration.proposeIntegration({
    integrationSets: [{
      name: "Match pipeline",
      parentTaskId: root.id,
      members: ["PatternIR", "BindingAnalyzer"],
      scenarios: [{ name: "literal match", expectedBehavior: ["binding resolves"] }],
      ...overrides,
    }],
  })
  assert.throws(() => propose({ members: ["PatternIR"] }), /at least two members/)
  assert.throws(() => propose({ members: ["PatternIR", "Nowhere"] }), /Invalid member reference/)
  assert.throws(() => propose({ scenarios: [] }), /Missing integration boundary/)
  assert.throws(() => propose({ scenarios: [{ name: "s", expectedBehavior: ["ok"], participants: ["Ghost"] }] }), /non-member participant/)
  assert.throws(() => propose({ scenarios: [{ name: "s", expectedBehavior: ["ok"], participants: ["PatternIR"] }] }), /Missing consumer/)
  assert.throws(() => integration.proposeIntegration({
    integrationSets: [
      { name: "X", members: ["PatternIR", "Y"], scenarios: [{ name: "s", expectedBehavior: ["ok"] }] },
      { name: "Y", members: ["BindingAnalyzer", "X"], scenarios: [{ name: "s", expectedBehavior: ["ok"] }] },
    ],
  }), /cycle/)
  assert.equal(engine.store.integrationSets().length, 0)
})

test("passing integrations promote verified bundles and integrate producers", (t) => {
  const { store, engine, integration, root, children, artifacts } = verifiedPipeline()
  t.after(() => store.close())
  const requirement = engine.addRequirement(root.id, "Union pattern inference 정확성")
  const proposal = integration.proposeIntegration({
    integrationSets: [{
      name: "Match Core",
      parentTaskId: root.id,
      members: ["PatternIR", "BindingAnalyzer", "MatchChecker"],
      scenarios: [
        { name: "Literal match", expectedBehavior: ["literal patterns bind"], requirementIds: [requirement.id] },
        { name: "Union enum match", expectedBehavior: ["union members narrow"] },
      ],
    }],
  })
  const set = proposal.sets[0]!
  assert.equal(set.status, "ready")
  const started = integration.startRun(set.id)
  assert.equal(started.cached, false)
  assert.equal(started.scenarios.length, 2)
  assert.equal(engine.requireTask(children[0]!.id).status, "integrating")
  const reported = integration.reportRun(started.run.id, {
    scenarios: started.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })),
  })
  assert.equal(reported.run.status, "passed")
  assert.equal(reported.bundle!.status, "valid")
  assert.deepEqual(reported.bundle!.memberRefs, Object.values(artifacts))
  assert.equal(store.findArtifactByName(bundleArtifactName("Match Core"))!.latestVersion, 1)
  for (const child of children) assert.equal(engine.requireTask(child.id).status, "integrated")
  assert.equal(store.findRequirement(requirement.id)!.status, "satisfied")
  assert.equal(engine.requireTask(root.id).status, "integrated")
  assert.equal(engine.evaluateCompletion(root.id).complete, true)
  const cached = integration.startRun(set.id)
  assert.equal(cached.cached, true)
  assert.equal(cached.run.id, reported.run.id)
})

test("new artifact versions stale bundles and require reintegration", (t) => {
  const { store, engine, integration, root, children } = verifiedPipeline()
  t.after(() => store.close())
  const proposal = integration.proposeIntegration({
    integrationSets: [{
      name: "Match Core",
      parentTaskId: root.id,
      members: ["PatternIR", "BindingAnalyzer", "MatchChecker"],
      scenarios: [{ name: "Literal match", expectedBehavior: ["ok"] }],
    }],
  })
  const set = proposal.sets[0]!
  const started = integration.startRun(set.id)
  const first = integration.reportRun(started.run.id, { scenarios: started.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })) })
  engine.reopenTask(children[1]!.id, "binding 개선")
  engine.startTask(children[1]!.id)
  engine.publishArtifact({ taskId: children[1]!.id, name: "BindingAnalyzer", type: "code", contentRef: "git://BindingAnalyzer/v2" })
  assert.equal(store.findBundle(first.bundle!.artifactId, 1)!.status, "stale")
  assert.equal(store.findIntegrationSet(set.id)!.status, "stale")
  assert.equal(engine.requireTask(root.id).status, "running")
  engine.completeTask({ taskId: children[1]!.id, summary: "v2", verification: { passed: true } })
  const rerun = integration.startRun(set.id)
  assert.equal(rerun.cached, false)
  const second = integration.reportRun(rerun.run.id, { scenarios: rerun.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })) })
  assert.equal(second.bundle!.version, 2)
  assert.equal(engine.requireTask(root.id).status, "integrated")
})

test("integration failures classify causes, revert members and spawn diagnostics", (t) => {
  const { store, engine, integration, root, children } = verifiedPipeline()
  t.after(() => store.close())
  const proposal = integration.proposeIntegration({
    integrationSets: [{
      name: "Match Core",
      parentTaskId: root.id,
      members: ["PatternIR", "BindingAnalyzer", "MatchChecker"],
      scenarios: [
        { name: "Literal match", expectedBehavior: ["ok"] },
        { name: "Async match", expectedBehavior: ["ok"], participants: ["BindingAnalyzer", "MatchChecker", "PatternIR"] },
      ],
    }],
  })
  const set = proposal.sets[0]!
  const started = integration.startRun(set.id)
  const failed = integration.reportRun(started.run.id, {
    scenarios: started.scenarios.map((scenario, index) => ({ scenarioId: scenario.id, status: index === 0 ? "passed" as const : "failed" as const, observed: index === 0 ? undefined : "binding lost across await" })),
  })
  assert.equal(failed.run.status, "failed")
  assert.equal(failed.run.failure!.type, "unknown")
  assert.equal(failed.bundle, undefined)
  assert.ok(failed.diagnosticTask)
  assert.equal(failed.diagnosticTask!.category, "diagnostic")
  assert.equal(failed.diagnosticTask!.parentId, root.id)
  for (const child of children) assert.equal(engine.requireTask(child.id).status, "verified")
  assert.equal(store.findIntegrationSet(set.id)!.status, "failed")

  const diagnostic = failed.diagnosticTask!
  engine.startTask(diagnostic.id)
  engine.completeTask({ taskId: diagnostic.id, summary: "B와 C의 interaction이 원인", verification: { passed: true } })
  const rerun = integration.startRun(set.id)
  const classified = integration.reportRun(rerun.run.id, {
    scenarios: rerun.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "failed" as const })),
    failure: { type: "interaction_issue", affectedTaskIds: [children[1]!.id, children[2]!.id], recommendedActions: ["fix B", "fix C"] },
  })
  assert.equal(classified.diagnosticTask, undefined)
  assert.equal(engine.requireTask(children[1]!.id).status, "stale")
  assert.equal(engine.requireTask(children[2]!.id).status, "stale")
  assert.equal(engine.requireTask(children[0]!.id).status, "verified")
})

test("integration sets compose hierarchically through bundles", (t) => {
  const { store, engine, integration, root } = verifiedPipeline()
  t.after(() => store.close())
  const proposal = integration.proposeIntegration({
    integrationSets: [
      {
        name: "Binding subsystem",
        parentTaskId: root.id,
        members: ["PatternIR", "BindingAnalyzer"],
        scenarios: [{ name: "binding flow", expectedBehavior: ["ok"] }],
      },
      {
        name: "Match pipeline",
        parentTaskId: root.id,
        members: ["Binding subsystem", "MatchChecker"],
        scenarios: [{ name: "end to end", expectedBehavior: ["ok"] }],
      },
    ],
  })
  const [inner, outer] = [proposal.sets[0]!, proposal.sets[1]!]
  assert.throws(() => integration.startRun(outer.id), /no valid version/)
  const innerRun = integration.startRun(inner.id)
  integration.reportRun(innerRun.run.id, { scenarios: innerRun.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })) })
  const outerRun = integration.startRun(outer.id)
  assert.ok(outerRun.run.memberRefs.some((member) => member.artifactId === store.findArtifactByName(bundleArtifactName("Binding subsystem"))!.id))
  const finished = integration.reportRun(outerRun.run.id, { scenarios: outerRun.scenarios.map((scenario) => ({ scenarioId: scenario.id, status: "passed" as const })) })
  assert.equal(finished.bundle!.status, "valid")
  assert.equal(engine.requireTask(root.id).status, "integrated")
})
