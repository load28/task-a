import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskGraphStore } from "#task-store"
import { TaskAgentService } from "#task-agent-core"

export function createRuntime(options: { database?: string } = {}) {
  const root = fileURLToPath(new URL("../../../", import.meta.url))
  const selected = options.database ?? process.env.TASK_AGENT_DB ?? "data/tasks.db"
  const database = selected === ":memory:" ? selected : resolve(root, selected)
  const store = new TaskGraphStore(database)
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const agent = new TaskAgentService(engine, integration)
  return { store, engine, integration, agent, close: () => store.close() }
}
