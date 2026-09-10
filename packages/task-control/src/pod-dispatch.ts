import type { GrantedExecutor } from "./dispatch.ts"
import type { ControlRuntime } from "./runtime.ts"
import { validatorPod } from "./pod-validation.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { PodAuthority } from "./pod-authority.ts"
import type { ClusterApi,InstanceSpec } from "../../task-instances/src/types.ts"
import { InstanceManager } from "../../task-instances/src/manager.ts"
import { names } from "../../task-instances/src/controller.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { digest } from "./value.ts"
import { AuthorityHttpClient } from "./authority-http.ts"
import { currentInputVector } from "./completion.ts"

export interface PodDispatchConfig {
  validationBudget?:{maxJobs:number;maxDurationMs:number}
  namespace:string;image?:string;envSecret?:string;archiveClaim?:string
  repository?:{url:string;commit:string}
  authority?:{url:string;host:string;port:number}
}
/** Provisioning and observation are separate from controller-owned admission. */
export class GrantedPodExecutor implements GrantedExecutor {
  readonly runtime:ControlRuntime;readonly api:ClusterApi;readonly config:PodDispatchConfig
  readonly authority:PodAuthority;readonly instances:InstanceManager
  private started?:Promise<void>;private closed=false
  constructor(runtime:ControlRuntime,api:ClusterApi,config:PodDispatchConfig,maxWorkers:number) {
    this.runtime=runtime;this.api=api;this.config=config
    this.authority=new PodAuthority(runtime,maxWorkers);this.instances=new InstanceManager(api,config.namespace)
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS pod_dispatch_bindings(grant_id TEXT PRIMARY KEY,instance_task_id TEXT NOT NULL,secret_name TEXT NOT NULL); CREATE TABLE IF NOT EXISTS pod_validation_bindings(grant_id TEXT PRIMARY KEY,pod_name TEXT NOT NULL,pod_uid TEXT NOT NULL,source_uid TEXT NOT NULL,snapshot_hash TEXT NOT NULL,image_id TEXT NOT NULL,payload TEXT NOT NULL)")
    if(!runtime.store.db.prepare("PRAGMA table_info(pod_validation_bindings)").all().some(row=>row.name==="payload"))runtime.store.db.exec("ALTER TABLE pod_validation_bindings ADD COLUMN payload TEXT NOT NULL DEFAULT '{}'")
  }
  private async start():Promise<void> {
    if(this.closed)throw new Error("Pod executor is closed")
    this.started??=(async()=>{
      if(!this.config.image||!this.config.authority||!this.config.validationBudget||!this.api.logs)throw new Error("Pod execution requires an explicit worker image, reachable control authority, log observation and independent validation budget")
      // Reuse the same URL validation as the model plugin, before provisioning.
      new AuthorityHttpClient({url:this.config.authority.url,token:"0".repeat(64),sessionId:"*"})
      await this.authority.listen({host:this.config.authority.host,port:this.config.authority.port})
    })()
    return this.started
  }
  async execute(id:string):Promise<unknown> {
    try {return await this.deliver(id)} catch(error) {
      this.runtime.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(id)
      const physical=this.runtime.store.db.prepare("SELECT instance_task_id FROM pod_dispatch_bindings WHERE grant_id=?").get(id)
      if(physical)await this.stopPhysical(String(physical.instance_task_id)).catch(()=>undefined)
      throw error
    }
  }
  private async deliver(id:string):Promise<unknown> {
    const pending=this.runtime.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(id)
    if(pending&&JSON.parse(String(pending.payload)).profile.level<2)throw new Error("Non-model grants cannot provision a model Pod")
    await this.start()
    const db=this.runtime.store.db,row=db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(id)
    if(row?.state!=="issued")throw new Error("Pod dispatch requires an unused activation grant")
    const grant=JSON.parse(String(row.payload)) as ActivationGrant,physicalId=`grant-${id}`,secretName=`grant-${digest(id).slice(0,32)}`
    const currentInputs=currentInputVector(this.runtime.engine,grant.taskId)
    if(digest(currentInputs)!==digest(grant.inputVector))throw new Error("Pod dispatch inputs changed before provisioning")
    if(db.prepare("SELECT 1 FROM pod_dispatch_bindings WHERE grant_id=?").get(id))throw new Error("Interrupted Pod dispatch cannot be replayed")
    const binding=this.authority.register(id,this.config.authority!.url)
    db.prepare("INSERT INTO pod_dispatch_bindings VALUES(?,?,?)").run(id,physicalId,secretName)
    try {
      await this.api.create("secrets",{apiVersion:"v1",kind:"Secret",metadata:{name:secretName,namespace:this.config.namespace},...({immutable:true,stringData:{TASK_GRANT_BINDING:JSON.stringify(binding)}} as object)})
    }catch{throw new Error("Pod activation Secret provisioning failed")}
    const snapshot=this.runtime.engine.signals.capture(grant.taskId)
    const sources:Array<{taskId:string;hash:string}>=[]
    for(const taskId of this.runtime.engine.signals.dependencies(grant.taskId)) {
      const prior=db.prepare("SELECT p.instance_task_id FROM pod_dispatch_bindings p JOIN activation_grants g ON g.id=p.grant_id WHERE g.task_id=? AND g.state='completed' ORDER BY g.rowid DESC LIMIT 1").get(taskId)
      if(!prior)throw new Error("Pod dependency has no accepted isolated workspace")
      const instance=await this.instances.load(String(prior.instance_task_id)),hash=instance.status?.codeSnapshot?.hash
      if(!["Completed","Archived"].includes(instance.status?.phase)||typeof hash!=="string")throw new Error("Pod dependency workspace has not settled")
      sources.push({taskId:String(prior.instance_task_id),hash})
    }
    const spec:InstanceSpec={taskId:physicalId,image:this.config.image!,desiredState:"Running",run:1,storage:{size:"1Gi"},deletionPolicy:"Retain",stages:[{id:"cognition",command:["node","/app/scripts/granted-instance-stage.ts"]}],activation:{grantId:id,taskId:grant.taskId,generation:grant.generation,authoritySecret:secretName,expiresAt:grant.expiresAt},inputSnapshot:{digest:snapshot.digest,inputRefs:snapshot.inputRefs,vector:currentInputs,sources},...(sources.length?{reuseSources:sources.map(source=>({taskId:source.taskId,stages:[]}))}:{}),...(this.config.repository?{repository:this.config.repository}:{}),...(this.config.envSecret?{envSecret:this.config.envSecret}:{}),...(this.config.archiveClaim?{archive:{claimName:this.config.archiveClaim,cleanupOnCompletion:false}}:{})}
    await this.instances.create(spec)
    while(!this.closed) {
      const state=db.prepare("SELECT state FROM activation_grants WHERE id=?").get(id)?.state
      const instance=await this.instances.load(physicalId)
      if(state==="completed"&&["Completed","Archived"].includes(instance.status?.phase))return {grantId:id,instanceUid:instance.metadata.uid}
      if(state==="claimed"&&instance.status?.phase==="Completed"&&db.prepare("SELECT 1 FROM pod_model_results WHERE grant_id=?").get(id)) {
        await this.validate(grant,instance)
        return {grantId:id,instanceUid:instance.metadata.uid}
      }
      if(state==="fenced"||Date.now()>=grant.expiresAt||["Failed","RecoveryRequired","Suspended"].includes(instance.status?.phase))throw new Error("Pod activation failed, expired or was interrupted")
      await new Promise(resolve=>setTimeout(resolve,250))
    }
    throw new Error("Pod executor stopped")
  }
  private async validate(grant:ActivationGrant,instance:import("../../task-instances/src/types.ts").TaskInstance):Promise<void> {
    const model=await this.api.get("pods",names(instance).pod),snapshotHash=instance.status?.codeSnapshot?.hash
    const modelStatus=model?.status?.containerStatuses
    if(!model||typeof snapshotHash!=="string"||modelStatus?.length!==1||!modelStatus[0].state?.terminated||modelStatus[0].state.terminated.exitCode!==0||!modelStatus[0].imageID)throw new Error("Model Pod stop and output snapshot are unconfirmed")
    const spec=validatorPod({grant,instance,modelPod:model,image:this.config.image!,snapshotHash,validators:this.authority.validationPlan(grant.id),budget:this.config.validationBudget!})
    this.runtime.store.db.prepare("INSERT INTO pod_validation_bindings VALUES(?,?,?,?,?,?,?)").run(grant.id,spec.metadata.name,"",model.metadata.uid!,snapshotHash,modelStatus[0].imageID,JSON.stringify(spec))
    const created=await this.api.create("pods",spec)
    if(!created.metadata.uid)throw new Error("Validator Pod identity is unavailable")
    this.runtime.store.db.prepare("UPDATE pod_validation_bindings SET pod_uid=? WHERE grant_id=?").run(created.metadata.uid,grant.id)
    while(!this.closed&&Date.now()<grant.expiresAt) {
      if(this.runtime.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grant.id)?.state!=="claimed")throw new Error("Validation grant was fenced")
      const current=await this.api.get("pods",created.metadata.name)
      if(current?.metadata.uid!==created.metadata.uid)throw new Error("Validator Pod identity changed")
      const statuses=current.status?.containerStatuses
      if(statuses?.length===1&&statuses[0].state?.terminated) {
        if(statuses[0].state.terminated.exitCode!==0||statuses[0].imageID!==modelStatus[0].imageID)throw new Error("Independent validator failed or its image changed")
        const result=JSON.parse(await this.api.logs!(created.metadata.name,"validator",1048576)) as {snapshotHash:string;receipts:ValidationReceipt[]}
        if(result.snapshotHash!==snapshotHash||!Array.isArray(result.receipts))throw new Error("Validator snapshot receipt mismatch")
        this.authority.finishValidated(grant.id,result.receipts)
        return
      }
      await new Promise(resolve=>setTimeout(resolve,250))
    }
    throw new Error("Independent Pod validation expired or stopped")
  }
  async stop(sessionId:string):Promise<{stopped:boolean;evidence:string}> {
    const row=this.runtime.store.db.prepare("SELECT p.instance_task_id,g.id,g.task_id FROM pod_dispatch_bindings p JOIN activation_grants g ON g.id=p.grant_id WHERE json_extract(g.payload,'$.worker')=?").get(sessionId)
    if(!row)return {stopped:false,evidence:"Pod session binding is unavailable"}
    this.runtime.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(String(row.id))
    const result=await this.stopPhysical(String(row.instance_task_id))
    if(result.stopped)this.runtime.engine.atomic(()=>{
      const task=this.runtime.engine.requireTask(String(row.task_id)),attempt=this.runtime.engine.store.currentAttempt(task.id)
      if(attempt?.worker?.sessionId!==sessionId)return
      if(task.status==="running")this.runtime.engine.failTask(task.id,"Granted Pod stopped",attempt.token)
      new TaskScheduler(this.runtime.engine).release(task.id,true)
    })
    return result
  }
  async stopGrant(grantId:string):Promise<{stopped:boolean;evidence:string}> {
    const binding=this.runtime.store.db.prepare("SELECT instance_task_id FROM pod_dispatch_bindings WHERE grant_id=?").get(grantId)
    if(!binding)return {stopped:true,evidence:"No Pod provisioning intent exists"}
    const instance=await this.api.get("taskinstances",(await import("../../task-instances/src/manager.ts")).instanceName(String(binding.instance_task_id)))
    if(!instance)return {stopped:true,evidence:"Pod instance was not provisioned"}
    return this.stopPhysical(String(binding.instance_task_id))
  }
  async completion(grantId:string):Promise<boolean> {
    const binding=this.runtime.store.db.prepare("SELECT instance_task_id FROM pod_dispatch_bindings WHERE grant_id=?").get(grantId)
    if(!binding)return false
    const instance=await this.instances.load(String(binding.instance_task_id))
    return ["Completed","Archived"].includes(instance.status?.phase)
  }
  private async stopPhysical(id:string) {
    let instance
    try{instance=await this.instances.load(id)}catch{return {stopped:false,evidence:"Pod instance identity could not be observed"}}
    await this.instances.suspend(id)
    const validation=this.runtime.store.db.prepare("SELECT v.grant_id,v.pod_name,v.pod_uid,v.payload FROM pod_validation_bindings v JOIN pod_dispatch_bindings d ON d.grant_id=v.grant_id WHERE d.instance_task_id=?").get(id)
    if(validation) {
      const pod=await this.api.get("pods",String(validation.pod_name))
      if(pod&&!validation.pod_uid) {
        const expected=JSON.parse(String(validation.payload))
        if(!expected.spec||!expected.metadata)return {stopped:false,evidence:"Legacy validator creation has no verifiable intent"}
        const contains=(actual:any,wanted:any):boolean=>Array.isArray(wanted)?Array.isArray(actual)&&actual.length===wanted.length&&wanted.every((item,index)=>contains(actual[index],item)):wanted&&typeof wanted==="object"?Object.entries(wanted).every(([key,value])=>contains(actual?.[key],value)):actual===wanted
        if(!contains(pod,expected))return {stopped:false,evidence:"Unacknowledged validator Pod does not match the durable creation intent"}
        this.runtime.store.db.prepare("UPDATE pod_validation_bindings SET pod_uid=? WHERE grant_id=?").run(pod.metadata.uid!,String(validation.grant_id))
      }else if(pod&&pod.metadata.uid!==validation.pod_uid)return {stopped:false,evidence:"Validator Pod identity changed"}
      if(pod){await this.api.remove("pods",pod);if(await this.api.get("pods",pod.metadata.name))return {stopped:false,evidence:"Validator Pod termination is pending"}}
    }
    const pod=await this.api.get("pods",names(instance).pod)
    const stopped=!pod||pod.status?.containerStatuses?.length===1&&pod.status.containerStatuses.every((container:any)=>!!container.state?.terminated)
    return {stopped:Boolean(stopped),evidence:stopped?`Pod termination observed for ${instance.metadata.uid}`:"Pod termination is still pending"}
  }
  async close():Promise<void> {
    this.closed=true
    for(const row of this.runtime.store.db.prepare("SELECT p.instance_task_id,g.id FROM pod_dispatch_bindings p JOIN activation_grants g ON g.id=p.grant_id WHERE g.state IN ('issued','claimed','fenced')").all()) {
      this.runtime.store.db.prepare("UPDATE activation_grants SET state='fenced' WHERE id=? AND state IN ('issued','claimed')").run(String(row.id))
      await this.stopPhysical(String(row.instance_task_id)).catch(()=>undefined)
    }
    await this.started?.catch(()=>undefined);await this.authority.close()
  }
}
