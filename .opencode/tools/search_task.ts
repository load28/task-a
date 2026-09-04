import { tool } from "@opencode-ai/plugin"
import { callEngine } from "../lib/bridge.ts"

export default tool({
  description: "Search persistent tasks by title or objective.",
  args: {
    query: tool.schema.string().describe("Words identifying the task"),
    limit: tool.schema.number().int().min(1).max(50).optional(),
  },
  async execute(args, context) {
    return callEngine(context, "search_task", args)
  },
})
