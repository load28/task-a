import { createRuntime } from "./runtime.ts"
import { Orchestrator, type OrchestrationEvent, type OrchestrationReport } from "#task-orchestrator"

interface CliOptions {
  taskIds: string[]
  request?: string
  title?: string
  resume: boolean
  concurrency?: number
  maxDepth?: number
  maxAttemptsPerTask?: number
  maxRuns?: number
  maxIterations?: number
  workspace?: string
  verifyCommand?: string
  autoIntegration: boolean
  json: boolean
}

const USAGE = `사용법
  npm run orchestrate -- "<요청 문장>"        요청을 Root Task로 만들고 끝까지 진행한다
  npm run orchestrate -- --task <taskId>      기존 Task를 이어서 진행한다
  npm run orchestrate -- --resume             완료되지 않은 Root Task를 모두 진행한다

옵션
  --title <문자열>            새 Root Task의 제목 (기본값은 요청 문장의 앞부분)
  --concurrency <숫자>        동시에 실행할 Task 수 (기본 1)
  --max-depth <숫자>          허용할 분해 깊이 (기본 4)
  --max-attempts <숫자>       Task별 재시도 한도 (기본 2)
  --max-runs <숫자>           실행 하네스 호출 총 예산 (기본 200)
  --max-iterations <숫자>     루프 반복 상한 (기본 200)
  --workspace <경로>          하네스가 작업할 디렉터리 (기본 현재 디렉터리)
  --verify-command <명령>     하네스가 제출 전에 실행할 검증 명령
  --no-integration            Integration 자동 검증을 끈다
  --json                      리포트를 JSON으로 출력한다`

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { taskIds: [], resume: false, autoIntegration: true, json: false }
  const positional: string[] = []
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!
    const next = (): string => {
      const value = argv[++index]
      if (value === undefined) throw new Error(`${arg} 뒤에 값이 필요합니다`)
      return value
    }
    switch (arg) {
      case "--task": options.taskIds.push(next()); break
      case "--title": options.title = next(); break
      case "--resume": options.resume = true; break
      case "--concurrency": options.concurrency = Number(next()); break
      case "--max-depth": options.maxDepth = Number(next()); break
      case "--max-attempts": options.maxAttemptsPerTask = Number(next()); break
      case "--max-runs": options.maxRuns = Number(next()); break
      case "--max-iterations": options.maxIterations = Number(next()); break
      case "--workspace": options.workspace = next(); break
      case "--verify-command": options.verifyCommand = next(); break
      case "--no-integration": options.autoIntegration = false; break
      case "--json": options.json = true; break
      case "--help":
      case "-h":
        process.stdout.write(`${USAGE}\n`)
        process.exit(0)
        break
      default:
        if (arg.startsWith("-")) throw new Error(`알 수 없는 옵션: ${arg}`)
        positional.push(arg)
    }
  }
  if (positional.length > 0) options.request = positional.join(" ")
  return options
}

function titleFor(request: string, explicit?: string): string {
  if (explicit) return explicit
  const firstLine = request.split("\n")[0]!.trim()
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

function logEvent(event: OrchestrationEvent): void {
  const label = event.title ? `${event.type} ${event.title}` : event.type
  process.stdout.write(`[${new Date().toISOString()}] ${label}${event.detail ? ` — ${event.detail}` : ""}\n`)
}

function printReport(report: OrchestrationReport, json: boolean): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    return
  }
  process.stdout.write(`\n결과: ${report.status} (반복 ${report.iterations}, 하네스 호출 ${report.runs}, 비용 $${report.costUsd.toFixed(4)})\n`)
  if (report.completedTaskIds.length > 0) process.stdout.write(`완료한 Task ${report.completedTaskIds.length}개\n`)
  if (report.handoffs.length > 0) {
    process.stdout.write("사람이 봐야 할 것\n")
    for (const handoff of report.handoffs) {
      process.stdout.write(`- ${handoff.title} (${handoff.status}) — ${handoff.reason}\n`)
    }
  }
  if (report.missing.length > 0) {
    process.stdout.write("남은 완료 조건\n")
    for (const item of report.missing) process.stdout.write(`- ${item}\n`)
  }
}

const options = parseArgs(process.argv.slice(2))
const runtime = createRuntime({
  orchestrator: {
    workspace: options.workspace,
    verifyCommand: options.verifyCommand,
  },
})

let exitCode = 0
try {
  const targets: string[] = [...options.taskIds]
  if (options.request) {
    const task = await runtime.agent.createTask({ title: titleFor(options.request, options.title), goal: options.request })
    process.stdout.write(`Root Task 생성: ${task.id} — ${task.title}\n`)
    targets.push(task.id)
  }
  if (options.resume) {
    for (const root of runtime.engine.rootTasks()) {
      if (["verified", "integrated"].includes(root.status)) continue
      if (targets.includes(root.id)) continue
      targets.push(root.id)
    }
  }
  if (targets.length === 0) {
    process.stderr.write(`진행할 Task가 없습니다.\n\n${USAGE}\n`)
    exitCode = 2
  }
  for (const taskId of targets) {
    const orchestrator = new Orchestrator(runtime.agent, runtime.engine, runtime.executor, {
      ...runtime.orchestratorOptions,
      concurrency: options.concurrency,
      maxDepth: options.maxDepth,
      maxAttemptsPerTask: options.maxAttemptsPerTask,
      maxRuns: options.maxRuns,
      maxIterations: options.maxIterations,
      autoIntegration: options.autoIntegration,
      onEvent: options.json ? undefined : logEvent,
    })
    const report = await orchestrator.run(taskId)
    printReport(report, options.json)
    if (report.status !== "completed") exitCode = 1
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  exitCode = 1
} finally {
  runtime.close()
}

process.exit(exitCode)
