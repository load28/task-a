import test from "node:test"
import assert from "node:assert/strict"
import { toAgentError } from "./errors.ts"
import { ContractValidationError } from "./validation.ts"
import { RevisionConflict } from "../store/index.ts"
import { GraphValidationError } from "../kernel/graph.ts"
import { RuntimeError } from "../runtime/files.ts"

test("boundary errors preserve typed codes and revision-conflict context as serializable data", () => {
  const normalized = toAgentError(new RevisionConflict(4, 5), { object: { kind: "graph", id: "project" } })
  assert.deepEqual(normalized, { code: "revision_conflict", message: "Expected revision 4, current revision 5", object: { kind: "graph", id: "project" }, revision: 5, retryable: false, resultUsable: false })
  assert.deepEqual(JSON.parse(JSON.stringify(normalized)), normalized)
  assert.equal(toAgentError(new ContractValidationError("graph.revision", "invalid")).code, "invalid_contract")
  assert.equal(toAgentError(new GraphValidationError("missing port")).code, "invalid_graph")
  assert.equal(toAgentError(new RuntimeError("checkpoint_invalid", "corrupt checkpoint")).code, "checkpoint_invalid")
})

test("command conflicts and unavailable execution are distinct from unsafe automatic retries", () => {
  assert.equal(toAgentError(new Error("operation_conflict: changed command")).code, "operation_conflict")
  assert.equal(toAgentError(new Error("Refusing to overwrite a workspace")).code, "operation_conflict")
  assert.equal(toAgentError(new Error("Cannot restore into artifact store")).code, "invalid_contract")
  assert.equal(toAgentError(new Error("unauthorized: worker cannot adopt")).code, "unauthorized")
  assert.equal(toAgentError(new Error("validation_failed: bad report")).retryable, false)
  assert.equal(toAgentError(new Error("effect_unknown: missing receipt")).retryable, false)
  assert.equal(toAgentError(new Error("termination_unknown: awaiting stop proof")).retryable, true)
  assert.equal(toAgentError(Object.assign(new Error("daemon unavailable"), { code: "ECONNREFUSED" })).code, "runtime_unavailable")
  assert.equal(toAgentError(Object.assign(new Error("denied"), { code: "EPERM" })).code, "capability_unsupported")
  assert.equal(toAgentError(new SyntaxError("Malformed proposal JSON")).code, "invalid_contract")
})

test("unknown failures do not fabricate an object, revision or usable result", () => {
  const unknown = toAgentError(new Error("Unexpected invariant failure"))
  assert.deepEqual(unknown, { code: "internal_error", message: "Unexpected invariant failure", object: null, revision: null, retryable: false, resultUsable: false })
  assert.deepEqual(toAgentError(unknown), unknown)
  assert.equal(toAgentError(undefined).message, "Unknown non-Error failure")
  const context = { object: { kind: "task", id: "leaf" }, revision: 3, code: "validation_failed" as const, retryable: false, resultUsable: true }
  assert.deepEqual(toAgentError(new Error("Candidate failed"), context), { ...context, message: "Candidate failed" })
})
