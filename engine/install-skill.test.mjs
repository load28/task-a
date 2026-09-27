import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { installSkill } from './install-skill.mjs'
test('install carries the pinned interview and visual runtime, backs up existing role, and preserves user metadata', () => {
 const home = mkdtempSync(join(tmpdir(), 'task-agent-install-'))
 let result
 try {
  mkdirSync(join(home, 'agents'), { recursive: true }); writeFileSync(join(home, 'agents/task-agent.toml'), 'prior-role')
  mkdirSync(join(home, 'skills/task-agent/agents'), { recursive: true }); writeFileSync(join(home, 'skills/task-agent/agents/openai.yaml'), 'user-metadata')
  result = installSkill(home)
  assert.equal(readFileSync(join(result.backup, 'task-agent.toml'), 'utf8'), 'prior-role')
  assert.equal(readFileSync(join(result.skill, 'agents/openai.yaml'), 'utf8'), 'user-metadata')
  const vendor = join(result.skill, 'upstream/superpowers'), lock = JSON.parse(readFileSync(join(vendor, 'upstream.lock.json')))
  for (const [file, hash] of Object.entries(lock.files)) assert.equal(createHash('sha256').update(readFileSync(join(vendor, file))).digest('hex'), hash)
  assert.ok(statSync(join(vendor, 'skills/brainstorming/scripts/start-server.sh')).mode & 0o100)
  assert.ok(existsSync(join(result.skill, 'references/discovery.md')))
  assert.equal(existsSync(join(result.skill, 'scripts/task-agent.test.mjs')), false)
  const context = spawnSync(process.execPath, [join(result.skill, 'scripts/task-agent.mjs'), '--context', '--project', home], { encoding: 'utf8' })
  assert.equal(context.status, 0, context.stderr); assert.equal(JSON.parse(context.stdout).engine, 'ax-source')
 } finally { rmSync(home, { recursive: true, force: true }); if (result) rmSync(result.backup, { recursive: true, force: true }) }
})
