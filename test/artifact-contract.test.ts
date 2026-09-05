import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"

function pipeline() {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const root = engine.createTask({ title: "Match Core", goal: "match core" })
  const { children } = engine.proposeDecomposition({
    taskId: root.id,
    children: [
      { key: "ir", title: "Pattern IR", goal: "ir" },
      { key: "binding", title: "Binding Analyzer", goal: "binding", dependencies: ["ir"] },
    ],
  })
  return { store, engine, root, ir: children[0]!, binding: children[1]! }
}

test("task results are versioned artifacts with lineage", (t) => {
  const { store, engine, ir, binding } = pipeline()
  t.after(() => store.close())
  engine.startTask(ir.id)
  assert.throws(() => engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "bundle", contentRef: "x" }), /integration engine/)
  assert.throws(() => engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code" }), /contentRef or inline content/)
  const v1 = engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "git://ir/v1" })
  assert.equal(v1.version, 1)
  engine.completeTask({ taskId: ir.id, summary: "ir done", verification: { passed: true } })
  engine.startTask(binding.id)
  const analyzer = engine.publishArtifact({
    taskId: binding.id,
    name: "BindingAnalyzer",
    type: "code",
    contentRef: "git://binding/v1",
    inputs: [{ artifactId: v1.artifactId, version: 1 }],
  })
  assert.deepEqual(store.lineageDependents(v1.artifactId, 1), [{ artifactId: analyzer.artifactId, version: 1 }])
  assert.throws(() => engine.publishArtifact({ taskId: binding.id, name: "X", type: "code", contentRef: "x", inputs: [{ artifactId: "nope", version: 1 }] }), /Unknown artifact version/)
  const task = engine.requireTask(binding.id)
  assert.deepEqual(task.outputArtifactRefs, [{ artifactId: analyzer.artifactId, version: 1 }])
})

test("compatible upstream changes stale downstream artifacts but keep implementations", (t) => {
  const { store, engine, ir, binding } = pipeline()
  t.after(() => store.close())
  engine.startTask(ir.id)
  const v1 = engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "git://ir/v1" })
  engine.completeTask({ taskId: ir.id, summary: "done", verification: { passed: true } })
  engine.startTask(binding.id)
  const analyzer = engine.publishArtifact({ taskId: binding.id, name: "BindingAnalyzer", type: "code", contentRef: "git://b/v1", inputs: [{ artifactId: v1.artifactId, version: 1 }] })
  engine.completeTask({ taskId: binding.id, summary: "done", verification: { passed: true } })
  engine.reopenTask(ir.id, "IR 개선")
  engine.startTask(ir.id)
  engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "git://ir/v2", compatibility: "compatible" })
  assert.equal(store.findArtifactVersion(analyzer.artifactId, 1)!.status, "stale")
  assert.equal(engine.requireTask(binding.id).status, "verified")
  const impact = engine.calculateImpact(v1.artifactId)
  assert.deepEqual(impact.staleArtifactVersions, [{ artifactId: analyzer.artifactId, version: 1 }])
  assert.deepEqual(impact.reopenRecommendedTaskIds, [])
})

test("breaking upstream changes mark consumer tasks stale for reopen", (t) => {
  const { store, engine, ir, binding } = pipeline()
  t.after(() => store.close())
  engine.startTask(ir.id)
  const v1 = engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "git://ir/v1" })
  engine.completeTask({ taskId: ir.id, summary: "done", verification: { passed: true } })
  engine.startTask(binding.id)
  engine.publishArtifact({ taskId: binding.id, name: "BindingAnalyzer", type: "code", contentRef: "git://b/v1", inputs: [{ artifactId: v1.artifactId, version: 1 }] })
  engine.completeTask({ taskId: binding.id, summary: "done", verification: { passed: true } })
  engine.reopenTask(ir.id, "IR 계약 변경")
  engine.startTask(ir.id)
  engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "git://ir/v2", compatibility: "breaking" })
  assert.equal(engine.requireTask(binding.id).status, "stale")
  const impact = engine.calculateImpact(v1.artifactId, "breaking")
  assert.deepEqual(impact.reopenRecommendedTaskIds, [binding.id])
  engine.completeTask({ taskId: ir.id, summary: "v2 done", verification: { passed: true } })
  engine.reopenTask(binding.id, "새 IR 반영")
  assert.equal(engine.requireTask(binding.id).status, "ready")
})

test("contracts are first-class and versioned", (t) => {
  const { store, engine, ir, binding } = pipeline()
  t.after(() => store.close())
  assert.throws(() => engine.defineContract({ providerTaskId: ir.id, consumerTaskId: ir.id, provides: [{ name: "x" }] }), /distinct/)
  assert.throws(() => engine.defineContract({ providerTaskId: ir.id, consumerTaskId: binding.id, provides: [] }), /at least one provided item/)
  const contract = engine.defineContract({
    providerTaskId: ir.id,
    consumerTaskId: binding.id,
    provides: [{ name: "BindingSet[]" }, { name: "PatternConstraint[]" }],
    invariants: ["branch identity 유지", "narrowing before binding extraction 금지"],
  })
  assert.equal(contract.version, 1)
  const bumped = engine.defineContract({ contractId: contract.id, providerTaskId: ir.id, consumerTaskId: binding.id, provides: [{ name: "BindingSet[]" }] })
  assert.equal(bumped.version, 2)
  assert.equal(store.findContract(contract.id)!.version, 2)
  assert.equal(store.findContract(contract.id, 1)!.provides.length, 2)
  assert.deepEqual(engine.requireTask(ir.id).contractRefs, [{ contractId: contract.id, version: 2 }])
  engine.startTask(ir.id)
  assert.throws(() => engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "x", contractVersionRefs: [{ contractId: contract.id, version: 9 }] }), /Unknown contract version/)
  const version = engine.publishArtifact({ taskId: ir.id, name: "PatternIR", type: "code", contentRef: "x", contractVersionRefs: [{ contractId: contract.id, version: 2 }] })
  assert.deepEqual(version.contractVersionRefs, [{ contractId: contract.id, version: 2 }])
})
