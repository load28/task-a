import { createHash } from "node:crypto"

export function canonical(value: unknown): string {
  const normalize = (v: unknown): unknown => {
    if (v === null || typeof v === "string" || typeof v === "boolean") return v
    if (typeof v === "number") {
      if (!Number.isFinite(v)) throw new Error("Non-finite values cannot be versioned")
      return v
    }
    if (Array.isArray(v)) return v.map(normalize)
    if (v && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype)
      return Object.fromEntries(Object.keys(v).sort().filter(k => (v as Record<string, unknown>)[k] !== undefined).map(k => [k, normalize((v as Record<string, unknown>)[k])]))
    throw new Error("Only JSON values can be versioned")
  }
  return JSON.stringify(normalize(value))
}
export const digest = (value: unknown): string => createHash("sha256").update(canonical(value)).digest("hex")
export function unit(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${name} must be in [0,1]`)
  return value
}
export function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive`)
  return value
}
