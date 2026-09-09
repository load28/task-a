# 구현 현황

상태: 진행 중. 두 원문 전체의 수용 조건 T01–T15가 모두 충족된 상태는 아니다. 원문 4,997행·158개 요구 단위·191개 의미 계약을 보존하며, 구현된 실행 경로와 아직 증명하지 못한 조건을 구분한다.

## 기본 실행 경로에 연결한 구현

기본 `HostService`는 모델 manager 대신 `ControlServer`와 `RequestController`를 사용한다. 요청 식별자로 내구 이벤트를 기록하고, 등록된 역할·정책·예산 안에서 계획 인지 허가를 발급한다. 구조화된 계획과 원래 요청은 실제 등록 검증기의 표준 입력으로 전달된다. 검증 전에는 실행 계획을 승인할 수 없다. 검증된 leaf에는 실행 전에 여섯 차원의 기대치와 관측 검증기를 고정한다. task 선택·허가 발급·결과 채택·완료 판단은 컨트롤러가 수행한다.

기본 Graph MCP와 CLI MCP surface는 cognitive 전용이다. 모델에는 고정 context와 범위가 정해진 파일 도구를 노출하며 raw task/plan/Pod 조작을 제공하지 않는다. 운영·이관용 controller surface는 명시적으로 선택할 수 있다. 제어 대상 task의 raw start, 미계측 결과 제출, 사유 문자열만으로 reopen, 검증되지 않은 전체 plan revision은 engine에서도 차단한다. 운영 중인 기존 task 전체를 이관한 것은 아니다.

`GrantDispatcher`는 이미 발급된 허가만 내구 큐로 전달한다. 외부 실행 전에 전달 의도를 저장하며 재시작·수신 불명 상태에서 모델 요청을 재전송하지 않는다. 세션 생성 전 Pod가 만들어진 경우도 종료 관찰 대상이다. 실제 종료가 확인되지 않으면 stopping 상태와 scope 예약을 유지한다. 프로세스 여러 개의 leader election은 별도 미구현 사항이다.

`ControlRuntime`은 원래 graph 트랜잭션의 커밋 전에 outbox·typed dependency·readiness를 투영한다. 직접 task/dependency 변경도 trigger로 포착한다. task·parent·integration 완료 판정은 필수 의무, 현재 attempt, 입력 vector, 기대치, 실제 관측, evidence 만료를 함께 검사한다. 기대치를 관측 실패에 맞춰 사후 변경하는 것으로 완료할 수 없다. projection의 legacy 입력은 관찰 완전성을 증명하지 않으므로 completeness=unknown을 유지한다.

## 의미 검증과 실제 복구

등록된 검증기는 명시적인 작업 수·시간·출력 예산 안에서 실제 프로세스로 실행된다. 단순 exit 0 외에 semantic-state 계약을 검사하고, 여러 관찰의 합의와 critical 위반을 집계한다. 실제 관측으로 prediction error·hysteresis를 계산하며, acceptance criterion과 필수 의무까지 충족해야 verified로 전이한다. 과거 attempt의 실패는 이력으로 남고 새 attempt에 필수 검증을 다시 고정한다.

실제 의미 실패는 필요 조건이 맞는 specialist만 활성화한다. 모르는 feature를 0이나 임의의 위험 점수로 채우지 않는다. hard/soft trigger·cooldown·quota·context 예산·실행 예산을 검사한다. specialist의 출력도 별도 등록 검증기를 통과해야 근거로 사용한다. QA 호출 성공만으로 원래 실패 의무가 사라지지 않는다. 필수 specialist 요구는 내구 상태로 기록해 미해결 동안 완료와 국소 재실행을 차단한다. 계정 예산 상태가 바뀌면 deferred된 허가를 현재 입력·증거·quota·cooldown으로 다시 심사한다. 이미 실행한 모델 요청을 재전송하지 않는다. cooldown 대기는 종료 시각을 DB에 저장한다. 재시작 후에도 종료 이벤트를 한 번만 기록하고 현재 입력·증거·quota·cooldown을 재평가한 새 결정을 통해서만 허가를 발급한다. 대기 중 입력이 변경되면 기존 근거로 실행하지 않는다. quota 소진은 필수 의무를 대기로 유지하며 정책 변경을 자동 승인하지 않는다.

`LocalRepairs`는 실제 현재 관측에서 확인된 leaf 실패에만 반응한다. 명시된 복구 횟수 안에서 원래 목표·기대치·쓰기 범위를 유지한 새 허가를 발급한다. 이전 실행이 미확정이거나 검토 역할이 실행 중이면 재시도하지 않는다. 동일 실패 attempt의 중복 처리를 막고, 복구 결과도 새 attempt의 실제 검증을 통과해야 한다.

`RegionalRepairs`는 국소 복구 소진의 실패 증거 또는 명시적인 사용자 방향 수정에서 시작한다. 변경 원인·원래 목표·기대치·입력 버전·graph hash·generation을 lease에 고정한다. 모델은 scoped patch만 제안하며, controller가 보존 노드와 변경 노드를 조립한다. 실제 계획·patch·기대치·기존 제약은 독립 검증기에 전달된다. 검증된 임시 stage만 revision으로 커밋하고, 종료 대기 이후 실제 활성화 시에도 증거 만료와 입력 변경을 다시 검사한다. 대체 task는 새 허가 전에 검증된 기대치를 고정한다.

현재 자동 region 선택은 read/process completeness가 입증되지 않아 보수적인 포함 영역을 사용하고 minimumProven=false를 기록한다. 전체 프로그램의 최소 영역이나 현행 후보 집합의 비용 최적성을 입증했다고 표시하지 않는다. 후보 생성·정규화된 비용·feasibility·branch-and-bound와 실제 경계 보존 증거를 이용하는 최적 영역 선택은 아직 전체 연결이 필요하다. 오류가 높다는 이유만으로 이를 최소 국소 재계획으로 포장하지 않는다.

방향 수정은 원래 목표·기존 plan·이미 제출된 변경을 보존하고 새 사용자 evidence를 추가한다. 기존 요청을 중단한 뒤 같은 계획의 scoped replanner에 전달한다. 최초 계획 전 수정도 원래 목표와 변경 지시를 함께 전달한다. 최초 계획과 regional replanner의 질문은 아래 내구 reply 경로로 처리한다. 실행 중 worker 질문과 권한 변경의 대기·재개 상태 머신은 아직 별도 연결이 필요하다.

## 최초 계획과 재계획의 사용자 질문과 재개

`RequestQuestions`는 명시적인 `{kind:"user",question}` 출력만 질문으로 받는다. 등록 프로그램의 `maxClarifications`가 허용한 횟수 안에서 최대 세 질문을 내구 상태로 기록한다. 정책이 없거나 소진되면 미해결 상태를 유지한다. `requiresEscalation` 출력과 비구조 질문을 사용자 승인으로 바꾸지 않는다. 기본 `ControlServer.inspect/reply`에 질문 표시와 응답 채택을 연결했다.

질문은 요청·세션·완료된 planning grant·입력 snapshot에 고정한다. 답변은 별도 user evidence와 outbox event로 기록한다. 같은 응답 재전달은 멱등 처리하고 다른 내용의 중복 응답은 거절한다. 취소·다른 세션·변경된 입력·permission reply로는 재개하지 않는다. 예산 부족 시 답변을 지우지 않고 `resuming` 상태로 보존한다. 재시작 후 예산을 확보하면 입력을 다시 확인한 뒤 새 generation의 bounded planning grant를 발급한다. 이전 invocation의 재전송은 없다.

원래 목표, 질문 전 전체 구조화 출력, 질문·답변과 근거를 새 context에 보존한다. 필수 context가 상한을 넘으면 잘라내지 않고 대기한다. 답변이 기존 역할·도구·쓰기 범위를 늘리지 않는다. 새 제안은 원래 목표와 답변 evidence를 함께 전달받은 실제 계획 validator를 거쳐야 실행된다. 방향 수정과 후속 regional metadata에도 답변 이력을 유지한다. 이 경로는 명세 4절의 사용자 evidence/event, 8절의 제한된 활성화, 12절의 structured output 계약에 해당한다. 최초 계획의 정보 확인을 권한 변경이나 worker 재실행의 일반 해법으로 취급하지 않는다.

재계획 질문은 `request_questions.target`으로 해당 repair에 고정하며 최초 planner grant와 혼동하지 않는다. 답변 전과 새 허가 발급 전에 원래 lease의 base revision·활성 revision·generation·graph hash·입력 vector·context hash·evidence 유효기간을 확인한다. 기존 boundary·preserved nodes·immutable decisions·invariant와 실패 근거를 유지한다. 새 grant의 기한은 기존 lease를 넘지 않는다. 질문에 답했다는 이유로 lease를 갱신하거나 repair 횟수 제한을 초기화하지 않는다. 질문 횟수는 최초 계획과 재계획에서 요청 단위로 공유한다.

재계획 답변과 질문 전 구조화 출력은 새 context 및 scoped validator metadata에 전달한다. 실제 독립 검증→revision commit→새 기대치 고정→대체 worker→실제 의미 검증의 기존 경로를 그대로 통과해야 완료된다. 질문 및 예산 대기 중 재시작을 복구하며, 그 사이 입력·generation이 바뀌거나 lease가 만료되면 재개를 거절한다. 이는 명세 7.2절의 stale lease 차단과 7.4절의 scoped replanner 계약을 유지하는 질문 처리다.

## Native와 Pod의 공통 허가 계약

`GrantedOpenCodeExecutor`와 plugin은 실제 모델·도구 호출 전에 세션의 live grant를 검사한다. 입력·출력·도구 횟수·시간 상한과 실제 usage receipt를 적용한다. 성공 결과와 task 결과·scope 반환을 같은 트랜잭션으로 채택하며 늦은 결과를 거절한다. cognitive gateway의 파일 쓰기는 해시 CAS, fsync한 임시 파일, 원자 rename, 디렉터리 fsync 및 내구 영수증을 사용한다.

Kubernetes 설정에서는 `GrantedPodExecutor`를 사용하며 native로 대체 실행하지 않는다. TaskInstance/CRD/worker/checkpoint/stage cache를 activation grant·generation·기한에 묶었다. 모델 Pod는 단일 고정 SDK 어댑터만 실행한다. 기존 무제한 `opencode run` model stage는 제거했다. Pod별 capability는 한 허가만 claim하며 모델은 결과 봉인 이후 도구를 실행하거나 task 검증 결과를 스스로 채택할 수 없다.

모델 Pod 종료와 출력 snapshot을 관찰한 뒤 별도 검증 Pod를 만든다. 검증 Pod에는 모델 인증·authority capability·서비스 계정 토큰이 없다. 결과 PVC의 workspace 하위 경로만 읽기 전용으로 제공한다. 읽기 전용 root filesystem, 모든 capability 제거, no-new-privileges와 Linux seccomp launcher를 적용한다. launcher는 자식 프로세스에도 네트워크 socket과 io_uring 차단을 유지한다. controller는 Pod UID·실제 image ID·snapshot·명령/input tuple·시간/출력 상한을 대조한 영수증만 채택한다. unacknowledged Pod 생성도 내구 의도와 실제 리소스를 대조해 종료한다.

native 검증은 macOS seatbelt 안에서 실행한다. 작업 공간과 명시된 런타임은 읽기 전용이며, 쓰기는 작업별 임시 공간으로 제한한다. 환경을 상속하지 않고 네트워크·IPC·process fork를 금지한다. 별도 세션의 자식 프로세스가 host timeout을 벗어나지 못하도록 단일 프로세스만 허용하며, 다중 프로세스 검증은 격리 Pod에서 수행한다. 시간 초과 시 실제 프로세스를 종료하고 임시 공간을 정리한다. 지원하지 않는 native OS에서는 격리 없이 실행하지 않고 실패를 기록한다. 이 접근 통제는 모든 파일/환경 읽기의 dependency completeness 증명을 대신하지 않는다. 현재 실제 host 설정·인증은 변경하지 않았고 서비스 재시작이나 기존 실행의 운영 배포는 하지 않았다. controller program·validation budget·Pod authority 설정이 없으면 자동 호출을 차단한다.

## 검증 근거

- `npm run check`: TypeScript 검사와 전체 256개 테스트 통과, 실패·skip 0. 초기 요청→실제 plan validator→허가된 worker→실제 파일 관찰→완료, QA 조건부 활성화, 국소 복구, 검증된 재계획→대체 실행, 방향 수정의 목표 보존을 포함한다. 모델 부분은 합성 executor를 사용한다.
- `scripts/smoke-granted-validation.ts`: 실제 로컬 `kind-task-agent-local`에서 별도 namespace/PVC/Pod를 생성해 검증했다. 읽기 전용 결과·인증 제외·상속되는 네트워크 차단·같은 image ID·snapshot 유지·실제 semantic receipt를 확인했다. 봉인된 합성 모델 결과와 실제 Pod 검증 영수증을 합쳐 controller의 verified 전이까지 통과했다. 외부 모델 호출 0회이며 임시 namespace 정리도 확인했다. 결과는 `kubernetes-grant-validation.json`에 보존한다.
- `test/request-controller.test.ts`의 재계획 수용 테스트 7개: 기존 복구 경로와 질문 응답 후 실제 scoped validator→revision→대체 실행→완료, 질문/예산 대기 중 재시작, 입력 변경, lease 만료, generation 교체 거절을 확인했다. 새 grant의 lease 기한 상한과 동일 repair/lease 보존도 확인했다.
- `test/request-controller.test.ts`의 최초 계획 질문 수용 테스트 9개: 실제 답변→새 grant→계획 validator→worker→파일 검증→완료, 질문/예산 대기 중 재시작, 중복 응답, 입력 변경, 취소, quota, 비구조 질문, escalation 및 권한 확장 거절을 확인했다. 모델 단계는 합성 executor이며 validator는 실제 격리 프로세스다.
- `test/request-controller.test.ts`의 cooldown 수용 테스트: 종료 전 호출 0, 재시작 후 종료 이벤트 1회, 새 결정에 따른 허가 발급, 반복 tick 중복 방지, quota 소진 유지, 변경된 입력의 오래된 근거 거절을 확인했다. 구현 명세 4절의 durable timer와 8절의 호출 한도에 대응한다.
- `test/native-validator-isolation.test.ts`: 실제 macOS 제한 프로필에서 작업 공간 외부의 합성 인증 파일 읽기, 작업 공간 수정, TCP 연결, 분리된 자식 프로세스 실행을 거절했다. 허용된 source 읽기·임시 파일 쓰기, 시간 초과 SIGKILL과 임시 공간 정리도 확인했다.
- 실제 Docker/Linux에서도 읽기 전용 결과 검증과 네트워크 syscall EPERM, 자식 프로세스 실행을 확인했다. CRD는 실제 로컬 API의 server-side dry run을 통과했다. 검증 중 발견한 Kubernetes label 63자 제한 위반을 수정했다.
- `build-traceability.py`: 원문 4,997행, 의미 계약 191개, 필드 131개, 열거값 42개, 수식 168개를 검사했다. 누락·중복 행과 미매핑 필드는 0이다. 줄 대응 검사는 의미적 구현 완성이나 성능 증명이 아니다.

이전 사용자 승인에 따른 실제 모델 합성 호출은 한 번만 실행했다. plugin과 출력 상한 전달은 확인했으나 provider가 HTTP 400 `Unsupported parameter: max_output_tokens`를 반환했다. 사용자는 현재 인증을 유지하고 성공 검증을 미완료로 남기기로 선택했다. 추가 모델 요청·상한 제거·인증 변경은 하지 않았다. 기록은 `native-grant-validation.json`에 유지한다.

## 남은 전체 수용 조건

1. 실제 코드·파일·도구·환경 관찰을 포트별 의존성 및 완전성 증거에 연결하고 legacy 전체 snapshot/스캔을 대체해야 한다. 실제 boundary 보존 및 모든 변경의 7차원 통합 검증 의무도 자동 생성해야 한다.
2. finite region 후보의 실제 feasibility·비용·최적성 gap·switching cost를 적용해야 한다. 독립 region의 병렬 복구, 더 새로운 변화의 episode 병합·lease 교체, immutable decision/assumption의 증거 기반 자동 무효화도 전체 연결이 필요하다.
3. 모든 13개 정책 target의 실행 적용, 실제 outcome attribution·holdout/shadow replay·회귀 rollback, 적응형 L0–L5 선택, memory/routine의 실제 graph mutation과 역할 lifecycle 학습은 아직 전체 실행 루프에 연결되지 않았다.
4. 기존 운영 데이터/worker의 전면 이관, worker 질문 및 권한 reply 재개, quota 증액의 정책 변경 경로, 다른 native OS의 격리 지원, T01–T15 전체 수용 시나리오가 남아 있다. 성공한 실제 provider 호출은 사용자가 유지하기로 한 예외다.

`implementation-status.json`의 endToEndVerified는 위 전체 수용 조건을 기준으로 유지한다. 단위 함수나 새 경로 일부의 테스트 통과만으로 원문 요구 전체를 완료 처리하지 않는다.
