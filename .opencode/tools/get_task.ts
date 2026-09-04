import { tool } from "@opencode-ai/plugin"
import { callEngine } from "../lib/bridge.ts"

export default tool({
  description: "Read a task with its event history, current snapshot, and artifacts.",
  args: { taskId: tool.schema.string() },
  async execute(args, context) {
    return callEngine(context, "get_task", args)
  },
})
