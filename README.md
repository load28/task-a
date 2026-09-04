# Task Agent

OpenCode를 내부 Agent Harness로 사용하는 독립형 Persistent Work Context Manager입니다. Host Agent는 네 가지 Gateway operation만 호출하며, Task 상태는 SQLite 기반 Event Log와 materialized Snapshot으로 관리합니다.

## 현재 구현 범위

- Task, Event, Snapshot, Artifact, Relation 도메인과 deterministic Task Engine
- SQLite 저장소와 트랜잭션 기반 Event/Snapshot 갱신
- 목적별 Task Context Compiler와 Agent 간 Handoff
- OpenCode SDK Harness와 8개 Custom Task Tool
- MCP 2025-06-18 stdio 및 HTTP Gateway
- source 추적과 sync idempotency

## 실행

Node.js 24 이상이 필요합니다.

```sh
npm install
npm run check
node apps/task-agent/src/mcp.ts
```

기본 데이터베이스는 `data/tasks.db`입니다. 경로는 `TASK_AGENT_DB`로 변경할 수 있습니다. OpenCode 연결 없이 MCP 프로토콜이나 구조화된 Engine 경로만 확인하려면 `TASK_AGENT_DISABLE_OPENCODE=1`을 사용합니다.

상대 DB 경로와 기본 경로는 서비스 저장소를 기준으로 해석합니다. MCP Host의 작업 디렉터리와 무관하게 같은 Task 저장소와 OpenCode Tool을 사용합니다.

Host의 MCP 설정에서는 이 저장소를 작업 디렉터리로 지정하고 `node apps/task-agent/src/mcp.ts`를 stdio 서버 명령으로 등록합니다. 자연어 `task_sync`와 `task_run`은 OpenCode에 구성된 모델 인증을 사용합니다.

외부 Gateway operation은 다음 네 가지입니다.

| Operation | MCP Tool | HTTP |
|---|---|---|
| Context | `task_context` | `POST /v1/context` |
| Sync | `task_sync` | `POST /v1/sync` |
| Handoff | `task_handoff` | `POST /v1/handoff` |
| Run | `task_run` | `POST /v1/run` |

HTTP 서버는 `npm start`로 실행합니다. 기본 주소는 `127.0.0.1:7331`이며 `TASK_AGENT_HOST`, `TASK_AGENT_PORT`, `TASK_AGENT_TOKEN`으로 변경합니다. Token을 지정하면 `/health` 이외의 요청에 `Authorization: Bearer <token>`이 필요합니다.

외부 인터페이스에 바인딩할 때는 Token이 필수입니다. MCP는 initialize → notifications/initialized 이후 Tool을 호출합니다. stdin이 닫히면 처리 중인 요청을 마친 뒤 Harness도 종료합니다.

`sync`에는 대화와 지시를 전달합니다. Host가 가공한 `events` 입력은 허용하지 않습니다. `idempotencyKey`를 지정한 재시도는 최초 응답을 그대로 반환하며 모델을 다시 호출하지 않습니다. 같은 키로 다른 입력을 보내면 오류를 반환합니다. 한 sync의 이벤트·Artifact·Snapshot·재시도 기록은 함께 커밋하거나 함께 롤백합니다.

```json
{
  "mcpServers": {
    "task-agent": {
      "command": "node",
      "args": ["/absolute/path/task-agent/apps/task-agent/src/mcp.ts"],
      "env": {
        "TASK_AGENT_DB": "/absolute/path/task-agent/data/tasks.db"
      }
    }
  }
}
```

## 경계

의존성 방향은 `protocol → task-agent-core → task-engine → task-domain`입니다. `opencode-harness`는 Core의 `TaskReasoner` 포트만 구현하며 Domain과 Engine은 OpenCode를 import하지 않습니다.

Task의 현재 상태는 Event History에서 다시 투영할 수 있습니다. Decision 대체는 `metadata.supersedes`, Blocker 해제는 `metadata.resolves`로 과거 Event를 보존합니다.

OpenCode는 별도 프로세스로 격리됩니다. Custom Tool은 Node bridge를 통해 Task Engine만 호출하므로 OpenCode의 Bun 런타임이 Domain이나 Storage에 침투하지 않습니다.

현재 sync는 OpenCode의 구조화된 이벤트 추출 뒤 Core가 Engine에 일괄 반영하는 방식입니다. 추출·Task 선택 세션의 쓰기 Tool은 차단하고, 자유 작업인 run은 Task Tool을 호출할 수 있습니다. 모든 operation을 OpenCode Tool Loop로 수행하는 원래 설계와는 이 부분이 다릅니다.

점검 결과와 남은 구현 범위는 [설계 점검 기록](docs/design-review.md)에 정리했습니다.
