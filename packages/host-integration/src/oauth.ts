import { DatabaseSync } from "node:sqlite"
import { chmodSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { randomBytes } from "node:crypto"
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js"
import type { OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js"

export class LoginRequiredError extends Error {}

/** Private Task Agent credentials only; never uses Codex or Claude credential stores. */
export class LocalOAuth implements OAuthClientProvider {
  private db: DatabaseSync
  private verifier = ""
  private nonce = randomBytes(32).toString("base64url")
  private callbackUsed = false
  readonly resource: string
  readonly issuer: string
  readonly origin: string
  readonly clientId: string
  readonly redirectUrl = "http://localhost:8765/callback"
  onRedirect?: (url: URL) => void
  constructor(env: NodeJS.ProcessEnv = process.env) {
    const required = (key: string) => { const value = env[key]; if (!value) throw new Error(`Missing ${key}; configure Task Agent login`); return value }
    this.resource = required("TASK_AGENT_RESOURCE")
    this.issuer = required("TASK_AGENT_OAUTH_ISSUER")
    this.origin = required("TASK_AGENT_OAUTH_ORIGIN")
    this.clientId = required("TASK_AGENT_OAUTH_CLIENT_ID")
    for (const value of [this.resource, this.issuer, this.origin]) {
      const url = new URL(value)
      if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) throw new Error("OAuth URLs must be trusted HTTPS URLs")
    }
    if (new URL(this.origin).origin !== this.origin) throw new Error("OAuth origin must contain only scheme and host")
    const path = resolve(required("TASK_AGENT_CREDENTIALS"))
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    this.db = new DatabaseSync(path)
    chmodSync(path, 0o600)
    this.db.exec("PRAGMA busy_timeout=1000; CREATE TABLE IF NOT EXISTS credentials (id INTEGER PRIMARY KEY, identity TEXT NOT NULL, tokens TEXT)")
    const identity = JSON.stringify([this.resource, this.issuer, this.origin, this.clientId])
    this.db.prepare("INSERT OR IGNORE INTO credentials VALUES (1, ?, NULL)").run(identity)
    if (this.db.prepare("SELECT identity FROM credentials WHERE id=1").get()?.identity !== identity) { this.db.close(); throw new Error("Credential file belongs to another connection") }
  }
  close() { this.db.close() }
  get clientMetadata() { return { redirect_uris: [this.redirectUrl], token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], scope: `openid ${this.resource}/read ${this.resource}/write` } }
  clientInformation() { return { client_id: this.clientId } }
  state() { return this.nonce }
  authorizationCode(url: URL) {
    if (this.callbackUsed || url.pathname !== "/callback" || url.searchParams.get("state") !== this.nonce || url.searchParams.has("error") || !url.searchParams.get("code")) throw new Error("Invalid authorization callback")
    this.callbackUsed = true
    return url.searchParams.get("code")!
  }
  tokens(): OAuthTokens | undefined {
    const raw = this.db.prepare("SELECT tokens FROM credentials WHERE id=1").get()?.tokens
    return typeof raw === "string" ? JSON.parse(raw) : undefined
  }
  saveTokens(tokens: OAuthTokens) {
    const previous = this.tokens()
    this.db.prepare("UPDATE credentials SET tokens=? WHERE id=1").run(JSON.stringify({ ...tokens, refresh_token: tokens.refresh_token ?? previous?.refresh_token }))
  }
  invalidateCredentials(scope: string) { if (["all", "tokens"].includes(scope)) this.db.exec("UPDATE credentials SET tokens=NULL WHERE id=1"); this.verifier = "" }
  saveCodeVerifier(value: string) { this.verifier = value }
  codeVerifier() { if (!this.verifier) throw new Error("No active login"); return this.verifier }
  redirectToAuthorization(url: URL) {
    if (url.origin !== this.origin) throw new Error("Unexpected authorization origin")
    if (!this.onRedirect) throw new LoginRequiredError("Task Agent authentication required")
    this.onRedirect(url)
  }
  async validateResourceURL(_server: string | URL, resource?: string) {
    if (resource && resource !== this.resource) throw new Error("Unexpected OAuth resource")
    return new URL(this.resource)
  }
  fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (![new URL(this.resource).origin, new URL(this.issuer).origin, this.origin].includes(url.origin)) throw new Error("Untrusted authentication endpoint")
    const response = await globalThis.fetch(input, { ...init, redirect: "error", signal: init?.signal ?? AbortSignal.timeout(15000) })
    if (response.ok && url.pathname.includes(".well-known")) {
      const metadata = await response.clone().json() as Record<string, any>
      if (metadata.issuer && metadata.issuer !== this.issuer) throw new Error("Unexpected OAuth issuer")
      if (metadata.authorization_servers && (!Array.isArray(metadata.authorization_servers) || metadata.authorization_servers.some((issuer: unknown) => issuer !== this.issuer))) throw new Error("Unexpected authorization server")
    }
    return response
  }
}
