import { ensureService } from "../packages/host-integration/src/launcher.ts"
import { homedir } from "node:os"
import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { install, uninstall } from "../packages/host-integration/src/install.ts"
import { loadConfig } from "../packages/host-integration/src/config.ts"
import { callService } from "../packages/host-integration/src/service.ts"
const args = process.argv.slice(2),
  command = args.shift() ?? "status"
function option(name: string): string | undefined {
  const i = args.indexOf(name)
  if (i < 0) return
  const value = args[i + 1]
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`)
  return value
}
const home = option("--home") ?? homedir(),
  host = option("--host") ?? "both"
if (!["claude", "codex", "both"].includes(host)) throw new Error("Invalid host")
const hosts = host === "both" ? (["claude", "codex"] as const) : [host as "claude" | "codex"]
const configPath = resolve(home, ".task-agent/host.json")
if (command === "install") {
  const workspace = option("--workspace")
  console.log(
    JSON.stringify(
      install({
        home,
        workspace,
        hosts: [...hosts],
        database: option("--database"),
        model: option("--model"),
        opencodeUrl: option("--opencode-url"),
        graphMcpUrl: option("--graph-mcp-url"),
        verifyCommand: option("--verify-command"),
      }),
      null,
      2,
    ),
  )
  if (existsSync(configPath)) {
    try {
      await callService(loadConfig(configPath).socket, "/shutdown", {}, 3000)
    } catch {}
  }
} else if (command === "uninstall") {
  if (existsSync(configPath)) {
    try {
      await callService(loadConfig(configPath).socket, "/shutdown", {}, 3000)
    } catch {}
  }
  uninstall(home, [...hosts])
  console.log("Automatic host integration removed; database preserved")
} else if (command === "start") {
  const config = loadConfig(configPath)
  await ensureService(configPath, config)
  console.log(JSON.stringify(await callService(config.socket, "/health"), null, 2))
} else if (["status", "doctor", "stop", "cancel"].includes(command)) {
  const config = loadConfig(configPath)
  try {
    console.log(
      JSON.stringify(
        await callService(
          config.socket,
          command === "doctor"
            ? "/doctor"
            : command === "status"
              ? "/health"
              : command === "stop"
                ? "/shutdown"
                : "/cancel",
          ["status", "doctor"].includes(command) ? undefined : { requestId: option("--request") },
          command === "doctor" ? 60000 : 15000,
        ),
        null,
        2,
      ),
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
} else
  throw new Error(
    "Usage: host-setup.ts install|uninstall|status|stop|cancel [--host both|claude|codex] [--workspace path] [--model provider/model] [--verify-command command]",
  )
