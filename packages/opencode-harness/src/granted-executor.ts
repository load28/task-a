import type { Config, OpencodeClient } from "@opencode-ai/sdk/v2"
import { fileURLToPath } from "node:url"
import { mkdirSync,existsSync,readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import { AuthorityHttpServer } from "../../task-control/src/authority-http.ts"
import { CognitiveGateway } from "../../task-control/src/gateway.ts"
import { GuardAuthority } from "../../task-control/src/guard-authority.ts"
import { TaskScheduler } from "../../task-engine/src/scheduling.ts"
import { attemptInputVector,currentInputVector } from "../../task-control/src/completion.ts"
import { withTaskAdmission } from "../../task-control/src/task-admission.ts"
import type { ActivationGrant, AgentOutput, ContextManifest, RoleVersion } from "../../task-cognition/src/model.ts"
import { OpenCodeConnection } from "./index.ts"
import { safeDiagnostic } from "../../task-instances/src/diagnostics.ts"
import { digest, canonical } from "../../task-control/src/value.ts"

export class GrantedOpenCodeExecutor {
  private runtime:ControlRuntime
  private workspace:string
  private database:string
  private stateDirectory:string
  private authority:GuardAuthority
  private rpc:AuthorityHttpServer
  private connection?:OpenCodeConnection
  private client?:OpencodeClient
  private limit:number
  private starting?:Promise<void>
  private closed=false
  constructor(input:{runtime:ControlRuntime;workspace:string;database:string;stateDirectory:string;maxWorkers:number}) {
    this.runtime=input.runtime;this.workspace=resolve(input.workspace);this.database=resolve(input.database)
    this.stateDirectory=resolve(input.stateDirectory);this.limit=input.maxWorkers
    this.authority=new GuardAuthority(input.runtime.store);this.rpc=new AuthorityHttpServer(this.authority)
    input.runtime.store.db.exec("CREATE TABLE IF NOT EXISTS native_capability_failures(provider TEXT NOT NULL,model TEXT NOT NULL,backend_hash TEXT NOT NULL,capability TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(provider,model,backend_hash,capability))")
  }
  async start():Promise<void> {
    if(this.closed)throw new Error("Granted executor is closed")
    if(this.client)return
    this.starting??=this.startServer().catch(error=>{this.starting=undefined;throw error})
    return this.starting
  }
  private async startServer():Promise<void> {
    await this.rpc.listen()
    const binding=this.rpc.register("*")
    mkdirSync(this.stateDirectory,{recursive:true,mode:0o700})
    const config:Config={
      plugin:[[new URL("./grant-plugin.ts",import.meta.url).href,{...binding}]],
      default_agent:"task-cognitive",share:"disabled",compaction:{auto:false},
      agent:{"task-cognitive":{mode:"primary",description:"Execute one controller-issued role grant",prompt:"Follow the pinned role and context. Return only the required JSON object. Graph mutations and ungranted tools are unavailable.",permission:{"*":"deny","task_graph_cognitive_*":"allow"}}},
    }
    this.connection=new OpenCodeConnection({directory:this.stateDirectory,serverConfig:config})
    let client:OpencodeClient
    try {client=await this.connection.client()}
    catch(error) {
      // A prior authority token cannot survive controller restart. Retire that
      // authenticated transport only after all bound grants have been fenced.
      if(!(error instanceof Error)||!error.message.includes("configuration changed")||this.runtime.store.db.prepare("SELECT 1 FROM activation_grants WHERE state='claimed' LIMIT 1").get())throw error
      if(this.runtime.store.db.prepare("SELECT 1 FROM sqlite_master WHERE name='grant_dispatches'").get()&&this.runtime.store.db.prepare("SELECT 1 FROM grant_dispatches WHERE state='stopping' LIMIT 1").get())throw new Error("Original controlled endpoint must remain available until worker termination is confirmed")
      await this.connection.close()
      if(existsSync(resolve(this.stateDirectory,"opencode-server.json")))throw new Error("Previous controlled server termination is unconfirmed")
      this.connection=new OpenCodeConnection({directory:this.stateDirectory,serverConfig:config})
      client=await this.connection.client()
    }
    const connected=await client.mcp.add({directory:this.workspace,name:"task_graph",config:{type:"local",command:[process.execPath,fileURLToPath(new URL("../../../scripts/graph-mcp.ts",import.meta.url)),this.database],environment:{TASK_GRAPH_SURFACE:"cognitive",TASK_AGENT_INTERNAL:"1",TASK_AGENT_WORKSPACE:this.workspace,TASK_AGENT_MAX_WORKERS:String(this.limit)},enabled:true}})
    if(connected.data?.task_graph?.status!=="connected")throw new Error("Controlled graph gateway did not connect")
    this.client=client
  }
  async stop(sessionId:string):Promise<{stopped:boolean;evidence:string}> {
    let client=this.client
    if(!client) {
      const metadata=resolve(this.stateDirectory,"opencode-server.json")
      if(!existsSync(metadata))return {stopped:false,evidence:"Original native endpoint is unavailable"}
      const saved=JSON.parse(readFileSync(metadata,"utf8")) as {url:string;password:string}
      if(new URL(saved.url).hostname!=="127.0.0.1")throw new Error("Invalid native recovery endpoint")
      client=await new OpenCodeConnection({baseUrl:saved.url,username:"task-agent",password:saved.password}).client()
    }
    const session=await client.session.get({directory:this.workspace,sessionID:sessionId})
    if(session.data?.directory!==this.workspace)return {stopped:false,evidence:"Native session workspace is unconfirmed"}
    const children=await client.session.children({directory:this.workspace,sessionID:sessionId})
    if(!children.data||children.data.length)return {stopped:false,evidence:"Unexpected child sessions require separate termination"}
    const aborted=await client.session.abort({directory:this.workspace,sessionID:sessionId})
    const status=await client.session.status({directory:this.workspace})
    if(aborted.data!==true||!status.data||(status.data[sessionId]?.type??"idle")!=="idle")return {stopped:false,evidence:"Native abort and idle were not both acknowledged"}
    const engine=this.runtime.engine
    engine.atomic(()=>{
      const bound=this.runtime.store.db.prepare("SELECT g.payload FROM activation_grants g JOIN grant_sessions s ON s.grant_id=g.id WHERE s.session_id=?").get(sessionId)
      if(!bound)return
      const grant=JSON.parse(String(bound.payload)) as ActivationGrant
      if(grant.executionMode!=="task")return
      const task=engine.requireTask(grant.taskId),attempt=engine.store.currentAttempt(task.id)
      if(attempt?.worker?.sessionId!==sessionId)return
      if(task.status==="running")engine.failTask(task.id,"Controlled worker stopped",attempt.token)
      new TaskScheduler(engine,this.limit,this.workspace).release(task.id,true)
    })
    return {stopped:true,evidence:"Native abort acknowledged and session idle confirmed"}
  }
  async execute(grantId:string):Promise<AgentOutput> {
    const pending=this.runtime.store.db.prepare("SELECT payload FROM activation_grants WHERE id=?").get(grantId)
    if(pending&&JSON.parse(String(pending.payload)).profile.level<2)throw new Error("Non-model grants cannot enter the model executor")
    await this.start()
    const client=this.client!,store=this.runtime.store,engine=this.runtime.engine
    const row=store.db.prepare("SELECT state,payload FROM activation_grants WHERE id=?").get(grantId)
    if(!row||row.state!=="issued")throw new Error("Native execution requires an unused grant")
    const grant=JSON.parse(String(row.payload)) as ActivationGrant
    const role=store.get<RoleVersion>("role_versions",grant.role.id,grant.role.version)!
    const manifest=store.get<ContextManifest>("context_manifests",grant.context.id,grant.context.version)!
    const available=(await client.config.providers({directory:this.workspace})).data
    const provider=available?.providers.find(provider=>provider.id===grant.profile.provider)
    if(!provider?.models[grant.profile.model])throw new Error("Granted model is not supported by the active provider")
    const backendHash=digest({id:provider.id,options:provider.options,source:provider.source})
    if(store.db.prepare("SELECT 1 FROM native_capability_failures WHERE provider=? AND model=? AND backend_hash=?").get(grant.profile.provider,grant.profile.model,backendHash))throw new Error("Provider previously rejected the strict profile; revalidate a supported authentication route before execution")
    const sessionStartedAt=Date.now(),created=await client.session.create({directory:this.workspace,title:`Granted role ${grant.id}`,agent:"task-cognitive",model:{id:grant.profile.model,providerID:grant.profile.provider}})
    const session=created.data?.id
    if(!session)throw new Error("Native session creation failed")
    const owner=store.db.prepare("SELECT request_id FROM controlled_tasks WHERE task_id=?").get(grant.taskId)
    if(owner) {
      const prior=store.db.prepare("SELECT g.id FROM activation_grants g WHERE g.id<>? AND g.task_id IN (SELECT task_id FROM controlled_tasks WHERE request_id=? UNION SELECT task_id FROM request_task_history WHERE request_id=?) AND g.state IN ('fenced','completed') LIMIT 1").get(grant.id,String(owner.request_id),String(owner.request_id))
      if(prior)this.runtime.regionCosts.operational({grantId:grant.id,category:"warmSessionLoss",elapsedMs:Date.now()-sessionStartedAt,source:"native executor replacement session creation",content:{sessionId:session,priorGrantId:String(prior.id)}})
    }
    const scheduler=new TaskScheduler(engine,this.limit,this.workspace)
    engine.atomic(()=>{
      if(!engine.store.executionAllowed(grant.taskId))throw new Error("Task execution is fenced")
      if(grant.executionMode==="task")withTaskAdmission(engine,grant.id,session,()=>scheduler.claim(grant.taskId,{agent:"opencode-granted",sessionId:session}))
      else if(grant.writeScopes.length)throw new Error("A cognition-only grant cannot write task files")
      const current=engine.signals.capture(grant.taskId)
      const inputs=grant.executionMode==="task"?attemptInputVector(engine,grant.taskId):currentInputVector(engine,grant.taskId)
      this.runtime.admission.claim(grant.id,{worker:session,specHash:current.specHash,inputVector:inputs,graphHash:this.runtime.graph.hash(),generation:grant.generation,now:Date.now()})
      this.authority.bind(session,grant.id)
    })
    const began=Date.now()
    let timer:ReturnType<typeof setTimeout>|undefined
    try {
      const response=await Promise.race([
        client.session.prompt({directory:this.workspace,sessionID:session,agent:"task-cognitive",model:{providerID:grant.profile.provider,modelID:grant.profile.model},system:role.prompt,parts:[{type:"text",text:JSON.stringify({taskId:grant.taskId,context:manifest,outputSchema:role.outputSchema})}]}),
        new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Granted execution deadline exceeded")),Math.max(1,Math.min(grant.profile.timeoutMs,grant.expiresAt-Date.now())))})
      ])
      if(response.error||!response.data||response.data.info.error) {
        const failure=response.error??response.data?.info.error
        const message=JSON.stringify(failure??"missing response")
        if(message.includes("Unsupported parameter")&&message.includes("max_output_tokens"))store.db.prepare("INSERT OR REPLACE INTO native_capability_failures VALUES(?,?,?,?,?)").run(grant.profile.provider,grant.profile.model,backendHash,"tokenLimit",canonical({timestamp:Date.now(),error:"Unsupported parameter: max_output_tokens",grantId:grant.id}))
        throw new Error(`Native model did not produce a successful response: ${safeDiagnostic(message,1500)}`)
      }
      const messages=(await client.session.messages({directory:this.workspace,sessionID:session})).data
      if(!messages)throw new Error("Native usage receipts are unavailable")
      let steps=0
      for(const message of messages)for(const part of message.parts)if(part.type==="step-finish") {
        steps++
        await this.authority.recordModel(session,part.id,{inputTokens:part.tokens.input+part.tokens.cache.read+part.tokens.cache.write,outputTokens:part.tokens.output+part.tokens.reasoning})
      }
      if(!steps||response.data.info.finish!=="stop")throw new Error("Native completion or actual usage is missing")
      const output=JSON.parse(response.data.parts.filter(part=>part.type==="text").map(part=>part.text).join("\n")) as AgentOutput
      const usage=store.db.prepare("SELECT input_used,output_used,tool_used FROM grant_sessions WHERE session_id=?").get(session)!
      engine.atomic(()=>{
        new CognitiveGateway(engine,this.workspace).assertReadsCurrent(grant.id)
        this.runtime.admission.submit(grant.id,session,output,{inputTokens:Number(usage.input_used),outputTokens:Number(usage.output_used),toolCalls:Number(usage.tool_used),elapsedMs:Date.now()-began})
        if(grant.executionMode==="task") {
          engine.completeTask({taskId:grant.taskId,attemptToken:engine.store.currentAttempt(grant.taskId)?.token,summary:`Role output recorded: ${role.name}; deterministic validation remains required`})
          scheduler.release(grant.taskId,true)
        }
      })
      return output
    } catch(error) {
      this.runtime.admission.fence(grant.taskId)
      const stopped=await client.session.abort({directory:this.workspace,sessionID:session}).catch(()=>undefined)
      const states=await client.session.status({directory:this.workspace}).catch(()=>undefined)
      const task=engine.requireTask(grant.taskId),attempt=engine.store.currentAttempt(task.id)
      if(grant.executionMode==="task"&&task.status==="running")engine.failTask(task.id,error instanceof Error?error.message:"Native execution failed",attempt?.token)
      if(grant.executionMode==="task"&&stopped?.data===true&&states?.data&&(states.data[session]?.type??"idle")==="idle")scheduler.release(task.id,true)
      throw error
    } finally {if(timer)clearTimeout(timer)}
  }
  async close():Promise<void> {
    this.closed=true
    await this.starting?.catch(()=>{})
    await this.connection?.close()
    await this.rpc.close()
    this.client=undefined;this.connection=undefined
  }
}
