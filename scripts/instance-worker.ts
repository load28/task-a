import { runInstance } from "../packages/task-instances/src/worker.ts"
try {
  process.exitCode = await runInstance(JSON.parse(process.env.TASK_INSTANCE_SPEC ?? "null"), process.env.TASK_INSTANCE_DATA ?? "/data", process.env.TASK_INSTANCE_ID ?? "")
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
