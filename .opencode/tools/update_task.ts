import { tool } from "@opencode-ai/plugin"
import { callEngine, source } from "../lib/bridge.ts"

export default tool({
  description: "Update task title or objective while preserving an audit event.",
  args: {
    taskId: tool.schema.string(),
    title: tool.schema.string().optional(),
    objective: tool.schema.string().optional(),
  },
  async execute({ taskId, ...changes }, context) {
    return callEngine(context, "update_task", { taskId, ...changes, source: source(context) })
  },
})
