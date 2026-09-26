import { closeSync, existsSync, fsyncSync, linkSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Worker } from "node:worker_threads"
import { setTimeout as delay } from "node:timers/promises"
import { canonical, contentDigest, digest, ref, revisionDigest, sameRef, withDigest } from "../contracts/canonical.ts"
import { validateArtifactManifest, validateInputSnapshot, validateValidationEvidence } from "../contracts/validation.ts"
import type { ArtifactManifest, ContractRevision, Digest, InputSnapshot, JsonValue, LaunchRequest, RuntimeBackend, RuntimeObservation, TaskSpecRevision, ValidationEvidence, ValidationRequest, Validator } from "../contracts/model.ts"
import { FileArtifactStore } from "../artifacts/index.ts"
import { taskMeaningDigest } from "../kernel/graph.ts"

export interface ShapeValidation {
  outcome: ValidationEvidence["outcome"]
  diagnostics: string[]
  environment?: JsonValue
}

const ownImplementation = contentDigest(readFileSync(new URL("./index.ts", import.meta.url)))
const schemaImplementation = contentDigest(readFileSync(new URL("./schema-worker.ts", import.meta.url)))
const trustedEnvironment = { service: "task-agent/controller-validator-v1", implementation: ownImplementation, schemaImplementation, node: process.versions.node, platform: process.platform, arch: process.arch }

/** Run schema compilation and matching outside the controller event loop with a hard deadline. */
export function validateJsonSchema(schema: JsonValue, data: unknown, timeoutMs = 5000): Promise<ShapeValidation> {
  return new Promise(resolve => {
    let worker: Worker
    try { worker = new Worker(new URL("./schema-worker.ts", import.meta.url), { workerData: { schema, data }, execArgv: [], resourceLimits: { maxOldGenerationSizeMb: 64 } }) }
    catch (error) { resolve({ outcome: "inconclusive", diagnostics: [(error as Error).message] }); return }
    let finished = false
    const finish = (result: ShapeValidation) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      void worker.terminate()
      resolve(result)
    }
    const timer = setTimeout(() => finish({ outcome: "inconclusive", diagnostics: ["JSON Schema validation deadline exceeded"] }), timeoutMs)
    worker.once("message", result => finish(result as ShapeValidation))
    worker.once("error", error => finish({ outcome: "inconclusive", diagnostics: [error.message] }))
    worker.once("exit", code => { if (!finished) finish({ outcome: "inconclusive", diagnostics: [`Schema worker exited without a result (${code})`] }) })
  })
}

function artifactFile(artifact: ArtifactManifest, store: FileArtifactStore): Uint8Array {
  if (!artifact.storage.uri.startsWith("tree:")) throw new Error("Shape validation requires an immutable tree artifact")
  const tree = store.tree(artifact.storage)
  const files = tree.files.filter(file => file.kind === "file")
  if (files.length !== 1) throw new Error("File and JSON contracts require exactly one regular file")
  return readFileSync(join(tree.path, files[0]!.path))
}

/** Source registration and result validation share the same contract shape check. */
export async function validateArtifactShape(artifact: ArtifactManifest, contract: ContractRevision, store: FileArtifactStore): Promise<ShapeValidation> {
  try {
    validateArtifactManifest(artifact)
    if (revisionDigest(contract) !== contract.digest || !sameRef(artifact.contractRef, contract)) throw new Error("Artifact contract reference mismatch")
    if (artifact.contentDigest !== artifact.storage.digest || !await store.verify(artifact.storage)) throw new Error("Artifact integrity mismatch")
    if (contract.shape.kind === "directory") {
      const tree = store.tree(artifact.storage)
      const paths = new Set(tree.files.map(file => file.path))
      const missing = contract.shape.requiredPaths.filter(path => !paths.has(path))
      return { outcome: missing.length ? "failed" : "passed", diagnostics: missing.map(path => `Missing required path: ${path}`) }
    }
    const bytes = artifactFile(artifact, store)
    if (contract.shape.kind === "file") return { outcome: "passed", diagnostics: [] }
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
    return await validateJsonSchema(contract.shape.schema, data)
  } catch (error) {
    return { outcome: "failed", diagnostics: [(error as Error).message] }
  }
}

function publish(path: string, value: unknown) {
  const parent = join(path, "..")
  mkdirSync(parent, { recursive: true, mode: 0o700 })
  const directory = mkdtempSync(join(parent, ".publish-")), staging = join(directory, "data")
  try {
    const fd = openSync(staging, "wx", 0o600)
    try { writeFileSync(fd, canonical(value)); fsyncSync(fd) } finally { closeSync(fd) }
    try { linkSync(staging, path) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error }
    const dir = openSync(parent, "r")
    try { fsyncSync(dir) } finally { closeSync(dir) }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}

const argvSupervisor = `const fs=require('node:fs'); const cp=require('node:child_process');
const options=JSON.parse(process.argv[1]);
const result=cp.spawnSync(options.argv[0],options.argv.slice(1),{encoding:'utf8',timeout:options.timeoutMs,maxBuffer:1024*1024,shell:false});
fs.mkdirSync('.validation',{recursive:true});
fs.writeFileSync('.validation/result.json',JSON.stringify({exitCode:result.status,signal:result.signal,error:result.error?.message??null,stdout:result.stdout??'',stderr:result.stderr??''}));
process.exit(result.status===0&&!result.error?0:1);`

/** Only the control plane owns this issuer. Workers receive neither this API nor its ledger. */
export class ValidationService implements Validator {
  readonly runtime: RuntimeBackend
  readonly artifacts: FileArtifactStore
  private readonly pending = new Map<string, Promise<ValidationEvidence>>()
  constructor(runtime: RuntimeBackend, artifacts: FileArtifactStore) { this.runtime = runtime; this.artifacts = artifacts }

  async validate(request: ValidationRequest): Promise<ValidationEvidence> {
    if (!request.id || !/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(request.id)) throw new Error("Validation request requires a stable ID")
    validateInputSnapshot(request.inputs)
    if (revisionDigest(request.validator) !== request.validator.digest) throw new Error("Validator revision integrity mismatch")
    if (revisionDigest(request.template) !== request.template.digest || revisionDigest(request.policy) !== request.policy.digest) throw new Error("Validation environment revision integrity mismatch")
    if (!request.artifacts.length) throw new Error("Validation requires candidate artifacts")
    for (const artifact of [...request.artifacts, ...request.inputArtifacts]) validateArtifactManifest(artifact)
    const key = digest(request.id).slice(7), requestDigest = digest(request)
    const directory = join(this.artifacts.root, "validation-runs", key)
    const requestPath = join(directory, "request.json")
    publish(requestPath, { requestDigest })
    if (JSON.parse(readFileSync(requestPath, "utf8")).requestDigest !== requestDigest) throw new Error("Validation request ID reused with a different payload")
    const prior = this.pending.get(key)
    if (prior) return prior
    const promise = this.perform(request, directory)
    this.pending.set(key, promise)
    try { return await promise } finally { this.pending.delete(key) }
  }

  private async perform(request: ValidationRequest, directory: string): Promise<ValidationEvidence> {
    for (const artifact of [...request.artifacts, ...request.inputArtifacts]) {
      if (artifact.contentDigest !== artifact.storage.digest || !await this.artifacts.verify(artifact.storage)) {
        return this.issue(request, { outcome: "failed", diagnostics: [`Artifact integrity mismatch: ${artifact.id}`] }, trustedEnvironment)
      }
    }
    for (const binding of request.inputs.bindings) {
      const artifact = request.inputArtifacts.find(value => value.id === binding.artifactRef.id && value.digest === binding.artifactRef.digest)
      if (!artifact || artifact.contentDigest !== binding.contentDigest || !sameRef(artifact.contractRef, binding.contractRef)) throw new Error(`Missing or mismatched validation input: ${binding.inputPort}`)
    }
    const resultPath = join(directory, "evidence.json")
    if (existsSync(resultPath)) {
      const evidence = JSON.parse(readFileSync(resultPath, "utf8")) as ValidationEvidence
      validateValidationEvidence(evidence)
      if (!await this.artifacts.verify(evidence.report)) throw new Error("Persisted validation report is corrupt")
      return evidence
    }
    let evidence: ValidationEvidence
    if (request.validator.definition.kind === "builtin") {
      let result: ShapeValidation = { outcome: "passed", diagnostics: [] }
      if (request.validator.definition.check === "json-schema") {
        for (const artifact of request.artifacts) {
          try {
            const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(artifactFile(artifact, this.artifacts)))
            result = await validateJsonSchema(request.validator.definition.schema, data)
          } catch (error) { result = { outcome: "failed", diagnostics: [(error as Error).message] } }
          if (result.outcome !== "passed") break
        }
      }
      evidence = await this.issue(request, result, { ...trustedEnvironment, schemaRuntime: result.environment ?? null })
    } else {
      evidence = await this.runArgv(request, directory)
    }
    if (evidence.outcome !== "inconclusive") {
      publish(resultPath, evidence)
      return JSON.parse(readFileSync(resultPath, "utf8")) as ValidationEvidence
    }
    return evidence
  }

  private async issue(request: ValidationRequest, result: ShapeValidation, environment: JsonValue, detail: JsonValue = null): Promise<ValidationEvidence> {
    const report = await this.artifacts.put(Buffer.from(canonical({ validationRequestId: request.id, requestDigest: digest(request), result, environment, detail })))
    const evidence: ValidationEvidence = {
      id: `evidence-${digest({ request: digest(request), report }).slice(7)}`, validatorRef: ref(request.validator),
      validationRunId: request.id, trustedIssuer: "task-agent/controller-validator-v1", validationEnvironmentDigest: digest(environment),
      subjects: request.artifacts.map(artifact => ({ id: artifact.id, digest: artifact.digest })), inputSnapshotDigest: request.inputs.provenanceDigest,
      outcome: result.outcome, report,
    }
    validateValidationEvidence(evidence)
    return evidence
  }

  private async runArgv(request: ValidationRequest, directory: string): Promise<ValidationEvidence> {
    if (request.validator.definition.kind !== "argv") throw new Error("Expected argv validator")
    const identity = `validation-${digest(request.id).slice(7)}`
    const template = withDigest({ ...request.template, id: `${identity}-template`, revision: 1, sourceSnapshots: [], bootstrap: [] })
    const policy = withDigest({ ...request.policy, id: `${identity}-policy`, revision: 1,
      resources: { ...request.policy.resources, timeoutMs: Math.min(request.policy.resources.timeoutMs, request.validator.definition.timeoutMs + 1000) } })
    const all = [
      ...request.artifacts.map((artifact, index) => ({ artifact, name: `candidate-${index}`, mountPath: `/inputs/candidate-${index}` })),
      ...request.inputs.bindings.map((binding, index) => ({ artifact: request.inputArtifacts.find(a => a.id === binding.artifactRef.id && a.digest === binding.artifactRef.digest)!, name: `input-${index}`, mountPath: `/inputs/input-${index}` })),
    ]
    const task: TaskSpecRevision = withDigest({
      id: identity, revision: 1, objective: `검증 요청 ${request.id}`, kind: "integration",
      inputPorts: all.map(item => ({ name: item.name, contractRef: item.artifact.contractRef, mountPath: item.mountPath })),
      outputPorts: [{ name: "report", contractRef: request.artifacts[0]!.contractRef, path: ".validation/result.json" }],
      design: { rationale: "검증 대상과 소비 입력을 읽기 전용으로 제공한 독립 검증 실행", acceptance: [ref(request.validator)], steps: [{
        id: "validate", argv: ["node", "-e", argvSupervisor, JSON.stringify({ argv: request.validator.definition.argv, timeoutMs: request.validator.definition.timeoutMs })],
        outputs: [".validation/result.json"], timeoutMs: request.validator.definition.timeoutMs + 1000, effectPolicy: "replayable",
      }] }, workspaceTemplateRef: ref(template), executionPolicyRef: ref(policy),
    })
    const base = {
      graphRef: request.inputs.graphRef, taskSpecRef: ref(task),
      bindings: all.map(item => ({ inputPort: item.name, producer: { nodeId: item.artifact.origin.kind === "source" ? item.artifact.origin.sourceId : item.artifact.origin.taskSpecRef.id, port: item.artifact.outputPort }, artifactRef: { id: item.artifact.id, digest: item.artifact.digest }, contractRef: item.artifact.contractRef, contentDigest: item.artifact.contentDigest })),
      orderObligations: [], workspaceTemplateDigest: template.digest, executionPolicyDigest: policy.digest, validatorRefs: [ref(request.validator)], taskMeaningDigest: taskMeaningDigest(task),
    }
    const snapshot: InputSnapshot = { ...base, provenanceDigest: digest(base), semanticReuseKey: digest(base) }
    const launch: LaunchRequest = {
      intentId: identity, attemptId: identity, workspaceId: identity, fence: 1, task, template, policy, inputSnapshot: snapshot,
      inputArtifacts: all.map(item => item.artifact),
      readOnlyInputs: all.map(item => ({ port: item.name, digest: item.artifact.contentDigest, hostPath: this.artifacts.pin(item.artifact.storage) })),
    }
    const environment: JsonValue = { service: trustedEnvironment, templateDigest: template.digest, policyDigest: policy.digest, taskDigest: task.digest, image: template.environment.image }
    let observation: RuntimeObservation
    try {
      observation = await this.runtime.ensureStarted(launch)
      const deadline = Date.now() + policy.resources.timeoutMs + 1000
      while (observation.observed !== "stopped" && Date.now() < deadline) {
        if (observation.observed === "unknown") return this.issue(request, { outcome: "inconclusive", diagnostics: [observation.diagnostic ?? observation.detail ?? "Validation runtime state is unknown"] }, environment)
        await delay(50)
        observation = await this.runtime.observe(launch)
      }
      if (observation.observed !== "stopped") {
        await this.runtime.requestStop({ ...launch, reason: "cancel", checkpoint: false })
        return this.issue(request, { outcome: "inconclusive", diagnostics: ["Validation deadline exceeded; stop requested"] }, environment)
      }
      if (!observation.stopReceipt || observation.stopReceipt.termination.kind !== "all-writers-terminated") return this.issue(request, { outcome: "inconclusive", diagnostics: ["Validation termination is unproven"] }, environment)
      const capture = await this.runtime.captureStoppedWorkspace(observation.stopReceipt)
      const output = capture.outputs.find(item => item.port === "report")
      let detail: JsonValue = { observed: "stopped", exitCode: observation.exitCode ?? null }, validReport = false
      if (output) {
        const tree = this.artifacts.ingestCapture(output.snapshot), files = tree.files.filter(file => file.kind === "file")
        if (files.length === 1) {
          detail = JSON.parse(readFileSync(join(tree.path, files[0]!.path), "utf8")) as JsonValue
          validReport = detail !== null && typeof detail === "object" && !Array.isArray(detail) && detail.exitCode === 0 && detail.error === null && detail.signal === null
        }
      }
      const passed = observation.outcome?.kind === "success" && validReport
      return this.issue(request, { outcome: passed ? "passed" : "failed", diagnostics: passed ? [] : ["Validator command did not complete successfully"] }, environment, detail)
    } catch (error) {
      return this.issue(request, { outcome: "inconclusive", diagnostics: [(error as Error).message] }, environment)
    }
  }

}

export { ValidationService as ControllerValidator }

/** Called only on responses from the controller-owned validation port, never worker submissions. */
export async function verifyValidationEvidence(request: ValidationRequest, evidence: ValidationEvidence, artifacts: FileArtifactStore): Promise<void> {
  validateValidationEvidence(evidence)
  if (evidence.validationRunId !== request.id || !sameRef(evidence.validatorRef, request.validator) || evidence.trustedIssuer !== "task-agent/controller-validator-v1"
    || evidence.inputSnapshotDigest !== request.inputs.provenanceDigest
    || canonical(evidence.subjects) !== canonical(request.artifacts.map(artifact => ({ id: artifact.id, digest: artifact.digest })))) {
    throw new Error("validation_failed: evidence is not bound to the trusted validation request")
  }
  try {
    const report = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await artifacts.get(evidence.report)))
    if (report.validationRequestId !== request.id || report.requestDigest !== digest(request)
      || report.result?.outcome !== evidence.outcome || digest(report.environment) !== evidence.validationEnvironmentDigest) {
      throw new Error("report identity, outcome or environment mismatch")
    }
  } catch (error) { throw new Error(`validation_failed: evidence report is not bound to the request: ${(error as Error).message}`) }
}
