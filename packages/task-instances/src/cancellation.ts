import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import type { InstanceManager } from "./manager.ts"
import type { NativeStopObserver } from "./transitions.ts"

type Cancellation = { taskId: string; token?: string; worker?: { agent?: string; sessionId?: string; instanceTaskId?: string }; needsStop: boolean; state: "requested" | "stopped"; evidence?: string; error?: string }
export function cancellations(engine: TaskGraphEngine): Cancellation[] {
  return engine.store.db.prepare("SELECT payload FROM task_cancellations").all().map(r => JSON.parse(String(r.payload)))
}
function save(engine: TaskGraphEngine, row: Cancellation) {
  engine.store.db.prepare("INSERT INTO task_cancellations VALUES(?,?) ON CONFLICT(task_id) DO UPDATE SET payload=excluded.payload").run(row.taskId, JSON.stringify(row))
}
/** Persist the execution fence before attempting any external stop. */
export function requestCancellation(engine: TaskGraphEngine, taskIds: string[]) {
  return engine.atomic(() => {
    const scheduler = new TaskScheduler(engine)
    const reservations = scheduler.status().active
    const visit = (taskId: string) => {
      const task = engine.requireTask(taskId)
      for (const id of task.childIds) visit(id)
      if (cancellations(engine).some(c => c.taskId === taskId)) return
      const attempt = engine.store.currentAttempt(taskId)
      const reservation = reservations.find(r => r.taskId === taskId)
      const needsStop = !!reservation || !!attempt && ["running", "fenced"].includes(attempt.state)
      if (["verified", "integrated"].includes(task.status) && !needsStop) return
      save(engine, { taskId, token: attempt?.token, worker: attempt?.worker, needsStop, state: needsStop ? "requested" : "stopped" })
      if (attempt && needsStop) engine.store.saveAttempt({ ...attempt, state: "fenced" })
      engine.store.updateTask({ ...task, status: "failed", statusReason: "사용자가 작업을 취소했습니다." })
    }
    taskIds.forEach(visit)
    return cancellations(engine)
  })
}
/** Keep reservations until the execution backend supplies termination evidence. */
export async function advanceCancellation(engine: TaskGraphEngine, instances?: InstanceManager, native?: NativeStopObserver, workspaceStopped?: { stopped: boolean; evidence: string }) {
  for (const row of cancellations(engine).filter(c => c.state === "requested")) {
    try {
      let observed = { stopped: false, evidence: "실행 정보가 없어 프로젝트 전체 종료 확인이 필요합니다." }
      if (row.worker?.agent === "kubernetes") {
        if (!instances) throw new Error("Kubernetes 종료 제어 환경을 사용할 수 없습니다.")
        const id = row.worker.instanceTaskId ?? row.taskId
        await instances.suspend(id)
        const instance = await instances.load(id)
        observed = { stopped: instance.spec.desiredState === "Suspended" && instance.status?.phase === "Suspended" && instance.status?.observedGeneration === instance.metadata.generation,
          evidence: `Kubernetes Suspended: ${instance.metadata.uid}` }
        if (!observed.stopped) observed.evidence = "Pod 종료 확인을 기다리고 있습니다."
      } else if (row.worker?.sessionId && native) observed = await native.stopAndInspect(row.worker.sessionId)
      else if (workspaceStopped) observed = workspaceStopped
      if (!observed.stopped) { save(engine, { ...row, error: observed.evidence }); continue }
      engine.atomic(() => {
        const attempt = engine.store.currentAttempt(row.taskId)
        if (attempt?.token !== row.token) throw new Error("취소 대상의 실행 식별자가 변경됐습니다.")
        if (attempt) engine.store.saveAttempt({ ...attempt, state: "failed" })
        new TaskScheduler(engine).release(row.taskId, true)
        save(engine, { ...row, state: "stopped", evidence: observed.evidence, error: undefined })
      })
    } catch (error) { save(engine, { ...row, error: error instanceof Error ? error.message : String(error) }) }
  }
  return cancellations(engine)
}
