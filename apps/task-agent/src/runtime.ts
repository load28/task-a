import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { TaskEngine } from "#task-engine"
import { SqliteTaskRepository } from "#task-store"
import { TaskAgentService, type TaskReasoner } from "#task-agent-core"

export function createRuntime(options: { database?: string; reasoner?: TaskReasoner } = {}) {
  const root = fileURLToPath(new URL("../../../", import.meta.url))
  const selected = options.database ?? process.env.TASK_AGENT_DB ?? "data/tasks.db"
  const database = selected === ":memory:" ? selected : resolve(root, selected)
  const repository = new SqliteTaskRepository(database)
  const engine = new TaskEngine(repository)
  const agent = new TaskAgentService(engine, options.reasoner)
  return { repository, engine, agent, close: () => repository.close() }
}
