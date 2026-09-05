import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { auth } from "@modelcontextprotocol/sdk/client/auth.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { LocalOAuth } from "./local-oauth.ts"
import { tools } from "../packages/protocol-mcp/src/index.ts"

// Uses only accounts generated for this local Docker fixture. No tokens/passwords are logged.
const directory = fileURLToPath(new URL("../data/local-docker/", import.meta.url))
const config = JSON.parse(readFileSync(join(directory, "smoke-connection.json"), "utf8"))
const settings = JSON.parse(readFileSync(join(directory, "settings.json"), "utf8"))
const resource = config.TASK_AGENT_RESOURCE as string
async function login(username: "owner" | "stranger", scope: string, suffix: string = username) {
  const provider = new LocalOAuth({ ...config, TASK_AGENT_CREDENTIALS: join(directory, `smoke-${suffix}-credentials.db`) })
  provider.invalidateCredentials("tokens")
  let url: URL | undefined
  provider.onRedirect = (value) => { url = value }
  try {
    assert.equal(await auth(provider, { serverUrl: resource, scope, fetchFn: provider.fetch }), "REDIRECT")
    assert.equal(url!.searchParams.get("code_challenge_method"), "S256")
    const page = await fetch(url!, { redirect: "manual" })
    assert.equal(page.status, 200, "Expected Keycloak browser login form")
    const cookies = page.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ")
    const html = await page.text()
    const action = html.match(/<form[^>]*id="kc-form-login"[^>]*action="([^"]+)"/)?.[1]
    assert.ok(action, "Keycloak login form was not available")
    const target = new URL(action.replaceAll("&amp;", "&"))
    assert.equal(target.origin, new URL(resource).origin)
    const response = await fetch(target, { method: "POST", redirect: "manual", headers: { Cookie: cookies, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ username, password: username === "owner" ? settings.password : settings.strangerPassword, credentialId: "" }) })
    assert.equal(response.status, 302, "Local fixture login did not return an authorization code")
    const callback = new URL(response.headers.get("location")!)
    assert.equal(callback.origin, new URL(provider.redirectUrl).origin)
    const code = provider.authorizationCode(callback)
    assert.equal(await auth(provider, { serverUrl: resource, authorizationCode: code, fetchFn: provider.fetch }), "AUTHORIZED")
    return provider
  } catch (error) { provider.close(); throw error }
}
const owner = await login("owner", `openid ${resource}/read ${resource}/write`)
const stranger = await login("stranger", `openid ${resource}/read ${resource}/write`)
const reader = await login("owner", `openid ${resource}/read`, "read-only")
const client = new Client({ name: "local-deployment-smoke", version: "1" })
const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" }
const initialize = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } })
try {
  assert.equal(typeof (owner.tokens() as any).id_token, "string", "Expected a real ID token for rejection test")
  assert.equal(typeof owner.tokens()!.refresh_token, "string", "Expected refresh token")
  assert.equal((await fetch(resource, { method: "POST", headers, body: initialize })).status, 401)
  assert.equal((await fetch(resource, { method: "POST", headers: { ...headers, Authorization: `Bearer ${stranger.tokens()!.access_token}` }, body: initialize })).status, 403)
  assert.equal((await fetch(resource, { method: "POST", headers: { ...headers, Authorization: `Bearer ${(owner.tokens() as any).id_token}` }, body: initialize })).status, 401)
  const denied = await fetch(resource, { method: "POST", headers: { ...headers, Authorization: `Bearer ${reader.tokens()!.access_token}` }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "task_create", arguments: { title: "must not run", goal: "denied" } } }) })
  assert.equal((await denied.json() as any).result.isError, true)
  assert.equal(await auth(owner, { serverUrl: resource, fetchFn: owner.fetch }), "AUTHORIZED")
  await client.connect(new StreamableHTTPClientTransport(new URL(resource), { authProvider: owner, fetch: owner.fetch }))
  assert.equal((await client.listTools()).tools.length, tools.length)
  console.log("PASS: verified HTTPS, browser authorization code + PKCE, refresh, MCP, owner isolation, ID-token rejection and write-scope enforcement")
  if (process.env.TASK_AGENT_SMOKE_WRITE === "1") {
    const stamp = Date.now()
    const call = async (name: string, args: Record<string, unknown>) => {
      const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 60000 })
      assert.ok(!result.isError, `${name} failed: ${JSON.stringify(result.content)}`)
      return result.structuredContent as any
    }
    const root = await call("task_create", { title: `Docker smoke ${stamp}`, goal: "로컬 배포에서 Task Graph 전체 흐름 검증" })
    const decomposed = await call("task_propose_decomposition", { taskId: root.id, children: [
      { key: "a", title: `smoke impl A ${stamp}`, goal: "A 구현" },
      { key: "b", title: `smoke impl B ${stamp}`, goal: "B 구현", dependencies: ["a"] },
    ] })
    const [childA, childB] = decomposed.children
    const runnable = await call("task_get_runnable", { rootId: root.id })
    assert.equal(runnable.items[0].task.id, childA.id)
    await call("task_start", { taskId: childA.id, agent: "smoke" })
    await call("task_complete", { taskId: childA.id, summary: "A done", artifacts: [{ name: `smoke-a-${stamp}`, type: "code", contentRef: "smoke://a" }], verification: { passed: true } })
    await call("task_start", { taskId: childB.id, agent: "smoke" })
    await call("task_complete", { taskId: childB.id, summary: "B done", artifacts: [{ name: `smoke-b-${stamp}`, type: "code", contentRef: "smoke://b" }], verification: { passed: true } })
    const proposal = await call("integration_propose", { integrationSets: [{ name: `smoke set ${stamp}`, parentTaskId: root.id, members: [`smoke-a-${stamp}`, `smoke-b-${stamp}`], scenarios: [{ name: "combined", expectedBehavior: ["A and B work together"] }] }] })
    const run = await call("integration_run", { setRef: proposal.sets[0].id })
    await call("integration_report", { runId: run.run.id, scenarios: run.scenarios.map((scenario: any) => ({ scenarioId: scenario.id, status: "passed" })) })
    const loaded = await call("task_load", { taskId: root.id })
    assert.equal(loaded.task.status, "integrated", `Root status: ${loaded.task.status}`)
    assert.equal(loaded.completion.complete, true)
    console.log(`PASS: remote task graph flow — create, decompose, runnable, start, complete, integration, bundle promotion; root task ${root.id}`)
  }
} finally { await client.close(); owner.close(); stranger.close(); reader.close() }
