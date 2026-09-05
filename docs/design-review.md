# 설계 점검 기록

## 판정

Domain과 Engine은 OpenCode에 의존하지 않고, MCP·HTTP는 동일한 Task Agent 계약에 연결된다. 현재는 SQLite 단일 서비스 구현이다. 실제 OpenCode 모델로 가상 작업 생성 → 제안 제외 → 확정 상태 저장 → 완료 반영 → 별도 Host 서비스의 Handoff 조회를 검증했다. 이 제한된 시나리오의 통과가 모든 자연어 판단이나 실제 다중 제품 연결을 보장하지는 않는다.

## 수정한 결함

- 쓰기 전 상태 읽기와 Snapshot 계산이 트랜잭션 밖에 있었다. Engine의 읽기·검증·투영·쓰기 전체를 BEGIN IMMEDIATE로 감싸고 중첩 작업은 savepoint로 처리한다.
- sync 중간 오류 시 앞선 이벤트가 남았다. 이벤트·Artifact·Snapshot·재시도 결과를 하나의 트랜잭션으로 처리한다.
- 재시도마다 모델을 다시 호출해 표현이 바뀌면 중복 기록됐다. 입력 지문과 최초 응답을 영속 저장하고 빈 결과도 재사용한다. 서로 다른 입력의 같은 키 재사용은 거부한다.
- Host가 events를 직접 전달해 Task Agent 판단을 우회했다. 외부 sync에서 이를 거부한다.
- Task 선택 실패나 다중 검색 결과를 임의로 확정했다. 의미 선택 실패 또는 Agent 없는 다중 후보는 명시적 taskId를 요구한다.
- 생성 이벤트에 목표·상태가 없고 Artifact 이벤트에는 참조 ID만 있었다. 새 이벤트에 재투영에 필요한 payload를 기록한다.
- 시계 순으로 이벤트를 재정렬했다. SQLite 삽입 순서로 읽어 시스템 시계 변화에 영향을 받지 않게 한다.
- parent 관계와 Task.parentTaskId가 달라지고 순환도 가능했다. 두 표현을 함께 갱신하고 단일 부모·순환 금지·중복 관계의 기존 ID 반환을 적용한다. 새 관계도 이벤트로 남긴다.
- context가 Snapshot을 사용해도 전체 History를 로드했다. 현재 상태 전용 읽기를 추가한다. implementation과 handoff에도 Finding을 제공한다.
- OpenCode가 작업 디렉터리와 PATH에 의존했다. 서비스 루트와 설치된 CLI manifest를 기준으로 직접 실행하며 DB·Node 경로를 자식 프로세스에 전달한다.
- 권한 wildcard가 실제 Task Tool 이름과 맞지 않았다. 기본 deny와 명시적인 8개 Tool 허용으로 변경한다.
- 추출·선택 과정에서 쓰기 Tool도 실행할 수 있었다. 해당 세션의 권한과 Tool 설정에서 쓰기를 차단한다.
- System Prompt가 일반 사용자 텍스트에 섞여 있었다. SDK system 필드를 사용하고 대화·History는 비신뢰 근거로 명시한다.
- SDK 오류가 가려지고 실행 세션이 바로 삭제됐다. SDK 오류를 전파하고 세션을 감사용으로 보존한다. 요청 시간 초과 시 세션 중단을 요청한다.
- MCP 초기화·잘못된 요청·알 수 없는 Tool 처리와 EOF 종료가 불완전했다. 초기화 상태를 검사하고 protocol 오류와 Tool 오류를 구분하며 EOF에서 종료한다.
- 인증 없이 HTTP를 외부에 바인딩할 수 있었다. loopback 이외의 주소에는 Token을 요구한다. 내부 OpenCode HTTP에도 인스턴스별 인증을 적용한다.

## 검증 근거

- TypeScript 검사 및 자동 테스트 28개.
- 서로 다른 Node 프로세스 4개가 각 20개 결정을 동일 SQLite에 추가하고, 이벤트 81개와 유효 결정 80개 및 Snapshot 재투영 일치를 확인한다.
- 잘못된 sync 전체 롤백, 재시작 후 응답 재사용, 빈 결과 중복 방지, 잘못된 Task 선택, 계층 순환, History 없는 Context 읽기, OpenCode 읽기 권한, MCP 오류 경계를 회귀 테스트한다.
- scripts/smoke-harness.ts를 서비스 밖의 /tmp에서 실행하여 인증 연결과 8개 실제 Tool 등록을 확인했다. 이 검사는 모델을 호출하지 않는다.
- 2026-09-05 실제 모델 평가에서 Task Tool을 통한 생성은 성공했으나 최초 sync가 StructuredOutputError로 실패했다. StructuredOutput Tool을 명시적으로 활성화하고 빈 결과도 해당 Tool로 반환하도록 지시한 후 scripts/evaluate-agent.ts의 네 단계가 연속 두 번 통과했다. SDK의 구조화 출력 계약은 [공식 문서](https://opencode.ai/docs/sdk/)를 참조한다.
- 실제 모델 평가는 사용자의 전송 승인 후 가상 대화와 격리된 임시 SQLite만 사용했다. 기존 Task DB와 실제 사용자 대화는 평가 입력에 포함하지 않았다.

## Agent 신뢰성 보완

- constraint_removed와 next_action_completed는 활성 이벤트 ID만 해제한다. 이력은 유지하고 현재 Context에서 제외한다. 미완료 Next Action은 개수 제한으로 누락하지 않는다.
- 추출 이벤트마다 실제 대화의 정확한 인용을 요구하고 저장 전에 검증한다. 일반 이벤트와 Artifact 이벤트에 인용 및 Harness Session ID를 보존한다. 인용 존재 검증은 의미적 정확성이나 보고된 테스트 결과의 실제 실행을 보장하지 않는다.
- 모델 추론 중 Task가 바뀌면 원자적 저장 단계에서 감지하고 최신 상태로 다시 추출한다. 최대 세 번 시도 후에도 경합하면 아무 추출 결과도 저장하지 않고 오류를 반환한다.
- 오래된 활성 Constraint와 Next Action의 ID도 추출 입력에 유지한다. 활성 상태 해제, 근거 없는 추출 거부, 재시도 상한과 Artifact 근거 보존을 회귀 테스트한다.

## 원래 설계와 남은 차이

- 원격 MCP의 공식 SDK 연결, JWT 서명·issuer·audience·만료·본인 sub·허용 client 검증, 읽기/쓰기 scope, 소유자 DB 바인딩을 구현했다. 가상 키로 실제 SDK HTTP 연결을 로컬과 Linux amd64 컨테이너에서 검증했다. AWS CloudFormation 두 템플릿은 cfn-lint를 통과했다. AWS 로그인 실패로 리소스 생성과 실제 Cognito·ChatGPT·Claude Code 로그인 검증은 아직 수행하지 않았다.
- 가상 Host의 자연어 작업 흐름은 [Host 연동 기록](host-integration.md)에 별도로 남겼다. Docker 빌드 및 컨테이너 내부 OpenCode 시작·Tool 등록, SQLite 백업·복구는 확인했다.

- sync는 OpenCode가 이벤트를 추출하고 Core가 원자적으로 저장한다. 원래 설계의 “OpenCode가 Tool Loop에서 직접 sync 이벤트를 기록”하는 흐름은 아직 구현하지 않았다. run에서 실제 Task Tool 호출을 사용한다.
- Context Compiler는 목적별 결정적 필드 선택이다. 의미 기반 관련성 선정과 명시적 토큰 예산은 아직 없다.
- 이번 수정 이전에 생성된 이벤트는 원래 목표나 Artifact payload가 없을 수 있다. 새 이벤트의 정보는 보완했지만 과거 기록을 추측해 채우지 않았다. 전체 Task·Relation·Artifact 재구축 명령은 아직 없다.
- PostgreSQL, A2A, 분산 Worker Pool, 실제 다중 Host 연결 검증은 미래 확장 범위다.
