import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { inputConsumers,installInputIndex } from "../packages/task-engine/src/input-index.ts"
import type { ArtifactVersionRef } from "#task-domain"

function setup() {
  const store=new TaskGraphStore(),engine=new TaskGraphEngine(store)
  const source=engine.createTask({title:"source",goal:"source"}),now=new Date().toISOString()
  const artifact=(id:string,type:"note"|"bundle"="note",inputs:ArtifactVersionRef[]=[])=>{
    store.insertArtifact({id,name:id,type,latestVersion:1,createdAt:now})
    store.insertArtifactVersion({artifactId:id,version:1,type,producerTaskId:source.id,contractVersionRefs:[],contentRef:`inline:${id}`,content:id,status:"valid",createdAt:now,inputs})
    return {artifactId:id,version:1}
  }
  const consumer=(title:string,inputArtifactRefs:ArtifactVersionRef[]=[],parentId?:string)=>{const task=engine.createTask({title,goal:title,parentId});store.updateTask({...task,inputArtifactRefs});return engine.requireTask(task.id)}
  return {store,engine,source,artifact,consumer}
}

test("역방향 입력 조회는 중첩 bundle의 정확한 버전과 상위 작업에서 상속한 의존성을 포함한다",()=>{
  const {store,engine,source,artifact,consumer}=setup()
  try {
    const a=artifact("a"),other=artifact("other"),first=artifact("first","bundle",[a]),second=artifact("second","bundle",[first])
    const direct=consumer("direct",[a]),nested=consumer("nested",[second]),unrelated=consumer("unrelated",[other])
    store.updateTask({...engine.requireTask(source.id),outputArtifactRefs:[a]})
    const parent=engine.createTask({title:"inherited",goal:"inherited",dependencies:[source.id]}),child=consumer("child",[],parent.id)
    assert.deepEqual(new Set(inputConsumers(store.db,a.artifactId)),new Set([direct.id,nested.id,parent.id,child.id]))
    assert.ok(!inputConsumers(store.db,a.artifactId).includes(unrelated.id))
    // A different bundle version must not be treated as consuming old members.
    store.insertArtifactVersion({artifactId:first.artifactId,version:2,type:"bundle",producerTaskId:source.id,contractVersionRefs:[],contentRef:"inline:v2",content:"other",status:"valid",createdAt:new Date().toISOString(),inputs:[other]})
    store.updateTask({...engine.requireTask(direct.id),inputArtifactRefs:[{artifactId:first.artifactId,version:2}]})
    assert.ok(!inputConsumers(store.db,a.artifactId).includes(direct.id))
  }finally{store.close()}
})

test("현재 attempt의 고정 입력이 새 선언과 과거 snapshot보다 우선하며 rollback은 인덱스도 복구한다",()=>{
  const {store,engine,artifact,consumer}=setup()
  try {
    const a=artifact("a"),b=artifact("b"),task=consumer("consumer",[a])
    engine.startTask(task.id)
    store.updateTask({...engine.requireTask(task.id),inputArtifactRefs:[b]})
    assert.deepEqual(inputConsumers(store.db,a.artifactId),[task.id])
    assert.deepEqual(inputConsumers(store.db,b.artifactId),[])
    const old=store.currentAttempt(task.id)!
    store.saveAttempt({...old,id:"new-attempt",token:"new-token"})
    engine.signals.pin(task.id,"new-attempt")
    assert.deepEqual(inputConsumers(store.db,a.artifactId),[])
    assert.deepEqual(inputConsumers(store.db,b.artifactId),[task.id])
    assert.throws(()=>store.transaction(()=>{
      store.db.prepare("DELETE FROM task_input_snapshots WHERE attempt_id='new-attempt'").run()
      store.updateTask({...engine.requireTask(task.id),inputArtifactRefs:[a]})
      assert.deepEqual(inputConsumers(store.db,a.artifactId),[task.id])
      throw new Error("abort input transaction")
    }),/abort input/)
    assert.deepEqual(inputConsumers(store.db,a.artifactId),[])
    assert.deepEqual(inputConsumers(store.db,b.artifactId),[task.id])
  }finally{store.close()}
})

test("발행 시 영향 밖 작업과 전체 bundle·통합 목록을 읽지 않는다",()=>{
  const {store,engine,source,artifact,consumer}=setup()
  try {
    const a=artifact("a"),target=consumer("target",[a]),cold=new Set(Array.from({length:60},(_,i)=>consumer(`unrelated-${i}`).id))
    const find=store.findTask.bind(store)
    store.findTask=id=>{assert.ok(!cold.has(id),"Unrelated task was loaded");return find(id)}
    store.validBundles=()=>{throw new Error("Full bundle scan")}
    store.integrationSets=()=>{throw new Error("Full integration scan")}
    engine.atomic(()=>engine.signals.push(a))
    assert.equal(engine.signals.dirty(target.id),true)
    assert.equal(engine.signals.dirty(source.id),false)
    assert.equal(store.db.prepare("SELECT count(*) n FROM task_input_signals").get()!.n,1)
  }finally{store.close()}
})

test("기존 저장 데이터는 한 번 역색인하고 이후 raw SQL 변경도 같은 트랜잭션에서 반영한다",()=>{
  const {store,engine,artifact,consumer}=setup()
  try {
    const a=artifact("a"),b=artifact("b"),task=consumer("consumer",[a])
    engine.startTask(task.id)
    // Simulate installing the migration over a pre-index database.
    store.db.exec("DELETE FROM input_index_versions; DELETE FROM signal_task_artifacts; DELETE FROM signal_snapshot_artifacts")
    store.transaction(()=>installInputIndex(store.db))
    assert.deepEqual(inputConsumers(store.db,a.artifactId),[task.id])
    const attempt=store.currentAttempt(task.id)!
    store.db.prepare("DELETE FROM task_input_snapshots WHERE attempt_id=?").run(attempt.id)
    store.db.prepare("UPDATE tasks SET input_artifact_refs_json=? WHERE id=?").run(JSON.stringify([b]),task.id)
    assert.deepEqual(inputConsumers(store.db,a.artifactId),[])
    assert.deepEqual(inputConsumers(store.db,b.artifactId),[task.id])
    store.transaction(()=>installInputIndex(store.db))
    assert.equal(store.db.prepare("SELECT count(*) n FROM input_index_versions").get()!.n,1)
    assert.deepEqual(inputConsumers(store.db,b.artifactId),[task.id])
  }finally{store.close()}
})
