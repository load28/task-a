import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { canonical,digest } from "../../task-control/src/value.ts"

export interface WorkerStopObservation {stopped:boolean;evidence:string}

/** Retires pre-grant workers one at a time. A task becomes runnable again only
 * after the original session is observed idle; its specification and files are
 * retained while the old attempt remains immutable history. */
export async function migrateLegacyWorkers(runtime:ControlRuntime,workspace:string,maxWorkers:number,stop:(sessionId:string)=>Promise<WorkerStopObservation>):Promise<number> {
  const {store,engine}=runtime,scheduler=new TaskScheduler(engine,maxWorkers,workspace)
  store.db.exec(`CREATE TABLE IF NOT EXISTS rolling_worker_migrations(id TEXT PRIMARY KEY,task_id TEXT NOT NULL,attempt_id TEXT NOT NULL,session_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS rolling_worker_migration_update BEFORE UPDATE ON rolling_worker_migrations BEGIN SELECT RAISE(ABORT,'Immutable worker migration'); END;
    CREATE TRIGGER IF NOT EXISTS rolling_worker_migration_delete BEFORE DELETE ON rolling_worker_migrations BEGIN SELECT RAISE(ABORT,'Immutable worker migration'); END;`)
  let migrated=0
  const rows=store.db.prepare("SELECT a.task_id,a.id,a.payload FROM task_attempts a JOIN tasks t ON t.id=a.task_id WHERE json_extract(a.payload,'$.state')='running' AND json_extract(a.payload,'$.worker.sessionId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM activation_grants g WHERE json_extract(g.payload,'$.worker')=json_extract(a.payload,'$.worker.sessionId')) ORDER BY a.rowid").all()
  for(const row of rows) {
    const attempt=JSON.parse(String(row.payload)) as {id:string;token:string;worker:{sessionId:string}},id=`rolling-migration:${digest({taskId:row.task_id,attemptId:attempt.id,sessionId:attempt.worker.sessionId})}`
    if(store.db.prepare("SELECT 1 FROM rolling_worker_migrations WHERE id=?").get(id))continue
    let observation:WorkerStopObservation
    try{observation=await stop(attempt.worker.sessionId)}catch(error){observation={stopped:false,evidence:error instanceof Error?error.message:String(error)}}
    if(!observation.stopped) {
      store.event({id:`rolling-migration-pending:${digest({id,evidence:observation.evidence})}`,type:"LegacyWorkerMigrationPending",entityId:String(row.task_id),correlationId:String(row.task_id),schemaVersion:1,timestamp:Date.now(),payload:{attemptId:attempt.id,sessionId:attempt.worker.sessionId,evidence:observation.evidence}})
      continue
    }
    runtime.store.atomic(()=>{
      const current=engine.store.currentAttempt(String(row.task_id))
      if(current?.id!==attempt.id||current.state!=="running"||current.worker?.sessionId!==attempt.worker.sessionId)return
      engine.failTask(String(row.task_id),"Legacy worker stopped for controlled rolling migration",attempt.token)
      scheduler.release(String(row.task_id),true)
      engine.reopenTask(String(row.task_id),"Resume through a controller-issued activation grant")
      const content={id,taskId:String(row.task_id),attemptId:attempt.id,sessionId:attempt.worker.sessionId,state:"migrated",stopped:observation,workspace,migratedAt:Date.now()}
      store.db.prepare("INSERT INTO rolling_worker_migrations VALUES(?,?,?,?,?,?)").run(id,String(row.task_id),attempt.id,attempt.worker.sessionId,"migrated",canonical(content))
      store.event({id,type:"LegacyWorkerMigrated",entityId:String(row.task_id),correlationId:String(row.task_id),schemaVersion:1,timestamp:content.migratedAt,payload:content})
      migrated++
    })
  }
  return migrated
}
