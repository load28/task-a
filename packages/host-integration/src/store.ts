import { createHash } from "node:crypto"

export interface HostEvent {
  interactive?: boolean
  id: string
  host: "claude" | "codex"
  sessionId: string
  workspace: string
  kind: string
  text: string
  prompt?: string
  permissionMode?: string
}

export function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

export interface HookInput {
  hook_event_name: string
  session_id: string
  cwd: string
  transcript_path?: string | null
  prompt?: string
  turn_id?: string
  permission_mode?: string
  tool_name?: string
}
