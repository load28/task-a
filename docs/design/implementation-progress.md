# 구현 현황

상태: 진행 중. 두 원문 전체의 수용 조건 T01–T15가 모두 충족된 상태는 아니다. 원문 4,997행·158개 요구 단위·191개 의미 계약을 보존하며, 구현된 실행 경로와 아직 증명하지 못한 조건을 구분한다.

## 기본 실행 경로에 연결한 구현

기본 `HostService`는 모델 manager 대신 `ControlServer`와 `RequestController`를 사용한다. 요청 식별자로 내구 이벤트를 기록하고, 등록된 역할·정책·예산 안에서 계획 인지 허가를 발급한다. 구조화된 계획과 원래 요청은 실제 등록 검증기의 표준 입력으로 전달된다. 검증 전에는 실행 계획을 승인할 수 없다. 검증된 leaf에는 실행 전에 여섯 차원의 기대치와 관측 검증기를 고정한다. task 선택·허가 발급·결과 채택·완료 판단은 컨트롤러가 수행한다.

기본 Graph MCP와 CLI MCP surface는 cognitive 전용이다. 모델에는 고정 context와 범위가 정해진 파일 도구를 노출하며 raw task/plan/Pod 조작을 제공하지 않는다. 운영·이관용 controller surface는 명시적으로 선택할 수 있다. 제어 대상 task의 raw start, 미계측 결과 제출, 사유 문자열만으로 reopen, 검증되지 않은 전체 plan revision은 engine에서도 차단한다. 운영 중인 기존 task 전체를 이관한 것은 아니다.

`GrantDispatcher`는 이미 발급된 허가만 내구 큐로 전달한다. 외부 실행 전에 전달 의도를 저장하며 재시작·수신 불명 상태에서 모델 요청을 재전송하지 않는다. 세션 생성 전 Pod가 만들어진 경우도 종료 관찰 대상이다. 실제 종료가 확인되지 않으면 stopping 상태와 scope 예약을 유지한다. dispatcher별 내구 소유권 lease를 갱신하며, 다른 프로세스의 lease가 살아 있는 동안 그 프로세스의 외부 호출을 복구 대상으로 fence하지 않는다. lease가 사라지거나 만료된 수신 불명 실행만 중단 확인 경로로 넘긴다.

`ControlRuntime`은 원래 graph 트랜잭션의 커밋 전에 outbox·typed dependency·readiness를 투영한다. 직접 task/dependency 변경도 trigger로 포착한다. task·parent·integration 완료 판정은 필수 의무, 현재 attempt, 입력 vector, 기대치, 실제 관측, evidence 만료를 함께 검사한다. 기대치를 관측 실패에 맞춰 사후 변경하는 것으로 완료할 수 없다. projection의 legacy 입력은 관찰 완전성을 증명하지 않으므로 completeness=unknown을 유지한다.

## 의미 검증과 실제 복구

등록된 검증기는 명시적인 작업 수·시간·출력 예산 안에서 실제 프로세스로 실행된다. 단순 exit 0 외에 semantic-state 계약을 검사하고, 여러 관찰의 합의와 critical 위반을 집계한다. 실제 관측으로 prediction error·hysteresis를 계산하며, acceptance criterion과 필수 의무까지 충족해야 verified로 전이한다. 과거 attempt의 실패는 이력으로 남고 새 attempt에 필수 검증을 다시 고정한다.

실제 의미 실패는 필요 조건이 맞는 specialist만 활성화한다. 모르는 feature를 0이나 임의의 위험 점수로 채우지 않는다. hard/soft trigger·cooldown·quota·context 예산·실행 예산을 검사한다. specialist의 출력도 별도 등록 검증기를 통과해야 근거로 사용한다. QA 호출 성공만으로 원래 실패 의무가 사라지지 않는다. 필수 specialist 요구는 내구 상태로 기록해 미해결 동안 완료와 국소 재실행을 차단한다. 계정 예산 상태가 바뀌면 deferred된 허가를 현재 입력·증거·quota·cooldown으로 다시 심사한다. 이미 실행한 모델 요청을 재전송하지 않는다. cooldown 대기는 종료 시각을 DB에 저장한다. 재시작 후에도 종료 이벤트를 한 번만 기록하고 현재 입력·증거·quota·cooldown을 재평가한 새 결정을 통해서만 허가를 발급한다. 대기 중 입력이 변경되면 기존 근거로 실행하지 않는다. quota 소진은 필수 의무를 대기로 유지하며 정책 변경을 자동 승인하지 않는다.

`LocalRepairs`는 실제 현재 관측에서 확인된 leaf 실패에만 반응한다. 명시된 복구 횟수 안에서 원래 목표·기대치·쓰기 범위를 유지한 새 허가를 발급한다. 이전 실행이 미확정이거나 검토 역할이 실행 중이면 재시도하지 않는다. 동일 실패 attempt의 중복 처리를 막고, 복구 결과도 새 attempt의 실제 검증을 통과해야 한다.

`RegionalRepairs`는 국소 복구 소진의 실패 증거 또는 명시적인 사용자 방향 수정에서 시작한다. 변경 원인·원래 목표·기대치·입력 버전·graph hash·generation을 lease에 고정한다. 모델은 scoped patch만 제안하며, controller가 보존 노드와 변경 노드를 조립한다. 실제 계획·patch·기대치·기존 제약은 독립 검증기에 전달된다. 검증된 임시 stage만 revision으로 커밋하고, 종료 대기 이후 실제 활성화 시에도 증거 만료와 입력 변경을 다시 검사한다. 대체 task는 새 허가 전에 검증된 기대치를 고정한다.

현재 region 선택은 read/process completeness가 입증되지 않으면 보수적인 포함 영역을 요구한다. `replanner.selection`이 등록되면 finite connected union 후보를 생성하고 실제 등록 검증기가 feasibility와 planning/reasoning/context/reexecution/integration/expectedFailure 여섯 비용을 공통 단위로 평가한다. 평가 이전에는 replanner를 호출하지 않는다. 입력 변경, 실패·비구조 평가, 비용 단위 불일치, unknown feasibility는 안전한 최소성 주장으로 바꾸지 않는다. 하한 탐색은 평가 한도·후보 누락·unknown을 gap에 남긴다. `minimumProven`은 등록된 finite domain과 보수적 closure 제약 안의 평가 비용에만 해당하며, 프로그램 전체의 최소 영역이나 실제 미래 비용의 최적성을 의미하지 않는다. 선택 정책이 없으면 기존 보수적 경로를 유지하고 minimumProven=false로 기록한다. 현재의 완전한 boundary proof가 있으면 가장 작은 검증 경계로 전파를 제한한다. 불확실성을 포함한 keep/switch는 현재 계획 유효성과 비용 구간을 사용한다. 독립 영역 병렬 복구는 남아 있다.

방향 수정은 원래 목표·기존 plan·이미 제출된 변경을 보존하고 새 사용자 evidence를 추가한다. 기존 요청을 중단한 뒤 같은 계획의 scoped replanner에 전달한다. 최초 계획 전 수정도 원래 목표와 변경 지시를 함께 전달한다. 최초 계획·regional replanner·leaf worker의 질문은 아래 내구 reply 경로로 처리한다. specialist 질문은 동일한 필수 검토 의무를 유지하는 내구 재개 경로로 연결했다. 최초 계획의 권한 변경은 아래의 등록 프로그램 전이로 처리한다.

## 관찰된 파일 의존성과 통합 검증

native gateway의 실제 UTF-8 읽기는 workspace·path별 불변 파일 버전, read call, 소비 grant와 evidence vector에 고정한다. 채택된 AgentCompleted에서만 관찰된 파일 포트→task 입력 edge를 투영한다. 같은 call의 재전달은 기존 읽기 결과를 유지하며 다른 내용의 보고는 충돌로 거절한다. 새 파일 버전을 관찰하면 현재 attempt가 이전 버전을 소비한 task와 관련 memory view를 무효화한다. native 결과 채택 전에는 실제 읽은 파일을 다시 확인하며, 성공한 자기 쓰기와 외부 변경을 구분한다. 이 검사 역시 검사 시점 이후의 원자적 전체 파일 시스템 보존을 증명하지 않는다.

granted write는 CAS 직전 hash와 교체 후 hash, grant·tool call·task·workspace·path를 immutable 파일 버전과 실제 runtime evidence에 함께 기록한다. 쓰기 자체는 기존 원자 교체와 fsync 경로를 유지한다. 자기 쓰기의 새 파일 버전은 해당 실행을 무효화하지 않으며 다른 실제 소비자에게만 입력 변경을 전파한다. task→파일 `generated_from` edge는 파일 쓰기 순간이 아니라 해당 grant 결과가 채택된 뒤에만 게시한다. 재전달된 tool call은 파일 버전·증거·edge를 중복 생성하지 않는다.

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

## 등록된 권한 변경과 새 계획 허가

`ControllerProgram.permissionTransitions`는 권한 이름·패턴·대상 프로그램 버전·운영자 근거를 실행 전에 불변 등록한다. 대상 프로그램은 먼저 독립 등록되어 역할·정책·도구·파일 범위·검증기·모델 및 quota 상한 검사를 통과해야 한다. planner는 정확히 하나의 `{kind:"permission",transitionId}`와 `requiresEscalation=true`만 제출할 수 있다. controller는 등록되지 않은 전이, 임의 패턴, 대상 프로그램 누락을 permission 요청으로 표시하지 않는다.

사용자의 `once` 응답은 현재 요청·세션·완료된 planner grant·현재 입력 벡터에 고정한 user evidence가 된다. 기존 grant나 프로그램 payload를 수정하지 않고 요청의 프로그램 버전을 등록 대상 버전으로 전환한 뒤 새 generation의 planner grant를 발급한다. 새 context와 계획 검증 근거에는 요청·응답·전이 lineage가 포함된다. 재시작과 중복 응답은 같은 기록을 재사용하며 다른 응답, 다른 세션, 입력 변경, 근거 철회, 취소는 재개를 차단한다. `reject`는 실행을 만들지 않고 미해결 요청을 유지한다.

quota 증액 전이는 일반 capability 전이와 구분한 `kind:"quota"`로 등록한다. 대상은 같은 account의 더 높은 token limit과 새 정책 버전을 모두 가져야 한다. 일반 capability 전이는 token limit을 높일 수 없다. planner context에는 승인 가능한 전이의 id·kind·권한·패턴·대상 버전만 제공하며 authorization 내부는 노출하지 않는다. 승인 뒤 발급되는 새 grant는 대상 프로그램의 정책과 상한을 사용하고 기존 예약과 grant는 변경하지 않는다.

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

- `npm run check`: TypeScript 검사와 전체 418개 테스트 통과, 실패·skip 0. 초기 요청→실제 plan validator→허가된 worker→실제 파일 관찰→완료, QA 조건부 활성화, 국소 복구, 검증된 재계획→대체 실행, 방향 수정의 목표 보존을 포함한다. 모델 부분은 합성 executor를 사용한다.
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

## 실행 전 고정한 정책 비교 측정

`PolicyMeasurements`는 두 cognition grant가 실행되기 전에 전체 비교 표본과 train/holdout 소속, 실제 request/task episode, attribution 조건, sampling design 근거, 비용 단위·가중치, 신뢰수준, critical strata와 승격 기준을 불변 study에 고정한다. 같은 입력·역할·그래프의 baseline/candidate policy를 비교하며 현재 지원 범위는 외부 파일 읽기와 쓰기가 없는 context 기반 cognition이다. 여러 task를 같은 request에서 나누어 유효 표본 수를 늘리거나, 이미 사용한 episode/grant를 다른 study에서 재사용하지 못한다. 독립 episode라는 통계적 가정은 등록된 sampling design의 책임이며 ID가 다르다는 이유로 독립성을 증명했다고 주장하지 않는다.

실제 수락된 양쪽 실행의 사용량을 수집한 뒤 등록된 독립 native validator가 기여·품질·실제 critical miss를 판정한다. 필수 assurance는 새로운 finding이 없어도 기여할 수 있다. 근거가 없으면 검증기가 unknown을 유지해야 하며 모델의 자기평가를 자동 label로 쓰지 않는다. 측정에는 실제 validation job과 동일 tuple의 receipt가 필요하다. 비용은 사전 등록 상한과 합계 1인 가중치로 정규화한다. 범위 초과, 미응답 질문, 누락, 검증 실패·잘림·근거 철회는 표본에서 제거하지 않고 전체 holdout 평가를 미완료로 유지한다.

정규화 효용은 `(contribution - normalizedCost + 1) / 2`다. episode별 candidate-baseline 차이에 고정 표본 Hoeffding 구간을 계산한다. overall 및 각 critical stratum의 gain 양쪽·quality 하한·critical miss 상한에 union bound를 적용한다. confidenceWidth는 gain 구간 폭을 전체 가능 범위 2로 나눈 값이다. 작은 critical stratum을 전체 평균으로 대신하지 않는다. 이 방식은 독립·유계 표본 가정의 보수적 통계 평가이며 일반적 정책 우월성을 증명하지 않는다.

`PolicyLearning`의 validated/active는 live study의 실제 집계값·근거·고정 기준과 일치해야 한다. caller가 좋은 점수나 authorized=true만 넘겨 승격하는 이전 경로는 거절한다. observed 표본에는 실제 guard model usage와 미완료 호출 없음도 요구한다. 합성 표본은 측정과 shadow 확인에만 사용한다. 옵션상 승인이 필요한 active 전이는 해당 proposal의 activate-policy 승인 증거를 요구하며, shadow 당시 baseline policy head/revision이 바뀌면 활성화하지 않는다. 실제 실행 중 grant의 policy는 변경하지 않는다.

검증: 타입 검사와 전체 332개 테스트 통과. 신규 검사는 실제 격리 validator, 재시작, unknown·잘림·누락, 비용 단위 초과, 근거 철회, 결과 후 표본 선정, episode/holdout 재사용, 위조 집계와 합성 표본 승격 차단, critical strata 신뢰구간을 포함한다. 합성 모델 결과를 사용했으며 실제 provider 호출 및 observed 표본의 성공한 승격 검증은 수행하지 않았다.

## 입력 전파 인덱스와 등록 관찰

`input-index.ts`는 task input/output, 현재 attempt snapshot, bundle member를 정규화한 역방향 인덱스로 관리한다. 최초 1회 backfill 뒤 SQL trigger가 기존 writer와 직접 SQL 변경까지 같은 트랜잭션에서 반영한다. 변경 artifact의 정확한 버전에서 중첩 bundle과 실제 소비자를 역추적한다. 현재 attempt snapshot이 있으면 선언 입력보다 우선하며 과거 attempt는 소비자로 확대하지 않는다. 계획 링크와 integration member 조회도 인덱스로 연결했다. 모든 legacy snapshot과 전체 상태 스캔이 제거된 것은 아니다.

`ObservedInputs`는 code/tool/environment/external 입력의 선언된 view를 등록 검증기의 실제 실행으로 관찰한다. 알려진 값, 누락, unknown을 구분하고 schema·권한·수명·실제 receipt를 확인한다. 미확인 입력은 모델 호출과 완료를 막는다. 유효한 관찰을 context와 input digest에 고정하며 값 또는 근거가 바뀌면 역인덱스의 소비자만 fence한다. 목표 specHash는 입력 변화로 바꾸지 않는다. 동일 값의 갱신은 유효한 실행을 중단하지 않는다. 선언 view의 관찰이 전체 환경·외부 서비스의 완전성 증거는 아니다.

계획 작성 전 입력 관찰부터 실제 계획 검증과 worker 발급까지 연결했다. 계획 작성 중의 변경은 `maxInputReplans`의 명시적 한도 안에서 새로운 계획 episode로 처리한다. 새 grant 발급 전 변경들은 병합하고 재시작 후에도 원인·횟수·이전 grant를 유지한다. 기존 실행의 중단 확인을 기다리고 기존 모델 예산을 유지한다. 권한 철회나 한도 초과는 대기한다. 계획 제출과 승인 직전에는 원래 계획 입력의 현재성을 다시 검사한다. 아직 활성화되지 않은 draft plan의 검증 중 입력이 바뀌면 기존 초안을 취소·superseded 이력으로 보존하고 같은 재계획 한도 안에서 대체 초안을 만든다. 대체 초안의 실제 독립 검증 전까지 기존 실패 의무는 유지한다.

## L0 검증된 인지 재사용

`CognitiveResultCache`는 독립 검증을 실제로 통과한 읽기 전용 인지 결과만 저장한다. task/spec/input/graph/role/policy/profile과 의미 context가 일치해야 하며 검증기·schema·가정·결정·evidence의 현재 유효성도 요구한다. context manifest의 새 식별자만으로 miss하지 않는다. 작업 실행이나 쓰기 결과를 재연하지 않는다. 파일을 읽은 인지는 해당 native 파일을 총 4 MiB 한도에서 다시 관찰한다. 누락·변경·별칭·유효하지 않은 UTF-8·관찰 출처가 불명확한 Pod 경로는 miss한다.

허가 발급 시 L0를 선택하면 모델 토큰 예약은 0이며 controller가 캐시 결과와 실제 0 토큰 사용량을 원자적으로 제출한다. 재사용 자체는 L0이며 새 결과의 독립 role-output 검증은 별도 L1 단계다. 전체 처리 과정에 새 검증이 없다고 표시하지 않는다. 발급 뒤 캐시 근거가 무효화되면 원래 profile과 전체 모델 예산을 다시 확보한 뒤에만 모델 경로로 돌아간다. 예산 부족은 pending을 유지한다. native/Pod executor는 L0 grant를 직접 실행하지 않는다. 재시작과 완료 응답 유실은 저장된 cache execution receipt로 복구한다.

추가 검증은 실제 격리 관찰·검증기, 변경 소비자의 선택적 차단, SQL rollback/backfill, 캐시 재사용·새 검증 실패·근거 철회·모델 예산 복구·파일 재관찰·재시작, 계획 중단 대기와 변경 병합·한도·권한 철회를 포함한다. 실제 provider 호출은 추가하지 않았다. Pod 원본 lineage에 근거한 파일 캐시와 쓰기 작업의 재사용은 이 경로가 대신 구현하지 않는다.

## L1 사전 검증으로 이미 충족된 작업 처리

`ControllerProgram.deterministicPreflight.maxAgeMs`를 등록하면 ready leaf의 worker 발급 전에 등록 observation validator를 실제 실행한다. task/spec/input/expectation/program을 고정한 별도 의무를 생성한다. 모든 검증기의 실제 receipt가 artifact/interface/behavior/dependency/goal/risk 여섯 차원의 기대치와 정확히 일치하고 critical 위반이 없을 때만 L1을 선택한다. unknown·실패·불일치·만료·role output schema 불일치는 원래 모델 판단으로 남긴다. L5나 이미 높아진 adaptive precision을 이 경로로 생략하지 않는다.

L1의 허가는 유효한 preflight receipt에 묶이며 모델 도구와 모델 토큰 예약은 0이다. controller는 같은 트랜잭션에서 scheduler scope 예약, current input 재확인, attempt 시작, 구조화된 결과와 실제 검증 소요시간 기록, implemented 전이를 수행한다. 기존 worker가 scope를 점유하면 대기한다. 실제 파일 수정이나 쓰기 호출은 실행하지 않는다. 이미 존재하는 결과를 관찰한 경우만 처리한다. 완료 전 독립 prediction-state 검증과 통합 의무는 그대로 유지한다. 결과 근거가 철회되면 worker 결과의 현재성 검사에서도 완료를 차단한다.

검증은 실제 파일이 이미 만족된 경우, 값 불일치·누락, receipt 수명 초과, worker 모델 예산 부족, 근거 철회, 사전 검증 후 파일 변경, 검증 대기 중 재시작을 포함한다. 이 구현은 임의의 쓰기 작업을 실행하는 solver나 모든 판단의 정적 해결을 제공하지 않는다. 등록 프로그램의 preflight 적용이 필요하며, 아직 적용하지 않은 운영 프로그램을 자동 변경하지 않는다.

최신 검증: 타입 검사와 전체 418개 테스트 통과(`npm run check`). 원문 추적 검사에서 4,997행의 누락·중복과 미매핑 필드는 0이다. 같은 최신 소스를 별도 로컬 이미지로 빌드하고 호스트·이미지의 source hash 일치를 확인했다. 해당 이미지로 실제 kind에서 읽기 전용 PVC·자격 증명 제외·커널 네트워크 차단·semantic receipt·controller의 verified 채택을 다시 검증했고 임시 namespace 삭제를 확인했다. 이미지 ID와 source hash는 `kubernetes-grant-validation.json`에 기록했다. 실제 provider 호출은 추가하지 않았다.

## 검증 중 초안 대체와 native 계획 입력 복구

`request_draft_replacements`는 아직 task로 활성화되지 않은 기존 초안, 실패 의무, 대체 초안과 새 의무, 실제 입력 변경 원인을 연결한다. 입력 변경 시 이전 초안의 활성화를 차단하고 원래 요청·한도·중단 확인을 유지한 채 새 계획을 발급한다. 연속 변경은 대체 연결을 보존하며 재시작 후에도 이어진다. 새 초안 검증이 실패·미완료이거나 검증기 권한·근거가 철회되면 이전 의무를 완료 판단에서 제외하지 않는다. 새 초안이 실제 등록 검증을 통과했을 때만 같은 요청의 의무를 대체한다. 과거 failed 상태와 receipt는 수정하거나 삭제하지 않는다. 계획 역할 자체의 role-output 의무도 새 계획과 동일 역할의 새 결과가 각각 독립 검증을 통과해야 대체한다.

엔진의 최초 계획 승인 검사에서도 request의 현재 planId와 검증 tuple의 planId가 정확히 같은지 재확인한다. 다른 초안의 검증을 빌려 이전 초안을 활성화할 수 없다. 실행 중인 계획이나 이미 task가 만들어진 계획은 이 초안 대체 경로를 사용할 수 없으며 기존 regional repair 경로를 유지한다.

`FileObservations`는 현재 planner의 실제 읽기와 최신 파일 관찰을 역인덱스로 연결한다. 현재 planner가 읽은 native 파일이 바뀌면 계획 중·질문 대기 중·초안 검증 중 상태에 같은 bounded input recovery를 적용한다. 동일 파일의 반복 읽기는 grant별로 병합하고 과거 planner의 읽기는 새 planner를 fence하지 않는다. 아직 중단 확인이 없는 claimed planner는 대기한다. v2 projection은 저장된 최신 file head만 채택하고 기존 읽기 edge를 중복 생성하지 않아 이전 기록과 재시작을 처리한다.

검증에는 이전 실패 보존, 대체 검증 실패, 연속 초안 교체, 재시작, 근거 철회, quota 소진, planner role 검증, 실제 native 파일 변경, 질문 supersession, 중단 대기, 과거 읽기 격리를 포함한다. 합성 모델 결과와 실제 격리 검증기를 사용했으며 실제 provider 호출은 추가하지 않았다.

## 등록 입력의 지역 복구와 검증 경계

등록 관찰의 무효화 근거를 지역 재계획의 실제 원인으로 연결했다. 정의 버전·관찰 값·현재 유효성으로 변경 token을 계산한다. 동일 값의 유효한 재관찰은 진행 중인 복구 원인을 지우지 않으며, 오래된 관찰 receipt의 철회는 새 관찰을 무효화하지 않는다. unknown이나 철회로 입력이 미확인인 동안에는 새 모델 context를 발급하지 않는다. 유효성을 잃었다가 같은 값으로 복구된 경우에도 새 원인을 기록한다. 원인 근거에는 당시 관찰과 철회 근거를 보존하며, 현재 관찰의 유효성은 실행 전에 별도로 다시 확인한다.

과거 형식의 변경 이벤트에는 선언 token이 없어도 저장된 실제 invalidation 근거에서 정의와 원래 관찰을 검증해 복원한다. event outbox를 수정하지 않는다. 새 입력이 다시 바뀌면 planning·waiting·validating 상태의 기존 episode를 superseded로 보존하고 기존 quota 안에서 새 원인으로 계획한다. 승인 전이 중 추가 변경도 아래 미활성 revision 교체 경로로 처리한다.

scoped revision의 저장과 최종 활성화는 실제 등록 검증 작업, 일치하는 receipt, 현재 검증 권한을 모두 요구한다. 요청 컨트롤러를 거치지 않는 기존 scoped 계획에도 같은 최종 검사를 적용한다. 저장 후 권한이나 receipt가 철회되거나 worker 중단 대기 중 권한을 잃으면 과거 revision과 중단 확인 이력은 보존하면서 새 task 활성화를 차단한다. 실행 없이 만든 통과 기록으로 계획을 저장하지 못한다.

검증은 입력 변경, 동일 값 갱신, 근거 철회 후 동일 값 복구, unknown 복구, 새 원인에 의한 episode 교체, 이전 이벤트 형식, DB 재시작을 거쳐 대체 worker와 요청 완료까지 확인한다. scoped 검사는 실제 독립 검증기로 교체했고 위조 통과 기록·권한 철회·receipt 철회·저장 후 철회·중단 대기 후 철회를 확인한다. 합성 모델 결과와 실제 격리 검증기를 사용했으며 실제 provider 호출은 추가하지 않았다.

## 승인 전이 중 변경 병합과 미활성 revision 교체

`replan_supersessions`는 이미 검증·저장됐지만 활성화되지 않은 revision의 폐기 원인과 실제 실행 revision을 불변 기록으로 보존한다. 새 원인이 들어오면 이전 generation을 fence하고 pending revision을 superseded로 표시한다. 중단 전이와 실행 token은 지우지 않는다. 실제 종료가 확인되기 전에는 대체 계획 grant를 발급하지 않으며, 종료 확인 뒤에도 폐기된 revision을 활성화하지 않는다. 폐기 기록·generation 변경·revision 상태·event는 같은 트랜잭션에서 저장한다.

새 lease의 `baseRevision`은 현재 저장 head를 CAS 대상으로 고정하고, `sourceRevision`은 여전히 활성 상태인 실행 그래프를 가리킨다. source가 head와 같으면 기존 lease 형식을 유지한다. 다른 경우에는 실제 폐기 기록이 있는 head만 허용한다. 노드·입력 vector·가정·결정·context·기대치는 실제 실행 revision에서 가져오며 stage·commit·최종 활성화 때 다시 검사한다. 대체 revision은 head+1로 저장하므로 과거 번호를 재사용하거나 graph 이력을 되감지 않는다.

중단 대기 중 연속 변경은 다음 episode의 현재 원인으로 병합한다. 원래 요청·기대치·이미 사용한 모델 예산·repair 횟수는 유지하며 quota 소진 시 미해결 상태를 유지한다. DB 재시작, 폐기 트랜잭션의 강제 실패와 rollback, 중복 폐기, 종료 확인 전 발급 차단, 폐기된 revision의 재승인 차단, 새 revision 실행과 최종 완료를 검증했다. 독립 region 병렬 처리는 이 경로에 아직 연결되지 않았다.

최신 전체 검사 418개에는 승인 전이, causal edge completeness 승격, 경계 보존, keep/switch, dispatcher 소유권 lease, granted write lineage, 역할 생명주기, routine 그래프 재사용, 독립 입력 view와 네 종류 외부 입력 고정 회귀 시나리오가 포함된다. 실제 native 검증 프로세스와 합성 worker를 사용했다. 같은 source hash의 이미지를 실제 kind에서 다시 검증했으며 `kubernetes-grant-validation.json`에 격리 receipt와 namespace 삭제 결과를 기록했다.

## 역할 생명주기 실행 게이트

역할 정의와 실행 신뢰를 분리했다. `role_versions`에 행만 직접 저장해도 실행할 수 없으며, 정확한 역할 hash와 lifecycle을 고정한 불변 `role_lifecycle_records`가 있어야 한다. 코드로 구성한 초기 catalog는 이름이 있는 persistent baseline으로만 설치한다. 동적 역할은 반복된 독립 episode, 기존 capability gap, 재사용 가능성, 실제 근거를 candidate부터 고정한다. temporary, validated, persistent 순서를 건너뛸 수 없다.

validated와 persistent 승격은 고정된 minimum effective samples, 순효용 하한, 기존 역할 overlap 상한을 통과해야 한다. 정책이 요구하면 현재 code/user authorization 근거가 있어야 persistent가 된다. Admission과 request program 등록은 이 기록을 확인한다. claim과 결과 채택 때도 다시 확인하므로 근거가 철회된 역할 허가를 실행하거나 완료할 수 없다. 각 실행은 고정한 역할 버전을 유지하며 새 버전이 과거 실행의 의미를 바꾸지 않는다. candidate는 lifecycle 기록이 있어도 실행되지 않는다.

단계 건너뛰기, 승인 없는 persistent 승격, 미인증 직접 저장, 근거 철회, lifecycle 기록 변경 시도를 실제 저장소에서 검증했다. 역할은 등록 시 process를 만들지 않는다. grant 발급 때만 run이 candidate가 되고 worker claim 뒤 active가 되며, 취소·입력 변경은 candidate와 active를 모두 fence한다. 완료된 run은 이력으로 남고 다음 역할 실행은 별도 grant 전까지 dormant 상태를 유지한다.

## Routine 그래프 학습과 재사용

`RoutineRegistry`는 active source plan의 검증 완료 task만 immutable routine version으로 등록한다. 충분한 독립 episode, 높은 coexecution, 낮은 independent-change 상한이 chunk 정책을 실제로 통과해야 한다. 각 member의 원래 PlanNode와 expectation, 검증기·통과 receipt를 가진 내부 checkpoint, 현재 causal graph의 verified crossing edge 전체를 input/output port로 고정한다. 정확히 같은 member와 crossing edge를 가진 complete boundary의 현재 7차원 preservation proof도 요구한다.

요청 planner context에는 현재 유효한 routine의 entry/exit와 외부 port만 제공한다. planner가 `routineUse`를 제출하면 controller가 namespace와 모든 entry input binding을 검사한 뒤 내부 parent/dependency를 보존한 일반 PlanNode들로 펼친다. 펼친 노드만 draft plan과 후속 worker 경로에 들어가므로 별도 macro 실행 우회는 없다. routine의 측정·checkpoint·boundary 근거를 plan validation obligation에 포함하고 승인 직전에 다시 검사한다. 근거 철회, graph hash 변경, boundary supersession, port 변경은 재사용을 막는다.

다른 상위 목표에서의 실제 draft plan 생성, 내부 dependency 보존, source expectation 복사, 등록·재전송 멱등성, 표본 부족, checkpoint receipt 누락, 근거 철회, 존재하지 않는 routine의 무변경 거절을 검증했다.

## 등록 외부 입력의 실행 벡터 고정

등록 관찰의 `code`, `tool`, `environment`, `external`은 각각 `(input id, kind port, schema view, observation version, value hash)`로 실행 입력 벡터에 들어간다. 계획·worker·specialist·L0 cache·L1 preflight·scoped replanning·질문 재개·도구 및 모델 호출이 같은 벡터를 재검사한다. 값의 유효 기간 만료나 근거 철회도 다음 모델·도구 승인을 막는다.

Pod 생성 전에도 grant 벡터와 현재 관찰을 비교한다. 불변 `InstanceSpec.inputSnapshot.vector`에 전체 벡터를 저장하여 재시작 identity와 worker 환경으로 전달하고, 기존 dependency workspace의 code snapshot source lineage와 함께 유지한다. 네 입력 kind의 독립 view, request grant 포함, 잘못된 Pod vector 거절을 검증했다.

새 입력 스냅샷은 단일 `legacy-complete-input` digest를 발급하지 않는다. task specification, 각 artifact content와 실제 code tree hash, runtime environment, 등록 외부 관찰을 독립된 entity/port/view/version/hash로 저장한다. task specification 또는 한 입력만 바뀌어도 계획·질문·실행의 해당 벡터 비교가 실패한다. 업그레이드 전에 저장된 attempt와 수동 운영 허가는 읽기 호환 경로에서만 기존 digest를 사용한다.

각 새 grant는 파일 시스템·도구·환경·네트워크·시간·난수·외부 상태의 일곱 입력 채널을 `observed/pinned/denied/bounded/unknown`으로 분류한 불변 실행 경계 계약을 가진다. 계약 hash와 controller runtime evidence를 별도 행에 고정하며 claim, 모델·도구 승인, 결과 제출, Pod 생성 전에 payload·행·증거의 일치를 다시 검사한다. 계약 삭제·위변조·근거 철회·만료는 실행을 차단한다. cognitive gateway 밖의 도구가 있으면 관련 채널을 `unknown`으로 낮춘다.

실제 모델 profile은 제공자 내부 난수를 통제하거나 관찰하지 못하므로 전체 판정을 `unknown`으로 유지한다. 캐시가 만료되면 모델 fallback이 가능한 L0 grant도 같은 보수적 판정을 유지한다. 모델 호출과 fallback이 없는 L1 실행만 모든 채널이 고정되었을 때 `complete`가 될 수 있다. 이는 미관측 입력을 완전하다고 가장하지 않는 locality 전제를 실행 계약으로 만든 것이다.

입력 경계 증거는 계획 proposal 의무, 역할 결과 의무, L5 specialist 활성화 판단에 원인 근거로 전파한다. 계획 검증 tuple은 planner의 전체 입력 벡터와 proposal을 함께 고정한다. 요청 outcome은 각 실행의 경계 계약과 `inputCoverage`를 기록하므로 이후 정책 측정이 `unknown` 채널을 완전한 관찰 표본으로 취급할 수 없다. grant 만료 뒤 결과를 검증할 수 있도록 경계 증거는 역사 기록으로 유지하되, 실행 허가는 grant 만료를 계속 적용하고 증거 철회는 후속 검증을 차단한다.

paired 정책 측정도 baseline과 candidate의 경계 증거를 독립 측정 의무에 포함한다. 보고서는 모든 고정 실행의 경계 계약을 다시 검증해 `inputCoverage`를 계산한다. legacy 계약, 철회·위변조된 경계 증거, 하나 이상의 `unknown` 채널이 있으면 측정값과 신뢰구간은 관찰 결과로 보존하되 정책 승격에는 사용할 수 없다.

## 검증된 경계 보존과 keep/switch 판단

완전 경계는 구성 task, 모든 실제 교차 causal edge, invariant, 전용 binding 검증기와 증거 수명을 불변 버전에 고정한다. 교차 edge 목록이 현재 그래프와 정확히 일치하고 모든 edge의 completeness가 verified인 경우만 등록한다. 현재 attempt의 의미 관찰에 대해 binding 검증과 behavior/interface/data/temporal/error propagation/resource contention/semantic 일곱 검증을 실제 프로세스로 모두 통과해야 scope별 `BoundaryProof`를 만든다. proof는 현재 그래프 hash·관찰 tuple·모든 출구·검증 receipt와 권한에 묶인다.

causal edge의 completeness는 controller가 직접 `verified`로 표기하지 않는다. 정확한 immutable edge 버전·전체 port/relation/scope/criticality/전파 관찰과 운영 권한을 별도 필수 의무에 고정한다. 등록된 독립 검증기의 실제 receipt가 현재일 때만 새 edge 버전을 verified로 승격한다. 검증 중 edge가 바뀌거나 검증기 권한·근거가 철회되면 이전 결과를 새 버전에 적용하지 않는다.

지역 전파는 변경 source를 포함하는 가장 작은 완전 경계를 찾는다. 모든 scope에서 모든 출구의 보존 proof가 현재일 때 경계 구성원 전체를 보수적 universe로 사용하고 그 밖의 task로 전파하지 않는다. proof 만료·receipt 또는 권한 철회·그래프나 입력 변경·불완전 출구가 있으면 해당 경계를 사용하지 않고 전체 활성 계획 범위로 돌아간다. 자동 등록되는 일반 통합 경계는 bindingsComplete=false이므로 완전성 증거를 가장하지 않는다.

region 후보 검증기는 같은 `costUnit`으로 planning·reasoning·context·reexecution·integration·새 예상 실패를 측정하고, 현재 계획의 예상 실패와 새 예상 실패의 estimate/lower/upper를 함께 반환한다. 이 검증은 실제 작업 receipt와 현재 validator 권한을 요구하는 필수 의무다. 현재 계획이 무효면 전환하고, 유효하면 keep 하한이 switch 상한보다 클 때만 전환한다. 유지 결정과 근거는 내구 기록으로 원인을 소비하며, 근거가 철회되면 결정을 재사용하지 않는다.

경계 proof 생성·영역 containment·불완전 또는 unknown edge 거절·edge completeness 승격의 성공·stale 차단·receipt 철회 복귀와 실제 switch/unknown/keep·keep 근거 철회를 검증했다. kind 기록은 이전 source hash를 명시해 보존한다.

## 남은 전체 수용 조건

1. 파일 gateway 밖의 등록된 코드·도구·환경·외부 입력 관찰은 실행 벡터와 native/Pod 복구 identity에 연결했고 새 실행의 legacy 전체 snapshot을 독립 입력 view로 교체했다. 입력 채널별 완전성 계약과 증거도 실행 경계에 연결했다. 실제 모델 제공자의 난수 채널은 `unknown`이며, 등록하지 않은 경계 밖 변경의 7차원 검증 적용도 남아 있다.
2. 실제 boundary 보존 증거를 활용한 보수적 영역 축소와 불확실성 포함 keep/switch 판단은 연결했다. finite 후보·등록 검증기의 feasibility/공통 단위 비용·최적성 gap 경로도 연결했으나 비용 모델의 실제 성능 calibration은 남아 있다. 독립 region의 병렬 복구는 남아 있다. 승인 전이 중 episode 병합은 미활성 revision 폐기와 source/head 분리로 연결했다. 질문 대기 중 입력 변경 병합은 연결했다. 등록 decision의 증거 기반 무효화와 유효 가정·결정의 대체 task 바인딩 보존은 연결했다. native 관찰 입력 및 등록 가정의 유효성 손실, 진행 중 repair의 최신 원인 교체는 연결했다.
3. activation additional-trigger의 historical/shadow 비교, gateway 파일 쓰기의 실제 attribution, 역할 lifecycle 실행 게이트, 검증된 routine의 실제 plan graph 확장은 연결했으나, 모든 13개 정책 target의 실행 적용, 파일 밖 외부 입력의 attribution 및 observed paired holdout 운영 평가·모든 정책 적용 경로의 회귀 감시 설정, 모든 판단 경로의 L1 우선 적용과 worker 이외 역할의 L5 실행, memory의 실제 graph mutation은 아직 전체 실행 루프에 연결되지 않았다.
4. 기존 운영 데이터/worker의 전면 이관, 다른 native OS의 격리 지원, T01–T15 전체 수용 시나리오가 남아 있다. 권한 변경 reply와 quota 증액은 사전 등록된 프로그램·정책 버전 전이와 새 계획 허가로 연결했다. 성공한 실제 provider 호출은 사용자가 유지하기로 한 예외다.

`implementation-status.json`의 endToEndVerified는 위 전체 수용 조건을 기준으로 유지한다. 단위 함수나 새 경로 일부의 테스트 통과만으로 원문 요구 전체를 완료 처리하지 않는다.
