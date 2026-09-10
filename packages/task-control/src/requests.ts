import { randomUUID } from "node:crypto"
import type { PlanNode } from "#task-domain"
import type { ControlRuntime } from "./runtime.ts"
import type { VersionRef, TaskExpectation } from "../../task-causality/src/model.ts"
import type { RoleVersion, ReasoningProfile, AgentOutput, Signals, ActivationGrant, ContextBudget, ContextSelector } from "../../task-cognition/src/model.ts"
import { FEATURES } from "../../task-cognition/src/model.ts"
import { validateProfile } from "../../task-cognition/src/precision.ts"
import { validatePredictionPolicy, type PredictionPolicy } from "../../task-causality/src/prediction.ts"
import { decodeSemanticOutput } from "../../task-evidence/src/semantic-output.ts"
import { controlledContext } from "../../task-context/src/controlled.ts"
import { canonical, digest } from "./value.ts"
import { controlCompletionMissing,currentInputVector } from "./completion.ts"
import { LocalRepairs } from "./local-repairs.ts"
import { AdmissionBudgetUnavailableError } from "./admission.ts"
import { INTEGRATION_DIMENSIONS } from "../../task-evidence/src/integration.ts"
import { selectWorkerPrecision } from "./worker-precision.ts"
import { SpecialistQuestions } from "./specialist-questions.ts"
import { WorkerQuestions } from "./worker-questions.ts"
import { RequestQuestions } from "./request-questions.ts"
import { RegionalRepairs } from "./regional-repairs.ts"
import { assertControlledPlanActivation } from "./plan-admission.ts"
import type { RoutineProposalItem,RoutineUse } from "./routines.ts"
import { inputBoundaryEvidence } from "./input-boundary.ts"
import { RequestPermissions } from "./request-permissions.ts"
import { PolicyApplications } from "./policy-applications.ts"
import type { PolicyBundle } from "../../task-policy/src/index.ts"

export interface PermissionTransition {id:string;kind:"capability"|"quota";permission:string;patterns:string[];program:VersionRef;authorization:VersionRef[]}
export interface ProgramRole {role:VersionRef;profile:ReasoningProfile;contextPolicy?:{budget:ContextBudget;requiredContext:ContextSelector[]}}
export interface PolicyControls {
  requiredSpecialistRoles?:string[];cacheReuse?:"validated"|"disabled";minimumWorkerProfile?:ReasoningProfile
  propagationThreshold?:number;requireCompleteBoundary?:boolean;boundaryBindingValidator?:string;boundaryProofMaxAgeMs?:number;allowedRoutines?:VersionRef[]
}

export interface ControllerProgram {
  id:string; version:number; authorization:VersionRef[]; policy:VersionRef
  planner:ProgramRole; worker:ProgramRole
  specialists?:ProgramRole[]
  planValidators:string[]; observationValidators:string[]; predictionPolicy:PredictionPolicy
  readScopes:string[]; writeScopes:string[]; maxTasks:number; grantLifetimeMs:number
  account:string; tokenLimit:number|null
  workerPrecision?:{profiles:ReasoningProfile[];failureThresholds:Array<{minimumFailures:number;profileId:string}>}
  adversarialValidator?:string
  integrationValidators?:Record<typeof INTEGRATION_DIMENSIONS[number],string>
  observedInputs?:VersionRef[]
  fileObservation?:{maxFiles:number;maxBytes:number}
  maxClarifications?:number
  maxInputReplans?:number
  deterministicPreflight?:{maxAgeMs:number}
  permissionTransitions?:PermissionTransition[]
  maxLocalRepairs?:number
  policyControls?:PolicyControls
  replanner?:{role:VersionRef;profile:ReasoningProfile;validators:string[];maxAttempts:number;selection?:{validator:string;candidateLimit:number;evaluationBudget:number;costUnit:string;calibration?:{version:number;minimumSamples:number;maximumRelativeError:number;inputTokensPerUnit:number;outputTokensPerUnit:number;toolCallsPerUnit:number;elapsedMsPerUnit:number}}}
}
type Expected = Omit<TaskExpectation,"id"|"version"|"taskId"|"specHash"|"evidence">
export interface ProposedTask { node:PlanNode; expectation:Expected }
export interface ControlledRequest {
  id:string; sessionId:string; text:string; planOnly:boolean; taskId:string; program?:VersionRef
  evidence:VersionRef; state:"pending"|"resuming"|"planning"|"validating"|"executing"|"waiting"|"completed"|"failed"|"cancelled"
  reason?:string; plannerGrant?:string; planId?:string; obligationId?:string; proposal?:ProposedTask[]
  infrastructureRetry?:{failedGrantId:string;generation:number}
  clarifications?:Array<{questionId:string;questions:string[];answers:string[][];evidence:VersionRef;source:VersionRef}>
  permissionChanges?:Array<{permissionId:string;from:VersionRef;to:VersionRef;reply:"once"|"reject";evidence:VersionRef;source:VersionRef}>
  parentId?:string; amendments?:Array<{text:string;evidence:VersionRef}>
  inputReplan?:{cause:string;evidence:VersionRef;previousGrant:string;generation:number;pending:boolean;superseded:string[]}
  routineUses?:RoutineUse[]
  policyBundle?:PolicyBundle
}
const allowedTools=new Set(["task_graph_cognitive_context","task_graph_cognitive_list","task_graph_cognitive_read","task_graph_cognitive_write"])
const validScope=(scope:string)=>scope==="."||!!scope&&!scope.startsWith("/")&&!scope.includes("\\")&&!scope.includes("\0")&&!scope.split("/").some(p=>["",".","..",".git",".codex",".agents",".task-agent"].includes(p))
const within=(scope:string,allowed:string[])=>allowed.some(root=>root==="."||scope===root||scope.startsWith(root+"/"))

/** A request is a durable cause, never an unrestricted manager prompt. */
export class RequestController {
  readonly runtime:ControlRuntime
  readonly repairs:LocalRepairs
  readonly regional:RegionalRepairs
  readonly questions:RequestQuestions
  readonly permissions:RequestPermissions
  readonly workerQuestions:WorkerQuestions
  readonly specialistQuestions:SpecialistQuestions
  readonly policies:PolicyApplications
  constructor(runtime:ControlRuntime) {
    this.runtime=runtime
    this.policies=new PolicyApplications(runtime)
    this.store.db.exec(`CREATE TABLE IF NOT EXISTS control_requests(id TEXT PRIMARY KEY,session_id TEXT NOT NULL,task_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS control_request_session ON control_requests(session_id);
      CREATE INDEX IF NOT EXISTS control_request_task ON control_requests(task_id);
      CREATE TABLE IF NOT EXISTS control_request_tasks(request_id TEXT NOT NULL,task_id TEXT NOT NULL,node_id TEXT NOT NULL,PRIMARY KEY(request_id,task_id));`)
    this.store.db.exec("CREATE TABLE IF NOT EXISTS request_pre_admission_retries(request_id TEXT PRIMARY KEY,failed_grant_id TEXT NOT NULL,retried_at INTEGER NOT NULL)")
    this.store.db.exec("CREATE TABLE IF NOT EXISTS request_plan_admissions(plan_id TEXT PRIMARY KEY,request_id TEXT NOT NULL,state TEXT NOT NULL)")
    this.store.db.exec(`CREATE TABLE IF NOT EXISTS request_draft_replacements(old_plan_id TEXT PRIMARY KEY,request_id TEXT NOT NULL,old_obligation_id TEXT NOT NULL,new_plan_id TEXT,new_obligation_id TEXT,cause TEXT NOT NULL,evidence TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS request_draft_replacement_obligation ON request_draft_replacements(old_obligation_id);
      CREATE INDEX IF NOT EXISTS request_draft_replacement_pending ON request_draft_replacements(request_id,new_plan_id);`)
    this.questions=new RequestQuestions(this)
    this.permissions=new RequestPermissions(this)
    this.workerQuestions=new WorkerQuestions(this)
    this.specialistQuestions=new SpecialistQuestions(this)
    this.repairs=new LocalRepairs(this)
    this.regional=new RegionalRepairs(this)
  }
  get store(){return this.runtime.store}
  register(program:ControllerProgram):void {
    if(program.policyControls)throw new Error("Policy controls are controller-derived and cannot be registered directly")
    if(new Set((program.permissionTransitions??[]).map(item=>item.id)).size!==(program.permissionTransitions??[]).length)throw new Error("Permission transition identities must be unique")
    for(const transition of program.permissionTransitions??[]) {
      if(!transition.id||!["capability","quota"].includes(transition.kind)||!transition.permission||!transition.patterns.length||transition.patterns.some(pattern=>!pattern.trim())||!transition.authorization.length)throw new Error("Permission transition must be explicit and bounded")
      transition.authorization.forEach(ref=>{if(!["user","code"].includes(this.runtime.evidence.require(ref).type))throw new Error("Permission transition requires operator authorization")})
      const target=this.store.get<ControllerProgram>("controller_programs",transition.program.id,transition.program.version)
      if(!target)throw new Error("Permission transition target must be registered first")
      const currentLimit=program.tokenLimit??Infinity,targetLimit=target.tokenLimit??Infinity
      if(transition.kind==="quota") {
        if(target.account!==program.account||targetLimit<=currentLimit||digest(target.policy)===digest(program.policy))throw new Error("Quota transition requires a higher limit under a new registered policy for the same account")
      } else if(targetLimit>currentLimit)throw new Error("Capability transition cannot increase the account quota")
    }
    if(program.deterministicPreflight&&(!Number.isSafeInteger(program.deterministicPreflight.maxAgeMs)||program.deterministicPreflight.maxAgeMs<1||program.worker.profile.level===5))throw new Error("Deterministic preflight requires a finite observation lifetime and cannot bypass L5 review")
    if(program.fileObservation&&![program.fileObservation.maxFiles,program.fileObservation.maxBytes].every(value=>Number.isSafeInteger(value)&&value>0))throw new Error("Native input observation needs explicit finite budgets")
    if(program.maxClarifications!==undefined&&(!Number.isSafeInteger(program.maxClarifications)||program.maxClarifications<0))throw new Error("Clarification quota must be explicit and nonnegative")
    if(program.maxInputReplans!==undefined&&(!Number.isSafeInteger(program.maxInputReplans)||program.maxInputReplans<0))throw new Error("Input replanning quota must be explicit and nonnegative")
    if(program.maxLocalRepairs!==undefined&&(!Number.isSafeInteger(program.maxLocalRepairs)||program.maxLocalRepairs<0))throw new Error("Local repair quota must be explicit and nonnegative")
    if(program.replanner&&(!Number.isSafeInteger(program.replanner.maxAttempts)||program.replanner.maxAttempts<1||!program.replanner.validators.length||program.maxLocalRepairs===undefined))throw new Error("Regional repair requires explicit local/region quotas and validators")
    if(program.replanner?.selection) {
      const selection=program.replanner.selection
      if(!selection.costUnit||![selection.candidateLimit,selection.evaluationBudget].every(value=>Number.isSafeInteger(value)&&value>0))throw new Error("Region selection requires explicit finite budgets and a common cost unit")
      const calibration=selection.calibration
      if(calibration&&(!Number.isSafeInteger(calibration.version)||calibration.version<1||!Number.isSafeInteger(calibration.minimumSamples)||calibration.minimumSamples<1||!Number.isFinite(calibration.maximumRelativeError)||calibration.maximumRelativeError<0||[calibration.inputTokensPerUnit,calibration.outputTokensPerUnit,calibration.toolCallsPerUnit,calibration.elapsedMsPerUnit].some(value=>!Number.isFinite(value)||value<=0)))throw new Error("Region selection cost calibration requires a version, sample bound, error bound, and positive unit conversions")
    }
    for(const ref of program.observedInputs??[])this.runtime.inputs.definition(ref)
    validatePredictionPolicy(program.predictionPolicy)
    if(!program.id||!Number.isSafeInteger(program.version)||program.version<1||!program.authorization.length||!program.planValidators.length||!program.observationValidators.length||!program.account||(program.tokenLimit!==null&&(!Number.isSafeInteger(program.tokenLimit)||program.tokenLimit<1))||!Number.isSafeInteger(program.maxTasks)||program.maxTasks<1||!Number.isSafeInteger(program.grantLifetimeMs)||program.grantLifetimeMs<1)throw new Error("Incomplete controller program")
    if([...program.readScopes,...program.writeScopes].some(scope=>!validScope(scope)))throw new Error("Invalid program file scope")
    for(const ref of program.authorization)if(!["user","code"].includes(this.runtime.evidence.require(ref).type))throw new Error("Program requires operator authorization")
    if(!this.store.get("policy_versions",program.policy.id,program.policy.version))throw new Error("Program policy is not registered")
    if(new Set((program.specialists??[]).map(entry=>entry.role.id)).size!==(program.specialists??[]).length||program.specialists?.some(entry=>[program.planner.role.id,program.worker.role.id].includes(entry.role.id)))throw new Error("Specialist identities must be independent of primary roles")
    for(const entry of [program.planner,program.worker,...(program.specialists??[]),...(program.replanner?[program.replanner]:[])]) {
      validateProfile(entry.profile)
      if(entry.profile.level<2)throw new Error("Request roles require a model profile")
      const role=this.store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)
      if(!role||!this.runtime.roleLifecycle.executable(entry.role,ref=>this.runtime.evidence.valid(ref))||role.allowedTools.some(tool=>!allowedTools.has(tool)))throw new Error("Request role exceeds the cognitive gateway or lacks lifecycle certification")
      if(program.specialists?.includes(entry)&&(role.allowedTools.includes("task_graph_cognitive_write")||!role.validators.length))throw new Error("Specialists require read-only capabilities and independent result validators")
    }
    if((program.specialists??[]).some(entry=>entry.profile.level===5))throw new Error("Independent L5 reviewer roles cannot recursively require L5")
    const workerProfiles=[program.worker.profile,...(program.workerPrecision?.profiles??[])]
    if(program.workerPrecision) {
      const {profiles,failureThresholds}=program.workerPrecision
      if(!profiles.length||!failureThresholds.length||new Set(profiles.map(profile=>profile.id)).size!==profiles.length)throw new Error("Adaptive precision needs unique registered profiles and explicit thresholds")
      let count=0,level=program.worker.profile.level
      for(const threshold of failureThresholds) {
        const profile=profiles.find(profile=>profile.id===threshold.profileId)
        if(!profile||!Number.isSafeInteger(threshold.minimumFailures)||threshold.minimumFailures<=count||profile.level<level)throw new Error("Precision escalation must preserve increasing failure thresholds and nondecreasing levels")
        count=threshold.minimumFailures;level=profile.level
      }
      for(const profile of profiles){validateProfile(profile);if(profile.level<2)throw new Error("Adaptive worker execution needs a supported model profile")}
    }
    const l5Profiles=[program.planner.profile,program.worker.profile,...(program.replanner?[program.replanner.profile]:[]),...(program.workerPrecision?.profiles??[])].filter(profile=>profile.level===5)
    if(l5Profiles.some(profile=>!program.adversarialValidator||profile.independentRoles.some(id=>!program.specialists?.some(entry=>entry.role.id===id&&entry.profile.level<5))))throw new Error("L5 requires separately registered read-only reviewers and a joint validator")
    if(program.integrationValidators&&INTEGRATION_DIMENSIONS.some(dimension=>!program.integrationValidators![dimension]))throw new Error("Integration policy requires all seven dimensions")
    for(const validator of [...(program.adversarialValidator?[program.adversarialValidator]:[]),...(program.replanner?.selection?[program.replanner.selection.validator]:[]),...Object.values(program.integrationValidators??{}),...program.planValidators,...program.observationValidators,...(program.replanner?.validators??[]),...(program.specialists??[]).flatMap(entry=>this.store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!.validators)]) {
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(validator)
      const spec=match&&this.store.get<{output?:string}>("validator_versions",match[1]!,Number(match[2]))
      if(!spec||program.observationValidators.includes(validator)&&spec.output!=="semantic-state")throw new Error("Program needs registered validators")
    }
    this.store.put("controller_programs",program.id,program.version,program)
  }
  submit(input:{id:string;sessionId:string;text:string;planOnly:boolean;program?:VersionRef}):ControlledRequest {
    return this.store.atomic(()=>{
      const existing=this.get(input.id)
      if(existing) {
        if(existing.text!==input.text||existing.sessionId!==input.sessionId||existing.planOnly!==input.planOnly)throw new Error("Request identity conflict")
        return existing
      }
      if(!input.id||!input.sessionId||!input.text.trim())throw new Error("Empty request")
      const task=this.runtime.engine.createTask({title:input.text.slice(0,160),goal:input.text,category:"diagnostic",writeScopes:[]})
      this.store.db.prepare("INSERT INTO controlled_tasks VALUES(?,?)").run(task.id,input.id)
      const content={text:input.text,planOnly:input.planOnly}
      const evidence=this.runtime.evidence.put({id:`request:${input.id}`,version:1,type:"user",source:input.sessionId,producer:"request-controller",validatorVersion:"request-intake/v1",timestamp:Date.now(),content,contentHash:digest(content),confidence:1,inputVector:[],expiresAt:null})
      const request:ControlledRequest={...input,taskId:task.id,evidence,state:"pending",policyBundle:this.policies.snapshot(input.id)}
      this.store.db.prepare("INSERT INTO control_requests VALUES(?,?,?,?,?)").run(input.id,input.sessionId,task.id,request.state,canonical(request))
      this.store.event({id:input.id,type:"RequestSubmitted",entityId:task.id,correlationId:input.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:input.id,evidence}})
      return request
    })
  }
  get(id:string):ControlledRequest|undefined {
    const row=this.store.db.prepare("SELECT payload FROM control_requests WHERE id=?").get(id)
    return row?JSON.parse(String(row.payload)):undefined
  }
  steer(parentId:string,input:{id:string;sessionId:string;text:string;planOnly:boolean;program?:VersionRef}):ControlledRequest {
    return this.store.atomic(()=>{
      const existing=this.get(input.id)
      if(existing) {
        if(existing.parentId!==parentId||existing.sessionId!==input.sessionId||existing.amendments?.at(-1)?.text!==input.text||existing.planOnly!==input.planOnly)throw new Error("Steering identity conflict")
        return existing
      }
      const parent=this.get(parentId)
      if(!parent||parent.state!=="cancelled")throw new Error("Steering requires a stopped prior request")
      const request=this.submit(input)
      request.parentId=parentId;request.text=parent.text;if(parent.clarifications)request.clarifications=parent.clarifications;request.amendments=[...(parent.amendments??[]),{text:input.text,evidence:request.evidence}]
      if(parent.planId&&!input.planOnly) {
        request.planId=parent.planId;request.proposal=parent.proposal;request.routineUses=parent.routineUses;request.obligationId=parent.obligationId
        request.state="executing"
        this.store.db.prepare("INSERT INTO control_request_tasks SELECT ?,task_id,node_id FROM control_request_tasks WHERE request_id=?").run(request.id,parent.id)
        this.store.db.prepare("UPDATE request_plan_admissions SET request_id=? WHERE plan_id=?").run(request.id,parent.planId)
        this.store.event({id:`request-change:${request.id}`,type:"RequestChangeRequested",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:request.id,evidence:[parent.evidence,request.evidence],reason:"explicit user steering",taskIds:this.tasks(request.id)}})
      }
      this.runtime.engine.store.updateTask({...this.runtime.engine.requireTask(request.taskId),goal:parent.text})
      this.save(request);return request
    })
  }
  private save(request:ControlledRequest):void {this.store.db.prepare("UPDATE control_requests SET state=?,payload=? WHERE id=?").run(request.state,canonical(request),request.id)}
  /** A changed observed input authorizes only a bounded new planning episode.
   * It is not a retry of a transport failure or permission to reuse a stale plan. */
  observedInputChanged(id:string,cause:string,evidence:VersionRef):void {
    this.store.atomic(()=>this.changeObservedInput(id,cause,evidence))
  }
  private changeObservedInput(id:string,cause:string,evidence:VersionRef):void {
    const request=this.get(id)
    if(!request?.plannerGrant||!["planning","validating","waiting","pending"].includes(request.state))return
    if(request.planId) {
      const plan=this.runtime.engine.store.findWorkPlan(request.planId)
      if(!plan||plan.activeRevision||plan.rootTaskId||plan.state!=="awaiting_approval"||plan.currentRevision!==1||!request.obligationId)return
      if(this.runtime.engine.store.planLinks(plan.id,1).length)return
      this.runtime.evidence.require(evidence)
      this.store.db.prepare("INSERT INTO request_draft_replacements VALUES(?,?,?,NULL,NULL,?,?)").run(plan.id,id,request.obligationId,cause,canonical(evidence))
      this.runtime.engine.store.updateWorkPlan({...plan,state:"cancelled",updatedAt:new Date().toISOString()})
      const revision=this.runtime.engine.store.findPlanRevision(plan.id,1)!
      this.runtime.engine.store.updatePlanRevision({...revision,state:"superseded"})
      this.store.db.prepare("UPDATE request_plan_admissions SET state='superseded' WHERE plan_id=?").run(plan.id)
      delete request.planId;delete request.obligationId;delete request.proposal;delete request.routineUses
      this.save(request)
      this.store.event({id:`draft-retired:${plan.id}`,type:"RequestDraftSuperseded",entityId:request.taskId,correlationId:id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{requestId:id,planId:plan.id,cause,evidence}})
    }
    const program=request.program&&this.store.get<ControllerProgram>("controller_programs",request.program.id,request.program.version),previous=request.inputReplan
    if(previous?.cause===cause)return
    this.runtime.evidence.require(evidence)
    const generation=previous?.pending?previous.generation:(previous?.generation??0)+1
    request.inputReplan={cause,evidence,previousGrant:request.plannerGrant,generation,pending:true,superseded:[...new Set([...(previous?.superseded??[]),request.plannerGrant])]}
    this.runtime.admission.fence(request.taskId)
    this.questions.supersedeForChange(request.id,cause,true)
    this.permissions.supersedeForChange(request.id,cause)
    // Reload question changes before storing the recovery state.
    const current=this.get(id)!
    current.inputReplan=request.inputReplan
    current.state=program&&program.authorization.every(ref=>this.runtime.evidence.valid(ref))&&generation<=(program.maxInputReplans??0)?"pending":"waiting"
    current.reason=current.state==="pending"?"Changed input requires a fresh bounded plan":"Input replanning quota exhausted"
    this.save(current)
    this.store.event({id:`input-plan-recovery:${digest({id,cause})}`,type:"InputPlanReplanningRequested",entityId:request.taskId,correlationId:id,causationId:cause,schemaVersion:1,timestamp:Date.now(),payload:{requestId:id,...current.inputReplan,state:current.state}})
  }
  tasks(id:string):string[]{return this.store.db.prepare("SELECT task_id FROM control_request_tasks WHERE request_id=?").all(id).map(row=>String(row.task_id))}
  attachProgramToUnconfigured(program:VersionRef):number {
    if(!this.store.get<ControllerProgram>("controller_programs",program.id,program.version))throw new Error("Configured controller program is unavailable")
    return this.store.atomic(()=>{
      let changed=0
      for(const row of this.store.db.prepare("SELECT id FROM control_requests WHERE state='waiting' AND json_extract(payload,'$.program') IS NULL").all()) {
        const request=this.get(String(row.id))!
        if(request.plannerGrant||request.planId||this.tasks(request.id).length)continue
        request.program=program;request.state="pending";delete request.reason;this.save(request);changed++
        this.store.event({id:`request-program-attached:${request.id}:${program.id}:${program.version}`,type:"RequestProgramAttached",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:request.id,program}})
      }
      return changed
    })
  }
  retryPreAdmissionInfrastructureFailure():number {
    return this.store.atomic(()=>{
      if(!this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='grant_dispatches'").get())return 0
      let changed=0
      for(const row of this.store.db.prepare("SELECT id FROM control_requests WHERE state='waiting' AND json_extract(payload,'$.plannerGrant') IS NOT NULL AND json_extract(payload,'$.planId') IS NULL").all()) {
        const request=this.get(String(row.id))!,grantId=request.plannerGrant!
        if(this.store.db.prepare("SELECT 1 FROM request_pre_admission_retries WHERE request_id=?").get(request.id))continue
        const grant=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId),dispatch=this.store.db.prepare("SELECT state,payload FROM grant_dispatches WHERE grant_id=?").get(grantId)
        if(grant?.state!=="fenced"||dispatch?.state!=="failed")continue
        const payload=JSON.parse(String(grant.payload)) as ActivationGrant,error=JSON.parse(String(dispatch.payload)) as {error?:string}
        const sessions=this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='grant_sessions'").get()?this.store.db.prepare("SELECT 1 FROM grant_sessions WHERE grant_id=?").get(grantId):undefined
        if(payload.worker||sessions||!error.error?.startsWith("OpenCode exited"))continue
        this.store.db.prepare("INSERT INTO request_pre_admission_retries VALUES(?,?,?)").run(request.id,grantId,Date.now())
        delete request.plannerGrant;request.infrastructureRetry={failedGrantId:grantId,generation:1};request.state="pending";request.reason="Confirmed pre-admission infrastructure failure will be retried once";this.save(request);changed++
        this.store.event({id:`request-pre-admission-retry:${request.id}:${grantId}`,type:"RequestPreAdmissionRetry",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:request.id,failedGrantId:grantId}})
      }
      for(const row of this.store.db.prepare("SELECT r.request_id,r.failed_grant_id FROM request_pre_admission_retries r JOIN control_requests c ON c.id=r.request_id WHERE c.state='waiting' AND json_extract(c.payload,'$.plannerGrant') IS NULL AND json_extract(c.payload,'$.reason') LIKE 'UNIQUE constraint failed: activation_grants.decision_id%'").all()) {
        const request=this.get(String(row.request_id))!
        request.infrastructureRetry={failedGrantId:String(row.failed_grant_id),generation:1};request.state="pending";request.reason="Recovering a pre-admission retry interrupted before grant issuance";this.save(request);changed++
      }
      return changed
    })
  }
  tick():void {
    this.runtime.roles.retry()
    for(const row of this.store.db.prepare("SELECT id FROM control_requests WHERE state IN ('pending','resuming','planning','validating','executing') ORDER BY rowid").all()) {
      this.store.atomic(()=>{
        const request=this.get(String(row.id))!
        try {this.store.atomic(()=>this.advance(request))} catch(error) {
          const unchanged=this.get(request.id)!
          if(!(error instanceof AdmissionBudgetUnavailableError)||unchanged.state!=="resuming"&&!unchanged.inputReplan?.pending)unchanged.state="waiting";unchanged.reason=error instanceof Error?error.message:"Control evaluation failed";this.save(unchanged)
        }
      })
    }
  }
  resolveProgram(request:ControlledRequest,signals?:Signals,entityId=request.taskId):ControllerProgram {
    const ref=request.program,program=ref&&this.store.get<ControllerProgram>("controller_programs",ref.id,ref.version)
    if(!program)throw new Error("등록된 제어 정책·역할·모델 상한·검증기 설정이 필요합니다.")
    program.authorization.forEach(ref=>this.runtime.evidence.require(ref))
    const bundle=request.policyBundle??this.policies.snapshot(request.id)
    if(!request.policyBundle){request.policyBundle=bundle;this.save(request)}
    const edges=this.runtime.graph.all().filter(edge=>edge.source.entityId===entityId||edge.target.entityId===entityId)
    const relations=[...new Set(edges.map(edge=>edge.relation))],scopes=[...new Set(["implementation" as const,...edges.flatMap(edge=>edge.changeTypes)])]
    return this.policies.apply(request.id,bundle,program,{entityId,features:signals??Object.fromEntries(FEATURES.map(feature=>[feature,null])) as Signals,relations,scopes}).program
  }
  private advance(request:ControlledRequest):void {
    const program=this.resolveProgram(request),engine=this.runtime.engine
    this.runtime.inputs.bind(request.taskId,program.observedInputs??[])
    if(!this.runtime.inputs.ensure(program.observedInputs??[]))return
    if(request.state==="pending"||request.state==="resuming") {
      if(request.inputReplan?.pending) {
        const recovery=request.inputReplan
        this.runtime.evidence.require(recovery.evidence)
        const previous=this.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(recovery.previousGrant)
        const prior=previous&&JSON.parse(String(previous.payload)) as ActivationGrant|undefined
        const hasDispatch=this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()
        const delivery=hasDispatch&&this.store.db.prepare("SELECT state FROM grant_dispatches WHERE grant_id=?").get(recovery.previousGrant)
        if(delivery&&!['failed','cancelled','completed'].includes(String(delivery.state))||prior?.worker&&!delivery&&previous?.state!=="completed")return
        if(recovery.generation>(program.maxInputReplans??0))throw new Error("Input replanning quota exhausted")
      }
      if(request.state==="resuming") {
        const permission=request.permissionChanges?.at(-1)
        if(permission?.reply==="once"&&digest(permission.to)===digest(request.program))this.permissions.assertCurrent(request,permission.permissionId)
        else this.questions.assertCurrent(request,request.clarifications!.at(-1)!.questionId)
        if(this.deliveryPending(request))return
        const question=request.clarifications?.length?this.questions.get(request.clarifications.at(-1)!.questionId):undefined
        if(question?.target) {
          if(question.target.kind==="regional")this.regional.resume(request,program,question)
          else if(question.target.kind==="specialist") {if(!this.specialistQuestions.resume(request,program,question))return}
          else if(!this.workerQuestions.resume(request,program,question))return
          request.state="executing";delete request.reason;this.save(request);return
        }
      }
      request.plannerGrant=this.issue(request,program,request.taskId,"planner",{request:request.text,amendments:request.amendments??[],clarifications:request.clarifications??[],permissionChanges:request.permissionChanges??[],availablePermissionTransitions:(program.permissionTransitions??[]).map(({id,kind,permission,patterns,program})=>({id,kind,permission,patterns,program})),availableRoutines:this.runtime.routines.available(program.policyControls?.allowedRoutines),contract:"For missing user information, return unresolvedQuestions as {kind: user, question: string}, with requiresEscalation=false. A required registered capability or quota transition must return exactly {kind: permission, transitionId: string} with requiresEscalation=true. Never invent a transition. Return proposedTasks as {node: PlanNode, expectation: six typed expected dimensions}, or {routineUse:{routine,namespace,inputs,parentNodeId?}} from availableRoutines. Routine inputs must bind every entry node to existing proposed node IDs. Every acceptance criterion needs an explicit id and expectedBehavior[id]=true. Preserve the original objective and apply explicit user amendments."},request.infrastructureRetry?`pre-admission-retry:${request.infrastructureRetry.failedGrantId}:${request.infrastructureRetry.generation}`:request.inputReplan?.pending?`input-change:${request.inputReplan.cause}`:request.permissionChanges?.at(-1)?.reply==="once"?`permission:${request.permissionChanges.at(-1)!.permissionId}`:request.clarifications?.length?`answer:${request.clarifications.at(-1)!.questionId}`:undefined).id
      delete request.infrastructureRetry
      if(request.inputReplan)request.inputReplan.pending=false
      request.state="planning";delete request.reason;this.save(request);return
    }
    if(request.state==="planning") {
      const row=this.store.db.prepare("SELECT state,payload FROM agent_runs WHERE grant_id=?").get(request.plannerGrant!)
      const state=this.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(request.plannerGrant!)?.state
      if(state==="fenced")throw new Error(this.dispatchFailure(request.plannerGrant!,"Planning grant was fenced; automatic model retry is prohibited"))
      if(row?.state!=="completed")return
      this.assertPlannerInputsCurrent(request)
      if(JSON.parse(String(this.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(request.plannerGrant!)!.payload)).profile.level===5) {
        const review=this.runtime.adversarial.status(request.plannerGrant!)
        if(review==="failed")throw new Error("Planner L5 adversarial review failed")
        if(review!=="satisfied")return
      }
      const output=JSON.parse(String(row.payload)).output as AgentOutput
      if(output.requiresEscalation) {
        this.permissions.ask(request,program,output)
        request.state="waiting";request.reason="등록된 권한 전이에 대한 사용자 응답을 기다리고 있습니다.";this.save(request);return
      }
      if(output.unresolvedQuestions.length) {
        this.questions.ask(request,program,output)
        request.state="waiting";request.reason="계획에 필요한 사용자 답변을 기다리고 있습니다.";this.save(request);return
      }
      const expanded=this.runtime.routines.expand(output.proposedTasks as RoutineProposalItem[],request.text,request.id,program.policyControls?.allowedRoutines),proposal=expanded.proposal
      this.validateProposal(proposal,program)
      const plan=engine.createDraftPlan({title:request.text.slice(0,160),goal:request.text,requestText:request.text,summary:"Controller-validated structured proposal",nodes:proposal.map(item=>item.node)})
      request.proposal=proposal;request.routineUses=expanded.uses;request.planId=plan.planId
      this.store.db.prepare("INSERT INTO controlled_plans VALUES(?,1)").run(plan.planId)
      this.store.db.prepare("INSERT INTO request_plan_admissions VALUES(?,?,'validating')").run(plan.planId,request.id)
      const content={request:request.text,amendments:request.amendments??[],clarifications:request.clarifications??[],permissionChanges:request.permissionChanges??[],planId:plan.planId,proposal}
      const planner=JSON.parse(String(this.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(request.plannerGrant!)!.payload)) as ActivationGrant
      const tuple=[...planner.inputVector,{entityId:plan.planId,port:"proposal",view:"request-plan",version:1,hash:digest(content)}]
      const reason=this.runtime.evidence.put({id:`proposal:${request.id}:${plan.planId}`,version:1,type:"agent",source:request.plannerGrant!,producer:program.planner.role.id,validatorVersion:"structured-proposal/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:planner.inputVector,confidence:output.confidence,expiresAt:null})
      const obligation=this.runtime.evidence.createObligation({entityId:request.taskId,tuple,kind:"request-plan",mandatory:true,validators:program.planValidators,reason:[request.evidence,...(request.clarifications??[]).map(item=>item.evidence),...this.runtime.routines.evidenceFor(request.routineUses??[]),...inputBoundaryEvidence(planner),reason]})
      this.store.db.prepare("UPDATE request_draft_replacements SET new_plan_id=?,new_obligation_id=? WHERE request_id=? AND new_plan_id IS NULL").run(plan.planId,obligation.id,request.id)
      request.obligationId=obligation.id;request.state="validating";this.save(request);return
    }
    if(request.state==="validating") {
      this.assertPlannerInputsCurrent(request)
      this.runtime.routines.evidenceFor(request.routineUses??[])
      const obligation=this.runtime.evidence.obligation(request.obligationId!)!
      if(!this.runtime.evidence.independentlySatisfied(obligation))return
      const plan=engine.store.findWorkPlan(request.planId!)!
      if(plan.currentRevision!==1||plan.state!=="awaiting_approval"||digest(engine.store.planNodes(plan.id,1))!==digest(request.proposal!.map(item=>item.node)))throw new Error("Validated proposal changed before activation")
      if(request.planOnly){if(this.deliveryPending(request))return;this.finish(request);return}
      this.store.db.prepare("UPDATE request_plan_admissions SET state='activating' WHERE plan_id=?").run(plan.id)
      const active=engine.approveWorkPlan({planId:plan.id,version:1,approvalSource:`request:${request.id};validation:${obligation.id}`})
      if(active.transition?.state!=="applied")throw new Error("Initial request plan did not activate atomically")
      this.store.db.prepare("UPDATE request_plan_admissions SET state='activated' WHERE plan_id=?").run(plan.id)
      this.store.db.prepare("INSERT INTO controlled_tasks VALUES(?,?)").run(active.rootTaskId,request.id)
      for(const link of engine.store.planLinks(plan.id,1)) {
        const proposed=request.proposal!.find(item=>item.node.nodeId===link.nodeId)!
        this.store.db.prepare("INSERT INTO control_request_tasks VALUES(?,?,?)").run(request.id,link.taskId,link.nodeId)
        this.store.db.prepare("INSERT OR IGNORE INTO controlled_tasks VALUES(?,?)").run(link.taskId,request.id)
        // Group nodes derive completion from their children; only leaves execute.
        if(engine.store.childTasks(link.taskId).length)continue
        this.runtime.inputs.bind(link.taskId,program.observedInputs??[])
        this.runtime.pinExpectation({...proposed.expectation,id:link.taskId,taskId:link.taskId,version:1,specHash:engine.signals.capture(link.taskId).specHash,evidence:obligation.evidence},program.predictionPolicy,program.observationValidators)
      }
      this.registerIntegration(request,program)
      request.state="executing";this.save(request)
    }
    if(request.state==="executing") {
      if(this.regional.advance(request,program))return
      for(const id of this.tasks(request.id)) {
        const task=engine.requireTask(id)
        if(engine.store.childTasks(id).length)continue
        if(this.workerQuestions.advance(request,program,id)||this.specialistQuestions.advance(request,program,id))return
        for(const run of this.store.db.prepare("SELECT r.grant_id,r.payload FROM agent_runs r JOIN activation_grants g ON g.id=r.grant_id WHERE r.task_id=? AND r.state='completed' AND json_extract(g.payload,'$.executionMode')='cognition'").all(id)) {
          if(this.specialistQuestions.superseded(String(run.grant_id)))continue
          const output=JSON.parse(String(run.payload)).output as AgentOutput
          if(output.requiresEscalation||output.unresolvedQuestions.length)throw new Error("Specialist left unresolved questions; scoped escalation evidence is required")
        }
        if(this.repairs.advance(request,program,id))continue
        const existing=this.store.db.prepare("SELECT state FROM activation_grants WHERE task_id=?").all(id)
        if(existing.some(row=>row.state==="fenced")) {
          const failed=this.store.db.prepare("SELECT id FROM activation_grants WHERE task_id=? AND state='fenced' ORDER BY rowid DESC LIMIT 1").get(id)
          throw new Error(this.dispatchFailure(String(failed?.id??""),"Worker grant was fenced; scoped recovery is required"))
        }
        if(task.status==="ready"&&!existing.length) {
          const preflight=this.runtime.preflight.check(id,program)
          if(preflight.state==="pending")continue
          if(preflight.state==="solved"&&this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='task_reservations'").get()&&this.store.db.prepare("SELECT 1 FROM task_reservations LIMIT 1").get())continue
          const grant=this.issue(request,program,id,"worker",{request:request.text,questionContract:"For missing user information return unresolvedQuestions as {kind: user, question: string} and requiresEscalation=false; do not claim completion.",task:engine.requireTask(id),expectation:this.store.get("task_expectations",id,this.store.head("task_expectations",id))},undefined,undefined,Infinity,preflight.state==="solved"?preflight.id:undefined)
          if(grant.profile.level===1)this.runtime.preflight.execute(grant)
        }
      }
      const ids=this.tasks(request.id)
      if(ids.length&&ids.every(id=>["verified","integrated"].includes(engine.requireTask(id).status))&&!controlCompletionMissing(engine,ids).length&&!this.runtime.evidence.unresolved(request.taskId).length&&!this.deliveryPending(request)) {
        this.finish(request)
      }
    }
  }
  private dispatchFailure(grantId:string,fallback:string):string {
    if(!grantId||!this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='grant_dispatches'").get())return fallback
    const row=this.store.db.prepare("SELECT payload FROM grant_dispatches WHERE grant_id=? AND state IN ('failed','stopping')").get(grantId)
    if(!row)return fallback
    try {
      const payload=JSON.parse(String(row.payload)) as {error?:string;reason?:string}
      const detail=payload.error??payload.reason
      return detail?`${fallback}: ${detail.slice(0,2000)}`:fallback
    } catch {return fallback}
  }
  registerIntegration(request:ControlledRequest,program:ControllerProgram):void {
    if(!program.integrationValidators||!request.planId)return
    const members=this.tasks(request.id).filter(id=>!this.runtime.engine.store.childTasks(id).length)
    if(!members.length)return
    const id=`integration:${request.planId}`
    const complete=program.policyControls?.requireCompleteBoundary===true,memberSet=new Set(members)
    const exits=complete?this.runtime.graph.all().filter(edge=>memberSet.has(edge.source.entityId)!==memberSet.has(edge.target.entityId)).map(edge=>edge.id):[]
    this.runtime.boundaries.register({id,version:this.store.head("planning_boundaries",id)+1,members,exits,invariants:["All registered integration dimensions must pass for the exact current observation tuple"],bindingsComplete:complete,validators:program.integrationValidators,authorization:program.authorization,...(complete?{bindingValidator:program.policyControls!.boundaryBindingValidator,proofMaxAgeMs:program.policyControls!.boundaryProofMaxAgeMs}:{})})
  }
  private finish(request:ControlledRequest):void {
    const content={requestId:request.id,planId:request.planId,tasks:this.tasks(request.id),planValidation:request.obligationId,planOnly:request.planOnly}
    const evidence=this.runtime.evidence.put({id:`request-completion:${request.id}`,version:1,type:"runtime",source:"deterministic request conjunction",producer:"request-controller",validatorVersion:"request-completion/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:[],confidence:1,expiresAt:null})
    // This task represents request coordination, not another model execution.
    // Its result is derived only after the work/validation conjunction above.
    const anchor=this.runtime.engine.requireTask(request.taskId)
    this.runtime.engine.store.updateTask({...anchor,status:"verified",statusReason:"Controller request conjunction satisfied"})
    request.state="completed";this.save(request)
    this.store.event({id:`request-completed:${request.id}`,type:"RequestCompleted",entityId:request.taskId,correlationId:request.id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:request.id,evidence}})
  }
  private deliveryPending(request:ControlledRequest):boolean {
    if(!this.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get())return false
    const rows=this.store.db.prepare("SELECT d.state,g.id FROM grant_dispatches d JOIN activation_grants g ON g.id=d.grant_id WHERE g.task_id=? OR g.task_id IN (SELECT task_id FROM control_request_tasks WHERE request_id=?)").all(request.taskId,request.id).filter(row=>!request.inputReplan?.superseded.includes(String(row.id))||!["failed","cancelled"].includes(String(row.state)))
    if(rows.some(row=>["failed","cancelled"].includes(String(row.state))))throw new Error("An execution delivery failed; verified model output does not prove workspace publication")
    return rows.some(row=>row.state!=="completed")
  }
  private assertPlannerInputsCurrent(request:ControlledRequest):void {
    const row=this.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(request.plannerGrant!)
    const grant=JSON.parse(String(row!.payload)) as ActivationGrant,snapshot=this.runtime.engine.signals.capture(request.taskId)
    const current=currentInputVector(this.runtime.engine,request.taskId)
    if(grant.specHash!==snapshot.specHash||digest(grant.inputVector)!==digest(current))throw new Error("The plan was produced from stale inputs")
    this.runtime.files.assertObservedReadsCurrent(grant.id)
  }
  validateProposal(proposal:ProposedTask[],program:ControllerProgram):void {
    if(!Array.isArray(proposal)||!proposal.length||proposal.length>program.maxTasks)throw new Error("Proposal task count exceeds the program")
    for(const item of proposal) {
      const n=item.node,e=item.expectation
      if(!n||!e||!Array.isArray(n.dependsOnNodeIds)||!Array.isArray(n.taskSpec?.writeScopes)||n.taskSpec.writeScopes.some(scope=>!validScope(scope)||!within(scope,program.writeScopes)))throw new Error("Proposal exceeds authorized file scope")
      const decoded=decodeSemanticOutput(JSON.stringify({state:{artifacts:e.expectedArtifacts,contract:e.expectedInterface,behavior:e.expectedBehavior,dependencies:e.expectedDependencies,goals:e.expectedGoals,risk:e.expectedRisk},criticalViolations:[]}))
      if(Object.values(decoded.state).some(value=>value===null))throw new Error("Execution expectations must be explicit before execution")
      if(!n.taskSpec.acceptanceCriteria?.length||n.taskSpec.acceptanceCriteria.some(c=>typeof c==="string"||!c.id||e.expectedBehavior[c.id]!==true))throw new Error("Acceptance criteria require stable IDs and expected behavior")
    }
  }
  issueRepair(request:ControlledRequest,program:ControllerProgram,taskId:string,content:unknown,causeId:string,pinnedProfile?:ReasoningProfile):ActivationGrant {
    return this.issue(request,program,taskId,"worker",content,causeId,pinnedProfile?{...program.worker,profile:pinnedProfile}:undefined)
  }
  issueReplanner(request:ControlledRequest,program:ControllerProgram,content:unknown,causeId:string,deadline?:number):ActivationGrant {
    return this.issue(request,program,request.taskId,"planner",content,causeId,program.replanner!,deadline)
  }
  private issue(request:ControlledRequest,program:ControllerProgram,taskId:string,kind:"planner"|"worker",content:unknown,causeId?:string,override?:ControllerProgram["planner"],deadline=Infinity,preflightId?:string):ActivationGrant {
    const precision=kind==="worker"&&!override&&program.workerPrecision?selectWorkerPrecision(this.store,program,taskId):undefined
    let entry=override??(precision?{...program.worker,profile:precision.profile}:program[kind])
    if(kind==="worker"&&program.policyControls?.minimumWorkerProfile&&entry.profile.level<program.policyControls.minimumWorkerProfile.level)entry={...entry,profile:program.policyControls.minimumWorkerProfile}
    const storedRole=this.store.get<RoleVersion>("role_versions",entry.role.id,entry.role.version)!,role=entry.contextPolicy?{...storedRole,contextBudget:entry.contextPolicy.budget,requiredContext:entry.contextPolicy.requiredContext}:storedRole
    const snapshot=this.runtime.engine.signals.capture(taskId)
    this.runtime.drain()
    const vector=currentInputVector(this.runtime.engine,taskId)
    const context=controlledContext(this.runtime,taskId,role,program.policy,entry.profile,[{id:`request-context:${taskId}`,version:1,kind:"task",content:canonical(precision?{request:content,reasoningSelection:precision}:content),required:true,depth:0,relevance:1,level:0,dependencies:vector,path:[request.id,taskId],evidence:[request.evidence,...(request.clarifications??[]).flatMap(item=>[item.source,item.evidence]),...(request.permissionChanges??[]).flatMap(item=>[item.source,item.evidence])]},...(request.clarifications??[]).map(item=>({id:item.source.id,version:item.source.version,kind:"evidence" as const,content:canonical(this.runtime.evidence.require(item.source)),required:true,depth:0,relevance:1,level:0 as const,dependencies:vector,path:[request.id,taskId],evidence:[item.source,item.evidence]})),...(request.permissionChanges??[]).map(item=>({id:item.source.id,version:item.source.version,kind:"evidence" as const,content:canonical(this.runtime.evidence.require(item.source)),required:true,depth:0,relevance:1,level:0 as const,dependencies:vector,path:[request.id,taskId],evidence:[item.source,item.evidence]}))])
    this.store.put("context_manifests",context.id,1,context)
    // The primary role discharges explicit user work; no artificial risk/failure
    // signal is manufactured to cross an optional specialist threshold.
    const decision=this.runtime.admission.record({id:randomUUID(),eventId:causeId??`${request.id}:${taskId}:${kind}`,taskId,role:entry.role,policy:program.policy,signals:{...Object.fromEntries(FEATURES.map(feature=>[feature,null])),...(causeId&&kind==="worker"&&!causeId.startsWith("answer:")?{failure:1}:{})} as Signals,score:0,hard:[],action:"activate",reasons:[causeId?.startsWith("answer:")?"explicit user clarification under unchanged validated scope":override?"evidence-bound scoped planning":causeId?"measured leaf failure under unchanged validated goal":kind==="planner"?"explicit request interpretation":"validated request plan leaf"],timestamp:Date.now()})
    const generation=Number(this.store.db.prepare("SELECT coalesce(max(json_extract(payload,'$.generation')),0)+1 n FROM activation_grants WHERE task_id=?").get(taskId)!.n)
    return this.runtime.admission.issue({taskId,decisionId:decision.id,specHash:snapshot.specHash,inputVector:vector,graphHash:this.runtime.graph.hash(),role:entry.role,policy:program.policy,policyBundle:request.policyBundle,policyProgram:{id:program.id,version:program.version,hash:digest(program)},policyControls:program.policyControls,context:{id:context.id,version:1},contextHash:context.hash,profile:entry.profile,...(preflightId?{preflight:{id:preflightId,requestedProfile:entry.profile}}:{}),writeScopes:kind==="worker"?(this.runtime.engine.requireTask(taskId).writeScopes??[]):[],readScopes:program.readScopes,allowedTools:role.allowedTools.filter(tool=>kind==="worker"||tool!=="task_graph_cognitive_write"),obligations:request.obligationId?[request.obligationId]:[],expiresAt:Math.min(deadline,Date.now()+Math.min(program.grantLifetimeMs,entry.profile.timeoutMs)),generation,executionMode:kind==="worker"?"task":"cognition"},program.account,program.tokenLimit)
  }
  cancel(id:string):void {
    this.store.atomic(()=>{
      const request=this.get(id)
      if(!request||request.state==="completed"||request.state==="cancelled")return
      for(const taskId of [request.taskId,...this.tasks(id)])this.runtime.admission.fence(taskId)
      this.questions.cancel(request.id)
      this.permissions.cancel(request.id)
      request.state="cancelled";this.save(request)
      this.store.event({id:randomUUID(),type:"RequestCancelled",entityId:request.taskId,correlationId:id,schemaVersion:1,timestamp:Date.now(),payload:{requestId:id}})
    })
  }
}

/** The activation marker is visible only inside the controller transaction. */
export function assertRequestPlanApproval(runtime:ControlRuntime["engine"],planId:string,version:number):void {
  const row=runtime.store.db.prepare("SELECT state FROM request_plan_admissions WHERE plan_id=?").get(planId)
  if(row&&version===1&&(!runtime.store.inTransaction||!["activating","activated"].includes(String(row.state))))throw new Error("Request plan approval requires validated controller activation")
  if(row&&version>1)assertControlledPlanActivation(runtime,planId,version)
}
