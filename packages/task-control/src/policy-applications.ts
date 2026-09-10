import type { ControlRuntime } from "./runtime.ts"
import type { ControllerProgram } from "./requests.ts"
import { canonical,digest } from "./value.ts"
import { POLICY_TARGETS,PolicyLearning,evaluateRule,type PolicyBundle,type PolicyEffect,type PolicyProposal,type PolicyTarget } from "../../task-policy/src/index.ts"
import type { Feature } from "../../task-cognition/src/model.ts"

export interface PolicyState {entityId:string;features:Partial<Record<Feature,number|null>>;relations:string[];scopes:string[]}
export interface AppliedPolicy {target:PolicyTarget;policy:PolicyBundle["heads"][PolicyTarget];ruleResult:boolean|null;effect:PolicyEffect|null}

/** Active heads are frozen once per request; only typed effects can alter a controller program. */
export class PolicyApplications {
  readonly runtime:ControlRuntime
  constructor(runtime:ControlRuntime){this.runtime=runtime;runtime.store.db.exec(`CREATE TABLE IF NOT EXISTS policy_bundles(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS policy_applications(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,target TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS effective_policy_programs(hash TEXT NOT NULL,request_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(request_id,hash));
    CREATE TRIGGER IF NOT EXISTS policy_bundles_no_update BEFORE UPDATE ON policy_bundles BEGIN SELECT RAISE(ABORT,'Immutable policy bundle'); END;
    CREATE TRIGGER IF NOT EXISTS policy_bundles_no_delete BEFORE DELETE ON policy_bundles BEGIN SELECT RAISE(ABORT,'Immutable policy bundle'); END;
    CREATE TRIGGER IF NOT EXISTS policy_applications_no_update BEFORE UPDATE ON policy_applications BEGIN SELECT RAISE(ABORT,'Immutable policy application'); END;
    CREATE TRIGGER IF NOT EXISTS policy_applications_no_delete BEFORE DELETE ON policy_applications BEGIN SELECT RAISE(ABORT,'Immutable policy application'); END;
    CREATE TRIGGER IF NOT EXISTS effective_policy_programs_no_update BEFORE UPDATE ON effective_policy_programs BEGIN SELECT RAISE(ABORT,'Immutable effective policy program'); END;
    CREATE TRIGGER IF NOT EXISTS effective_policy_programs_no_delete BEFORE DELETE ON effective_policy_programs BEGIN SELECT RAISE(ABORT,'Immutable effective policy program'); END;`)}
  snapshot(requestId:string):PolicyBundle {
    const existing=this.runtime.store.db.prepare("SELECT payload FROM policy_bundles WHERE id=?").get(requestId)
    if(existing)return JSON.parse(String(existing.payload))
    const learning=new PolicyLearning(this.runtime.store)
    const heads=Object.fromEntries(POLICY_TARGETS.map(target=>[target,learning.head(target)])) as PolicyBundle["heads"]
    const value={id:requestId,version:1 as const,heads,hash:digest(heads)}
    this.runtime.store.db.prepare("INSERT INTO policy_bundles VALUES(?,?)").run(requestId,canonical(value))
    return value
  }
  apply(requestId:string,bundle:PolicyBundle,base:ControllerProgram,state:PolicyState):{program:ControllerProgram;applications:AppliedPolicy[]} {
    if(bundle.id!==requestId||bundle.hash!==digest(bundle.heads))throw new Error("Corrupted or foreign policy bundle")
    let program:ControllerProgram={...base},applications:AppliedPolicy[]=[]
    for(const target of POLICY_TARGETS) {
      const head=bundle.heads[target],proposal=head.policy&&this.runtime.store.get<PolicyProposal>("policy_versions",head.policy.id,head.policy.version)
      if(proposal&&proposal.target!==target)throw new Error("Pinned policy target mismatch")
      if(proposal&&!proposal.effect)throw new Error("Active policy lacks a typed runtime effect")
      const ruleResult=proposal?evaluateRule(proposal.proposedRule,state):false,effect=ruleResult===true?proposal!.effect:null
      if(effect){this.assertResources(program,effect);program=this.compose(program,effect)}
      const application={target,policy:head,ruleResult,effect},id=digest({requestId,bundle:bundle.hash,target,state})
      if(proposal) {
        const prior=this.runtime.store.db.prepare("SELECT payload FROM policy_applications WHERE id=?").get(id)
        if(prior&&digest(JSON.parse(String(prior.payload)))!==digest(application))throw new Error("Policy application identity conflict")
        if(!prior) {
          this.runtime.store.db.prepare("INSERT INTO policy_applications VALUES(?,?,?,?)").run(id,requestId,target,canonical(application))
          this.runtime.store.event({id:`policy-applied:${id}`,type:"PolicyApplied",entityId:state.entityId,correlationId:requestId,schemaVersion:1,timestamp:Date.now(),payload:{bundle:{id:bundle.id,version:1},application}})
        }
      }
      applications.push(application)
    }
    const hash=digest(program),stored=this.runtime.store.db.prepare("SELECT payload FROM effective_policy_programs WHERE request_id=? AND hash=?").get(requestId,hash)
    if(stored&&digest(JSON.parse(String(stored.payload)))!==hash)throw new Error("Effective policy program hash collision")
    if(!stored)this.runtime.store.db.prepare("INSERT INTO effective_policy_programs VALUES(?,?,?)").run(hash,requestId,canonical(program))
    return {program,applications}
  }
  private assertResources(program:ControllerProgram,effect:PolicyEffect):void {
    const role=(ref:{id:string;version:number})=>{if(!this.runtime.store.get("role_versions",ref.id,ref.version))throw new Error("Policy effect references an unregistered role")}
    const validator=(id:string,semantic=false)=>{const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(id),value=match&&this.runtime.store.get<{output?:string}>("validator_versions",match[1]!,Number(match[2]));if(!value||semantic&&value.output!=="semantic-state")throw new Error("Policy effect references an unregistered validator")}
    if(effect.kind==="activation") {role(effect.role);if(!program.specialists?.some(entry=>digest(entry.role)===digest(effect.role)))throw new Error("Activation effect role is outside registered specialists")}
    if(effect.kind==="role")role(effect.role)
    if(effect.kind==="validation")effect.validators.forEach(id=>validator(id,effect.phase==="observation"))
    if(effect.kind==="integration")Object.values(effect.validators).forEach(id=>validator(id))
    if(effect.kind==="boundary"&&effect.requireComplete)validator(effect.bindingValidator!)
    if(effect.kind==="routine")for(const ref of effect.allow)if(!this.runtime.store.get("routine_versions",ref.id,ref.version))throw new Error("Routine effect references an unregistered routine")
  }
  private compose(program:ControllerProgram,effect:PolicyEffect):ControllerProgram {
    const unique=(values:string[])=>[...new Set(values)]
    if(effect.kind==="activation")return {...program,policyControls:{...program.policyControls,requiredSpecialistRoles:unique([...(program.policyControls?.requiredSpecialistRoles??[]),effect.role.id])}}
    if(effect.kind==="context") {
      const patch=(entry:ControllerProgram["planner"])=>({...entry,contextPolicy:{budget:effect.budget,requiredContext:effect.requiredContext}})
      return {...program,...(effect.slot==="planner"||effect.slot==="all"?{planner:patch(program.planner)}:{}),...(effect.slot==="worker"||effect.slot==="all"?{worker:patch(program.worker)}:{})}
    }
    if(effect.kind==="decomposition")return {...program,maxTasks:effect.maxTasks}
    if(effect.kind==="role")return {...program,[effect.slot]:{...(effect.slot==="replanner"?program.replanner??{validators:program.planValidators,maxAttempts:1}:{}),role:effect.role,profile:effect.profile}}
    if(effect.kind==="validation")return effect.phase==="plan"?{...program,planValidators:unique([...program.planValidators,...effect.validators])}:effect.phase==="observation"?{...program,observationValidators:unique([...program.observationValidators,...effect.validators])}:{...program,replanner:program.replanner&&{...program.replanner,validators:unique([...program.replanner.validators,...effect.validators])}}
    if(effect.kind==="integration")return {...program,integrationValidators:effect.validators}
    if(effect.kind==="escalation")return {...program,maxClarifications:effect.maxClarifications,maxInputReplans:effect.maxInputReplans,maxLocalRepairs:effect.maxLocalRepairs}
    if(effect.kind==="cache")return {...program,policyControls:{...program.policyControls,cacheReuse:effect.reuse}}
    if(effect.kind==="precision")return {...program,policyControls:{...program.policyControls,minimumWorkerProfile:effect.minimumProfile}}
    if(effect.kind==="propagation")return {...program,policyControls:{...program.policyControls,propagationThreshold:effect.threshold}}
    if(effect.kind==="boundary")return {...program,policyControls:{...program.policyControls,requireCompleteBoundary:effect.requireComplete,boundaryBindingValidator:effect.bindingValidator,boundaryProofMaxAgeMs:effect.proofMaxAgeMs}}
    if(effect.kind==="expectation")return {...program,predictionPolicy:effect.policy}
    if(effect.kind==="routine")return {...program,policyControls:{...program.policyControls,allowedRoutines:effect.allow}}
    return program
  }
}
