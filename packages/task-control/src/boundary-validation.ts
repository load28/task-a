import type { ControlRuntime } from "./runtime.ts"
import type { Boundary,BoundaryProof,ChangeScope,VersionRef,VersionVector,Observation,CausalEdge } from "../../task-causality/src/model.ts"
import { CHANGE_SCOPES } from "../../task-causality/src/model.ts"
import { preservedExit } from "../../task-causality/src/boundary.ts"
import { INTEGRATION_DIMENSIONS } from "../../task-evidence/src/integration.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import { canonical,digest } from "./value.ts"

export interface ValidatedBoundary extends Boundary {
  validators:Record<typeof INTEGRATION_DIMENSIONS[number],string>
  authorization:VersionRef[]
  bindingValidator?:string
  proofMaxAgeMs?:number
}
export function integrationTuple(boundary:ValidatedBoundary,observations:Observation[]):VersionVector {
  return [{entityId:boundary.id,port:"boundary",view:"integration-policy",version:boundary.version,hash:digest(boundary)},...observations.map(item=>({entityId:item.taskId,port:"observed-output",view:"semantic-state",version:item.version,hash:digest(item)}))].sort((a,b)=>canonical(a).localeCompare(canonical(b)))
}
export class BoundaryValidation {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS boundary_validation_state(boundary_id TEXT PRIMARY KEY,version INTEGER NOT NULL,tuple_hash TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS boundary_preservation_state(boundary_id TEXT NOT NULL,version INTEGER NOT NULL,scope TEXT NOT NULL,tuple_hash TEXT NOT NULL,proof_id TEXT NOT NULL,proof_version INTEGER NOT NULL,PRIMARY KEY(boundary_id,version,scope,tuple_hash));
      CREATE INDEX IF NOT EXISTS boundary_preservation_exit ON boundary_preservation_state(boundary_id,version,scope);`)
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
      if(boundary.bindingsComplete) {
        if(!boundary.exits.length||new Set(boundary.exits).size!==boundary.exits.length||!boundary.bindingValidator||!Number.isSafeInteger(boundary.proofMaxAgeMs)||boundary.proofMaxAgeMs!<1)throw new Error("Complete boundary bindings require unique exits, a validator and finite proof lifetime")
        const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(boundary.bindingValidator)
        if(!match||!store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2])))throw new Error("Missing registered boundary binding validator")
        const members=new Set(boundary.members),crossing=this.runtime.graph.all().filter(edge=>members.has(edge.source.entityId)!==members.has(edge.target.entityId)).map(edge=>edge.id).sort()
        if(canonical([...boundary.exits].sort())!==canonical(crossing)||this.runtime.graph.all().filter(edge=>boundary.exits.includes(edge.id)).some(edge=>edge.completeness!=="verified"))throw new Error("Complete boundary exits must exactly match verified crossing edges")
      } else if(boundary.bindingValidator||boundary.proofMaxAgeMs)throw new Error("Incomplete boundaries cannot publish preservation proof settings")
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
    if(boundary.bindingsComplete)evidence.createObligation({entityId:boundary.id,tuple,kind:"boundary-bindings",mandatory:true,validators:[boundary.bindingValidator!],reason:[...boundary.authorization,...observations.flatMap(item=>item.evidence),proof]})
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
        this.publishPreservation(boundary)
        boundary.members.forEach(id=>this.runtime.completeObserved(id))
      }
    },1000)
  }
  private publishPreservation(boundary:ValidatedBoundary):void {
    if(!boundary.bindingsComplete)return
    const {store,evidence}=this.runtime,observations=this.observations(boundary)
    if(!observations)return
    const tuple=integrationTuple(boundary,observations),tupleHash=digest(tuple)
    const obligations=store.db.prepare("SELECT payload FROM validation_obligations WHERE entity_id=?").all(boundary.id).map(row=>JSON.parse(String(row.payload))).filter(item=>digest(item.tuple)===tupleHash&&["boundary-bindings",...INTEGRATION_DIMENSIONS.map(d=>`integration:${d}`)].includes(item.kind))
    if(obligations.length!==INTEGRATION_DIMENSIONS.length+1||obligations.some(item=>!evidence.independentlySatisfied(item)))return
    const refs=[...new Map(obligations.flatMap(item=>[...item.reason,...item.evidence]).map((ref:VersionRef)=>[canonical(ref),ref])).values()] as VersionRef[]
    const state={boundary:digest(boundary),observations:digest(observations),validatedDimensions:digest(INTEGRATION_DIMENSIONS)}
    for(const scope of CHANGE_SCOPES) {
      const id=`boundary-proof:${digest({boundary:{id:boundary.id,version:boundary.version},scope,tuple})}`
      const proof:BoundaryProof={id,boundary:{id:boundary.id,version:boundary.version},graphHash:this.runtime.graph.hash(),inputVector:tuple,scope,exits:[...boundary.exits].sort(),before:state,after:state,observableComplete:true,evidence:refs,validatorVersion:`${boundary.bindingValidator}+seven-dimension/v1`,expiresAt:Date.now()+boundary.proofMaxAgeMs!,verdict:"preserved"}
      store.put("boundary_proofs",id,1,proof)
      store.db.prepare("INSERT OR IGNORE INTO boundary_preservation_state VALUES(?,?,?,?,?,1)").run(boundary.id,boundary.version,scope,tupleHash,id)
    }
  }
  preserves(edge:CausalEdge,scope:ChangeScope):boolean {
    const {store,evidence}=this.runtime
    for(const row of store.db.prepare("SELECT b.payload,s.proof_id,s.proof_version FROM planning_boundaries b JOIN control_heads h ON h.collection='planning_boundaries' AND h.id=b.id AND h.version=b.version JOIN boundary_preservation_state s ON s.boundary_id=b.id AND s.version=b.version AND s.scope=? WHERE EXISTS (SELECT 1 FROM json_each(b.payload,'$.exits') WHERE value=?) ORDER BY b.id").all(scope,edge.id)) {
      const boundary=JSON.parse(String(row.payload)) as ValidatedBoundary,proof=store.get<BoundaryProof>("boundary_proofs",String(row.proof_id),Number(row.proof_version))
      const observations=this.observations(boundary)
      if(proof&&observations&&preservedExit({proof,boundary,edgeId:edge.id,scope,graphHash:this.runtime.graph.hash(),inputs:integrationTuple(boundary,observations),now:Date.now(),validEvidence:ref=>evidence.valid(ref)}))return true
    }
    return false
  }
  /** A complete, currently validated boundary is a conservative universe: all
   * of its members remain affected, while proven-preserved exits stop expansion. */
  containment(sources:string[],scopes:ChangeScope[],allowed:string[]):string[]|undefined {
    const permitted=new Set(allowed),edges=new Map(this.runtime.graph.all().map(edge=>[edge.id,edge]))
    const candidates=this.runtime.store.db.prepare("SELECT b.payload FROM planning_boundaries b JOIN control_heads h ON h.collection='planning_boundaries' AND h.id=b.id AND h.version=b.version ORDER BY b.id").all().map(row=>JSON.parse(String(row.payload)) as ValidatedBoundary)
      .filter(boundary=>boundary.bindingsComplete&&sources.every(id=>boundary.members.includes(id))&&boundary.members.every(id=>permitted.has(id)))
      .filter(boundary=>boundary.exits.every(id=>{const edge=edges.get(id);return !!edge&&scopes.every(scope=>this.preserves(edge,scope))}))
      .sort((a,b)=>a.members.length-b.members.length||a.id.localeCompare(b.id))
    return candidates[0]?.members.slice().sort()
  }
}
