import test from 'node:test'
import assert from 'node:assert/strict'
import { ACCEPT_ACTION, DISMISS_ACTION, createHandlers, registerHandlers, stripMentions } from '../src/bot.mjs'
import { createProposalStore } from '../src/proposals.mjs'

const channel = { channelId: 'C1', owner: 'o', repo: 'r', branch: 'main', docsPath: 'docs', reviewers: [], watch: true }
const snapshot = { sha: 'h1', channel, files: [], omitted: [], treeTruncated: false }
const proposal = { title: '배포 주기 1주로 변경', summary: '피드백을 빨리 받기 위해', changes: [{ path: 'docs/release.md', action: 'write', content: '1주' }] }
const silentLogger = { error() {} }

function fakeClient() {
  const calls = []
  const record = name => async params => {
    calls.push([name, params])
    if (name === 'chat.getPermalink') return { permalink: 'https://slack/p1' }
    if (name === 'conversations.history') return { messages: [{ ts: '9.0', user: 'U9', text: '최신' }, { ts: '8.0', user: 'U8', text: '이전' }] }
    if (name === 'conversations.replies') return { messages: [{ ts: '5.0', user: 'U5', text: '부모' }, { ts: '5.1', user: 'U1', text: '새 메시지' }] }
    return { ok: true, ts: 'posted' }
  }
  return {
    calls,
    named: name => calls.filter(([callName]) => callName === name).map(([, params]) => params),
    chat: { postMessage: record('chat.postMessage'), update: record('chat.update'), postEphemeral: record('chat.postEphemeral'), getPermalink: record('chat.getPermalink') },
    conversations: { history: record('conversations.history'), replies: record('conversations.replies') },
  }
}

function setup({ consult = { decision: 'answer', reply: '답변' }, watch = { action: 'none', reply: '' }, openPullRequest } = {}) {
  let clock = 1000
  const seen = { consult: [], watch: [], pulls: [] }
  const threads = new Set()
  const brain = {
    consult: async args => { seen.consult.push(args); threads.add(args.threadKey); return typeof consult === 'function' ? consult(args) : consult },
    watch: async args => { seen.watch.push(args); return watch },
    hasThread: key => threads.has(key),
  }
  const docs = {
    load: async () => snapshot,
    openPullRequest: openPullRequest ?? (async (...args) => { seen.pulls.push(args); return { number: 3, html_url: 'https://github.com/o/r/pull/3' } }),
  }
  const proposals = createProposalStore({ ttlMs: 60000, now: () => clock })
  const handlers = createHandlers({ channels: new Map([['C1', channel]]), docs, brain, proposals, botUserId: 'UBOT', watchCooldownMs: 500, watchHistoryLimit: 10, now: () => clock, logger: silentLogger })
  return { handlers, seen, proposals, advance: ms => { clock += ms } }
}

const mention = (text, extra = {}) => ({ type: 'app_mention', channel: 'C1', user: 'U1', ts: '1.0', text: `<@UBOT> ${text}`, ...extra })
const action = (id, user, value) => ({ actions: [{ action_id: id, value }], user: { id: user }, channel: { id: 'C1' }, message: { ts: 'posted' } })

test('mentions are stripped before reaching the model', () => {
  assert.equal(stripMentions('<@UBOT> 배포 주기는?', 'UBOT'), '배포 주기는?')
})

test('mention answers in the thread with the steward reply', async () => {
  const { handlers, seen } = setup()
  const client = fakeClient()
  await handlers.handleMention({ event: mention('배포 주기는?', { thread_ts: '0.5' }), client })
  assert.equal(seen.consult[0].threadKey, 'C1:0.5')
  assert.equal(seen.consult[0].message.text, '배포 주기는?')
  assert.deepEqual(client.named('chat.postMessage'), [{ channel: 'C1', thread_ts: '0.5', text: '답변' }])
})

test('mention in an unconfigured channel is declined', async () => {
  const { handlers, seen } = setup()
  const client = fakeClient()
  await handlers.handleMention({ event: mention('hi', { channel: 'C9' }), client })
  assert.equal(seen.consult.length, 0)
  assert.match(client.named('chat.postMessage')[0].text, /연결되어 있지 않습니다/)
})

test('a valid proposal is posted with accept and dismiss buttons', async () => {
  const { handlers } = setup({ consult: { decision: 'propose', reply: '이렇게 바꾸겠습니다', proposal } })
  const client = fakeClient()
  await handlers.handleMention({ event: mention('반영해줘'), client })
  const posted = client.named('chat.postMessage')[0]
  const buttons = posted.blocks.find(block => block.type === 'actions').elements
  assert.deepEqual(buttons.map(button => button.action_id), [ACCEPT_ACTION, DISMISS_ACTION])
  assert.equal(posted.thread_ts, '1.0')
})

test('a proposal outside the docs path is refused without buttons', async () => {
  const { handlers } = setup({ consult: { decision: 'propose', reply: 'r', proposal: { ...proposal, changes: [{ path: 'src/x.ts', action: 'write', content: 'x' }] } } })
  const client = fakeClient()
  await handlers.handleMention({ event: mention('반영해줘'), client })
  const posted = client.named('chat.postMessage')[0]
  assert.equal(posted.blocks, undefined)
  assert.match(posted.text, /PR로 만들 수 없습니다/)
})

test('model failure is reported in the thread', async () => {
  const { handlers } = setup({ consult: () => { throw new Error('boom') } })
  const client = fakeClient()
  await handlers.handleMention({ event: mention('질문'), client })
  assert.match(client.named('chat.postMessage')[0].text, /boom/)
})

async function proposed(options) {
  const context = setup({ consult: { decision: 'propose', reply: '제안', proposal }, ...options })
  const client = fakeClient()
  await context.handlers.handleMention({ event: mention('반영해줘'), client })
  const id = client.named('chat.postMessage')[0].blocks.find(block => block.type === 'actions').elements[0].value
  return { ...context, client, id }
}

test('only the requester can accept a proposal', async () => {
  const { handlers, client, id, seen } = await proposed()
  await handlers.handleAccept({ body: action(ACCEPT_ACTION, 'U2', id), client })
  assert.equal(seen.pulls.length, 0)
  assert.match(client.named('chat.postEphemeral')[0].text, /요청자/)
})

test('accepting opens a PR and announces it in the channel', async () => {
  const { handlers, client, id, seen } = await proposed()
  await handlers.handleAccept({ body: action(ACCEPT_ACTION, 'U1', id), client })
  const [pullChannel, pullProposal, options] = seen.pulls[0]
  assert.equal(pullChannel, channel)
  assert.equal(pullProposal, proposal)
  assert.match(options.branchName, new RegExp(`^doc-bot/1-0-${id}-`))
  assert.match(options.body, /https:\/\/slack\/p1/)
  const announcement = client.named('chat.postMessage').at(-1)
  assert.equal(announcement.thread_ts, undefined)
  assert.match(announcement.text, /pull\/3/)
  assert.match(announcement.text, /승인/)
  await handlers.handleAccept({ body: action(ACCEPT_ACTION, 'U1', id), client })
  assert.equal(seen.pulls.length, 1)
  assert.match(client.named('chat.postEphemeral')[0].text, /만료/)
})

test('a failed PR keeps the proposal so it can be retried', async () => {
  let attempts = 0
  const { handlers, client, id } = await proposed({ openPullRequest: async () => { attempts += 1; if (attempts === 1) throw new Error('github down'); return { number: 4, html_url: 'https://github.com/o/r/pull/4' } } })
  await handlers.handleAccept({ body: action(ACCEPT_ACTION, 'U1', id), client })
  assert.match(client.named('chat.postMessage').at(-1).text, /github down/)
  assert.ok(client.named('chat.update').at(-1).blocks.some(block => block.type === 'actions'))
  await handlers.handleAccept({ body: action(ACCEPT_ACTION, 'U1', id), client })
  assert.match(client.named('chat.postMessage').at(-1).text, /pull\/4/)
})

test('the requester can dismiss a proposal', async () => {
  const { handlers, client, id, proposals } = await proposed()
  await handlers.handleDismiss({ body: action(DISMISS_ACTION, 'U2', id), client })
  assert.ok(proposals.get(id))
  await handlers.handleDismiss({ body: action(DISMISS_ACTION, 'U1', id), client })
  assert.equal(proposals.get(id), undefined)
  assert.match(client.named('chat.update').at(-1).text, /보류/)
})

const channelMessage = (extra = {}) => ({ type: 'message', channel: 'C1', user: 'U1', ts: '10.0', text: '인증은 API 키로 갑니다', ...extra })

test('watcher ignores bots, edits, mentions, unwatched channels and steward threads', async () => {
  const { handlers, seen } = setup()
  const client = fakeClient()
  await handlers.handleMention({ event: mention('질문', { ts: '7.0' }), client })
  for (const event of [
    channelMessage({ bot_id: 'B1' }),
    channelMessage({ subtype: 'message_changed' }),
    channelMessage({ text: '<@UBOT> 질문' }),
    channelMessage({ channel: 'C9' }),
    channelMessage({ thread_ts: '7.0' }),
  ]) await handlers.handleMessage({ event, client })
  assert.equal(seen.watch.length, 0)
})

test('watcher intervenes in the thread and then cools down', async () => {
  const { handlers, seen, advance } = setup({ watch: { action: 'conflict', reply: '문서에는 OAuth2로 되어 있습니다 (docs/api.md)' } })
  const client = fakeClient()
  await handlers.handleMessage({ event: channelMessage(), client })
  assert.deepEqual(seen.watch[0].recent.map(message => message.text), ['이전', '최신'])
  assert.deepEqual(client.named('chat.postMessage')[0], { channel: 'C1', thread_ts: '10.0', text: '문서에는 OAuth2로 되어 있습니다 (docs/api.md)' })
  await handlers.handleMessage({ event: channelMessage({ ts: '11.0' }), client })
  assert.equal(seen.watch.length, 1)
  advance(500)
  await handlers.handleMessage({ event: channelMessage({ ts: '12.0', thread_ts: '5.0' }), client })
  assert.equal(seen.watch.length, 2)
  assert.deepEqual(seen.watch[1].recent.map(message => message.text), ['부모', '새 메시지'])
})

test('watcher stays silent when no intervention is needed', async () => {
  const { handlers, seen } = setup()
  const client = fakeClient()
  await handlers.handleMessage({ event: channelMessage(), client })
  await handlers.handleMessage({ event: channelMessage({ ts: '11.0' }), client })
  assert.equal(seen.watch.length, 2)
  assert.equal(client.named('chat.postMessage').length, 0)
})

test('actions are acknowledged before handling', async () => {
  const registered = {}
  const order = []
  const app = { event: (name, fn) => { registered[name] = fn }, action: (name, fn) => { registered[name] = fn } }
  registerHandlers(app, { handleMention() {}, handleMessage() {}, handleAccept: async () => order.push('handle'), handleDismiss() {} })
  await registered[ACCEPT_ACTION]({ ack: async () => order.push('ack') })
  assert.deepEqual(order, ['ack', 'handle'])
  assert.deepEqual(Object.keys(registered).sort(), ['app_mention', DISMISS_ACTION, ACCEPT_ACTION, 'message'].sort())
})
