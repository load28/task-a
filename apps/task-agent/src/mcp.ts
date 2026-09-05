import { createGraphMcp } from "../../../packages/opencode-harness/src/graph-mcp.ts"
import { serveStdio } from "../../../packages/protocol-mcp/src/index.ts"
const graph = createGraphMcp(process.env.TASK_AGENT_DB ?? "data/tasks-v2.db")
try {
  await serveStdio(graph.server)
} finally {
  graph.close()
}
