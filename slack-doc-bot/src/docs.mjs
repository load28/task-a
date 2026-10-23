import { isInside } from './paths.mjs'

const DOC_FILE = /\.(md|mdx|markdown|txt|ya?ml|json)$/i

export function createDocRepository({ octokit, maxChars }) {
  const cache = new Map()

  async function headSha(channel) {
    const { data } = await octokit.rest.git.getRef({ owner: channel.owner, repo: channel.repo, ref: `heads/${channel.branch}` })
    return data.object.sha
  }

  async function load(channel) {
    const sha = await headSha(channel)
    const key = `${channel.owner}/${channel.repo}:${channel.branch}:${channel.docsPath}`
    const cached = cache.get(key)
    if (cached?.sha === sha) return cached
    const { data: tree } = await octokit.rest.git.getTree({ owner: channel.owner, repo: channel.repo, tree_sha: sha, recursive: 'true' })
    const entries = tree.tree
      .filter(entry => entry.type === 'blob' && isInside(entry.path, channel.docsPath) && DOC_FILE.test(entry.path))
      .sort((a, b) => a.path.localeCompare(b.path))
    const files = []
    const omitted = []
    let total = 0
    for (const entry of entries) {
      if (total >= maxChars) {
        omitted.push(entry.path)
        continue
      }
      const { data: blob } = await octokit.rest.git.getBlob({ owner: channel.owner, repo: channel.repo, file_sha: entry.sha })
      const content = Buffer.from(blob.content, blob.encoding).toString('utf8')
      if (total + content.length > maxChars) {
        omitted.push(entry.path)
        continue
      }
      total += content.length
      files.push({ path: entry.path, content })
    }
    const snapshot = { sha, channel, files, omitted, treeTruncated: Boolean(tree.truncated) }
    cache.set(key, snapshot)
    return snapshot
  }

  async function openPullRequest(channel, proposal, { branchName, body }) {
    const owner = channel.owner
    const repo = channel.repo
    const base = await headSha(channel)
    const { data: baseCommit } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: base })
    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: proposal.changes.map(change =>
        change.action === 'delete'
          ? { path: change.path, mode: '100644', type: 'blob', sha: null }
          : { path: change.path, mode: '100644', type: 'blob', content: change.content }),
    })
    const { data: commit } = await octokit.rest.git.createCommit({ owner, repo, message: proposal.title, tree: tree.sha, parents: [base] })
    await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha: commit.sha })
    const { data: pull } = await octokit.rest.pulls.create({ owner, repo, title: proposal.title, head: branchName, base: channel.branch, body })
    if (channel.reviewers.length > 0) {
      await octokit.rest.pulls.requestReviewers({ owner, repo, pull_number: pull.number, reviewers: channel.reviewers })
    }
    return pull
  }

  return { load, openPullRequest }
}
