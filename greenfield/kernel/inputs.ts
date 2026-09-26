import { canonical, digest, ref, sameRef } from "../contracts/index.ts"
import type { AdoptionRecord, ArtifactManifest, GraphBundle, InputBinding, InputSnapshot, PortResult, RevisionRef } from "../contracts/index.ts"
import { findRevision, getTask, sorted, taskComplete, taskMeaningDigest, validateGraph } from "./graph.ts"

export interface InputResolution { ready: boolean; snapshot?: InputSnapshot; reasons: string[] }
const sameArtifact = (a: { id: string; digest: string }, b: { id: string; digest: string }) => a.id === b.id && a.digest === b.digest

export function resolveInputs(bundle: GraphBundle, taskId: string, results: PortResult[], artifacts: ArtifactManifest[], adoptions: AdoptionRecord[]): InputResolution {
  validateGraph(bundle)
  const task = getTask(bundle, taskId), reasons: string[] = [], bindings: InputBinding[] = [], orderObligations: InputSnapshot["orderObligations"] = []
  const allArtifacts = [...artifacts, ...bundle.sourceArtifacts]
  for (const edge of bundle.graph.edges) {
    if (edge.kind === "consumes" && edge.to.nodeId === taskId) {
      const input = task.inputPorts.find(port => port.name === edge.to.port)!
      const source = bundle.graph.sources.find(node => node.id === edge.from.nodeId)
      let artifact: ArtifactManifest | undefined
      if (source) {
        const output = source.outputs.find(port => port.name === edge.from.port)!
        artifact = allArtifacts.find(value => sameArtifact(value, output.artifactRef))
      } else {
        const current = results.filter(result => result.producer.nodeId === edge.from.nodeId && result.producer.port === edge.from.port && result.validity === "valid")
        if (current.length !== 1) { reasons.push(`Input ${input.name} has no unique valid producer result`); continue }
        const result = current[0]!, adoption = adoptions.find(value => value.id === result.adoptionId)
        const producer = getTask(bundle, edge.from.nodeId)
        artifact = allArtifacts.find(value => sameArtifact(value, result.artifactRef))
        if (!adoption || adoption.targetTaskSpecRef.id !== producer.id || adoption.currentInputs.taskMeaningDigest !== taskMeaningDigest(producer) || !adoption.artifactRefs.some(reference => sameArtifact(reference, result.artifactRef))) {
          reasons.push(`Input ${input.name} lacks current producer adoption evidence`); continue
        }
        if (!artifact || artifact.origin.kind !== "execution" || artifact.origin.taskSpecRef.id !== producer.id || artifact.outputPort !== edge.from.port) {
          reasons.push(`Input ${input.name} has a foreign producer artifact`); continue
        }
      }
      if (!artifact || !sameRef(artifact.contractRef, input.contractRef)) {
        reasons.push(`Input ${input.name} lacks its exact contract artifact`); continue
      }
      bindings.push({ inputPort: input.name, producer: { ...edge.from }, artifactRef: { id: artifact.id, digest: artifact.digest }, contractRef: { ...input.contractRef }, contentDigest: artifact.contentDigest })
    }
    if (edge.kind === "after" && edge.successor === taskId) {
      if (!taskComplete(bundle, edge.predecessor, results)) { reasons.push(`Waiting for after predecessor ${edge.predecessor}`); continue }
      const predecessor = getTask(bundle, edge.predecessor)
      const adoption = [...adoptions].reverse().find(value => value.targetTaskSpecRef.id === predecessor.id && value.currentInputs.taskMeaningDigest === taskMeaningDigest(predecessor)
        && predecessor.outputPorts.every(port => results.some(result => result.producer.nodeId === predecessor.id && result.producer.port === port.name && result.validity === "valid" && value.artifactRefs.some(reference => sameArtifact(reference, result.artifactRef)))))
      if (!adoption) { reasons.push(`After predecessor ${edge.predecessor} lacks completion adoption`); continue }
      orderObligations.push({ predecessor: edge.predecessor, successor: edge.successor, completionAdoptionId: adoption.id })
    }
  }
  if (reasons.length) return { ready: false, reasons: [...new Set(reasons)].sort() }
  const validators = [...task.design.acceptance, ...[...task.inputPorts, ...task.outputPorts].flatMap(port => findRevision(bundle.contracts, port.contractRef).validators)]
  const validatorRefs: RevisionRef[] = sorted([...new Map(validators.map(value => [canonical(value), ref(value)])).values()])
  const body = {
    graphRef: ref(bundle.graph), taskSpecRef: ref(task), bindings: sorted(bindings), orderObligations: sorted(orderObligations),
    workspaceTemplateDigest: task.workspaceTemplateRef.digest, executionPolicyDigest: task.executionPolicyRef.digest,
    validatorRefs, taskMeaningDigest: taskMeaningDigest(task),
  }
  const semanticReuseKey = digest({
    taskMeaningDigest: body.taskMeaningDigest,
    inputs: sorted(bindings.map(binding => ({ inputPort: binding.inputPort, contentDigest: binding.contentDigest, contractRef: binding.contractRef }))),
    order: sorted(orderObligations.map(({ predecessor, successor }) => ({ predecessor, successor }))),
    templateRef: task.workspaceTemplateRef, policyRef: task.executionPolicyRef, validators: validatorRefs,
  })
  return { ready: true, snapshot: { ...body, provenanceDigest: digest(body), semanticReuseKey }, reasons: [] }
}
