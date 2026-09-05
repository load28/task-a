import { resolve } from "node:path"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskAgentService } from "#task-agent-core"
import { seedDefaultRoles } from "../../../packages/task-orchestrator/src/roles.ts"

/** Deterministic graph runtime. No model, executor, or orchestration loop. */
export function createGraphRuntime(database = process.env.TASK_AGENT_DB ?? "data/tasks-v2.db") {
  const store = new TaskGraphStore(database === ":memory:" ? database : resolve(database))
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const agent = new TaskAgentService(engine, integration)
  seedDefaultRoles(store)
  return { store, engine, integration, agent, close: () => store.close() }
}
