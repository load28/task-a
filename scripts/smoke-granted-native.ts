import { mkdtempSync,rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { createGraphRuntime } from "../apps/task-agent/src/graph-runtime.ts"
import { GrantedOpenCodeExecutor } from "../packages/opencode-harness/src/granted-executor.ts"
import { budgetContext } from "../packages/task-context/src/budget.ts"
import { activation } from "../packages/task-cognition/src/activation.ts"
import { FEATURES,type RoleVersion,type Signals } from "../packages/task-cognition/src/model.ts"
import { canonical } from "../packages/task-control/src/value.ts"
import { currentInputVector } from "../packages/task-control/src/completion.ts"

const selected=process.env.TASK_SMOKE_MODEL
if(!selected?.includes("/"))throw new Error("Set TASK_SMOKE_MODEL to an authenticated provider/model for this bounded live test")
const slash=selected.indexOf("/"),provider=selected.slice(0,slash),model=selected.slice(slash+1)
const directory=mkdtempSync(join(tmpdir(),"granted-native-")),database=join(directory,"graph.db")
const r=createGraphRuntime(database)
const executor=new GrantedOpenCodeExecutor({runtime:r.control,workspace:directory,database,stateDirectory:join(directory,"server"),maxWorkers:1})
try {
  await executor.start()
  const task=r.engine.createTask({title:"Native grant validation",goal:"Return a structured acknowledgement without calling tools",writeScopes:[]})
  const expected={taskId:task.id,findings:[],decisions:[],risks:[],unresolvedQuestions:[],evidence:[],proposedTasks:[],confidence:1,requiresEscalation:false}
  const role:RoleVersion={id:"smoke",version:1,name:"Adapter smoke",purpose:"Bounded native adapter verification",capabilities:[],prompt:`Return exactly this JSON object and nothing else. Do not use tools or markdown: ${JSON.stringify(expected)}`,activationPolicy:{hardTriggers:["failure"],softSignals:{},threshold:.5,cooldownMs:0,maxInvocationsPerTask:1},requiredContext:[],contextBudget:{maxTokens:33000,maxDependencyDepth:0,maxEvidenceItems:0,maxHistoricalDecisions:0},outputSchema:{const:expected},validators:[],allowedTools:[],lifecycle:"persistent",evidence:[]}
  r.control.roleLifecycle.installConfigured(role,"bounded native smoke configuration")
  const context=budgetContext({taskId:task.id,role,policy:{id:"adapter-test",version:1},items:[],scaffold:role.prompt,outputReservation:1000,countTokens:s=>Buffer.byteLength(s)})
  r.store.control.put("context_manifests",context.id,1,context)
  const decision=r.control.admission.record(activation({taskId:task.id,eventId:"adapter-test",eligible:true,role,policy:{id:"adapter-test",version:1},signals:{...Object.fromEntries(FEATURES.map(f=>[f,0])),failure:1} as Signals,now:Date.now(),invocations:0}))
  const snapshot=r.engine.signals.capture(task.id)
  const subscription=provider==="openai"
  const grant=r.control.admission.issue({taskId:task.id,decisionId:decision.id,specHash:snapshot.specHash,inputVector:currentInputVector(r.engine,task.id),graphHash:r.control.graph.hash(),role:{id:role.id,version:1},policy:{id:"adapter-test",version:1},context:{id:context.id,version:1},contextHash:context.hash,profile:{id:"native-smoke",level:3,provider,model,maxInputTokens:32000,maxOutputTokens:subscription?null:1000,maxToolCalls:1,timeoutMs:60000,capability:{usage:true,tokenLimit:!subscription,toolLimit:true,timeout:true},independentRoles:[]},readScopes:[],writeScopes:[],allowedTools:[],obligations:[],expiresAt:Date.now()+120000,generation:1},"bounded-native-smoke",33000)
  await executor.execute(grant.id)
  const run=JSON.parse(String(r.store.db.prepare("SELECT payload FROM agent_runs WHERE grant_id=?").get(grant.id)!.payload))
  process.stdout.write(canonical({test:"actual-opencode-grant",provider,model,state:"passed",usage:run.usage})+"\n")
} finally {await executor.close();r.close();rmSync(directory,{recursive:true,force:true})}
