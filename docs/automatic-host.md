# Claude Code·Codex에서 OpenCode 서버 사용

Claude Code·Codex에서 평소처럼 요청한다. 요청 해석과 태스크 관리, 코드 작성, 검증은 OpenCode 서버가 수행한다. 호스트에서 Task Agent나 MCP 도구 이름을 명시할 필요가 없다.

## 설치

Node.js 24 이상과 OpenCode 서버의 모델 인증이 필요하다. 저장소에서 다음을 실행한다.

```sh
npm ci
npm run host:install -- --opencode-url http://127.0.0.1:4096 --model claude --verify-command "npm test"
node scripts/host-setup.ts start
npm run host:doctor
```

이미 운영하는 OpenCode 서버의 주소는 `--opencode-url`로 지정한다. 생략하면 전달 서비스가 private OpenCode 서버를 자동 실행한다. Docker는 필요하지 않다. 외부 서버는 HTTPS를 사용하며 loopback 주소만 HTTP를 허용한다. Basic 인증은 `OPENCODE_SERVER_USERNAME`과 `OPENCODE_SERVER_PASSWORD` 환경 변수로 전달한다.

기본 연결은 OpenCode 서버가 이 저장소의 `scripts/graph-mcp.ts`를 실행하는 방식이다. 따라서 서버가 같은 작업 경로와 Node 실행 파일에 접근할 수 있어야 한다. 다른 머신에서 운영할 때는 서버가 접근할 수 있는 작업 경로와 `--graph-mcp-url https://graph.example/mcp`를 지정하고, 그 Graph MCP의 인증을 OpenCode에서 연결한다. 하나의 원격 Graph MCP URL은 한 프로젝트에 사용한다. 원격 모드의 DB 운영은 그 Graph MCP 서버가 담당한다.

`--model claude`는 OpenCode 서버의 인증된 Anthropic 기본 모델로 해석한다. `provider/model`도 지정할 수 있다. Claude Code에 로그인한 것만으로 OpenCode의 인증이 준비되었다고 판단하지 않는다. 실제 OpenCode가 사용하는 계정에서 `opencode auth login`으로 연결한 뒤 `host:doctor`를 확인한다. 인증 없이 무료 모델로 대체하지 않는다.

설치 명령은 `~/.task-agent/host.json`, Claude/Codex 훅, 호스트 전용 MCP를 설정한다. 기존 설정은 백업하고 다른 훅과 MCP 항목은 보존한다. Claude Code·Codex를 새 세션으로 열고 변경된 훅 정의를 신뢰해야 한다. MCP만 추가하면 UserPromptSubmit 자동 전달은 활성화되지 않는다.

프로젝트 경로는 기본적으로 자동 인식한다. 현재 경로에서 가장 가까운 Git 저장소·worktree를 찾고, Git이 없으면 프로젝트 표시 파일 또는 현재 디렉터리를 사용한다. 홈 디렉터리와 파일시스템 루트는 자동 등록하지 않는다. 발견한 프로젝트는 전달 DB에 보존하고 별도 Graph DB를 사용한다. 기존 명시적 프로젝트의 DB 경로는 유지한다. `--workspace`는 선택 사항이다. 원격 Graph MCP URL을 지정하는 구성은 서버 경로 매핑 때문에 기존 단일 프로젝트 등록 방식을 유지한다.

## 대화와 실행

UserPromptSubmit이 원문을 보존한다. 실행 중인 요청이 없으면 바로 전달하고, 작업 중이면 호스트가 대화 제어만 선택한다. 새 개발 요청은 OpenCode가 먼저 읽기 전용 조사와 사용자용 계획을 만들고, 사용자가 native 질문에서 승인할 때까지 태스크 생성·파일 수정·worker 실행·검증을 시작하지 않는다. 계획에는 살펴보기·설계하기·만들기·확인하기 단계와 필요한 조사 출처를 보인다. 기존 작업을 “계속”, “재개”, “이어서”처럼 명시적으로 요청하면 OpenCode는 승인 절차를 반복하지 않고 바로 재개한다. “계획 보여줘”, “계획 바꿔줘” 같은 자연어 요청은 현재 계획 표시 또는 영향 설명이 포함된 새 계획 버전의 승인 질문으로 처리한다. 호스트는 OpenCode의 진행 내용과 결과를 조회해 표시하고, 질문이나 승인이 필요한 경우 내용을 보여주고 실제 답만 전달한다. 호스트는 승인 의도를 추측하거나 대신 승인하지 않는다. 질문 답변은 기존 native 질문에 전달한다. 별개 작업은 대기열에 넣을 수 있고, 조건 변경은 현재 실행을 중단한 뒤 같은 세션에서 원문으로 전달한다.

OpenCode 기본 에이전트는 태스크 추출·분해·선택·실행·통합·재시도를 담당한다. 필요하면 같은 서버의 계획·작업 subagent를 호출한다. 검증 명령도 OpenCode가 수행한다. 호스트는 파일 수정과 로컬 검증을 대신하지 않는다. 계획 모드는 읽기 전용 OpenCode 에이전트에 전달한다.

호스트 MCP에는 `agent_control`, `agent_status`, `agent_reply`, `agent_cancel`을 노출한다. 대화 제어는 상태 확인·취소·조건 변경·새 작업·질문 답변만 구분하며 태스크 추출이나 구현 계획을 만들지 않는다. 실제 Graph MCP와 외부 작업 MCP는 OpenCode에 연결한다. Bash 등 native 권한 요청은 사용자의 1회 허용·거부로 응답한다. “어디까지 했어?”는 새 모델 작업을 만들지 않고 상태를 반환한다. “멈춰”는 현재 실행과 대기 요청을 취소한다. “이 조건도 반영해”는 현재 native 실행과 하위 세션을 중단한 후 같은 세션에서 수정된 요구를 반영하게 한다. 이미 수행한 파일 변경은 취소로 되돌리지 않는다.

Claude Code와 Codex에서 동일 프로젝트를 열면 같은 OpenCode 세션을 사용한다. 전달 상태는 `~/.task-agent/relay.db`에, 그래프는 첫 프로젝트의 지정 DB와 추가 프로젝트별 DB에 저장한다. `maxRuns`는 기존 설정 이름을 유지하지만 현재는 각 native 에이전트의 단계 제한으로 적용한다. `autoContinue`는 이전 설정 호환용이며 호스트 실행 루프를 활성화하지 않는다.

## 운영·복구·이전

```sh
npm run host:status
npm run host:doctor
node scripts/host-setup.ts cancel --request <requestId>
npm run host:stop
npm run host:uninstall
```

첫 요청이 전달 서비스를 자동 기동한다. 호스트 대화가 종료되어도 OpenCode 요청은 계속 진행한다. 상태 조회는 최대 25초씩 대기한다. 열려 있는 대화에서는 Stop 훅이 최대 20초씩 상태를 기다리고 미완료 상태로 답변을 끝내지 않도록 연결한다. 결과와 질문은 한 번만 전달한다. 상태 확인만 요청한 대화는 작업을 기다리지 않고 종료한다. 사용자가 대화 자체를 닫은 뒤에는 화면에 강제로 푸시하지 않으며 후속 대화에서 조회한다. 세션 시작 시 활성 요청 ID를 안내한다.

서비스 재기동 시 저장한 세션·메시지 ID로 상태를 복구한다. 전송 확인이 불분명하면 `uncertain`으로 표시하며 자동 중복 실행을 막는다. 서버에 연결할 수 없으면 호스트에서 대체 실행하지 않는다. 인증·준비 오류는 `failed`로 표시하므로 설정을 수정한 후 요청을 다시 보내면 된다. 서버 자체가 실행 중에 종료된 경우 `interrupted`로 남길 수 있으며, 후속 요청의 복구 판단은 OpenCode가 한다.

서비스 정지는 managed OpenCode 서버도 종료한다. 외부 서버는 종료하지 않는다. 제거는 설치 전 호스트 MCP 설정을 복원하고 그래프와 전달 DB를 보존한다. 로그는 `~/.task-agent/service.log`에 남는다. 이전 구현의 `host_jobs`는 새 서비스에서 실행하지 않는다.

```sh
npm run migrate:legacy -- /absolute/path/old.db /absolute/path/new.db /absolute/path/project
npm run host:install -- --workspace /absolute/path/project --database /absolute/path/new.db
```

구버전 DB는 읽기 전용으로 읽고 별도 DB로 이전한다. 원본 행·이벤트는 보존한다. 기존 completed를 검증 완료로 추정하지 않는다.

## 검증 범위

`npm run check`는 그래프 회귀, 중복 receipt와 트랜잭션 롤백, 프로젝트 분리, SDK API 계약, 기본·하위 세션의 질문·승인·취소, 전달 재시작, 불명확한 전송, 실제 Claude/Codex 훅 프로세스, 설치 반복과 제거를 검증한다. 모델 응답은 결정적인 fixture다.

실제 OpenCode 1.18.29의 기동·health·Graph MCP 연결·기본/계획/작업 에이전트 로딩을 별도로 확인했다. 실제 모델이 파일을 작성하고 그래프 결과를 기록하는 검사는 다음 명령으로 수행한다. 서버 모델 인증이 필요하다.

```sh
npm run evaluate:host -- --model claude
# 기존 서버를 평가할 때
npm run evaluate:host -- --opencode-url http://127.0.0.1:4096 --model claude
```

훅 subprocess 테스트와 실제 Claude/Codex 제품의 신뢰·실행 검증은 구분한다. Codex PreToolUse는 Bash·apply_patch·MCP와 지원되는 로컬 함수 호출을 차단한다. Hosted WebSearch와 일부 특수 경로는 훅을 거치지 않으므로 이 훅은 완전한 보안 격리 경계가 아니다. 새 세션에서 직접 실행 차단과 브리지 MCP 접근을 확인해야 한다.

계약 근거: [Codex hooks](https://learn.chatgpt.com/docs/hooks), [Claude hooks](https://code.claude.com/docs/en/hooks), [OpenCode server](https://opencode.ai/docs/server/), [OpenCode agents](https://opencode.ai/docs/agents/).

## 호스트 진행 표시

호스트에서는 태스크 에이전트라는 이름과 `agent_status`, `agent_control`, `agent_reply`, `agent_cancel` 도구를 사용한다. 상태 응답은 현재 태스크, 관측된 실행 단계, 최근 주요 진행 사항, 사용자용 계획과 최종 결과만 전달한다. 계획은 단계명·조사 출처·결과·의존 관계·승인 필요 여부만 담는 안전한 표시이며 태스크 ID, MCP 이름, 범위, worker, artifact 같은 내부 정보는 제외한다. 누적 도구 기록과 내부 세션 ID도 호스트 응답에서 제외하고 서버 기록에 보존한다. 같은 진행 상태를 반복 조회하면 `changed: false`를 반환하여 호스트가 같은 내용을 반복 설명하지 않게 한다. 완료·오류·질문은 생략하지 않는다.

도구 이름이 바뀐 버전으로 갱신한 뒤에는 Claude Code·Codex의 task-agent MCP 연결을 다시 연결하거나 호스트를 재시작한다. 실행 중인 MCP 프로세스는 이전 도구 목록을 유지할 수 있다. 도구 호출 카드와 훅 차단 표시 자체의 렌더링은 호스트가 담당한다.

## 충돌 없는 병렬 실행

OpenCode 관리 에이전트는 독립적인 작업자 호출을 같은 응답에서 동시에 실행한다. 기본 동시 점유 수는 3개이며 `npm run host:install -- --max-workers 3` 또는 `host.json`의 `maxWorkers`로 1–16개 사이에서 조정한다. 로컬 그래프 MCP에도 같은 상한을 전달한다. 원격 그래프 MCP는 서버 운영자가 `TASK_AGENT_MAX_WORKERS`를 설정한다.

태스크 생성·분해 시 `writeScopes`에 수정할 프로젝트 상대 파일·디렉터리를 선언한다. 예: `["src/ui/chip.ts", "src/ui/chip.test.ts"]`. `[]`는 읽기 전용이고 생략하면 프로젝트 전체(`.`)를 예약한다. 생성 파일도 포함한다. 설치, 공용 설정 변경, 전체 빌드는 `.`로 예약한다. 파일과 상위 디렉터리, 대소문자 별칭은 충돌로 판단하며 심볼릭 링크를 거치는 범위는 보수적으로 전체 예약한다.

`task_schedule`은 실행 중인 작업과 충돌·용량 대기를 보여준다. 실제 예약은 `task_start`가 상태 전이와 함께 SQLite 트랜잭션으로 처리한다. 시작 경쟁에서 진 작업자는 수정하지 않고 대기한다. 수정 범위가 늘어나면 `task_expand_scope`가 성공한 뒤 수정한다. 예약은 선언된 범위에 대한 스케줄링 계약이며 OS 파일 접근 샌드박스는 아니다. 작업자는 예약 밖의 파일을 직접 수정해서는 안 된다.

검증 완료된 태스크는 예약을 해제한다. 실패·중단은 자동 해제하지 않으며 관리 에이전트가 native 작업자 종료를 확인한 후 `task_release_scope`를 호출한다. 재시작이나 시간 경과로 예약을 해제하지 않는다. 각 태스크의 수락 조건과 최종 통합 검증이 통과해야 전체 완료를 보고한다. 호스트의 `progress.workers`에 실제 실행 중인 하위 작업자들의 현재 작업을 함께 전달한다.

실제 병렬 실행 검증: `npm run evaluate:host -- --model openai/gpt-5.6-terra --parallel`. 임시 프로젝트의 두 파일과 그래프 완료를 확인하고, native 작업자 두 호출의 실행 시간이 겹쳤는지도 검사한다.
