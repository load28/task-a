import { createHash } from "node:crypto"
import type { Digest, RevisionRef } from "./model.ts"

export const CANONICAL_ENCODING = "task-agent/canonical-json-v1" as const
export const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/

/** JSON-only, deterministic encoding. Unsupported values are errors, never silently omitted. */
export function canonical(value: unknown): string {
  const active = new Set<object>()
  const encode = (item: unknown): string => {
    if (item === null) return "null"
    if (typeof item === "string" || typeof item === "boolean") return JSON.stringify(item)
    if (typeof item === "number") {
      if (!Number.isFinite(item)) throw new TypeError("Canonical JSON requires finite numbers")
      return JSON.stringify(item)
    }
    if (typeof item !== "object") throw new TypeError("Canonical JSON accepts only JSON values")
    if (active.has(item)) throw new TypeError("Canonical JSON cannot encode cycles")
    active.add(item)
    try {
      if (Array.isArray(item)) {
        if (Object.keys(item).length !== item.length) throw new TypeError("Canonical JSON requires dense arrays without properties")
        for (let i = 0; i < item.length; i++) if (!Object.hasOwn(item, i)) throw new TypeError("Canonical JSON requires dense arrays")
        return `[${item.map(encode).join(",")}]`
      }
      if (Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null) throw new TypeError("Canonical JSON requires plain objects")
      if (Object.getOwnPropertySymbols(item).length) throw new TypeError("Canonical JSON cannot encode symbol keys")
      const entries = Object.keys(item).sort().map(key => {
        const property = Object.getOwnPropertyDescriptor(item, key)!
        if (!Object.hasOwn(property, "value")) throw new TypeError("Canonical JSON cannot encode accessors")
        return `${JSON.stringify(key)}:${encode(property.value)}`
      })
      return `{${entries.join(",")}}`
    } finally {
      active.delete(item)
    }
  }
  return encode(value)
}

export function contentDigest(bytes: Uint8Array | string): Digest {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`
}

export function digest(value: unknown): Digest {
  return contentDigest(`${CANONICAL_ENCODING}\0${canonical(value)}`)
}

export function revisionDigest(value: object): Digest {
  const body = Object.fromEntries(Object.entries(value).filter(([key]) => key !== "digest"))
  return digest(body)
}

export function withDigest<T extends object>(value: T): T & { digest: Digest } {
  return { ...value, digest: revisionDigest(value) }
}

export function ref(value: RevisionRef): RevisionRef {
  return { id: value.id, revision: value.revision, digest: value.digest }
}

export function sameRef(left: RevisionRef, right: RevisionRef): boolean {
  return left.id === right.id && left.revision === right.revision && left.digest === right.digest
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
