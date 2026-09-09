import { KubernetesApi } from "./api.ts"
import { KubectlApi } from "./kubectl.ts"
import { InstanceManager } from "./manager.ts"
import { WORKER_ENVIRONMENT_INSTRUCTIONS } from "./environment.ts"
export function configuredInstances(): InstanceManager | undefined {
  if (process.env.TASK_INSTANCE_BACKEND !== "kubernetes") return
  const namespace = process.env.TASK_INSTANCE_NAMESPACE
  if (!namespace) throw new Error("TASK_INSTANCE_NAMESPACE is required for Kubernetes execution")
  const api = process.env.TASK_INSTANCE_CONTEXT ? new KubectlApi(process.env.TASK_INSTANCE_CONTEXT, namespace) : new KubernetesApi(namespace)
  return new InstanceManager(api, namespace)
}
const taskId = { type: "string", minLength: 1 }
const strings = { type: "array", items: { type: "string" } }
const instanceSpec = {
  type: "object", additionalProperties: false,
  properties: {
    taskId, image: { type: "string" }, envSecret: { type: "string" },
    run: { type: "integer", minimum: 1, default: 1 },
    desiredState: { type: "string", enum: ["Running", "Suspended"], default: "Running" },
    storage: { type: "object", properties: { size: { type: "string" }, className: { type: "string" } }, required: ["size"] },
    deletionPolicy: { type: "string", enum: ["Retain", "Delete"], default: "Retain" },
    repository: { type: "object", properties: { url: { type: "string", pattern: "^https://" }, commit: { type: "string", pattern: "^[a-f0-9]{40,64}$" } }, required: ["url", "commit"] },
    stages: { type: "array", minItems: 1, items: {
      type: "object", additionalProperties: false,
      properties: {
        id: { type: "string", pattern: "^[a-z][a-z0-9-]{0,62}$" },
        command: { ...strings, minItems: 1, description: "Command argv, e.g. [node, /app/scripts/instance-model-stage.ts, self-contained prompt]." },
        outputs: { ...strings, description: "Optional reusable file/directory paths; never use . or .git." },
        inputDigest: { type: "string", pattern: "^[a-f0-9]{64}$" }, dependsOn: strings,
      }, required: ["id", "command"],
    } },
    reuseSources: { type: "array", items: { type: "object", properties: { taskId, stages: strings }, required: ["taskId", "stages"] } },
    restoreFromTaskId: taskId,
    resources: { type: "object", properties: { requests: { type: "object", additionalProperties: { type: "string" } }, limits: { type: "object", additionalProperties: { type: "string" } } } },
  }, required: ["stages"],
}
export const instanceTools = [
  { name: "task_instance_create", description: "Create the durable Kubernetes execution environment for an existing runnable leaf. Stages run command argv arrays in order. Defaults: taskId from the outer argument, run=1, desiredState=Running, storage.size=1Gi, deletionPolicy=Retain. The configured worker image and envSecret are defaults when omitted; model commands may use node /app/scripts/instance-model-stage.ts with a self-contained prompt, graph context and acceptance criteria. Pass exact repository commit and environment image. For selective reuse, stages declare outputs (relative paths), inputDigest (SHA-256 covering effective requirements and inputs) and dependsOn (earlier stage IDs); spec.reuseSources lists {taskId, stages} of stopped source instances. Never run the same task in a native subagent as well.",
    inputSchema: { type: "object", properties: { taskId, spec: instanceSpec }, required: ["taskId", "spec"] } },
  { name: "task_instance_status", description: "Load the same execution environment from any conversation, including Pod phase, archive receipt and persistent volume identity.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
  { name: "task_instance_suspend", description: "Request graceful stop and retain the task's files and stage checkpoints. Poll status until Suspended before claiming it stopped.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
  { name: "task_instance_resume", description: "Resume a suspended or failed environment using the next explicit run generation. Completed stages remain completed; interrupted stages inspect prior partial effects.",
    inputSchema: { type: "object", properties: { taskId, recoveryInstructions: { type: "string", maxLength: 8000, description: "Concrete repair direction, including the actual user answer when a decision was required. Never include secrets." }, run: { type: "integer", minimum: 2 } }, required: ["taskId", "run"] } },
  { name: "task_instance_delete", description: "Delete a task environment only on explicit cleanup request. Its configured deletionPolicy determines whether its volume is retained or deleted.",
    inputSchema: { type: "object", properties: { taskId }, required: ["taskId"] } },
]
export const INSTANCE_INSTRUCTIONS = `Kubernetes execution is enabled. For runnable leaf work use task_instance_create instead of native task subagents or local execution. Creation atomically claims the graph leaf for Kubernetes; do not call task_start again for that leaf. Each instance owns an isolated checkout and durable OpenCode session data. Load task_instance_status when resuming from another host conversation. Stop and wait for Suspended before resuming with the next run number. Use the configured image and envSecret defaults. Archive storage is operator-owned and cannot be supplied in tool arguments. For model-driven work, run ["node", "/app/scripts/instance-model-stage.ts", "<self-contained task prompt>"] inside the instance. Include task context and exact acceptance criteria in that prompt. The model can use tools inside its own PVC; the manager records graph results from actual output evidence. Default worker images do NOT expose Graph MCP tools. Never tell a Pod model to publish artifacts or call task_complete unless a remote graph connection was explicitly configured. Missing worker graph tools are not a reason to rerun successful implementation; collect the execution log and publish/complete from the manager. With an archive profile, completion saves the whole private Git worktree and home to the archive PVC, then releases the execution Pod/PVC (Archived phase). For a routed issue, the graph automatically restores the replacement task from its own prior instance (completed archive or stopped PVC). Preserve that work, integrate the current dependency versions, and execute the repair or downstream validation. Report upstream defects to the manager with versions and reproduction evidence instead of applying local workarounds. Use restoreFromTaskId on a NEW task to restore all prior files/history and execute a changed specification; use task_instance_resume on an Archived task to restore its existing environment without repeating completed stages. A completed Pod is only command completion, not graph verification: publish evidence and complete the graph task separately. Pass required tools, remote graph connection and credentials through a preconfigured environment image/Secret; never put credentials in instance specifications. Follow the leaf dependencies and worker capacity. When a plan revision exposes reusable work, create a new instance with reuseSources and explicit stage inputDigest/outputs; only matching verified stage files are imported. Include the graph attemptToken from task_load in completion and artifact reports. Transfer verified commits to the integration instance before downstream validation. Do not assume isolated files have been merged into the user's checkout.`

export const RECOVERY_INSTRUCTIONS = `${WORKER_ENVIRONMENT_INSTRUCTIONS}\nOn Failed, inspect status.result.failure: stage, command, exitCode, signal, message and logTail are observed evidence. Report the cause and saved partial work to the host. Never stop at exit code alone or claim missing logs when diagnostics exist. For a safe dependency or code repair within approved scope, resume with concrete recoveryInstructions and next run; the same PVC and session are preserved. Do not repeat an unchanged failing attempt: after two unsuccessful repair attempts, or for authentication, permission, destructive changes or an ambiguous requirement, use the native question tool with the exact blocker, attempted repairs and concrete choices. Keep the request waiting, not completed. After the actual user answer, pass its meaning in recoveryInstructions to task_instance_resume and continue verification. Never invent the answer or broaden permissions. If image/specification must change, use the existing issue routing and restored replacement task flow. A failed physical instance awaiting repair must not be prematurely marked as a terminal graph failure or release its reservation. Cancel only when the user chooses cancellation. Never mark the task complete until all required checks pass.`
