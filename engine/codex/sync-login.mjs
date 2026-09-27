// Current login -> Substrate credential provider. Never copy auth into an actor.
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
const [kubeconfig, context, namespace] = process.argv.slice(2)
if (!kubeconfig || !context || !/^[a-z][a-z0-9-]*$/.test(namespace ?? '')) throw Error('Usage: sync-login.mjs KUBECONFIG CONTEXT NAMESPACE')
const auth = JSON.parse(readFileSync(join(process.env.CODEX_HOME ?? join(process.env.HOME, '.codex'), 'auth.json'), 'utf8'))
const { access_token: access, account_id: account } = auth.tokens ?? {}
if (auth.auth_mode !== 'chatgpt' || !access || !account) throw Error('A current ChatGPT login in auth.json is required')
const payload = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString())
if (!payload.exp || payload.exp * 1000 < Date.now() + 60000) throw Error('Login token expired; refresh through Codex before syncing')
const secret = { apiVersion: 'v1', kind: 'Secret', metadata: { name: 'task-agent-codex', namespace }, type: 'Opaque', data: { 'access-token': Buffer.from(access).toString('base64'), 'account-id': Buffer.from(account).toString('base64') } }
// server-side apply avoids storing the secret again in a last-applied annotation.
const result = spawnSync('kubectl', ['--kubeconfig', kubeconfig, '--context', context, 'apply', '--server-side', '--field-manager=task-agent-login', '-f', '-'], { input: JSON.stringify(secret), encoding: 'utf8' })
if (result.error || result.status !== 0) throw Error('Credential sync failed; no credential or kubectl diagnostic is printed')
console.log(JSON.stringify({ synced: true, namespace, name: 'task-agent-codex', expiresAt: new Date(payload.exp * 1000).toISOString() }))
