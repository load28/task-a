import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { install, uninstall, refreshHostBindings, serviceRoot } from "../packages/host-integration/src/install.ts"
import { verifyHostBindings } from "../packages/host-integration/src/verify-bindings.ts"

function fixture(t: any) {
  const home = mkdtempSync(resolve(tmpdir(), "host-bindings-"))
  t.after(() => rmSync(home, { recursive: true, force: true }))
  install({ home, hosts: ["codex", "claude"] })
  return { home, configPath: resolve(home, ".task-agent/host.json"), toml: resolve(home, ".codex/config.toml") }
}
test("갱신은 구버전 MCP 등록을 이전하고 저장된 명령으로 실제 초기화를 검증한다", async t => {
  const { home, configPath, toml } = fixture(t)
  const legacy = `[mcp_servers.task-agent]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ${JSON.stringify([resolve(serviceRoot, "scripts/host-entry.ts"), "mcp", "obsolete-config.json"])}\n[mcp_servers.task-agent.env]\nNODE_EXTRA_CA_CERTS = "obsolete.crt"\n`
  writeFileSync(toml, `model = "keep-model"\n${legacy}[mcp_servers.other]\ncommand = "keep-command"\n`)
  writeFileSync(resolve(home, ".task-agent/installation.json"), "{}")
  const config = JSON.parse(readFileSync(configPath, "utf8"))
  config.autoDiscover = false
  config.workspaces = [{ path: home }]
  config.customSetting = "keep"
  writeFileSync(configPath, JSON.stringify(config))
  const hosts = refreshHostBindings(home, configPath)
  assert.deepEqual(hosts, ["claude", "codex"])
  assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), config)
  const updated = readFileSync(toml, "utf8")
  assert.match(updated, /host-mcp\.ts/)
  assert.doesNotMatch(updated, /host-entry|obsolete/)
  assert.match(updated, /keep-command/)
  assert.match(updated, /keep-model/)
  assert.deepEqual(await verifyHostBindings(home, hosts), hosts)
  uninstall(home, hosts)
  assert.doesNotMatch(readFileSync(toml, "utf8"), /mcp_servers.task-agent|host-entry/)
  assert.deepEqual(refreshHostBindings(home, configPath), [])
})

test("이전 설치 기록의 구버전 등록은 연동 해제 시 복원하지 않는다", t => {
  const { home, toml } = fixture(t)
  const legacy = `[mcp_servers.task-agent]\ncommand = "node"\nargs = ${JSON.stringify([resolve(serviceRoot, "scripts/host-entry.ts")])}\n`
  writeFileSync(resolve(home, ".task-agent/installation.json"), JSON.stringify({ codex: { mcp: legacy } }))
  uninstall(home, ["codex"])
  assert.doesNotMatch(readFileSync(toml, "utf8"), /task-agent|host-entry/)
})

test("등록 명령이 시작하지 못하면 갱신 검증은 실패한다", async t => {
  const { home, toml } = fixture(t)
  writeFileSync(toml, `[mcp_servers.task-agent]\ncommand = ${JSON.stringify(process.execPath)}\nargs = ["/missing-task-agent-entry.ts"]\n`)
  await assert.rejects(verifyHostBindings(home, ["codex"]), /MCP initialize\/tools\/list failed/)
})
