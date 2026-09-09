import { digest } from "../../task-control/src/value.ts"
import type { Boundary, BoundaryProof, ChangeScope, VersionRef, VersionVector } from "./model.ts"

export function preservedExit(input: { proof: BoundaryProof; boundary: Boundary; edgeId: string; scope: ChangeScope; graphHash: string; inputs: VersionVector; now: number; validEvidence: (ref: VersionRef) => boolean }): boolean {
  const {proof:p,boundary:b}=input
  return p.verdict==="preserved" && b.bindingsComplete && p.observableComplete && p.boundary.id===b.id && p.boundary.version===b.version &&
    p.graphHash===input.graphHash && p.scope===input.scope && p.expiresAt>input.now &&
    digest(p.inputVector)===digest(input.inputs) && digest(p.before)===digest(p.after) &&
    p.exits.includes(input.edgeId) && b.exits.includes(input.edgeId) && b.exits.every(e=>p.exits.includes(e)) &&
    !!p.validatorVersion && p.evidence.length>0 && p.evidence.every(input.validEvidence)
}
