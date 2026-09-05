import { createRuntime } from "./runtime.ts"
import { TaskAgentMcpServer, serveStdio } from "../../../packages/protocol-mcp/src/index.ts"

const runtime = createRuntime()

let closed = false
function close(): void {
  if (closed) return
  closed = true
  runtime.close()
}

process.once("SIGINT", () => { close(); process.exit(0) })
process.once("SIGTERM", () => { close(); process.exit(0) })
process.once("exit", close)

try {
  await serveStdio(new TaskAgentMcpServer(runtime.agent))
} finally {
  close()
}
