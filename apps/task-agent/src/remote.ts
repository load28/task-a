import { OwnerAuthenticator } from "../../../packages/task-auth/src/index.ts"
import { createRemoteServer } from "../../../packages/protocol-mcp/src/remote.ts"
import { createRuntime } from "./runtime.ts"
import { startOpenCode } from "#opencode-harness"

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for remote mode`)
  return value
}
const resource = required("TASK_AGENT_RESOURCE")
const issuer = required("TASK_AGENT_ISSUER")
const ownerSubject = required("TASK_AGENT_OWNER_SUBJECT")
const auth = new OwnerAuthenticator({
  resource, issuer, ownerSubject,
  jwksUri: required("TASK_AGENT_JWKS_URI"),
  clientIds: required("TASK_AGENT_CLIENT_IDS").split(",").map((id) => id.trim()),
  readScope: required("TASK_AGENT_READ_SCOPE"), writeScope: required("TASK_AGENT_WRITE_SCOPE"),
  revokedBefore: process.env.TASK_AGENT_REVOKED_BEFORE ? Number(process.env.TASK_AGENT_REVOKED_BEFORE) : undefined,
})
if (new URL(resource).pathname !== "/mcp") throw new Error("TASK_AGENT_RESOURCE must end in /mcp")
const runtime = createRuntime()
runtime.repository.bindOwner(issuer, ownerSubject)
let harness: Awaited<ReturnType<typeof startOpenCode>> | undefined
try {
  harness = process.env.TASK_AGENT_DISABLE_OPENCODE === "1" ? undefined : await startOpenCode()
  const { TaskAgentService } = await import("#task-agent-core")
  const server = createRemoteServer(new TaskAgentService(runtime.engine, harness?.reasoner), auth)
  const port = Number(process.env.TASK_AGENT_PORT ?? 7331)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid port")
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, process.env.TASK_AGENT_HOST ?? "127.0.0.1", resolve)
  })
  process.stdout.write("Authenticated Task Agent MCP server ready\n")
  let closing = false
  const close = () => {
    if (closing) return
    closing = true
    const deadline = setTimeout(() => server.closeAllConnections(), 150000)
    deadline.unref()
    server.close(() => { clearTimeout(deadline); harness?.close(); runtime.close() })
  }
  process.once("SIGINT", close)
  process.once("SIGTERM", close)
} catch (error) { harness?.close(); runtime.close(); throw error }
