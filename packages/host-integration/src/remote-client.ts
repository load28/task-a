import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { LocalOAuth } from "./oauth.ts"

export async function withRemote<T>(action: (call: (name: string, args: object) => Promise<Record<string, any>>) => Promise<T>): Promise<T> {
  const resource = process.env.TASK_AGENT_RESOURCE
  if (!resource || new URL(resource).protocol !== "https:") throw new Error("Configure an HTTPS Task Agent resource")
  const token = process.env.TASK_AGENT_ACCESS_TOKEN
  const oauth = token ? undefined : new LocalOAuth()
  const client = new Client({ name: "task-agent-work-client", version: "1" })
  const signal = AbortSignal.timeout(45000)
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(resource), {
      authProvider: oauth,
      fetch: oauth?.fetch,
      requestInit: { signal, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) },
    }), { signal })
    return await action(async (name, args) => {
      const result = await client.callTool({ name, arguments: { ...args } }, undefined, { signal, timeout: 45000 })
      if (result.isError) throw new Error("Task Agent operation failed; no success acknowledgement")
      if (!result.structuredContent) throw new Error("Task Agent returned no structured result")
      return result.structuredContent
    })
  } finally { await client.close(); oauth?.close() }
}
