import { resolve } from "node:path"
import { decodeSemanticOutput } from "../../task-evidence/src/semantic-output.ts"
import type { RegisteredValidator } from "../../task-evidence/src/registry.ts"
import type { ValidationReceipt } from "../../task-evidence/src/validators.ts"
import { createServer, type Server } from "node:http"
import { randomBytes } from "node:crypto"
import type { ControlRuntime } from "./runtime.ts"
import { GuardAuthority } from "./guard-authority.ts"
import type { ActivationGrant, AgentOutput, ContextManifest, RoleVersion } from "../../task-cognition/src/model.ts"
import { withTaskAdmission } from "./task-admission.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { canonical, digest } from "./value.ts"
import type { AuthorityBinding } from "./authority-http.ts"

export interface PodDescription {grant:ActivationGrant;role:RoleVersion;context:ContextManifest}
/** One secret binds one grant; network access confers no issuing/planning authority. */
export class PodAuthority {
  readonly runtime:ControlRuntime
  readonly guard:GuardAuthority
  private server?:Server
  private maxWorkers:number
  constructor(runtime:ControlRuntime,maxWorkers:number) {
    this.runtime=runtime;this.maxWorkers=maxWorkers;this.guard=new GuardAuthority(runtime.store)
    runtime.store.db.exec("CREATE TABLE IF NOT EXISTS pod_grant_bindings(grant_id TEXT PRIMARY KEY,token_hash TEXT NOT NULL UNIQUE); CREATE TABLE IF NOT EXISTS pod_finish_receipts(grant_id TEXT PRIMARY KEY,input_hash TEXT NOT NULL); CREATE TABLE IF NOT EXISTS pod_model_results(grant_id TEXT PRIMARY KEY,payload TEXT NOT NULL)")
  }
  register(grantId:string,url:string):AuthorityBinding {
    const row=this.runtime.store.db.prepare("SELECT state FROM activation_grants WHERE id=?").get(grantId)
    if(row?.state!=="issued")throw new Error("Only an unused grant can be dispatched to a Pod")
    const token=randomBytes(32).toString("hex")
    this.runtime.store.db.prepare("INSERT INTO pod_grant_bindings VALUES(?,?)").run(grantId,digest(token))
    return {url,token,sessionId:"*"}
  }
  private grant(token:string):ActivationGrant {
    const row=this.runtime.store.db.prepare("SELECT g.payload,g.state FROM activation_grants g JOIN pod_grant_bindings p ON p.grant_id=g.id WHERE p.token_hash=?").get(digest(token))
    if(!row||!["issued","claimed"].includes(String(row.state)))throw new Error("Pod grant is unknown, consumed or fenced")
    const grant=JSON.parse(String(row.payload)) as ActivationGrant
    if(grant.expiresAt<=Date.now())throw new Error("Pod grant expired")
    return grant
  }
  async call(token:string,path:string,input:Record<string,any>):Promise<unknown> {
    const completed=this.runtime.store.db.prepare("SELECT p.grant_id,r.input_hash FROM pod_grant_bindings p JOIN pod_finish_receipts r ON r.grant_id=p.grant_id WHERE p.token_hash=?").get(digest(token))
    if(path==="/finish"&&completed) {
      if(completed.input_hash!==digest(input))throw new Error("Pod finish identity conflict")
      return {accepted:true}
    }
    const grant=this.grant(token),engine=this.runtime.engine
    if(path==="/describe")return {grant,role:this.runtime.store.get<RoleVersion>("role_versions",grant.role.id,grant.role.version)!,context:this.runtime.store.get<ContextManifest>("context_manifests",grant.context.id,grant.context.version)!} satisfies PodDescription
    if(path==="/claim") {
      if(input.taskId!==grant.taskId||input.grantId!==grant.id||input.generation!==grant.generation||typeof input.sessionId!=="string"||!input.sessionId)throw new Error("Pod execution identity mismatch")
      return engine.atomic(()=>{
        const worker=input.sessionId as string
        if(grant.executionMode==="task")withTaskAdmission(engine,grant.id,worker,()=>new TaskScheduler(engine,this.maxWorkers).claim(grant.taskId,{agent:"opencode-granted-pod",sessionId:worker,role:undefined}))
        else if(grant.writeScopes.length)throw new Error("Cognition Pod cannot write task files")
        const snapshot=engine.signals.capture(grant.taskId)
        const inputs=[{entityId:grant.taskId,port:"inputs",view:"legacy-complete-input",version:1,hash:snapshot.digest}]
        const claimed=this.runtime.admission.claim(grant.id,{worker,specHash:snapshot.specHash,inputVector:inputs,graphHash:this.runtime.graph.hash(),generation:grant.generation,now:Date.now()})
        this.guard.bind(worker,grant.id);return claimed
      })
    }
    if(input.sessionId!==grant.worker||!grant.worker)throw new Error("Foreign Pod session")
    if(path==="/authorize"&&this.runtime.store.db.prepare("SELECT 1 FROM pod_model_results WHERE grant_id=?").get(grant.id))throw new Error("Pod model phase is sealed for independent validation")
    if(path==="/authorize")return this.guard.authorize(grant.worker,input.operation)
    if(path==="/record-model")return this.guard.recordModel(grant.worker,input.messageId,input.usage)
    if(path==="/record-tool")return this.guard.recordTool(grant.worker,input.callId,input.result)
    if(path==="/freeze") {
      if(grant.executionMode!=="task")throw new Error("Only task Pods have an independent validation phase")
      return engine.atomic(()=>{
        const existing=this.runtime.store.db.prepare("SELECT payload FROM pod_model_results WHERE grant_id=?").get(grant.id)
        if(existing){if(digest(JSON.parse(String(existing.payload)))!==digest(input))throw new Error("Pod model result identity conflict");return {sealed:true}}
        // Validate the output/usage now, but roll back adoption until the isolated
        // validator Pod supplies actual receipts through the controller API.
        this.runtime.store.db.exec("SAVEPOINT pod_model_preflight")
        try {
          const usage=this.runtime.store.db.prepare("SELECT input_used,output_used,tool_used FROM grant_sessions WHERE session_id=?").get(grant.worker!)!
          const run=this.runtime.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(grant.id)!
          this.runtime.admission.submit(grant.id,grant.worker!,input.output,{inputTokens:Number(usage.input_used),outputTokens:Number(usage.output_used),toolCalls:Number(usage.tool_used),elapsedMs:Date.now()-JSON.parse(String(run.payload)).startedAt})
        }finally{this.runtime.store.db.exec("ROLLBACK TO pod_model_preflight");this.runtime.store.db.exec("RELEASE pod_model_preflight")}
        this.runtime.store.db.prepare("INSERT INTO pod_model_results VALUES(?,?)").run(grant.id,canonical(input))
        return {sealed:true}
      })
    }
    if(path==="/finish") {
      if(grant.executionMode==="task")throw new Error("Only the controller can adopt independent Pod validation")
      return this.finish(grant,input)
    }
    throw new Error("Unknown Pod authority operation")
  }
  private finish(grant:ActivationGrant,input:Record<string,any>):unknown {
    const engine=this.runtime.engine
      // Tool/model receipts, not caller totals, determine acceptance.
      return engine.atomic(()=>{
        const snapshot=engine.signals.capture(grant.taskId)
        if(snapshot.specHash!==grant.specHash||grant.inputVector[0]?.hash!==snapshot.digest||!engine.store.executionAllowed(grant.taskId))throw new Error("Pod result inputs changed")
        const session=this.runtime.store.db.prepare("SELECT input_used,output_used,tool_used FROM grant_sessions WHERE session_id=?").get(grant.worker!)!
        const run=this.runtime.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(grant.id)!
        if(!this.runtime.store.db.prepare("SELECT 1 FROM grant_model_usage WHERE session_id=?").get(grant.worker!)||this.runtime.store.db.prepare("SELECT 1 FROM grant_model_admissions WHERE session_id=? AND active=1").get(grant.worker!)||this.runtime.store.db.prepare("SELECT 1 FROM grant_tool_calls WHERE session_id=? AND output_bytes IS NULL").get(grant.worker!))throw new Error("Pod execution receipts are incomplete")
        this.runtime.admission.submit(grant.id,grant.worker!,input.output as AgentOutput,{inputTokens:Number(session.input_used),outputTokens:Number(session.output_used),toolCalls:Number(session.tool_used),elapsedMs:Date.now()-JSON.parse(String(run.payload)).startedAt})
        if(grant.executionMode==="task") {
          const specs=this.validationSpecs(grant)
          if(!Array.isArray(input.validations)||input.validations.length!==specs.length)throw new Error("Pod semantic validation receipts are missing")
          engine.completeTask({taskId:grant.taskId,attemptToken:engine.store.currentAttempt(grant.taskId)!.token,summary:"Pod structured output and usage accepted; exact-workspace validation follows"})
          for(const {spec,obligation} of specs) {
            const receipt=input.validations.find((value:ValidationReceipt)=>value.validator.id===spec.id&&value.validator.version===spec.version) as ValidationReceipt|undefined
            const envelope={obligation,evidence:obligation.reason.map(ref=>this.runtime.evidence.require(ref))}
            if(!receipt||digest(receipt.inputVector)!==digest(obligation.tuple)||receipt.inputHash!==digest(envelope)||receipt.commandHash!==digest({command:spec.command,cwd:resolve("/data/workspace",spec.cwd),environment:spec.environment})||!Number.isFinite(receipt.startedAt)||!Number.isFinite(receipt.finishedAt)||receipt.finishedAt<receipt.startedAt||receipt.startedAt<JSON.parse(String(run.payload)).startedAt||receipt.finishedAt>Date.now()||receipt.finishedAt-receipt.startedAt>spec.timeoutMs+1000||Buffer.byteLength(receipt.stdout)+Buffer.byteLength(receipt.stderr)>spec.maxOutputBytes)throw new Error("Pod validator receipt violates the pinned execution contract")
            let semantic:ReturnType<typeof decodeSemanticOutput>|undefined,validationError:string|undefined
            try {if(receipt.truncated)throw new Error("Pod semantic output was truncated");semantic=decodeSemanticOutput(receipt.stdout)}catch(error){validationError=error instanceof Error?error.message:"Invalid Pod semantic output"}
            const passed=receipt.exitCode===0&&!receipt.timedOut&&!validationError,content={passed,receipt,...semantic,...(validationError?{validationError}:{})}
            const evidence=this.runtime.evidence.put({id:`pod-validation:${grant.id}:${spec.id}`,version:1,type:"runtime",source:grant.worker!,producer:"granted-pod-validator",validatorVersion:`${spec.id}/v${spec.version}`,timestamp:receipt.finishedAt,content,contentHash:digest(content),inputVector:obligation.tuple,confidence:1,expiresAt:null})
            this.runtime.store.db.prepare("UPDATE validation_jobs SET state=?,payload=? WHERE obligation_id=? AND validator=?").run(passed?"passed":"failed",canonical({evidence,receipt}),obligation.id,`${spec.id}/v${spec.version}`)
            if(!passed) {
              this.runtime.store.db.prepare("UPDATE validation_obligations SET state='failed',payload=? WHERE id=?").run(canonical({...obligation,state:"failed"}),obligation.id)
              this.runtime.store.event({id:`pod-validator-failure:${grant.id}:${spec.id}`,type:"ValidatorFailed",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{obligationId:obligation.id,evidence}})
            }
          }
          for(const obligationId of new Set(specs.map(item=>item.obligation.id))) {
            const refs=this.runtime.store.db.prepare("SELECT payload FROM validation_jobs WHERE obligation_id=? AND state='passed'").all(obligationId).map(row=>JSON.parse(String(row.payload)).evidence)
            if(refs.length!==this.runtime.evidence.obligation(obligationId)!.validators.length)continue
            this.runtime.evidence.resolve(obligationId,refs)
            this.runtime.store.event({id:`pod-validation:${grant.id}:${obligationId}`,type:"ValidatorPassed",entityId:grant.taskId,correlationId:grant.taskId,schemaVersion:1,timestamp:Date.now(),payload:{obligationId,evidence:refs[0]}})
          }
          new TaskScheduler(engine,this.maxWorkers).release(grant.taskId,true)
        }
        this.runtime.store.db.prepare("INSERT INTO pod_finish_receipts VALUES(?,?)").run(grant.id,digest(input))
        return {accepted:true}
      })
    }
  finishValidated(grantId:string,validations:ValidationReceipt[]):unknown {
    const row=this.runtime.store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
    const model=this.runtime.store.db.prepare("SELECT payload FROM pod_model_results WHERE grant_id=?").get(grantId)
    if(row?.state!=="claimed"||!model)throw new Error("No sealed Pod result is available for validation")
    return this.finish(JSON.parse(String(row.payload)),{...JSON.parse(String(model.payload)),validations})
  }
  validationPlan(grantId:string) {
    const row=this.runtime.store.db.prepare("SELECT payload FROM activation_grants WHERE id=? AND state='claimed'").get(grantId)
    if(!row||!this.runtime.store.db.prepare("SELECT 1 FROM pod_model_results WHERE grant_id=?").get(grantId))throw new Error("Validation requires a sealed Pod result")
    return this.validationSpecs(JSON.parse(String(row.payload)))
  }
  private validationSpecs(grant:ActivationGrant) {
    if(grant.executionMode!=="task")return []
    const obligations=this.runtime.evidence.unresolved(grant.taskId).filter(item=>item.kind==="prediction-state")
    if(!obligations.length)throw new Error("Pod worker requires pinned semantic validation")
    return obligations.flatMap(obligation=>obligation.validators.map(validator=>{
      const match=/^([a-z][a-z0-9-]*)\/v([1-9][0-9]*)$/.exec(validator)
      const spec=match&&this.runtime.store.get<RegisteredValidator>("validator_versions",match[1]!,Number(match[2]))
      if(!spec||spec.output!=="semantic-state")throw new Error("Missing Pod semantic validator")
      spec.authorization.forEach(ref=>this.runtime.evidence.require(ref))
      return {spec,obligation,evidence:obligation.reason.map(ref=>this.runtime.evidence.require(ref))}
    }))
  }
  async listen(options:{host:string;port:number}):Promise<number> {
    if(this.server)throw new Error("Pod authority already listening")
    const server=createServer(async(req,res)=>{
      res.setHeader("content-type","application/json");res.setHeader("cache-control","no-store")
      try {
        if(req.method!=="POST")throw new Error("POST required")
        const token=req.headers.authorization?.replace(/^Bearer /,"")??""
        if(!/^[a-f0-9]{64}$/.test(token))throw new Error("Missing adapter capability")
        let body="",size=0
        for await(const chunk of req){size+=chunk.length;if(size>262144)throw new Error("Pod authority request too large");body+=chunk}
        const result=await this.call(token,req.url??"",JSON.parse(body));res.end(canonical({result:result??null}))
      }catch(error){res.statusCode=403;res.end(canonical({error:error instanceof Error?error.message:"Pod request rejected"}))}
    })
    server.requestTimeout=10000;server.headersTimeout=10000
    await new Promise<void>((resolve,reject)=>{server.once("error",reject);server.listen(options.port,options.host,()=>{server.off("error",reject);resolve()})})
    this.server=server;const address=server.address();if(!address||typeof address==="string")throw new Error("Pod authority address unavailable");return address.port
  }
  async close():Promise<void>{if(!this.server)return;this.server.closeAllConnections();await new Promise<void>((resolve,reject)=>this.server!.close(error=>error?reject(error):resolve()));this.server=undefined}
}
