import type { VersionRef, VersionVector } from "../../task-causality/src/model.ts"
export const FEATURES = ["risk","uncertainty","dependencyImpact","failure","integrationRisk","publicAPI","sharedDependency","architectureViolation","moduleBoundary","dependencyDirection","infrastructure","externalFact","unfamiliarTechnology","versionDependent","weakEvidence","irreversible","repeatedFailure"] as const
export type Feature = typeof FEATURES[number]
export type Signals = Record<Feature,number|null>
export interface ActivationPolicy { hardTriggers: Feature[]; softSignals: Partial<Record<Feature,number>>; threshold:number; cooldownMs:number; maxInvocationsPerTask:number }
export interface ContextBudget { maxTokens:number; maxDependencyDepth:number; maxEvidenceItems:number; maxHistoricalDecisions:number }
export interface ContextSelector { relation:string; ports:string[]; required:boolean; depth:number }
export interface ReasoningProfile {
  id:string; level:0|1|2|3|4|5; provider:string; model:string; maxInputTokens:number; maxOutputTokens:number; maxToolCalls:number; timeoutMs:number
  capability:{usage:boolean;tokenLimit:boolean;toolLimit:boolean;timeout:boolean}; independentRoles:string[]
}
export interface RoleVersion {
  id:string; version:number; name:string; purpose:string; capabilities:string[]; prompt:string
  activationPolicy:ActivationPolicy; requiredContext:ContextSelector[]; contextBudget:ContextBudget
  outputSchema:Record<string,unknown>; validators:string[]; allowedTools:string[]
  lifecycle:"candidate"|"temporary"|"validated"|"persistent"; evidence:VersionRef[]
}
export interface ActivationDecision {
  id:string; eventId:string; taskId:string; role:VersionRef; policy:VersionRef; signals:Signals
  score:number; hard:Feature[]; action:"activate"|"skip"|"defer"; reasons:string[]; timestamp:number
}
export interface ContextItem {
  id:string; version:number; kind:"task"|"dependency"|"decision"|"assumption"|"evidence"|"history"|"knowledge"
  content:string; required:boolean; depth:number; relevance:number; level:0|1|2|3|4
  dependencies:VersionVector; path:string[]; summaryOf?:VersionRef; evidence:VersionRef[]
}
export interface ContextManifest { id:string; version:number; taskId:string; role:VersionRef; policy:VersionRef; included:ContextItem[]; excluded:Array<{id:string;reason:string}>; tokens:number; budget:ContextBudget; dependencyVector:VersionVector; hash:string }
export interface ActivationGrant {
  id:string; decisionId:string; taskId:string; specHash:string; inputVector:VersionVector; graphHash:string
  role:VersionRef; policy:VersionRef; profile:ReasoningProfile; context:VersionRef; contextHash:string
  writeScopes:string[]; allowedTools:string[]; obligations:string[]; expiresAt:number; generation:number; worker?:string
  readScopes?:string[]
  executionMode?:"cognition"|"task"
  reuse?:{record:VersionRef;requestedProfile:ReasoningProfile;accountLimit:number}
  preflight?:{id:string;requestedProfile:ReasoningProfile}
  replanLease?:VersionRef
}
export interface AgentOutput { taskId:string; findings:unknown[]; decisions:unknown[]; risks:unknown[]; unresolvedQuestions:unknown[]; evidence:VersionRef[]; proposedTasks:unknown[]; confidence:number; requiresEscalation:boolean }
