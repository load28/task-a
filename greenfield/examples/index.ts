import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { FileArtifactStore } from "../artifacts/index.ts"
import { digest, ref, withDigest } from "../contracts/canonical.ts"
import type { ArtifactManifest, ContractRevision, ExecutionPolicyRevision, GraphBundle, GraphEdge, GraphRevision, TaskSpecRevision, ValidatorRevision, WorkspaceTemplateRevision } from "../contracts/model.ts"
import { validateGraph } from "../kernel/graph.ts"

export const NODE24_ARM64_IMAGE = "node@sha256:693101c77e947e45e001910202dcb37a659c0b1a4c27619848f1b8b7eaee0def"
export const NODE24_AMD64_IMAGE = "node@sha256:8e2c930fda481a6ec141fe5a88e8c249c69f8102fe98af505f38c081649ea749"

export interface ExampleOptions {
  value?: number
  revision?: number
  graphId?: string
  aOffset?: number
  aRevision?: number
  aDelayMs?: number
}

/** Deterministic integration fixture. This is test data, never the product's objective planner. */
export function createExample(store: FileArtifactStore, image = NODE24_ARM64_IMAGE, options: ExampleOptions = {}): GraphBundle {
  const value = options.value ?? 1, revision = options.revision ?? 1, offset = options.aOffset ?? 1, delayMs = options.aDelayMs ?? 0
  if (![value, offset, delayMs].every(Number.isFinite) || delayMs < 0) throw new Error("Example numbers must be finite and delay nonnegative")
  const schema = { type: "object", properties: { value: { type: "number" } }, required: ["value"], additionalProperties: false }
  const validator: ValidatorRevision = withDigest({ id: "number-json-schema", revision: 1, definition: { kind: "builtin", check: "json-schema", schema }, implementationDigest: digest("controller-json-schema-v1"), configurationDigest: digest(schema) })
  const contract: ContractRevision = withDigest({ id: "number-json", revision: 1, purpose: "유한 수 하나를 담은 JSON 파일", shape: { kind: "json", schema }, invariants: [], validators: [ref(validator)], compatibilityValidators: [] })
  const template: WorkspaceTemplateRevision = withDigest({ id: "node24", revision: 1, environment: { kind: "container", image }, sourceSnapshots: [], bootstrap: [] })
  const policy: ExecutionPolicyRevision = withDigest({ id: "local-isolated", revision: 1, network: "none", allowedHosts: [], resources: { cpus: 0.5, memoryBytes: 128 * 1024 * 1024, pids: 32, timeoutMs: 30000 }, secretRefs: [], allowedEffects: [] })
  const staging = mkdtempSync(join(store.root, "staging", "example-"))
  let sourceArtifact: ArtifactManifest
  const registration = { issuer: "example-fixture", source: "explicit numeric fixture", digest: digest({ value }) }
  try {
    const path = join(staging, "data.json")
    writeFileSync(path, JSON.stringify({ value }), { mode: 0o644 })
    const tree = store.ingestFile(path)
    sourceArtifact = withDigest({ id: `source-${tree.ref.digest.slice(7)}`, outputPort: "value", contractRef: ref(contract), contentDigest: tree.ref.digest, storage: tree.ref,
      validationEvidenceIds: [], origin: { kind: "source" as const, sourceId: "source", issuer: registration.issuer, source: registration.source, registrationDigest: registration.digest } })
  } finally { rmSync(staging, { recursive: true, force: true }) }
  const read = (port: string) => `JSON.parse(fs.readFileSync('/inputs/${port}/data.json','utf8')).value`
  const task = (id: string, ports: string[], expression: string, kind: "work" | "integration" = "work", taskRevision = 1, wait = 0): TaskSpecRevision => withDigest({
    id, revision: taskRevision, objective: `${id}의 수치 변환 결과 생성`, kind,
    inputPorts: ports.map(name => ({ name, contractRef: ref(contract), mountPath: `/inputs/${name}` })), outputPorts: [{ name: "result", contractRef: ref(contract), path: "data.json" }],
    design: { rationale: "입력 JSON만 읽고 독립 작업 공간에서 결과 JSON을 생성한다.", acceptance: [ref(validator)], steps: [{
      id: "calculate", argv: ["node", "-e", `const fs=require('node:fs');setTimeout(()=>fs.writeFileSync('data.json',JSON.stringify({value:${expression}})),${wait})`],
      outputs: ["data.json"], timeoutMs: Math.max(5000, wait + 2000), effectPolicy: "replayable",
    }] }, workspaceTemplateRef: ref(template), executionPolicyRef: ref(policy),
  })
  const tasks = [task("A", ["value"], `${read("value")}+${offset}`, "work", options.aRevision ?? 1, delayMs), task("B", ["value"], `${read("value")}*2`),
    task("C", ["value"], `${read("value")}+1`), task("D", [], "100"), task("integration", ["chain", "independent"], `${read("chain")}+${read("independent")}`, "integration")]
  const consumes = (from: string, fromPort: string, to: string, toPort: string): GraphEdge => ({ kind: "consumes", from: { nodeId: from, port: fromPort }, to: { nodeId: to, port: toPort } })
  const edges: GraphEdge[] = [consumes("source", "value", "A", "value"), consumes("A", "result", "B", "value"), consumes("B", "result", "C", "value"), consumes("C", "result", "integration", "chain"), consumes("D", "result", "integration", "independent"),
    ...tasks.map(value => ({ kind: "contains" as const, groupId: "project", childId: value.id }))]
  const graph: GraphRevision = withDigest({ id: options.graphId ?? "example", revision, baseRevision: revision - 1, taskSpecRefs: tasks.map(ref),
    sources: [{ id: "source", outputs: [{ name: "value", contractRef: ref(contract), artifactRef: { id: sourceArtifact.id, digest: sourceArtifact.digest } }], registrationEvidence: registration }],
    groups: [{ id: "project", objective: "연쇄 작업과 독립 작업의 결과를 검증하고 통합", requiredTaskIds: ["A", "B", "C", "D"], requiredIntegrationIds: ["integration"] }],
    edges, completionTargets: ["project"], reviewEvidence: { reviewer: "example-fixture", rationale: "명시적 소비 간선, 독립 D, 필수 통합을 가진 고정 테스트 그래프" } })
  const bundle: GraphBundle = { schemaVersion: 1, graph, tasks, contracts: [contract], templates: [template], policies: [policy], validators: [validator], sourceArtifacts: [sourceArtifact] }
  validateGraph(bundle)
  return bundle
}

export const createExampleBundle = createExample
