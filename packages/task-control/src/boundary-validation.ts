import type { ControlRuntime } from "./runtime.ts"
import type { Boundary,VersionRef,VersionVector,Observation } from "../../task-causality/src/model.ts"
import { INTEGRATION_DIMENSIONS } from "../../task-evidence/src/integration.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import { canonical,digest } from "./value.ts"

export interface ValidatedBoundary extends Boundary {
  validators:Record<typeof INTEGRATION_DIMENSIONS[number],string>
  authorization:VersionRef[]
}
export function integrationTuple(boundary:ValidatedBoundary,observations:Observation[]):VersionVector {
  return [{entityId:boundary.id,port:"boundary",view:"integration-policy",version:boundary.version,hash:digest(boundary)},...observations.map(item=>({entityId:item.taskId,port:"observed-output",view:"semantic-state",version:item.version,hash:digest(item)}))].sort((a,b)=>canonical(a).localeCompare(canonical(b)))
}
export class BoundaryValidation {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS boundary_validation_state(boundary_id TEXT PRIMARY KEY,version INTEGER NOT NULL,tuple_hash TEXT NOT NULL)")
  }
  register(boundary:ValidatedBoundary):void {
    const {store,evidence,engine}=this.runtime
    store.atomic(()=>{
      if(!boundary.members.length||new Set(boundary.members).size!==boundary.members.length||!boundary.authorization.length)throw new Error("Integration boundary needs unique members and authorization")
      boundary.members.forEach(id=>engine.requireTask(id))
      for(const ref of boundary.authorization)if(!["user","code"].includes(evidence.require(ref).type))throw new Error("Boundary requires operator authorization")
      for(const dimension of INTEGRATION_DIMENSIONS) {
        const validator=boundary.validators[dimension],match=typeof validator==="string"&&/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(validator)
        if(!match||!store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2])))throw new Error(`Missing registered ${dimension} validator`)
      }
      const previous=store.head("planning_boundaries",boundary.id)
      if(boundary.version!==previous+1)throw new Error("Boundary version must advance exactly once")
      store.put("planning_boundaries",boundary.id,boundary.version,boundary)
      store.advance("planning_boundaries",boundary.id,previous,boundary.version)
      store.db.prepare("INSERT INTO boundary_validation_state VALUES(?,?,'pending') ON CONFLICT(boundary_id) DO UPDATE SET version=excluded.version,tuple_hash='pending'").run(boundary.id,boundary.version)
      store.event({id:`boundary-registered:${boundary.id}:${boundary.version}`,type:"IntegrationBoundaryRegistered",entityId:boundary.id,correlationId:boundary.id,schemaVersion:1,timestamp:Date.now(),payload:{boundary:{id:boundary.id,version:boundary.version}}})
      this.refresh(boundary)
    })
  }
  observations(boundary:ValidatedBoundary):Observation[]|undefined {
    const {store,engine}=this.runtime,observations:Observation[]=[]
    for(const id of boundary.members) {
      const attempt=engine.store.currentAttempt(id)
      const row=attempt&&store.db.prepare("SELECT observation_id,observation_version FROM control_prediction_state WHERE task_id=? AND attempt_id=?").get(id,attempt.id)
      if(!row||!engine.signals.matches(id))return
      const observation=store.get<Observation>("task_observations",String(row.observation_id),Number(row.observation_version))
      if(!observation)return
      observations.push(observation)
    }
    return observations
  }
  refresh(boundary:ValidatedBoundary):void {
    const {store,evidence}=this.runtime,observations=this.observations(boundary)
    if(!observations)return
    const tuple=integrationTuple(boundary,observations),hash=digest(tuple)
    if(store.db.prepare("SELECT tuple_hash FROM boundary_validation_state WHERE boundary_id=?").get(boundary.id)?.tuple_hash===hash)return
    const content={boundary,observations},proof=evidence.put({id:`integration-input:${hash}`,version:1,type:"runtime",source:"current attempt-bound semantic observations",producer:"boundary-validation",validatorVersion:"integration-input/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:tuple,confidence:1,expiresAt:null})
    for(const dimension of INTEGRATION_DIMENSIONS)evidence.createObligation({entityId:boundary.id,tuple,kind:`integration:${dimension}`,mandatory:true,validators:[boundary.validators[dimension]],reason:[...boundary.authorization,...observations.flatMap(item=>item.evidence),proof]})
    store.db.prepare("UPDATE boundary_validation_state SET tuple_hash=? WHERE boundary_id=?").run(hash,boundary.id)
  }
  ingest():number {
    const {store}=this.runtime
    return store.consume("boundary-validation/v1","seven-dimension/v1",event=>{
      if(event.type==="PredictionObserved")for(const row of store.db.prepare("SELECT b.boundary_id,b.version FROM planning_boundary_members b JOIN control_heads h ON h.collection='planning_boundaries' AND h.id=b.boundary_id AND h.version=b.version JOIN boundary_validation_state s ON s.boundary_id=b.boundary_id WHERE b.task_id=?").all(event.entityId))this.refresh(store.get<ValidatedBoundary>("planning_boundaries",String(row.boundary_id),Number(row.version))!)
      if(event.type==="ValidatorFailed") {
        const payload=event.payload as {obligationId:string;evidence:VersionRef}
        const obligation=this.runtime.evidence.obligation(payload.obligationId)
        const state=store.db.prepare("SELECT version,tuple_hash FROM boundary_validation_state WHERE boundary_id=?").get(event.entityId)
        if(!obligation?.kind.startsWith("integration:")||!state||state.tuple_hash!==digest(obligation.tuple)||!this.runtime.evidence.valid(payload.evidence))return
        const proof=this.runtime.evidence.require(payload.evidence)
        if((proof.content as {passed?:boolean}).passed!==false||digest(proof.inputVector)!==digest(obligation.tuple))return
        const boundary=store.get<ValidatedBoundary>("planning_boundaries",event.entityId,Number(state.version))!
        const observations=this.observations(boundary)
        if(!observations||digest(integrationTuple(boundary,observations))!==state.tuple_hash)return
        const owners=new Map<string,string[]>()
        for(const taskId of boundary.members) {
          const row=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(taskId)
          if(row)owners.set(String(row.request_id),[...(owners.get(String(row.request_id))??[]),taskId])
        }
        for(const [requestId,taskIds] of owners) {
          const request=this.runtime.requests.get(requestId)
          if(request?.state!=="executing")continue
          const id=`joint-failure:${digest({requestId,boundary:event.entityId,tuple:state.tuple_hash})}`
          if(store.db.prepare("SELECT 1 FROM event_outbox WHERE id=?").get(id))continue
          store.event({id,type:"JointIntegrationFailed",entityId:event.entityId,correlationId:requestId,causationId:event.id,schemaVersion:1,timestamp:event.timestamp,payload:{requestId,taskIds,reason:"joint integration failure",evidence:[payload.evidence],integrationBoundary:{id:boundary.id,version:boundary.version,tupleHash:String(state.tuple_hash)}}})
        }
      }
      if(event.type==="ValidationSatisfied"&&store.db.prepare("SELECT 1 FROM boundary_validation_state WHERE boundary_id=?").get(event.entityId)) {
        const boundary=store.get<ValidatedBoundary>("planning_boundaries",event.entityId,store.head("planning_boundaries",event.entityId))!
        boundary.members.forEach(id=>this.runtime.completeObserved(id))
      }
    },1000)
  }
}
