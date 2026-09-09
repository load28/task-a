import type { TaskGraphEngine } from "../../task-engine/src/index.ts"
import { CausalGraph } from "../../task-causality/src/graph.ts"
import { CHANGE_SCOPES, type CausalEdge, type TaskExpectation, type Observation, type VersionRef } from "../../task-causality/src/model.ts"
import { predictionError, nextStability, validatePredictionPolicy, type PredictionPolicy } from "../../task-causality/src/prediction.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { ValidatorRegistry,type RegisteredValidator } from "../../task-evidence/src/registry.ts"
import { decodeSemanticOutput,aggregateSemanticOutputs } from "../../task-evidence/src/semantic-output.ts"
import { CognitiveMemory } from "../../task-context/src/memory.ts"
import { DecisionLedger } from "./decisions.ts"
import { AssumptionLedger } from "./assumptions.ts"
import { Admission } from "./admission.ts"
import { ScopedReplanning } from "./replanning.ts"
import { RequestController } from "./requests.ts"
import { PolicyRegression } from "../../task-policy/src/regression.ts"
import { PolicyReplay } from "../../task-policy/src/replay.ts"
import { AdversarialReview } from "./adversarial-review.ts"
import { OutcomeRecorder } from "./outcomes.ts"
import { BoundaryValidation } from "./boundary-validation.ts"
import { FileObservations } from "./file-observations.ts"
import { RoleRouter } from "./role-router.ts"
import { digest } from "./value.ts"
import type { SystemEvent } from "./store.ts"
import { randomUUID } from "node:crypto"
import { observationInputVector, controlCompletionMissing, type PinnedExpectation, type PredictionState } from "./completion.ts"

/** Durable projections operate without a model. Execution adapters attach separately. */
export class ControlRuntime {
  readonly engine:TaskGraphEngine
  readonly graph:CausalGraph
  readonly evidence:EvidenceStore
  readonly memory:CognitiveMemory
  readonly admission:Admission
  readonly assumptions:AssumptionLedger
  readonly decisions:DecisionLedger
  readonly validators:ValidatorRegistry
  readonly replanning:ScopedReplanning
  readonly requests:RequestController
  readonly roles:RoleRouter
  readonly files:FileObservations
  readonly boundaries:BoundaryValidation
  readonly adversarial:AdversarialReview
  readonly outcomes:OutcomeRecorder
  readonly policyReplay:PolicyReplay
  readonly policyRegression:PolicyRegression
  private draining=false
  constructor(engine:TaskGraphEngine) {
    this.engine=engine
    this.graph=new CausalGraph(engine.store.control)
    this.evidence=new EvidenceStore(engine.store.control)
    this.memory=new CognitiveMemory(engine.store.control)
    this.admission=new Admission(engine.store.control)
    this.validators=new ValidatorRegistry(engine.store.control)
    this.replanning=new ScopedReplanning(engine)
    this.requests=new RequestController(this)
    this.roles=new RoleRouter(this)
    this.files=new FileObservations(this.store,(taskId,input,evidence)=>{
      this.memory.invalidate(input.entityId,input.port,input.view,input.hash,`file-version:${input.entityId}:${input.version}`)
      this.engine.signals.invalidate(taskId,`Observed file input changed: ${input.entityId}@${input.version}`)
      this.store.event({id:`file-invalidated:${taskId}:${input.entityId}:${input.version}`,type:"FileInputInvalidated",entityId:taskId,correlationId:taskId,schemaVersion:1,timestamp:Date.now(),payload:{input,evidence}})
      const owner=this.store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(taskId)
      const request=owner&&this.requests.get(String(owner.request_id))
      if(request&&["executing","waiting","resuming"].includes(request.state)) {
        const causeId=`input-change:${request.id}:${taskId}:${input.entityId}:${input.version}`
        this.store.event({id:causeId,type:"InputObservationChanged",entityId:taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{taskIds:[taskId],reason:"observed input change",input,evidence}})
        this.requests.questions.supersedeForChange(request.id,causeId)
      }
    })
    this.boundaries=new BoundaryValidation(this)
    this.adversarial=new AdversarialReview(this)
    this.outcomes=new OutcomeRecorder(this)
    this.policyReplay=new PolicyReplay(this)
    this.policyRegression=new PolicyRegression(this)
    this.assumptions=new AssumptionLedger(this)
    this.decisions=new DecisionLedger(this)
    engine.store.beforeCommit(()=>{
      while(this.evidence.expire()===1000){ /* one durable event per actual expiry */ }
      while(this.drain()===1000){ /* drain the finite committed backlog */ }
      while(this.validators.ingest()===1000){ /* schedule L1 jobs without invoking a model */ }
      while(this.adversarial.ingest()===1000){ /* require L5 reviews before semantic completion can be adopted */ }
      while(this.ingestObservations()===1000){ /* adopt only current exact-input validator observations */ }
      while(this.boundaries.ingest()===1000){ /* measured tuples require seven independent obligations */ }
      while(this.files.ingest()===1000){ /* observed file ports bind only accepted role results */ }
      while(this.roles.ingest()===1000){ /* only measured evidence activates optional roles */ }
      while(this.adversarial.ingest()===1000){ /* L5 requires separate reviewers and a joint independent verdict */ }
      while(this.outcomes.ingest()===1000){ /* accepted costs retain unknown usefulness labels */ }
      while(this.policyReplay.ingest()===1000){ /* shadow decisions never authorize production effects */ }
      while(this.policyRegression.ingest()===1000){ /* only pinned validator verdicts can move a current policy head */ }
      while(this.assumptions.ingest()===1000){ /* independent proposition validation and source invalidation */ }
      while(this.decisions.ingest()===1000){ /* validated decisions retain their source and assumption lineage */ }
      while(this.memory.ingest()===1000){ /* retract only records that consumed the invalidated reference */ }
    })
  }
  get store(){return this.engine.store.control}
  drain(limit=1000):number {
    if(this.draining)return 0
    this.draining=true
    try {return this.store.atomic(()=>{
      // Changes without a legacy event are durable too. Coalesce only within the
      // transaction; the emitted snapshot identifies the state actually observed.
      for(const row of this.store.db.prepare("SELECT task_id FROM control_task_changes ORDER BY task_id").all()) {
        const task=this.engine.store.findTask(String(row.task_id))
        if(task)this.store.event({id:randomUUID(),type:"TaskStateCommitted",entityId:task.id,correlationId:task.id,schemaVersion:1,timestamp:Date.now(),payload:{task,snapshot:this.engine.signals.capture(task.id)}})
        this.store.db.prepare("DELETE FROM control_task_changes WHERE task_id=?").run(String(row.task_id))
      }
      return this.store.consume("graph-projection/v1","projection/v1",event=>this.project(event),limit)
    })}
    finally {this.draining=false}
  }
  private project(event:SystemEvent):void {
    const task=this.engine.store.findTask(event.entityId)
    if(!task)return
    const snapshot=this.engine.signals.capture(task.id)
    this.store.put("signal_snapshots",event.id,1,{taskId:task.id,eventId:event.id,snapshot,completeness:"unknown",reason:"legacy task inputs do not attest all process reads"})
    const inputIds=this.engine.signals.dependencies(task.id)
    const expected=new Set(inputIds.map(source=>digest({source,target:task.id,relation:"depends_on"})))
    for(const edge of this.graph.incoming(task.id)) {
      if(edge.relation==="depends_on"&&!expected.has(edge.id)&&this.store.db.prepare("SELECT 1 FROM control_projection_edges WHERE id=?").get(edge.id)) {
        this.store.db.prepare("DELETE FROM causal_edges WHERE id=?").run(edge.id)
      }
    }
    for(const edge of this.graph.outgoing(task.id)) {
      if(edge.relation==="implements_goal"&&edge.target.entityId!==task.parentId&&this.store.db.prepare("SELECT 1 FROM control_projection_edges WHERE id=?").get(edge.id))this.store.db.prepare("DELETE FROM causal_edges WHERE id=?").run(edge.id)
    }
    for(const source of inputIds)this.syncEdge(source,task.id,event)
    if(task.parentId)this.syncEdge(task.id,task.parentId,event,"implements_goal")
    this.store.db.prepare("INSERT INTO control_ready VALUES(?,?,?) ON CONFLICT(task_id) DO UPDATE SET event_id=excluded.event_id,eligible=excluded.eligible").run(task.id,event.id,Number(task.status==="ready"&&this.engine.store.executionAllowed(task.id)))
    if(["ARTIFACT_CREATED","ARTIFACT_VERSIONED","CONTRACT_UPDATED","REQUIREMENT_ADDED","TASK_FAILED"].includes(event.type)) {
      for(const edge of this.graph.outgoing(task.id)) {
        const consumer=this.engine.store.findTask(edge.target.entityId)
        if(!consumer)continue
        this.store.db.prepare("INSERT INTO control_ready VALUES(?,?,?) ON CONFLICT(task_id) DO UPDATE SET event_id=excluded.event_id,eligible=excluded.eligible").run(consumer.id,event.id,Number(consumer.status==="ready"&&this.engine.store.executionAllowed(consumer.id)))
      }
    }
  }
  private syncEdge(source:string,target:string,event:SystemEvent,relation:CausalEdge["relation"]="depends_on"):void {
    const id=digest({source,target,relation})
    const prior=this.graph.outgoing(source).find(e=>e.id===id)
    if(prior)return
    // A retired projection can return; immutable historical versions stay intact.
    const historical=this.store.db.prepare("SELECT version FROM causal_edge_versions WHERE id=? ORDER BY version DESC LIMIT 1").get(id)
    if(historical)this.store.db.prepare("INSERT INTO causal_edges VALUES(?,?)").run(id,Number(historical.version))
    else this.graph.put({id,version:1,source:{entityId:source,port:"outputs",view:"legacy-complete-input"},target:{entityId:target,port:"inputs",view:"legacy-complete-input"},relation,changeTypes:[...CHANGE_SCOPES],impactWeight:1,critical:true,completeness:"unknown",evidence:[],observedPropagationRate:{successes:0,trials:0,estimate:1,modelVersion:"unobserved-conservative/v1"}},0)
    this.store.db.prepare("INSERT OR IGNORE INTO control_projection_edges VALUES(?)").run(id)
  }
  pinExpectation(expectation:TaskExpectation,policy:PredictionPolicy,observationValidators:string[]=[]):void {
    this.store.atomic(()=>{
      validatePredictionPolicy(policy)
      if(expectation.id!==expectation.taskId)throw new Error("Expectation identity must match its task")
      const task=this.engine.requireTask(expectation.taskId)
      const attempt=this.engine.store.currentAttempt(task.id)
      if(attempt&&!["fenced","failed"].includes(attempt.state))throw new Error("Expectations must be fixed before execution; invalidate the previous attempt first")
      if(this.engine.signals.capture(task.id).specHash!==expectation.specHash)throw new Error("Expectation has a stale task specification")
      if(!expectation.evidence.length)throw new Error("Expectation requires source evidence")
      expectation.evidence.forEach(ref=>this.evidence.require(ref))
      if(new Set(observationValidators).size!==observationValidators.length)throw new Error("Duplicate observation validator")
      for(const validator of observationValidators) {
        const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(validator)
        const spec=match&&this.store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
        if(!spec||spec.output!=="semantic-state")throw new Error("Expectation needs a registered semantic-state validator")
      }
      this.store.put("task_expectations",expectation.id,expectation.version,{...expectation,predictionPolicy:policy,...(observationValidators.length?{observationValidators}:{})})
      this.store.advance("task_expectations",expectation.taskId,this.store.head("task_expectations",expectation.taskId),expectation.version)
    })
  }
  private ingestObservations():number {
    return this.store.consume("semantic-observation/v1","validator-output/v1",event=>{
      if(event.type!=="ValidatorPassed")return
      const input=event.payload as {obligationId:string;evidence:VersionRef}
      const obligation=this.evidence.obligation(input.obligationId)
      if(obligation?.kind!=="prediction-state"||!this.evidence.satisfied(obligation))return
      const version=this.store.head("task_expectations",event.entityId)
      const expectation=this.store.get<PinnedExpectation>("task_expectations",event.entityId,version)
      const proof=this.evidence.require(input.evidence)
      if(!expectation?.observationValidators?.includes(proof.validatorVersion))return
      try {
        const measured=obligation.evidence.map(ref=>this.evidence.require(ref))
        const semantic=aggregateSemanticOutputs(measured.map(item=>{
          const content=item.content as {state:unknown;criticalViolations:unknown}
          return decodeSemanticOutput(JSON.stringify({state:content.state,criticalViolations:content.criticalViolations}))
        }))
        const content={...semantic,observations:obligation.evidence,passed:true}
        const id=`semantic:${digest({obligation:obligation.id,evidence:obligation.evidence})}`
        const deadlines=measured.flatMap(item=>item.expiresAt===null?[]:[item.expiresAt])
        const observed=this.evidence.put({id,version:1,type:"runtime",source:"registered semantic validator aggregation",producer:"deterministic-semantic-aggregation",validatorVersion:"semantic-aggregation/v1",timestamp:Math.max(...measured.map(item=>item.timestamp)),content,contentHash:digest(content),inputVector:proof.inputVector,confidence:Math.min(...measured.map(item=>item.confidence)),expiresAt:deadlines.length?Math.min(...deadlines):null})
        this.observe({id,version:1,taskId:event.entityId,expectation:{id:event.entityId,version},state:semantic.state,evidence:[observed],inputVector:proof.inputVector},expectation.predictionPolicy,semantic.criticalViolations)
        this.completeObserved(event.entityId)
      }catch(error) {
        this.store.event({id:`observation-rejected:${event.id}`,type:"ObservationRejected",entityId:event.entityId,correlationId:event.correlationId,schemaVersion:1,timestamp:Date.now(),payload:{evidence:input.evidence,reason:error instanceof Error?error.message:"Invalid observation"}})
      }
    },1000)
  }
  completeObserved(taskId:string):void {
    const task=this.engine.requireTask(taskId),attempt=this.engine.store.currentAttempt(taskId)
    const row=attempt&&this.store.db.prepare("SELECT observation_id,observation_version FROM control_prediction_state WHERE task_id=? AND attempt_id=?").get(taskId,attempt.id)
    const observed=row&&this.store.get<Observation>("task_observations",String(row.observation_id),Number(row.observation_version))
    if(task.status==="implemented"&&observed&&!controlCompletionMissing(this.engine,[taskId]).length&&task.acceptanceCriteria.every(criterion=>observed.state.behavior?.[criterion.id]===true))this.engine.completeTask({taskId,attemptToken:attempt!.token,summary:"Registered validators confirmed the pinned expectations and integration obligations",verification:{passed:true,criteriaSatisfied:task.acceptanceCriteria.map(c=>c.id),evidence:`validator observation ${observed.id}@${observed.version}`}})
  }
  observe(observation:Observation,policy:PredictionPolicy,violations:string[]):VersionRef {
    return this.store.atomic(()=>{
      const expectation=this.store.get<PinnedExpectation>("task_expectations",observation.expectation.id,observation.expectation.version)
      if(!expectation)throw new Error("Unknown pinned expectation")
      const attempt=this.engine.store.currentAttempt(observation.taskId)
      const binding=attempt&&this.store.db.prepare("SELECT * FROM control_attempt_expectations WHERE attempt_id=?").get(attempt.id)
      if(!binding||attempt!.state==="fenced"||attempt!.state==="failed"||Number(binding.expectation_version)!==observation.expectation.version||!this.engine.store.executionAllowed(observation.taskId)||!this.engine.signals.matches(observation.taskId))throw new Error("Observation has no current expectation-bound attempt")
      if(digest(policy)!==digest(expectation.predictionPolicy))throw new Error("Prediction policy must match the pre-execution policy")
      if(digest(observation.inputVector)!==digest(observationInputVector(this.engine,observation.taskId)))throw new Error("Observation has stale input versions")
      if(!observation.evidence.length)throw new Error("Observation requires evidence")
      const proofs=observation.evidence.map(ref=>this.evidence.require(ref))
      if(!proofs.some(proof=>["runtime","test"].includes(proof.type)&&digest(proof.inputVector)===digest(observation.inputVector)&&digest((proof.content as {state?:unknown})?.state??null)===digest(observation.state)))throw new Error("Observation requires actual semantic state evidence for the pinned inputs")
      const error=predictionError(expectation,observation,policy,violations)
      const recorded=this.store.get("task_observations",observation.id,observation.version)
      if(recorded) {
        if(digest(recorded)!==digest(observation)||digest(this.store.get("prediction_errors",observation.id,observation.version))!==digest(error))throw new Error("Observation identity conflict")
        return {id:observation.id,version:observation.version}
      }
      this.store.put("task_observations",observation.id,observation.version,observation)
      this.store.put("prediction_errors",observation.id,observation.version,error)
      const prior=this.store.db.prepare("SELECT payload FROM control_prediction_state WHERE task_id=? AND attempt_id=?").get(observation.taskId,attempt!.id)
      const previous=prior?(JSON.parse(String(prior.payload)) as PredictionState).stability:"replanning"
      const restored=error.artifacts===0&&error.riskResidual===0&&!this.evidence.unresolved(observation.taskId).length
      const state:PredictionState={error,policy,stability:nextStability(previous,error,policy,restored)}
      this.store.db.prepare("INSERT INTO control_prediction_state VALUES(?,?,?,?,?) ON CONFLICT(task_id) DO UPDATE SET attempt_id=excluded.attempt_id,observation_id=excluded.observation_id,observation_version=excluded.observation_version,payload=excluded.payload").run(observation.taskId,attempt!.id,observation.id,observation.version,JSON.stringify(state))
      this.store.event({id:observation.id+":"+observation.version,type:"PredictionObserved",entityId:observation.taskId,correlationId:observation.taskId,schemaVersion:1,timestamp:Date.now(),payload:{observation:{id:observation.id,version:observation.version},error}})
      return {id:observation.id,version:observation.version}
    })
  }
  status(taskId?:string) {
    this.drain()
    const sql=taskId?" WHERE task_id=?":"",args=taskId?[taskId]:[]
    return {
      ready:this.store.db.prepare(`SELECT task_id,event_id,eligible FROM control_ready${sql}`).all(...args),
      runs:this.store.db.prepare(`SELECT id,task_id,state FROM agent_runs${sql}`).all(...args),
      decisions:this.store.db.prepare(`SELECT payload FROM activation_decisions${sql} ORDER BY rowid DESC LIMIT 50`).all(...args).map(r=>JSON.parse(String(r.payload))),
      unresolved:taskId?this.evidence.unresolved(taskId):this.store.db.prepare("SELECT DISTINCT entity_id FROM validation_obligations WHERE mandatory=1").all().flatMap(row=>this.evidence.unresolved(String(row.entity_id))),
      consumer:this.store.db.prepare("SELECT sequence FROM event_consumers WHERE id='graph-projection/v1'").get()??null,
    }
  }
}
