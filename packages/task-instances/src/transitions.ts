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
        const current = await instances.load(attempt?.worker?.instanceTaskId ?? stop.taskId)
        if (current.spec.desiredState !== "Suspended") await instances.suspend(attempt?.worker?.instanceTaskId ?? stop.taskId)
        const observed = await instances.load(attempt?.worker?.instanceTaskId ?? stop.taskId)
        if (!["Suspended", "Archived"].includes(observed.status?.phase)) { blocked.push({ taskId: stop.taskId, reason: "Waiting for Pod termination" }); continue }
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

/** Durable invalidation outbox. Observation, not elapsed time, authorizes the next pull. */
export async function advanceInputSignals(engine: TaskGraphEngine, instances?: InstanceManager, native?: NativeStopObserver) {
  const blocked: Array<{ taskId: string; reason: string }> = []
  if (instances) for (const row of engine.store.db.prepare("SELECT id FROM tasks").all()) {
    const taskId = String(row.id), attempt = engine.store.currentAttempt(taskId)
    if (attempt?.state !== "running" || attempt.worker?.agent !== "kubernetes") continue
    try {
      const instance = await instances.load(attempt.worker.instanceTaskId ?? taskId)
      const environment = await instances.environment(instance.spec)
      engine.atomic(() => {
        if (engine.store.currentAttempt(taskId)?.token === attempt.token) engine.signals.setEnvironment(taskId, environment)
      })
    } catch (error) { blocked.push({ taskId, reason: `Environment observation unavailable: ${String(error)}` }) }
  }
  for (const stop of engine.signals.stops().filter(s => s.state === "requested")) {
    const attempt = engine.store.currentAttempt(stop.taskId)
    if (!attempt || attempt.token !== stop.token) { blocked.push({ taskId: stop.taskId, reason: "Attempt identity changed" }); continue }
    try {
      if (attempt.worker?.agent === "kubernetes" && instances) {
        const physicalId = attempt.worker.instanceTaskId ?? stop.taskId
        const current = await instances.load(physicalId)
        if (!["Suspended", "Archived", "Completed", "Failed"].includes(current.status?.phase)) await instances.suspend(physicalId)
        const observed = await instances.load(physicalId)
        if (!["Suspended", "Archived", "Completed", "Failed"].includes(observed.status?.phase)) { blocked.push({ taskId: stop.taskId, reason: "Waiting for Pod termination" }); continue }
        engine.signals.stopped(stop.id, stop.token, `Kubernetes ${observed.status.phase}: ${observed.metadata.uid}`)
      } else if (native && attempt.worker?.sessionId) {
        const result = await native.stopAndInspect(attempt.worker.sessionId)
        if (!result.stopped) { blocked.push({ taskId: stop.taskId, reason: result.evidence }); continue }
        engine.signals.stopped(stop.id, stop.token, result.evidence)
      } else blocked.push({ taskId: stop.taskId, reason: "Stop observer unavailable; workspace remains reserved" })
    } catch (error) { blocked.push({ taskId: stop.taskId, reason: String(error) }) }
  }
  engine.atomic(() => { for (const s of engine.signals.list()) engine.signals.prepare(s.taskId); engine.signals.flush() })
  return { signals: engine.signals.list(), stops: engine.signals.stops(), blocked }
}
