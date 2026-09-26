import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { StateStore, RevisionConflict } from "./index.ts"

test("command receipt, state, event and outbox are atomic and survive reopening", t => {
  const dir = mkdtempSync(join(tmpdir(), "greenfield-store-")); t.after(() => rmSync(dir, { recursive: true, force: true }))
  let store = new StateStore<{ count: number }>(join(dir, "state.db"))
  const command = { graphId: "g", operationId: "op", expectedRevision: 0, payload: { start: true }, initial: () => ({ count: 0 }) }
  const result = store.command(command, (s, tx) => { s.count++; tx.emit("started", { count: s.count }); tx.enqueue("i", "start", { count: s.count }); return "accepted" })
  assert.deepEqual(result, { revision: 1, result: "accepted" })
  store.close(); store = new StateStore(join(dir, "state.db")); t.after(() => store.close())
  assert.deepEqual(store.command(command, () => { throw new Error("Must not execute twice") }), result)
  assert.equal(store.read("g")?.value.count, 1)
  assert.equal(store.events("g").length, 1)
  assert.equal(store.pending().length, 1)
  assert.throws(() => store.command({ ...command, payload: { start: false } }, () => null), /operation_conflict/)
  assert.throws(() => store.command({ ...command, operationId: "stale" }, () => null), RevisionConflict)
})

test("failed transitions roll back state, events, receipts and backend intent", t => {
  const store = new StateStore<{ count: number }>(":memory:"); t.after(() => store.close())
  const cmd = { graphId: "g", operationId: "x", expectedRevision: 0, payload: {}, initial: () => ({ count: 0 }) }
  assert.throws(() => store.command(cmd, (s, tx) => { s.count++; tx.emit("bad", {}); tx.enqueue("bad", "start", {}); throw new Error("fault") }), /fault/)
  assert.equal(store.read("g"), undefined)
  assert.deepEqual(store.events("g"), [])
  assert.deepEqual(store.pending(), [])
  store.command(cmd, (s, tx) => { tx.enqueue("ok", "start", {}); return s.count })
  assert.equal(store.claim("ok", "a", 100, 1000), true)
  assert.equal(store.claim("ok", "b", 100, 1050), false)
  assert.equal(store.claim("ok", "b", 100, 1100), true)
  store.command({ ...cmd, operationId: "ack", expectedRevision: 1 }, (_s, tx) => { tx.completeIntent("ok"); return null })
  assert.deepEqual(store.pending(), [])
})

test("separate connections reject a stale competing revision and preserve immutable history", t => {
  const dir = mkdtempSync(join(tmpdir(), "greenfield-cas-")); t.after(() => rmSync(dir, { recursive: true, force: true }))
  const a = new StateStore<{ n: number }>(join(dir, "db")), b = new StateStore<{ n: number }>(join(dir, "db"))
  t.after(() => { a.close(); b.close() })
  a.command({ graphId: "g", operationId: "a", expectedRevision: 0, payload: {}, initial: () => ({ n: 1 }) }, () => null)
  assert.throws(() => b.command({ graphId: "g", operationId: "b", expectedRevision: 0, payload: {} }, () => null), RevisionConflict)
  a.putRecord("spec", "x", { n: 1 }); b.putRecord("spec", "x", { n: 1 })
  assert.throws(() => b.putRecord("spec", "x", { n: 2 }), /Immutable/)
  assert.deepEqual(a.record("spec", "x"), { n: 1 })
})
