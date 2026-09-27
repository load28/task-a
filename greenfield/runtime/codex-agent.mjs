// Codex adapter: the CLI owns reasoning and tools; this adapter owns session identity and transport.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, lstatSync, copyFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { startModelBridge } from './model-bridge.mjs'

const [mode, model] = process.argv.slice(2)
if (!['start', 'resume'].includes(mode) || !model || !process.env.TASK_AGENT_SESSION || !process.env.TASK_AGENT_MODEL_BRIDGE) throw new Error('Codex adapter requires mode, model, session and model gateway')
const session = process.env.TASK_AGENT_SESSION
const context = JSON.parse(await new Promise((resolve, reject) => { let data = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', chunk => { data += chunk }); process.stdin.on('end', () => resolve(data)); process.stdin.on('error', reject) }))
const identityPath = join(session, 'session.json')
const previous = mode === 'resume' && existsSync(identityPath) ? JSON.parse(readFileSync(identityPath, 'utf8')) : undefined
if (mode === 'resume' && !/^[a-f0-9-]{36}$/.test(previous?.threadId ?? '')) throw new Error('Explicit Codex session is unavailable; cannot resume')
// Only session transcripts cross the checkpoint boundary. Auth, caches, sockets and path aliases stay in tmpfs.
const home = `/tmp/task-agent-codex-${randomUUID()}`
mkdirSync(home, { recursive: true, mode: 0o700 })
const copySessions = (source, destination) => {
  if (!existsSync(source)) return
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  for (const name of readdirSync(source)) {
    const from = join(source, name), to = join(destination, name), stat = lstatSync(from)
    if (stat.isDirectory()) copySessions(from, to)
    else if (stat.isFile() && name.endsWith('.jsonl')) { const temp = `${to}.tmp`; copyFileSync(from, temp); renameSync(temp, to) }
    else throw new Error('Unexpected entry in Codex session transcripts')
  }
}
copySessions(join(session, 'sessions'), join(home, 'sessions'))
const bridge = await startModelBridge(process.env.TASK_AGENT_MODEL_BRIDGE)
const config = [
  'model_provider="task_agent"',
  'model_providers.task_agent.name="Task Agent host gateway"',
  `model_providers.task_agent.base_url=${JSON.stringify(bridge.url)}`,
  'model_providers.task_agent.wire_api="responses"',
  'model_providers.task_agent.env_key="TASK_AGENT_GATEWAY_TOKEN"',
  'model_providers.task_agent.requires_openai_auth=false',
  'model_providers.task_agent.request_max_retries=0',
  'model_providers.task_agent.stream_max_retries=0',
  'model_providers.task_agent.stream_idle_timeout_ms=200000',
  'web_search="disabled"',
  'approval_policy="never"',
  'sandbox_mode="danger-full-access"',
]
const argv = ['exec', ...(mode === 'resume' ? ['resume', previous.threadId] : []), '--json', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--model', model, ...config.flatMap(value => ['-c', value]), '-']
const child = spawn('codex', argv, { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, CODEX_HOME: home, TASK_AGENT_GATEWAY_TOKEN: 'host-broker-no-secret' } })
const lines = createInterface({ input: child.stdout })
lines.on('line', line => {
  try {
    const event = JSON.parse(line)
    if (event.type === 'thread.started' && /^[a-f0-9-]{36}$/.test(event.thread_id)) {
      const temporary = `${identityPath}.tmp`
      writeFileSync(temporary, JSON.stringify({ threadId: event.thread_id, model }), { mode: 0o600 }); renameSync(temporary, identityPath)
    }
  } catch {}
  process.stdout.write(`${line}\n`)
})
const prompt = `Complete the task described by this execution contract. Read the workspace and choose your own implementation. Inputs are read-only. Write the declared outputs and run the required checks. Do not deploy, publish, send messages, or call external services. Do not modify runner metadata or agent session storage.\n${JSON.stringify(context)}`
child.stdin.on('error', () => {}); child.stdin.end(prompt)
const stop = () => child.kill('SIGTERM')
process.on('SIGTERM', stop); process.on('SIGINT', stop)
let persistenceError
const persist = () => { try { copySessions(join(home, 'sessions'), join(session, 'sessions')) } catch (error) { persistenceError = error; stop() } }
const timer = setInterval(persist, 500)
try {
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve(code ?? (signal ? 143 : 1))) })
  persist()
  if (persistenceError) throw persistenceError
  process.exitCode = code
} finally { clearInterval(timer); lines.close(); bridge.close(); process.off('SIGTERM', stop); process.off('SIGINT', stop) }
