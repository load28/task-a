import type { ControlRuntime } from "./runtime.ts"
import type { ControlStore } from "./store.ts"
import type { ControllerProgram } from "./requests.ts"
import type { ActivationGrant,AgentOutput,RoleVersion } from "../../task-cognition/src/model.ts"
import { Ajv } from "ajv"
import type { TaskExpectation,VersionRef } from "../../task-causality/src/model.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { decodeSemanticOutput } from "../../task-evidence/src/semantic-output.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { withTaskAdmission } from "./task-admission.ts"
import { digest } from "./value.ts"
import { selectWorkerPrecision } from "./worker-precision.ts"
import { currentInputVector,attemptInputVector } from "./completion.ts"

type Input=Omit<ActivationGrant,"id">
type Preflight={taskId:string;program:VersionRef;expectation:TaskExpectation;specHash:string;inputVector:ActivationGrant["inputVector"];obligationId:string}
const result=(taskId:string,evidence:VersionRef[]):AgentOutput=>({taskId,findings:["Registered deterministic observations match every pinned expected dimension"],decisions:[],risks:[],unresolvedQuestions:[],evidence,proposedTasks:[],confidence:1,requiresEscalation:false})
export function preflightResult(store:ControlStore,id:string,input?:Input):{evidence:VersionRef[];elapsedMs:number}|undefined {
  if(!store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_preflights'").get())return
  const row=store.db.prepare("SELECT payload FROM task_preflights WHERE id=?").get(id)
  if(!row)return
  const value=JSON.parse(String(row.payload)) as Preflight,evidence=new EvidenceStore(store)
  const program=store.get<ControllerProgram>("controller_programs",value.program.id,value.program.version)
  if(!program?.deterministicPreflight||program.authorization.some(ref=>!evidence.valid(ref)))return
  if(input&&(input.executionMode!=="task"||input.taskId!==value.taskId||input.specHash!==value.specHash||digest(input.inputVector)!==digest(value.inputVector)||digest(input.role)!==digest(program.worker.role)||digest(input.policy)!==digest(program.policy)||digest(input.profile)!==digest(program.worker.profile)))return
  if(store.head("task_expectations",value.taskId)!==value.expectation.version)return
  const obligation=evidence.obligation(value.obligationId)
  if(!obligation||!evidence.satisfied(obligation)||digest(obligation.validators)!==digest(program.observationValidators))return
  const expected={artifacts:value.expectation.expectedArtifacts,contract:value.expectation.expectedInterface,behavior:value.expectation.expectedBehavior,dependencies:value.expectation.expectedDependencies,goals:value.expectation.expectedGoals,risk:value.expectation.expectedRisk}
  const jobs=store.db.prepare("SELECT validator,state,payload FROM validation_jobs WHERE obligation_id=?").all(obligation.id)
  if(jobs.length!==program.observationValidators.length)return
  let elapsedMs=0
  try {
    for(const job of jobs) {
      if(job.state!=="passed"||!program.observationValidators.includes(String(job.validator)))return
      const ref=JSON.parse(String(job.payload)).evidence as VersionRef
      if(!obligation.evidence.some(item=>digest(item)===digest(ref)))return
      const receipt=(evidence.require(ref).content as {receipt:ValidationReceipt}).receipt
      const spec=store.get<RegisteredValidator>("validator_versions",receipt.validator.id,receipt.validator.version)
      if(!spec||spec.output!=="semantic-state"||spec.authorization.some(ref=>!evidence.valid(ref))||receipt.truncated||receipt.timedOut||Date.now()-receipt.startedAt>program.deterministicPreflight.maxAgeMs)return
      const actual=decodeSemanticOutput(receipt.stdout)
      if(actual.criticalViolations.length||digest(actual.state)!==digest(expected))return
      elapsedMs+=receipt.finishedAt-receipt.startedAt
    }
    if(!Number.isFinite(elapsedMs)||elapsedMs<0||elapsedMs>program.worker.profile.timeoutMs)return
    const refs=[...obligation.reason,...obligation.evidence],role=store.get<RoleVersion>("role_versions",program.worker.role.id,program.worker.role.version)
    if(!role||!new Ajv({strict:false}).compile(role.outputSchema)(result(value.taskId,refs)))return
    return {evidence:refs,elapsedMs}
  }catch{return}
}

/** A readonly observation may prove the pinned task already satisfied. Unknown
 * results proceed to the original bounded worker; they never complete a task. */
export class TaskPreflight {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime;runtime.store.db.exec("CREATE TABLE IF NOT EXISTS task_preflights(id TEXT PRIMARY KEY,task_id TEXT NOT NULL,payload TEXT NOT NULL)")}
  check(taskId:string,program:ControllerProgram):{state:"pending"|"unresolved"}|{state:"solved";id:string} {
    return this.runtime.store.atomic(()=>this.checkCurrent(taskId,program))
  }
  private checkCurrent(taskId:string,program:ControllerProgram):{state:"pending"|"unresolved"}|{state:"solved";id:string} {
    if(!program.deterministicPreflight)return {state:"unresolved"}
    const {engine,store,evidence}=this.runtime,snapshot=engine.signals.capture(taskId)
    if(digest(store.get("controller_programs",program.id,program.version))!==digest(program))throw new Error("Preflight policy is not the registered program")
    if(program.workerPrecision&&digest(selectWorkerPrecision(store,program,taskId).profile)!==digest(program.worker.profile))return {state:"unresolved"}
    const expectation=store.get<TaskExpectation>("task_expectations",taskId,store.head("task_expectations",taskId))!
    const inputVector=currentInputVector(engine,taskId)
    const identity={taskId,program:{id:program.id,version:program.version},expectation,specHash:snapshot.specHash,inputVector},id=digest(identity)
    if(!store.db.prepare("SELECT 1 FROM task_preflights WHERE id=?").get(id)) {
      const proof=evidence.put({id:`task-preflight:${id}`,version:1,type:"runtime",source:"registered deterministic preflight",producer:"task-preflight",validatorVersion:"task-preflight/v1",timestamp:Date.now(),content:identity,contentHash:digest(identity),inputVector,confidence:1,expiresAt:null})
      const obligation=evidence.createObligation({entityId:taskId,tuple:[...inputVector,{entityId:taskId,port:"preflight",view:"expectation",version:expectation.version,hash:digest(expectation)}],kind:"task-preflight",mandatory:false,validators:program.observationValidators,reason:[proof,...program.authorization,...expectation.evidence]})
      store.db.prepare("INSERT INTO task_preflights VALUES(?,?,?)").run(id,taskId,JSON.stringify({...identity,obligationId:obligation.id}))
      this.runtime.validators.schedule(obligation.id)
      return {state:"pending"}
    }
    if(preflightResult(store,id))return {state:"solved",id}
    const value=JSON.parse(String(store.db.prepare("SELECT payload FROM task_preflights WHERE id=?").get(id)!.payload)) as Preflight
    const jobs=store.db.prepare("SELECT state FROM validation_jobs WHERE obligation_id=?").all(value.obligationId)
    return {state:jobs.some(job=>["pending","deferred","running"].includes(String(job.state)))?"pending":"unresolved"}
  }
  execute(grant:ActivationGrant):void {
    this.runtime.store.atomic(()=>this.executeCurrent(grant))
  }
  private executeCurrent(grant:ActivationGrant):void {
    const {engine,store,admission}=this.runtime
    const profile=grant.preflight!.requestedProfile
    const proof=preflightResult(store,grant.preflight!.id,{...grant,profile})
    if(grant.profile.level!==1||!proof)throw new Error("Deterministic task proof is no longer current")
    const worker=`preflight:${grant.id}`,scheduler=new TaskScheduler(engine,1),snapshot=engine.signals.capture(grant.taskId)
    withTaskAdmission(engine,grant.id,worker,()=>scheduler.claim(grant.taskId,{agent:"deterministic-preflight",sessionId:worker}))
    admission.claim(grant.id,{worker,specHash:snapshot.specHash,inputVector:attemptInputVector(engine,grant.taskId),graphHash:this.runtime.graph.hash(),generation:grant.generation,now:Date.now()})
    admission.submit(grant.id,worker,result(grant.taskId,proof.evidence),{inputTokens:0,outputTokens:0,toolCalls:0,elapsedMs:proof.elapsedMs})
    engine.completeTask({taskId:grant.taskId,attemptToken:engine.store.currentAttempt(grant.taskId)!.token,summary:"Pinned expectations already satisfied by registered deterministic observations; final validation remains required"})
    scheduler.release(grant.taskId,true)
    store.event({id:`task-preflight-completed:${grant.id}`,type:"DeterministicTaskSatisfied",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{grantId:grant.id,preflight:grant.preflight!.id,effectiveLevel:1,modelCalls:0,evidence:proof.evidence}})
  }
}
