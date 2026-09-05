# Task Agent

**OpenCode 서버가 요청 해석부터 태스크 관리·구현·검증까지 전체 하네스를 담당합니다.** Claude Code와 Codex는 대화 화면으로 사용하고, Task Graph는 OpenCode가 호출하는 영속 상태 도구로 동작합니다.

## 설치와 사용

Node.js 24 이상이 필요합니다. 한 번 설치하면 현재 프로젝트 경로를 자동 인식합니다.

```sh
npm ci
npm run host:install -- --opencode-url http://127.0.0.1:4096 --model claude --verify-command "npm test"
```

기존 OpenCode 서버를 사용하려면 `--opencode-url`을 지정합니다. 생략하면 로컬 전달 서비스가 OpenCode 서버를 자동 기동합니다. Docker는 필수가 아닙니다. 서버의 Claude 인증을 준비하고 Claude Code·Codex의 새 세션에서 훅을 신뢰한 뒤 평소처럼 요청합니다. MCP만 등록하면 자동 요청 전달 훅이 설치되지 않습니다. `--workspace`는 기존 DB 연결이나 명시적인 범위 설정이 필요할 때만 사용합니다.

[설치·운영 안내](docs/automatic-host.md)와 [최종 실행 설계](docs/automatic-host-plan.md)에 설정과 검증 범위를 정리했습니다.

## 실행 구조

```text
Claude Code / Codex
  ├─ UserPromptSubmit ── 요청 전달 서비스 ── OpenCode Server
  └─ Host MCP ◀──────── 상태·질문·승인·취소 ──────┤
                                                ├─ task-manager (기본 에이전트)
                                                ├─ task-planner / task-worker (하위 에이전트)
                                                ├─ 파일·터미널·외부 MCP 도구
                                                └─ Task Graph MCP
                                                     ├─ Task / Context / Integration Engine
                                                     └─ SQLite 그래프·버전·이력
```

전달 서비스는 요청과 OpenCode 세션 ID를 보존합니다. 태스크 추출·분해·선택·계획·실행·통합·재시도는 OpenCode가 수행합니다. 그래프 엔진 내부에서 추론이 필요한 작업도 OpenCode 기본·하위 에이전트가 맡습니다. 그래프 엔진은 제안 검증, 상태 전이, 버전·의존성·완료 조건 계산만 수행합니다.

호스트 MCP는 `agent_control`, `agent_status`, `agent_reply`, `agent_cancel`을 제공합니다. 작업 중 상태 질문·중단·조건 변경·새 작업·승인 답변을 구분해 전달합니다. OpenCode의 Task Graph MCP는 그래프 도구 22개를 제공하며 `orchestrate_run`을 노출하지 않습니다. 그래프 변경에는 중복 방지를 위한 `operationId`가 필요합니다.

## 구성 요소

| 구성 | 책임 |
|---|---|
| `packages/host-integration` | 훅, 설정 설치, 영속 요청 전달, 세션 연결, 상태·사용자 응답 전달 |
| `packages/opencode-harness` | OpenCode 서버 연결, 기본·하위 에이전트 정의, native session API, Graph MCP |
| `packages/task-engine`, `task-context`, `integration-engine` | 결정적인 그래프·맥락·검증 상태 처리 |
| `packages/task-domain`, `task-store`, `task-agent-core` | 도메인 모델, SQLite 저장소, 그래프 API |

기존 `packages/task-orchestrator` 실행 루프와 Claude CLI 실행기는 이전 API의 호환성·회귀 테스트용 코드입니다. 기본 런타임, 호스트 서비스, MCP 및 `npm run orchestrate`에서 실행하지 않습니다. 그래프 세부 모델은 [도메인 설계](docs/architecture.md)를 참고합니다.

## 운영과 검증

```sh
node scripts/host-setup.ts start
npm run host:doctor
npm run host:status
node scripts/host-setup.ts cancel --request <requestId>
npm run host:stop
npm run host:uninstall
npm run check
npm run evaluate:host -- --model claude
```

`host:doctor`는 실제 서버, 모델 인증, Graph MCP, 에이전트 로딩을 확인합니다. `check`는 결정적인 회귀·SDK 계약·훅·서비스 복구 테스트입니다. `evaluate:host`는 임시 프로젝트에서 실제 모델이 파일을 만들고 그래프 결과를 기록하는 별도 평가이며 서버 모델 인증이 필요합니다.

그래프 단독 stdio는 `npm run mcp`, JWT 인증 원격 Graph MCP는 `npm run remote`입니다. 이들은 OpenCode가 사용하는 백엔드이며 호스트 자동 연동의 대체물이 아닙니다. 기본 그래프 DB는 `data/tasks-v2.db`이고 `TASK_AGENT_DB`로 변경합니다. 기존 Docker 배포는 [배포 안내](deploy/README.md)에 있습니다.
