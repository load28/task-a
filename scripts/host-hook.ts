import { hostView } from "../packages/host-integration/src/presentation.ts"
import { statSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { ensureService } from "../packages/host-integration/src/launcher.ts"
import { digest, type HostEvent } from "../packages/host-integration/src/store.ts"
import type { HookInput } from "../packages/host-integration/src/store.ts"
import { loadConfig, workspaceFor } from "../packages/host-integration/src/config.ts"
import { callService } from "../packages/host-integration/src/service.ts"
import { HOST_INSTRUCTIONS, hostToolAllowed } from "../packages/host-integration/src/bridge.ts"

let eventName = ""
const output = (data: unknown) => process.stdout.write(JSON.stringify(data) + "\n")
async function main() {
  if (process.env.TASK_AGENT_INTERNAL === "1") {
    output({})
    return
  }
  const [path, host] = process.argv.slice(2)
  if (!path || !["claude", "codex"].includes(host ?? ""))
    throw new Error("Usage: host-hook.ts <config.json> <claude|codex>")
  let raw = ""
  for await (const chunk of process.stdin) {
    raw += chunk
    if (Buffer.byteLength(raw) > 5 * 1024 * 1024) throw new Error("Hook input too large")
  }
  const hook = JSON.parse(raw) as HookInput & { tool_name?: string }
  eventName = hook.hook_event_name
  const config = loadConfig(path)
  const workspace = workspaceFor(config, hook.cwd)
  if (!workspace) {
    output({})
    return
  }
  if (eventName === "PreToolUse") {
    output(
      hostToolAllowed(hook.tool_name ?? "")
        ? {}
        : {
            hookSpecificOutput: {
              hookEventName: "PreToolUse",
              permissionDecision: "deny",
              permissionDecisionReason:
                "이 프로젝트의 실제 작업은 태스크 에이전트 서버가 담당합니다. task-agent의 agent_status/reply/cancel 도구만 사용하세요.",
            },
          },
    )
    return
  }
  if (eventName === "PostCompact") {
    output({ systemMessage: HOST_INSTRUCTIONS })
    return
  }
  if (eventName === "SessionStart") {
    let active = ""
    try {
      await ensureService(path, config)
      const health = await callService(config.socket, "/workspace", { cwd: hook.cwd }, 3000)
      active = JSON.stringify(health.requests?.filter((r: any) => r.workspace === workspace.path) ?? [])
    } catch {}
    output({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: `${HOST_INSTRUCTIONS}\nActive 태스크 에이전트 requests: ${active || "none available"}`,
      },
    })
    return
  }
  if (eventName === "Stop") {
    try {
      const result = await callService(config.socket, "/foreground", { host, sessionId: hook.session_id }, 25000)
      if (result.present || result.pending) {
        output({
          decision: "block",
          reason: `${result.present ? "Present this 태스크 에이전트 result or question to the user:" : "Work continues in 태스크 에이전트. Wait using agent_status; do not finish as if completed:"}\n${JSON.stringify(hostView(result.present ?? result.pending))}`,
        })
      } else output({})
    } catch {
      output({ systemMessage: "태스크 에이전트 상태 연결이 끊겼습니다. 작업 완료로 표시하지 마세요." })
    }
    return
  }
  if (eventName !== "UserPromptSubmit") {
    output({})
    return
  }
  if (!hook.session_id || typeof hook.prompt !== "string")
    throw new Error("UserPromptSubmit requires session_id and original prompt")
  await ensureService(path, config)
  // Claude may submit the first prompt before creating its transcript.
  const position = hook.turn_id ?? (hook.transcript_path ? (statSync(hook.transcript_path, { throwIfNoEntry: false })?.size ?? 0) : randomUUID())
  const event: HostEvent = {
    interactive: true,
    id: digest([host, hook.session_id, position, hook.prompt]),
    host: host as "claude" | "codex",
    sessionId: hook.session_id,
    workspace: workspace.path,
    kind: eventName,
    text: hook.prompt,
    prompt: hook.prompt,
    permissionMode: hook.permission_mode,
  }
  const result = await callService(config.socket, "/event", event, 15000)
  output({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: `태스크 에이전트 requestId: ${result.requestId}. ${result.phase === "held" ? "This user message is held for conversation control. Call agent_control with its requestId and the appropriate action. The original text is already stored; do not rewrite it." : "Original request was already submitted. Use agent_status for the result."}\n${JSON.stringify(hostView(result))}`,
    },
  })
}
try {
  await main()
} catch (e) {
  const reason = `태스크 에이전트 연결 오류: ${e instanceof Error ? e.message : String(e)}. 호스트에서 대신 실행하지 마세요.`
  output(
    eventName === "PreToolUse"
      ? {
          hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
          },
        }
      : eventName === "UserPromptSubmit"
        ? { decision: "block", reason }
        : { systemMessage: reason },
  )
}
