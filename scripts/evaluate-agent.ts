import assert from "node:assert/strict"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { launchHost } from "../packages/opencode-harness/src/host.ts"
import { OpenCodeReasoner } from "#opencode-harness"
import { TaskAgentService } from "#task-agent-core"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"

// Opt-in live-model evaluation. Only synthetic data and an isolated database.
const directory = mkdtempSync(join(tmpdir(), "task-agent-eval-"))
const database = join(directory, "tasks.db")
const store = new SqliteTaskRepository(database)
const engine = new TaskEngine(store)
const host = await launchHost({ database })
const agent = new TaskAgentService(engine, new OpenCodeReasoner(host.client))
console.log(`Evaluation database: ${database}`)
try {
  await agent.run({ instruction: 'Create exactly one persistent task titled "컴파일러 평가 작업" with objective "정규화 단계 분리와 회귀 테스트". Use create_task. Do not create or modify any other tasks.' })
  const tasks = engine.searchTasks("컴파일러 평가 작업")
  assert.equal(tasks.length, 1, "Agent must actually create the requested task")
  const taskId = tasks[0]!.id
  console.log("PASS: Agent tool call created the task")

  const proposal = await agent.sync({ taskId, conversation: "사용자: 정규화 단계를 따로 두는 것도 괜찮을 것 같은데? 아직 결정하지 말고 후보로만 생각해 봐.", idempotencyKey: "proposal" })
  assert.equal(proposal.appended.length, 0, "A tentative proposal must not become persistent state")
  console.log("PASS: Tentative proposal was not persisted")

  await agent.sync({
    taskId, idempotencyKey: "confirmation",
    conversation: "사용자: 정규화 단계를 독립 단계로 분리하기로 확정하자. 기존 TypeScript 호환성은 반드시 유지해야 해. 다음 할 일은 회귀 테스트 추가야. 이 세 내용을 작업에 기록해.",
  })
  const confirmed = engine.getTask(taskId)
  assert.equal(confirmed.snapshot.activeDecisions.length, 1)
  assert.equal(confirmed.snapshot.constraints.length, 1)
  assert.equal(confirmed.snapshot.nextActions.length, 1)
  console.log("PASS: Confirmed decision, constraint and next action persisted")

  await agent.sync({ taskId, idempotencyKey: "completion", conversation: "에이전트: 회귀 테스트 추가를 완료했습니다. 테스트 실행 결과 12개가 모두 통과했습니다. 기존 TypeScript 호환성 제약은 유지합니다." })
  const nextHost = new TaskAgentService(engine)
  const handoff = await nextHost.handoff({ taskId, targetAgent: "another-host" })
  assert.equal(handoff.context.nextActions.length, 0, "Completed action must disappear from continuation context")
  assert.equal(handoff.context.constraints.length, 1)
  assert.equal(handoff.context.importantDecisions.length, 1)
  assert.ok(handoff.context.recentProgress.length > 0)
  console.log("PASS: Another Host can resume with current state")
} finally {
  host.close()
  store.close()
}
