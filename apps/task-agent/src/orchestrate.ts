import { homedir } from "node:os"
import { resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { loadConfig, workspaceFor } from "../../../packages/host-integration/src/config.ts"
import { ensureService } from "../../../packages/host-integration/src/launcher.ts"
import { callService } from "../../../packages/host-integration/src/service.ts"

const text = process.argv.slice(2).join(" ")
if (!text || text === "--help") {
  console.log('Usage: npm run orchestrate -- "request to the OpenCode server"')
} else {
  const path = resolve(homedir(), ".task-agent/host.json")
  const config = loadConfig(path)
  const workspace = workspaceFor(config, process.cwd())
  if (!workspace) throw new Error("Install this workspace with host:install first")
  await ensureService(path, config)
  const result = await callService(config.socket, "/event", {
    id: randomUUID(),
    host: "codex",
    sessionId: `cli-${process.pid}`,
    workspace: workspace.path,
    kind: "UserPromptSubmit",
    text,
    prompt: text,
  })
  console.log(JSON.stringify(result, null, 2))
  console.log("OpenCode 서버에 전달했습니다. 호스트 MCP의 opencode_status에서 requestId로 결과를 조회할 수 있습니다.")
}
