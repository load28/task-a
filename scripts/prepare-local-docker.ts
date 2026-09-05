import { randomBytes, randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const directory = process.env.TASK_AGENT_LOCAL_OUTPUT ? resolve(process.env.TASK_AGENT_LOCAL_OUTPUT) : join(root, "data/local-docker")
mkdirSync(directory, { recursive: true, mode: 0o700 })
const statePath = join(directory, "settings.json")
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : { owner: randomUUID(), stranger: randomUUID(), password: randomBytes(24).toString("base64url"), strangerPassword: randomBytes(24).toString("base64url"), dbPassword: randomBytes(24).toString("base64url") }
const save = (path: string, value: string) => writeFileSync(join(directory, path), value, { mode: 0o600 })
save("settings.json", JSON.stringify(state, null, 2))
save(".env", `IDENTITY_DB_PASSWORD=${state.dbPassword}\n`)
save("login.txt", `Local test account only\nUsername: owner\nPassword: ${state.password}\n`)
const resource = "https://localhost:8443/mcp"
const issuer = "https://localhost:8443/realms/task-agent"
const clientId = "task-agent-work"
const mapper = (name: string, value: string) => ({ name, protocol: "openid-connect", protocolMapper: "oidc-hardcoded-claim-mapper", config: { "claim.name": name, "claim.value": value, "jsonType.label": "String", "access.token.claim": "true", "id.token.claim": "false", "userinfo.token.claim": "false" } })
const subjectMapper = { name: "subject", protocol: "openid-connect", protocolMapper: "oidc-sub-mapper", config: { "access.token.claim": "true" } }
save("realm.json", JSON.stringify({
  realm: "task-agent", enabled: true, registrationAllowed: false, resetPasswordAllowed: false, sslRequired: "all", accessTokenLifespan: 300,
  clientScopes: ["read", "write"].map((scope) => ({ name: `${resource}/${scope}`, protocol: "openid-connect", attributes: { "include.in.token.scope": "true" } })),
clients: [{ clientId, enabled: true, publicClient: true, standardFlowEnabled: true, directAccessGrantsEnabled: false, redirectUris: ["http://localhost:8765/callback"], attributes: { "pkce.code.challenge.method": "S256" }, defaultClientScopes: [], optionalClientScopes: [`${resource}/read`, `${resource}/write`], protocolMappers: [subjectMapper, mapper("token_use", "access"), mapper("client_id", clientId), { name: "task-resource", protocol: "openid-connect", protocolMapper: "oidc-audience-mapper", config: { "included.custom.audience": resource, "access.token.claim": "true", "id.token.claim": "false" } }] }],
  users: [{ id: state.owner, username: "owner", enabled: true, emailVerified: true, firstName: "Local", lastName: "Owner", email: "owner@example.invalid", credentials: [{ type: "password", value: state.password, temporary: false }] }, { id: state.stranger, username: "stranger", enabled: true, emailVerified: true, firstName: "Local", lastName: "Stranger", email: "stranger@example.invalid", credentials: [{ type: "password", value: state.strangerPassword, temporary: false }] }],
}, null, 2))
if (!existsSync(join(directory, "agent.env"))) save("agent.env", `TASK_AGENT_RESOURCE=${resource}\nTASK_AGENT_ISSUER=${issuer}\nTASK_AGENT_JWKS_URI=https://proxy:8443/realms/task-agent/protocol/openid-connect/certs\nTASK_AGENT_OWNER_SUBJECT=${state.owner}\nTASK_AGENT_CLIENT_IDS=${clientId}\nTASK_AGENT_READ_SCOPE=${resource}/read\nTASK_AGENT_WRITE_SCOPE=${resource}/write\n`)
save("smoke-connection.json", JSON.stringify({ TASK_AGENT_RESOURCE: resource, TASK_AGENT_OAUTH_ISSUER: issuer, TASK_AGENT_OAUTH_ORIGIN: "https://localhost:8443", TASK_AGENT_OAUTH_CLIENT_ID: clientId }, null, 2))
console.log(`Local Docker settings prepared: ${directory}\nExisting database identity and agent.env preserved. Credentials were not printed.\nConnect MCP hosts directly to ${resource} with OAuth client ${clientId}.`)
