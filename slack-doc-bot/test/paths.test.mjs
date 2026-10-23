import test from 'node:test'
import assert from 'node:assert/strict'
import { isInside, validateProposal } from '../src/paths.mjs'

const channel = { docsPath: 'docs' }

test('paths inside the docs root are accepted', () => {
  assert.equal(isInside('docs/a.md', 'docs'), true)
  assert.equal(isInside('docsx/a.md', 'docs'), false)
  assert.equal(isInside('anything.md', ''), true)
  assert.deepEqual(validateProposal({ title: 't', summary: 's', changes: [{ path: 'docs/a.md', action: 'write', content: 'x' }, { path: 'docs/b.md', action: 'delete' }] }, channel), [])
})

test('unsafe or outside paths are rejected', () => {
  const problems = validateProposal({ title: 't', summary: 's', changes: [
    { path: 'src/a.md', action: 'write', content: 'x' },
    { path: 'docs/../src/a.md', action: 'write', content: 'x' },
    { path: '/docs/a.md', action: 'write', content: 'x' },
    { path: 'docs/c.md', action: 'write' },
  ] }, channel)
  assert.equal(problems.length, 4)
})

test('empty or duplicated changes are rejected', () => {
  assert.deepEqual(validateProposal({ title: 't', changes: [] }, channel), ['변경할 파일이 없습니다'])
  assert.match(validateProposal({ title: 't', changes: [{ path: 'docs/a.md', action: 'delete' }, { path: 'docs/a.md', action: 'delete' }] }, channel)[0], /두 번/)
})
