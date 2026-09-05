import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const [host, query, ...args] = process.argv.slice(2)
if (!["codex", "claude"].includes(host ?? "") || !query?.trim()) throw new Error('Usage: node scripts/work.ts codex|claude "작업 이름 또는 설명" [host CLI arguments]')
const child = spawn(process.execPath, [fileURLToPath(new URL("./codex-task.ts", import.meta.url)), ...args], {
  stdio: "inherit", env: { ...process.env, TASK_AGENT_HOST: host, TASK_AGENT_WORK_QUERY: query },
})
process.on("SIGINT", () => {})
process.on("SIGTERM", () => child.kill("SIGTERM"))
child.once("error", () => { process.stderr.write("Unable to start work session\n"); process.exitCode = 127 })
child.once("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGINT" ? 130 : 143) })
