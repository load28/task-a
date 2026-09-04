import { tool } from "@opencode-ai/plugin"
import { callEngine, source } from "../lib/bridge.ts"

export default tool({
  description: "Mark a task completed after its objective has actually been achieved.",
  args: {
    taskId: tool.schema.string(),
    content: tool.schema.string().optional(),
  },
  async execute(args, context) {
    return callEngine(context, "complete_task", { ...args, source: source(context) })
  },
})
