import { closeSync, existsSync, fsyncSync, linkSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { canonical, digest, ref, withDigest } from "../contracts/canonical.ts"
import type { ArtifactManifest, ExecutionPolicyRevision, GraphBundle, InputSnapshot, TaskSpecRevision, ValidationEvidence, ValidationRequest, Validator, WorkspaceTemplateRevision } from "../contracts/model.ts"
import { FileArtifactStore } from "../artifacts/index.ts"
import { activeTasks, findRevision, sorted, validateGraph } from "../kernel/graph.ts"
import { validateArtifactShape, verifyValidationEvidence } from "./index.ts"

function publish(path: string, value: unknown) {
  const parent = join(path, "..")
  mkdirSync(parent, { recursive: true, mode: 0o700 })
  const staging = mkdtempSync(join(parent, ".write-")), file = join(staging, "record")
  try {
    const fd = openSync(file, "wx", 0o600)
    try { writeFileSync(fd, canonical(value)); fsyncSync(fd) } finally { closeSync(fd) }
    try { linkSync(file, path) } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error }
    const directory = openSync(parent, "r")
    try { fsyncSync(directory) } finally { closeSync(directory) }
  } finally { rmSync(staging, { recursive: true, force: true }) }
}

interface Environment { template: WorkspaceTemplateRevision; policy: ExecutionPolicyRevision; consumers: TaskSpecRevision[] }
function environments(bundle: GraphBundle, artifact: ArtifactManifest): Environment[] {
  const source = artifact.origin
  if (source.kind !== "source") throw new Error("Source validation requires a source-origin artifact")
  const consumerIds = new Set(bundle.graph.edges.flatMap(edge => edge.kind === "consumes" && edge.from.nodeId === source.sourceId && edge.from.port === artifact.outputPort ? [edge.to.nodeId] : []))
  const groups = new Map<string, Environment>()
  for (const task of activeTasks(bundle).filter(task => consumerIds.has(task.id))) {
    const template = findRevision(bundle.templates, task.workspaceTemplateRef), policy = findRevision(bundle.policies, task.executionPolicyRef)
    const key = digest({ template: ref(template), policy: ref(policy) })
    const existing = groups.get(key)
    if (existing) existing.consumers.push(task)
    else groups.set(key, { template, policy, consumers: [task] })
  }
  return [...groups.values()].sort((a, b) => canonical([ref(a.template), ref(a.policy)]).localeCompare(canonical([ref(b.template), ref(b.policy)])))
}

/** Register-only validation context: no source execution attempt or source consumedInputs is fabricated. */
function sourceRequest(bundle: GraphBundle, artifact: ArtifactManifest, validator: ValidationRequest["validator"], environment: Environment): ValidationRequest {
  const contextBody = { artifactRef: { id: artifact.id, digest: artifact.digest }, contractRef: artifact.contractRef,
    consumers: sorted(environment.consumers.map(ref)), templateRef: ref(environment.template), policyRef: ref(environment.policy), validatorRef: ref(validator) }
  const context = withDigest({ id: `source-registration-${digest(contextBody).slice(7)}`, revision: 1, purpose: "source-registration", ...contextBody })
  const body = { graphRef: ref(bundle.graph), taskSpecRef: ref(context), taskMeaningDigest: digest(contextBody), bindings: [], orderObligations: [],
    workspaceTemplateDigest: environment.template.digest, executionPolicyDigest: environment.policy.digest, validatorRefs: [ref(validator)] }
  const inputs: InputSnapshot = { ...body, provenanceDigest: digest(body), semanticReuseKey: digest(contextBody) }
  return { id: `source-validation-${digest([ref(bundle.graph), ref(context)]).slice(7)}`, validator, inputs, artifacts: [artifact], inputArtifacts: [], template: environment.template, policy: environment.policy }
}

/** Activation must store these proofs atomically with the graph; immutable source manifests stay unchanged. */
export async function validateSources(bundle: GraphBundle, validator: Validator, artifacts: FileArtifactStore): Promise<ValidationEvidence[]> {
  validateGraph(bundle)
  const result: ValidationEvidence[] = []
  for (const artifact of bundle.sourceArtifacts) {
    const contract = findRevision(bundle.contracts, artifact.contractRef), shape = await validateArtifactShape(artifact, contract, artifacts)
    if (shape.outcome !== "passed") throw new Error(`${shape.outcome === "inconclusive" ? "validation_pending" : "validation_failed"}: source ${artifact.id}: ${shape.diagnostics.join("; ")}`)
    const contexts = environments(bundle, artifact)
    for (const validatorRef of new Map(contract.validators.map(value => [canonical(value), value])).values()) {
      const definition = findRevision(bundle.validators, validatorRef)
      if (!contexts.length && definition.definition.kind === "argv") throw new Error(`validation_pending: source ${artifact.id} has no consuming task to supply an argv validation environment`)
      if (!contexts.length && (!bundle.templates.length || !bundle.policies.length)) throw new Error(`validation_pending: source ${artifact.id} lacks a declared environment envelope`)
      // Builtins run in the controller; exact bundle refs only fill the shared validation request envelope.
      const effective = contexts.length ? contexts : [{ template: sorted(bundle.templates)[0]!, policy: sorted(bundle.policies)[0]!, consumers: [] }]
      for (const environment of effective) {
        const request = sourceRequest(bundle, artifact, definition, environment)
        const directory = join(artifacts.root, "source-validation", digest(request.id).slice(7)), requestPath = join(directory, "request.json"), evidencePath = join(directory, "evidence.json")
        publish(requestPath, request)
        if (canonical(JSON.parse(readFileSync(requestPath, "utf8"))) !== canonical(request)) throw new Error("validation_failed: source request identity conflict")
        let proof: ValidationEvidence
        try {
          proof = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) as ValidationEvidence : await validator.validate(request)
          await verifyValidationEvidence(request, proof, artifacts)
        } catch (error) {
          if (String(error).includes("validation_failed")) throw error
          throw new Error(`validation_pending: source ${artifact.id} validator unavailable: ${(error as Error).message}`)
        }
        if (proof.outcome === "inconclusive") throw new Error(`validation_pending: source ${artifact.id} validation inconclusive (${proof.report.uri})`)
        publish(evidencePath, proof)
        if (proof.outcome !== "passed") throw new Error(`validation_failed: source ${artifact.id} validator rejected the content (${proof.report.uri})`)
        if (!result.some(existing => existing.id === proof.id)) result.push(proof)
      }
    }
  }
  return result
}
