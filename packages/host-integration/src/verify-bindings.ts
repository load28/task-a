import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"

/** Launch the saved client command, including initialize and tools/list, outside the repo. */
export async function verifyHostBindings(home: string, hosts: Array<"claude" | "codex">) {
  const verified: string[] = []
  for (const host of hosts) {
    let binding: { command: string; args: string[] }
    if (host === "claude") binding = JSON.parse(readFileSync(resolve(home, ".claude.json"), "utf8")).mcpServers["task-agent"]
    else {
      const text = readFileSync(resolve(home, ".codex/config.toml"), "utf8")
      const block = text.split(/^\[/m).find(section => section.startsWith("mcp_servers.task-agent]"))
      const read = (key: string) => JSON.parse(block?.match(new RegExp(`^${key} = (.+)$`, "m"))?.[1] ?? "null")
      binding = { command: read("command"), args: read("args") }
    }
    if (!binding?.command || !Array.isArray(binding.args)) throw new Error(`${host}: invalid registered MCP command`)
    const client = new Client({ name: "task-agent-local-verification", version: "1.0" })
    const transport = new StdioClientTransport({ ...binding, cwd: tmpdir(), stderr: "pipe" })
    let stderr = ""
    try {
      const connecting = client.connect(transport, { timeout: 10000 })
      transport.stderr?.on("data", chunk => { stderr = (stderr + chunk).slice(-4000) })
      await connecting
      const list = await client.listTools({}, { timeout: 10000 })
      for (const name of ["agent_control", "agent_status", "agent_reply", "agent_cancel"])
        if (!list.tools.some(tool => tool.name === name)) throw new Error(`Missing MCP tool: ${name}`)
      verified.push(host)
    } catch (error) {
      throw new Error(`${host} MCP initialize/tools/list failed: ${String(error)}${stderr ? `\n${stderr}` : ""}`)
    } finally { await client.close(); await transport.close() }
  }
  return verified
}
