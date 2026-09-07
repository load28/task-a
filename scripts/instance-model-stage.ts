import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { createInterface } from "node:readline"
import { atomicJson } from "../packages/task-instances/src/worker.ts"

// Credentials and model sessions belong to the task PVC, never the host checkout.
const directory = join(process.env.XDG_DATA_HOME ?? join(process.env.HOME!, ".local/share"), "opencode")
mkdirSync(directory, { recursive: true, mode: 0o700 })
const authPath = join(directory, "auth.json")
if (!existsSync(authPath) && process.env.TASK_MODEL_AUTH_JSON) {
  const auth = JSON.parse(process.env.TASK_MODEL_AUTH_JSON)
  writeFileSync(authPath, JSON.stringify(auth), { mode: 0o600 })
}
delete process.env.TASK_MODEL_AUTH_JSON
const args = process.argv.slice(2)
if (!args.length) throw new Error("Pass an execution prompt to instance-model-stage.ts")
const model = process.env.TASK_WORKER_MODEL ?? "openai/gpt-5.6-terra"
const key = createHash("sha256").update(JSON.stringify([model, args])).digest("hex")
const statePath = join(directory, `task-stage-${key}.json`)
let state: { sessionID?: string } = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {}
let failed = false, completed = false
const child = spawn("opencode", ["run", "--format", "json", "--model", model,
  ...(state.sessionID ? ["--session", state.sessionID] : []), ...args], {
  stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, TASK_AGENT_INTERNAL: "1" },
})
const output = createInterface({ input: child.stdout })
output.on("line", line => {
  process.stdout.write(line + "\n")
  try {
    const event = JSON.parse(line)
    if (event.sessionID && state.sessionID !== event.sessionID) {
      state = { sessionID: event.sessionID }; atomicJson(statePath, state)
    }
    if (event.type === "error") failed = true
    if (event.type === "step_finish" && event.part?.reason === "stop") completed = true
  } catch { /* Non-JSON CLI diagnostics are preserved above. */ }
})
child.once("error", error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1 })
child.once("close", code => { process.exitCode = code === 0 && !failed && completed ? 0 : code || 1 })
