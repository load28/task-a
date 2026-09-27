#!/usr/bin/env node
// AX supervises this command. Substrate injects auth at egress; no credential file is present.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs'
const [model, goal, ...extra] = process.argv.slice(2)
if (!model || !goal || extra.length) throw Error('Usage: task-agent-codex MODEL GOAL')
const execution = process.env.TASK_AGENT_EXECUTION_ID
if (!execution) throw Error('AX execution identity is required')
const permit = '/workspace/work/.task-agent/activation'
for (;;) {
 if (existsSync(permit) && readFileSync(permit, 'utf8') === execution) break
 await new Promise(resolve => setTimeout(resolve, 200))
}
// A DATA resume can restore the pre-command golden state. Keep completed work idle.
if (existsSync('/workspace/work/.task-agent/result.json')) {
 const completed = JSON.parse(readFileSync('/workspace/work/.task-agent/result.json', 'utf8'))
 if (completed.task === execution) await new Promise(() => { setInterval(() => {}, 60000) })
}
const home = '/workspace/.task-agent/codex', identity = `${home}/session.json`
mkdirSync(home, { recursive: true, mode: 0o700 })
let previous
if (existsSync(identity)) {
  previous = JSON.parse(readFileSync(identity, 'utf8'))
  if (!/^[a-f0-9-]{36}$/.test(previous.threadId ?? '') || previous.model !== model) throw Error('Incompatible Codex session')
}
const settings = [
 'model_provider="substrate"',
 'model_providers.substrate.name="Substrate authenticated egress"',
 'model_providers.substrate.base_url="https://chatgpt.com/backend-api/codex"',
 'model_providers.substrate.wire_api="responses"',
 'model_providers.substrate.requires_openai_auth=false',
 'model_providers.substrate.request_max_retries=0',
 'model_providers.substrate.stream_max_retries=0',
 'web_search="disabled"', 'approval_policy="never"', 'sandbox_mode="danger-full-access"',
]
const args = ['exec', ...(previous ? ['resume', previous.threadId] : []), '--json', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--model', model, ...settings.flatMap(x => ['-c', x]), '-']
const child = spawn('codex', args, { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, CODEX_HOME: home } })
const lines = createInterface({ input: child.stdout })
lines.on('line', line => {
 try {
  const event = JSON.parse(line)
  if (event.type === 'thread.started' && /^[a-f0-9-]{36}$/.test(event.thread_id)) {
   if (previous && previous.threadId !== event.thread_id) { child.kill('SIGTERM'); throw Error('Unexpected resumed thread') }
   writeFileSync(`${identity}.tmp`, JSON.stringify({ threadId: event.thread_id, model }), { mode: 0o600 }); renameSync(`${identity}.tmp`, identity)
  }
 } catch (error) { if (error.message === 'Unexpected resumed thread') process.exitCode = 1 }
 process.stdout.write(line + '\n')
})
child.stdin.on('error', () => {})
child.stdin.end(goal)
const stop = () => child.kill('SIGTERM')
process.on('SIGTERM', stop); process.on('SIGINT', stop)
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('close', (code, signal) => { process.exitCode ||= code ?? (signal ? 143 : 1); lines.close(); process.off('SIGTERM', stop); process.off('SIGINT', stop) })
