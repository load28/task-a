# 원문 데이터 필드별 구현 계약

원문의 TypeScript 선언에서 각 필드를 추출한 후 사람이 작성한 필드 계약과 일대일 대조한다. 모든 열거값도 아래에 별도 기록한다. 원문 예시는 인터페이스 이름 그대로 복사하는 요구가 아니라 데이터 의미를 빠짐없이 구현하는 계약이다.

## Task.id

원문 [A:469](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:469) · A06

서버가 할당하는 stable task identity이며 spec/attempt/version과 구분한다.

## Task.title

원문 [A:471](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:471) · A06

표시용 제목이다. 제목 변경만으로 semantic cache나 downstream을 무효화하지 않는다.

## Task.objective

원문 [A:472](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:472) · A06

승인 목표의 의미를 TaskSpecVersion에 고정하고 변경은 goal/subgoal signature를 생성한다.

## Task.status

원문 [A:474](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:474) · A06

기존 상태와 의미 대응한다. review는 implemented 이후 검증 의무 상태이며 completed는 전체 완료 conjunction을 통과해야 한다.

## Task.parent

원문 [A:483](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:483) · A06

계층 부모 참조이다. 외래키와 hierarchy cycle을 검사하며 인과 의존성과 구분한다.

## Task.children

원문 [A:485](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:485) · A06

정규화 parent 관계로 조회한다. 별도 배열을 이중 갱신하여 불일치를 만들지 않는다.

## Task.dependencies

원문 [A:487](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:487) · A06

typed CausalEdgeVersion의 실행 의존 view이다. source→consumer 방향과 버전을 고정한다.

## Task.artifacts

원문 [A:489](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:489) · A06

actual artifact/version refs이다. 문자열 요약이 아니라 실제 output hash·계보로 검증한다.

## Task.assumptions

원문 [A:491](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:491) · A06

버전 가정 참조를 저장하고 invalidation 시 assumes consumer index로 전파한다.

## Task.decisions

원문 [A:493](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:493) · A06

DecisionVersion 참조이다. validated/executed/비영향 결정은 immutable로 보호한다.

## Task.evidence

원문 [A:495](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:495) · A06

EvidenceVersion exact refs를 저장하고 출처·hash·유효기간을 검증한다.

## Task.risk

원문 [A:497](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:497) · A06

현재 RiskState의 version ref로 저장하고 독립 확률/보수 score를 구분한다.

## Task.confidence

원문 [A:499](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:499) · A06

[0,1] 범위 및 evidence 근거를 검증하고 중요 dependency min으로 집계한다.

## Task.version

원문 [A:501](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:501) · A06

specVersion/runtime generation/attempt token을 분리하여 각 변경 의미를 보존한다.

## Role.id

원문 [A:554](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:554) · A08

role identity이며 실제 worker/run ID와 다르다.

## Role.name

원문 [A:556](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:556) · A08

표시용 이름이다. 이름 문자열이 activation condition이 되지 않는다.

## Role.purpose

원문 [A:558](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:558) · A08

역할의 책임을 불변 RoleVersion에 저장하고 다른 역할과 중복 평가에 사용한다.

## Role.capabilities

원문 [A:560](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:560) · A08

도메인 능력 집합으로 전문 역할 필요성과 기존 역할 부족을 평가한다.

## Role.activationPolicy

원문 [A:562](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:562) · A08

불변 정책 버전 참조이다. grant 발급에서 hard/soft/quota를 서버가 평가한다.

## Role.requiredContext

원문 [A:564](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:564) · A08

relation/port/evidence selector 집합이다. prompt 요청이 아닌 context gateway의 강제 필터다.

## Role.outputSchema

원문 [A:566](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:566) · A08

structured result schema의 불변 ref이다. 파싱과 의미·근거 검증 전 결과를 채택하지 않는다.

## Role.validators

원문 [A:568](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:568) · A08

필요 deterministic/role 검증자 version refs이다. 누락된 mandatory validator는 완료를 막는다.

## SignalSet.changedFiles

원문 [A:645](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:645) · A10

실제 before/after code snapshot diff의 파일 참조이다. 파일명 규칙 대신 의미 추출 입력으로 사용한다.

## SignalSet.changedSymbols

원문 [A:647](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:647) · A10

AST/symbol analyzer의 변경 symbol과 provenance이다. 분석 불가를 빈 집합으로 위조하지 않는다.

## SignalSet.changedInterfaces

원문 [A:649](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:649) · A10

실제 public port/contract 변경 참조이다. shared boundary·consumer 검토에 연결한다.

## SignalSet.failingTests

원문 [A:651](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:651) · A10

실행 receipt에 연결된 실패 test refs이다. QA hard trigger 근거가 된다.

## SignalSet.affectedDependencies

원문 [A:653](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:653) · A10

graphVersion에 고정된 영향 dependency refs이며 단순 파일 수로 대체하지 않는다.

## SignalSet.uncertainty

원문 [A:655](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:655) · A10

미해결 질문·unknown 판정의 정규화 score와 근거를 저장한다.

## SignalSet.risk

원문 [A:657](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:657) · A10

일반 위험 score/model version이다. 값만 제출한 agent 자기평가로 확정하지 않는다.

## SignalSet.integrationRisk

원문 [A:659](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:659) · A10

공유 경계·미검증 tuple·cross-task 충돌의 별도 위험 score이다.

## SignalSet.externalKnowledgeRequired

원문 [A:661](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:661) · A10

현재 유효 evidence로 충족되지 않은 외부 사실 요구이다. Research hard trigger에 연결한다.

## SignalSet.semanticChange

원문 [A:663](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:663) · A10

기계적 diff와 구분되는 의미 변화 여부이다. unknown 판정을 보존하도록 내부 tri-state를 확장한다.

## ActivationPolicy.hardTriggers

원문 [A:708](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:708) · A12

근거가 일치하면 mandatory obligation을 만든다. cooldown/budget 때문에 satisfied로 바꾸지 않는다.

## ActivationPolicy.softSignals

원문 [A:710](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:710) · A12

정규화 feature와 weight의 불변 집합이다. 계산 내역을 decision에 기록한다.

## ActivationPolicy.threshold

원문 [A:712](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:712) · A12

role별 score 비교값이다. 허용 범위·경계값 규칙·calibration version을 검증한다.

## ActivationPolicy.cooldown

원문 [A:714](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:714) · A12

동일 episode/role 반복을 억제하는 시간 정책이다. expiry event는 재평가만 유발하며 자동 모델 호출이 아니다.

## ActivationPolicy.maxInvocationsPerTask

원문 [A:716](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:716) · A12

task/role/policy 범위의 허용 호출 수이다. hard 의무와 충돌하면 wait/escalation한다.

## ContextBudget.maxTokens

원문 [A:919](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:919) · A17

실제 serialized system/role/tool/schema/context와 출력 예약을 포함하는 상한이다.

## ContextBudget.maxDependencyDepth

원문 [A:921](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:921) · A17

selector traversal의 최대 깊이다. 필수 dependency 누락이 발생하면 요약/예산 판단으로 처리한다.

## ContextBudget.maxEvidenceItems

원문 [A:923](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:923) · A17

전달 evidence item 수 상한이다. 필수 invariant 근거를 임의로 버릴 수 없다.

## ContextBudget.maxHistoricalDecisions

원문 [A:925](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:925) · A17

과거 결정 전달 수 상한이다. immutable 현재 결정과 역사 참고자료를 구분한다.

## IntegrationResult.compatible

원문 [A:1083](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1083) · A22

검증 범위 내 호환성 결과이다. 일반 행동 동등성 또는 BoundaryProof.preserved와 동일시하지 않는다.

## IntegrationResult.conflicts

원문 [A:1085](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1085) · A22

서로 충돌하는 exact output/contract refs와 근거를 저장한다.

## IntegrationResult.emergentRisks

원문 [A:1087](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1087) · A22

개별 실행에 없던 조합 위험을 evidence·dimension과 함께 기록한다.

## IntegrationResult.requiredRework

원문 [A:1089](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1089) · A22

원인 lineage와 scope가 있는 TaskProposal로 변환한다. 즉시 임의 task를 만들지 않는다.

## Evidence.id

원문 [A:1101](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1101) · A23

서버 evidence identity이다. content/producer/version을 별도로 고정한다.

## Evidence.type

원문 [A:1103](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1103) · A23

test/code/document/runtime/research/user/agent의 provenance 종류이다. 종류별 검증 신뢰 수준을 적용한다.

## Evidence.source

원문 [A:1112](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1112) · A23

실제 도구 receipt/파일/version/외부 출처를 가리킨다. 사람이 읽는 요약만으로 대체하지 않는다.

## Evidence.confidence

원문 [A:1114](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1114) · A23

근거와 calibration을 가진 [0,1] 값이다. agent claim을 실제 test pass로 승격하지 않는다.

## Evidence.timestamp

원문 [A:1116](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1116) · A23

관찰시각과 저장시각을 구분하고 external evidence expiry 판정에 사용한다.

## Evidence.contentHash

원문 [A:1118](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1118) · A23

canonical content 또는 실제 blob 해시이며 읽을 때 무결성을 확인한다.

## Decision.conclusion

원문 [A:1126](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1126) · A23

판단 명제이며 supporting evidence와 적용 범위를 함께 저장한다.

## Decision.evidence

원문 [A:1128](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1128) · A23

불변 EvidenceVersion refs를 사용한다. 해당 증거 무효화는 소비 결정에 전파한다.

## Decision.confidence

원문 [A:1130](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1130) · A23

근거 강도와 불확실성을 기록하며 높은 확신·약한 근거는 Critic signal이다.

## Decision.assumptions

원문 [A:1132](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1132) · A23

판단이 의존한 AssumptionVersion refs이며 깨지면 해당 conclusion만 무효화한다.

## ReasoningState.assumptions

원문 [A:1443](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1443) · A34

현재 reasoning slice의 가정과 유효성 버전을 유지한다.

## ReasoningState.conclusions

원문 [A:1445](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1445) · A34

각 DecisionVersion과 소비 vector를 저장하여 부분 재계산한다.

## ReasoningState.unresolvedQuestions

원문 [A:1447](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1447) · A34

미해결 질문을 보존하고 유효한 확정 결론으로 cache hit하지 않는다.

## ReasoningState.evidenceIndex

원문 [A:1449](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1449) · A34

reasoning이 읽은 증거의 역참조와 버전이다.

## ReasoningState.dependencyVersion

원문 [A:1451](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1451) · A34

entity/port/semanticView/version/hash vector를 pin한다.

## AgentOutput.taskId

원문 [A:1504](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1504) · A37

grant의 task/region 대상과 일치해야 하며 다른 task 결과 제출을 거절한다.

## AgentOutput.findings

원문 [A:1506](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1506) · A37

새 발견의 근거·novelty·적용 범위를 저장하고 중복 finding으로 reward를 부풀리지 않는다.

## AgentOutput.decisions

원문 [A:1508](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1508) · A37

검증된 conclusion/evidence/assumption 구조를 요구한다.

## AgentOutput.risks

원문 [A:1510](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1510) · A37

위험 차원·evidence·추정 불확실성을 포함하고 parent/integration aggregate에 연결한다.

## AgentOutput.unresolvedQuestions

원문 [A:1512](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1512) · A37

미해결 사항을 obligation 또는 escalation 후보로 변환한다.

## AgentOutput.evidence

원문 [A:1514](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1514) · A37

실제 접근한 유효 evidence refs인지 검증하고 provenance를 보존한다.

## AgentOutput.proposedTasks

원문 [A:1516](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1516) · A37

scope가 있는 제안이다. 서버 검증 후에만 ID를 할당한다.

## AgentOutput.confidence

원문 [A:1518](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1518) · A37

[0,1] 자기평가와 evidence 기반 calibrated 값의 구분을 보존한다.

## AgentOutput.requiresEscalation

원문 [A:1520](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1520) · A37

추가 판단 요청 표시이다. 근거 검증과 router 허가 없이 상위 실행을 만들지 않는다.

## PolicyProposal.target

원문 [A:1966](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1966) · A56

A56의 6예시를 A54의 9대상과 B propagation/boundary/expectation/routine까지 확장한다.

## PolicyProposal.observedPattern

원문 [A:1974](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1974) · A56

실제 사례·episode refs에 연결된 반복 구조이다.

## PolicyProposal.rootCause

원문 [A:1976](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1976) · A56

검증 근거와 대안 가설을 가진 원인 귀속이다. 마지막 agent를 자동 지목하지 않는다.

## PolicyProposal.proposedInvariant

원문 [A:1978](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1978) · A56

사례 이름이 아닌 일반 구조 제약이다. critical correctness를 일반 학습으로 약화하지 않는다.

## PolicyProposal.proposedRule

원문 [A:1980](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1980) · A56

허용된 구조 DSL AST이며 ID/파일명 특례와 숨은 mutation을 거절한다.

## PolicyProposal.expectedBenefit

원문 [A:1982](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1982) · A56

정규화 utility의 추정값과 불확실성이다. 실측 효과와 구분한다.

## PolicyProposal.regressionRisk

원문 [A:1984](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1984) · A56

holdout/shadow 실패와 영향 범위를 평가하며 승격·rollback gate에 사용한다.

## AgentSystemEvent.id

원문 [A:2180](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2180) · A66

서버가 생성하는 event identity이며 소비자 멱등 처리 키에 사용한다.

## AgentSystemEvent.type

원문 [A:2182](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2182) · A66

schema registry에 등록된 의미 변화 종류이다.

## AgentSystemEvent.entityId

원문 [A:2184](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2184) · A66

영향 entity를 가리키고 graph consumer index의 시작점이 된다.

## AgentSystemEvent.timestamp

원문 [A:2186](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2186) · A66

관찰/기록시각을 보존하되 처리 순서는 durable sequence로 확정한다.

## AgentSystemEvent.payload

원문 [A:2188](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2188) · A66

종류별 schemaVersion으로 검증한 불변 payload이며 참조 버전을 고정한다.

## AgentSystemEvent.causationId

원문 [A:2190](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2190) · A66

직접 원인 event ID이다. 연쇄 실패·repair의 이유를 추적한다.

## AgentSystemEvent.correlationId

원문 [A:2192](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2192) · A66

같은 사용자 목표/변경 episode의 상관 ID이다. causation과 혼용하지 않는다.

## TaskExpectation.expectedArtifacts

원문 [B:254](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:254) · B04

종류/port/schema/수량/조건을 실행 전에 pin하고 실제 output receipt와 비교한다.

## TaskExpectation.expectedInterface

원문 [B:255](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:255) · B04

required contract version과 observable 제약이다. 단순 타입 이름으로 축약하지 않는다.

## TaskExpectation.expectedBehavior

원문 [B:256](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:256) · B04

검증 가능한 행동 제약·시나리오와 validator를 저장한다.

## TaskExpectation.expectedDependencies

원문 [B:257](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:257) · B04

실제 input ports·가정·환경·tool/f 버전의 예상 binding이다.

## TaskExpectation.expectedRisk

원문 [B:258](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:258) · B04

실행 전 위험 예상값이다. 관찰 risk residual은 SPE의 C/B/D/G와 별도로 저장한다.

## ChangeSignature.scope

원문 [B:691](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:691) · B16

8가지 원문 scope를 보존하며 복합 변경은 scope 집합으로 내부 확장한다.

## ChangeSignature.magnitude

원문 [B:701](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:701) · B16

의미 변화 크기의 정규화 값이다. 줄 수만으로 결정하지 않는다.

## ChangeSignature.confidence

원문 [B:703](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:703) · B16

scope/magnitude 판단 근거의 신뢰도이다. 낮은 값은 불변 proof가 아니다.

## PlanNode.taskId

원문 [B:1351](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1351) · B39

stable task와 해당 taskSpecVersion의 참조이다.

## PlanNode.objective

원문 [B:1353](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1353) · B39

현행 plan node의 승인 목표이며 expectation의 기준이다.

## PlanNode.expectedOutcome

원문 [B:1355](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1355) · B39

실행 전 ExpectationVersion ref이다. actual로 사후 덮어쓸 수 없다.

## PlanNode.actualOutcome

원문 [B:1357](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1357) · B39

실행·검증 ObservationVersion ref이다. 실행 전에는 부재를 unknown과 구분한다.

## PlanNode.dependencies

원문 [B:1359](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1359) · B39

graphVersion에 고정된 typed edge refs이다.

## PlanNode.assumptions

원문 [B:1361](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1361) · B39

버전 가정 refs와 consumer index를 연결한다.

## PlanNode.boundaryContract

원문 [B:1363](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1363) · B39

PlanningBoundaryVersion의 observable contract ref이다. 미정이면 보존 proof를 발급하지 않는다.

## PlanNode.status

원문 [B:1365](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1365) · B39

계획 유효/실행/검증 상태를 기존 task 상태와 혼동하지 않게 분리한다.

## PlanNode.predictionError

원문 [B:1367](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1367) · B39

C/B/D/G·SPE·evidence를 가진 PredictionErrorVersion ref로 구체화한다.

## PlanNode.invalidationReason

원문 [B:1369](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1369) · B39

재계획을 정당화하는 exact EvidenceVersion refs이다. 일반 이유 문자열로 대체하지 않는다.

## PlanNode.planVersion

원문 [B:1371](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1371) · B39

append-only revision reference이며 base version CAS에 사용한다.

## PlanChangeEvent.sourceTask

원문 [B:1381](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1381) · B40

변경 source task이다. 환경/contract source는 공통 event entity로 추가 표현한다.

## PlanChangeEvent.before

원문 [B:1383](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1383) · B40

이전 SemanticState의 불변 ref와 input vector이다.

## PlanChangeEvent.after

원문 [B:1385](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1385) · B40

관찰된 새 SemanticState의 불변 ref이다.

## PlanChangeEvent.changeSignature

원문 [B:1387](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1387) · B40

여러 scope·크기·confidence·근거가 고정된 signature ref이다.

## PlanChangeEvent.evidence

원문 [B:1389](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1389) · B40

before/after 차이와 분류를 뒷받침하는 exact evidence이다.

## PlanChangeEvent.timestamp

원문 [B:1391](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1391) · B40

변경 관찰시각이며 causation/sequence와 함께 episode를 정의한다.

## PredictiveEdge.from

원문 [B:1757](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1757) · B54

생산자 source entity/port ref로 확장한다.

## PredictiveEdge.to

원문 [B:1758](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1758) · B54

영향받는 consumer entity/port ref로 확장한다.

## PredictiveEdge.relation

원문 [B:1760](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1760) · B54

typed relation registry의 값이며 scope별 전파 의미가 필수다.

## PredictiveEdge.impactWeight

원문 [B:1762](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1762) · B54

[0,1] noncritical 영향 가중치이다. critical은 항상 hard/1이다.

## PredictiveEdge.changeTypes

원문 [B:1764](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1764) · B54

해당 edge를 통과하는 ChangeScope 집합이다.

## PredictiveEdge.observedPropagationRate

원문 [B:1766](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1766) · B54

성공/시도/미관측 구분·추정값·모델 버전으로 확장한다. 재실행 수를 semantic 영향 수로 세지 않는다.

## ReplanningContext.goal

원문 [B:2159](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2159) · B68

승인 goal ref이며 region 밖 objective를 수정할 권한이 아니다.

## ReplanningContext.boundary

원문 [B:2161](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2161) · B68

control plane이 계산한 허용 GraphRegion과 lease이다.

## ReplanningContext.changedNodes

원문 [B:2163](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2163) · B68

관찰 변화의 source 집합과 before/after refs이다.

## ReplanningContext.invalidatedNodes

원문 [B:2165](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2165) · B68

증거·typed closure·경계 검증 후 실제 재검토가 필요한 집합이다.

## ReplanningContext.preservedNodes

원문 [B:2167](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2167) · B68

유효성을 확인해 보존하는 node 집합이며 patch 대상에서 제외한다.

## ReplanningContext.immutableDecisions

원문 [B:2169](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2169) · B68

validated/executed/비영향 결정 refs로서 변경 불가능하다.

## ReplanningContext.predictionErrors

원문 [B:2171](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2171) · B68

현재 lease snapshot의 기대/관찰 오차·근거이다.

## ReplanningContext.violatedInvariants

원문 [B:2173](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2173) · B68

지역 복구가 반드시 해소해야 할 제약이다.

## ReplanningContext.evidence

원문 [B:2175](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2175) · B68

region과 role selector에 적합한 근거만 예산 내 제공한다.

## ReplanningResult.revisedTasks

원문 [B:2185](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2185) · B69

lease 안의 기존 node patch이며 base revision·이유·evidence를 검증한다.

## ReplanningResult.newTasks

원문 [B:2187](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2187) · B69

proposal-local ID의 새 task이다. 서버가 canonical ID/version을 할당한다.

## ReplanningResult.removedTasks

원문 [B:2189](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2189) · B69

현행 plan membership 제외이다. 역사 task/artifact를 삭제하지 않는다.

## ReplanningResult.newDependencies

원문 [B:2191](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2191) · B69

새 typed edge 제안이다. 외부 영향·cycle·complete read binding을 검증한다.

## ReplanningResult.preservedDecisions

원문 [B:2193](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2193) · B69

입력 immutable set과 일치해야 한다. 생략하여 결정 보존을 우회할 수 없다.

## ReplanningResult.invalidatedAssumptions

원문 [B:2195](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2195) · B69

근거 있는 가정 무효화 요청이며 실제 consumer로 전파한다.

## ReplanningResult.expectedOutcomes

원문 [B:2197](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2197) · B69

새 task/spec의 목표·contract에 맞는 실행 전 기대치이다. 실패를 숨기려고 제약을 약화하지 않는다.

## ReplanningResult.confidence

원문 [B:2199](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2199) · B69

계획 제안의 [0,1] 신뢰도이다. deterministic consistency·completion 검증을 대체하지 않는다.

## 열거값별 처리

| 원문 | 열거값 | 처리 |
|---|---|---|
| [A:475](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:475) | Task.status.created | 기존 pending에 대응하며 기대·입력·의무 준비 전에는 실행할 수 없다. |
| [A:476](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:476) | Task.status.ready | dependency와 admission의 준비 상태를 구분한다. ready 자체는 모델 실행 허가가 아니다. |
| [A:477](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:477) | Task.status.running | 허가된 implementation attempt만 해당 상태를 갖고 role review run과 구분한다. |
| [A:478](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:478) | Task.status.blocked | 해결할 dependency/의무/실패 근거와 unblock event를 유지한다. |
| [A:479](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:479) | Task.status.review | implemented 이후 local/role/integration 검증 의무가 남은 상태로 대응한다. |
| [A:480](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:480) | Task.status.completed | 최신 입력과 모든 완료 conjunction 충족 후에만 task/goal 완료를 판정한다. |
| [A:481](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:481) | Task.status.failed | 실패 evidence와 attribution을 기록하고 해당 영향 영역만 복구한다. |
| [A:592](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:592) | AgentState.dormant | 등록 역할에 실행 세션이 없는 기본 상태다. |
| [A:593](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:593) | AgentState.candidate | 신호가 일치했지만 activation score/필수 조건/자원 허가 전인 상태다. |
| [A:594](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:594) | AgentState.active | 단일 사용 grant와 pinned context/profile로 실행 중이다. |
| [A:595](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:595) | AgentState.waiting | 증거·자원·종료 event를 기다리며 모델 polling을 하지 않는다. |
| [A:596](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:596) | AgentState.completed | 해당 run의 terminal 기록을 유지하고 역할은 다시 dormant가 된다. |
| [A:1104](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1104) | Evidence.type.test | 실제 validator 실행 receipt·입력·결과·범위와 연결한다. |
| [A:1105](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1105) | Evidence.type.code | 실제 content/tree hash와 artifact version을 확인한다. |
| [A:1106](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1106) | Evidence.type.document | 문서 내용 hash·출처·version·적용 범위를 고정한다. |
| [A:1107](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1107) | Evidence.type.runtime | 실행 observation·시각·환경·producer attempt를 연결한다. |
| [A:1108](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1108) | Evidence.type.research | 외부 출처·관찰시각·만료/재검증 조건을 저장한다. |
| [A:1109](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1109) | Evidence.type.user | 명시 목표·요구·권한의 원문과 시점을 보존한다. |
| [A:1110](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1110) | Evidence.type.agent | 모델 판단 evidence이며 실제 실행/동등성 증명의 대체물이 아니다. |
| [A:1909](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1909) | FailureType.missed_activation | 과거 skip과 나중 실패의 인과 근거를 연결한다. |
| [A:1910](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1910) | FailureType.unnecessary_activation | 실질 가치와 필수 assurance를 평가한 후 낭비로 귀속한다. |
| [A:1911](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1911) | FailureType.bad_reasoning | 충분하고 유효한 context에서도 판단이 틀린 근거를 확인한다. |
| [A:1912](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1912) | FailureType.insufficient_context | 필요한 정보가 selector/budget에서 누락됐는지 manifest로 확인한다. |
| [A:1913](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1913) | FailureType.stale_context | 당시 사용한 evidence/dependency vector의 유효성 위반을 확인한다. |
| [A:1914](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1914) | FailureType.bad_decomposition | 분할/결합/경계가 실패를 만든 구조 근거를 확인한다. |
| [A:1915](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1915) | FailureType.integration_failure | 정확한 조합 tuple과 충돌 dimension 및 원인 lineage를 남긴다. |
| [A:1916](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1916) | FailureType.validation_gap | 필요 validator/시나리오/조합 의무의 누락 근거를 남긴다. |
| [A:1917](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1917) | FailureType.bad_policy | 당시 불변 정책 버전의 판단 오류를 재생하고 후보 수정에 연결한다. |
| [A:1967](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1967) | PolicyProposal.target.activation | 역할 trigger/weight/threshold/cooldown/quota 평가·shadow·승격 대상이다. |
| [A:1968](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1968) | PolicyProposal.target.context | selector·budget allocation·summary hierarchy 정책의 평가·승격 대상이다. |
| [A:1969](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1969) | PolicyProposal.target.validation | 필수 검증 coverage를 약화하지 않는 validator 선택 정책을 평가한다. |
| [A:1970](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1970) | PolicyProposal.target.decomposition | split/chunk의 비용·품질·scope 검증 정책을 평가한다. |
| [A:1971](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1971) | PolicyProposal.target.role | capability/prompt/schema/validator/lifecycle 정책을 평가한다. |
| [A:1972](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1972) | PolicyProposal.target.integration | 공유 boundary 탐지·조합 시나리오·통합 의무 정책을 평가한다. |
| [B:692](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:692) | ChangeSignature.scope.syntactic | 관찰 의미 view 보존 근거가 있을 때만 관련 cognition을 유지한다. |
| [B:693](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:693) | ChangeSignature.scope.implementation | 실제 behavior/implementation 소비 포트로만 전파하되 unknown은 보수 처리한다. |
| [B:694](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:694) | ChangeSignature.scope.behavior | 행동·오류·시간 제약의 소비 관계와 validation/integration을 따라간다. |
| [B:695](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:695) | ChangeSignature.scope.contract | required port·공유 contract·implements·integration 관계를 추적한다. |
| [B:696](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:696) | ChangeSignature.scope.dependency | 추가/제거/변경된 실제 input/resource/tool/environment binding을 전파한다. |
| [B:697](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:697) | ChangeSignature.scope.assumption | 해당 AssumptionVersion의 소비 node와 그 결과 의존에 전파한다. |
| [B:698](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:698) | ChangeSignature.scope.subgoal | 변경 subgoal subtree 및 외부 인과 관계의 영향만 계산한다. |
| [B:699](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:699) | ChangeSignature.scope.goal | 승인 objective 변화의 관련 계층·derived/assumes/depends 관계를 재검토한다. |
