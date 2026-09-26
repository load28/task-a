import test from "node:test"
import assert from "node:assert/strict"
import { contentDigest, digest, ref, withDigest } from "../contracts/index.ts"
import type { AdoptionRecord, ArtifactManifest, GraphBundle, PortResult, SourceNode, TaskSpecRevision, ValidatorRevision } from "../contracts/index.ts"
import { fixtureBundle } from "../contracts/fixtures.ts"
import { analyzeChange, decideRework, graphComplete, resolveInputs, taskComplete, validateGraph } from "./index.ts"

const clone = <T>(value: T): T => structuredClone(value)
const sealGraph = (bundle: GraphBundle, next = false): GraphBundle => {
  bundle.graph = withDigest({ ...bundle.graph, ...(next ? { baseRevision: bundle.graph.revision, revision: bundle.graph.revision + 1 } : {}), taskSpecRefs: bundle.tasks.map(ref) })
  return bundle
}
function leaf(bundle: GraphBundle, id: string, inputs: string[] = [], outputs = ["result"]): TaskSpecRevision {
  return withDigest({ ...clone(fixtureBundle().tasks[0]!), id, inputPorts: inputs.map(name => ({ name, contractRef: ref(bundle.contracts[0]!), mountPath: `/inputs/${name}` })), outputPorts: outputs.map(name => ({ name, contractRef: ref(bundle.contracts[0]!), path: `${name}.txt` })) })
}
function sourceArtifact(bundle: GraphBundle, sourceId: string, port: string, content: string, id = `${sourceId}-${port}`): ArtifactManifest {
  const registrationDigest = digest({ issuer: "user", source: `fixture:${sourceId}` })
  return withDigest({ id, outputPort: port, contractRef: ref(bundle.contracts[0]!), contentDigest: contentDigest(content), storage: { uri: `memory:${id}`, digest: contentDigest(content), size: Buffer.byteLength(content) }, validationEvidenceIds: [], origin: { kind: "source", sourceId, issuer: "user", source: `fixture:${sourceId}`, registrationDigest } })
}
function addSource(bundle: GraphBundle, id: string, values: Record<string, string>) {
  const artifacts = Object.entries(values).map(([port, content]) => sourceArtifact(bundle, id, port, content))
  const source: SourceNode = { id, outputs: artifacts.map(artifact => ({ name: artifact.outputPort, contractRef: artifact.contractRef, artifactRef: { id: artifact.id, digest: artifact.digest } })), registrationEvidence: { issuer: "user", source: `fixture:${id}`, digest: digest({ issuer: "user", source: `fixture:${id}` }) } }
  bundle.graph.sources.push(source); bundle.sourceArtifacts.push(...artifacts)
}
function consume(bundle: GraphBundle, producer: string, output: string, consumer: string, input: string) {
  bundle.graph.edges.push({ kind: "consumes", from: { nodeId: producer, port: output }, to: { nodeId: consumer, port: input } })
}
function changeSource(bundle: GraphBundle, port: string, value: string, id?: string) {
  const next = clone(bundle), source = next.graph.sources[0]!
  const prior = source.outputs.find(output => output.name === port)!, artifact = sourceArtifact(next, source.id, port, value, id ?? prior.artifactRef.id)
  next.sourceArtifacts = next.sourceArtifacts.filter(item => item.id !== prior.artifactRef.id); next.sourceArtifacts.push(artifact)
  prior.artifactRef = { id: artifact.id, digest: artifact.digest }
  return sealGraph(next, true)
}
function fan(): GraphBundle {
  const bundle = fixtureBundle()
  bundle.tasks = [leaf(bundle, "a", ["input"]), leaf(bundle, "b", ["input"]), leaf(bundle, "c", ["input"]), leaf(bundle, "independent")]
  addSource(bundle, "source", { x: "x1", y: "y1" })
  consume(bundle, "source", "x", "a", "input"); consume(bundle, "source", "y", "b", "input"); consume(bundle, "a", "result", "c", "input")
  bundle.graph.completionTargets = ["a", "b", "c", "independent"]
  return sealGraph(bundle)
}
interface State { results: PortResult[]; artifacts: ArtifactManifest[]; adoptions: AdoptionRecord[] }
function adopt(bundle: GraphBundle, taskId: string, state: State, content = "result"): AdoptionRecord {
  const resolved = resolveInputs(bundle, taskId, state.results, state.artifacts, state.adoptions)
  assert.equal(resolved.ready, true, resolved.reasons.join("; "))
  const task = bundle.tasks.find(value => value.id === taskId)!, snapshot = resolved.snapshot!
  const artifacts = task.outputPorts.map(output => withDigest({ id: `artifact-${taskId}-${output.name}`, outputPort: output.name, contractRef: output.contractRef, contentDigest: contentDigest(content), storage: { uri: `memory:${taskId}-${output.name}`, digest: contentDigest(content), size: Buffer.byteLength(content) }, validationEvidenceIds: [`evidence-${taskId}`], origin: { kind: "execution" as const, taskSpecRef: ref(task), attemptId: `attempt-${taskId}` }, consumedInputs: snapshot }))
  const adoption: AdoptionRecord = { id: `adoption-${taskId}`, mode: "fresh", targetGraphRef: ref(bundle.graph), targetTaskSpecRef: ref(task), currentInputs: snapshot, artifactRefs: artifacts.map(value => ({ id: value.id, digest: value.digest })), validationEvidenceIds: [`evidence-${taskId}`], attemptId: `attempt-${taskId}`, fence: 1 }
  state.artifacts.push(...artifacts); state.adoptions.push(adoption)
  for (const artifact of artifacts) state.results.push({ producer: { nodeId: taskId, port: artifact.outputPort }, artifactRef: { id: artifact.id, digest: artifact.digest }, adoptionId: adoption.id, validity: "valid", reasons: [] })
  return adoption
}
const state = (): State => ({ results: [], artifacts: [], adoptions: [] })

test("A01: exact refs, mandatory inputs, endpoint types and duplicate producers are checked", () => {
  const bundle = fan(); validateGraph(bundle)
  const missing = clone(bundle); missing.graph.edges.shift(); sealGraph(missing)
  assert.throws(() => validateGraph(missing), /Unbound required input/)
  const duplicate = clone(bundle); consume(duplicate, "source", "y", "a", "input"); sealGraph(duplicate)
  assert.throws(() => validateGraph(duplicate), /Multiple producers/)
  const foreign = clone(bundle); foreign.tasks[0] = withDigest({ ...foreign.tasks[0]!, executionPolicyRef: { ...foreign.tasks[0]!.executionPolicyRef, revision: 999 } }); sealGraph(foreign)
  assert.throws(() => validateGraph(foreign), /Unresolved exact revision/)
  const missingPort = clone(bundle); consume(missingPort, "source", "no-port", "b", "input"); sealGraph(missingPort)
  assert.throws(() => validateGraph(missingPort), /existing leaf\/source/)
})

test("A01: combined consumes and after cycles are rejected", () => {
  const bundle = fan(); bundle.graph.edges.push({ kind: "after", predecessor: "c", successor: "a" }); sealGraph(bundle)
  assert.throws(() => validateGraph(bundle), /execution graph contains a cycle/)
})

test("A01: contains is a forest and cannot substitute for execution edges", () => {
  const bundle = fan()
  bundle.graph.groups = [{ id: "g", objective: "group", requiredTaskIds: ["a"], requiredIntegrationIds: [] }, { id: "h", objective: "group", requiredTaskIds: ["a"], requiredIntegrationIds: [] }]
  bundle.graph.edges.push({ kind: "contains", groupId: "g", childId: "a" }, { kind: "contains", groupId: "h", childId: "a" }); sealGraph(bundle)
  assert.throws(() => validateGraph(bundle), /Multiple parents/)
  bundle.graph.edges.pop(); bundle.graph.edges.push({ kind: "after", predecessor: "g", successor: "b" }); sealGraph(bundle)
  assert.throws(() => validateGraph(bundle), /execution leaves/)
})

test("A02: all required outputs and integration results are needed for group completion", () => {
  const bundle = fixtureBundle(); bundle.tasks = [leaf(bundle, "a"), leaf(bundle, "b"), withDigest({ ...leaf(bundle, "integration"), kind: "integration" })]
  bundle.graph.groups = [{ id: "group", objective: "joint result", requiredTaskIds: ["a", "b"], requiredIntegrationIds: ["integration"] }]
  for (const task of bundle.tasks) bundle.graph.edges.push({ kind: "contains", groupId: "group", childId: task.id })
  bundle.graph.completionTargets = ["group"]; sealGraph(bundle); validateGraph(bundle)
  const s = state(); adopt(bundle, "a", s); adopt(bundle, "b", s)
  assert.equal(taskComplete(bundle, "group", s.results), false)
  adopt(bundle, "integration", s); assert.equal(graphComplete(bundle, s.results), true)
  s.results.at(-1)!.validity = "check_required"; assert.equal(graphComplete(bundle, s.results), false)
})

test("A03: sources have registered immutable artifacts without execution attempts", () => {
  const bundle = fan(), ready = resolveInputs(bundle, "a", [], [], [])
  assert.equal(ready.ready, true); assert.equal(ready.snapshot!.bindings[0]!.producer.nodeId, "source")
  const incomplete = clone(bundle); incomplete.sourceArtifacts.pop()
  assert.throws(() => validateGraph(incomplete), /Missing or foreign source artifact/)
  const foreign = clone(bundle), artifact = foreign.sourceArtifacts[0]!
  if (artifact.origin.kind === "source") artifact.origin.sourceId = "another-source"
  foreign.sourceArtifacts[0] = withDigest(artifact)
  const output = foreign.graph.sources[0]!.outputs[0]!; output.artifactRef.digest = foreign.sourceArtifacts[0]!.digest; sealGraph(foreign)
  assert.throws(() => validateGraph(foreign), /foreign source artifact/)
})

test("A04: leaf inputs require valid adopted artifacts and cannot consume unadopted bytes", () => {
  const bundle = fan(), s = state()
  assert.equal(resolveInputs(bundle, "c", s.results, s.artifacts, s.adoptions).ready, false)
  adopt(bundle, "a", s)
  assert.equal(resolveInputs(bundle, "c", s.results, s.artifacts, s.adoptions).ready, true)
  assert.equal(resolveInputs(bundle, "c", s.results, s.artifacts, []).ready, false)
  s.results[0]!.validity = "check_required"
  assert.equal(resolveInputs(bundle, "c", s.results, s.artifacts, s.adoptions).ready, false)
})

test("A05: a known source port change reaches its consumers but preserves the other port and independent path", () => {
  const before = fan(), after = changeSource(before, "x", "x2")
  const impact = analyzeChange(before, after)
  assert.deepEqual(impact.affectedTaskIds, ["a", "c"])
  assert.equal(impact.reasons.b, undefined); assert.equal(impact.reasons.independent, undefined)
  assert.ok(impact.reasons.c!.some(reason => reason.includes("source.x")))
})

test("A05: an unknown task output change propagates through all of its output ports", () => {
  const before = fixtureBundle(); before.tasks = [leaf(before, "a", [], ["x", "y"]), leaf(before, "b", ["input"]), leaf(before, "c", ["input"]), leaf(before, "independent")]
  consume(before, "a", "x", "b", "input"); consume(before, "a", "y", "c", "input"); before.graph.completionTargets = ["b", "c", "independent"]; sealGraph(before)
  const after = clone(before); after.tasks[0] = withDigest({ ...after.tasks[0]!, revision: 2, objective: "새 동작" }); sealGraph(after, true)
  assert.deepEqual(analyzeChange(before, after).affectedTaskIds, ["a", "b", "c"])
})

test("A06: artifact identity and unrelated graph revisions change provenance, not reuse meaning", () => {
  const before = fan(), s = state(), previous = adopt(before, "a", s)
  const after = changeSource(before, "x", "x1", "replacement-id")
  const next = resolveInputs(after, "a", [], [], []).snapshot!
  assert.notEqual(next.provenanceDigest, previous.currentInputs.provenanceDigest)
  assert.equal(next.semanticReuseKey, previous.currentInputs.semanticReuseKey)
  assert.deepEqual(analyzeChange(before, after).affectedTaskIds, [])
  assert.equal(decideRework(after, "a", next, previous).action, "reuse")
})

test("A06: unchanged task meaning can retain artifacts after a spec counter-only revision", () => {
  const before = fan(), s = state(), previous = adopt(before, "a", s)
  const after = clone(before); after.tasks[0] = withDigest({ ...after.tasks[0]!, revision: 2 }); sealGraph(after, true)
  const next = resolveInputs(after, "a", [], [], []).snapshot!
  assert.equal(next.semanticReuseKey, previous.currentInputs.semanticReuseKey)
  assert.deepEqual(analyzeChange(before, after).affectedTaskIds, [])
  assert.equal(resolveInputs(after, "c", s.results, s.artifacts, s.adoptions).ready, true)
})

test("A06: changed input requires explicit compatibility validation and a prior candidate", () => {
  const before = fan(), s = state(), previous = adopt(before, "a", s)
  const changed = changeSource(before, "x", "x2"), next = resolveInputs(changed, "a", [], [], []).snapshot!
  assert.equal(decideRework(changed, "a", next, previous).action, "rerun")
  assert.equal(decideRework(changed, "a", undefined, previous).action, "wait")
  assert.equal(decideRework(changed, "a", next).action, "rerun")
})

test("A06: a declared semantic validator authorizes revalidation of the old output with new inputs", () => {
  const before = fixtureBundle()
  const compatibility: ValidatorRevision = withDigest({ id: "semantic-check", revision: 1, definition: { kind: "argv", argv: ["node", "validate-combination.mjs"], timeoutMs: 1000 }, implementationDigest: digest("semantic-validator"), configurationDigest: digest({}) })
  before.validators.push(compatibility)
  before.contracts[0] = withDigest({ ...before.contracts[0]!, compatibilityValidators: [ref(compatibility)] })
  before.tasks = [leaf(before, "consumer", ["input"])]; addSource(before, "source", { x: "one" }); consume(before, "source", "x", "consumer", "input"); before.graph.completionTargets = ["consumer"]; sealGraph(before)
  const s = state(), previous = adopt(before, "consumer", s)
  const after = changeSource(before, "x", "two"), next = resolveInputs(after, "consumer", [], [], []).snapshot!
  const decision = decideRework(after, "consumer", next, previous)
  assert.equal(decision.action, "revalidate"); assert.deepEqual(decision.validatorRefs, [ref(compatibility)])
  assert.equal(decideRework(after, "consumer", next).action, "rerun")
})

test("A06: integrity-only validation cannot stand in for input/output semantic compatibility", () => {
  const bundle = fixtureBundle()
  bundle.contracts[0] = withDigest({ ...bundle.contracts[0]!, compatibilityValidators: [ref(bundle.validators[0]!)] })
  bundle.tasks[0] = withDigest({ ...bundle.tasks[0]!, outputPorts: [{ ...bundle.tasks[0]!.outputPorts[0]!, contractRef: ref(bundle.contracts[0]!) }] }); sealGraph(bundle)
  assert.throws(() => validateGraph(bundle), /unsupported compatibility_builtin/)
})

test("A06: changed exact policy refs cannot reuse old execution evidence", () => {
  const before = fan(), s = state(), previous = adopt(before, "a", s)
  const after = clone(before); after.policies[0] = withDigest({ ...after.policies[0]!, revision: 2 }); after.tasks[0] = withDigest({ ...after.tasks[0]!, revision: 2, executionPolicyRef: ref(after.policies[0]!) })
  // Unchanged leaves still pin the original immutable policy revision.
  after.policies.push(before.policies[0]!); sealGraph(after, true)
  const next = resolveInputs(after, "a", [], [], []).snapshot!
  assert.notEqual(next.semanticReuseKey, previous.currentInputs.semanticReuseKey)
  assert.equal(decideRework(after, "a", next, previous).action, "rerun")
})

test("A07: after predecessor output changes affect readiness without invalidating completed successors", () => {
  const before = fan(); before.graph.edges.push({ kind: "after", predecessor: "a", successor: "independent" }); sealGraph(before)
  const s = state(); assert.equal(resolveInputs(before, "independent", [], [], []).ready, false)
  adopt(before, "a", s); assert.equal(resolveInputs(before, "independent", s.results, s.artifacts, s.adoptions).ready, true)
  const after = changeSource(before, "x", "x2")
  assert.deepEqual(analyzeChange(before, after).affectedTaskIds, ["a", "c"])
})

test("A07: a newly added after obligation cannot reuse a prior result merely because data inputs match", () => {
  const before = fan(), s = state(), previous = adopt(before, "independent", s)
  const after = clone(before); after.graph.edges.push({ kind: "after", predecessor: "a", successor: "independent" }); sealGraph(after, true)
  adopt(after, "a", s)
  const next = resolveInputs(after, "independent", s.results, s.artifacts, s.adoptions).snapshot!
  assert.equal(decideRework(after, "independent", next, previous).action, "rerun")
  assert.ok(analyzeChange(before, after).affectedTaskIds.includes("independent"))
})

test("A08: removing a producer still reaches old consumer paths after rebinding", () => {
  const before = fan(), after = clone(before)
  after.tasks = after.tasks.filter(task => task.id !== "a")
  after.graph.edges = after.graph.edges.filter(edge => edge.kind !== "consumes" || edge.from.nodeId !== "a" && edge.to.nodeId !== "a")
  consume(after, "source", "y", "c", "input"); after.graph.completionTargets = after.graph.completionTargets.filter(id => id !== "a"); sealGraph(after, true)
  const impact = analyzeChange(before, after)
  assert.deepEqual(impact.removedTaskIds, ["a"])
  assert.deepEqual(impact.affectedTaskIds, ["c"])
})

test("moving a task between groups does not invalidate its execution meaning", () => {
  const before = fan(); before.graph.groups = [{ id: "g", objective: "one", requiredTaskIds: ["a"], requiredIntegrationIds: [] }]; before.graph.edges.push({ kind: "contains", groupId: "g", childId: "a" }); sealGraph(before)
  const after = clone(before); after.graph.groups[0]!.id = "h"; after.graph.edges = after.graph.edges.map(edge => edge.kind === "contains" ? { ...edge, groupId: "h" } : edge); sealGraph(after, true)
  assert.deepEqual(analyzeChange(before, after).affectedTaskIds, [])
})

test("revision comparison cannot implicitly cross graph identities", () => {
  const before = fan(), after = clone(before); after.graph = withDigest({ ...after.graph, id: "another" })
  assert.throws(() => analyzeChange(before, after), /different graphs/)
})
