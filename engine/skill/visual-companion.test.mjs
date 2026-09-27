import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { once } from 'node:events'
test('upstream companion serves local choices and rejects requests without the session key', { timeout: 15000 }, async () => {
 const dir = await mkdtemp(join(tmpdir(), 'task-agent-visual-'))
 const child = spawn(process.execPath, [new URL('./upstream/superpowers/skills/brainstorming/scripts/server.cjs', import.meta.url).pathname], { env: { ...process.env, BRAINSTORM_DIR: dir, BRAINSTORM_HOST: '127.0.0.1', BRAINSTORM_PORT: '', SUPERPOWERS_DISABLE_TELEMETRY: '1', BRAINSTORM_OPEN: '' }, stdio: ['ignore', 'pipe', 'pipe'] })
 const closed = once(child, 'exit'); const lines = createInterface({ input: child.stdout })
 let stderr = ''; child.stderr.on('data', value => stderr += value)
 try {
  const info = await new Promise((resolve, reject) => {
   const timer = setTimeout(() => reject(Error('Companion did not start: ' + stderr)), 7000)
   lines.on('line', line => { try { const value = JSON.parse(line); if (value.type === 'server-started') { clearTimeout(timer); resolve(value) } } catch {} })
   child.once('error', error => { clearTimeout(timer); reject(error) })
   child.once('exit', code => { clearTimeout(timer); reject(Error(`Companion exited ${code}: ${stderr}`)) })
  })
  assert.ok(info.url)
  const url = new URL(info.url)
  const unauthenticated = await fetch(url.origin)
  assert.equal(unauthenticated.status, 403)
  await writeFile(join(info.screen_dir, 'options.html'), '<h2>방향 선택</h2><p>인터뷰 화면</p>')
  const authorized = await fetch(url)
  assert.equal(authorized.status, 200)
  const cookie = authorized.headers.get('set-cookie').split(';')[0]
  const screen = await fetch(url.origin, { headers: { cookie } })
  assert.equal(screen.status, 200); assert.match(await screen.text(), /인터뷰 화면/)
 } finally { child.kill('SIGTERM'); await closed; lines.close(); await rm(dir, { recursive: true, force: true }) }
})
