import test from 'node:test'
import assert from 'node:assert/strict'
import { loadConfig, parseChannels } from '../src/config.mjs'

test('channels are normalized with defaults', () => {
  const channels = parseChannels(JSON.stringify({ C1: { owner: 'o', repo: 'r', docsPath: '/docs/' } }))
  assert.deepEqual(channels.get('C1'), { channelId: 'C1', owner: 'o', repo: 'r', branch: 'main', docsPath: 'docs', reviewers: [], watch: true })
})

test('channel without docsPath is rejected', () => {
  assert.throws(() => parseChannels(JSON.stringify({ C1: { owner: 'o', repo: 'r' } })), /docsPath/)
})

test('config reads env, model and numeric options', () => {
  const env = { SLACK_BOT_TOKEN: 'b', SLACK_APP_TOKEN: 'a', GITHUB_TOKEN: 'g', OPENCODE_MODEL: 'anthropic/claude-x', WATCH_COOLDOWN_SECONDS: '5' }
  const config = loadConfig(env, () => '{}')
  assert.deepEqual(config.model, { providerID: 'anthropic', modelID: 'claude-x' })
  assert.equal(config.watchCooldownMs, 5000)
  assert.equal(config.opencodeUrl, 'http://127.0.0.1:4096')
  assert.throws(() => loadConfig({ ...env, OPENCODE_MODEL: 'nomodel' }, () => '{}'), /provider\/model/)
  assert.throws(() => loadConfig({ ...env, GITHUB_TOKEN: '' }, () => '{}'), /GITHUB_TOKEN/)
})
