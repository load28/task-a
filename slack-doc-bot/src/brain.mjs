import { CONSULT_SCHEMA, WATCH_SCHEMA } from './schemas.mjs'
import { renderConsultPrompt, renderWatchPrompt } from './prompts.mjs'

export const STEWARD_AGENT = 'doc-steward'
export const WATCHER_AGENT = 'doc-watcher'

function unwrap({ data, error }, action) {
  if (error) throw new Error(`OpenCode ${action} 실패: ${JSON.stringify(error)}`)
  return data
}

export function createBrain({ client, model }) {
  const threads = new Map()

  async function createSession(title) {
    return unwrap(await client.session.create({ title }), '세션 생성').id
  }

  async function ask(sessionID, agent, text, schema) {
    const data = unwrap(await client.session.prompt({
      sessionID,
      agent,
      model,
      format: { type: 'json_schema', schema },
      parts: [{ type: 'text', text }],
    }), '요청')
    const { info } = data
    if (info.error) throw new Error(`OpenCode 응답 오류: ${info.error.name} ${info.error.data?.message ?? ''}`.trim())
    const result = info.structured ?? info.structured_output
    if (result === undefined || result === null) throw new Error('OpenCode가 구조화된 응답을 돌려주지 않았습니다')
    return result
  }

  async function consult({ threadKey, docs, message }) {
    let thread = threads.get(threadKey)
    if (!thread) {
      thread = { sessionID: await createSession(`slack ${threadKey}`), docsSha: null }
      threads.set(threadKey, thread)
    }
    const text = renderConsultPrompt({ docs: thread.docsSha === docs.sha ? null : docs, message })
    const result = await ask(thread.sessionID, STEWARD_AGENT, text, CONSULT_SCHEMA)
    thread.docsSha = docs.sha
    return result
  }

  async function watch({ docs, recent, message }) {
    const sessionID = await createSession(`watch ${docs.channel.channelId} ${message.ts}`)
    try {
      return await ask(sessionID, WATCHER_AGENT, renderWatchPrompt({ docs, recent, message }), WATCH_SCHEMA)
    } finally {
      await client.session.delete({ sessionID })
    }
  }

  return { consult, watch, hasThread: threadKey => threads.has(threadKey) }
}
