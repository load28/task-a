import { validateProposal } from './paths.mjs'

export const ACCEPT_ACTION = 'doc_proposal_accept'
export const DISMISS_ACTION = 'doc_proposal_dismiss'
const SECTION_LIMIT = 2900

function clip(text) {
  return text.length > SECTION_LIMIT ? `${text.slice(0, SECTION_LIMIT)}…` : text
}

function section(text) {
  return { type: 'section', text: { type: 'mrkdwn', text: clip(text) } }
}

function describeChanges(proposal) {
  return proposal.changes.map(change => `• \`${change.path}\` ${change.action === 'delete' ? '삭제' : '작성'}`).join('\n')
}

export function proposalBlocks({ id, reply, proposal, requester }) {
  return [
    section(reply),
    section(`*문서 변경 제안: ${proposal.title}*\n${proposal.summary}\n${describeChanges(proposal)}`),
    { type: 'context', elements: [{ type: 'mrkdwn', text: `<@${requester}>님이 합의하면 PR을 만듭니다.` }] },
    {
      type: 'actions',
      block_id: 'doc_proposal',
      elements: [
        { type: 'button', action_id: ACCEPT_ACTION, style: 'primary', value: id, text: { type: 'plain_text', text: '합의하고 PR 만들기' } },
        { type: 'button', action_id: DISMISS_ACTION, value: id, text: { type: 'plain_text', text: '보류' } },
      ],
    },
  ]
}

function settledBlocks({ reply, proposal }, status) {
  return [
    section(reply),
    section(`*문서 변경 제안: ${proposal.title}*\n${proposal.summary}\n${describeChanges(proposal)}`),
    { type: 'context', elements: [{ type: 'mrkdwn', text: status }] },
  ]
}

export function pullRequestBody({ proposal, requester, permalink }) {
  return [
    '## 요약',
    proposal.summary,
    '',
    '## 변경 파일',
    ...proposal.changes.map(change => `- \`${change.path}\` (${change.action === 'delete' ? '삭제' : '작성'})`),
    '',
    '## 합의 경위',
    `- 요청자 Slack ID: ${requester}`,
    `- 논의 스레드: ${permalink}`,
  ].join('\n')
}

export function stripMentions(text, botUserId) {
  return text.replaceAll(`<@${botUserId}>`, '').trim()
}

export function createHandlers({ channels, docs, brain, proposals, botUserId, watchCooldownMs, watchHistoryLimit, now = Date.now, logger = console }) {
  const lastIntervention = new Map()

  async function postInThread(client, channel, threadTs, text, blocks) {
    return client.chat.postMessage({ channel, thread_ts: threadTs, text: clip(text), ...(blocks ? { blocks } : {}) })
  }

  async function handleMention({ event, client }) {
    const threadTs = event.thread_ts ?? event.ts
    const channel = channels.get(event.channel)
    if (!channel) {
      await postInThread(client, event.channel, threadTs, '이 채널은 프로젝트 문서와 연결되어 있지 않습니다.')
      return
    }
    try {
      const snapshot = await docs.load(channel)
      const message = { user: event.user, ts: event.ts, text: stripMentions(event.text ?? '', botUserId) }
      const result = await brain.consult({ threadKey: `${event.channel}:${threadTs}`, docs: snapshot, message })
      if (result.decision !== 'propose') {
        await postInThread(client, event.channel, threadTs, result.reply)
        return
      }
      const problems = validateProposal(result.proposal, channel)
      if (problems.length > 0) {
        await postInThread(client, event.channel, threadTs, `${result.reply}\n\n제안을 PR로 만들 수 없습니다.\n${problems.map(problem => `• ${problem}`).join('\n')}`)
        return
      }
      const id = proposals.add({ channelId: event.channel, threadTs, requester: event.user, reply: result.reply, proposal: result.proposal })
      await postInThread(client, event.channel, threadTs, `${result.reply}\n\n문서 변경 제안: ${result.proposal.title}`, proposalBlocks({ id, reply: result.reply, proposal: result.proposal, requester: event.user }))
    } catch (error) {
      logger.error(error)
      await postInThread(client, event.channel, threadTs, `요청을 처리하지 못했습니다: ${error.message}`)
    }
  }

  async function recentMessages(client, event) {
    const response = event.thread_ts
      ? await client.conversations.replies({ channel: event.channel, ts: event.thread_ts, limit: watchHistoryLimit })
      : await client.conversations.history({ channel: event.channel, latest: event.ts, inclusive: false, limit: watchHistoryLimit })
    const messages = (response.messages ?? []).filter(message => message.ts !== event.ts && message.text)
    const ordered = event.thread_ts ? messages : messages.reverse()
    return ordered.map(message => ({ user: message.user ?? message.bot_id ?? 'unknown', ts: message.ts, text: message.text }))
  }

  async function handleMessage({ event, client }) {
    if (event.subtype || event.bot_id || !event.text || !event.user) return
    const channel = channels.get(event.channel)
    if (!channel?.watch) return
    if (event.text.includes(`<@${botUserId}>`)) return
    if (event.thread_ts && brain.hasThread(`${event.channel}:${event.thread_ts}`)) return
    const last = lastIntervention.get(event.channel)
    if (last !== undefined && now() - last < watchCooldownMs) return
    try {
      const snapshot = await docs.load(channel)
      const recent = await recentMessages(client, event)
      const result = await brain.watch({ docs: snapshot, recent, message: { user: event.user, ts: event.ts, text: event.text } })
      if (result.action === 'none' || !result.reply.trim()) return
      lastIntervention.set(event.channel, now())
      await postInThread(client, event.channel, event.thread_ts ?? event.ts, result.reply)
    } catch (error) {
      logger.error(error)
    }
  }

  async function handleAccept({ body, client }) {
    const id = body.actions[0].value
    const userId = body.user.id
    const channelId = body.channel.id
    const entry = proposals.get(id)
    if (!entry) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: '이미 처리되었거나 만료된 제안입니다. 봇을 다시 멘션해 주세요.' })
      return
    }
    if (entry.requester !== userId) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: `요청자(<@${entry.requester}>)만 합의할 수 있습니다. 의견은 스레드에서 봇을 멘션해 남겨 주세요.` })
      return
    }
    proposals.take(id)
    const channel = channels.get(entry.channelId)
    await client.chat.update({ channel: channelId, ts: body.message.ts, text: '합의됨 — PR을 만드는 중입니다.', blocks: settledBlocks(entry, `<@${userId}>님이 합의했습니다. PR을 만드는 중입니다.`) })
    try {
      const { permalink } = await client.chat.getPermalink({ channel: entry.channelId, message_ts: entry.threadTs })
      const pull = await docs.openPullRequest(channel, entry.proposal, {
        branchName: `doc-bot/${entry.threadTs.replace('.', '-')}-${id}-${now().toString(36)}`,
        body: pullRequestBody({ proposal: entry.proposal, requester: entry.requester, permalink }),
      })
      const link = `<${pull.html_url}|#${pull.number} ${entry.proposal.title}>`
      await client.chat.update({ channel: channelId, ts: body.message.ts, text: `PR을 만들었습니다: ${pull.html_url}`, blocks: settledBlocks(entry, `<@${userId}>님이 합의했습니다. PR: ${link}`) })
      await client.chat.postMessage({ channel: entry.channelId, text: `:memo: 문서 변경 PR이 열렸습니다 — ${link}\n<@${entry.requester}>님과 봇이 합의한 내용입니다. 검토 후 승인해 주세요. 논의: ${permalink}` })
    } catch (error) {
      logger.error(error)
      proposals.restore(entry)
      await client.chat.update({ channel: channelId, ts: body.message.ts, text: 'PR 생성에 실패했습니다.', blocks: proposalBlocks(entry) })
      await postInThread(client, entry.channelId, entry.threadTs, `PR을 만들지 못했습니다: ${error.message}`)
    }
  }

  async function handleDismiss({ body, client }) {
    const id = body.actions[0].value
    const userId = body.user.id
    const channelId = body.channel.id
    const entry = proposals.get(id)
    if (!entry) return
    if (entry.requester !== userId) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: `요청자(<@${entry.requester}>)만 보류할 수 있습니다.` })
      return
    }
    proposals.take(id)
    await client.chat.update({ channel: channelId, ts: body.message.ts, text: '보류된 제안입니다.', blocks: settledBlocks(entry, `<@${userId}>님이 보류했습니다.`) })
  }

  return { handleMention, handleMessage, handleAccept, handleDismiss }
}

export function registerHandlers(app, handlers) {
  app.event('app_mention', handlers.handleMention)
  app.event('message', handlers.handleMessage)
  app.action(ACCEPT_ACTION, async args => {
    await args.ack()
    await handlers.handleAccept(args)
  })
  app.action(DISMISS_ACTION, async args => {
    await args.ack()
    await handlers.handleDismiss(args)
  })
}
