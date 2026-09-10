import type { ActivationGrant } from "../../task-cognition/src/model.ts"
import type { VersionRef } from "../../task-causality/src/model.ts"
import type { ControlStore } from "./store.ts"
import { EvidenceStore } from "../../task-evidence/src/index.ts"
import { canonical,digest } from "./value.ts"

const gatewayTools=new Set(["task_graph_cognitive_context","task_graph_cognitive_read","task_graph_cognitive_write","task_graph_cognitive_replan_stage"])
type Boundary=NonNullable<ActivationGrant["inputBoundary"]>
type Contract=Omit<Boundary,"contractHash"|"evidence">

export function executionInputContract(grant:Pick<ActivationGrant,"profile"|"reuse"|"allowedTools"|"readScopes"|"writeScopes"|"inputVector"|"expiresAt">):Contract {
  const gatewayOnly=grant.allowedTools.every(tool=>gatewayTools.has(tool))
  const registered=grant.inputVector.some(input=>input.entityId.startsWith("observed-input:"))
  const effectiveProfile=grant.reuse?.requestedProfile??grant.profile
  const channels:Contract["channels"]={
    filesystem:gatewayOnly?"observed":"unknown",
    tools:gatewayOnly?"pinned":"unknown",
    environment:grant.inputVector.some(input=>input.port==="environment")?"observed":"unknown",
    network:gatewayOnly?"denied":"unknown",
    time:Number.isFinite(grant.expiresAt)?"bounded":"unknown",
    random:effectiveProfile.level<=1?"denied":"unknown",
    external:gatewayOnly?(registered?"observed":"denied"):"unknown",
  }
  return {version:1,surface:"cognitive-gateway/v1",verdict:Object.values(channels).includes("unknown")?"unknown":"complete",channels}
}

export function attachExecutionInputBoundary(store:ControlStore,grantId:string,grant:Omit<ActivationGrant,"id">):Boundary {
  const contract=executionInputContract(grant),contractHash=digest(contract),content={grantId,contract,inputVector:grant.inputVector,readScopes:grant.readScopes??[],writeScopes:grant.writeScopes,allowedTools:grant.allowedTools}
  const evidence=new EvidenceStore(store).put({id:`execution-input-boundary:${grantId}`,version:1,type:"runtime",source:"controller-enforced cognitive execution surface",producer:"admission",validatorVersion:"execution-input-boundary/v1",timestamp:Date.now(),content,contentHash:digest(content),inputVector:grant.inputVector,confidence:contract.verdict==="complete"?1:0,expiresAt:grant.expiresAt})
  store.db.exec("CREATE TABLE IF NOT EXISTS execution_input_boundaries(grant_id TEXT PRIMARY KEY,contract_hash TEXT NOT NULL,evidence_id TEXT NOT NULL,evidence_version INTEGER NOT NULL)")
  store.db.prepare("INSERT INTO execution_input_boundaries VALUES(?,?,?,?)").run(grantId,contractHash,evidence.id,evidence.version)
  return {...contract,contractHash,evidence}
}

export function assertExecutionInputBoundary(store:ControlStore,grant:ActivationGrant,now=Date.now()):void {
  const table=store.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='execution_input_boundaries'").get()
  const row=table&&store.db.prepare("SELECT * FROM execution_input_boundaries WHERE grant_id=?").get(grant.id)
  if(!grant.inputBoundary) {
    if(row)throw new Error("Execution input boundary is missing")
    return // persisted pre-boundary grant
  }
  const {contractHash,evidence,...contract}=grant.inputBoundary
  if(!row||row.contract_hash!==contractHash||row.evidence_id!==evidence.id||Number(row.evidence_version)!==evidence.version||digest(contract)!==contractHash||canonical(contract)!==canonical(executionInputContract(grant)))throw new Error("Execution input boundary contract changed")
  const evidenceStore=new EvidenceStore(store),proof=evidenceStore.require(evidence)
  if(!evidenceStore.valid(evidence,now)||proof.producer!=="admission"||proof.validatorVersion!=="execution-input-boundary/v1"||proof.expiresAt===null||proof.expiresAt<=now||digest(proof.inputVector)!==digest(grant.inputVector)||(proof.content as {grantId?:string}).grantId!==grant.id)throw new Error("Execution input boundary evidence is invalid")
}

export function inputBoundaryEvidence(grant:ActivationGrant):VersionRef[]{return grant.inputBoundary?[grant.inputBoundary.evidence]:[]}
