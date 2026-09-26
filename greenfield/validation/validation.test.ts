import test from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { FileArtifactStore } from "../artifacts/index.ts"
import { createExample } from "../examples/index.ts"
import { digest, ref, withDigest } from "../contracts/canonical.ts"
import type { ArtifactManifest, JsonValue, LaunchRequest, RuntimeBackend, ValidationRequest } from "../contracts/model.ts"
import { resolveInputs } from "../kernel/inputs.ts"
import { DockerRuntimeBackend } from "../runtime/docker.ts"
import { ValidationService, validateArtifactShape, validateJsonSchema, verifyValidationEvidence } from "./index.ts"
import { validateSources } from "./sources.ts"

const noRuntime: RuntimeBackend = {
  async ensureStarted() { throw new Error("Builtin validation must not launch") },
  async observe() { throw new Error("Not launched") },
  async requestStop() { throw new Error("Not launched") },
  async captureStoppedWorkspace() { throw new Error("Not launched") },
}
function fixture(t: any) {
  const root = mkdtempSync(join(tmpdir(), "task-agent-validator-")), store = new FileArtifactStore(join(root, "cas"))
  t.after(() => {
    const unseal = (path: string) => { if (!lstatSync(path).isDirectory()) return; chmodSync(path, 0o700); for (const name of readdirSync(path)) unseal(join(path, name)) }
    unseal(root); rmSync(root, { recursive: true, force: true })
  })
  const bundle = createExample(store)
  const inputs = resolveInputs(bundle, "A", [], bundle.sourceArtifacts, []).snapshot!
  const request: ValidationRequest = { id: "validation-request-1", validator: bundle.validators[0]!, inputs, artifacts: bundle.sourceArtifacts, inputArtifacts: bundle.sourceArtifacts, template: bundle.templates[0]!, policy: bundle.policies[0]! }
  return { root, store, bundle, request }
}

test("JSON Schema resolves references and enforces composed constraints, formats and unique items", async () => {
  const schema: JsonValue = { type: "object", $defs: { email: { type: "string", format: "email" } }, properties: { email: { $ref: "#/$defs/email" }, tags: { type: "array", uniqueItems: true, items: { type: "string" } }, value: { oneOf: [{ type: "integer", minimum: 1 }, { const: "unlimited" }] } }, required: ["email", "tags", "value"], additionalProperties: false }
  assert.equal((await validateJsonSchema(schema, { email: "person@example.com", tags: ["a", "b"], value: 2 })).outcome, "passed")
  for (const data of [{ email: "invalid", tags: [], value: 2 }, { email: "a@b.com", tags: ["a", "a"], value: 2 }, { email: "a@b.com", tags: [], value: 0 }]) assert.equal((await validateJsonSchema(schema, data)).outcome, "failed")
  const modern = { $schema: "https://json-schema.org/draft/2020-12/schema", type: "array", prefixItems: [{ type: "integer" }], items: false }
  assert.equal((await validateJsonSchema(modern, [2])).outcome, "passed")
  assert.equal((await validateJsonSchema(modern, [2, 3])).outcome, "failed")
})

test("unknown schema dialects, remote references and async schemas never become passes", async () => {
  const schemas: JsonValue[] = [{ $schema: "https://unsupported.invalid/schema" }, { $ref: "https://example.invalid/unavailable-schema" }, { $async: true, type: "string" }]
  for (const schema of schemas) assert.equal((await validateJsonSchema(schema, "value")).outcome, "inconclusive")
  assert.equal((await validateJsonSchema(true, {}, 1)).outcome, "inconclusive")
})

test("source shape validates JSON and rejects ambiguous multiple-file trees", async t => {
  const { root, store, bundle } = fixture(t)
  assert.equal((await validateArtifactShape(bundle.sourceArtifacts[0]!, bundle.contracts[0]!, store)).outcome, "passed")
  const path = join(root, "two-files"); mkdirSync(path)
  writeFileSync(join(path, "a.json"), '{"value":1}'); writeFileSync(join(path, "b.json"), '{"value":1}')
  const tree = store.ingestDirectory(path)
  const bad = withDigest({ ...bundle.sourceArtifacts[0]!, contentDigest: tree.ref.digest, storage: tree.ref }) as ArtifactManifest
  const result = await validateArtifactShape(bad, bundle.contracts[0]!, store)
  assert.equal(result.outcome, "failed"); assert.match(result.diagnostics.join(), /exactly one/)
})

test("controller evidence is content-bound, restart-stable, and request IDs reject changed payloads", async t => {
  const { store, request } = fixture(t)
  const first = await new ValidationService(noRuntime, store).validate(request)
  const second = await new ValidationService(noRuntime, store).validate(request)
  assert.deepEqual(first, second); assert.equal(first.outcome, "passed")
  assert.equal(first.trustedIssuer, "task-agent/controller-validator-v1")
  assert.deepEqual(first.subjects, request.artifacts.map(a => ({ id: a.id, digest: a.digest })))
  const report = JSON.parse(Buffer.from(await store.get(first.report)).toString())
  assert.equal(first.validationEnvironmentDigest, digest(report.environment))
  assert.equal(first.inputSnapshotDigest, request.inputs.provenanceDigest)
  await verifyValidationEvidence(request, first, store)
  const unrelatedReport = await store.put(Buffer.from(JSON.stringify({ validationRequestId: "other", requestDigest: digest(request), result: { outcome: "failed" }, environment: report.environment })))
  await assert.rejects(verifyValidationEvidence(request, { ...first, report: unrelatedReport }, store), /report.*bound/)
  await assert.rejects(verifyValidationEvidence(request, { ...first, validationEnvironmentDigest: digest("foreign environment") }, store), /environment mismatch/)
  await assert.rejects(new ValidationService(noRuntime, store).validate({ ...request, artifacts: [...request.artifacts, ...request.artifacts] }), /different payload/)
})

test("source registration runs every contract validator and rejects shape-valid content rejected by its validator", async t => {
  const { store, bundle } = fixture(t)
  const rejecting = withDigest({ ...bundle.validators[0]!, definition: { kind: "builtin" as const, check: "json-schema" as const, schema: false } })
  const custom = withDigest({ ...rejecting, id: "source-rejector" })
  bundle.validators.push(custom)
  const contract = withDigest({ ...bundle.contracts[0]!, validators: [ref(custom)] })
  bundle.contracts = [contract]
  bundle.tasks = bundle.tasks.map(task => withDigest({ ...task, inputPorts: task.inputPorts.map(port => ({ ...port, contractRef: ref(contract) })), outputPorts: task.outputPorts.map(port => ({ ...port, contractRef: ref(contract) })) }))
  bundle.sourceArtifacts = bundle.sourceArtifacts.map(artifact => withDigest({ ...artifact, contractRef: ref(contract) }))
  const source = bundle.sourceArtifacts[0]!
  bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: bundle.tasks.map(ref), sources: bundle.graph.sources.map(node => ({ ...node, outputs: node.outputs.map(port => ({ ...port, contractRef: ref(contract), artifactRef: { id: source.id, digest: source.digest } })) })) })
  assert.equal((await validateArtifactShape(source, contract, store)).outcome, "passed")
  await assert.rejects(validateSources(bundle, new ValidationService(noRuntime, store), store), /validator rejected/)
})

test("source evidence is stable across activation retries and covers each exact consumer environment", async t => {
  const { store, bundle } = fixture(t), requests: ValidationRequest[] = []
  const policy = withDigest({ ...bundle.policies[0]!, id: "different-resource-policy", resources: { ...bundle.policies[0]!.resources, cpus: 0.25 } })
  bundle.policies.push(policy)
  bundle.tasks = bundle.tasks.map(task => task.id !== "D" ? task : withDigest({ ...task, inputPorts: [{ name: "value", contractRef: ref(bundle.contracts[0]!), mountPath: "/inputs/value" }], executionPolicyRef: ref(policy) }))
  bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: bundle.tasks.map(ref), edges: [...bundle.graph.edges, { kind: "consumes" as const, from: { nodeId: "source", port: "value" }, to: { nodeId: "D", port: "value" } }] })
  const real = new ValidationService(noRuntime, store), recording = { async validate(request: ValidationRequest) { requests.push(request); return real.validate(request) } }
  const first = await validateSources(bundle, recording, store)
  assert.equal(first.length, 2); assert.equal(requests.length, 2)
  assert.deepEqual(new Set(requests.map(request => request.policy.digest)), new Set(bundle.policies.map(value => value.digest)))
  assert.ok(requests.every(request => request.inputs.taskSpecRef.id.startsWith("source-registration-") && request.inputs.bindings.length === 0))
  assert.deepEqual(await validateSources(bundle, recording, store), first); assert.equal(requests.length, 2)
  assert.deepEqual(bundle.sourceArtifacts[0]!.validationEvidenceIds, [])
})

test("unavailable source validation prevents activation completion without creating an execution attempt", async t => {
  const { store, bundle } = fixture(t)
  await assert.rejects(validateSources(bundle, { async validate() { throw new Error("runtime unavailable") } }, store), /validation_pending/)
})

test("argv retries retain intent identity and mount candidates plus original inputs independently", async t => {
  const { store, request } = fixture(t), calls: LaunchRequest[] = []
  const runtime: RuntimeBackend = { ...noRuntime, async ensureStarted(launch) { calls.push(launch); return { ...launch, observed: "unknown", diagnostic: "daemon unavailable" } } }
  const validator = withDigest({ ...request.validator, definition: { kind: "argv" as const, argv: ["node", "-e", "process.exit(0)"], timeoutMs: 1000 } })
  const argvRequest = { ...request, validator }
  assert.equal((await new ValidationService(runtime, store).validate(argvRequest)).outcome, "inconclusive")
  assert.equal((await new ValidationService(runtime, store).validate(argvRequest)).outcome, "inconclusive")
  assert.equal(calls[0]!.intentId, calls[1]!.intentId)
  assert.deepEqual(calls[0]!.task.inputPorts.map(p => p.mountPath), ["/inputs/candidate-0", "/inputs/input-0"])
  assert.deepEqual(calls[0]!.readOnlyInputs, calls[1]!.readOnlyInputs)
  assert.notEqual(calls[0]!.task.id, request.inputs.taskSpecRef.id)
  assert.notEqual(calls[0]!.workspaceId, request.inputs.taskSpecRef.id)
})

test("real Docker argv validation checks readonly candidates and original inputs and reuses durable evidence", { skip: process.env.TASK_AGENT_DOCKER_TEST !== "1" }, async t => {
  const { root, store, request, bundle } = fixture(t), exec = promisify(execFile), handles: string[] = []
  const runtime = new DockerRuntimeBackend({ root: join(root, "runtime"), execute: async args => {
    const result = await exec("docker", args, { timeout: 30000, maxBuffer: 8 * 1024 * 1024 })
    if (args[0] === "create") handles.push(result.stdout.trim())
    return result
  } })
  t.after(async () => { runtime.close(); for (const handle of handles) await exec("docker", ["rm", "-f", handle]) })
  const script = "const fs=require('node:fs'),a=require('node:assert/strict');for(const p of ['/inputs/candidate-0/data.json','/inputs/input-0/data.json']){a.equal(JSON.parse(fs.readFileSync(p)).value,1);a.throws(()=>fs.writeFileSync(p,'bad'));}a.equal(fs.existsSync('/var/run/docker.sock'),false);a.deepEqual(Object.keys(require('node:os').networkInterfaces()),['lo'])"
  const validator = withDigest({ ...request.validator, definition: { kind: "argv" as const, argv: ["node", "-e", script], timeoutMs: 5000 } })
  const argvRequest = { ...request, validator }
  const first = await new ValidationService(runtime, store).validate(argvRequest)
  const report = JSON.parse(Buffer.from(await store.get(first.report)).toString())
  assert.equal(first.outcome, "passed", JSON.stringify(report))
  assert.deepEqual(await new ValidationService(runtime, store).validate(argvRequest), first)
  assert.equal(handles.length, 1)
  const sourceValidator = withDigest({ ...validator, id: "source-argv", definition: { kind: "argv" as const, argv: ["node", "-e", "const fs=require('node:fs'),a=require('node:assert/strict');a.equal(JSON.parse(fs.readFileSync('/inputs/candidate-0/data.json')).value,1);a.throws(()=>fs.writeFileSync('/inputs/candidate-0/data.json','bad'));"], timeoutMs: 5000 } })
  bundle.validators.push(sourceValidator)
  const contract = withDigest({ ...bundle.contracts[0]!, validators: [ref(sourceValidator)] })
  bundle.contracts = [contract]
  bundle.tasks = bundle.tasks.map(task => withDigest({ ...task, inputPorts: task.inputPorts.map(port => ({ ...port, contractRef: ref(contract) })), outputPorts: task.outputPorts.map(port => ({ ...port, contractRef: ref(contract) })) }))
  bundle.sourceArtifacts = bundle.sourceArtifacts.map(artifact => withDigest({ ...artifact, contractRef: ref(contract) }))
  const source = bundle.sourceArtifacts[0]!
  bundle.graph = withDigest({ ...bundle.graph, taskSpecRefs: bundle.tasks.map(ref), sources: bundle.graph.sources.map(node => ({ ...node, outputs: node.outputs.map(port => ({ ...port, contractRef: ref(contract), artifactRef: { id: source.id, digest: source.digest } })) })) })
  const registered = await validateSources(bundle, new ValidationService(runtime, store), store)
  assert.equal(registered[0]!.outcome, "passed")
  assert.deepEqual(await validateSources(bundle, new ValidationService(runtime, store), store), registered)
  assert.equal(handles.length, 2)
})
