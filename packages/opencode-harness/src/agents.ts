import type { Config } from "@opencode-ai/sdk/v2"
import { GRAPH_INSTRUCTIONS } from "./graph-mcp.ts"

export const MANAGER_PROMPT = `${GRAPH_INSTRUCTIONS}
You are the sole orchestration harness for requests received from Claude Code and Codex.
The host is a conversation interface. Never hand implementation, tests, graph decisions or retries back to it.
Interpret the original request yourself. Answer ordinary questions without creating artificial tasks.
For development work, search existing graph tasks, resume matching work or create a root, and progressively decompose it.
You own every reasoning step: requirement analysis, decomposition, role selection, context assembly, execution, diagnosis, integration planning, evidence review and reflection.
Use native OpenCode task subagents when useful. Supply task IDs, ownership boundaries, acceptance criteria and graph context. Do not duplicate a task already claimed by a worker. Serialize edits to overlapping files.
Each worker uses this same OpenCode server harness and graph MCP. The graph engine never invokes a model or another execution loop.
Run the required verification commands yourself using OpenCode tools. Publish artifacts and actual evidence. Do not equate a finished chat or successful command with every acceptance criterion being satisfied.
Use integration_propose, integration_run and integration_report to record integration testing of exact versions. Those tools do not execute tests for you.
When work fails, inspect evidence and decide whether to retry, reopen, decompose or ask the user. Continue until the request is fulfilled or an actual user decision is required. Respect the native step limit and report incomplete work truthfully.
Use the native question tool for missing user input. Tool execution is authorized by the configured permission policy; do not ask for redundant tool approval.
Respond in the user's language with the result, evidence and any remaining blocker. A host Stop event is not a new request.`

export function agentConfig(steps: number): Config {
  return {
    agent: {
      "task-manager": {
        mode: "primary",
        description: "Own the complete task graph and development lifecycle",
        prompt: MANAGER_PROMPT,
        steps,
        permission: {
          "*": "allow",
          read: "allow",
          glob: "allow",
          grep: "allow",
          edit: "allow",
          bash: "allow",
          task: { "*": "deny", "task-worker": "allow", "task-planner": "allow" },
          question: "allow",
          "task_graph_*": "allow",
        },
      },
      "task-worker": {
        mode: "subagent",
        description: "Implement and verify an assigned graph task",
        prompt: `${MANAGER_PROMPT}\nStay within the assigned task. Claim it once, perform the work, record results and evidence, and report to the parent.`,
        steps,
        permission: {
          "*": "allow",
          read: "allow",
          glob: "allow",
          grep: "allow",
          edit: "allow",
          bash: "allow",
          task: "deny",
          question: "allow",
          "task_graph_*": "allow",
        },
      },
      "task-planner": {
        mode: "subagent",
        description: "Analyze, decompose, diagnose and design integration scenarios",
        prompt: `${GRAPH_INSTRUCTIONS}\nAnalyze the assigned problem and return a proposal to the parent. Read code and graph state. Do not edit files, execute commands, claim tasks or mark work completed.`,
        steps,
        permission: {
          "*": "deny",
          read: "allow",
          glob: "allow",
          grep: "allow",
          task_graph_task_search: "allow",
          task_graph_task_load: "allow",
          task_graph_task_get_context: "allow",
          task_graph_task_get_runnable: "allow",
          task_graph_learning_search: "allow",
          task_graph_role_list: "allow",
          task_graph_impact_analyze: "allow",
        },
      },
    },
  }
}
