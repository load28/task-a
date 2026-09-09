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

현재 region 선택은 read/process completeness가 입증되지 않아 보수적인 포함 영역을 요구한다. `replanner.selection`이 등록되면 finite connected union 후보를 생성하고 실제 등록 검증기가 feasibility와 planning/reasoning/context/reexecution/integration/expectedFailure 여섯 비용을 공통 단위로 평가한다. 평가 이전에는 replanner를 호출하지 않는다. 입력 변경, 실패·비구조 평가, 비용 단위 불일치, unknown feasibility는 안전한 최소성 주장으로 바꾸지 않는다. 하한 탐색은 평가 한도·후보 누락·unknown을 gap에 남긴다. `minimumProven`은 등록된 finite domain과 보수적 closure 제약 안의 평가 비용에만 해당하며, 프로그램 전체의 최소 영역이나 실제 미래 비용의 최적성을 의미하지 않는다. 선택 정책이 없으면 기존 보수적 경로를 유지하고 minimumProven=false로 기록한다. 실제 완전한 boundary proof를 이용한 범위 축소, switching cost에 따른 keep/switch, 독립 영역 병렬 복구는 남아 있다.

방향 수정은 원래 목표·기존 plan·이미 제출된 변경을 보존하고 새 사용자 evidence를 추가한다. 기존 요청을 중단한 뒤 같은 계획의 scoped replanner에 전달한다. 최초 계획 전 수정도 원래 목표와 변경 지시를 함께 전달한다. 최초 계획·regional replanner·leaf worker의 질문은 아래 내구 reply 경로로 처리한다. specialist 질문은 동일한 필수 검토 의무를 유지하는 내구 재개 경로로 연결했다. 권한 변경의 정책 전이는 별도 연결이 필요하다.

## 관찰된 파일 의존성과 통합 검증

native gateway의 실제 UTF-8 읽기는 workspace·path별 불변 파일 버전, read call, 소비 grant와 evidence vector에 고정한다. 채택된 AgentCompleted에서만 관찰된 파일 포트→task 입력 edge를 투영한다. 같은 call의 재전달은 기존 읽기 결과를 유지하며 다른 내용의 보고는 충돌로 거절한다. 새 파일 버전을 관찰하면 현재 attempt가 이전 버전을 소비한 task와 관련 memory view를 무효화한다. native 결과 채택 전에는 실제 읽은 파일을 다시 확인하며, 성공한 자기 쓰기와 외부 변경을 구분한다. 이 검사 역시 검사 시점 이후의 원자적 전체 파일 시스템 보존을 증명하지 않는다.

Pod gateway는 read-prepared journal을 보존한 뒤 controller에 읽은 해시를 보고한다. controller는 live grant·봉인 상태·read scope·실제로 허가한 call과 args hash를 대조한다. Pod clone은 source lineage가 완전히 증명되기 전까지 별도 입력 namespace로 둔다. 두 adapter의 관찰은 `completeness=observed`이며 모든 파일·도구·환경·시간·외부 입력의 완전성 증명을 대신하지 않는다. 임의의 외부 파일 변경 watcher나 모든 변경의 자동 복구까지 구현한 것은 아니다.

`integrationValidators`에 일곱 차원의 검증기를 등록한 program은 최초 계획과 regional replacement에서 leaf membership의 검증 경계를 자동 등록한다. 현재 attempt의 실제 semantic observations가 모이면 behavior/interface/data/temporal/error-propagation/resource-contention/semantic 의무를 각각 생성한다. 정확한 boundary version·observation tuple에 고정하며 하나라도 실패하면 요청 완료를 막는다. 새 경계 버전의 의무가 이전 실패 이력을 명시적으로 대체하며 기록은 삭제하지 않는다. 통합 정책이 없는 기존 프로그램에 임의의 검증 명령을 주입하지 않는다. 성공 receipt가 있어도 의무의 입력 근거가 만료되면 satisfied로 재사용하지 않는다.

## 실제 결과의 학습 입력 기록

`OutcomeRecorder`는 RequestCompleted에서 해당 요청 소유의 grant/role/policy/profile·승인된 사용량·출력 해시·완료 근거를 불변 outcome_labels에 저장한다. 알려진 input/output tokens·tool calls·elapsed work를 합산하고 누락 사용량이 있으면 complete=false로 남긴다. 병렬 작업 시간 합계를 wall-clock latency로 표시하지 않는다. 테스트 provider의 결과는 synthetic으로 구분한다. 유용한 활성화·필요한 활성화·놓친 실패는 아직 counterfactual/holdout 관측이 없으므로 null이다. 이 기록만으로 학습 정책을 활성화하거나 품질 향상을 증명하지 않는다.

`PolicyReplay`는 실제 specialist router의 activate/skip/defer 판단 시 신호·역할/정책 버전·호출 횟수·cooldown·eligibility·task snapshot·당시 인과 그래프·근거를 불변 frame으로 보존한다. 후보 등록 시 outbox cutoff와 episode 단위 training/holdout 분할을 고정한다. 과거 frame은 historical, 이후 frame은 shadow로 재현하며 재시작·재전달에 동일한 판단과 분할을 유지한다. 현재 실행 의미가 정의된 대상은 activation의 additional-trigger 후보다. 기존 hard trigger·quota·cooldown·eligibility를 약화하지 않으며 다른 target을 지원한다고 가장하지 않는다. 관측하지 않은 relation/scope는 false가 아니라 unknown이다.

shadow 보고서는 원래 decision의 실제 grant·context·profile·usage·요청 완료 근거를 연결한다. 후보가 추가 활성화를 예측하더라도 실제 허가·context·policy head를 변경하거나 도구를 실행하지 않는다. 후보 비용·유용성·실패 예방 효과는 null이며 promotionEligible=false다. 실제 specialist 실패→shadow 비교→원래 QA 허가→사용량 기록 연결을 검증했다. 이 비교는 후보가 실패를 예방했을 것이라는 증거가 아니다. 정책 평가 lifecycle은 proposal 버전별로 분리하고 shadow에서 고정한 평가 기준·episode partition을 중간에 바꾸지 못하게 했다. 기존 집계 평가 수치를 실제 paired outcome에서 산출하는 승격 경로는 아직 남아 있다.

`PolicyRegression`은 controller가 현재 정책·그 정책에 고정된 rollback 버전·회귀 조건 근거·실제 등록 검증기·최대 sample 수를 지정한 경우 동작한다. 등록 이후 해당 정책을 사용한 accepted grant 결과만 검증 의무로 만든다. synthetic과 observed 표본은 설정에서 구분하며 observed 감시는 test provider 결과를 채택하지 않는다. 실제 검증기의 완전한 typed verdict가 regressed=true인 경우에만 이전 immutable policy로 head를 이동하고 event를 기록한다. 미등록 감시나 후보의 예상 판단만으로 rollback하지 않는다.

정책 head의 변경 횟수는 DB trigger로 보존한다. 검증 대기 중 다른 정책으로 이동했거나 원래 버전으로 돌아온 경우에도 오래된 rollback을 거절한다. 진행 중 grant의 정책·context·상태는 변경하지 않는다. sample 한도 소진과 superseded 상태는 명시적인 종료 event로 기록한다. 명령 실패·실행 오류·비구조 응답·출력 잘림은 unknown이며 회귀 증명이 아니다. 실행 오류 event에는 실패한 job과 obligation을 남겨 대기 sample을 종료한다. 이 경로는 등록된 조건의 회귀에 대한 자동 head 복구이며 모든 13개 target의 실행 적용이나 통계적 품질 평가를 완성한 것은 아니다.



## 계획·재계획·worker의 사용자 질문과 재개

`RequestQuestions`는 명시적인 `{kind:"user",question}` 출력만 질문으로 받는다. 등록 프로그램의 `maxClarifications`가 허용한 횟수 안에서 최대 세 질문을 내구 상태로 기록한다. 정책이 없거나 소진되면 미해결 상태를 유지한다. `requiresEscalation` 출력과 비구조 질문을 사용자 승인으로 바꾸지 않는다. 기본 `ControlServer.inspect/reply`에 질문 표시와 응답 채택을 연결했다.

질문은 요청·세션·완료된 planning grant·입력 snapshot에 고정한다. 답변은 별도 user evidence와 outbox event로 기록한다. 같은 응답 재전달은 멱등 처리하고 다른 내용의 중복 응답은 거절한다. 취소·다른 세션·변경된 입력·permission reply로는 재개하지 않는다. 예산 부족 시 답변을 지우지 않고 `resuming` 상태로 보존한다. 재시작 후 예산을 확보하면 입력을 다시 확인한 뒤 새 generation의 bounded planning grant를 발급한다. 이전 invocation의 재전송은 없다.

원래 목표, 질문 전 전체 구조화 출력, 질문·답변과 근거를 새 context에 보존한다. 필수 context가 상한을 넘으면 잘라내지 않고 대기한다. 답변이 기존 역할·도구·쓰기 범위를 늘리지 않는다. 새 제안은 원래 목표와 답변 evidence를 함께 전달받은 실제 계획 validator를 거쳐야 실행된다. 방향 수정과 후속 regional metadata에도 답변 이력을 유지한다. 이 경로는 명세 4절의 사용자 evidence/event, 8절의 제한된 활성화, 12절의 structured output 계약에 해당한다. 최초 계획의 정보 확인을 권한 변경이나 worker 재실행의 일반 해법으로 취급하지 않는다.

재계획 질문은 `request_questions.target`으로 해당 repair에 고정하며 최초 planner grant와 혼동하지 않는다. 답변 전과 새 허가 발급 전에 원래 lease의 base revision·활성 revision·generation·graph hash·입력 vector·context hash·evidence 유효기간을 확인한다. 기존 boundary·preserved nodes·immutable decisions·invariant와 실패 근거를 유지한다. 새 grant의 기한은 기존 lease를 넘지 않는다. 질문에 답했다는 이유로 lease를 갱신하거나 repair 횟수 제한을 초기화하지 않는다. 질문 횟수는 최초 계획·재계획·worker·specialist에서 요청 단위로 공유한다.

재계획 답변과 질문 전 구조화 출력은 새 context 및 scoped validator metadata에 전달한다. 실제 독립 검증→revision commit→새 기대치 고정→대체 worker→실제 의미 검증의 기존 경로를 그대로 통과해야 완료된다. 질문 및 예산 대기 중 재시작을 복구하며, 그 사이 입력·generation이 바뀌거나 lease가 만료되면 재개를 거절한다. 이는 명세 7.2절의 stale lease 차단과 7.4절의 scoped replanner 계약을 유지하는 질문 처리다.

`WorkerQuestions`는 질문을 task·완료된 worker grant·현재 attempt·기대치 버전에 고정한다. 실제 semantic validator가 통과해도 현재 worker 출력에 미해결 질문이나 escalation이 있으면 task·상위 통합 완료를 차단한다. 답변 후에는 원래 목표·검증된 기대치·쓰기 범위를 유지하고, 질문 및 user evidence로 명시적인 invalidation을 기록한 뒤 새 attempt를 위한 허가를 발급한다. 이것을 측정된 실패로 꾸미거나 local repair 횟수에 섞지 않는다. 새 worker도 독립 검증을 다시 통과해야 한다.

예산 부족 시 reopen·새 허가·재개 이력은 함께 rollback되고 답변은 내구 대기 상태로 남는다. 재시작 후에도 응답을 재전송하지 않으며, 취소·변경된 입력·기대치·만료 근거로는 재개하지 않는다. 다른 활성 역할이나 미확정 delivery가 있으면 재개를 기다린다. 완료한 이전 질문은 새 attempt를 영구 차단하지 않지만, 미해결 specialist 출력은 계속 대기로 남긴다.

## Native와 Pod의 공통 허가 계약

`GrantedOpenCodeExecutor`와 plugin은 실제 모델·도구 호출 전에 세션의 live grant를 검사한다. 입력·출력·도구 횟수·시간 상한과 실제 usage receipt를 적용한다. 성공 결과와 task 결과·scope 반환을 같은 트랜잭션으로 채택하며 늦은 결과를 거절한다. cognitive gateway의 파일 쓰기는 해시 CAS, fsync한 임시 파일, 원자 rename, 디렉터리 fsync 및 내구 영수증을 사용한다.

Kubernetes 설정에서는 `GrantedPodExecutor`를 사용하며 native로 대체 실행하지 않는다. TaskInstance/CRD/worker/checkpoint/stage cache를 activation grant·generation·기한에 묶었다. 모델 Pod는 단일 고정 SDK 어댑터만 실행한다. 기존 무제한 `opencode run` model stage는 제거했다. Pod별 capability는 한 허가만 claim하며 모델은 결과 봉인 이후 도구를 실행하거나 task 검증 결과를 스스로 채택할 수 없다.

모델 Pod 종료와 출력 snapshot을 관찰한 뒤 별도 검증 Pod를 만든다. 검증 Pod에는 모델 인증·authority capability·서비스 계정 토큰이 없다. 결과 PVC의 workspace 하위 경로만 읽기 전용으로 제공한다. 읽기 전용 root filesystem, 모든 capability 제거, no-new-privileges와 Linux seccomp launcher를 적용한다. launcher는 자식 프로세스에도 네트워크 socket과 io_uring 차단을 유지한다. controller는 Pod UID·실제 image ID·snapshot·명령/input tuple·시간/출력 상한을 대조한 영수증만 채택한다. unacknowledged Pod 생성도 내구 의도와 실제 리소스를 대조해 종료한다.

native 검증은 macOS seatbelt 안에서 실행한다. 작업 공간과 명시된 런타임은 읽기 전용이며, 쓰기는 작업별 임시 공간으로 제한한다. 환경을 상속하지 않고 네트워크·IPC·process fork를 금지한다. 별도 세션의 자식 프로세스가 host timeout을 벗어나지 못하도록 단일 프로세스만 허용하며, 다중 프로세스 검증은 격리 Pod에서 수행한다. 시간 초과 시 실제 프로세스를 종료하고 임시 공간을 정리한다. 지원하지 않는 native OS에서는 격리 없이 실행하지 않고 실패를 기록한다. 이 접근 통제는 모든 파일/환경 읽기의 dependency completeness 증명을 대신하지 않는다. 현재 실제 host 설정·인증은 변경하지 않았고 서비스 재시작이나 기존 실행의 운영 배포는 하지 않았다. controller program·validation budget·Pod authority 설정이 없으면 자동 호출을 차단한다.

## 검증 근거

- `npm run check`: TypeScript 검사와 전체 303개 테스트 통과, 실패·skip 0. 초기 요청→실제 plan validator→허가된 worker→실제 파일 관찰→완료, QA 조건부 활성화, 국소 복구, 검증된 재계획→대체 실행, 방향 수정의 목표 보존을 포함한다. 모델 부분은 합성 executor를 사용한다.
- `test/policy-regression.test.ts`: 실제 격리 검증기와 합성 grant 결과로 회귀 rollback, 회귀 미관측, malformed/명령 실패/실행 오류/출력 잘림의 unknown 처리, head 교체 및 원복 뒤 stale 차단, 재시작, synthetic 표본 제외의 10개 경로를 확인했다. 진행 중 허가 보존·sample 한도·중복 event 방지도 확인했다. 실제 모델 요청은 없다.
- 추가 통합 검증: 실제 native 파일 관찰·채택 전 freshness 검사·이전 소비 task 무효화, 인증된 Pod 읽기 보고, program의 실제 7차원 통합 검증, finite search의 40개 전수 oracle 비교, 실제 후보 validator→replanner 경로 및 unknown 차단, host 완료 결과의 비용 귀속·멱등성을 확인했다. 새 Pod 읽기 보고는 로컬 HTTP/gateway 테스트이며 기존 kind 영수증을 새 이미지 검증으로 재사용하지 않는다.
- `scripts/smoke-granted-validation.ts`: 실제 로컬 `kind-task-agent-local`에서 별도 namespace/PVC/Pod를 생성해 검증했다. 읽기 전용 결과·인증 제외·상속되는 네트워크 차단·같은 image ID·snapshot 유지·실제 semantic receipt를 확인했다. 봉인된 합성 모델 결과와 실제 Pod 검증 영수증을 합쳐 controller의 verified 전이까지 통과했다. 외부 모델 호출 0회이며 임시 namespace 정리도 확인했다. 결과는 `kubernetes-grant-validation.json`에 보존한다.
- `test/request-controller.test.ts`의 worker 질문 수용 테스트 5개: 질문이 있는 실제 의미 검증 pass의 완료 차단, 재시작·예산 대기 후 같은 기대치로 새 attempt 실행 및 재검증 완료, 변경된 입력·취소·quota 소진 거절을 확인했다. 재개 activation은 failure signal을 만들지 않는다.
- `test/request-controller.test.ts`의 재계획 수용 테스트 7개: 기존 복구 경로와 질문 응답 후 실제 scoped validator→revision→대체 실행→완료, 질문/예산 대기 중 재시작, 입력 변경, lease 만료, generation 교체 거절을 확인했다. 새 grant의 lease 기한 상한과 동일 repair/lease 보존도 확인했다.
- `test/request-controller.test.ts`의 최초 계획 질문 수용 테스트 9개: 실제 답변→새 grant→계획 validator→worker→파일 검증→완료, 질문/예산 대기 중 재시작, 중복 응답, 입력 변경, 취소, quota, 비구조 질문, escalation 및 권한 확장 거절을 확인했다. 모델 단계는 합성 executor이며 validator는 실제 격리 프로세스다.
- `test/request-controller.test.ts`의 cooldown 수용 테스트: 종료 전 호출 0, 재시작 후 종료 이벤트 1회, 새 결정에 따른 허가 발급, 반복 tick 중복 방지, quota 소진 유지, 변경된 입력의 오래된 근거 거절을 확인했다. 구현 명세 4절의 durable timer와 8절의 호출 한도에 대응한다.
- `test/native-validator-isolation.test.ts`: 실제 macOS 제한 프로필에서 작업 공간 외부의 합성 인증 파일 읽기, 작업 공간 수정, TCP 연결, 분리된 자식 프로세스 실행을 거절했다. 허용된 source 읽기·임시 파일 쓰기, 시간 초과 SIGKILL과 임시 공간 정리도 확인했다.
- 실제 Docker/Linux에서도 읽기 전용 결과 검증과 네트워크 syscall EPERM, 자식 프로세스 실행을 확인했다. CRD는 실제 로컬 API의 server-side dry run을 통과했다. 검증 중 발견한 Kubernetes label 63자 제한 위반을 수정했다.
- `build-traceability.py`: 원문 4,997행, 의미 계약 191개, 필드 131개, 열거값 42개, 수식 168개를 검사했다. 누락·중복 행과 미매핑 필드는 0이다. 줄 대응 검사는 의미적 구현 완성이나 성능 증명이 아니다.

이전 사용자 승인에 따른 실제 모델 합성 호출은 한 번만 실행했다. plugin과 출력 상한 전달은 확인했으나 provider가 HTTP 400 `Unsupported parameter: max_output_tokens`를 반환했다. 사용자는 현재 인증을 유지하고 성공 검증을 미완료로 남기기로 선택했다. 추가 모델 요청·상한 제거·인증 변경은 하지 않았다. 기록은 `native-grant-validation.json`에 유지한다.

## 입력·가정·기억·복구 연결 검증

`fileObservation`을 등록한 program은 host 관찰 시 이미 허가받아 읽은 native 파일만 파일 수·바이트 상한과 내구 cursor 안에서 다시 관찰한다. 실제 경로를 정규화하고 symlink·비정규 파일·초과 입력은 읽지 않는다. 삭제는 missing, 판단 불가는 unknown으로 기록한다. 새 모델 읽기 없이 실제 hash 변화가 기존 소비 task와 관련 인지 기록을 무효화하며, 실행 중 요청은 새로운 입력 근거를 기존 scoped 재계획에 전달한다. 모델 호출·재계획 횟수·전체 예산은 기존 제한을 그대로 따른다. 전체 파일 탐색이나 모든 process read의 완전성 증명으로 해석하지 않는다. 질문을 만들 때 읽은 파일의 새 관찰 버전이 다르면 이전 질문 답변을 stale 입력으로 거절한다.

`JointIntegrationFailed`는 실제 등록 검증기의 실패가 현행 경계·전체 관찰 tuple과 일치할 때만 생성한다. 동일 tuple 실패는 멱등으로 묶고 기존 scoped planner→실제 계획 validator→revision commit→대체 task→새 경계의 일곱 검증 경로로 복구한다. 기존 완료 게이트는 유지한다. 새로운 계획 승인 전 과거 통합 실패는 계속 미해결이며, 새 계획에서는 새로운 일곱 의무를 모두 통과해야 요청이 완료된다. 소멸한 경계나 이전 tuple의 실패는 새 원인으로 채택하지 않는다.

재계획 중 더 새로운 측정 원인이 도착하면 기존 repair를 superseded로 보존하고 그 generation의 grant·lease·stage를 fence한다. 새 허가에는 최신 유효 원인과 근거를 전달한다. 이전 실행의 응답 대기 중에도 dispatcher가 실제 종료 확인을 수행한다. 종료가 불명확하면 stopping 및 미확정 예산을 유지한다. 새 시도도 설정된 maxAttempts를 소비하며 횟수나 예산을 초기화하지 않는다. 이 경로는 동일 요청의 순차 episode 교체이며, 독립 region 병렬 복구와 동일하지 않다.

`AssumptionLedger`는 명제·소비 task·source/authorization·등록 검증기를 불변 버전으로 보존한다. 초기 unknown 가정은 완료 조건을 충족하지 않는다. 실제 독립 검증기의 valid/invalid/unknown 판정을 채택하며, 명령 실패·출력 잘림은 unknown이다. source나 실제 검증 receipt가 철회·만료되면 가정의 유효성이 사라진다. 실제 완료 게이트·관련 인지 기록·소비 task 무효화·invalidAssumptions를 가진 scoped 재계획에 이를 전달한다. 가정이 unknown이 된 것을 명제가 거짓으로 증명되었다고 표시하지 않는다.

EvidenceStore는 원문을 삭제하지 않는 철회와 indexed expiry event를 제공한다. CognitiveMemory는 evidence/assumption/policy 참조 역인덱스로 해당 기록만 무효화한다. 이전 event 이후 늦게 저장된 결과도 retired reference를 통해 재사용을 거절한다. 재시작과 중복 소비가 이력을 되살리지 않는다. 유용한 판단의 새로운 관측으로 세거나 counterfactual outcome label을 생성하지 않는다.

검증: 전체 303개 테스트와 타입 검사 통과. 실제 파일 편집·삭제·symlink·초과 입력, 외부 입력→host 관찰→재계획→실제 검증 완료, 통합 실패→검증된 새 revision→새 7차원 완료, 더 새로운 입력의 repair supersession, in-flight 실행 중지, 실제 가정 검증·철회·기억 무효화·재계획, 질문 입력 변경 거절을 포함한다. 모델 부분은 합성 executor이며 추가 실제 모델 호출은 없다.

## 결정·가정의 버전 바인딩과 질문 대기 중 변경

`DecisionLedger`는 근거·가정·소비 task·결론·등록 독립 검증기를 고정한다. 실제 검증 receipt가 validated이고 모든 가정도 유효해야 context와 완료 조건에서 사용한다. source/receipt 철회·만료 또는 가정 무효화는 해당 결정과 소비 task·인지 기록을 무효화한다. invalidDecisions를 lease에 고정하며 실제 scoped validator가 무효 결정을 제거한 대체 계획을 확인한다. 유효 결정은 재계획 입력·validator metadata·대체 task 바인딩에 보존한다.

유효 가정도 lease의 immutableAssumptions와 node의 assumptionRefs에 고정한다. 유효 가정 바인딩 삭제, 모든 결정/가정 소비자 제거, 무효 가정 유지 patch는 거절한다. 대체 task는 같은 가정의 필수 context와 완료 조건을 이어받고, 이후 근거 철회는 새 소비자도 무효화한다. lease 확인과 patch 채택 시 유효성을 재검사한다.

질문 대기·답변 후 예산 대기 중 실제 native 입력이나 가정/결정 유효성이 바뀌면 기존 질문을 superseded로 보존한다. 답변을 생성하거나 질문 quota를 초기화하지 않는다. 등록 replanner가 있는 요청만 기존 episode를 fence하고 새로운 실제 변경 근거로 재계획한다. 질문 전체 이력과 이미 받은 답변은 새 context 및 독립 validator metadata로 전달한다.

## 전문 검토의 질문 재개와 L5 실행

`SpecialistQuestions`는 전문 역할의 사용자 질문을 동일 request/session/task/input에 고정한다. 답변 이후 같은 role/profile/policy와 읽기 전용 범위의 새 grant를 발급한다. 반복 재개에서도 원래 mandatory demand는 새 응답 검증 전까지 미해결이다. 과거 응답 의무는 그 demand로 이어지는 실제 grant 계보가 있을 때만 대체되며 과거 실패 기록은 삭제하거나 성공 처리하지 않는다. quota·cooldown·예산·근거 유효성을 유지한다. 실제 검토 질문 두 번→새 응답의 독립 validator→원래 leaf 복구→실제 파일 검증→요청 완료를 확인했다.

`AdversarialReview`는 worker L5를 단일 호출의 이름으로 취급하지 않는다. program에 등록된 서로 다른 읽기 전용 reviewer grant를 각각 발급하고, 각 결과의 실제 독립 검증 이후 등록 joint validator가 모든 결론을 함께 판정한다. 필수 검토 activation은 실제 profile requirement에 근거하며 failure 신호를 조작하지 않는다. 두 검토의 개별 성공만으로 완료하지 않으며, joint 실패는 실제 실패 근거로 scoped 재계획→독립 계획 validator→새 실행→새로운 독립 검토를 모두 거쳐야 해소한다. 등록 프로토콜 없는 L5 grant, 중복 reviewer 이름, 아직 구현되지 않은 planner/specialist/replanner L5 조합은 거절한다.

검증: 타입 검사와 전체 320개 테스트 통과. 최신 검사는 결정 유효성 및 재계획, 유효 가정 바인딩 보존, 질문 중 입력 변경 episode 교체, 전문 검토 반복 질문·재시작·quota·근거 철회, L5 독립 검토의 성공·상충·질문·재계획 완료를 포함한다. 실행 모델은 합성 executor이고 독립 validator는 실제 격리 프로세스다. 이 결과는 모든 학습 target이나 전체 원문 수용 완료의 증명이 아니다.

## 관측된 실패에 따른 추론 프로필 선택

`workerPrecision`은 실행 가능한 profile 목록과 서로 다른 실패 attempt 수의 임계값을 program 버전에 명시한다. 임계값을 코드 상수로 추정하지 않는다. 원래 기대치에 대한 실제 prediction failure와 그 검증 의무가 현재 유효한 경우만 세며, 중복 관찰은 같은 attempt로 묶는다. 서로 다른 기대치의 이력을 혼합하지 않는다. 과거 실패 근거가 철회되면 0회 실패로 간주해 낮은 프로필을 선택하지 않고 미해결 상태를 유지한다.

선택한 profile은 실제 context·token/tool/time 상한·grant·adapter에 고정한다. 질문 답변으로 재개하는 worker는 질문 전 profile을 유지한다. L5 선택에는 같은 독립 검토 프로토콜을 강제한다. 실제 실패 3회에서 명시된 정책에 따라 L2→L3→L4→L5로 실행하고, 마지막 파일 검증과 독립 검토를 거쳐 요청 완료를 확인했다. 등록되지 않은 L0/L1 실행을 model profile로 가장하지 않는다.

로컬 kind 검증은 새 이미지에 현재 앱·패키지·스크립트를 복사하고 격리 launcher를 재컴파일해 수행한다. 호스트와 이미지의 source hash를 대조하며 이미지 ID와 실제 receipt를 `kubernetes-grant-validation.json`에 기록한다. 모델 호출 없이 read-only PVC·자격 증명 없음·커널 네트워크 차단·봉인 결과의 controller 채택을 확인한다. 이 기록은 그 source hash의 격리/채택 검증이며 전체 아키텍처나 실제 provider 호출 성공을 의미하지 않는다.

## 남은 전체 수용 조건

1. 파일 gateway 밖의 실제 코드·도구·환경 입력 관찰과 완전성 증거, Pod source lineage와 모든 외부 입력 유형의 관찰·복구를 연결하고 legacy 전체 snapshot/스캔을 대체해야 한다. 실제 boundary 보존 및 등록 경계 밖의 모든 변경에 대한 7차원 검증 적용도 남아 있다.
2. 실제 boundary 보존 증거를 활용한 영역 축소와 switching cost를 적용해야 한다. finite 후보·등록 검증기의 feasibility/공통 단위 비용·최적성 gap 경로는 연결했으나 비용 모델의 실제 성능 calibration은 남아 있다. 독립 region의 병렬 복구, 대기 중 질문·승인 전이까지 포함한 episode 병합, 승인 전이 중 episode 병합은 남아 있다. 등록 decision의 증거 기반 무효화와 유효 가정·결정의 대체 task 바인딩 보존은 연결했다. native 관찰 입력 및 등록 가정의 유효성 손실, 진행 중 repair의 최신 원인 교체는 연결했다.
3. activation additional-trigger의 historical/shadow 비교는 연결했으나, 모든 13개 정책 target의 실행 적용, 비용/완료 기록을 넘어선 usefulness outcome attribution·실측 paired holdout 평가·모든 정책 적용 경로의 회귀 감시 설정, L0 캐시·L1 결정론 실행 선택과 worker 이외 역할의 L5 실행, memory/routine의 실제 graph mutation과 역할 lifecycle 학습은 아직 전체 실행 루프에 연결되지 않았다.
4. 기존 운영 데이터/worker의 전면 이관, 권한 변경 reply 재개, quota 증액의 정책 변경 경로, 다른 native OS의 격리 지원, T01–T15 전체 수용 시나리오가 남아 있다. 성공한 실제 provider 호출은 사용자가 유지하기로 한 예외다.

`implementation-status.json`의 endToEndVerified는 위 전체 수용 조건을 기준으로 유지한다. 단위 함수나 새 경로 일부의 테스트 통과만으로 원문 요구 전체를 완료 처리하지 않는다.
