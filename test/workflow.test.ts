import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, statSync, writeFileSync, realpathSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawnSync } from "node:child_process"
import { auth } from "@modelcontextprotocol/sdk/client/auth.js"
import { LocalOAuth } from "../packages/host-integration/src/oauth.ts"
import { SessionOutbox } from "../packages/host-integration/src/lifecycle.ts"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { TaskAgentService } from "#task-agent-core"

test("two device outboxes continue one persistent task without manual session binding", async () => {
  const directory = mkdtempSync(join(tmpdir(), "work-flow-"))
  const repository = new SqliteTaskRepository(join(directory, "server.db"))
  const first = new SessionOutbox(join(directory, "device-a.db"), "https://tasks.example/mcp", "codex-cli-hook")
  const second = new SessionOutbox(join(directory, "device-b.db"), "https://tasks.example/mcp")
  try {
    const engine = new TaskEngine(repository)
    const task = engine.createTask({ title: "RL compiler", objective: "추론 개선" }).task
    const agent = new TaskAgentService(engine, {
      async extractEvents({ conversation }) { return conversation.includes("분리하자") ? [{ type: "decision", content: "normalization 단계 분리" }] : [] },
      async selectTask({ candidates }) { return candidates[0]!.id }, async run() { return "" },
    })
    const original = await agent.context({ query: "RL compiler" })
    first.prepareLaunch("launch-a", original.context.task.id, original.text)
    first.startLaunch("launch-a", "codex-session", "/rollout", 0)
    first.capture("codex-session", 0, 20, "user: normalization을 분리하자", true)
    await first.drain({ sync: (r) => agent.sync(r), handoff: (r) => agent.handoff(r) })
    const continued = await agent.context({ query: "RL compiler" })
    assert.equal(continued.context.task.id, task.id)
    assert.deepEqual(continued.context.importantDecisions, ["normalization 단계 분리"])
    second.prepareLaunch("launch-b", continued.context.task.id, continued.text)
    assert.match(second.startLaunch("launch-b", "claude-session", "/transcript", 0), /normalization 단계 분리/)
    assert.throws(() => second.startLaunch("launch-b", "other-session", "/transcript", 0), /does not match/)
    const other = engine.createTask({ title: "다른 작업", objective: "별개" }).task
    second.prepareLaunch("wrong-task", other.id, "다른 컨텍스트")
    assert.throws(() => second.startLaunch("wrong-task", "claude-session", "/transcript", 0), /already bound/)
    assert.equal(first.pending(), 0)
  } finally { first.close(); second.close(); repository.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("SessionStart binds selected task and injects context without a network call", () => {
  const directory = mkdtempSync(join(tmpdir(), "work-hook-"))
  const path = join(directory, "outbox.db")
  const transcript = join(directory, "rollout.jsonl")
  const box = new SessionOutbox(path, "https://tasks.example/mcp", "codex-cli-hook")
  try {
    writeFileSync(transcript, "")
    box.prepareLaunch("launch", "task", "이전에 확정한 결정")
    const result = spawnSync(process.execPath, ["scripts/session-hook.ts", "hook"], {
      input: JSON.stringify({ hook_event_name: "SessionStart", session_id: "session", transcript_path: transcript }),
      env: { ...process.env, TASK_AGENT_HOST: "codex", TASK_AGENT_RESOURCE: "https://tasks.example/mcp", TASK_AGENT_OUTBOX: path, TASK_AGENT_LAUNCH: "launch", TASK_AGENT_ACCESS_TOKEN: "" }, timeout: 3000,
    })
    assert.equal(result.status, 0, result.stderr.toString())
    assert.match(JSON.parse(result.stdout.toString()).hookSpecificOutput.additionalContext, /이전에 확정한 결정/)
    assert.equal(box.binding("session")?.transcript, realpathSync(transcript))
    assert.equal(box.binding("session")?.task, "task")
  } finally { box.close(); rmSync(directory, { recursive: true, force: true }) }
})

test("OAuth PKCE, resource binding, persisted refresh and callback replay protection", async () => {
  const directory = mkdtempSync(join(tmpdir(), "work-oauth-"))
  const env = { TASK_AGENT_RESOURCE: "https://tasks.example/mcp", TASK_AGENT_OAUTH_ISSUER: "https://issuer.example/pool", TASK_AGENT_OAUTH_ORIGIN: "https://login.example", TASK_AGENT_OAUTH_CLIENT_ID: "work-client", TASK_AGENT_CREDENTIALS: join(directory, "credentials.db") }
  let provider = new LocalOAuth(env)
  const fetchBefore = globalThis.fetch
  let grant = ""
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.hostname === "tasks.example") return Response.json({ resource: env.TASK_AGENT_RESOURCE, authorization_servers: [env.TASK_AGENT_OAUTH_ISSUER] })
    if (url.hostname === "issuer.example") return Response.json({ issuer: env.TASK_AGENT_OAUTH_ISSUER, authorization_endpoint: "https://login.example/oauth2/authorize", token_endpoint: "https://login.example/oauth2/token", response_types_supported: ["code"], code_challenge_methods_supported: ["S256"], token_endpoint_auth_methods_supported: ["none"] })
    assert.equal(url.href, "https://login.example/oauth2/token")
    const body = new URLSearchParams(String(init?.body))
    grant = body.get("grant_type")!
    assert.equal(body.get("resource"), env.TASK_AGENT_RESOURCE)
    if (grant === "authorization_code") assert.equal(body.get("code_verifier"), provider.codeVerifier())
    else assert.equal(body.get("refresh_token"), "synthetic-refresh")
    return Response.json({ access_token: "synthetic-access", token_type: "Bearer", expires_in: 300, ...(grant === "authorization_code" ? { refresh_token: "synthetic-refresh" } : {}) })
  }
  try {
    let redirect: URL | undefined
    provider.onRedirect = (url) => { redirect = url }
    assert.equal(await auth(provider, { serverUrl: env.TASK_AGENT_RESOURCE, fetchFn: provider.fetch }), "REDIRECT")
    assert.equal(redirect!.searchParams.get("code_challenge_method"), "S256")
    assert.equal(redirect!.searchParams.get("resource"), env.TASK_AGENT_RESOURCE)
    assert.throws(() => provider.authorizationCode(new URL(`${provider.redirectUrl}?state=wrong&code=x`)), /Invalid/)
    const callback = new URL(`${provider.redirectUrl}?state=${provider.state()}&code=synthetic-code`)
    const code = provider.authorizationCode(callback)
    assert.throws(() => provider.authorizationCode(callback), /Invalid/)
    assert.equal(await auth(provider, { serverUrl: env.TASK_AGENT_RESOURCE, authorizationCode: code, fetchFn: provider.fetch }), "AUTHORIZED")
    assert.equal(grant, "authorization_code")
    provider.close()
    provider = new LocalOAuth(env)
    assert.equal(await auth(provider, { serverUrl: env.TASK_AGENT_RESOURCE, fetchFn: provider.fetch }), "AUTHORIZED")
    assert.equal(grant, "refresh_token")
    assert.equal(provider.tokens()?.refresh_token, "synthetic-refresh")
    assert.equal(statSync(env.TASK_AGENT_CREDENTIALS).mode & 0o777, 0o600)
    await assert.rejects(provider.fetch("https://attacker.example/token"), /Untrusted/)
    await assert.rejects(provider.validateResourceURL(env.TASK_AGENT_RESOURCE, "https://other.example/mcp"), /Unexpected/)
    assert.throws(() => new LocalOAuth({ ...env, TASK_AGENT_OAUTH_CLIENT_ID: "other-client" }), /another connection/)
    provider.invalidateCredentials("tokens")
    assert.equal(provider.tokens(), undefined)
  } finally { globalThis.fetch = fetchBefore; provider.close(); rmSync(directory, { recursive: true, force: true }) }
})
