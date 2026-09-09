import { PodClient } from "../packages/task-control/src/pod-client.ts"
import { PodGateway } from "../packages/task-control/src/pod-gateway.ts"
import { cognitiveTools } from "../packages/task-control/src/gateway.ts"
import { TaskAgentMcpServer,serveStdio } from "../packages/protocol-mcp/src/index.ts"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { resolve } from "node:path"
const binding=JSON.parse(process.env.TASK_GRANT_BINDING??"null")
if(!binding)throw new Error("Pod MCP requires an activation capability")
const runtime=createGraphRuntime(":memory:"),client=new PodClient(binding)
const gateway=new PodGateway(client,process.cwd(),resolve(process.env.XDG_STATE_HOME!,"grant-tool-receipts"),JSON.parse(process.env.TASK_INPUT_SOURCES??"[]"))
try{await serveStdio(new TaskAgentMcpServer(runtime.agent,{tools:cognitiveTools.filter(tool=>tool.name!=="cognitive_replan_stage"),instructions:"Only the controller-pinned role and literal file capabilities are available.",jsonText:true,dispatch:(name,input)=>gateway.execute(name,input)}))}finally{runtime.close()}
