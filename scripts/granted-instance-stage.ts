import { mkdirSync,existsSync,writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { PodClient } from "../packages/task-control/src/pod-client.ts"
import type { PodDescription } from "../packages/task-control/src/pod-authority.ts"
import { OpenCodeConnection } from "../packages/opencode-harness/src/index.ts"
import { validateProfile } from "../packages/task-cognition/src/precision.ts"
import { safeDiagnostic } from "../packages/task-instances/src/diagnostics.ts"

// Admission happens before credentials are materialized or a model server starts.
const binding=process.env.TASK_GRANT_BINDING?JSON.parse(process.env.TASK_GRANT_BINDING):null
if(!binding)throw new Error("A Pod model stage requires a controller activation capability")
const authority=new PodClient(binding),description=await authority.request<PodDescription>("/describe")
const {grant,role,context}=description
if(grant.id!==process.env.TASK_ACTIVATION_GRANT||grant.taskId!==process.env.TASK_ACTIVATION_TASK||grant.worker||grant.expiresAt<=Date.now())throw new Error("Pod activation is stale, consumed or belongs to another task")
validateProfile(grant.profile)
const data=process.env.XDG_DATA_HOME,state=process.env.XDG_STATE_HOME
if(!data||!state)throw new Error("Pod task-private data and state directories are required")
const authDirectory=resolve(data,"opencode");mkdirSync(authDirectory,{recursive:true,mode:0o700})
const auth=resolve(authDirectory,"auth.json")
if(!existsSync(auth)&&process.env.TASK_MODEL_AUTH_JSON)writeFileSync(auth,JSON.stringify(JSON.parse(process.env.TASK_MODEL_AUTH_JSON)),{mode:0o600})
delete process.env.TASK_MODEL_AUTH_JSON
const workspace=process.cwd(),directory=resolve(state,"granted",grant.id)
mkdirSync(directory,{recursive:true,mode:0o700})
const connection=new OpenCodeConnection({directory,serverConfig:{plugin:[[new URL("../packages/opencode-harness/src/grant-plugin.ts",import.meta.url).href,binding]],default_agent:"task-cognitive",share:"disabled",compaction:{auto:false},agent:{"task-cognitive":{mode:"primary",description:"Single controller-authorized Pod role",prompt:"Use only the pinned role and context. Return the required JSON object.",permission:{"*":"deny","task_graph_cognitive_*":"allow"}}}}})
let sessionId:string|undefined
let timer:ReturnType<typeof setTimeout>|undefined
try {
  const client=await connection.client()
  const provider=(await client.config.providers({directory:workspace})).data?.providers.find(provider=>provider.id===grant.profile.provider)
  if(!provider?.models[grant.profile.model])throw new Error("Granted model is unavailable in this Pod")
  const session=await client.session.create({directory:workspace,title:`Granted Pod ${grant.id}`,agent:"task-cognitive",model:{providerID:grant.profile.provider,id:grant.profile.model}})
  sessionId=session.data?.id;if(!sessionId)throw new Error("Pod session creation failed")
  await authority.request("/claim",{sessionId,grantId:grant.id,taskId:grant.taskId,generation:grant.generation})
  const connected=await client.mcp.add({directory:workspace,name:"task_graph",config:{type:"local",enabled:true,command:[process.execPath,fileURLToPath(new URL("./pod-cognitive-mcp.ts",import.meta.url))],environment:{TASK_GRANT_BINDING:JSON.stringify(binding),XDG_STATE_HOME:state,TASK_INPUT_SOURCES:process.env.TASK_INPUT_SOURCES??"[]"}}})
  if(connected.data?.task_graph?.status!=="connected")throw new Error("Pod cognitive gateway failed to connect")
  const response=await Promise.race([
    client.session.prompt({directory:workspace,sessionID:sessionId,agent:"task-cognitive",model:{providerID:grant.profile.provider,modelID:grant.profile.model},system:role.prompt,parts:[{type:"text",text:JSON.stringify({taskId:grant.taskId,context,verifiedInputWorkspaces:JSON.parse(process.env.TASK_INPUT_SOURCES??"[]").map((source:{taskId:string;hash:string})=>({path:`inputs/${source.taskId}/`,hash:source.hash})),outputSchema:role.outputSchema})}]}),
    new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Pod model budget expired")),Math.max(1,Math.min(grant.profile.timeoutMs,grant.expiresAt-Date.now())))})
  ])
  if(timer){clearTimeout(timer);timer=undefined}
  if(response.error||response.data?.info.error||response.data?.info.finish!=="stop")throw new Error("Pod model did not produce a successful bounded response")
  const messages=(await client.session.messages({directory:workspace,sessionID:sessionId})).data
  if(!messages)throw new Error("Pod model usage receipts are unavailable")
  let steps=0
  for(const message of messages)for(const part of message.parts)if(part.type==="step-finish"){steps++;await authority.recordModel(sessionId,part.id,{inputTokens:part.tokens.input+part.tokens.cache.read+part.tokens.cache.write,outputTokens:part.tokens.output+part.tokens.reasoning})}
  if(!steps)throw new Error("Pod model usage is unknown")
  const output=JSON.parse(response.data.parts.filter(part=>part.type==="text").map(part=>part.text).join("\n"))
  if(grant.executionMode==="task")await authority.request("/freeze",{sessionId,output})
  else await authority.request("/finish",{sessionId,output,validations:[]})
  process.stdout.write(JSON.stringify({type:"granted_stage_completed",grantId:grant.id})+"\n")
}catch(error){
  process.stderr.write(safeDiagnostic(error instanceof Error?error.message:"Granted Pod failed",1500)+"\n");process.exitCode=1
}finally{if(timer)clearTimeout(timer);await connection.close()}
