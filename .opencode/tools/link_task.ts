import { tool } from "@opencode-ai/plugin"
import { callEngine } from "../lib/bridge.ts"

export default tool({
  description: "Create an explicit relation between two persistent tasks.",
  args: {
    fromTaskId: tool.schema.string(),
    toTaskId: tool.schema.string(),
    type: tool.schema.enum(["parent", "child", "depends_on", "blocks", "related", "supersedes"]),
  },
  async execute(args, context) {
    return callEngine(context, "link_task", args)
  },
})
