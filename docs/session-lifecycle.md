# 세션 종료 자동 인계

일상 사용은 [대화 안에서 연결하는 흐름](in-host-experience.md)을 우선 사용한다. Codex CLI의 저수준 설정은 [Codex 자동 인계 설정](codex-lifecycle.md)을 따른다. 아래는 Claude Code용 수동 설정이다.

## 동작

Claude Code의 Stop(응답 종료)·PreCompact에서는 명시적으로 연결한 세션의 새 사용자/assistant 텍스트를 로컬 SQLite 대기열에 먼저 보존한다. SessionEnd에서는 마지막 구간과 handoff 요청을 함께 넣는다. worker는 sync 성공을 확인한 뒤에만 handoff를 실행하며 결과도 로컬에 보관한다. 종료 훅은 세션 종료를 보장하거나 막는 기능이 아니다.

네트워크·인증·시간 초과 시 미완료 요청과 동일한 idempotencyKey를 유지한다. 다음 SessionStart, Stop 또는 수동 flush가 재시도한다. sync 응답을 잃은 경우 서버의 기존 receipt를 재사용한다. 동시 hook worker는 lease로 중복 실행을 제한하며 강제 종료된 worker의 lease는 최대 10분 뒤 만료된다. 다음 실행이 없다면 자동 재시도도 없다.

SIGKILL이나 시스템 전원 차단 때 종료 훅이 실행된다고 보장하지 않는다. 앞선 Stop에서 대기열에 담긴 구간만 복구할 수 있다. handoff는 Task 완료 처리와 다르며 Task status를 completed로 바꾸지 않는다.

## 활성화

`deploy/claude-hooks.example.json`을 참고해 실제 저장소 경로로 바꾼 hook 항목을 사용자의 Claude Code 설정에 병합한다. 이 작업에서는 사용자의 전역 설정을 수정하거나 실제 대화를 전송하지 않았다. Stop은 매 턴의 응답 종료이며 SessionEnd와 다르다.

Hook 프로세스에 다음 환경을 전달한다.

- TASK_AGENT_RESOURCE: 인증된 원격 MCP의 HTTPS URL
- TASK_AGENT_OUTBOX: 본인만 접근 가능한 로컬 대기열 DB 경로
- TASK_AGENT_ACCESS_TOKEN: 정식 OAuth 로그인으로 발급한 현재 access token

CLI는 Host의 토큰 저장소를 읽지 않는다. 전용 OAuth 설정과 task-login.ts를 사용하면 Task Agent 로그인/refresh를 처리한다. 환경 변수 access token만 제공하면 만료 시 사용자가 갱신해야 한다. 인증이 실패하면 로컬 기록을 보존한다. 비밀을 hook command나 저장소 설정 파일에 직접 넣지 않는다.

Task를 선택한 뒤, 기록을 허용할 세션 ID·Task ID·transcript 파일을 한 번 연결한다. 연결 이전 대화는 수집하지 않는다.

```sh
node scripts/session-hook.ts bind SESSION_ID TASK_ID TRANSCRIPT_PATH
node scripts/session-hook.ts status
node scripts/session-hook.ts flush
node scripts/session-hook.ts handoff SESSION_ID
node scripts/session-hook.ts pause SESSION_ID
```

한 세션은 한 Task만 연결한다. 다른 Task로 전환할 때는 새 세션을 사용한다. pause는 이후 수집과 아직 전송하지 않은 요청을 중단한다. 이미 전송 중이거나 서버에 저장된 내용을 취소하지는 않는다. paused 대기열은 자동 재개하지 않는다.

## 개인정보와 검증 범위

Hook 설치와 세션 연결은 해당 구간의 일반 대화 텍스트를 Task Agent로 전달하는 명시적 동의다. thinking·tool 결과·첨부 블록·sidechain은 제외한다. 일반 텍스트로 입력한 비밀을 완벽하게 식별할 수는 없으므로 그런 대화는 연결하지 않거나 사전에 pause한다. 대기열은 로컬 평문이며 파일 권한을 600으로 제한한다. 성공한 sync의 원문은 대기열 행에서 비우지만 포렌식 수준의 디스크 삭제를 보장하지 않는다.

자동 테스트로 종료 순서, 중복 종료, 실패 후 재시작, handoff만 재시도, 동시 worker, transcript 필터를 검사한다. 실제 Claude Code 종료 및 OAuth 토큰 갱신을 포함한 운영 검증은 원격 서버 배포·계정 연결 후 필요하다. 이 어댑터는 ChatGPT 창 닫기 이벤트를 감지하지 않는다.

근거: [Claude Code SessionEnd와 시간 제한](https://code.claude.com/docs/en/hooks#sessionend).
