import { readFileSync } from "node:fs"
import { isAbsolute } from "node:path"

// MCP and hooks share one installed connection file; no daily shell exports.
const [mode, path] = process.argv.slice(2)
if (!["mcp", "hook"].includes(mode ?? "") || !path || !isAbsolute(path)) throw new Error("Invalid installed Task Agent entry point")
const config = JSON.parse(readFileSync(path, "utf8"))
const keys = ["TASK_AGENT_HOST", "TASK_AGENT_RESOURCE", "TASK_AGENT_OUTBOX", "TASK_AGENT_CREDENTIALS", "TASK_AGENT_OAUTH_ISSUER", "TASK_AGENT_OAUTH_ORIGIN", "TASK_AGENT_OAUTH_CLIENT_ID"]
for (const key of keys) {
  if (typeof config[key] !== "string" || !config[key].trim()) throw new Error(`Connection is missing ${key}`)
  process.env[key] = config[key]
}
for (const key of ["TASK_AGENT_OUTBOX", "TASK_AGENT_CREDENTIALS"]) if (!isAbsolute(config[key])) throw new Error("Task Agent local storage paths must be absolute")
delete process.env.TASK_AGENT_ACCESS_TOKEN
delete process.env.TASK_AGENT_LAUNCH
delete process.env.TASK_AGENT_WORK_QUERY
process.env.TASK_AGENT_BRIDGE_MODE = "1"
if (mode === "mcp") await import("../apps/task-agent/src/host-mcp.ts")
else { process.argv = [process.execPath, process.argv[1]!, "hook"]; await import("./session-hook.ts") }
