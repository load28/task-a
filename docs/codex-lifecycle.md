# Codex CLI 자동 인계

일상 사용에는 [대화 안에서 시작하는 연결 흐름](in-host-experience.md)을 우선 사용한다. 아래 수동 bind와 별도 실행기는 저수준 진단용이다.

Codex CLI는 `Stop`/`PreCompact`/`Interrupt`에서 변경된 대화 텍스트를 로컬 대기열에 기록한다. `SessionEnd`는 남은 sync와 handoff를 순서대로 대기열에 넣는다. 터미널 실행기는 Codex 종료 후 대기열을 전송한다. 전송 실패 시 다음 실행 또는 수동 flush에서 재시도한다.

## 설정

Node 24 이상과 Codex CLI가 필요하다. 로컬 확인 버전은 codex-cli 0.147.0이다. 기존 Claude용 파일과 **다른** TASK_AGENT_OUTBOX를 지정한다. 이 설정은 명시적으로 연결한 세션의 사용자·assistant 텍스트를 수집하고 서버에 전달하는 데 동의하는 절차다.

```sh
export TASK_AGENT_HOST=codex
export TASK_AGENT_RESOURCE=https://YOUR_DOMAIN/mcp
export TASK_AGENT_OUTBOX=/PRIVATE/ABSOLUTE/PATH/codex-outbox.db
# TASK_AGENT_ACCESS_TOKEN에는 Task Agent 서버용 유효한 access token을 제공한다.
node /ABSOLUTE/PATH/task-a/scripts/codex-task.ts
```

`deploy/codex-hooks.example.json`의 경로를 바꾸고 사용하는 Codex 설정 레이어의 `hooks.json`에 기존 훅을 보존해 병합한다. Codex의 훅 검토·신뢰 절차를 거친다. 예제는 자동 설치되지 않는다. 모델·권한·기존 Codex CLI 인수는 실행기가 변경하지 않는다.

세션을 시작한 뒤 별도 터미널에서 대상 task ID, Codex session ID, 해당 rollout JSONL의 절대 경로를 명시적으로 연결한다. 같은 환경 변수를 설정해야 한다.

```sh
node /ABSOLUTE/PATH/task-a/scripts/session-hook.ts bind SESSION_ID TASK_ID TRANSCRIPT_PATH
```

연결 이전 대화는 수집하지 않는다. 한 세션은 한 Task에만 연결한다. 연결하지 않은 세션은 기록하지 않는다. 사용자 대화 속 평문 비밀은 자동으로 제거할 수 없다.

## 확인과 재시도

```sh
node /ABSOLUTE/PATH/task-a/scripts/session-hook.ts status
node /ABSOLUTE/PATH/task-a/scripts/session-hook.ts flush
node /ABSOLUTE/PATH/task-a/scripts/session-hook.ts handoff SESSION_ID
node /ABSOLUTE/PATH/task-a/scripts/session-hook.ts pause SESSION_ID
```

유효한 인증 없이는 원격 전송되지 않는다. 실행기는 Codex 로그인 저장소를 읽지 않는다. 전용 로그인 설정이 있으면 Task Agent 토큰을 갱신하며, 환경 변수 access token만 사용하면 사용자가 갱신해야 한다. 직접 `codex`로 실행하면 종료 시 로컬 저장만 이루어지므로 별도 flush가 필요하다.

## 보장 범위

[공식 Codex hooks 문서](https://learn.chatgpt.com/docs/hooks)에 따르면 SessionEnd는 동기 실행이며 최대 3초다. 종료 시 백그라운드 훅도 취소된다. 따라서 Codex 훅에서는 네트워크 요청을 하지 않는다. SQLite 잠금 대기는 250ms지만 큰 transcript 읽기까지 3초 내 완료된다고 보장하지 않는다.

강제 종료·전원 차단 전에 훅이 실행되지 않으면 아직 수집하지 못한 마지막 대화는 자동 저장되지 않는다. 이미 저장된 대기열은 남는다. null transcript, 파일 축소 또는 미지원 rollout 형식은 오류로 중단하며 성공으로 표시하지 않는다. rollout 형식은 공식적으로 안정된 계약이 아니므로 Codex 업그레이드 시 검증해야 한다.

검증은 합성 transcript 기반 자동 테스트다. 실제 계정 로그인, 사용자 세션 종료, AWS 서버 전송까지의 통합 검증은 별도로 필요하다.
