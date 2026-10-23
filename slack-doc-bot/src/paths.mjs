export function isInside(path, root) {
  return root === '' || path === root || path.startsWith(`${root}/`)
}

export function validateProposal(proposal, channel) {
  const problems = []
  if (!proposal || !Array.isArray(proposal.changes) || proposal.changes.length === 0) {
    return ['변경할 파일이 없습니다']
  }
  if (!proposal.title?.trim()) problems.push('PR 제목이 비어 있습니다')
  const seen = new Set()
  for (const change of proposal.changes) {
    const path = change.path ?? ''
    const segments = path.split('/')
    if (path.startsWith('/') || segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
      problems.push(`잘못된 경로입니다: ${path}`)
    } else if (!isInside(path, channel.docsPath)) {
      problems.push(`문서 경로(${channel.docsPath}) 밖의 파일입니다: ${path}`)
    }
    if (seen.has(path)) problems.push(`같은 파일이 두 번 나옵니다: ${path}`)
    seen.add(path)
    if (change.action === 'write' && typeof change.content !== 'string') problems.push(`내용이 없습니다: ${path}`)
  }
  return problems
}
