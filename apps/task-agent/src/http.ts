import { createRuntime } from "./runtime.ts"
import { TaskAgentHttpServer } from "../../../packages/protocol-http/src/index.ts"

const runtime = createRuntime()
const server = new TaskAgentHttpServer(runtime.agent, {
  hostname: process.env.TASK_AGENT_HOST,
  port: process.env.TASK_AGENT_PORT ? Number(process.env.TASK_AGENT_PORT) : undefined,
  token: process.env.TASK_AGENT_TOKEN,
})
const { url } = await server.listen()
process.stdout.write(`Task Agent listening on ${url}\n`)

let closing = false
async function close(): Promise<void> {
  if (closing) return
  closing = true
  await server.close()
  runtime.close()
}

process.once("SIGINT", () => void close().then(() => process.exit(0)))
process.once("SIGTERM", () => void close().then(() => process.exit(0)))
