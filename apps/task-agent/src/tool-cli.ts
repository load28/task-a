import { createRuntime } from "./runtime.ts"

const operation = process.argv[2]
const input = process.argv[3] ? JSON.parse(process.argv[3]) : {}
const runtime = createRuntime()

try {
  let result: unknown
  switch (operation) {
    case "search_task": result = runtime.engine.searchTasks(input.query, input.limit); break
    case "get_task": result = runtime.engine.getTask(input.taskId); break
    case "create_task": result = runtime.engine.createTask(input); break
    case "update_task": result = runtime.engine.updateTask(input.taskId, { title: input.title, objective: input.objective }, input.source); break
    case "append_event": result = runtime.engine.appendEvent(input); break
    case "link_artifact": result = runtime.engine.linkArtifact(input); break
    case "complete_task": result = runtime.engine.completeTask(input.taskId, input.content, input.source); break
    case "link_task": result = runtime.engine.addRelation(input.fromTaskId, input.toTaskId, input.type); break
    default: throw new Error(`Unknown Task Tool operation: ${operation}`)
  }
  process.stdout.write(JSON.stringify(result))
} finally {
  runtime.close()
}
