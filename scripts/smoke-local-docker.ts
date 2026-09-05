import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"
import { auth } from "@modelcontextprotocol/sdk/client/auth.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { LocalOAuth } from "../packages/host-integration/src/oauth.ts"

// Uses only accounts generated for this local Docker fixture. No tokens/passwords are logged.
const directory = fileURLToPath(new URL("../data/local-docker/", import.meta.url))
const config = JSON.parse(readFileSync(join(directory, "codex-connection.json"), "utf8"))
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
  const denied = await fetch(resource, { method: "POST", headers: { ...headers, Authorization: `Bearer ${reader.tokens()!.access_token}` }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "task_run", arguments: { instruction: "must not run" } } }) })
  assert.equal((await denied.json() as any).result.isError, true)
  assert.equal(await auth(owner, { serverUrl: resource, fetchFn: owner.fetch }), "AUTHORIZED")
  await client.connect(new StreamableHTTPClientTransport(new URL(resource), { authProvider: owner, fetch: owner.fetch }))
  assert.equal((await client.listTools()).tools.length, 4)
  console.log("PASS: verified HTTPS, browser authorization code + PKCE, refresh, MCP, owner isolation, ID-token rejection and write-scope enforcement")
  if (process.env.TASK_AGENT_SMOKE_MODEL === "1") {
    const title = `Docker 실사용 검증 ${Date.now()}`
    const created = await client.callTool({ name: "task_run", arguments: { instruction: `제목이 '${title}'이고 목표가 '정규화 설계 검증'인 테스트 Task를 정확히 하나 생성해.` } }, undefined, { timeout: 180000 })
    assert.ok(!created.isError, "Real-model task creation failed")
    const context = await client.callTool({ name: "task_context", arguments: { query: title } }, undefined, { timeout: 180000 })
    const taskId = (context.structuredContent as any)?.context?.task?.id
    assert.ok(taskId)
    const proposal = await client.callTool({ name: "task_sync", arguments: { taskId, conversation: "사용자: 정규화 단계를 따로 두는 것도 괜찮을 것 같은데? 아직 결정하지 말고 후보로만 생각해 봐.", idempotencyKey: `docker-proposal-${taskId}` } }, undefined, { timeout: 180000 })
    assert.ok(!proposal.isError)
    assert.equal((proposal.structuredContent as any).appended.length, 0)
    const synced = await client.callTool({ name: "task_sync", arguments: { taskId, conversation: "사용자: 정규화 단계를 독립 단계로 분리하기로 확정했어.", idempotencyKey: `docker-smoke-${taskId}` } }, undefined, { timeout: 180000 })
    assert.ok(!synced.isError, "Real-model sync failed")
    const handoff = await client.callTool({ name: "task_handoff", arguments: { taskId } })
    assert.equal((handoff.structuredContent as any).context.importantDecisions.length, 1, `Expected confirmed decision; sync result: ${JSON.stringify(synced.structuredContent)}`)
    console.log(`PASS: container OpenCode create → context → sync → handoff; test task ${taskId}`)
  }
} finally { await client.close(); owner.close(); stranger.close(); reader.close() }
