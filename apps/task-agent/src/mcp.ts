import { createRuntime } from "./runtime.ts"
import { TaskAgentMcpServer, serveStdio } from "../../../packages/protocol-mcp/src/index.ts"
import { startOpenCode } from "#opencode-harness"

const useOpenCode = process.env.TASK_AGENT_DISABLE_OPENCODE !== "1"
const harness = useOpenCode ? await startOpenCode() : undefined
const runtime = createRuntime({ reasoner: harness?.reasoner })

let closed = false
function close(): void {
  if (closed) return
  closed = true
  runtime.close()
  harness?.close()
}

process.once("SIGINT", () => { close(); process.exit(0) })
process.once("SIGTERM", () => { close(); process.exit(0) })
process.once("exit", close)

try {
  await serveStdio(new TaskAgentMcpServer(runtime.agent))
} finally {
  close()
}
