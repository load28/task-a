import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskGraphStore } from "#task-store"
import { TaskAgentService } from "#task-agent-core"
import { ClaudeCliExecutor, Orchestrator, seedDefaultRoles, type OrchestratorOptions, type TaskExecutor } from "#task-orchestrator"

export interface RuntimeOptions {
  database?: string
  executor?: TaskExecutor
  orchestrator?: OrchestratorOptions
}

export function createRuntime(options: RuntimeOptions = {}) {
  const root = fileURLToPath(new URL("../../../", import.meta.url))
  const selected = options.database ?? process.env.TASK_AGENT_DB ?? "data/tasks.db"
  const database = selected === ":memory:" ? selected : resolve(root, selected)
  const store = new TaskGraphStore(database)
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const agent = new TaskAgentService(engine, integration)
  seedDefaultRoles(store)
  const executor = options.executor ?? new ClaudeCliExecutor()
  const defaults: OrchestratorOptions = {
    workspace: process.env.TASK_AGENT_WORKSPACE ?? process.cwd(),
    verifyCommand: process.env.TASK_AGENT_VERIFY_COMMAND,
    ...options.orchestrator,
  }
  agent.attachOrchestrator({
    run: async (request) => {
      const orchestrator = new Orchestrator(agent, engine, executor, {
        ...defaults,
        concurrency: request.concurrency ?? defaults.concurrency,
        maxAttemptsPerTask: request.maxAttemptsPerTask ?? defaults.maxAttemptsPerTask,
        maxDepth: request.maxDepth ?? defaults.maxDepth,
        maxRuns: request.maxRuns ?? defaults.maxRuns,
        maxIterations: request.maxIterations ?? defaults.maxIterations,
        autoIntegration: request.autoIntegration ?? defaults.autoIntegration,
      })
      return orchestrator.run(request.taskId)
    },
  })
  return {
    store,
    engine,
    integration,
    agent,
    executor,
    orchestratorOptions: defaults,
    close: () => store.close(),
  }
}
