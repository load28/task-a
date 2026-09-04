import assert from "node:assert/strict"
import { launchHost, serviceRoot, taskTools } from "../packages/opencode-harness/src/host.ts"

const host = await launchHost()
try {
  const result = await host.client.tool.ids({ directory: serviceRoot }, { throwOnError: true, signal: AbortSignal.timeout(30000) })
  assert.ok(result.data)
  for (const name of taskTools) assert.ok(result.data.includes(name), `Missing tool: ${name}`)
  console.log("OpenCode authenticated startup and all 8 Task Tools verified")
} finally {
  host.close()
}
