import { canonical, deepFreeze, DIGEST_PATTERN, revisionDigest } from "./canonical.ts"
import type { AdoptionRecord, AgentCommand, ArtifactManifest, CaptureResult, CheckpointManifest, GraphBundle, InputSnapshot, LaunchRequest, StopReceipt, ValidationEvidence } from "./model.ts"

export class ContractValidationError extends Error {
  readonly code = "invalid_contract"
  constructor(path: string, message: string) {
    super(`${path}: ${message}`)
    this.name = "ContractValidationError"
  }
}

type Check = (value: unknown, path: string) => void
const fail = (path: string, message: string): never => { throw new ContractValidationError(path, message) }
const text: Check = (v, p) => { if (typeof v !== "string" || !v.trim() || v.includes("\0")) fail(p, "expected nonempty text without NUL") }
const identifier: Check = (v, p) => { text(v, p); if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(v as string)) fail(p, "invalid identifier") }
const hash: Check = (v, p) => { if (typeof v !== "string" || !DIGEST_PATTERN.test(v)) fail(p, "expected sha256 digest") }
const natural: Check = (v, p) => { if (!Number.isSafeInteger(v) || (v as number) < 0) fail(p, "expected nonnegative safe integer") }
const positive: Check = (v, p) => { natural(v, p); if (v === 0) fail(p, "expected positive integer") }
const positiveNumber: Check = (v, p) => { if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) fail(p, "expected positive finite number") }
const boolean: Check = (v, p) => { if (typeof v !== "boolean") fail(p, "expected boolean") }
const literal = (...values: unknown[]): Check => (v, p) => { if (!values.includes(v)) fail(p, `expected ${values.join(" | ")}`) }
const optional = (check: Check): Check => (v, p) => { if (v !== undefined) check(v, p) }
const array = (check: Check, minimum = 0): Check => (v, p) => {
  if (!Array.isArray(v) || v.length < minimum) fail(p, `expected array with at least ${minimum} items`)
  ;(v as unknown[]).forEach((item, i) => check(item, `${p}[${i}]`))
}
const object = (fields: Record<string, Check>): Check => (v, p) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(p, "expected object")
  const record = v as Record<string, unknown>
  for (const key of Object.keys(record)) if (!Object.hasOwn(fields, key)) fail(`${p}.${key}`, "unknown field")
  for (const [key, check] of Object.entries(fields)) check(record[key], `${p}.${key}`)
}
const variant = (key: string, checks: Record<string, Check>): Check => (v, p) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(p, "expected discriminated object")
  const tag = (v as Record<string, unknown>)[key]
  if (typeof tag !== "string" || !Object.hasOwn(checks, tag)) fail(`${p}.${key}`, "unknown variant")
  checks[tag as string]!(v, p)
}
const relativePath: Check = (v, p) => {
  text(v, p)
  if (typeof v !== "string" || v.startsWith("/") || v.includes("\\") || /^[a-z]:/i.test(v) || v.split("/").some(part => !part || part === ".." || part === ".")) fail(p, "expected normalized project-relative path")
}
const destination: Check = (v, p) => { if (v !== ".") relativePath(v, p) }
const inputPort: Check = (v, p) => {
  object({ name: identifier, contractRef: revisionRef, mountPath: text })(v, p)
  const value = v as { name: string; mountPath: string }
  if (value.mountPath !== `/inputs/${value.name}`) fail(`${p}.mountPath`, "must exactly match /inputs/<port name>")
}
const json: Check = (v, p) => { try { canonical(v) } catch (error) { fail(p, (error as Error).message) } }
const jsonSchema: Check = (v, p) => {
  json(v, p)
  if (typeof v !== "boolean" && (!v || typeof v !== "object" || Array.isArray(v))) fail(p, "JSON schema must be an object or boolean")
}
const revisionFields = { id: identifier, revision: positive, digest: hash }
const revisionRef = object(revisionFields)
const artifactRef = object({ id: identifier, digest: hash })
const blob = object({ uri: text, digest: hash, size: natural })
const port = object({ nodeId: identifier, port: identifier })
const argv: Check = (v, p) => {
  array((item, path) => { if (typeof item !== "string" || item.includes("\0")) fail(path, "expected argv string without NUL") }, 1)(v, p)
  text((v as unknown[])[0], `${p}[0]`)
}
const revisionObject = (fields: Record<string, Check>): Check => (v, p) => {
  object({ ...revisionFields, ...fields })(v, p)
  if (revisionDigest(v as object) !== (v as { digest: string }).digest) fail(`${p}.digest`, "does not match immutable revision content")
}
const shape = variant("kind", {
  file: object({ kind: literal("file"), mediaType: text }),
  json: object({ kind: literal("json"), schema: jsonSchema }),
  directory: object({ kind: literal("directory"), requiredPaths: array(relativePath) }),
})
const validatorDefinition: Check = (v, p) => {
  const record = v as Record<string, unknown> | null
  if (record?.kind === "builtin" && record.check === "integrity") object({ kind: literal("builtin"), check: literal("integrity") })(v, p)
  else if (record?.kind === "builtin" && record.check === "json-schema") object({ kind: literal("builtin"), check: literal("json-schema"), schema: jsonSchema })(v, p)
  else object({ kind: literal("argv"), argv, timeoutMs: positive })(v, p)
}
const contract = revisionObject({ purpose: text, shape, invariants: array(text), validators: array(revisionRef, 1), compatibilityValidators: array(revisionRef) })
const validator = revisionObject({ definition: validatorDefinition, implementationDigest: hash, configurationDigest: hash })
const step = object({ id: identifier, argv, outputs: array(relativePath), timeoutMs: positive, effectPolicy: literal("replayable", "requires-receipt") })
const task = revisionObject({
  objective: text, kind: literal("work", "integration"),
  inputPorts: array(inputPort),
  outputPorts: array(object({ name: identifier, contractRef: revisionRef, path: relativePath }), 1),
  design: object({ rationale: text, steps: array(step, 1), acceptance: array(revisionRef, 1) }),
  workspaceTemplateRef: revisionRef, executionPolicyRef: revisionRef,
})
const image: Check = (v, p) => {
  text(v, p)
  if (typeof v !== "string" || !/^[^\s@]+@sha256:[a-f0-9]{64}$/.test(v)) fail(p, "container image must use an exact sha256 digest")
}
const template = revisionObject({ environment: object({ kind: literal("container"), image }), sourceSnapshots: array(object({ snapshot: blob, destination })), bootstrap: array(step) })
const policy = revisionObject({
  network: literal("none", "restricted"), allowedHosts: array(text),
  resources: object({ cpus: positiveNumber, memoryBytes: positive, pids: positive, timeoutMs: positive }),
  secretRefs: array(text), allowedEffects: array(text),
})
const source = object({ id: identifier, outputs: array(object({ name: identifier, contractRef: revisionRef, artifactRef }), 1), registrationEvidence: object({ issuer: text, source: text, digest: hash }) })
const group = object({ id: identifier, objective: text, requiredTaskIds: array(identifier, 1), requiredIntegrationIds: array(identifier) })
const edge = variant("kind", {
  consumes: object({ kind: literal("consumes"), from: port, to: port }),
  after: object({ kind: literal("after"), predecessor: identifier, successor: identifier }),
  contains: object({ kind: literal("contains"), groupId: identifier, childId: identifier }),
})
const graph = revisionObject({
  baseRevision: natural, taskSpecRefs: array(revisionRef, 1), sources: array(source), groups: array(group), edges: array(edge),
  completionTargets: array(identifier, 1), reviewEvidence: object({ reviewer: text, rationale: text }),
})
const snapshot = object({
  graphRef: revisionRef, taskSpecRef: revisionRef,
  bindings: array(object({ inputPort: identifier, producer: port, artifactRef, contractRef: revisionRef, contentDigest: hash })),
  orderObligations: array(object({ predecessor: identifier, successor: identifier, completionAdoptionId: identifier })),
  workspaceTemplateDigest: hash, executionPolicyDigest: hash, validatorRefs: array(revisionRef), taskMeaningDigest: hash, provenanceDigest: hash, semanticReuseKey: hash,
})
const artifactFields = { id: identifier, digest: hash, outputPort: identifier, contractRef: revisionRef, contentDigest: hash, storage: blob, validationEvidenceIds: array(identifier) }
const artifact: Check = (v, p) => {
  const origin = (v as { origin?: { kind?: string } } | null)?.origin
  if (origin?.kind === "source") object({ ...artifactFields, origin: object({ kind: literal("source"), sourceId: identifier, issuer: text, source: text, registrationDigest: hash }) })(v, p)
  else object({ ...artifactFields, origin: object({ kind: literal("execution"), taskSpecRef: revisionRef, attemptId: identifier }), consumedInputs: snapshot })(v, p)
  if (revisionDigest(v as object) !== (v as { digest: string }).digest) fail(`${p}.digest`, "does not match artifact manifest")
}
const evidence = object({ id: identifier, validatorRef: revisionRef, validationRunId: identifier, trustedIssuer: text, validationEnvironmentDigest: hash, subjects: array(artifactRef, 1), inputSnapshotDigest: hash, outcome: literal("passed", "failed", "inconclusive"), report: blob })
const adoptionFields = { id: identifier, targetGraphRef: revisionRef, targetTaskSpecRef: revisionRef, currentInputs: snapshot, artifactRefs: array(artifactRef, 1), validationEvidenceIds: array(identifier, 1) }
const adoption = variant("mode", {
  fresh: object({ ...adoptionFields, mode: literal("fresh"), attemptId: identifier, fence: positive }),
  reuse: object({ ...adoptionFields, mode: literal("reuse"), originalAdoptionId: identifier, equivalenceEvidenceIds: array(identifier, 1) }),
  revalidate: object({ ...adoptionFields, mode: literal("revalidate"), originalAdoptionId: identifier, equivalenceEvidenceIds: array(identifier, 1) }),
})
const bundle = object({ schemaVersion: literal(1), graph, contracts: array(contract, 1), tasks: array(task, 1), templates: array(template, 1), policies: array(policy, 1), validators: array(validator, 1), sourceArtifacts: array(artifact) })

/** Structural/digest validation only. Graph connectivity and execution semantics belong to the kernel. */
export function validateGraphBundle(value: unknown): asserts value is GraphBundle {
  json(value, "bundle")
  bundle(value, "bundle")
  const input = value as GraphBundle
  for (const [name, entries] of Object.entries({ contracts: input.contracts, tasks: input.tasks, templates: input.templates, policies: input.policies, validators: input.validators })) {
    const seen = new Set<string>()
    for (const entry of entries) {
      const key = `${entry.id}@${entry.revision}`
      if (seen.has(key)) fail(`bundle.${name}`, `duplicate immutable revision ${key}`)
      seen.add(key)
    }
  }
  if (input.sourceArtifacts.some(entry => entry.origin.kind !== "source")) fail("bundle.sourceArtifacts", "requires source-origin manifests")
  if (input.graph.revision !== input.graph.baseRevision + 1) fail("bundle.graph.revision", "must immediately follow baseRevision")
}

/** A detached, deeply frozen value prevents callers from mutating a validated proposal. */
export function parseGraphBundle(value: unknown): GraphBundle {
  validateGraphBundle(value)
  return deepFreeze(JSON.parse(canonical(value)) as GraphBundle)
}

const taskCommand = (kind: string) => object({ kind: literal(kind), taskId: identifier })
const command = object({ operationId: identifier, graphId: identifier, expectedRevision: natural, payload: variant("kind", {
  proposeGraph: object({ kind: literal("proposeGraph"), bundle }),
  activateGraph: object({ kind: literal("activateGraph"), bundle }),
  requestRun: taskCommand("requestRun"), requestSuspend: taskCommand("requestSuspend"), requestResume: taskCommand("requestResume"), requestCancel: taskCommand("requestCancel"),
  submitCandidate: object({ kind: literal("submitCandidate"), attemptId: identifier, fence: positive, artifacts: array(artifact, 1) }),
  recordValidation: object({ kind: literal("recordValidation"), evidence }),
  adoptResult: object({ kind: literal("adoptResult"), adoption }),
}) })

export function validateCommand(value: unknown): asserts value is AgentCommand {
  json(value, "command")
  command(value, "command")
  const parsed = value as AgentCommand
  if (parsed.payload.kind === "activateGraph" || parsed.payload.kind === "proposeGraph") {
    validateGraphBundle(parsed.payload.bundle)
    if (parsed.payload.bundle.graph.id !== parsed.graphId) fail("command.graphId", "does not match proposal graph")
  }
}

const identityFields = { intentId: identifier, attemptId: identifier, workspaceId: identifier, fence: positive, backendHandle: optional(text) }
const identity = object(identityFields)
const stopReceipt: Check = (v, p) => {
  const termination = (v as { termination?: { kind?: string } } | null)?.termination
  const fields = { intentId: identifier, attemptId: identifier, workspaceId: identifier, fence: positive, observationSource: text, stoppedAt: text }
  if (termination?.kind === "creation-revoked") object({ ...fields, termination: object({ kind: literal("creation-revoked"), tombstone: text }) })(v, p)
  else object({ ...fields, backendHandle: text, termination: object({ kind: literal("all-writers-terminated"), evidence: text }) })(v, p)
}
const effectReceipt = object({ scope: text, key: text, payloadDigest: hash, state: literal("confirmed", "unknown"), evidence: optional(text) })
const completedStep = object({ stepId: identifier, stepSpecDigest: hash, inputDigest: hash, outputDigest: hash })
const checkpoint = object({
  id: identifier, attemptId: identifier, fence: positive, workspaceSnapshot: blob, taskSpecRef: revisionRef,
  inputSnapshotDigest: hash, templateDigest: hash, completedSteps: array(completedStep), agentSession: optional(blob), effectReceipts: array(effectReceipt), integrityDigest: hash,
})
const hostPath: Check = (v, p) => {
  text(v, p)
  if (typeof v !== "string" || !v.startsWith("/")) fail(p, "expected absolute host path")
}
const launch = object({
  ...identityFields, task, template, policy, inputSnapshot: snapshot, inputArtifacts: array(artifact),
  readOnlyInputs: array(object({ port: identifier, digest: hash, hostPath })), sourceSnapshotPath: optional(hostPath),
  resumeCheckpoint: optional(object({ manifest: checkpoint, snapshotPath: hostPath })),
})
const mode: Check = (v, p) => { natural(v, p); if ((v as number) > 0o777) fail(p, "special permission bits are unsupported") }
const capture = object({
  identity, workspace: object({ path: hostPath, digest: hash, files: array(object({ path: relativePath, kind: literal("file", "directory"), digest: hash, size: natural, mode })) }),
  outputs: array(object({ port: identifier, snapshot: object({ path: hostPath, digest: hash, files: array(object({ path: relativePath, kind: literal("file", "directory"), digest: hash, size: natural, mode })) }) })),
  checkpoint: optional(object({ completedSteps: array(completedStep), effectReceipts: array(effectReceipt), agentSessionPath: optional(hostPath) })),
})

export function validateInputSnapshot(value: unknown): asserts value is InputSnapshot { json(value, "snapshot"); snapshot(value, "snapshot") }
export function validateArtifactManifest(value: unknown): asserts value is ArtifactManifest { json(value, "artifact"); artifact(value, "artifact") }
export function validateValidationEvidence(value: unknown): asserts value is ValidationEvidence { json(value, "evidence"); evidence(value, "evidence") }
export function validateAdoptionRecord(value: unknown): asserts value is AdoptionRecord { json(value, "adoption"); adoption(value, "adoption") }
export function validateStopReceipt(value: unknown): asserts value is StopReceipt { json(value, "receipt"); stopReceipt(value, "receipt") }
export function validateCheckpointManifest(value: unknown): asserts value is CheckpointManifest { json(value, "checkpoint"); checkpoint(value, "checkpoint") }
export function validateLaunchRequest(value: unknown): asserts value is LaunchRequest { json(value, "launch"); launch(value, "launch") }
export function validateCaptureResult(value: unknown): asserts value is CaptureResult { json(value, "capture"); capture(value, "capture") }
export function validateRelativePath(value: unknown): void { relativePath(value, "path") }
