import type { ExecutionStep } from '../../contracts/model.ts'

/** The image must contain the pinned Codex CLI; the backend mounts the adapter. */
export function codexStep(options: { id: string; model: string; outputs: string[]; timeoutMs?: number }): ExecutionStep {
  if (!/^[A-Za-z0-9_.-]+$/.test(options.id) || !options.model.trim()) throw new Error('Codex step requires an ID and an explicit model')
  return { id: options.id, argv: ['node', '/runtime/codex-agent.mjs', 'start', options.model],
    agent: { sessionPath: `.agent/${options.id}`, resumeArgv: ['node', '/runtime/codex-agent.mjs', 'resume', options.model] },
    outputs: options.outputs, timeoutMs: options.timeoutMs ?? 180000, effectPolicy: 'replayable' }
}
export const chatgptInferencePolicy = { network: 'restricted' as const, allowedHosts: ['chatgpt.com'], secretRefs: ['codex-chatgpt'], allowedEffects: ['model-inference'] }
