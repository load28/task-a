# Task Agent

자연어 요청을 영속적인 재귀형 Task Graph로 변환하는 Agent Task Runtime입니다. Prompt는 입력이고, Task가 실제 상태이며, Session(GPT·Claude·기타 Agent)은 Worker입니다. 각 Task는 버전된 Artifact를 생성하고, 여러 Artifact 조합은 Integration Graph에서 별도로 검증되며, 검증을 통과한 조합만 Verified Bundle로 상위 Task에 승격됩니다.

Worker는 사람이 붙인 세션일 수도 있고, Orchestrator가 직접 호출하는 실행 하네스일 수도 있습니다. 후자의 경우 요청 하나를 넣어두면 분해·실행·통합이 끝까지 진행되고, 막히는 지점만 사람에게 넘어옵니다.

핵심 개념과 설계 원칙은 [설계 문서](docs/architecture.md)에 정리했습니다.

## 시스템 구성

```
GPT / Claude / Other Agent          npm run orchestrate
          │  MCP / HTTP                     │
          ↓                                 ↓
     Task Agent (외부 API)  ←─────  Orchestration Loop
          │                                 │
  ┌───────┼────────────┐                    ↓
  ↓       ↓            ↓            Execution Harness
Task Graph  Context   Integration    (claude CLI 등)
 Engine     Engine     Engine
          │
      Task Store (SQLite)
```

- `packages/task-domain` — Task, Dependency, Requirement, Artifact/Version/Lineage, Contract, Integration Set/Scenario/Run, Verified Bundle, Role, Event의 1급 도메인 모델
- `packages/task-store` — SQLite 저장소(tasks, task_dependencies, task_requirements, artifacts, artifact_versions, artifact_lineage, contracts, contract_versions, integration_sets, integration_members, integration_scenarios, integration_runs, verified_bundles, roles, events)
- `packages/task-engine` — Graph Engine: Proposal 기반 분해 검증·적용, 상태 전이 결정, Runnable Leaf 해석, Stale 전파, Change Impact 분석, 완료 조건 평가
- `packages/integration-engine` — Integration Set/Scenario/Run, Integration Identity 캐시, Verified Bundle 승격, 실패 분류와 Diagnostic Task 생성
- `packages/task-context` — Graph 기반 Context Builder(Context Policy 상속, Bundle 우선 소비, Known Failure 수집)
- `packages/task-agent-core` — 최소 외부 API를 제공하는 Orchestrator
- `packages/task-orchestrator` — Orchestration Loop(Runnable 해석 → 분해/실행 판단 → 결과 제출 → Integration 검증 → 정지), Role Engine, `TaskExecutor` 인터페이스와 Claude CLI 실행 하네스
- `packages/protocol-mcp` / `packages/protocol-http` — MCP 2025-06-18 stdio·인증 원격 MCP·HTTP Gateway

## 핵심 흐름

1. `task_create` — 요청을 Root Task로 변환한다.
2. `task_propose_decomposition` — LLM이 분해를 제안하면 Engine이 cycle·중복 책임·의존성을 검증한 뒤 적용한다.
3. `task_get_runnable` / `task_get_context` — 다른 세션에서도 실행 가능한 Leaf와 Graph 기반 Context를 받아 이어간다.
4. `task_start` → 작업 → `task_complete` — Agent는 결과만 제출하고 상태 전이는 Engine이 판단한다.
5. `artifact_publish` — 결과는 lineage·contract가 기록된 버전 Artifact가 된다. 재발행 시 downstream이 stale된다.
6. `integration_propose` → `integration_run` → `integration_report` — Architecture Boundary 단위 조합을 Scenario로 검증하고, 통과한 정확한 버전 조합을 Verified Bundle로 승격한다. 실패는 원인 분류 후 필요한 Task만 reopen하거나 Diagnostic Task를 만든다.
7. `orchestrate_run` / `npm run orchestrate` — 사람이 붙어 있지 않아도 Orchestrator가 위 흐름을 스스로 돈다. Runnable Leaf마다 실행 하네스에 분해할지 실행할지 묻고, 결과를 Engine에 제출하며, 자식이 모두 끝난 상위 Task에는 Integration을 계획·실행한다. 반복 실패하거나 사람의 결정이 필요하면 그 Task만 멈추고 나머지는 계속 진행한 뒤, 사람이 볼 목록을 리포트로 남긴다.
8. `learning_record` / `task_complete`의 `learnings` — 작업에서 배운 것(insight·pitfall·convention·failure pattern)을 중요도와 함께 Learning으로 축적하고, Engine이 관련성(FTS5 BM25)·최신성·중요도·그래프 근접도를 RRF로 융합해 이후 Task Context에 자동 주입한다. 기록 시 유사 Learning이 함께 반환되어 모순되면 `learning_supersede`로 폐기(이력 보존)하며, failure pattern이 임계치만큼 쌓이면 Engine이 Reflection Task를 만들어 상위 통찰로 합성하게 한다.

## 실행

Node.js 24 이상이 필요합니다.

```sh
npm install
npm run check
node apps/task-agent/src/mcp.ts
```

기본 데이터베이스는 `data/tasks.db`이며 `TASK_AGENT_DB`로 변경합니다. 상대 경로는 이 저장소 기준으로 해석합니다.

| 모드 | 명령 | 용도 |
|---|---|---|
| MCP stdio | `npm run mcp` | 호스트 Agent의 로컬 MCP 연결 |
| HTTP | `npm start` | 로컬/직접 HTTP 통합 (`/v1/<operation>`) |
| 원격 MCP | `npm run remote` | JWT 인증 Streamable HTTP 배포용 |
| 자동 진행 | `npm run orchestrate -- "<요청>"` | 사람 개입 없이 Task Graph를 끝까지 진행 |

HTTP 서버 기본 주소는 `127.0.0.1:7331`이며 `TASK_AGENT_HOST`, `TASK_AGENT_PORT`, `TASK_AGENT_TOKEN`으로 변경합니다. 외부 인터페이스 바인딩에는 Token이 필수입니다. 원격 모드 배포는 [배포 절차](deploy/README.md), AWS 없이 검증하려면 [로컬 Docker 서버](deploy/local/README.md)를 사용합니다.

## 외부 API

MCP Tool과 HTTP `/v1/<operation>`은 같은 operation 집합을 노출합니다.

| Operation | 역할 |
|---|---|
| `task_create` `task_search` `task_load` `task_get_runnable` `task_get_context` | Task 생성·검색·로드·Runnable 해석·Context 컴파일 |
| `task_propose_decomposition` `task_start` `task_complete` `task_fail` `task_reopen` | Proposal 기반 분해와 lifecycle 결과 제출 |
| `artifact_publish` `contract_define` `requirement_add` `impact_analyze` | Artifact 버전 발행, Contract 정의, Requirement/Constraint 등록, 영향 분석 |
| `learning_record` `learning_supersede` `learning_search` | 자기개선 Learning 축적·폐기·조회 |
| `integration_propose` `integration_run` `integration_report` | Integration Set 제안·실행·결과 보고 |
| `role_define` `role_list` | Worker Role 정의·조회 |
| `orchestrate_run` | 사람 개입 없는 자동 진행 루프 실행 |

## 경계

의존성 방향은 `protocol → task-orchestrator → task-agent-core → (task-engine · integration-engine · task-context) → task-domain`입니다. LLM은 Graph를 직접 수정하지 않고 Proposal과 Result만 제출하며, 상태 전이·검증·Stale 전파는 모두 Engine이 수행합니다. 모든 변경은 `events` 테이블에 Event로 남습니다.

## 자동 진행

```sh
npm run orchestrate -- "결제 모듈을 추가한다"     # 요청을 Root Task로 만들고 끝까지 진행
npm run orchestrate -- --task <taskId>            # 기존 Task를 이어서 진행
npm run orchestrate -- --resume                   # 완료되지 않은 Root Task를 모두 진행
```

Orchestrator는 Task마다 실행 하네스를 두 번 호출합니다. 먼저 `plan`으로 지금 실행할지 더 분해할지 판단하게 하고, `execute`로 실제 작업과 결과 제출을 시킵니다. 두 응답 모두 JSON Schema로 강제되며, Engine이 검증한 뒤에만 그래프에 반영됩니다.

기본 실행 하네스는 Claude Code CLI를 서브프로세스로 띄웁니다(`claude -p --output-format json --json-schema`). Role의 `allowedTools`가 `--allowedTools`로, principles·constraints가 `--append-system-prompt`로 전달되고, 판단 단계는 읽기 전용으로 제한됩니다. 다른 하네스를 쓰려면 `TaskExecutor` 인터페이스를 구현해 `createRuntime({ executor })`에 넘깁니다.

| 옵션 | 기본값 | 용도 |
|---|---|---|
| `--concurrency` | 1 | 동시에 실행할 Task 수. 하나의 작업 디렉터리를 공유하므로 파일이 겹치지 않는 Task에만 올립니다 |
| `--max-depth` | 4 | 허용할 분해 깊이 |
| `--max-attempts` | 2 | Task별 재시도 한도. 초과하면 그 Task만 사람에게 넘깁니다 |
| `--max-runs` | 200 | 실행 하네스 호출 총 예산 |
| `--verify-command` | 없음 | 하네스가 결과 제출 전에 실행할 검증 명령 |
| `--no-integration` | 꺼짐 | Integration 자동 계획·검증을 끕니다 |

하네스 동작은 `TASK_AGENT_CLI`, `TASK_AGENT_CLI_MODEL`, `TASK_AGENT_CLI_PERMISSION_MODE`, `TASK_AGENT_CLI_MAX_TURNS`, `TASK_AGENT_CLI_MAX_BUDGET_USD`, `TASK_AGENT_CLI_TIMEOUT_MS`, `TASK_AGENT_CLI_BARE`로 조정합니다. 작업 디렉터리는 `TASK_AGENT_WORKSPACE`, 검증 명령은 `TASK_AGENT_VERIFY_COMMAND`로도 지정할 수 있습니다.

막다른 상황에서는 멈추고 사람에게 넘깁니다. 재시도 한도를 넘긴 Task, Worker가 `blocked`으로 돌려준 Task, 반복 실패한 Integration Set은 상태와 사유를 남긴 채 리포트의 handoff 목록에 오르고, 그와 무관한 나머지 그래프는 계속 진행합니다.

배포 컨테이너에는 실행 하네스가 들어 있지 않습니다. 원격 모드에서 `orchestrate_run`을 쓰려면 이미지에 사용할 CLI를 함께 설치해야 합니다.

## 구현 범위

설계의 Phase 1–5가 구현되어 있습니다. Phase 1–4는 Task Graph, Artifact/Contract, Integration/Bundle/Stale, Diagnostic/Impact이고, Phase 5는 Orchestration Loop, Role Engine, Execution Harness 연동, 병렬 실행입니다.
