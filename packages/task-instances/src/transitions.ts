import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import type { InstanceManager } from "./manager.ts"

export interface NativeStopObserver {
  stopAndInspect(sessionId: string): Promise<{ stopped: boolean; evidence: string }>
}
/** Outbox is the persisted transition: external effects happen outside graph transactions. */
export async function advanceTransition(engine: TaskGraphEngine, transitionId: string, instances?: InstanceManager, native?: NativeStopObserver) {
  const transition = engine.revisions.transitions().find(t => t.id === transitionId)
  if (!transition) throw new Error("Transition not found")
  if (transition.state !== "waiting") return engine.reconcilePlanTransition(transitionId)
  const blocked: Array<{ taskId: string; reason: string }> = []
  for (const stop of transition.stops.filter(s => s.state === "requested")) {
    // A newer approved revision may supersede this one while an external call is in progress.
    if (engine.revisions.transitions().find(t => t.id === transitionId)?.state !== "waiting") break
    const attempt = engine.store.currentAttempt(stop.taskId)
    if (attempt && attempt.token !== stop.token) { blocked.push({ taskId: stop.taskId, reason: "Execution identity changed" }); continue }
    try {
      if (attempt?.worker?.agent === "kubernetes" && instances) {
        const current = await instances.load(stop.taskId)
        if (current.spec.desiredState !== "Suspended") await instances.suspend(stop.taskId)
        const observed = await instances.load(stop.taskId)
        if (observed.status?.phase !== "Suspended") { blocked.push({ taskId: stop.taskId, reason: "Waiting for Pod termination" }); continue }
        if (engine.revisions.transitions().find(t => t.id === transitionId)?.state === "waiting")
          engine.revisions.confirmStopped(transitionId, stop.taskId, stop.token, `Kubernetes observed Suspended for ${observed.metadata.uid}`)
      } else if (native && attempt?.worker?.sessionId) {
        const observed = await native.stopAndInspect(attempt.worker.sessionId)
        if (!observed.stopped) { blocked.push({ taskId: stop.taskId, reason: observed.evidence }); continue }
        if (engine.revisions.transitions().find(t => t.id === transitionId)?.state === "waiting")
          engine.revisions.confirmStopped(transitionId, stop.taskId, stop.token, observed.evidence)
      } else blocked.push({ taskId: stop.taskId, reason: "Worker identity/termination observer unavailable; do not release its workspace" })
    } catch (error) { blocked.push({ taskId: stop.taskId, reason: error instanceof Error ? error.message : String(error) }) }
  }
  return { ...engine.reconcilePlanTransition(transitionId), blocked }
}
