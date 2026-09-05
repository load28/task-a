import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import { serveStdio } from "../packages/protocol-mcp/src/index.ts"
const database = process.argv[2] ?? process.env.TASK_AGENT_DB
if (!database) throw new Error("Graph MCP requires a database path")
const graph = createGraphMcp(database)
try {
  await serveStdio(graph.server)
} finally {
  graph.close()
}
