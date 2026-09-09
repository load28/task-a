import { digest } from "../../task-control/src/value.ts"
import { RequestController } from "../../task-control/src/requests.ts"
import type { ControlRuntime } from "../../task-control/src/runtime.ts"
import type { HarnessServer, ServerBinding, ServerState } from "../../opencode-harness/src/server.ts"
import { OpenCodeServer } from "../../opencode-harness/src/server.ts"
import type { HostConfig } from "./config.ts"

/** Relay compatibility ends here. This transport has no model client or raw tools. */
export class ControlServer implements HarnessServer {
  private controllers=new Map<string,RequestController>()
  private legacy?:OpenCodeServer
  private config:HostConfig
  private runtime:(workspace:string,database?:string)=>ControlRuntime
  private stopBound:(workspace:string,session:string)=>Promise<{stopped:boolean;evidence:string}>
  private stopGrant?:(workspace:string,grantId:string)=>Promise<{stopped:boolean;evidence:string}>
  constructor(config:HostConfig,runtime:(workspace:string,database?:string)=>ControlRuntime,stopBound:(workspace:string,session:string)=>Promise<{stopped:boolean;evidence:string}>,stopGrant?:(workspace:string,grantId:string)=>Promise<{stopped:boolean;evidence:string}>) {
    this.config=config;this.runtime=runtime;this.stopBound=stopBound;this.stopGrant=stopGrant
  }
  private controller(workspace:string):RequestController {
    let controller=this.controllers.get(workspace)
    if(!controller){controller=this.runtime(workspace).requests;this.controllers.set(workspace,controller)}
    return controller
  }
  async prepare(workspace:string,database:string):Promise<void> {
    if(this.config.graphMcpUrl)throw new Error("제어기 실행에는 트랜잭션을 공유하는 로컬 그래프가 필요합니다.")
    this.runtime(workspace,database);this.controller(workspace)
  }
  async createSession(workspace:string,key:string):Promise<string>{return `control_${digest({workspace,key})}`}
  async submit(binding:ServerBinding,text:string,plan:boolean):Promise<void> {
    const controller=this.controller(binding.workspace)
    // Request identity is the relay message identity, including after recovery.
    const input={id:binding.messageID,sessionId:binding.sessionID,text,planOnly:plan,program:this.config.controlProgram}
    if(binding.control==="steer"&&binding.parentMessageID)controller.steer(binding.parentMessageID,input)
    else controller.submit(input)
    controller.tick()
  }
  async hasMessage(binding:ServerBinding):Promise<boolean>{return !!this.controller(binding.workspace).get(binding.messageID)}
  async inspect(binding:ServerBinding):Promise<ServerState> {
    const controller=this.controller(binding.workspace);controller.tick()
    const request=controller.get(binding.messageID)
    if(!request)return {state:"interrupted",text:"제어 이벤트를 찾을 수 없습니다.",questions:[],permissions:[],activity:[]}
    const state:ServerState["state"]=request.state==="cancelled"?"interrupted":["completed","failed","waiting"].includes(request.state)?request.state as ServerState["state"]:"running"
    return {state,text:request.reason??(state==="completed"?(request.planOnly?"계획 제안 검증을 완료했습니다.":"등록된 검증기로 실행 결과를 확인했습니다."):`제어 요청 상태: ${request.state}`),executionTaskIds:controller.tasks(request.id),questions:controller.questions.pending(request.id).map(question=>({id:question.id,sessionID:question.sessionId,questions:question.questions.map(text=>({question:text,header:"계획 확인",options:[],custom:true}))})),permissions:[],activity:[]}
  }
  async reply(binding:ServerBinding,input:Parameters<HarnessServer["reply"]>[1]):Promise<void> {
    if(input.kind!=="question")throw new Error("Permission replies cannot expand a registered controller program")
    const controller=this.controller(binding.workspace)
    controller.questions.answer(binding.messageID,binding.sessionID,input.requestID,input.answers)
    controller.tick()
  }
  async cancel(binding:ServerBinding):Promise<void> {
    const controller=this.controller(binding.workspace),request=controller.get(binding.messageID)
    if(!request)return
    controller.cancel(request.id)
    const rows=controller.store.db.prepare("SELECT id,payload FROM activation_grants WHERE task_id IN (SELECT task_id FROM control_request_tasks WHERE request_id=?) OR task_id=?").all(request.id,request.taskId)
    for(const row of rows) {
      const grant=JSON.parse(String(row.payload)) as {worker?:string}
      if(grant.worker){const result=await this.stopBound(binding.workspace,grant.worker);if(!result.stopped)throw new Error(result.evidence)}
      else if(this.stopGrant){const result=await this.stopGrant(binding.workspace,String(row.id));if(!result.stopped)throw new Error(result.evidence)}
    }
  }
  async stopWorker(workspace:string,sessionId:string) {
    // Only used to retire pre-migration workers; never submits a prompt.
    this.legacy??=new OpenCodeServer(this.config)
    return this.legacy.stopWorker(workspace,sessionId)
  }
  async stopWorkspace(workspace:string) {
    const controller=this.controller(workspace)
    for(const row of controller.store.db.prepare("SELECT payload FROM control_requests WHERE state NOT IN ('completed','cancelled')").all()) {
      const request=JSON.parse(String(row.payload)) as {id:string;sessionId:string}
      await this.cancel({workspace,sessionID:request.sessionId,messageID:request.id})
    }
    const legacy=controller.store.db.prepare("SELECT payload FROM task_attempts WHERE json_extract(payload,'$.state')='running'").all().some(row=>{
      const worker=(JSON.parse(String(row.payload)) as {worker?:{sessionId?:string}}).worker
      return worker?.sessionId&&!controller.store.db.prepare("SELECT 1 FROM activation_grants WHERE json_extract(payload,'$.worker')=?").get(worker.sessionId)
    })
    if(legacy){this.legacy??=new OpenCodeServer(this.config);return this.legacy.stopWorkspace(workspace)}
    return {stopped:true,evidence:"Controller requests cancelled and bound workers acknowledged stop"}
  }
  async readiness():Promise<unknown>{return {architecture:"event-driven-control",program:this.config.controlProgram??null,workspaces:[...this.controllers.keys()]}}
  async close():Promise<void>{await this.legacy?.close()}
}
