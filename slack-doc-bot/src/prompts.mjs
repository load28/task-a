function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

export function renderDocs(docs) {
  const { channel } = docs
  const header = `<project-docs repo="${escapeAttribute(`${channel.owner}/${channel.repo}`)}" branch="${escapeAttribute(channel.branch)}" path="${escapeAttribute(channel.docsPath)}" sha="${docs.sha}">`
  const files = docs.files.map(file => `<file path="${escapeAttribute(file.path)}">\n${file.content}\n</file>`)
  const omitted = docs.omitted.length > 0 || docs.treeTruncated
    ? [`<omitted reason="크기 제한">${docs.omitted.map(escapeAttribute).join(', ')}${docs.treeTruncated ? ' (저장소 트리 일부 누락)' : ''}</omitted>`]
    : []
  return [header, ...files, ...omitted, '</project-docs>'].join('\n')
}

export function renderMessage(message) {
  return `<slack-message user="${escapeAttribute(message.user)}" ts="${escapeAttribute(message.ts)}">\n${message.text}\n</slack-message>`
}

export function renderConsultPrompt({ docs, message }) {
  const parts = []
  if (docs) parts.push('현재 프로젝트 문서 스냅샷입니다. 이전 스냅샷이 있었다면 이것으로 대체합니다.', renderDocs(docs))
  parts.push('스레드의 새 요청입니다.', renderMessage(message))
  return parts.join('\n\n')
}

export function renderWatchPrompt({ docs, recent, message }) {
  return [
    renderDocs(docs),
    '최근 채널 대화입니다.',
    `<slack-history>\n${recent.map(renderMessage).join('\n')}\n</slack-history>`,
    '판단할 새 메시지입니다.',
    renderMessage(message),
  ].join('\n\n')
}
