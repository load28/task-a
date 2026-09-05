# 여러 장소에서 이어가는 실제 작업 흐름

이 문서의 CLI 실행 방식은 저수준 진단 경로로 유지한다. 기본 UX는 [Codex·Claude 대화 안에서 사용하기](in-host-experience.md)로 변경했다. 사용자가 일상적으로 로그인·Task 시작 명령을 입력하지 않는다.

## 일상 사용

각 기기는 같은 원격 Task Agent에 본인 계정으로 로그인한다. Task DB는 서버에 하나만 두고, 기기에는 연결 설정·전용 인증 정보·전송 대기열만 둔다. SQLite 파일 자체를 클라우드 드라이브로 동기화하지 않는다.

```sh
# 각 기기에서 최초 로그인, 또는 refresh token 만료 후
node scripts/task-login.ts

# 장소 A: 기존 작업 이름으로 시작
TASK_AGENT_OUTBOX=/PRIVATE/PATH/codex-outbox.db node scripts/work.ts codex "RL compiler"

# 장소 B: 같은 서버/계정으로 같은 작업 이어가기
TASK_AGENT_OUTBOX=/PRIVATE/PATH/claude-outbox.db node scripts/work.ts claude "RL compiler"
```

작업 검색 → 최신 서버 컨텍스트 조회 → Host 실행 → SessionStart에서 기록 대상 자동 연결 및 컨텍스트 주입 → 평소처럼 대화·작업 → Stop에서 로컬 기록 → 실행기가 15초 간격으로 원격 sync → 종료 후 handoff 순서다. Task ID·session ID·transcript 경로를 사용자가 직접 연결하지 않는다. 작업 상태에 반영할 내용의 판단은 서버 Task Agent가 담당한다.

자동 기록은 이 실행기로 선택한 한 Task에 대한 명시적 동의다. 별도 sync를 Host에게 중복 요청하지 않도록 시작 컨텍스트에 안내한다. 훅이 연결되지 않으면 실행기가 경고하며 기록 성공으로 표시하지 않는다. 15초는 전송 시도 간격이며 서버 반영 완료 시간을 보장하지 않는다.

## 최초 설정

배포 관리자가 Cognito 인증 스택의 `WorkClientId`를 원격 서버 `TASK_AGENT_CLIENT_IDS`에 추가한다. 클라이언트에는 다음 연결 정보를 한 번 설정하고 이후 터미널에서 불러온다. 환경 설정 파일은 저장소 밖의 본인 전용 디렉터리에 보관한다.

```sh
export TASK_AGENT_RESOURCE=https://YOUR_DOMAIN/mcp
export TASK_AGENT_OAUTH_ISSUER=https://cognito-idp.REGION.amazonaws.com/POOL_ID
export TASK_AGENT_OAUTH_ORIGIN=https://PREFIX.auth.REGION.amazoncognito.com
export TASK_AGENT_OAUTH_CLIENT_ID=WORK_CLIENT_ID
export TASK_AGENT_CREDENTIALS=/PRIVATE/PATH/task-agent-credentials.db
unset TASK_AGENT_ACCESS_TOKEN
```

`task-login.ts`가 표시한 URL을 브라우저에서 열고 본인 계정으로 로그인한다. 등록된 callback은 `http://localhost:8765/callback`이다. 로그인 명령과 브라우저는 같은 컴퓨터에서 실행한다. SSH 서버에서 실행하면 별도 안전한 callback 연결이 필요하며 현재 자동 구성하지 않는다.

각 Host에 `deploy/codex-hooks.example.json` 또는 `deploy/claude-hooks.example.json`을 기존 훅을 보존해 병합하고 절대 경로를 맞춘다. Host의 훅 신뢰·승인 절차는 생략하지 않는다. 이 저장소는 전역 설정을 자동으로 덮어쓰지 않는다.

인증 코드 교환은 SDK의 PKCE를 사용한다. 이후 인증 만료 응답에는 저장된 refresh token으로 갱신한다. 서버·issuer·OAuth origin·client ID가 다른 연결에서는 같은 인증 파일을 거부한다. 승인한 HTTPS origin 밖의 인증 요청과 리디렉션도 거부한다. [Cognito의 PKCE와 resource binding](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)을 사용하며 서버의 owner·audience·scope 검증은 유지한다.

## 실패와 개인정보

네트워크 단절·재로그인 필요 시 기록은 로컬 대기열에 남는다. 새 작업 시작 전, 작업 중, 종료 후에 재시도한다. 모든 실행기를 닫은 동안에는 상주 worker가 없으므로 재시도하지 않는다. 강제 종료 직전에 훅이 실행되지 않은 대화는 보장하지 않는다.

기록 중단은 기존 `session-hook.ts pause SESSION_ID`를 사용한다. 같은 세션에서 작업을 바꿔 잘못 기록하지 않도록 현재는 새 work 실행으로 전환한다. 로컬 자격 증명 삭제는 `node scripts/task-login.ts logout`이다. 서버에서 발행한 토큰의 철회와 디스크 포렌식 삭제를 의미하지 않는다.

인증 정보와 대기열은 권한 600의 로컬 SQLite 파일이다. OS 키체인 암호화는 아직 적용하지 않았다. refresh token을 다른 장소로 복사하지 않고 그 장소에서 로그인한다. 평문 대화 속 비밀은 자동 필터링을 보장하지 않으므로 민감한 대화 전에는 기록을 중단한다.

## 검증과 남은 제품 단계

자동 테스트는 두 기기 대기열과 같은 서버 Engine을 사용해 첫 장소의 결정이 다음 장소의 context에 나타나는지 검사한다. SessionStart 실제 스크립트 실행, PKCE·resource 매개변수, 재시작 후 refresh, callback 재사용 거부도 검사한다. 테스트의 대화·인증 서버는 합성 데이터이며 실제 AWS/Cognito/Host 통합 성공을 뜻하지 않는다.

2026-09-05 검증: 타입 검사와 자동 테스트 40개, 두 AWS 템플릿의 cfn-lint 검사가 통과했다. 구성된 실제 모델에 합성 대화를 전달한 `evaluate-host.ts`도 context 1회 → 제안 턴 호출 없음 → sync 1회 → handoff 1회로 통과했다. 이 평가는 OpenCode로 모사한 Host의 의미 판단을 검증하며 실제 Codex/Claude 프로그램 종료 훅 전체를 검증하지는 않는다. AWS 기본 프로필은 STS 인증이 거부되어 실제 배포를 진행하지 않았다.

운영 완료 기준은 실제 AWS HTTPS 서버에서 본인 로그인 → Codex 대화의 결정 자동 저장 → 다른 기기의 Claude에서 해당 결정 조회 → 토큰 만료 후 자동 갱신 → 타 계정 접근 거부를 직접 통과하는 것이다.

현재 work 실행기는 기존 작업만 선택한다. 일반 대화 중 새 Task 생성·Task 전환·후보 선택 UI, 무인 상주 재시도, OS 키체인, 기기별 연결 철회 UI는 아직 제공하지 않는다. 앞으로 이 경험을 확장하되 Task Engine이나 외부 4개 API에 Host 세션 상태를 결합하지 않는다. 이번 변경은 로컬 Host 통합 계층에 집중했다.

Codex 컨텍스트 주입과 짧은 종료 훅 처리는 [공식 OpenAI hooks 문서](https://learn.chatgpt.com/docs/hooks)를 기준으로 분리했다.
