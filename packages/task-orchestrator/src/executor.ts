import type { Role } from "#task-domain"

export type ExecutorKind = "plan" | "execute" | "integration_plan" | "integration_verify"

export interface ExecutorRequest {
  kind: ExecutorKind
  taskId: string
  title: string
  instruction: string
  context: string
  schema: Record<string, unknown>
  role?: Role
  attempt: number
  sessionId: string
  workspace: string
}

export interface ExecutorResponse {
  ok: boolean
  output?: unknown
  error?: string
  sessionId?: string
  costUsd?: number
}

export interface TaskExecutor {
  readonly name: string
  run(request: ExecutorRequest): Promise<ExecutorResponse>
}

export interface PlanOutput {
  decision: "execute" | "decompose" | "blocked"
  reason: string
  children?: Array<{
    key?: string
    title: string
    goal: string
    category?: string
    dependencies?: string[]
    acceptanceCriteria?: string[]
    requirements?: Array<{ description: string; kind?: string }>
  }>
}

export interface ExecuteOutput {
  status: "completed" | "failed"
  summary: string
  failureReason?: string
  artifacts?: Array<{
    name: string
    type: string
    contentRef?: string
    content?: string
    compatibility?: "compatible" | "breaking"
  }>
  verification?: {
    passed: boolean
    evidence?: string
    criteriaSatisfied?: string[]
  }
  learnings?: Array<{
    kind?: string
    description: string
    tags?: string[]
    importance?: number
  }>
}

export interface IntegrationPlanOutput {
  needed: boolean
  reason: string
  integrationSets?: Array<{
    name: string
    policy?: string
    members: string[]
    scenarios: Array<{
      name: string
      expectedBehavior: string[]
      participants?: string[]
      requirementIds?: string[]
    }>
  }>
}

export interface IntegrationVerifyOutput {
  scenarios: Array<{ scenarioId: string; status: "passed" | "failed"; observed?: string }>
  failure?: {
    type?: string
    affectedTaskIds?: string[]
    recommendedActions?: string[]
  }
}

const STRING_ARRAY = { type: "array", items: { type: "string" } } as const

export const PLAN_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["decision", "reason"],
  properties: {
    decision: { type: "string", enum: ["execute", "decompose", "blocked"] },
    reason: { type: "string" },
    children: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "goal"],
        properties: {
          key: { type: "string" },
          title: { type: "string" },
          goal: { type: "string" },
          category: {
            type: "string",
            enum: ["requirement", "research", "architecture", "implementation", "qa", "integration", "diagnostic", "general"],
          },
          dependencies: STRING_ARRAY,
          acceptanceCriteria: STRING_ARRAY,
          requirements: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["description"],
              properties: {
                description: { type: "string" },
                kind: { type: "string", enum: ["requirement", "constraint"] },
              },
            },
          },
        },
      },
    },
  },
}

export const EXECUTE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["status", "summary"],
  properties: {
    status: { type: "string", enum: ["completed", "failed"] },
    summary: { type: "string" },
    failureReason: { type: "string" },
    artifacts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "type"],
        properties: {
          name: { type: "string" },
          type: { type: "string", enum: ["research", "architecture", "code", "test", "decision", "note"] },
          contentRef: { type: "string" },
          content: { type: "string" },
          compatibility: { type: "string", enum: ["compatible", "breaking"] },
        },
      },
    },
    verification: {
      type: "object",
      additionalProperties: false,
      required: ["passed"],
      properties: {
        passed: { type: "boolean" },
        evidence: { type: "string" },
        criteriaSatisfied: STRING_ARRAY,
      },
    },
    learnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description"],
        properties: {
          kind: { type: "string", enum: ["insight", "pitfall", "convention", "failure_pattern", "improvement"] },
          description: { type: "string" },
          tags: STRING_ARRAY,
          importance: { type: "integer", minimum: 1, maximum: 10 },
        },
      },
    },
  },
}

export const INTEGRATION_PLAN_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["needed", "reason"],
  properties: {
    needed: { type: "boolean" },
    reason: { type: "string" },
    integrationSets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "members", "scenarios"],
        properties: {
          name: { type: "string" },
          policy: { type: "string", enum: ["none", "contract", "targeted", "full"] },
          members: STRING_ARRAY,
          scenarios: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "expectedBehavior"],
              properties: {
                name: { type: "string" },
                expectedBehavior: STRING_ARRAY,
                participants: STRING_ARRAY,
                requirementIds: STRING_ARRAY,
              },
            },
          },
        },
      },
    },
  },
}

export const INTEGRATION_VERIFY_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["scenarios"],
  properties: {
    scenarios: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["scenarioId", "status"],
        properties: {
          scenarioId: { type: "string" },
          status: { type: "string", enum: ["passed", "failed"] },
          observed: { type: "string" },
        },
      },
    },
    failure: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: {
          type: "string",
          enum: ["producer_violation", "consumer_violation", "contract_mismatch", "architecture_issue", "interaction_issue", "unknown"],
        },
        affectedTaskIds: STRING_ARRAY,
        recommendedActions: STRING_ARRAY,
      },
    },
  },
}

export const SCHEMAS: Record<ExecutorKind, Record<string, unknown>> = {
  plan: PLAN_SCHEMA,
  execute: EXECUTE_SCHEMA,
  integration_plan: INTEGRATION_PLAN_SCHEMA,
  integration_verify: INTEGRATION_VERIFY_SCHEMA,
}
