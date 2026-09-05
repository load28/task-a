import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"

test("local deployment generates stable private identity and production-compatible PKCE claims", () => {
  const directory = mkdtempSync(join(tmpdir(), "task-agent-docker-"))
  try {
    const prepare = () => execFileSync(process.execPath, ["scripts/prepare-local-docker.ts"], { env: { ...process.env, TASK_AGENT_LOCAL_OUTPUT: directory }, encoding: "utf8" })
    const output = prepare()
    const state = readFileSync(join(directory, "settings.json"), "utf8")
    prepare()
    assert.equal(readFileSync(join(directory, "settings.json"), "utf8"), state)
    assert.ok(!output.includes(JSON.parse(state).password))
    assert.equal(statSync(join(directory, "settings.json")).mode & 0o777, 0o600)
    const realm = JSON.parse(readFileSync(join(directory, "realm.json"), "utf8"))
    const client = realm.clients[0]
    assert.equal(client.directAccessGrantsEnabled, false)
    assert.equal(client.attributes["pkce.code.challenge.method"], "S256")
    assert.ok(client.protocolMappers.some((mapper: any) => mapper.protocolMapper === "oidc-sub-mapper"))
    assert.equal(realm.users[0].id, JSON.parse(state).owner)
    assert.ok(client.protocolMappers.some((mapper: any) => mapper.config["claim.name"] === "token_use" && mapper.config["claim.value"] === "access"))
    const compose = readFileSync("deploy/local/compose.yaml", "utf8")
    assert.ok(compose.includes('ports: ["127.0.0.1:8443:8443"]'))
    assert.ok(!compose.includes("TASK_AGENT_DISABLE_OPENCODE"))
    assert.ok(!compose.includes("NODE_TLS_REJECT_UNAUTHORIZED"))
    assert.ok(compose.includes('command: ["start", "--import-realm"]'))
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
