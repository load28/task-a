import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { buildTaskContext } from "#task-context"
import type { PlanNode } from "#task-domain"

const node = (id: string, deps: string[] = [], category: any = "implementation"): PlanNode => ({ nodeId: id, label: id, stage: "implementation", outcome: id,
  dependsOnNodeIds: deps, taskSpec: { goal: id, category, acceptanceCriteria: ["works"] } })
function fixture(path = ":memory:") {
  const store = new TaskGraphStore(path), e = new TaskGraphEngine(store), integration = new IntegrationEngine(e)
  const planId = e.createDraftPlan({ title: "Feedback", goal: "deliver", requestText: "build", summary: "initial",
    nodes: [node("design", [], "architecture"), node("impl", ["design"]), node("qa", ["impl"], "qa"), node("unrelated")] }).planId
  e.approveWorkPlan({ planId, version: 1, approvalSource: "user" })
  return { store, e, integration, planId }
}
const id = (e: TaskGraphEngine, p: string, n: string) => e.store.planLinks(p, e.store.activePlanVersion(p)).find(l => l.nodeId === n)!.taskId
function done(e: TaskGraphEngine, taskId: string, name: string, content = "result") {
  const t = e.startTask(taskId)
  return e.completeTask({ taskId, attemptToken: t.attemptToken, summary: "actual result", artifacts: [{ name, type: "code", content }],
    verification: { passed: true, evidence: "executed tests", criteriaSatisfied: t.acceptanceCriteria.map(c => c.id) } })
}
function stop(e: TaskGraphEngine, transitionId: string) {
  for (const s of e.revisions.transitions().find(t => t.id === transitionId)!.stops) e.revisions.confirmStopped(transitionId, s.taskId, s.token, "process exit observed")
  e.reconcilePlanTransition(transitionId)
}
test("causal lineage routes an implementation finding to architecture, preserves unrelated work, and requires downstream reruns", () => {
  const { e, store, planId } = fixture()
  try {
    const design = done(e, id(e, planId, "design"), "design")
    const impl = done(e, id(e, planId, "impl"), "impl")
    const qa = done(e, id(e, planId, "qa"), "qa")
    const unrelated = done(e, id(e, planId, "unrelated"), "unrelated")
    const root = store.findWorkPlan(planId)!.rootTaskId!
    const issue = e.feedback.report({ reporterTaskId: qa.id, observedRefs: impl.outputArtifactRefs, summary: "contract error", evidence: "repro" })
    assert.equal(e.evaluateCompletion(root).complete, false)
    const routed = e.feedback.route({ issueId: issue.id, causeTaskId: design.id, causeRefs: design.outputArtifactRefs, evidence: "design specifies the wrong contract" })
    assert.equal(routed.state, "repairing")
    assert.equal(id(e, planId, "unrelated"), unrelated.id)
    assert.notEqual(id(e, planId, "design"), design.id)
    assert.equal(e.requireTask(design.id).status, "verified")
    assert.ok(buildTaskContext(e, id(e, planId, "design")).knownFailures.some(x => x.includes(issue.id)))
    assert.ok(buildTaskContext(e, id(e, planId, "design")).reuse?.sources.some(s => s.taskId === design.id))
    assert.throws(() => e.feedback.resolve(issue.id, "local patch"), /incomplete/)
    done(e, id(e, planId, "design"), "design", "correct contract")
    assert.equal(e.reuseTask(id(e, planId, "impl")).reused, false)
    done(e, id(e, planId, "impl"), "impl", "updated implementation")
    assert.equal(e.reuseTask(id(e, planId, "qa")).reused, false)
    done(e, id(e, planId, "qa"), "qa", "new verification")
    assert.equal(e.evaluateCompletion(root).complete, false)
    const closed = e.feedback.resolve(issue.id, "regression passed on corrected contract")
    assert.equal(closed.state, "resolved")
    assert.equal(e.evaluateCompletion(root).complete, true)
    assert.equal(e.feedback.resolve(issue.id, "retry").resolution?.resolvedAt, closed.resolution?.resolvedAt)
  } finally { store.close() }
})
for (const status of ["ready", "running", "implemented", "verified", "failed", "blocked", "stale"] as const) test(`repair accepts owner ${status}, fences only affected execution and preserves late reports`, () => {
  const { e, store, planId } = fixture()
  try {
    done(e, id(e, planId, "design"), "design")
    const ownerId = id(e, planId, "impl"), qaId = id(e, planId, "qa")
    if (status !== "ready") {
      const t = e.startTask(ownerId)
      if (status === "verified") e.completeTask({ taskId: t.id, attemptToken: t.attemptToken, summary: "done", verification: { passed: true, criteriaSatisfied: t.acceptanceCriteria.map(c => c.id) } })
      else if (status === "implemented") e.completeTask({ taskId: t.id, attemptToken: t.attemptToken, summary: "implemented" })
      else if (status === "failed") e.failTask(t.id, "execution error", t.attemptToken)
      else if (status !== "running") { store.saveAttempt({ ...store.currentAttempt(t.id)!, state: "failed" }); store.updateTask({ ...e.requireTask(t.id), status }) }
    }
    const keep = e.startTask(id(e, planId, "unrelated"))
    const old = store.currentAttempt(ownerId)
    const issue = e.feedback.report({ reporterTaskId: qaId, observedRefs: [], summary: "upstream missing output", evidence: "cannot consume" })
    const routed = e.feedback.route({ issueId: issue.id, causeTaskId: ownerId, causeRefs: [], evidence: "implementation owns missing behavior" })
    if (status === "running") {
      assert.equal(store.executionAllowed(ownerId), false)
      e.completeTask({ taskId: ownerId, attemptToken: old!.token, summary: "late" })
      assert.equal(store.db.prepare("SELECT count(*) AS n FROM late_task_reports").get()!.n, 1)
      stop(e, routed.transitionId!)
    }
    assert.equal(e.requireTask(keep.id).status, "running")
    assert.equal(id(e, planId, "unrelated"), keep.id)
    assert.notEqual(id(e, planId, "impl"), ownerId)
    assert.ok(e.requireTask(id(e, planId, "qa")).dependencies.includes(id(e, planId, "impl")))
  } finally { store.close() }
})
test("unplanned completed task graph is adopted without losing work and feedback survives database reconnect", () => {
  const dir = mkdtempSync(join(tmpdir(), "feedback-")), path = join(dir, "graph.db")
  let store = new TaskGraphStore(path), e = new TaskGraphEngine(store)
  try {
    const task = e.createTask({ title: "single", goal: "work" })
    const output = done(e, task.id, "single")
    const issue = e.feedback.report({ reporterTaskId: task.id, observedRefs: output.outputArtifactRefs, summary: "defect", evidence: "reproduction" })
    store.close(); store = new TaskGraphStore(path); e = new TaskGraphEngine(store)
    const routed = e.feedback.route({ issueId: issue.id, causeTaskId: task.id, causeRefs: output.outputArtifactRefs, evidence: "self-owned defect" })
    const replacement = id(e, routed.planId!, task.id)
    assert.notEqual(replacement, task.id)
    done(e, replacement, "single", "fixed")
    assert.equal(e.feedback.resolve(issue.id, "verified").state, "resolved")
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }) }
})
test("affected integration must run with corrected versions; old passing bundle cannot resolve", () => {
  const { e, store, planId, integration } = fixture()
  try {
    done(e, id(e, planId, "design"), "design")
    const impl = done(e, id(e, planId, "impl"), "impl")
    const qa = done(e, id(e, planId, "qa"), "qa")
    done(e, id(e, planId, "unrelated"), "unrelated")
    const root = store.findWorkPlan(planId)!.rootTaskId!
    const set = integration.proposeIntegration({ integrationSets: [{ name: "boundary", parentTaskId: root, members: ["impl", "qa"], scenarios: [{ name: "regression", expectedBehavior: ["works"] }] }] }).sets[0]!
    const run = integration.startRun(set.id)
    integration.reportRun(run.run.id, { scenarios: run.scenarios.map(s => ({ scenarioId: s.id, status: "passed" })) })
    const issue = e.feedback.report({ reporterTaskId: qa.id, observedRefs: impl.outputArtifactRefs, summary: "defect", evidence: "repro" })
    e.feedback.route({ issueId: issue.id, causeTaskId: impl.id, causeRefs: impl.outputArtifactRefs, evidence: "implementation defect" })
    assert.throws(() => integration.startRun(set.id), /historical|fenced/)
    done(e, id(e, planId, "impl"), "impl", "fixed")
    done(e, id(e, planId, "qa"), "qa", "passed new regression")
    assert.throws(() => e.feedback.resolve(issue.id, "local pass"), /integration/)
    const rerun = integration.startRun(set.id)
    assert.equal(rerun.cached, false)
    integration.reportRun(rerun.run.id, { scenarios: rerun.scenarios.map(s => ({ scenarioId: s.id, status: "passed" })) })
    assert.equal(e.feedback.resolve(issue.id, "integrated regression pass").state, "resolved")
  } finally { store.close() }
})

test("runtime child responsibility and workspace ancestry survive a repair of its planned group", () => {
  const { e, store, planId } = fixture()
  try {
    done(e, id(e, planId, "design"), "design")
    const group = id(e, planId, "impl")
    const child = e.proposeDecomposition({ taskId: group, children: [{ title: "leaf implementation", goal: "own value", acceptanceCriteria: ["works"] }] }).children[0]!
    const output = done(e, child.id, "nested-value")
    const qa = done(e, id(e, planId, "qa"), "qa")
    const issue = e.feedback.report({ reporterTaskId: qa.id, observedRefs: output.outputArtifactRefs, summary: "nested defect", evidence: "actual failure" })
    e.feedback.route({ issueId: issue.id, causeTaskId: child.id, causeRefs: output.outputArtifactRefs, evidence: "nested producer owns it" })
    const nextGroup = e.requireTask(id(e, planId, "impl"))
    assert.equal(nextGroup.childIds.length, 1)
    const nextChild = e.requireTask(nextGroup.childIds[0]!)
    assert.equal(nextChild.goal, child.goal)
    assert.ok(buildTaskContext(e, nextChild.id).reuse?.sources.some(s => s.taskId === child.id))
    done(e, nextChild.id, "nested-value", "fixed")
    done(e, id(e, planId, "qa"), "qa", "verified repair")
    assert.equal(e.feedback.resolve(issue.id, "nested owner repair verified").state, "resolved")
  } finally { store.close() }
})

test("unknown findings cannot close; routing an unrelated producer is rejected transactionally", () => {
  const { e, store, planId } = fixture()
  try {
    const design = done(e, id(e, planId, "design"), "design")
    const impl = done(e, id(e, planId, "impl"), "impl")
    const unrelated = done(e, id(e, planId, "unrelated"), "unrelated")
    const input = { reporterTaskId: impl.id, observedRefs: design.outputArtifactRefs, summary: "unknown interaction", evidence: "repro" }
    const issue = e.feedback.report(input)
    assert.equal(e.feedback.report(input).id, issue.id)
    assert.throws(() => e.feedback.resolve(issue.id, "guess"), /Diagnose/)
    assert.throws(() => e.feedback.route({ issueId: issue.id, causeTaskId: unrelated.id, causeRefs: unrelated.outputArtifactRefs, evidence: "guess" }), /lineage/)
    assert.equal(store.findWorkPlan(planId)!.currentRevision, 1)
    assert.equal(e.feedback.get(issue.id).state, "reported")
  } finally { store.close() }
})

test("direction changes retain unresolved repair obligations and cannot resurrect a known bad execution", () => {
  const { e, store, planId } = fixture()
  try {
    const originalNodes = store.planNodes(planId, 1)
    done(e, id(e, planId, "design"), "design")
    const impl = done(e, id(e, planId, "impl"), "impl")
    const qa = done(e, id(e, planId, "qa"), "qa")
    const issue = e.feedback.report({ reporterTaskId: qa.id, observedRefs: impl.outputArtifactRefs, summary: "defect", evidence: "repro" })
    e.feedback.route({ issueId: issue.id, causeTaskId: impl.id, causeRefs: impl.outputArtifactRefs, evidence: "producer defect" })
    e.reviseWorkPlan({ planId, baseVersion: 2, nodes: originalNodes, summary: "return to original direction" })
    e.approveWorkPlan({ planId, version: 3, approvalSource: "user" })
    assert.notEqual(id(e, planId, "impl"), impl.id)
    assert.ok(store.planNodes(planId, 3).find(n => n.nodeId === "impl")!.taskSpec.repairIssueIds!.includes(issue.id))
    assert.throws(() => e.feedback.resolve(issue.id, "old pass"), /incomplete/)
  } finally { store.close() }
})

test("integration failure automatically records exact versions and routes from the root to the producer", () => {
  const { e, store, planId, integration } = fixture()
  try {
    done(e, id(e, planId, "design"), "design")
    const impl = done(e, id(e, planId, "impl"), "impl")
    done(e, id(e, planId, "qa"), "qa")
    const root = store.findWorkPlan(planId)!.rootTaskId!
    const set = integration.proposeIntegration({ integrationSets: [{ name: "failed-boundary", parentTaskId: root, members: ["impl", "qa"], scenarios: [{ name: "actual failure", expectedBehavior: ["works"] }] }] }).sets[0]!
    const run = integration.startRun(set.id)
    const failed = integration.reportRun(run.run.id, { scenarios: run.scenarios.map(s => ({ scenarioId: s.id, status: "failed", observed: "bad producer output" })),
      failure: { type: "producer_violation", affectedTaskIds: [impl.id] } })
    assert.ok(failed.issue)
    assert.deepEqual(failed.issue.observedRefs, run.run.memberRefs)
    const routed = e.feedback.route({ issueId: failed.issue.id, causeTaskId: impl.id, causeRefs: impl.outputArtifactRefs, evidence: "producer violated output contract" })
    assert.equal(routed.state, "repairing")
    assert.notEqual(id(e, planId, "impl"), impl.id)
    assert.ok(routed.integrationSetIds!.includes(set.id))
  } finally { store.close() }
})
