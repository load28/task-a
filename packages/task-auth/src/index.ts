import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose"

export interface AuthConfig {
  resource: string
  issuer: string
  jwksUri: string
  ownerSubject: string
  clientIds: string[]
  readScope: string
  writeScope: string
  revokedBefore?: number
}

export interface Principal { subject: string; scopes: Set<string> }
export class AccessError extends Error {
  status: number
  constructor(status: number) { super(status === 401 ? "Authentication required" : "Access denied"); this.status = status }
}

export class OwnerAuthenticator {
  readonly config: AuthConfig
  private key: JWTVerifyGetKey
  constructor(config: AuthConfig, key?: JWTVerifyGetKey) {
    for (const value of [config.resource, config.issuer, config.jwksUri]) {
      const url = new URL(value)
      if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search) throw new Error("Auth URLs must be canonical HTTPS URLs")
    }
    if (!config.ownerSubject.trim() || !config.clientIds.length || config.clientIds.some((id) => !id.trim())) throw new Error("Owner subject and allowed OAuth client IDs are required")
    if (!config.readScope.trim() || !config.writeScope.trim() || config.readScope === config.writeScope) throw new Error("Distinct read and write scopes are required")
    if (config.revokedBefore !== undefined && (!Number.isFinite(config.revokedBefore) || config.revokedBefore < 0)) throw new Error("Invalid revocation timestamp")
    this.config = config
    this.key = key ?? createRemoteJWKSet(new URL(config.jwksUri), { timeoutDuration: 5000 })
  }

  async authenticate(header?: string): Promise<Principal> {
    if (!header?.startsWith("Bearer ") || header.length > 16384) throw new AccessError(401)
    let payload
    try {
      ;({ payload } = await jwtVerify(header.slice(7), this.key, {
        issuer: this.config.issuer, audience: this.config.resource, algorithms: ["RS256"],
        requiredClaims: ["sub", "exp", "iat", "client_id", "token_use"],
        maxTokenAge: "15m", clockTolerance: 5,
      }))
    } catch { throw new AccessError(401) }
    if (payload.token_use !== "access" || !this.config.clientIds.includes(String(payload.client_id))) throw new AccessError(401)
    if (payload.iat! <= (this.config.revokedBefore ?? 0)) throw new AccessError(401)
    if (payload.sub !== this.config.ownerSubject) throw new AccessError(403)
    return { subject: payload.sub, scopes: new Set(typeof payload.scope === "string" ? payload.scope.split(" ") : []) }
  }

  metadata() {
    return { resource: this.config.resource, authorization_servers: [this.config.issuer], scopes_supported: [this.config.readScope, this.config.writeScope], bearer_methods_supported: ["header"] }
  }
  challenge(scope = this.config.readScope) {
    return `Bearer resource_metadata="${new URL("/.well-known/oauth-protected-resource/mcp", this.config.resource)}", scope="${scope}"`
  }
}
