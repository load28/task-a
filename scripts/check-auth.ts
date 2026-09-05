import assert from "node:assert/strict"

// Public discovery only; does not transmit a token or sign in a user.
const resource = process.env.TASK_AGENT_RESOURCE
const issuer = process.env.TASK_AGENT_ISSUER
assert.ok(resource && issuer, "TASK_AGENT_RESOURCE and TASK_AGENT_ISSUER are required")
for (const value of [resource, issuer]) assert.equal(new URL(value).protocol, "https:")
const response = await fetch(`${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(10000), redirect: "error" })
assert.ok(response.ok)
const metadata = await response.json()
assert.equal(metadata.issuer, issuer)
assert.ok(metadata.code_challenge_methods_supported?.includes("S256"), "Issuer must advertise S256 for ChatGPT; do not bypass this check")
assert.ok(metadata.response_types_supported?.includes("code"))
for (const key of ["authorization_endpoint", "token_endpoint", "jwks_uri"]) assert.equal(new URL(metadata[key]).protocol, "https:")
const remote = await fetch(new URL("/.well-known/oauth-protected-resource/mcp", resource), { signal: AbortSignal.timeout(10000), redirect: "error" })
assert.ok(remote.ok)
const protectedResource = await remote.json()
assert.equal(protectedResource.resource, resource)
assert.ok(protectedResource.authorization_servers.includes(issuer))
console.log("PASS: Public OAuth discovery and PKCE metadata. Interactive login, audience binding and refresh still require client testing.")
