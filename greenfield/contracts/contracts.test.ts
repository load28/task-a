import test from "node:test"
import assert from "node:assert/strict"
import { canonical, contentDigest, digest, ref, revisionDigest, withDigest } from "./canonical.ts"
import { parseGraphBundle, validateCommand, validateGraphBundle, validateStopReceipt } from "./validation.ts"
import { fixtureBundle } from "./fixtures.ts"

test("canonical JSON preserves Korean text and produces order-independent digests", () => {
  assert.equal(canonical({ 나: "한글", a: 1 }), '{"a":1,"나":"한글"}')
  assert.equal(digest({ beta: 2, alpha: ["안녕하세요", 1] }), digest({ alpha: ["안녕하세요", 1], beta: 2 }))
  assert.notEqual(digest(["a", "b"]), digest(["b", "a"]))
  assert.notEqual(digest("abc"), contentDigest("abc"))
})

test("non-JSON values, cycles, sparse arrays and accessors cannot hide in a digest", () => {
  const cycle: Record<string, unknown> = {}; cycle.self = cycle
  const sparse = new Array(2); sparse[1] = 1
  for (const value of [undefined, { ignored: undefined }, NaN, Infinity, 1n, new Date(), cycle, sparse]) assert.throws(() => canonical(value))
  let evaluated = false
  assert.throws(() => canonical({ get value() { evaluated = true; return 1 } }), /accessors/)
  assert.equal(evaluated, false)
})

test("revision digests commit to all declared behavior and ignore only their digest field", () => {
  const original = withDigest({ id: "a", revision: 1, objective: "first" })
  assert.equal(original.digest, revisionDigest(original))
  assert.notEqual(original.digest, revisionDigest({ ...original, objective: "second" }))
  assert.deepEqual(ref(original), { id: "a", revision: 1, digest: original.digest })
})

test("validated graph bundles are detached and deeply immutable", () => {
  const input = fixtureBundle(), parsed = parseGraphBundle(input)
  input.tasks[0]!.objective = "외부 변경"
  assert.equal(parsed.tasks[0]!.objective, "결과 파일 생성")
  assert.throws(() => { parsed.tasks[0]!.design.steps[0]!.argv.push("changed") }, TypeError)
  assert.equal(Object.isFrozen(parsed.graph.edges), true)
})

test("tampered revisions and duplicate revision identities are rejected", () => {
  const tampered = fixtureBundle(); tampered.tasks[0]!.objective = "변경"
  assert.throws(() => validateGraphBundle(tampered), /immutable revision/)
  const duplicate = fixtureBundle(); duplicate.contracts.push(duplicate.contracts[0]!)
  assert.throws(() => validateGraphBundle(duplicate), /duplicate immutable revision/)
})

test("unpinned images, escaping paths and unknown execution options fail closed", () => {
  const image = fixtureBundle(); image.templates[0] = withDigest({ ...image.templates[0]!, environment: { kind: "container", image: "node:latest" } })
  assert.throws(() => validateGraphBundle(image), /exact sha256/)
  const escaping = fixtureBundle(); escaping.tasks[0] = withDigest({ ...escaping.tasks[0]!, outputPorts: [{ ...escaping.tasks[0]!.outputPorts[0]!, path: "../host.txt" }] })
  assert.throws(() => validateGraphBundle(escaping), /project-relative/)
  const unsupported = fixtureBundle() as unknown as { tasks: Array<Record<string, unknown>> }
  unsupported.tasks[0] = withDigest({ ...unsupported.tasks[0], hostNetwork: true })
  assert.throws(() => validateGraphBundle(unsupported), /unknown field/)
})

test("the command boundary rejects missing revision checks and foreign proposals", () => {
  const bundle = fixtureBundle()
  validateCommand({ operationId: "op-1", graphId: bundle.graph.id, expectedRevision: 0, payload: { kind: "activateGraph", bundle } })
  assert.throws(() => validateCommand({ operationId: "op-1", graphId: "foreign", expectedRevision: 0, payload: { kind: "activateGraph", bundle } }), /does not match proposal/)
  assert.throws(() => validateCommand({ operationId: "op-1", graphId: "sample", payload: { kind: "requestRun", taskId: "task-a" } }), /expectedRevision/)
  assert.throws(() => validateCommand({ operationId: "op-1", graphId: "sample", expectedRevision: 0, payload: { kind: "forceSuccess", taskId: "task-a" } }), /unknown variant/)
})

test("schema revisions and mandatory acceptance validators cannot disappear", () => {
  const empty = fixtureBundle(); empty.tasks[0]!.design.acceptance = []; empty.tasks[0] = withDigest(empty.tasks[0]!)
  assert.throws(() => validateGraphBundle(empty), /acceptance/)
  const skipped = fixtureBundle(); skipped.graph = withDigest({ ...skipped.graph, revision: 3 })
  assert.throws(() => validateGraphBundle(skipped), /baseRevision/)
})

test("never-created receipts require a tombstone and terminated writers require an actual handle", () => {
  const identity = { intentId: "intent", attemptId: "attempt", workspaceId: "workspace", fence: 1, observationSource: "trusted-backend", stoppedAt: "2026-01-01T00:00:00.000Z" }
  validateStopReceipt({ ...identity, termination: { kind: "creation-revoked", tombstone: "revoked-intent" } })
  validateStopReceipt({ ...identity, backendHandle: "container-1", termination: { kind: "all-writers-terminated", evidence: "container exited" } })
  assert.throws(() => validateStopReceipt({ ...identity, termination: { kind: "creation-revoked" } }), /tombstone/)
  assert.throws(() => validateStopReceipt({ ...identity, termination: { kind: "all-writers-terminated", evidence: "container exited" } }), /backendHandle/)
})

test("agent invocation pins session/resume behavior and rejects escaping session paths", () => {
  const bundle = fixtureBundle()
  bundle.tasks[0]!.design.steps[0]!.agent = { sessionPath: ".agent/codex", resumeArgv: ["node", "/runtime/codex-agent.mjs", "resume", "test-model"] }
  bundle.tasks[0] = withDigest(bundle.tasks[0]!); bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: bundle.tasks.map(ref) })
  const previous = bundle.tasks[0]!.digest
  validateGraphBundle(bundle)
  bundle.tasks[0]!.design.steps[0]!.agent!.resumeArgv.push("changed")
  bundle.tasks[0] = withDigest(bundle.tasks[0]!); assert.notEqual(bundle.tasks[0]!.digest, previous)
  bundle.tasks[0]!.design.steps[0]!.agent!.sessionPath = "../another-task"
  bundle.tasks[0] = withDigest(bundle.tasks[0]!)
  assert.throws(() => validateGraphBundle(bundle), /project-relative/)
})
