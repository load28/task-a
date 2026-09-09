import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { RelayStore } from "../packages/host-integration/src/relay-store.ts"

test("요청의 전달 경계가 재전송·재시작·다른 세션에 영향을 받지 않고 유지된다", () => {
  const root = mkdtempSync(join(tmpdir(), "relay-turns-")), path = join(root, "relay.db")
  let store = new RelayStore(path)
  const enqueue = (id: string, sessionID = "session") => {
    const r = store.enqueue({ id, host: "codex", sessionId: "host", workspace: root, kind: "UserPromptSubmit", text: id })
    r.sessionID = sessionID; r.messageID = `message-${id}`; r.phase = "sending"
    store.registerTurn(r); store.save(r)
    return r
  }
  try {
    const first = enqueue("first")
    store.registerTurn(first)
    enqueue("foreign", "other-session")
    assert.equal(store.binding(first).endMessageID, undefined)
    const continued = { ...first, messageID: "message-continued" }
    store.registerTurn(continued); store.save(continued)
    assert.equal(store.binding(first).endMessageID, continued.messageID)
    const next = enqueue("next")
    assert.equal(store.binding(continued).endMessageID, next.messageID)
    assert.equal(store.binding(next).endMessageID, undefined)
    store.close(); store = new RelayStore(path)
    assert.equal(store.binding(first).endMessageID, continued.messageID)
    assert.equal(store.binding(store.get("first")!).endMessageID, next.messageID)
    assert.equal(store.db.prepare("SELECT COUNT(*) AS n FROM relay_turns").get()!.n, 4)
  } finally { store.close(); rmSync(root, { recursive: true, force: true }) }
})

test("기존 설치의 전송된 요청 경계를 데이터 손실 없이 이전한다", () => {
  const root = mkdtempSync(join(tmpdir(), "relay-turn-migration-")), path = join(root, "relay.db")
  let store = new RelayStore(path)
  try {
    for (const id of ["first", "next"]) {
      const r = store.enqueue({ id, host: "codex", sessionId: "host", workspace: root, kind: "UserPromptSubmit", text: id })
      r.sessionID = "session"; r.messageID = `message-${id}`; r.phase = "interrupted"; store.save(r)
    }
    store.close(); store = new RelayStore(path)
    assert.equal(store.binding(store.get("first")!).endMessageID, "message-next")
    assert.equal(store.get("first")!.phase, "interrupted")
  } finally { store.close(); rmSync(root, { recursive: true, force: true }) }
})
