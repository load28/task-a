import test from "node:test"
import assert from "node:assert/strict"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { compileTaskContext } from "#task-context"

function setup() {
  const repository = new SqliteTaskRepository()
  return { repository, engine: new TaskEngine(repository) }
}

test("event history deterministically projects the current snapshot", () => {
  const { repository, engine } = setup()
  try {
    const created = engine.createTask({ title: "RL match inference", objective: "Build structural pattern inference", status: "active" })
    const taskId = created.task.id
    const first = engine.appendEvent({ taskId, type: "decision", content: "Keep normalization in checker" }).events.at(-1)!
    engine.appendEvent({ taskId, type: "decision", content: "Separate pattern normalization", metadata: { supersedes: first.id } })
    const blocker = engine.appendEvent({ taskId, type: "blocker", content: "Checker API is unknown" }).events.at(-1)!
    engine.appendEvent({ taskId, type: "blocker_resolved", content: "Checker API verified", metadata: { resolves: blocker.id } })
    engine.appendEvent({ taskId, type: "constraint", content: "Do not patch individual cases" })
    engine.appendEvent({ taskId, type: "progress", content: "AST analysis completed" })

    const record = engine.getTask(taskId)
    assert.deepEqual(record.snapshot.activeDecisions, ["Separate pattern normalization"])
    assert.deepEqual(record.snapshot.blockers, [])
    assert.deepEqual(record.snapshot.constraints, ["Do not patch individual cases"])
    assert.equal(record.snapshot.currentState, "AST analysis completed")
    assert.equal(record.events.length, 7)
  } finally {
    repository.close()
  }
})

test("artifacts and completion are persisted and compiled by mode", () => {
  const { repository, engine } = setup()
  try {
    const taskId = engine.createTask({ title: "Compiler", objective: "Improve inference" }).task.id
    engine.linkArtifact({ taskId, type: "file", uri: "src/checker.ts", description: "Main checker" })
    engine.completeTask(taskId)

    const context = compileTaskContext(engine.getTask(taskId), "implementation")
    assert.equal(context.task.status, "completed")
    assert.deepEqual(context.artifacts, [{ type: "file", uri: "src/checker.ts", description: "Main checker" }])
  } finally {
    repository.close()
  }
})

test("search escapes LIKE wildcard characters", () => {
  const { repository, engine } = setup()
  try {
    engine.createTask({ title: "100% coverage", objective: "Test exact wildcard handling" })
    engine.createTask({ title: "Unrelated", objective: "Nothing" })
    assert.equal(engine.searchTasks("100%").length, 1)
    assert.equal(engine.searchTasks("100% 작업을 이어가자").length, 1)
  } finally {
    repository.close()
  }
})

test("task hierarchy and explicit relations remain outside the task payload", () => {
  const { repository, engine } = setup()
  try {
    const parent = engine.createTask({ title: "Compiler", objective: "Improve compiler" }).task
    const child = engine.createTask({ title: "Inference", objective: "Improve inference", parentTaskId: parent.id }).task
    const qa = engine.createTask({ title: "QA", objective: "Verify inference" }).task
    engine.addRelation(qa.id, child.id, "depends_on")
    const relations = engine.getRelations(child.id)
    assert.equal(relations.length, 2)
    assert.deepEqual(relations.map((item) => item.type).sort(), ["depends_on", "parent"])
  } finally {
    repository.close()
  }
})
