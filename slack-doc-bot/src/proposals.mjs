import { randomUUID } from 'node:crypto'

export function createProposalStore({ ttlMs, now = Date.now }) {
  const pending = new Map()

  function sweep() {
    for (const [id, entry] of pending) {
      if (now() - entry.createdAt > ttlMs) pending.delete(id)
    }
  }

  return {
    add(entry) {
      sweep()
      const id = randomUUID().slice(0, 8)
      pending.set(id, { ...entry, id, createdAt: now() })
      return id
    },
    get(id) {
      sweep()
      return pending.get(id)
    },
    take(id) {
      sweep()
      const entry = pending.get(id)
      pending.delete(id)
      return entry
    },
    restore(entry) {
      pending.set(entry.id, entry)
    },
  }
}
