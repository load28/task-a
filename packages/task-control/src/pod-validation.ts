import type { Resource,TaskInstance } from "../../task-instances/src/types.ts"
import type { PodAuthority } from "./pod-authority.ts"
import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import { digest } from "./value.ts"

export function validatorPod(input:{grant:ActivationGrant;instance:TaskInstance;modelPod:Resource;image:string;snapshotHash:string;validators:ReturnType<PodAuthority["validationPlan"]>;budget:{maxJobs:number;maxDurationMs:number}}):Resource {
  if(!input.budget||input.validators.length>input.budget.maxJobs||input.validators.reduce((sum,item)=>sum+item.spec.timeoutMs,0)>input.budget.maxDurationMs)throw new Error("Independent Pod validation budget is unavailable")
  const volume=input.instance.status?.volumeName
  if(!volume||!input.modelPod.spec?.nodeName)throw new Error("Stopped workspace volume/node is unconfirmed")
  const payload={snapshotHash:input.snapshotHash,validators:input.validators,budget:input.budget}
  if(Buffer.byteLength(JSON.stringify(payload))>131072)throw new Error("Validation input exceeds the bounded Pod specification")
  return {apiVersion:"v1",kind:"Pod",metadata:{name:`validate-${digest(input.grant.id).slice(0,32)}`,namespace:input.instance.metadata.namespace,labels:{"tasks.task-agent.dev/validation-grant":input.grant.id,"tasks.task-agent.dev/input":digest(payload).slice(0,32)},annotations:{"tasks.task-agent.dev/input-digest":digest(payload)},ownerReferences:[{apiVersion:input.instance.apiVersion,kind:"TaskInstance",name:input.instance.metadata.name,uid:input.instance.metadata.uid}]},spec:{restartPolicy:"Never",nodeName:input.modelPod.spec.nodeName,automountServiceAccountToken:false,activeDeadlineSeconds:Math.max(1,Math.ceil((input.grant.expiresAt-Date.now())/1000)),securityContext:{runAsNonRoot:true,runAsUser:1000,runAsGroup:1000,fsGroup:1000},containers:[{name:"validator",image:input.image,imagePullPolicy:"IfNotPresent",command:["/usr/local/bin/task-validator-no-network","node","/app/scripts/granted-validator.ts"],env:[{name:"TASK_VALIDATION_INPUT",value:JSON.stringify(payload)},{name:"NODE_NO_WARNINGS",value:"1"},{name:"HOME",value:"/tmp"}],securityContext:{allowPrivilegeEscalation:false,readOnlyRootFilesystem:true,capabilities:{drop:["ALL"]}},resources:{requests:{cpu:"100m",memory:"128Mi"},limits:{cpu:"1",memory:"512Mi"}},volumeMounts:[{name:"source",mountPath:"/data/workspace",subPath:"workspace",readOnly:true},{name:"scratch",mountPath:"/tmp"}]}],volumes:[{name:"source",persistentVolumeClaim:{claimName:volume,readOnly:true}},{name:"scratch",emptyDir:{}}]}}
}
