import { spawn } from "node:child_process"
import { randomBytes } from "node:crypto"
import { fileURLToPath } from "node:url"
import { delimiter, dirname, join, resolve } from "node:path"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { createServer } from "node:net"
import { createOpencodeClient } from "@opencode-ai/sdk/v2"

export const serviceRoot = fileURLToPath(new URL("../../../", import.meta.url))
export const taskTools = ["search_task", "get_task", "create_task", "update_task", "append_event", "link_artifact", "complete_task", "link_task"]

// Each worker gets its own process environment, project directory and password.
export async function launchHost() {
  const configured = process.env.TASK_AGENT_OPENCODE_PORT
  const port = configured === undefined ? await availablePort() : Number(configured)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("TASK_AGENT_OPENCODE_PORT must be a valid port")
  const password = randomBytes(24).toString("hex")
  const permissions = Object.fromEntries([["*", "deny"], ...taskTools.map((name) => [name, "allow"])])
  const manifestPath = createRequire(import.meta.url).resolve("opencode-ai/package.json")
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  const executable = resolve(dirname(manifestPath), manifest.bin.opencode)
  const child = spawn(executable, ["serve", "--hostname=127.0.0.1", `--port=${port}`], {
    cwd: serviceRoot,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      PATH: `${join(serviceRoot, "node_modules/.bin")}${delimiter}${process.env.PATH ?? ""}`,
      TASK_AGENT_DB: resolve(serviceRoot, process.env.TASK_AGENT_DB ?? "data/tasks.db"),
      TASK_AGENT_NODE: process.execPath,
      OPENCODE_SERVER_USERNAME: "opencode",
      OPENCODE_SERVER_PASSWORD: password,
      OPENCODE_CONFIG_CONTENT: JSON.stringify({ permission: permissions }),
    },
  })
  const stop = () => { child.kill() }
  process.once("exit", stop)
  try {
    await new Promise<void>((resolveReady, reject) => {
      let output = ""
      const timer = setTimeout(() => { stop(); reject(new Error("OpenCode startup timed out")) }, 15000)
      child.once("error", (error) => { clearTimeout(timer); reject(error) })
      child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`OpenCode exited during startup: ${code}`)) })
      child.stdout!.on("data", (chunk) => {
        output = (output + chunk.toString()).slice(-4096)
        if (output.includes("opencode server listening")) { clearTimeout(timer); resolveReady() }
      })
      // Drain logs without contaminating MCP stdout or exposing configuration.
      child.stderr!.on("data", () => {})
    })
  } catch (error) {
    process.off("exit", stop)
    stop()
    throw error
  }
  return {
    client: createOpencodeClient({
      baseUrl: `http://127.0.0.1:${port}`,
      headers: { Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}` },
    }),
    close() { process.off("exit", stop); stop() },
  }
}

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolveReady, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolveReady)
  })
  const address = server.address()
  const port = typeof address === "object" && address ? address.port : 4096
  await new Promise<void>((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()))
  return port
}
