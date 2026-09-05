import test from "node:test"
import assert from "node:assert/strict"
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from "jose"
import { OwnerAuthenticator, AccessError } from "../packages/task-auth/src/index.ts"
import { TaskGraphStore } from "#task-store"

export async function authFixture() {
  const { privateKey, publicKey } = await generateKeyPair("RS256")
  const config = { resource: "https://tasks.example.com/mcp", issuer: "https://issuer.example.com", jwksUri: "https://issuer.example.com/jwks", ownerSubject: "owner", clientIds: ["chatgpt", "claude"], readScope: "tasks/read", writeScope: "tasks/write" }
  const key = createLocalJWKSet({ keys: [await exportJWK(publicKey)] })
  const auth = new OwnerAuthenticator(config, key)
  async function token(claims: Record<string, unknown> = {}) {
    return "Bearer " + await new SignJWT({ sub: "owner", client_id: "chatgpt", token_use: "access", scope: "tasks/read tasks/write", ...claims })
      .setProtectedHeader({ alg: "RS256" }).setIssuer(config.issuer).setAudience(config.resource).setIssuedAt().setExpirationTime("5m").sign(privateKey)
  }
  return { config, auth, token, privateKey, key }
}

test("remote auth rejects missing, forged, wrong-owner, wrong-client and ID tokens", async () => {
  const { auth, token } = await authFixture()
  assert.equal((await auth.authenticate(await token())).subject, "owner")
  for (const bearer of [undefined, "Bearer forged", await token({ sub: "stranger" }), await token({ client_id: "unapproved" }), await token({ token_use: "id" })]) {
    await assert.rejects(auth.authenticate(bearer), AccessError)
  }
  assert.equal((await auth.authenticate(await token({ scope: "tasks/read" }))).scopes.has("tasks/write"), false)
})

test("remote auth rejects wrong audience, issuer, expiration, and revoked tokens", async () => {
  const { config, auth, privateKey, key, token } = await authFixture()
  for (const override of [{ aud: "https://other.example.com" }, { iss: "https://other.example.com" }, { exp: 1 }, { iat: 1 }]) {
    const jwt = await new SignJWT({ sub: "owner", client_id: "chatgpt", token_use: "access", iss: config.issuer, aud: config.resource, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60, ...override }).setProtectedHeader({ alg: "RS256" }).sign(privateKey)
    await assert.rejects(auth.authenticate(`Bearer ${jwt}`), AccessError)
  }
  const revoked = new OwnerAuthenticator({ ...config, revokedBefore: Math.floor(Date.now() / 1000) + 1 }, key)
  await assert.rejects(revoked.authenticate(await token()), AccessError)
})

test("remote databases cannot be reassigned to another account", () => {
  const store = new TaskGraphStore()
  try {
    store.bindOwner("issuer", "owner")
    store.bindOwner("issuer", "owner")
    assert.throws(() => store.bindOwner("issuer", "stranger"), /another owner/)
    assert.throws(() => store.bindOwner("other-issuer", "owner"), /another owner/)
  } finally { store.close() }
})
