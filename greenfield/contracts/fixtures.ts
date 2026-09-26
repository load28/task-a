/** Small deterministic data fixture shared by contract and kernel tests. */
import { contentDigest, digest, ref, withDigest } from "./canonical.ts"
import type { GraphBundle, ValidatorRevision, ContractRevision, WorkspaceTemplateRevision, ExecutionPolicyRevision, TaskSpecRevision, GraphRevision } from "./model.ts"

export function fixtureBundle(): GraphBundle {
  const validator: ValidatorRevision = withDigest({ id: "integrity", revision: 1, definition: { kind: "builtin", check: "integrity" }, implementationDigest: digest("builtin-integrity-v1"), configurationDigest: digest({}) })
  const contract: ContractRevision = withDigest({ id: "text-file", revision: 1, purpose: "UTF-8 결과 파일", shape: { kind: "file", mediaType: "text/plain" }, invariants: [], validators: [ref(validator)], compatibilityValidators: [] })
  const template: WorkspaceTemplateRevision = withDigest({ id: "node", revision: 1, environment: { kind: "container", image: `node@sha256:${"0".repeat(64)}` }, sourceSnapshots: [], bootstrap: [] })
  const policy: ExecutionPolicyRevision = withDigest({ id: "isolated", revision: 1, network: "none", allowedHosts: [], resources: { cpus: 1, memoryBytes: 128 * 1024 * 1024, pids: 64, timeoutMs: 10000 }, secretRefs: [], allowedEffects: [] })
  const task: TaskSpecRevision = withDigest({
    id: "task-a", revision: 1, objective: "결과 파일 생성", kind: "work", inputPorts: [], outputPorts: [{ name: "result", contractRef: ref(contract), path: "result.txt" }],
    design: { rationale: "독립 파일을 만들고 무결성을 확인한다.", steps: [{ id: "write", argv: ["node", "-e", "require('node:fs').writeFileSync('result.txt', '완료')"], outputs: ["result.txt"], timeoutMs: 1000, effectPolicy: "replayable" }], acceptance: [ref(validator)] },
    workspaceTemplateRef: ref(template), executionPolicyRef: ref(policy),
  })
  const graph: GraphRevision = withDigest({ id: "sample", revision: 1, baseRevision: 0, taskSpecRefs: [ref(task)], sources: [], groups: [], edges: [], completionTargets: [task.id], reviewEvidence: { reviewer: "fixture-reviewer", rationale: "단일 독립 책임을 확인했다." } })
  return { schemaVersion: 1, graph, contracts: [contract], tasks: [task], templates: [template], policies: [policy], validators: [validator], sourceArtifacts: [] }
}

export const emptyContentDigest = contentDigest("")
