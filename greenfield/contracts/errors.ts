import type { AgentError, ErrorCode, ErrorObject } from "./model.ts"

const codes: ReadonlySet<string> = new Set<ErrorCode>([
  "invalid_contract", "invalid_graph", "revision_conflict", "stale_attempt", "validation_failed", "validation_inconclusive", "artifact_unavailable", "capability_unsupported",
  "runtime_unavailable", "termination_unknown", "checkpoint_invalid", "effect_unknown", "operation_conflict", "unauthorized", "internal_error",
])

export interface ErrorContext {
  object?: ErrorObject | null
  revision?: number | null
  /** Supply a more precise code at a boundary that knows the failed operation. */
  code?: ErrorCode
  retryable?: boolean
  /** True only when the caller has independently confirmed usable current results. */
  resultUsable?: boolean
}

const knownCode = (value: unknown): value is ErrorCode => typeof value === "string" && codes.has(value)
const revisionValue = (value: unknown): number | null => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : null
const objectValue = (value: unknown): ErrorObject | null => {
  if (!value || typeof value !== "object") return null
  const item = value as Record<string, unknown>
  return typeof item.kind === "string" && item.kind.trim() && typeof item.id === "string" && item.id.trim()
    ? { kind: item.kind, id: item.id } : null
}

function classify(error: Record<string, unknown>, message: string, source: unknown): ErrorCode {
  if (knownCode(error.code)) return error.code
  const prefix = /^(?:Error:\s*)?([a-z_]+):/.exec(message)?.[1]
  if (knownCode(prefix)) return prefix
  if (source instanceof SyntaxError) return "invalid_contract"
  if (["EACCES", "EPERM"].includes(String(error.code))) return "capability_unsupported"
  if (["ENOENT", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EPIPE", "EBUSY", "SQLITE_BUSY", "SQLITE_LOCKED"].includes(String(error.code))) return "runtime_unavailable"
  if (/^(?:Invalid command envelope|Missing value for |--\S+ must |Proposal .*|An objective is required|A step needs )/.test(message)) return "invalid_contract"
  if (/^(?:Unknown graph:|Unknown task:|Graph identity mismatch|No active graph)/.test(message)) return "invalid_graph"
  if (message === "Refusing to overwrite a workspace") return "operation_conflict"
  if (message === "Cannot restore into artifact store") return "invalid_contract"
  if (/^(?:Immutable .*conflict|Intent identity conflict|Graph revision must advance)/.test(message)) return "revision_conflict"
  if (/^(?:Source artifact unavailable|Required output missing|Undeclared output captured|No currently valid result)/.test(message)) return "validation_failed"
  if (/^validation_pending:/.test(message)) return "runtime_unavailable"
  return "internal_error"
}

/** Normalize boundary failures without importing a storage, runtime or controller adapter. */
export function toAgentError(source: unknown, context: ErrorContext = {}): AgentError {
  const value = source && typeof source === "object" ? source as Record<string, unknown> : {}
  const message = typeof value.message === "string" ? value.message : typeof source === "string" ? source : "Unknown non-Error failure"
  const code = context.code ?? classify(value, message, source)
  const revision = context.revision !== undefined ? revisionValue(context.revision)
    : revisionValue(value.revision) ?? (code === "revision_conflict" ? revisionValue(value.actual) : null)
  return {
    code, message,
    object: context.object !== undefined ? objectValue(context.object) : objectValue(value.object),
    revision,
    retryable: context.retryable ?? (typeof value.retryable === "boolean" ? value.retryable : code === "runtime_unavailable" || code === "termination_unknown"),
    resultUsable: context.resultUsable ?? (typeof value.resultUsable === "boolean" ? value.resultUsable : false),
  }
}
