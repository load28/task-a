import { createRuntime } from "./runtime.ts"
import { TaskAgentHttpServer } from "../../../packages/protocol-http/src/index.ts"
import { startOpenCode } from "#opencode-harness"

const useOpenCode = process.env.TASK_AGENT_DISABLE_OPENCODE !== "1"
const harness = useOpenCode ? await startOpenCode() : undefined
const runtime = createRuntime({ reasoner: harness?.reasoner })
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
  harness?.close()
}

process.once("SIGINT", () => void close().then(() => process.exit(0)))
process.once("SIGTERM", () => void close().then(() => process.exit(0)))
