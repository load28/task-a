import { mkdtempSync, realpathSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import assert from "node:assert/strict"
import { HostService, callService } from "../packages/host-integration/src/service.ts"
import { socketPath, type HostConfig } from "../packages/host-integration/src/config.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"

const args = process.argv.slice(2)
const parallel = args.includes("--parallel")
const option = (name: string) => {
  const at = args.indexOf(name)
  return at < 0 ? undefined : args[at + 1]
}
const directory = realpathSync(mkdtempSync(resolve(tmpdir(), "task-agent-server-evaluation-")))
const config: HostConfig = {
  version: 1,
  directory,
  database: resolve(directory, "tasks.db"),
  socket: socketPath(directory),
  workspaces: [{ path: directory }],
  model: option("--model") ?? "claude",
  opencodeUrl: option("--opencode-url"),
  autoContinue: true,
  maxRuns: 30,
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
    text: parallel ? "Create a root task with integrationPolicy targeted and two independent implementation leaves, using writeScopes [a.txt] and [b.txt]. Dispatch BOTH task-worker calls concurrently in the SAME response. Each worker must claim its own assigned task, write its file containing exactly 안녕하세요, read back and verify it, publish a code artifact (a-output or b-output, contentRef is its file path) WITH task_complete and verification evidence, then return. Do not execute the leaf work yourself. Do not run shell commands. Use native file tools and graph MCP. After both workers return verified artifact references, the manager reads both files and records an integration set on the root using those artifact names as members, then integration_run and integration_report. Do not create a QA producer whose completion requires its own consuming integration run. Finish all tasks." : "Create a graph task, start it, write hello.txt containing exactly 안녕하세요, verify its content by reading it, and complete the graph task with evidence. Do not run shell commands. Use OpenCode file tools and task_graph MCP. Do all work yourself.",
  })
  const deadline = Date.now() + 180000
  let status: any
  do {
    status = await callService(config.socket, "/status", { requestId: request.requestId, waitMs: 25000 }, 35000)
    if (status.state === "waiting" || ["failed", "uncertain", "interrupted", "completed"].includes(status.phase)) break
  } while (Date.now() < deadline)
  assert.equal(status.phase, "completed", JSON.stringify(status))
  for (const file of parallel ? ["a.txt", "b.txt"] : ["hello.txt"])
    assert.equal(readFileSync(resolve(directory, file), "utf8").trim(), "안녕하세요")
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
