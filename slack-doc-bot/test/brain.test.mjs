import test from 'node:test'
import assert from 'node:assert/strict'
import { createBrain, STEWARD_AGENT, WATCHER_AGENT } from '../src/brain.mjs'

const channel = { channelId: 'C1', owner: 'o', repo: 'r', branch: 'main', docsPath: 'docs' }
const docs = sha => ({ sha, channel, files: [{ path: 'docs/a.md', content: 'DOC-BODY' }], omitted: [], treeTruncated: false })
const message = { user: 'U1', ts: '1.0', text: '질문' }

function fakeClient(info = { structured: { decision: 'answer', reply: 'ok' } }) {
  const calls = { create: [], prompt: [], delete: [] }
  let next = 0
  return {
    calls,
    session: {
      create: async params => { calls.create.push(params); return { data: { id: `s${++next}` } } },
      prompt: async params => { calls.prompt.push(params); return { data: { info, parts: [] } } },
      delete: async params => { calls.delete.push(params); return { data: true } },
    },
  }
}

test('consult keeps one session per thread and resends docs only when they change', async () => {
  const client = fakeClient()
  const brain = createBrain({ client, model: { providerID: 'p', modelID: 'm' } })
  assert.deepEqual(await brain.consult({ threadKey: 'C1:1', docs: docs('a'), message }), { decision: 'answer', reply: 'ok' })
  await brain.consult({ threadKey: 'C1:1', docs: docs('a'), message })
  await brain.consult({ threadKey: 'C1:1', docs: docs('b'), message })
  assert.equal(client.calls.create.length, 1)
  assert.equal(brain.hasThread('C1:1'), true)
  const [first, second, third] = client.calls.prompt
  assert.equal(first.agent, STEWARD_AGENT)
  assert.deepEqual(first.model, { providerID: 'p', modelID: 'm' })
  assert.equal(first.format.type, 'json_schema')
  assert.match(first.parts[0].text, /DOC-BODY/)
  assert.doesNotMatch(second.parts[0].text, /DOC-BODY/)
  assert.match(third.parts[0].text, /DOC-BODY/)
})

test('model errors and missing structured output are surfaced', async () => {
  const failing = createBrain({ client: fakeClient({ error: { name: 'StructuredOutputError', data: { message: 'bad', retries: 2 } } }) })
  await assert.rejects(failing.consult({ threadKey: 'k', docs: docs('a'), message }), /StructuredOutputError bad/)
  const empty = createBrain({ client: fakeClient({}) })
  await assert.rejects(empty.consult({ threadKey: 'k', docs: docs('a'), message }), /구조화된 응답/)
})

test('watch uses a throwaway session with the watcher agent', async () => {
  const client = fakeClient({ structured: { action: 'none', reply: '' } })
  const result = await createBrain({ client }).watch({ docs: docs('a'), recent: [{ user: 'U2', ts: '0.5', text: '이전 대화' }], message })
  assert.deepEqual(result, { action: 'none', reply: '' })
  assert.equal(client.calls.prompt[0].agent, WATCHER_AGENT)
  assert.match(client.calls.prompt[0].parts[0].text, /이전 대화/)
  assert.deepEqual(client.calls.delete, [{ sessionID: 's1' }])
})
