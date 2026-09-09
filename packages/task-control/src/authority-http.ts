import { createServer, type Server, type IncomingMessage } from "node:http"
import { randomBytes, timingSafeEqual } from "node:crypto"
import type { GrantAuthority, GrantAuthorization } from "../../opencode-harness/src/grant-hooks.ts"

export interface AuthorityBinding { url:string; token:string; sessionId:string }

/** Adapter credentials authorize one already-bound session, never grant issuance. */
export class AuthorityHttpServer {
  private authority:GrantAuthority
  private server:Server
  private bindings=new Map<string,string>()
  private origin?:string
  constructor(authority:GrantAuthority) {
    this.authority=authority
    this.server=createServer(async(req,res)=>{
      res.setHeader("content-type","application/json")
      res.setHeader("cache-control","no-store")
      try {
        if(req.method!=="POST")throw new Error("POST required")
        const token=req.headers.authorization?.replace(/^Bearer /,"")??""
        const bound=[...this.bindings].find(([secret])=>secret.length===token.length&&timingSafeEqual(Buffer.from(secret),Buffer.from(token)))?.[1]
        if(!bound){res.statusCode=401;res.end(JSON.stringify({error:"Unauthorized adapter"}));return}
        const input=JSON.parse(await body(req))
        if(typeof input.sessionId!=="string"||!input.sessionId||(bound!=="*"&&input.sessionId!==bound))throw new Error("Foreign session")
        const session=input.sessionId
        let result:unknown
        switch(req.url) {
          case "/authorize": {
            const op=input.operation
            if(!op||!["model","tool"].includes(op.kind))throw new Error("Invalid operation")
            result=await this.authority.authorize(session,op);break
          }
          case "/record-tool": await this.authority.recordTool(session,input.callId,input.result);result=null;break
          case "/record-model": await this.authority.recordModel(session,input.messageId,input.usage);result=null;break
          default:throw new Error("Unknown authority operation")
        }
        res.end(JSON.stringify({result}))
      } catch(error) {
        res.statusCode=403
        res.end(JSON.stringify({error:error instanceof Error?error.message:"Authority rejected request"}))
      }
    })
    this.server.requestTimeout=10000
    this.server.headersTimeout=10000
  }
  async listen():Promise<void> {
    if(this.origin)return
    await new Promise<void>((resolve,reject)=>{
      this.server.once("error",reject)
      this.server.listen(0,"127.0.0.1",()=>{this.server.off("error",reject);resolve()})
    })
    const address=this.server.address()
    if(!address||typeof address==="string")throw new Error("Authority address unavailable")
    this.origin=`http://127.0.0.1:${address.port}`
  }
  register(sessionId:string):AuthorityBinding {
    if(!this.origin||!sessionId)throw new Error("Authority is not ready")
    const token=randomBytes(32).toString("hex")
    this.bindings.set(token,sessionId)
    return {url:this.origin,token,sessionId}
  }
  revoke(binding:AuthorityBinding):void {this.bindings.delete(binding.token)}
  async close():Promise<void> {
    this.bindings.clear()
    if(!this.server.listening)return
    this.server.closeAllConnections()
    await new Promise<void>((resolve,reject)=>this.server.close(error=>error?reject(error):resolve()))
    this.origin=undefined
  }
}

async function body(req:IncomingMessage):Promise<string> {
  let size=0
  const chunks:Buffer[]=[]
  for await(const chunk of req) {
    const bytes=Buffer.from(chunk);size+=bytes.length
    if(size>65536)throw new Error("Authority request exceeds limit")
    chunks.push(bytes)
  }
  return Buffer.concat(chunks).toString("utf8")
}

export class AuthorityHttpClient implements GrantAuthority {
  private binding:AuthorityBinding
  constructor(binding:AuthorityBinding) {
    const url=new URL(binding.url)
    if(url.username||url.password||url.search||url.hash||url.pathname!=="/"||
      (url.protocol!=="https:"&&!(url.protocol==="http:"&&["127.0.0.1","[::1]"].includes(url.hostname)))||
      !/^[a-f0-9]{64}$/.test(binding.token)||!binding.sessionId)throw new Error("Invalid authority binding")
    this.binding=binding
  }
  private async call(path:string,sessionId:string,args:object):Promise<unknown> {
    if(this.binding.sessionId!=="*"&&sessionId!==this.binding.sessionId)throw new Error("Session has no adapter capability")
    const response=await fetch(new URL(path,this.binding.url),{method:"POST",redirect:"error",signal:AbortSignal.timeout(5000),headers:{"content-type":"application/json",authorization:`Bearer ${this.binding.token}`},body:JSON.stringify({...args,sessionId})})
    const value=await response.json() as {result?:unknown;error?:string}
    if(!response.ok)throw new Error(value.error??"Authority unavailable")
    return value.result
  }
  async authorize(sessionId:string,operation:Parameters<GrantAuthority["authorize"]>[1]):Promise<GrantAuthorization> {
    return await this.call("/authorize",sessionId,{operation}) as GrantAuthorization
  }
  async recordTool(sessionId:string,callId:string,result:{outputBytes:number}):Promise<void> {await this.call("/record-tool",sessionId,{callId,result})}
  async recordModel(sessionId:string,messageId:string,usage:{inputTokens:number;outputTokens:number}):Promise<void> {await this.call("/record-model",sessionId,{messageId,usage})}
}
