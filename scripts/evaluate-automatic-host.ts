import { mkdtempSync, realpathSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import assert from "node:assert/strict"
import { HostService, callService } from "../packages/host-integration/src/service.ts"
import { socketPath, type HostConfig } from "../packages/host-integration/src/config.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { provisionEvaluationProgram } from "./evaluation-program.ts"

const args = process.argv.slice(2)
const parallel = args.includes("--parallel")
const option = (name: string) => {
  const at = args.indexOf(name)
  return at < 0 ? undefined : args[at + 1]
}
const directory = realpathSync(mkdtempSync(resolve(tmpdir(), "task-agent-server-evaluation-")))
const model = option("--model")
if (!model) throw new Error("Usage: evaluate-automatic-host.ts --model provider/model [--parallel] [--opencode-url url]")
const database = resolve(directory, "tasks.db")
const bootstrap = createGraphRuntime(database)
const program = provisionEvaluationProgram(bootstrap, model, parallel)
bootstrap.close()
const config: HostConfig = {
  version: 1,
  directory,
  database,
  socket: socketPath(directory),
  workspaces: [{ path: directory }],
  model,
  opencodeUrl: option("--opencode-url"),
  autoContinue: true,
  maxRuns: 30,
  maxWorkers: parallel ? 2 : 1,
  validationBudget: { maxJobs: 8, maxDurationMs: 10000 },
  controlProgram: { id: program.id, version: program.version },
}
const service = new HostService(config)
try {
  await service.start()
  console.log(JSON.stringify(await callService(config.socket, "/doctor", undefined, 60000), null, 2))
  const request = await callService(config.socket, "/event", {
    id: "evaluation-1",
    host: "claude",
    sessionId: "evaluation",
    workspace: directory,
    kind: "UserPromptSubmit",
    text: parallel ? "Create two independent implementation tasks. Write a.txt and b.txt with exactly 안녕하세요 and verify both files." : "Write hello.txt with exactly 안녕하세요 and verify the file.",
  })
  const deadline = Date.now() + 180000
  let status: any
  do {
    status = await callService(config.socket, "/status", { requestId: request.requestId, waitMs: 25000 }, 35000)
    if (status.state === "waiting" || ["failed", "uncertain", "interrupted", "completed"].includes(status.phase)) break
  } while (Date.now() < deadline)
  if (status.phase !== "completed") throw new Error(`Host evaluation failed: ${status.text ?? JSON.stringify(status)}`)
  for (const file of parallel ? ["a.txt", "b.txt"] : ["hello.txt"])
    assert.equal(readFileSync(resolve(directory, file), "utf8"), "안녕하세요")
  const graph = createGraphRuntime(config.database)
  try {
    assert.ok(graph.engine.rootTasks().some((t) => ["verified", "integrated"].includes(t.status)))
  } finally {
    graph.close()
  }
  if (parallel) {
    const { createOpencodeClient } = await import("@opencode-ai/sdk/v2")
    const metadata = config.opencodeUrl ? undefined : JSON.parse(readFileSync(resolve(directory, "opencode-server.json"), "utf8"))
    const password = metadata?.password ?? process.env.OPENCODE_SERVER_PASSWORD
    const username = metadata ? "task-agent" : (process.env.OPENCODE_SERVER_USERNAME ?? "opencode")
    const client = createOpencodeClient({ baseUrl: metadata?.url ?? config.opencodeUrl, headers: password ? { Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` } : {}, throwOnError: true })
    const messages = (await client.session.messages({ directory, sessionID: status.sessionID })).data ?? []
    const workers = messages.flatMap((m) => m.parts).filter((p) => p.type === "tool" && p.tool === "task" && p.state.status === "completed") as any[]
    assert.ok(workers.some((a, index) => workers.slice(index + 1).some((b) => a.state.time.start < b.state.time.end && b.state.time.start < a.state.time.end)), "Native worker tool executions must overlap, not run sequentially")
    console.log(JSON.stringify({ parallelWorkers: workers.length, overlappingExecution: true }))
  }
  console.log(
    JSON.stringify(
      {
        passed: true,
        workspace: directory,
        requestId: request.requestId,
        checks: ["native OpenCode execution", "graph MCP mutations", "file verification", "durable completion"],
      },
      null,
      2,
    ),
  )
} finally {
  await service.close()
  console.log(`Evaluation workspace: ${directory}`)
}
