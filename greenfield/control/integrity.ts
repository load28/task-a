import type { AdoptionRecord, BlobRef } from "../contracts/model.ts"
import type { FileArtifactStore } from "../artifacts/index.ts"
import type { AgentState } from "./model.ts"
import { sameRef } from "../contracts/canonical.ts"

/** Read-time availability checks also protect completed graphs between controller ticks. */
function integrityChecker(state: AgentState, store: FileArtifactStore) {
  const availability = new Map<string, boolean>()
  const available = (ref: BlobRef) => {
    const key = JSON.stringify(ref)
    if (!availability.has(key)) availability.set(key, store.verifySync(ref))
    return availability.get(key)!
  }
  const artifactAvailable = (ref: { id: string; digest: string }) => {
    const artifact = state.artifacts.find(a => a.id === ref.id && a.digest === ref.digest)
    return !!artifact && available(artifact.storage)
  }
  const evidenceAvailable = (id: string) => {
    const evidence = state.evidence.find(e => e.id === id)
    return !!evidence && evidence.outcome === "passed" && available(evidence.report)
  }
  const adoptionAvailable = (adoption: AdoptionRecord | undefined, path: Set<string>): boolean => {
    if (!adoption || path.has(adoption.id) || !adoption.validationEvidenceIds.length) return false
    const next = new Set(path).add(adoption.id)
    if (!adoption.artifactRefs.every(artifactAvailable) || !adoption.currentInputs.bindings.every(b => artifactAvailable(b.artifactRef))) return false
    if (!adoption.currentInputs.bindings.every(b => {
      const input = state.artifacts.find(a => a.id === b.artifactRef.id)!
      if (input.origin.kind === "source") {
        const registration = state.sourceValidations.find(v => sameRef(v.graphRef, adoption.currentInputs.graphRef) && v.artifactRef.id === input.id && v.artifactRef.digest === input.digest)
        return !!registration && registration.validationEvidenceIds.every(evidenceAvailable)
      }
      const origin = input.origin
      return adoptionAvailable(state.adoptions.find(a => a.mode === "fresh" && a.attemptId === origin.attemptId
        && a.artifactRefs.some(r => r.id === input.id && r.digest === input.digest)), next)
    })) return false
    if (!adoption.validationEvidenceIds.every(evidenceAvailable)) return false
    if (adoption.mode !== "fresh" && !adoptionAvailable(state.adoptions.find(a => a.id === adoption.originalAdoptionId), next)) return false
    return adoption.currentInputs.orderObligations.every(o => adoptionAvailable(state.adoptions.find(a => a.id === o.completionAdoptionId), next))
  }
  return { artifactAvailable, adoptionAvailable }
}

export function adoptionIntact(state: AgentState, adoption: AdoptionRecord, store: FileArtifactStore): boolean {
  return integrityChecker(state, store).adoptionAvailable(adoption, new Set())
}

export function unavailableResults(state: AgentState, store: FileArtifactStore): Map<string, string> {
  const { artifactAvailable, adoptionAvailable } = integrityChecker(state, store), invalid = new Map<string, string>()
  for (const result of state.results.filter(r => r.validity === "valid")) {
    if (!artifactAvailable(result.artifactRef) || !adoptionAvailable(state.adoptions.find(a => a.id === result.adoptionId), new Set())) {
      invalid.set(result.adoptionId, "artifact_unavailable: adopted bytes, inputs or validation report failed integrity verification")
    }
  }
  return invalid
}
