/** Keep bounded, redacted evidence in Kubernetes' 4 KiB termination receipt. */
export function safeDiagnostic(value: string, maxBytes = 1600): string {
  let text = value.replace(/\x1b\[[0-9;]*m/g, "")
    .replace(/(authorization["']?\s*[:=]\s*["']?)(?:bearer\s+)?[^\s,"'}]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)["']?\s*[:=]\s*["']?)[^\s,"'}]+/gi, "$1[REDACTED]")
  for (const [key, secret] of Object.entries(process.env)) {
    if (/TOKEN|SECRET|PASSWORD|AUTH|API_KEY/i.test(key) && secret && secret.length >= 6) text = text.split(secret).join("[REDACTED]")
  }
  while (Buffer.byteLength(text) > maxBytes) text = text.slice(Math.max(1, Math.floor(text.length / 10)))
  return text
}
export interface ExecutionFailure {
  stage?: string; command?: string; exitCode?: number; signal?: string | null
  message: string; logTail?: string
}
