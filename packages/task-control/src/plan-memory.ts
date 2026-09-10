import type { ControlRuntime } from "./runtime.ts"
import type { VersionRef,VersionVector } from "../../task-causality/src/model.ts"
import type { SystemEvent } from "./store.ts"
import { canonical,digest } from "./value.ts"
import { observedInputCurrent,observedInputRefs } from "./observed-inputs.ts"

export interface PlanNodeVersion {
  id:string;version:number;planId:string;planRevision:number;nodeId:string;taskId:string
  objective:string;expected?:VersionRef;actual?:VersionRef;dependencies:VersionVector
  assumptions:VersionRef[];decisions:VersionRef[];boundaries:VersionRef[]
  status:string;error?:VersionRef;invalidations:string[];cause:string;evidence:VersionRef[];recordedAt:number
}

const INVALIDATION_EVENTS=new Set(["FileInputInvalidated","InputObservationChanged","AssumptionValidityLost","DecisionValidityLost","RegionalRepairSuperseded","EvidenceRetracted","EvidenceExpired"])

/** Projects mutable execution state into immutable plan-node versions. A node
 * keeps its complete typed lineage instead of relying on the latest Task row. */
export class PlanMemory {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS plan_node_projection_events(event_id TEXT NOT NULL,plan_id TEXT NOT NULL,plan_revision INTEGER NOT NULL,node_id TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(event_id,plan_id,plan_revision,node_id));
      CREATE INDEX IF NOT EXISTS plan_node_projection_task ON plan_node_projection_events(plan_id,plan_revision,node_id);`)
  }
  ingest():number {
    return this.runtime.store.consume("plan-memory/v1","typed-plan-node-lineage/v1",event=>this.project(event),1000)
  }
  current(planId:string,revision:number,nodeId:string):PlanNodeVersion|undefined {
    const id=this.id(planId,revision,nodeId),version=this.runtime.store.head("plan_node_versions",id)
    return version?this.runtime.store.get<PlanNodeVersion>("plan_node_versions",id,version):undefined
  }
  history(planId:string,revision:number,nodeId:string):PlanNodeVersion[] {
    const id=this.id(planId,revision,nodeId)
    return this.runtime.store.db.prepare("SELECT payload FROM plan_node_versions WHERE id=? ORDER BY version").all(id).map(row=>JSON.parse(String(row.payload)) as PlanNodeVersion)
  }
  private id(planId:string,revision:number,nodeId:string){return `${planId}@${revision}:${nodeId}`}
  private inputVector(taskId:string):VersionVector {
    const {engine,store}=this.runtime,snapshot=engine.signals.capture(taskId)
    const graph=snapshot.vector??[{entityId:taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
    const registered=observedInputRefs(store,taskId).map(ref=>{
      const definition=store.get<{kind:string;schemaVersion:string}>("observed_input_definitions",ref.id,ref.version)!,observation=observedInputCurrent(store,ref)
      return {entityId:`observed-input:${ref.id}:${ref.version}`,port:definition.kind,view:definition.schemaVersion,version:observation?.version??0,hash:observation?.hash??digest({ref,status:"unresolved"})}
    })
    return [...graph,...registered].sort((a,b)=>canonical(a).localeCompare(canonical(b)))
  }
  private project(event:SystemEvent):void {
    const {store,engine}=this.runtime,links=store.db.prepare("SELECT plan_id,revision,node_id,task_id FROM plan_task_links WHERE task_id=? ORDER BY plan_id,revision,node_id").all(event.entityId)
    for(const link of links) {
      const planId=String(link.plan_id),revision=Number(link.revision),nodeId=String(link.node_id),taskId=String(link.task_id)
      if(store.db.prepare("SELECT 1 FROM plan_node_projection_events WHERE event_id=? AND plan_id=? AND plan_revision=? AND node_id=?").get(event.id,planId,revision,nodeId))continue
      const node=engine.store.planNodes(planId,revision).find(item=>item.nodeId===nodeId)
      const task=engine.store.findTask(taskId)
      if(!node||!task)continue
      const expectationVersion=store.head("task_expectations",taskId),expected=expectationVersion?{id:taskId,version:expectationVersion}:undefined
      const observationRow=store.db.prepare("SELECT observation_id,observation_version FROM control_prediction_state WHERE task_id=? ORDER BY rowid DESC LIMIT 1").get(taskId)
      const actual=observationRow?{id:String(observationRow.observation_id),version:Number(observationRow.observation_version)}:undefined
      const error=actual&&store.get("prediction_errors",actual.id,actual.version)?actual:undefined
      const refs=(table:string)=>store.db.prepare(`SELECT id,version FROM ${table} WHERE task_id=? ORDER BY id,version`).all(taskId).map(row=>({id:String(row.id),version:Number(row.version)}))
      const assumptions=store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='assumption_task_consumers'").get()?refs("assumption_task_consumers"):[]
      const decisions=store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='decision_task_consumers'").get()?refs("decision_task_consumers"):[]
      const boundaries=store.db.prepare("SELECT b.boundary_id id,b.version FROM planning_boundary_members b JOIN control_heads h ON h.collection='planning_boundaries' AND h.id=b.boundary_id AND h.version=b.version WHERE b.task_id=? ORDER BY b.boundary_id").all(taskId).map(row=>({id:String(row.id),version:Number(row.version)}))
      // Memory records unresolved inputs as unresolved lineage. It must never
      // turn a temporary inability to execute into a failed projection.
      const dependencies=this.inputVector(taskId)
      const invalidations=INVALIDATION_EVENTS.has(event.type)?[event.id]:[]
      const evidence=[...new Map(([...(expected?store.get<{evidence:VersionRef[]}>("task_expectations",expected.id,expected.version)?.evidence??[]:[]),...(actual?store.get<{evidence:VersionRef[]}>("task_observations",actual.id,actual.version)?.evidence??[]:[]),...((event.payload as {evidence?:VersionRef|VersionRef[]})?.evidence?(Array.isArray((event.payload as any).evidence)?(event.payload as any).evidence:[(event.payload as any).evidence]):[]) ] as VersionRef[]).map(ref=>[canonical(ref),ref])).values()]
      const id=this.id(planId,revision,nodeId),head=store.head("plan_node_versions",id),prior=head?store.get<PlanNodeVersion>("plan_node_versions",id,head):undefined
      const base={id,planId,planRevision:revision,nodeId,taskId,objective:node.taskSpec.goal||node.outcome,...(expected?{expected}:{}),...(actual?{actual}:{}),dependencies,assumptions,decisions,boundaries,status:task.status,...(error?{error}:{}),invalidations:[...new Set([...(prior?.invalidations??[]),...invalidations])],cause:event.id,evidence,recordedAt:event.timestamp}
      const comparable=({version:_,cause:__,recordedAt:___,...value}:PlanNodeVersion)=>value
      const {cause:_,recordedAt:__,...nextComparable}=base
      if(prior&&digest(comparable(prior))===digest(nextComparable)) {
        store.db.prepare("INSERT INTO plan_node_projection_events VALUES(?,?,?,?,?)").run(event.id,planId,revision,nodeId,head);continue
      }
      const version=head+1,value:PlanNodeVersion={...base,version}
      store.put("plan_node_versions",id,version,value);store.advance("plan_node_versions",id,head,version)
      store.db.prepare("INSERT INTO plan_node_projection_events VALUES(?,?,?,?,?)").run(event.id,planId,revision,nodeId,version)
      store.event({id:`plan-node-version:${digest({id,version})}`,type:"PlanNodeVersionRecorded",entityId:taskId,correlationId:planId,causationId:event.id,schemaVersion:1,timestamp:event.timestamp,payload:{planId,revision,nodeId,taskId,version}})
    }
  }
}
