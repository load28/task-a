import test from "node:test"
import assert from "node:assert/strict"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { TaskScheduler } from "../packages/task-engine/src/scheduling.ts"
import { migrateLegacyWorkers } from "../packages/host-integration/src/rolling-migration.ts"

test("운영 rolling 이관은 구 worker 종료를 확인한 뒤 같은 task를 새 grant 대기로 되돌린다",async()=>{
  const runtime=createGraphRuntime(":memory:"),task=runtime.engine.createTask({title:"legacy",goal:"legacy",writeScopes:[]}),scheduler=new TaskScheduler(runtime.engine,1)
  try {
    scheduler.claim(task.id,{agent:"legacy",sessionId:"legacy-session"})
    const attemptId=runtime.engine.store.currentAttempt(task.id)!.id
    assert.equal(await migrateLegacyWorkers(runtime.control,process.cwd(),1,async()=>({stopped:false,evidence:"still running"})),0)
    assert.equal(runtime.engine.requireTask(task.id).status,"running")
    assert.equal(await migrateLegacyWorkers(runtime.control,process.cwd(),1,async sessionId=>({stopped:sessionId==="legacy-session",evidence:"abort and idle observed"})),1)
    assert.equal(runtime.engine.requireTask(task.id).status,"ready")
    assert.equal(runtime.engine.store.currentAttempt(task.id)?.id,attemptId)
    assert.equal(runtime.engine.store.currentAttempt(task.id)?.state,"failed")
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM task_reservations").get()!.n,0)
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM rolling_worker_migrations").get()!.n,1)
    assert.equal(runtime.store.db.prepare("SELECT count(*) n FROM event_outbox WHERE type='LegacyWorkerMigrated'").get()!.n,1)
  }finally{runtime.close()}
})
