import { KubernetesApi, ApiError } from "../packages/task-instances/src/api.ts"
import { reconcile } from "../packages/task-instances/src/controller.ts"
import type { TaskInstance } from "../packages/task-instances/src/types.ts"
const namespace = process.env.TASK_INSTANCE_NAMESPACE
if (!namespace) throw new Error("TASK_INSTANCE_NAMESPACE is required")
const api = new KubernetesApi(namespace)
const maxWorkers = Number(process.env.TASK_INSTANCE_MAX_WORKERS ?? 3)
if (!Number.isInteger(maxWorkers) || maxWorkers < 1) throw new Error("Invalid TASK_INSTANCE_MAX_WORKERS")
let stopped = false
process.once("SIGTERM", () => { stopped = true })
process.once("SIGINT", () => { stopped = true })
while (!stopped) {
  try {
    for (const resource of await api.list("taskinstances")) {
      if (stopped) break
      try { await reconcile(api, resource as TaskInstance, maxWorkers) }
      catch (error) {
        // Resource-version conflicts are retried using a fresh read on the next pass.
        if (!(error instanceof ApiError && [404, 409].includes(error.code)))
          process.stderr.write(`${resource.metadata.name}: ${error instanceof Error ? error.message : String(error)}\n`)
      }
    }
  } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`) }
  await new Promise(ok => setTimeout(ok, 1000))
}
