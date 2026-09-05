# Task Agent

자연어 요청을 영속적인 재귀형 Task Graph로 변환하는 Agent Task Runtime입니다. Prompt는 입력이고, Task가 실제 상태이며, Session(GPT·Claude·기타 Agent)은 Worker입니다. 각 Task는 버전된 Artifact를 생성하고, 여러 Artifact 조합은 Integration Graph에서 별도로 검증되며, 검증을 통과한 조합만 Verified Bundle로 상위 Task에 승격됩니다.

핵심 개념과 설계 원칙은 [설계 문서](docs/architecture.md)에 정리했습니다.

## 시스템 구성

```
GPT / Claude / Other Agent
          │  MCP / HTTP
          ↓
     Task Agent (Orchestrator)
          │
  ┌───────┼────────────┐
  ↓       ↓            ↓
Task Graph  Context   Integration
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
- `packages/protocol-mcp` / `packages/protocol-http` — MCP 2025-06-18 stdio·인증 원격 MCP·HTTP Gateway

## 핵심 흐름

1. `task_create` — 요청을 Root Task로 변환한다.
2. `task_propose_decomposition` — LLM이 분해를 제안하면 Engine이 cycle·중복 책임·의존성을 검증한 뒤 적용한다.
3. `task_get_runnable` / `task_get_context` — 다른 세션에서도 실행 가능한 Leaf와 Graph 기반 Context를 받아 이어간다.
4. `task_start` → 작업 → `task_complete` — Agent는 결과만 제출하고 상태 전이는 Engine이 판단한다.
5. `artifact_publish` — 결과는 lineage·contract가 기록된 버전 Artifact가 된다. 재발행 시 downstream이 stale된다.
6. `integration_propose` → `integration_run` → `integration_report` — Architecture Boundary 단위 조합을 Scenario로 검증하고, 통과한 정확한 버전 조합을 Verified Bundle로 승격한다. 실패는 원인 분류 후 필요한 Task만 reopen하거나 Diagnostic Task를 만든다.
7. `learning_record` / `task_complete`의 `learnings` — 작업에서 배운 것(insight·pitfall·convention·failure pattern)을 Learning으로 축적하고, Engine이 이후 Task Context에 관련 Learning을 자동 주입한다. 같은 주제의 두 번째 실행이 첫 번째보다 나아진다.

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

HTTP 서버 기본 주소는 `127.0.0.1:7331`이며 `TASK_AGENT_HOST`, `TASK_AGENT_PORT`, `TASK_AGENT_TOKEN`으로 변경합니다. 외부 인터페이스 바인딩에는 Token이 필수입니다. 원격 모드 배포는 [배포 절차](deploy/README.md), AWS 없이 검증하려면 [로컬 Docker 서버](deploy/local/README.md)를 사용합니다.

## 외부 API

MCP Tool과 HTTP `/v1/<operation>`은 같은 operation 집합을 노출합니다.

| Operation | 역할 |
|---|---|
| `task_create` `task_search` `task_load` `task_get_runnable` `task_get_context` | Task 생성·검색·로드·Runnable 해석·Context 컴파일 |
| `task_propose_decomposition` `task_start` `task_complete` `task_fail` `task_reopen` | Proposal 기반 분해와 lifecycle 결과 제출 |
| `artifact_publish` `contract_define` `requirement_add` `impact_analyze` | Artifact 버전 발행, Contract 정의, Requirement/Constraint 등록, 영향 분석 |
| `learning_record` `learning_search` | 자기개선 Learning 축적·조회 |
| `integration_propose` `integration_run` `integration_report` | Integration Set 제안·실행·결과 보고 |

## 경계

의존성 방향은 `protocol → task-agent-core → (task-engine · integration-engine · task-context) → task-domain`입니다. LLM은 Graph를 직접 수정하지 않고 Proposal과 Result만 제출하며, 상태 전이·검증·Stale 전파는 모두 Engine이 수행합니다. 모든 변경은 `events` 테이블에 Event로 남습니다.

## 구현 범위

설계의 Phase 1–4(Task Graph, Artifact/Contract, Integration/Bundle/Stale, Diagnostic/Impact)가 구현되어 있습니다. Phase 5(Multi Agent 병렬 orchestration, Role Engine 고도화, OpenCode Execution Harness 연동)는 이 코어 위에 확장할 다음 단계입니다.
