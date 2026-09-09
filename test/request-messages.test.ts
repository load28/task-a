import test from "node:test"
import assert from "node:assert/strict"
import { requestMessages } from "../packages/opencode-harness/src/request-messages.ts"

function user(id: string, created: number, parts: any[] = [{ type: "text", text: "요청" }]): any {
  return { info: { id, role: "user", time: { created } }, parts }
}
function answer(id: string, parentID: string, created: number, extra = {}): any {
  return { info: { id, parentID, role: "assistant", time: { created, completed: created + 1 }, finish: "tool-calls", ...extra }, parts: [{ type: "text", text: id }] }
}
const compact = (id: string, created: number) => user(id, created, [{ type: "compaction", auto: true }])
const continuation = (id: string, created: number) => user(id, created, [{ type: "text", synthetic: true, metadata: { compaction_continue: true }, text: "계속" }])

test("압축 이후의 복구·완료 기록을 원래 요청에 연결하고 요약은 제외한다", () => {
  const messages = [user("host-request", 1), answer("sleep", "host-request", 2), compact("compact", 3),
    answer("summary", "compact", 4, { summary: true, finish: "stop" }), continuation("continue", 5),
    answer("repair", "continue", 6), compact("compact-again", 7),
    answer("summary-again", "compact-again", 8, { summary: true, finish: "stop" }), continuation("continue-again", 9),
    answer("verified", "continue-again", 10, { finish: "stop" })]
  assert.deepEqual(requestMessages(messages.reverse(), "host-request").map(m => m.info.id), ["sleep", "repair", "verified"])
})

test("다음 실제 사용자 요청과 그 압축 결과를 이전 요청에 섞지 않는다", () => {
  const messages = [user("request", 1), answer("work", "request", 2), compact("compact", 3),
    answer("summary", "compact", 4, { summary: true, finish: "stop" }),
    user("other-request", 5), answer("other-result", "other-request", 6), compact("other-compact", 7),
    answer("other-summary", "other-compact", 8, { summary: true, finish: "stop" }), continuation("other-continue", 9),
    answer("other-verified", "other-continue", 10, { finish: "stop" })]
  assert.deepEqual(requestMessages(messages, "request", "other-request").map(m => m.info.id), ["work"])
  assert.deepEqual(requestMessages(messages, "missing"), [])
})

test("압축 완료만으로 작업을 완료 처리하지 않으며 압축 실패는 보존한다", () => {
  const messages = [user("request", 1), answer("work", "request", 2), compact("compact", 3),
    answer("summary", "compact", 4, { summary: true, finish: "stop" })]
  assert.deepEqual(requestMessages(messages, "request").map(m => m.info.id), ["work"])
  messages[3].info.error = { name: "ContextOverflowError", data: { message: "압축 실패" } }
  assert.equal((requestMessages(messages, "request").at(-1)!.info as any).error.name, "ContextOverflowError")
})

test("압축 표지가 바뀌거나 overflow가 사용자 메시지를 재생해도 전달 경계 안에서는 계속 추적한다", () => {
  const messages = [user("request", 1), answer("work", "request", 2), compact("compact", 3),
    answer("summary", "compact", 4, { summary: true, finish: "stop" }),
    user("other", 5, [{ type: "text", synthetic: true, text: "계속" }]), answer("other-result", "other", 6)]
  assert.deepEqual(requestMessages(messages, "request").map(m => m.info.id), ["work", "other-result"])
  assert.deepEqual(requestMessages(messages, "request", "other").map(m => m.info.id), ["work"])
  assert.deepEqual(requestMessages(messages, "request", "unavailable-boundary"), [])
})
