# Codex·Claude 대화 안에서 Task Agent 사용

## 사용자가 하는 일

평소처럼 Codex 또는 Claude Code를 연다. 별도 work 실행기나 로그인 CLI를 실행하지 않는다.

- “Task Agent 연결해 줘.” → 필요한 경우 대화 안에 로그인 링크가 표시된다. 브라우저에서 본인 계정으로 로그인하고 대화로 돌아온다.
- “RL compiler 작업 이어서 하자.” → Task Agent가 기존 작업을 찾고 컨텍스트를 반환하며 현재 세션의 기록 대상을 연결한다.
- “정규화 단계를 분리하자.” → 이후 세션 훅과 전송 대기열이 sync를 처리한다. 사용자가 저장 명령이나 ID를 입력하지 않는다.
- “기록 잠깐 멈춰 줘.” → Host가 로컬 recording 도구를 호출해 수집과 대기 중 전송을 멈춘다.

단순히 “진행 상황만 알려줘”라고 물으면 조회만 수행한다. 로그인 성공 전에는 기록 대상을 연결하지 않는다. 작업을 시작하는 최신 사용자 메시지와 이후 대화가 기록 대상이며 이전의 무관한 대화는 소급 수집하지 않는다. 동일 세션에서 다른 Task로 조용히 변경하는 요청은 거부한다.

## 연결 계층

Host는 로컬 MCP bridge를 자동 실행한다. bridge가 인증된 원격 Task Agent를 호출하며, 원격 Gateway의 context/sync/handoff/run 계약은 유지한다. 로컬 task_connect·task_recording은 인증과 기록 상태를 위한 Host 기능이지 Task Engine API가 아니다.

SessionStart 훅은 현재 세션의 내부 handle을 발급해 Host 컨텍스트에 넣는다. 이것만으로 대화가 수집되지는 않는다. Host가 실제 작업 요청에 대해 task_context(record=true)를 호출하면 선택된 Task와 handle을 연결한다. 이 내부 값을 사용자가 직접 입력하게 하지 않는다. handle은 로컬 라우팅용이며 원격 계정 인증을 대체하지 않는다.

로그인이 필요하면 MCP 호출이 loginUrl을 반환한다. 로그인 완료 후 Host가 원래 요청을 다시 호출한다. 비밀번호·인증 코드·access token을 대화에 붙여 넣지 않는다. 브라우저와 bridge는 같은 컴퓨터에서 실행해야 한다. 동시에 여러 창에서 로그인하면 callback 포트가 사용 중일 수 있으며 기존 로그인 완료 후 다른 창에서 연결을 재시도한다.

bridge는 살아 있는 동안 15초마다 대기열을 전송한다. SessionEnd 훅에서는 로컬 저장만 한다. Host가 bridge까지 먼저 종료하면 마지막 전송은 다음 Host 시작 때 재시도할 수 있다. 따라서 모든 창이 닫힌 뒤 즉시 원격 handoff 완료까지 보장하는 상주 서비스는 아직 아니다.

## 최초 설치에만 필요한 설정

설치 담당자가 다음 예제를 사용해 실제 서버·Cognito WorkClientId·절대 파일 경로를 채운다. 일상 사용자가 매번 입력할 값은 없다.

| 파일 | 역할 |
| --- | --- |
| deploy/host-connection.example.json | 서버와 인증 제공자, 로컬 저장 경로 |
| deploy/host-mcp.codex.example.toml | Codex MCP 등록 |
| deploy/host-mcp.example.json | Claude Code MCP 등록 |
| deploy/host-hooks.example.json | 양쪽 Host의 세션 훅 등록 |

MCP와 훅은 같은 host-entry.ts 및 같은 connection JSON을 사용한다. 그래서 셸 export 유무에 따라 훅만 연결에 실패하는 문제를 피한다. Codex와 Claude는 서로 다른 outbox와 host 설정을 사용한다. 같은 계정·서버의 인증 파일은 함께 사용할 수 있다. 다른 컴퓨터에는 인증 파일을 복사하지 않고 그 컴퓨터에서 로그인한다.

기존 MCP·훅 설정은 보존해 병합하고 Host의 신뢰·승인 절차를 거친다. 이 변경은 사용자의 전역 설정을 설치하거나 현재 실행 중인 Host에 도구를 등록한 상태가 아니다. 실제 서버 값과 등록 절차가 있어야 활성화된다. 기존 work.ts/task-login.ts는 저수준 진단 경로로 남으며 기본 사용 안내가 아니다.

## 검증 경계

자동 테스트는 대화 도구의 로그인 링크 반환 → 로그인 후 기록 연결, 읽기 전용 조회, 잘못된 session handle 거부, 기록 중단, 최초 결정 포함을 검사한다. 공식 MCP SDK Client가 실제 로컬 stdio bridge를 실행해 tools/list와 recording 상태 조회를 통과하는지도 검사한다. 셸 환경 export나 별도 work 실행기를 사용하지 않는다.

이는 실제 Codex·Claude 모델이 언제나 정확히 도구를 선택한다거나 AWS 로그인·두 기기 연동까지 완료됐다는 뜻은 아니다. 실제 제품 검증이 남아 있다. [공식 Codex MCP 문서](https://learn.chatgpt.com/docs/extend/mcp)의 server instructions와 [세션 훅](https://learn.chatgpt.com/docs/hooks)을 기준으로 구현했다.
