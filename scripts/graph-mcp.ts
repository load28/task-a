import { createGraphMcp } from "../packages/opencode-harness/src/graph-mcp.ts"
import { serveStdio } from "../packages/protocol-mcp/src/index.ts"
const database = process.argv[2] ?? process.env.TASK_AGENT_DB
if (!database) throw new Error("Graph MCP requires a database path")
const surface=process.env.TASK_GRAPH_SURFACE??"cognitive"
if(surface!=="controller"&&surface!=="cognitive")throw new Error("Unknown graph capability surface")
const graph = createGraphMcp(database, Number(process.env.TASK_AGENT_MAX_WORKERS ?? 3),undefined,surface)
try {
  await serveStdio(graph.server)
} finally {
  graph.close()
}
