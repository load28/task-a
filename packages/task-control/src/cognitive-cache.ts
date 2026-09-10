import type { ControlRuntime } from "./runtime.ts"
import type { ControlStore } from "./store.ts"
import type { ActivationGrant,AgentOutput,ContextManifest,RoleVersion } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import { CognitiveMemory,type CognitiveRecord } from "../../task-context/src/memory.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import { digest } from "./value.ts"
import { observedReadsReusable } from "./file-observations.ts"
import { currentInputVector } from "./completion.ts"
import { inputBoundaryEvidence } from "./input-boundary.ts"

type GrantInput=Omit<ActivationGrant,"id">
type CachedContent={key:string;sourceGrant:string;obligationId:string;output:AgentOutput}
function identity(store:ControlStore,grant:GrantInput) {
  const profile=grant.reuse?.requestedProfile??grant.profile
  if(grant.executionMode==="task"||grant.writeScopes.length||profile.level<2||profile.level===5||grant.allowedTools.some(tool=>!["task_graph_cognitive_context","task_graph_cognitive_read"].includes(tool)))return
  const role=store.get<RoleVersion>("role_versions",grant.role.id,grant.role.version),context=store.get<ContextManifest>("context_manifests",grant.context.id,grant.context.version)
  if(!role?.validators.length||!context)return
  const {id,version,hash,...semanticContext}=context
  const key=digest({taskId:grant.taskId,specHash:grant.specHash,inputVector:grant.inputVector,graphHash:grant.graphHash,role:grant.role,policy:grant.policy,profile,context:semanticContext,readScopes:grant.readScopes??[],allowedTools:grant.allowedTools})
  return {key,role,context,validatorVersion:digest(role.validators),schemaVersion:digest(role.outputSchema),dependencies:context.dependencyVector}
}
export function cachedResult(store:ControlStore,grant:GrantInput,pinned?:VersionRef):{record:VersionRef;output:AgentOutput}|undefined {
  if(!store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='cognitive_result_cache'").get())return
  const input=identity(store,grant)
  if(!input)return
  const sources=new EvidenceStore(store)
  for(const validator of input.role.validators) {
    const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(validator)
    const spec=match&&store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
    if(!spec||spec.authorization.some(ref=>!sources.valid(ref)))return
  }
  const row=pinned??store.db.prepare("SELECT id,version FROM cognitive_result_cache WHERE key=?").get(input.key)
  if(!row)return
  const ref={id:String(row.id),version:Number(row.version)},evidence=new EvidenceStore(store)
  const record=new CognitiveMemory(store).reuse(ref,{dependencies:input.dependencies,policy:grant.policy,role:grant.role,taskSpecHash:grant.specHash,validatorVersion:input.validatorVersion,schemaVersion:input.schemaVersion,now:Date.now(),validEvidence:ref=>evidence.valid(ref),validAssumption:()=>true})
  const content=record?.content as CachedContent|undefined
  const obligation=typeof content?.obligationId==="string"?evidence.obligation(content.obligationId):undefined
  if(!content||!obligation||!evidence.satisfied(obligation)||content.key!==input.key||content.output.taskId!==grant.taskId||content.output.requiresEscalation||content.output.unresolvedQuestions.length)return
  if(!observedReadsReusable(store,content.sourceGrant))return
  return {record:ref,output:content.output}
}

/** Exact, validated cognition reuse. It neither replays writes nor completes an
 * execution task. The new role output still has its own independent obligation. */
export class CacheFallbackBudgetUnavailable extends Error {}

export class CognitiveResultCache {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS cognitive_result_cache(key TEXT PRIMARY KEY,id TEXT NOT NULL,version INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS cognitive_cache_executions(grant_id TEXT PRIMARY KEY,record_id TEXT NOT NULL,record_version INTEGER NOT NULL,payload TEXT NOT NULL);`)
  }
  execute(id:string):AgentOutput|undefined {
    const {store,engine,admission}=this.runtime
    return store.atomic(()=>{
      const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(id)
      if(row?.state!=="issued")throw new Error("L0 reuse needs an unused grant")
      const grant=JSON.parse(String(row.payload)) as ActivationGrant
      if(grant.profile.level!==0||!grant.reuse||!engine.store.executionAllowed(grant.taskId))throw new Error("L0 execution has no pinned cognition record")
      const cached=cachedResult(store,grant,grant.reuse.record)
      if(!cached) {
        const reservation=store.db.prepare("SELECT account FROM budget_reservations WHERE id=?").get(id)!
        const profile=grant.reuse.requestedProfile,cost=profile.maxInputTokens+profile.maxOutputTokens
        const used=Number(store.db.prepare("SELECT coalesce(sum(CASE WHEN state='reserved' THEN reserved ELSE coalesce(spent,reserved) END),0) total FROM budget_reservations WHERE account=?").get(String(reservation.account))!.total)
        if(used+cost>grant.reuse.accountLimit)throw new CacheFallbackBudgetUnavailable("Cached evidence expired; the original model budget is unavailable")
        const {reuse,...original}=grant
        store.db.prepare("UPDATE budget_reservations SET reserved=? WHERE id=? AND state='reserved'").run(cost,id)
        store.db.prepare("UPDATE activation_grants SET payload=? WHERE id=? AND state='issued'").run(JSON.stringify({...original,profile}),id)
        store.event({id:`cognitive-cache-missed:${id}`,type:"CognitiveCacheMissed",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:id,record:reuse.record,requestedProfile:profile,reason:"Pinned cognition is no longer valid; original bounded model execution restored"}})
        return
      }
      const snapshot=engine.signals.capture(grant.taskId),worker=`cache:${grant.id}`,now=Date.now()
      admission.claim(id,{worker,specHash:snapshot.specHash,inputVector:currentInputVector(engine,grant.taskId),graphHash:this.runtime.graph.hash(),generation:grant.generation,now})
      admission.submit(id,worker,cached.output,{inputTokens:0,outputTokens:0,toolCalls:0,elapsedMs:Date.now()-now})
      store.db.prepare("INSERT INTO cognitive_cache_executions VALUES(?,?,?,?)").run(id,cached.record.id,cached.record.version,JSON.stringify({record:cached.record,outputHash:digest(cached.output),effectiveLevel:0,modelCalls:0}))
      store.event({id:`cognitive-reused:${id}`,type:"CognitiveResultReused",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:id,record:cached.record,effectiveLevel:0}})
      return cached.output
    })
  }
  ingest():number {
    const {store,evidence}=this.runtime
    return store.consume("validated-cognition-cache/v1","exact-context/v1",event=>{
      if(event.type==="AgentCompleted") {
        const {grantId,output}=event.payload as {grantId:string;output:AgentOutput}
        const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
        if(row?.state!=="completed")return
        const grant=JSON.parse(String(row.payload)) as ActivationGrant,input=identity(store,grant)
        if(!input)return
        // This same obligation is also used by the specialist router. Identical
        // immutable cause/tuple prevents duplicate or weaker validation paths.
        const content={grantId,output}
        const proof=evidence.put({id:`role-output:${grant.id}`,version:1,type:"agent",source:grant.worker!,producer:input.role.id,validatorVersion:"role-result/v1",timestamp:event.timestamp,content,contentHash:digest(content),inputVector:grant.inputVector,confidence:output.confidence,expiresAt:null})
        evidence.createObligation({entityId:grant.taskId,tuple:[...grant.inputVector,{entityId:grant.id,port:"role-result",view:"structured-output",version:1,hash:digest(content)}],kind:"role-output",mandatory:true,validators:input.role.validators,reason:[proof,...inputBoundaryEvidence(grant)]})
        return
      }
      if(event.type!=="ValidationSatisfied")return
      const obligation=evidence.obligation((event.payload as {obligationId:string}).obligationId)
      if(obligation?.kind!=="role-output"||!evidence.satisfied(obligation))return
      const id=obligation.tuple.find(input=>input.port==="role-result"&&input.view==="structured-output")?.entityId
      const row=id&&store.db.prepare("SELECT g.state,g.payload,r.payload result FROM activation_grants g JOIN agent_runs r ON r.grant_id=g.id WHERE g.id=? AND r.state='completed'").get(id)
      if(!row||row.state!=="completed")return
      const grant=JSON.parse(String(row.payload)) as ActivationGrant,output=JSON.parse(String(row.result)).output as AgentOutput,input=identity(store,grant)
      if(!input||grant.reuse||output.requiresEscalation||output.unresolvedQuestions.length)return
      const measured=store.db.prepare("SELECT state,payload FROM validation_jobs WHERE obligation_id=?").all(obligation.id)
      if(measured.length!==obligation.validators.length||measured.some(job=>job.state!=="passed"||!obligation.evidence.some(ref=>digest(ref)===digest(JSON.parse(String(job.payload)).evidence))))return
      const refs=[...obligation.reason,...obligation.evidence,...output.evidence,...input.role.evidence,...input.context.included.flatMap(item=>item.evidence)]
      if(refs.some(ref=>!evidence.valid(ref)))return
      const expiries=refs.map(ref=>evidence.require(ref).expiresAt).filter((value):value is number=>value!==null)
      const record:CognitiveRecord={id:`cognition-result:${grant.id}`,version:1,kind:"analysis",taskSpecHash:grant.specHash,policy:grant.policy,role:grant.role,validatorVersion:input.validatorVersion,schemaVersion:input.schemaVersion,assumptions:input.context.included.filter(item=>item.kind==="assumption").map(item=>({id:item.id,version:item.version})),conclusions:output.decisions,unresolvedQuestions:[],evidenceIndex:refs,dependencyVersion:input.dependencies,level:0,content:{key:input.key,sourceGrant:grant.id,obligationId:obligation.id,output} satisfies CachedContent,expiresAt:expiries.length?Math.min(...expiries):null}
      this.runtime.memory.save(record)
      store.db.prepare("INSERT INTO cognitive_result_cache VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET id=excluded.id,version=excluded.version").run(input.key,record.id,record.version)
    },1000)
  }
}
