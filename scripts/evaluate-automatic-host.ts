import { mkdtempSync, realpathSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import assert from "node:assert/strict"
import { HostService, callService } from "../packages/host-integration/src/service.ts"
import { socketPath, type HostConfig } from "../packages/host-integration/src/config.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"

const args = process.argv.slice(2)
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
    text: "Create a graph task, start it, write hello.txt containing exactly 안녕하세요, verify its content by reading it, and complete the graph task with evidence. Do not run shell commands. Use OpenCode file tools and task_graph MCP. Do all work yourself.",
  })
  const deadline = Date.now() + 180000
  let status: any
  do {
    status = await callService(config.socket, "/status", { requestId: request.requestId, waitMs: 25000 }, 35000)
    if (status.state === "waiting" || ["failed", "uncertain", "interrupted", "completed"].includes(status.phase)) break
  } while (Date.now() < deadline)
  assert.equal(status.phase, "completed", JSON.stringify(status))
  assert.equal(readFileSync(resolve(directory, "hello.txt"), "utf8").trim(), "안녕하세요")
  const graph = createGraphRuntime(config.database)
  try {
    assert.ok(graph.engine.rootTasks().some((t) => ["verified", "integrated"].includes(t.status)))
  } finally {
    graph.close()
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
