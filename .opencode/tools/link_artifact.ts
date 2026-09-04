import { tool } from "@opencode-ai/plugin"
import { callEngine, source } from "../lib/bridge.ts"

export default tool({
  description: "Link a durable external result to a task without copying its contents.",
  args: {
    taskId: tool.schema.string(),
    type: tool.schema.enum(["file", "commit", "pr", "issue", "document", "url", "test", "other"]),
    uri: tool.schema.string(),
    description: tool.schema.string().optional(),
  },
  async execute(args, context) {
    return callEngine(context, "link_artifact", { ...args, source: source(context) })
  },
})
