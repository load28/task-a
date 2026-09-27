import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const root = new URL('./skill/upstream/superpowers/', import.meta.url)
const lock = JSON.parse(await readFile(new URL('upstream.lock.json', root), 'utf8'))
if (Object.keys(lock.modifications).length) throw Error('Superpowers must remain unmodified; keep adaptations in discovery.md')
for (const [path, expected] of Object.entries(lock.files)) {
 const actual = createHash('sha256').update(await readFile(new URL(path, root))).digest('hex')
 if (actual !== expected) throw Error(`Unrecorded Superpowers change: ${path}`)
}
console.log(JSON.stringify({ commit: lock.commit, unchanged: Object.keys(lock.files).length }))
