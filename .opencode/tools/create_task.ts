import { tool } from "@opencode-ai/plugin"
import { callEngine, source } from "../lib/bridge.ts"

export default tool({
  description: "Create a persistent task only when a distinct durable work item is needed.",
  args: {
    title: tool.schema.string(),
    objective: tool.schema.string(),
    status: tool.schema.enum(["planned", "active", "blocked", "completed", "cancelled"]).optional(),
    parentTaskId: tool.schema.string().optional(),
  },
  async execute(args, context) {
    return callEngine(context, "create_task", { ...args, source: source(context) })
  },
})
