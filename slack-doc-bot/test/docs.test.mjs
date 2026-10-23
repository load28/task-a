import test from 'node:test'
import assert from 'node:assert/strict'
import { createDocRepository } from '../src/docs.mjs'

const channel = { channelId: 'C1', owner: 'o', repo: 'r', branch: 'main', docsPath: 'docs', reviewers: ['rev'], watch: true }
const encode = text => ({ content: Buffer.from(text).toString('base64'), encoding: 'base64' })

function fakeOctokit({ head = 'h1', blobs = { b1: 'alpha', b2: 'beta', b3: 'gamma' } } = {}) {
  const calls = []
  const record = (name, result) => async params => {
    calls.push([name, params])
    return { data: typeof result === 'function' ? result(params) : result }
  }
  const state = { head }
  return {
    calls,
    state,
    rest: {
      git: {
        getRef: record('getRef', () => ({ object: { sha: state.head } })),
        getTree: record('getTree', { truncated: false, tree: [
          { type: 'blob', path: 'docs/b.md', sha: 'b2' },
          { type: 'blob', path: 'docs/a.md', sha: 'b1' },
          { type: 'blob', path: 'docs/c.md', sha: 'b3' },
          { type: 'blob', path: 'docs/img.png', sha: 'x' },
          { type: 'blob', path: 'src/a.md', sha: 'y' },
          { type: 'tree', path: 'docs', sha: 'z' },
        ] }),
        getBlob: record('getBlob', ({ file_sha }) => encode(blobs[file_sha])),
        getCommit: record('getCommit', { tree: { sha: 'base-tree' } }),
        createTree: record('createTree', { sha: 'new-tree' }),
        createCommit: record('createCommit', { sha: 'new-commit' }),
        createRef: record('createRef', {}),
      },
      pulls: {
        create: record('create', { number: 7, html_url: 'https://github.com/o/r/pull/7' }),
        requestReviewers: record('requestReviewers', {}),
      },
    },
  }
}

test('load reads only doc files under the docs path, sorted, within the size limit', async () => {
  const octokit = fakeOctokit()
  const snapshot = await createDocRepository({ octokit, maxChars: 8 }).load(channel)
  assert.equal(snapshot.sha, 'h1')
  assert.deepEqual(snapshot.files, [{ path: 'docs/a.md', content: 'alpha' }])
  assert.deepEqual(snapshot.omitted, ['docs/b.md', 'docs/c.md'])
})

test('load reuses the snapshot until the branch head moves', async () => {
  const octokit = fakeOctokit()
  const docs = createDocRepository({ octokit, maxChars: 1000 })
  await docs.load(channel)
  await docs.load(channel)
  assert.equal(octokit.calls.filter(([name]) => name === 'getTree').length, 1)
  octokit.state.head = 'h2'
  assert.equal((await docs.load(channel)).sha, 'h2')
  assert.equal(octokit.calls.filter(([name]) => name === 'getTree').length, 2)
})

test('openPullRequest commits all changes on a new branch and requests reviewers', async () => {
  const octokit = fakeOctokit()
  const proposal = { title: '배포 주기 변경', summary: 's', changes: [{ path: 'docs/a.md', action: 'write', content: 'new' }, { path: 'docs/b.md', action: 'delete' }] }
  const pull = await createDocRepository({ octokit, maxChars: 1000 }).openPullRequest(channel, proposal, { branchName: 'doc-bot/x', body: 'body' })
  assert.equal(pull.number, 7)
  const byName = Object.fromEntries(octokit.calls.map(([name, params]) => [name, params]))
  assert.deepEqual(byName.createTree.tree, [
    { path: 'docs/a.md', mode: '100644', type: 'blob', content: 'new' },
    { path: 'docs/b.md', mode: '100644', type: 'blob', sha: null },
  ])
  assert.equal(byName.createTree.base_tree, 'base-tree')
  assert.deepEqual(byName.createCommit.parents, ['h1'])
  assert.equal(byName.createRef.ref, 'refs/heads/doc-bot/x')
  assert.deepEqual([byName.create.head, byName.create.base, byName.create.body], ['doc-bot/x', 'main', 'body'])
  assert.deepEqual(byName.requestReviewers.reviewers, ['rev'])
})
