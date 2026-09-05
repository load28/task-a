import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { tools } from "../../../packages/protocol-mcp/src/index.ts"
import { SessionOutbox } from "../../../packages/host-integration/src/lifecycle.ts"
import { HostBridge, BRIDGE_INSTRUCTIONS } from "../../../packages/host-integration/src/bridge.ts"
import { withRemote } from "../../../packages/host-integration/src/remote-client.ts"
import { InteractiveLogin } from "../../../packages/host-integration/src/interactive-login.ts"

const host = process.env.TASK_AGENT_HOST
const destination = process.env.TASK_AGENT_RESOURCE
const path = process.env.TASK_AGENT_OUTBOX
if (!path || !destination || new URL(destination).protocol !== "https:" || !["codex", "claude"].includes(host ?? "")) throw new Error("Task Agent host connection is not configured")
const box = new SessionOutbox(path, destination, host === "codex" ? "codex-cli-hook" : "claude-code-hook")
const login = new InteractiveLogin()
const bridge = new HostBridge(box, (name, args) => withRemote((call) => call(name, args)), login)
const server = new Server({ name: "task-agent-host", version: "0.3.0" }, { capabilities: { tools: {} }, instructions: BRIDGE_INSTRUCTIONS })
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
  ...tools.map((tool) => ({ ...tool, inputSchema: { ...tool.inputSchema, type: "object" as const, properties: { ...tool.inputSchema.properties, ...(tool.name === "task_context" ? { record: { type: "boolean", description: "Enable recording only when the user starts actual work, not for status queries" }, recordingSession: { type: "string", description: "Internal handle provided by SessionStart; never ask the user to enter it" } } : {}) } } })),
  { name: "task_connect", description: "Connect or check Task Agent login inside this conversation; returns a browser login link when needed", inputSchema: { type: "object" as const, properties: { action: { type: "string", enum: ["login", "status"] } } } },
  { name: "task_recording", description: "Inspect or pause automatic recording for this conversation", inputSchema: { type: "object" as const, properties: { recordingSession: { type: "string" }, action: { type: "string", enum: ["status", "pause"] } }, required: ["recordingSession"] } },
] }))
server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  try {
    const result = await bridge.call(params.name, params.arguments ?? {})
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result }
  } catch (error) {
    return { isError: true, content: [{ type: "text" as const, text: error instanceof Error ? error.message : "Task Agent operation failed" }] }
  }
})
let delivery: Promise<void> | undefined
let closed = false
function flush() {
  if (!delivery && box.pending()) delivery = withRemote((call) => box.drain({ sync: (r) => call("task_sync", r), handoff: (r) => call("task_handoff", r) }))
    .catch(() => { process.stderr.write("Task Agent: pending recording retained; login or network connection is required.\n") }).finally(() => { delivery = undefined })
  return delivery
}
const timer = setInterval(() => { void flush() }, 15000)
async function close() {
  if (closed) return
  closed = true
  clearInterval(timer)
  await delivery
  await flush()
  login.close()
  box.close()
  await server.close()
}
server.onclose = () => { void close() }
process.on("SIGTERM", () => { void close() })
process.stdin.on("end", () => { void close() })
await server.connect(new StdioServerTransport())
void flush()
