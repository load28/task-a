import test from "node:test"
import assert from "node:assert/strict"
import { TaskGraphStore } from "#task-store"
import { TaskGraphEngine } from "#task-engine"
import { IntegrationEngine } from "#integration-engine"
import { TaskAgentService } from "#task-agent-core"
import {
  ClaudeCliExecutor,
  Orchestrator,
  resolveRole,
  seedDefaultRoles,
  type ExecutorRequest,
  type ExecutorResponse,
  type OrchestrationEvent,
  type TaskExecutor,
} from "#task-orchestrator"
import { parseResult } from "../packages/task-orchestrator/src/claude-cli.ts"

type Responder = (request: ExecutorRequest) => ExecutorResponse | Promise<ExecutorResponse>

class ScriptedExecutor implements TaskExecutor {
  readonly name = "scripted"
  readonly requests: ExecutorRequest[] = []
  private responder: Responder

  constructor(responder: Responder) {
    this.responder = responder
  }

  async run(request: ExecutorRequest): Promise<ExecutorResponse> {
    this.requests.push(request)
    return this.responder(request)
  }
}

function fixture(executor: TaskExecutor) {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const agent = new TaskAgentService(engine, integration)
  return { store, engine, integration, agent, executor }
}

function completedFor(title: string, artifact?: { name: string; type: string }): ExecutorResponse {
  return {
    ok: true,
    costUsd: 0.01,
    output: {
      status: "completed",
      summary: `${title} 완료`,
      artifacts: artifact ? [{ name: artifact.name, type: artifact.type, contentRef: `file:${artifact.name}` }] : [],
      verification: { passed: true, evidence: "npm run check 통과" },
      learnings: [{ kind: "insight", description: `${title}에서 배운 것`, importance: 5 }],
    },
  }
}

test("자연어 요청 하나가 분해·실행·통합을 거쳐 사람 개입 없이 완료된다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") {
      if (request.title === "결제 모듈 추가") {
        return {
          ok: true,
          output: {
            decision: "decompose",
            reason: "서버와 클라이언트 책임이 분리된다",
            children: [
              { key: "server", title: "결제 서버", goal: "결제 API를 구현한다", category: "implementation" },
              { key: "client", title: "결제 클라이언트", goal: "결제 화면을 구현한다", category: "implementation", dependencies: ["server"] },
            ],
          },
        }
      }
      return { ok: true, output: { decision: "execute", reason: "atomic" } }
    }
    if (request.kind === "execute") {
      const artifact = request.title === "결제 서버"
        ? { name: "payment-api", type: "code" }
        : { name: "payment-ui", type: "code" }
      return completedFor(request.title, artifact)
    }
    if (request.kind === "integration_plan") {
      return {
        ok: true,
        output: {
          needed: true,
          reason: "API와 UI의 결합을 확인해야 한다",
          integrationSets: [{
            name: "payment-e2e",
            members: ["payment-api", "payment-ui"],
            scenarios: [{
              name: "결제 성공 경로",
              expectedBehavior: ["UI에서 결제하면 API가 승인을 반환한다"],
              participants: ["payment-api", "payment-ui"],
            }],
          }],
        },
      }
    }
    return {
      ok: true,
      output: {
        scenarios: [{ scenarioId: "", status: "passed", observed: "성공" }],
      },
    }
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const scenarioAware = new ScriptedExecutor(async (request) => {
    const response = await executor.run(request)
    if (request.kind !== "integration_verify") return response
    const set = store.findIntegrationSetByName("payment-e2e")!
    return {
      ok: true,
      output: {
        scenarios: store.scenariosOf(set.id).map((scenario) => ({
          scenarioId: scenario.id,
          status: "passed",
          observed: "성공",
        })),
      },
    }
  })

  const root = await agent.createTask({ title: "결제 모듈 추가", goal: "결제 기능을 추가한다" })
  const events: OrchestrationEvent[] = []
  const orchestrator = new Orchestrator(agent, engine, scenarioAware, { onEvent: (event) => events.push(event) })
  const report = await orchestrator.run(root.id)

  assert.equal(report.status, "completed")
  assert.deepEqual(report.handoffs, [])
  assert.equal(report.completedTaskIds.length, 2)
  assert.ok(report.costUsd > 0)
  assert.equal(engine.requireTask(root.id).status, "integrated")
  assert.ok(events.some((event) => event.type === "task_decomposed"))
  assert.ok(events.some((event) => event.type === "integration_passed"))
  assert.ok(store.validBundles().length === 1)
  assert.ok(engine.relevantLearnings(root.id).length > 0)
})

test("Task category에 맞는 Role이 배정되고 worker 정보로 기록된다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") return { ok: true, output: { decision: "execute", reason: "atomic" } }
    return completedFor(request.title)
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())
  seedDefaultRoles(store)

  const root = await agent.createTask({ title: "구조 분석", goal: "현재 구조를 조사한다", category: "research" })
  const orchestrator = new Orchestrator(agent, engine, executor, { autoIntegration: false })
  await orchestrator.run(root.id)

  assert.equal(executor.requests[0]!.role?.id, "researcher")
  assert.deepEqual(executor.requests[0]!.role?.allowedTools, ["Read", "Glob", "Grep", "WebFetch", "WebSearch"])
  assert.equal(resolveRole(store, engine.requireTask(root.id))?.id, "researcher")
  const started = store.eventsFor(root.id).find((event) => event.type === "TASK_STARTED")
  assert.equal((started?.payload?.worker as { role?: string })?.role, "researcher")
})

test("반복 실패한 Task는 사람에게 넘기고 나머지 그래프는 계속 진행한다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") {
      if (request.title === "두 갈래 작업") {
        return {
          ok: true,
          output: {
            decision: "decompose",
            reason: "독립된 두 작업",
            children: [
              { title: "되는 작업", goal: "성공한다", category: "implementation" },
              { title: "막히는 작업", goal: "실패한다", category: "implementation" },
            ],
          },
        }
      }
      return { ok: true, output: { decision: "execute", reason: "atomic" } }
    }
    if (request.title === "막히는 작업") {
      return { ok: true, output: { status: "failed", summary: "실패", failureReason: "외부 자격증명이 없습니다" } }
    }
    return completedFor(request.title, { name: "worked", type: "code" })
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "두 갈래 작업", goal: "두 작업을 처리한다" })
  const orchestrator = new Orchestrator(agent, engine, executor, { maxAttemptsPerTask: 2, autoIntegration: false })
  const report = await orchestrator.run(root.id)

  assert.equal(report.status, "handoff")
  assert.equal(report.handoffs.length, 1)
  assert.equal(report.handoffs[0]!.title, "막히는 작업")
  assert.match(report.handoffs[0]!.reason, /외부 자격증명/)
  assert.equal(report.handoffs[0]!.status, "failed")
  assert.equal(report.completedTaskIds.length, 1)
  const succeeded = store.childTasks(root.id).find((child) => child.title === "되는 작업")!
  assert.equal(succeeded.status, "verified")
  const attempts = executor.requests.filter((request) => request.kind === "execute" && request.title === "막히는 작업")
  assert.equal(attempts.length, 2)
})

test("Worker가 사람의 결정을 요청하면 즉시 멈춘다", async (t) => {
  const executor = new ScriptedExecutor(() => ({
    ok: true,
    output: { decision: "blocked", reason: "어느 결제사를 쓸지 사람이 정해야 합니다" },
  }))
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "결제사 연동", goal: "결제사를 연동한다" })
  const report = await new Orchestrator(agent, engine, executor).run(root.id)

  assert.equal(report.status, "handoff")
  assert.match(report.handoffs[0]!.reason, /결제사/)
  assert.equal(engine.requireTask(root.id).status, "failed")
  assert.equal(executor.requests.filter((request) => request.kind === "execute").length, 0)
})

test("검증을 통과하지 못한 제출은 완료로 인정하지 않는다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") return { ok: true, output: { decision: "execute", reason: "atomic" } }
    return {
      ok: true,
      output: {
        status: "completed",
        summary: "만들긴 했다",
        verification: { passed: false, evidence: "테스트 2건 실패" },
      },
    }
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "검증 실패 작업", goal: "검증이 실패한다" })
  const report = await new Orchestrator(agent, engine, executor, { maxAttemptsPerTask: 1 }).run(root.id)

  assert.equal(report.status, "handoff")
  assert.match(report.handoffs[0]!.reason, /검증을 통과하지 못했습니다/)
  assert.equal(report.completedTaskIds.length, 0)
})

test("분해 깊이 상한을 넘으면 더 쪼개지 않고 실행한다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") {
      return {
        ok: true,
        output: {
          decision: "decompose",
          reason: "계속 쪼갤 수 있다",
          children: [{ title: `${request.title} 하위`, goal: "하위 작업", category: "implementation" }],
        },
      }
    }
    return completedFor(request.title)
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "깊은 작업", goal: "계속 분해된다" })
  const report = await new Orchestrator(agent, engine, executor, { maxDepth: 2, autoIntegration: false }).run(root.id)

  assert.equal(report.status, "completed")
  const deepest = engine.requireTask(report.completedTaskIds[0]!)
  assert.equal(engine.pathOf(deepest.id).length, 3)
})

test("Integration 시나리오가 실패하면 Diagnostic Task를 만들고 사람에게 넘긴다", async (t) => {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const integration = new IntegrationEngine(engine)
  const agent = new TaskAgentService(engine, integration)
  t.after(() => store.close())

  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") {
      if (request.title === "묶어야 하는 작업") {
        return {
          ok: true,
          output: {
            decision: "decompose",
            reason: "두 결과물이 결합된다",
            children: [
              { title: "생산자", goal: "A를 만든다", category: "implementation" },
              { title: "소비자", goal: "B를 만든다", category: "implementation" },
            ],
          },
        }
      }
      return { ok: true, output: { decision: "execute", reason: "atomic" } }
    }
    if (request.kind === "execute") {
      return completedFor(request.title, { name: request.title === "생산자" ? "module-a" : "module-b", type: "code" })
    }
    if (request.kind === "integration_plan") {
      return {
        ok: true,
        output: {
          needed: true,
          reason: "결합 확인 필요",
          integrationSets: [{
            name: "a-b",
            members: ["module-a", "module-b"],
            scenarios: [{ name: "결합", expectedBehavior: ["A와 B가 함께 동작한다"], participants: ["module-a", "module-b"] }],
          }],
        },
      }
    }
    const set = store.findIntegrationSetByName("a-b")!
    return {
      ok: true,
      output: {
        scenarios: store.scenariosOf(set.id).map((scenario) => ({
          scenarioId: scenario.id,
          status: "failed",
          observed: "B가 A의 응답 형식을 읽지 못한다",
        })),
        failure: { type: "contract_mismatch", recommendedActions: ["응답 형식을 계약으로 고정한다"] },
      },
    }
  })

  const root = await agent.createTask({ title: "묶어야 하는 작업", goal: "두 모듈을 결합한다" })
  const report = await new Orchestrator(agent, engine, executor, { maxAttemptsPerTask: 1 }).run(root.id)

  assert.notEqual(report.status, "completed")
  const failedRun = store.integrationSets().find((set) => set.name === "a-b")!
  assert.equal(failedRun.status, "failed")
  assert.ok(store.eventsFor(root.id).some((event) => event.type === "INTEGRATION_FAILED"))
  assert.ok(report.handoffs.length > 0)
})

test("실행 하네스 호출 예산을 넘으면 멈춘다", async (t) => {
  const executor = new ScriptedExecutor(() => ({ ok: false, error: "하네스 없음" }))
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "예산 초과", goal: "예산을 넘긴다" })
  const report = await new Orchestrator(agent, engine, executor, { maxRuns: 1, maxAttemptsPerTask: 10 }).run(root.id)

  assert.equal(report.status, "budget_exhausted")
  assert.equal(report.runs, 1)
})

test("CLI 하네스 출력에서 구조화 결과와 비용을 읽어낸다", () => {
  const success = parseResult(JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    session_id: "abc",
    total_cost_usd: 0.42,
    result: "완료했습니다",
    structured_output: { status: "completed", summary: "됐다" },
  }), "")
  assert.equal(success.ok, true)
  assert.deepEqual(success.output, { status: "completed", summary: "됐다" })
  assert.equal(success.sessionId, "abc")
  assert.equal(success.costUsd, 0.42)

  const failed = parseResult(JSON.stringify({ type: "result", is_error: true, result: "인증 실패" }), "")
  assert.equal(failed.ok, false)
  assert.match(failed.error!, /인증 실패/)

  const fromText = parseResult(JSON.stringify({
    type: "result",
    is_error: false,
    result: "{\"status\":\"completed\",\"summary\":\"텍스트 안의 JSON\"}",
  }), "")
  assert.equal(fromText.ok, true)
  assert.deepEqual(fromText.output, { status: "completed", summary: "텍스트 안의 JSON" })

  const broken = parseResult("", "claude: command not found")
  assert.equal(broken.ok, false)
  assert.match(broken.error!, /command not found/)
})

test("CLI 하네스가 없으면 실행 실패로 보고하고 그래프를 망가뜨리지 않는다", async (t) => {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const agent = new TaskAgentService(engine, new IntegrationEngine(engine))
  t.after(() => store.close())

  const executor = new ClaudeCliExecutor({ command: "task-agent-missing-cli", timeoutMs: 5_000 })
  const root = await agent.createTask({ title: "하네스 없음", goal: "하네스가 없다" })
  const report = await new Orchestrator(agent, engine, executor, { maxAttemptsPerTask: 1 }).run(root.id)

  assert.equal(report.status, "handoff")
  assert.match(report.handoffs[0]!.reason, /실행 하네스를 시작하지 못했습니다/)
  assert.equal(engine.requireTask(root.id).status, "failed")
})

test("concurrency를 올리면 독립 Task가 동시에 실행된다", async (t) => {
  let active = 0
  let peak = 0
  const executor = new ScriptedExecutor(async (request) => {
    if (request.kind === "plan") {
      if (request.title === "병렬 작업") {
        return {
          ok: true,
          output: {
            decision: "decompose",
            reason: "서로 독립이다",
            children: [
              { title: "왼쪽", goal: "왼쪽을 한다", category: "implementation" },
              { title: "오른쪽", goal: "오른쪽을 한다", category: "implementation" },
            ],
          },
        }
      }
      return { ok: true, output: { decision: "execute", reason: "atomic" } }
    }
    active++
    peak = Math.max(peak, active)
    await new Promise((resolve) => setTimeout(resolve, 20))
    active--
    return completedFor(request.title)
  })
  const { store, engine, agent } = fixture(executor)
  t.after(() => store.close())

  const root = await agent.createTask({ title: "병렬 작업", goal: "두 작업을 동시에 한다" })
  const report = await new Orchestrator(agent, engine, executor, { concurrency: 2, autoIntegration: false }).run(root.id)

  assert.equal(report.status, "completed")
  assert.equal(peak, 2)
})

test("Role은 API로 정의하고 조회할 수 있다", async (t) => {
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const agent = new TaskAgentService(engine, new IntegrationEngine(engine))
  t.after(() => store.close())

  seedDefaultRoles(store)
  const defined = await agent.defineRole({
    id: "security",
    name: "Security Reviewer",
    description: "보안 관점으로 검토한다",
    principles: ["취약점을 추측으로 단정하지 않는다"],
    allowedTools: ["Read", "Grep"],
  })
  assert.equal(defined.id, "security")
  assert.deepEqual(defined.allowedTools, ["Read", "Grep"])
  const roles = await agent.listRoles()
  assert.ok(roles.some((role) => role.id === "security"))
  assert.ok(roles.some((role) => role.id === "implementer"))

  const task = await agent.createTask({ title: "보안 검토", goal: "검토한다", assignedRole: "security" })
  assert.equal(resolveRole(store, engine.requireTask(task.id))?.id, "security")
})

test("orchestrate_run은 요청 문장에서 Root Task를 만들고 진행한다", async (t) => {
  const executor = new ScriptedExecutor((request) => {
    if (request.kind === "plan") return { ok: true, output: { decision: "execute", reason: "atomic" } }
    return completedFor(request.title)
  })
  const store = new TaskGraphStore()
  const engine = new TaskGraphEngine(store)
  const agent = new TaskAgentService(engine, new IntegrationEngine(engine))
  t.after(() => store.close())

  await assert.rejects(() => agent.orchestrate({ title: "설정 없음", goal: "실패한다" }), /Orchestrator is not configured/)

  agent.attachOrchestrator({
    run: (request) => new Orchestrator(agent, engine, executor, { autoIntegration: false }).run(request.taskId),
  })
  const report = await agent.orchestrate({ title: "문서 정리", goal: "README를 정리한다" }) as { status: string; completedTaskIds: string[] }
  assert.equal(report.status, "completed")
  assert.equal(report.completedTaskIds.length, 1)
  assert.equal(engine.requireTask(report.completedTaskIds[0]!).title, "문서 정리")
})
