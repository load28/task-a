import { tool } from "@opencode-ai/plugin"
import { callEngine, source } from "../lib/bridge.ts"

export default tool({
  description: "Append a confirmed durable event to a task. Do not store tentative ideas or conversation noise.",
  args: {
    taskId: tool.schema.string(),
    type: tool.schema.enum(["decision", "progress", "finding", "constraint", "constraint_removed", "blocker", "blocker_resolved", "next_action", "next_action_completed", "status"]),
    content: tool.schema.string(),
    metadata: tool.schema.record(tool.schema.string(), tool.schema.unknown()).optional(),
  },
  async execute(args, context) {
    return callEngine(context, "append_event", { ...args, source: source(context) })
  },
})
