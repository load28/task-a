import { lstatSync,realpathSync,readFileSync,mkdirSync } from "node:fs"
import { resolve,dirname,join,relative } from "node:path"
import { durableReplace } from "./durable-file.ts"
import { digest,canonical } from "./value.ts"
import type { PodDescription } from "./pod-authority.ts"
import { PodClient } from "./pod-client.ts"

/** Only literal file capabilities are local; every call consults the live controller. */
export class PodGateway {
  private client:PodClient;private root:string;private journal:string
  private sources:Array<{taskId:string;path:string}>
  constructor(client:PodClient,workspace:string,journal:string,sources:Array<{taskId:string;path:string}>=[]){this.client=client;this.root=realpathSync(workspace);this.journal=journal;this.sources=sources;mkdirSync(journal,{recursive:true,mode:0o700})}
  async execute(name:string,input:Record<string,unknown>):Promise<unknown> {
    const {grantId,workerSessionId,authorizationCallId,...args}=input
    if(typeof workerSessionId!=="string"||typeof authorizationCallId!=="string")throw new Error("Missing injected Pod call identity")
    const {grant,context}=await this.client.request<PodDescription>("/describe")
    if(grant.id!==grantId||grant.worker!==workerSessionId||grant.expiresAt<=Date.now())throw new Error("Foreign or expired Pod grant")
    const authorization=await this.client.authorize(workerSessionId,{kind:"tool",tool:`task_graph_${name}`,callId:authorizationCallId,argsHash:digest(args)})
    if(authorization.grant.id!==grantId)throw new Error("Authority identity mismatch")
    const signature=digest({name,args}),receiptPath=join(this.journal,digest({grantId,authorizationCallId})+".json")
    const prior=lstatSync(receiptPath,{throwIfNoEntry:false})?JSON.parse(readFileSync(receiptPath,"utf8")) as {signature:string;state:string;result:any}:undefined
    if(prior&&prior.signature!==signature)throw new Error("Pod tool identity conflict")
    if(prior?.state==="completed")return prior.result
    const save=(state:string,result:unknown)=>durableReplace(receiptPath,canonical({signature,state,result}))
    let result:unknown
    if(name==="cognitive_context")result=context
    else if(name==="cognitive_read") {
      if(prior?.state==="read-prepared")result=prior.result
      else {
        const file=this.path(args.path,grant.readScopes??[],true),stat=lstatSync(file)
        if(!stat.isFile()||(authorization.remainingInputTokens!==null&&stat.size>authorization.remainingInputTokens))throw new Error("Pod read exceeds the context budget")
        const content=new TextDecoder("utf-8",{fatal:true}).decode(readFileSync(file));result={path:args.path,content,hash:digest(content)}
        save("read-prepared",result)
      }
      await this.client.request("/observe-read",{sessionId:workerSessionId,callId:authorizationCallId,path:args.path,hash:(result as {hash:string}).hash})
    }else if(name==="cognitive_write") {
      if(grant.executionMode!=="task"||typeof args.content!=="string"||!(args.previousHash===null||typeof args.previousHash==="string"))throw new Error("Invalid Pod write")
      const file=this.path(args.path,grant.writeScopes),stat=lstatSync(file,{throwIfNoEntry:false}),previous=stat?digest(readFileSync(file,"utf8")):null,hash=digest(args.content)
      result={path:args.path,hash}
      if(!prior){if(previous!==args.previousHash)throw new Error("Pod file changed after read");save("prepared",result)}
      if(previous!==hash) {
        if(previous!==args.previousHash)throw new Error("Interrupted Pod write requires reconciliation")
        durableReplace(file,args.content,stat?stat.mode&0o777:0o600)
      }
    }else throw new Error("Pod tool is not exposed")
    save("completed",result);return result
  }
  private path(value:unknown,scopes:string[],read=false):string {
    if(typeof value!=="string"||!value||value.startsWith("/")||value.includes("\\")||value.includes("\0")||value.split("/").some(part=>["",".","..",".git",".codex",".agents",".task-agent"].includes(part))||!scopes.some(scope=>scope==="."||scope===value||value.startsWith(scope+"/")))throw new Error("Pod path exceeds the grant")
    const source=this.sources.find(source=>value.startsWith(`inputs/${source.taskId}/`))
    if(source&&!read)throw new Error("Pinned input workspaces are read-only")
    const root=source?realpathSync(source.path):this.root,local=source?value.slice(`inputs/${source.taskId}/`.length):value
    let current=root
    for(const part of local.split("/")){current=join(current,part);const stat=lstatSync(current,{throwIfNoEntry:false});if(stat&&(stat.isSymbolicLink()||!stat.isDirectory()&&!stat.isFile()||stat.isFile()&&stat.nlink!==1))throw new Error("Pod path alias or special file is forbidden")}
    const parent=realpathSync(dirname(current));if(relative(root,parent).startsWith(".."))throw new Error("Pod parent escaped workspace")
    return resolve(parent,value.split("/").at(-1)!)
  }
}
