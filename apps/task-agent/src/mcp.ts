import { createGraphMcp } from "../../../packages/opencode-harness/src/graph-mcp.ts"
import { serveStdio } from "../../../packages/protocol-mcp/src/index.ts"
const surface=process.env.TASK_GRAPH_SURFACE??"cognitive"
if(surface!=="cognitive"&&surface!=="controller")throw new Error("Unknown graph capability surface")
const graph = createGraphMcp(process.env.TASK_AGENT_DB ?? "data/tasks-v2.db",3,undefined,surface)
try {
  await serveStdio(graph.server)
} finally {
  graph.close()
}
