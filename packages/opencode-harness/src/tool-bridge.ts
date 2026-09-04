import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const executeFile = promisify(execFile)

export function source(context: { agent?: string; sessionID?: string; messageID?: string }) {
  return { agent: context.agent, sessionId: context.sessionID, conversationId: context.messageID }
}

export async function callEngine(
  context: { worktree: string },
  operation: string,
  input: Record<string, unknown>,
): Promise<string> {
  const root = fileURLToPath(new URL("../../../", import.meta.url))
  const script = join(root, "apps/task-agent/src/tool-cli.ts")
  const { stdout } = await executeFile(process.env.TASK_AGENT_NODE ?? "node", [script, operation, JSON.stringify(input)], {
    cwd: root,
    env: process.env,
    maxBuffer: 4 * 1024 * 1024,
  })
  return stdout.trim()
}
