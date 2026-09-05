import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import { SessionOutbox } from "../packages/host-integration/src/lifecycle.ts"

// Runs outside Codex: SessionEnd only persists locally, this parent delivers afterward.
const host = process.env.TASK_AGENT_HOST ?? "codex"
if (host !== "codex" && host !== "claude") throw new Error("Unsupported work host")
const env: NodeJS.ProcessEnv = { ...process.env, TASK_AGENT_HOST: host }
const hook = fileURLToPath(new URL("./session-hook.ts", import.meta.url))
async function flush() {
  await new Promise<void>((resolve) => {
    const child = spawn(process.execPath, [hook, "flush"], { env, stdio: ["ignore", "inherit", "inherit"] })
    child.once("error", () => resolve())
    child.once("exit", () => resolve())
  })
}
if (!env.TASK_AGENT_RESOURCE || !env.TASK_AGENT_OUTBOX) throw new Error("Configure Task Agent resource and Codex outbox first")
await flush()
if (env.TASK_AGENT_WORK_QUERY) {
  const { withRemote } = await import("../packages/host-integration/src/remote-client.ts")
  const result = await withRemote((call) => call("task_context", { query: env.TASK_AGENT_WORK_QUERY, mode: "continuation" }))
  const task = result.context?.task
  if (typeof task?.id !== "string" || typeof result.text !== "string") throw new Error("No unambiguous task context; work session was not started")
  env.TASK_AGENT_LAUNCH = randomUUID()
  const box = new SessionOutbox(env.TASK_AGENT_OUTBOX!, env.TASK_AGENT_RESOURCE!, host === "codex" ? "codex-cli-hook" : "claude-code-hook")
  try { box.prepareLaunch(env.TASK_AGENT_LAUNCH, task.id, result.text) } finally { box.close() }
  process.stderr.write(`Task Agent: ${task.title} — automatic recording requested; SessionStart must confirm binding.\n`)
}
const child = spawn(host, process.argv.slice(2), { env, stdio: "inherit" })
let delivery: Promise<void> | undefined
let bindingReported = false
const interval = setInterval(() => {
  if (env.TASK_AGENT_LAUNCH && !bindingReported) {
    try {
      const box = new SessionOutbox(env.TASK_AGENT_OUTBOX!, env.TASK_AGENT_RESOURCE!, host === "codex" ? "codex-cli-hook" : "claude-code-hook")
      try {
        const session = box.launch(env.TASK_AGENT_LAUNCH)?.session
        process.stderr.write(session ? "Task Agent: automatic recording connected.\n" : "Task Agent: recording is NOT connected; check SessionStart hooks before continuing.\n")
        bindingReported = Boolean(session)
      } finally { box.close() }
    } catch { process.stderr.write("Task Agent: unable to verify recording status.\n") }
  }
  if (!delivery) delivery = flush().finally(() => { delivery = undefined })
}, 15000)
// Terminal SIGINT reaches Codex directly; keep the parent alive to flush afterward.
const interrupt = () => {}
const terminate = () => { child.kill("SIGTERM") }
process.on("SIGINT", interrupt)
process.on("SIGTERM", terminate)
const result = await new Promise<number>((resolve) => {
  child.once("error", () => { process.stderr.write("Unable to launch host CLI\n"); resolve(127) })
  child.once("exit", (code, signal) => resolve(code ?? (signal === "SIGINT" ? 130 : 143)))
})
clearInterval(interval)
await delivery
await flush()
if (env.TASK_AGENT_LAUNCH) {
  const box = new SessionOutbox(env.TASK_AGENT_OUTBOX!, env.TASK_AGENT_RESOURCE!, host === "codex" ? "codex-cli-hook" : "claude-code-hook")
  try {
    const launch = box.launch(env.TASK_AGENT_LAUNCH)
    if (!launch?.session) process.stderr.write("Task Agent: SessionStart did not confirm recording. Check hook installation; this session was not automatically captured.\n")
    else {
      process.stderr.write(`Task Agent: ${box.pending()} queued operation(s) remain.\n`)
      if (!box.latestHandoff(launch.session)) process.stderr.write("Task Agent: final handoff is not confirmed; check SessionEnd hooks and pending delivery.\n")
    }
  } finally { box.close() }
}
process.removeListener("SIGINT", interrupt)
process.removeListener("SIGTERM", terminate)
process.exitCode = result
