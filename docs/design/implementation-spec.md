# 두 원문 전체를 적용하기 위한 구현 명세

상태: 구현 전 명세. 이 문서의 `필수`, `추가`, `변경`은 앞으로 구현할 요구사항이며 완료 보고가 아니다.

기준 저장소: `d21904656c9c2135ed66c68ed15cef8d5820c9ae`. 원문 A는 [Energy-Efficient Graph Agent Architecture](energy-efficient-graph-agent.md), 원문 B는 [Adaptive Task Replanning](adaptive-task-replanning.md)이다. 사용자 첨부를 바이트 그대로 보존한다. A는 2,479논리행, B는 2,518논리행이다. 마지막 개행이 없으므로 `wc -l`은 각각 한 줄 작게 표시한다.

원문을 일부 원칙으로 축약해 구현 범위를 줄이지 않는다. [원문 순서별 구현 대응](source-implementation-map.md)은 모든 절의 의미·변경점·수용 조건을 분리한다. [A 줄별 대응](energy-line-ledger.md), [B 줄별 대응](replanning-line-ledger.md)은 빈 줄, 수식의 조각, 코드 필드, 예시까지 원래 순서로 보존하여 해당 구현 요구사항에 연결한다. 반복되는 결론도 누락하지 않고 같은 불변조건을 재확인하는 것으로 처리한다. 줄 수를 기능 수로 세지 않는다.

<a id="spec-1"></a>

## 1. 기존 구현과 교체 범위

현재 실제 실행 경로는 호스트 릴레이 → OpenCode `task-manager` → Graph MCP → `TaskGraphEngine`/SQLite → native worker 또는 Kubernetes instance이다. `packages/task-orchestrator`의 과거 루프만 수정해서는 이 경로의 동작이 바뀌지 않는다.

`packages/opencode-harness/src/agents.ts`의 `MANAGER_PROMPT`는 OpenCode에 오케스트레이션을 맡긴다. `graph-mcp.ts`의 `task_start`는 scheduler 예약으로, `task_instance_create`는 instance 생성으로 이어진다. `TaskGraphEngine.resolveRunnable()`은 전체 태스크를 순회하며 준비 상태를 갱신한다. `startTask()`는 역할 존재·의존성·상태를 확인하지만 신호에 근거한 역할 활성화, 추론 수준, 컨텍스트 예산을 강제하지 않는다. 이 권한 구조를 교체한다.

기존 `signals.ts`의 입력 스냅샷, 실제 코드 해시, 변경 신호 병합, 실행 토큰 fencing, 실제 종료 확인, 지연 결과 채택은 유지할 기반이다. `revisions.ts`의 버전 계보와 정확한 결과 재사용, `feedback.ts`의 원인 artifact 추적, `scheduling.ts`의 파일 범위 잠금, integration engine의 버전 고정 검증도 유지한다. 다만 이 기능들이 의미론적 인과 그래프, 경계 증명, 정책 학습을 이미 구현했다는 뜻은 아니다.

`task-context`는 관계를 따라 정보를 모으지만 역할별 강제 예산과 무효화 벡터가 없다. `Role`은 현재 prompt 성격의 메타데이터이며 활성화 정책·출력 스키마·검증자·승격 상태가 없다. `Learning` 저장은 지식 기록이지 실행 정책의 검증·승격 시스템이 아니다. instance stage cache는 전역 입력 digest를 포함하므로 단계별 의미 의존성과 구별해야 한다.

### 1.1 목표 실행 경로

```text
사용자 요청 / 파일·외부 상태·검증·실행 결과 변화
  → durable event + state transaction
  → signal extraction + expected/actual comparison
  → deterministic preflight + evidence
  → typed causal propagation + boundary proof
  → scoped repair/replanning region 또는 preserve
  → task eligibility → role activation policy → precision/context allocation
  → activation grant + resource reservation
  → native / Kubernetes role execution
  → structured result + actual read/write manifest
  → deterministic validation → necessary joint integration
  → conditional result/plan commit → expectation reconciliation
  → outcome attribution → batch/critical meta evaluation → shadow policy learning
```

이 경로는 안내용 prompt가 아니라 실행 허가를 발급하는 유일한 경로다. 호출자가 `task_start`, `instance_create`, `reopen`, 전체 계획 덮어쓰기로 이를 건너뛸 수 없어야 한다. 비영향 태스크에는 실행 허가를 만들지 않는다. 영향 태스크라도 역할별 필요 조건이 없으면 모델을 호출하지 않는다.

<a id="spec-2"></a>

## 2. 모듈 경계와 책임

아래 파일은 신규 구현 위치 제안이다. 기존 파일과 혼동하지 않도록 모두 `신규`로 표시한다. 작은 함수만 기존 엔진에 붙여 중앙 객체를 계속 키우지 않는다.

- **CP 이벤트·상태**: 신규 `packages/task-control/src/{runtime,event-consumer,outbox,admission,completion}.ts`. 이벤트 소비·투영·활성화 허가·일관성 있는 완료 게이트를 담당한다. `apps/task-agent/src/graph-runtime.ts`가 이 런타임을 생성한다. LLM과 SDK 의존성을 갖지 않는다.
- **CG 인과·예측·경계**: 신규 `packages/task-causality/src/{model,extract,prediction,propagation,boundary,regions,replan,granularity}.ts`. 인과 edge, 실제 관찰, 변경 분류, 가중 전파, 경계 증명, 범위 선택 및 계획 patch 검증을 담당한다. `task-engine/signals.ts`, `revisions.ts`, `feedback.ts`는 여기에 생성·변경 사실과 기존 버전 토큰을 연결한다.
- **AP 활성화·역할**: 신규 `packages/task-cognition/src/{roles,activation,precision,obligations,escalation}.ts`. 역할 버전, hard/soft 정책, 휴면 상태, L0–L5, review obligation 및 escalation을 결정한다. scheduler는 결정된 허가의 자원 예약만 담당한다.
- **CM 컨텍스트·기억**: `packages/task-context/src/index.ts`를 context manifest 진입점으로 변경하고 신규 `{selectors,budget,memory,dependency-vector}.ts`로 분리한다. 모든 컨텍스트 확장은 같은 게이트를 거친다. 의존성 없는 검색·전역 이력 덤프를 기본 경로에서 제거한다.
- **EV 증거·검증·통합**: 신규 `packages/task-evidence/src/{store,validators,confidence,risk}.ts`; 기존 `packages/integration-engine/src/index.ts`에 artifact/contract boundary index와 통합 obligation 생성을 연결한다. code snapshot·stage manifest의 실제 해시 검증은 재사용한다.
- **PL 학습·평가**: 신규 `packages/task-policy/src/{schema,versions,attribution,learning,replay,shadow,metrics}.ts`. 실행 시점 정책 고정, 구조적 규칙 DSL, 결과 귀속, 후보→shadow→검증→활성, 롤백, 예산 내 replay를 담당한다.
- **EX 실행 어댑터**: 기존 `packages/opencode-harness/src/{agents,server,graph-mcp}.ts`, `packages/task-instances/src/{types,worker,controller,manager,stage-cache}.ts`, `scripts/instance-model-stage.ts` 변경. 허가 없는 세션 생성·추론·쓰기·결과 채택을 차단한다. 호스트 릴레이는 요청 전달과 관찰을 맡는다.
- **ST 저장**: `packages/task-domain/src/index.ts`에 공개 타입/호환 타입을 추가하고 `packages/task-store/src/index.ts`에 정규화된 새 테이블과 마이그레이션을 추가한다. 내부 모델은 위 패키지가 소유한다. `package.json`의 package imports와 실제 런타임 조립도 갱신한다.

이하 각 절의 `CP/CG/AP/CM/EV/PL/EX/ST`는 이 위치를 뜻한다. 기존 엔진의 상태·artifact 버전 할당은 유지하되 새 제어 계층을 통하지 않는 public mutation에는 서버 측 정책 검증을 넣는다.

<a id="spec-3"></a>

## 3. 저장 모델과 불변조건

### 3.1 태스크·계획·인과 그래프

원문의 `Task`와 `PlanNode`를 한 JSON 문자열로 덧붙이지 않는다. 실행 태스크의 stable identity, 불변 specification revision, attempt, plan membership, 예측 상태를 분리한다.

`TaskSpecVersion(taskId, specVersion)`에는 `title/objective`, goal/subgoal/action 계층, acceptance criteria, input/output port schema, 가정 참조, 결정 참조, 증거 참조, 검증 규칙, boundary membership, write scope, context policy version을 저장한다. `TaskRuntime(taskId)`에는 현행 specVersion, 상태, confidence/risk/prediction 상태의 version reference만 둔다. 원문 `version`은 이 의미들을 혼용하지 않도록 구체화한다.

원문 상태 created/ready/running/blocked/review/completed/failed는 현재 pending/ready/running/blocked/implemented+검증대기/verified·integrated/failed로 의미 대응한다. `stale`은 현재 결과가 최신 입력에 대해 유효하지 않음을 뜻한다. `verified`만으로 전체 목표 완료를 선언하지 않는다. 부모 children/dependencies/artifacts 목록은 정규화 참조로 조회하며 중복 저장으로 불일치를 만들지 않는다.

`PlanNodeVersion(planId, revisionId, nodeId)`에는 objective, expectedOutcomeRef, actualOutcomeRef, assumptions, boundaryContractRef, status, predictionErrorRef, invalidationEvidenceRefs, taskSpecVersion을 저장한다. `PlanRevision`은 append-only이며 이전 계획을 삭제하지 않는다. title/stage 설명 편집과 실행 의미 변경은 별도 fingerprint를 가진다.

`CausalEdgeVersion(edgeId, version)` 필수 필드:

```ts
interface CausalEdgeVersion {
  edgeId: string; version: number;
  source: EntityPortRef; target: EntityPortRef;
  relation: "depends_on" | "blocks" | "implements" | "validates"
    | "integrates_with" | "generated_from" | "supersedes"
    | "shares_contract" | "shares_resource" | "assumes" | "conflicts_with"
    | "derived_from" | "constrained_by" | "implements_goal";
  changeTypes: ChangeScope[];
  impactWeight: number;
  observedPropagationRate: { successes: number; trials: number; estimate: number; modelVersion: string };
  critical: boolean;
  dependencyView: string;
  evidenceRefs: EvidenceRef[];
  completeness: "declared" | "observed" | "verified" | "unknown";
}
```

방향은 source의 변화가 target을 무효화할 수 있다는 뜻이며 **생산자→소비자**로 통일한다. `shares_*`, conflict는 필요 방향을 명시한 두 arc 또는 공통 resource/contract node로 정규화한다. hierarchy edge와 execution dependency edge를 구별한다. `supersedes`는 역사 계보이며 임의로 실행 전파하지 않는다. 원문 A/B의 모든 relation을 허용하되 관계별 전파 의미가 없는 무제한 문자열 edge는 거절한다.

실행 순서는 DAG로 유지한다. 일반 인과 그래프는 cycle을 허용하고 visited `(entity, changeScope, graphVersion)`와 최대 영향도 갱신으로 수렴시킨다. 순환 실행이 필요한 경우 SCC를 하나의 통합 계산 단위로 만들고 고정점·종료 검증을 요구한다. 그것이 없으면 실행 DAG에 cycle을 커밋할 수 없다.

### 3.2 증거·예측·경계

`EvidenceVersion(id, version)`은 원문의 type(test/code/document/runtime/research/user/agent), source, confidence, timestamp, contentHash 전부와 producer attempt, exact artifact/contract/environment refs, validator version, expiry, provenance, observedAt를 갖는다. `agent` 증거만으로 코드 실행·테스트 통과를 대체하지 않는다. 외부 사실은 출처·관찰시점·유효기간 또는 재검증 조건이 있어야 한다.

`DecisionVersion`은 conclusion, evidenceRefs, confidence, assumptionRefs와 validated/executed/invalidated 상태를 갖는다. `AssumptionVersion`은 명제, 적용 범위, 검증자, 근거, valid/invalid/unknown 상태와 참조 consumer index를 갖는다. learning note의 문자열을 이것으로 자동 간주하지 않는다.

`ExpectationVersion(taskSpecVersion, expectationVersion)`은 expectedArtifacts(종류·포트·schema·수량/조건), expectedInterface(contractRef), expectedBehavior(검증 가능한 제약), expectedDependencies(포트·가정·환경), expectedRisk를 **실행 전에** 고정한다. 환경 예상도 의존성으로 포함한다. `ObservationVersion`은 실제 artifact/contract/behavior test/resource/runtime/environment 결과와 unknown을 보존한다. 결과를 본 뒤 기대치를 덮어써 오차를 0으로 만들 수 없다.

`PredictionErrorVersion`은 expected/actual refs, C/B/D/G 각 정규화 거리, risk residual, aggregate SPE, uncertainty, violatedInvariantRefs, evidenceRefs, calculatorVersion, observedAt를 저장한다. risk residual은 라우팅 입력이며 원문 SPE의 C/B/D/G를 몰래 바꾸지 않는다.

`PlanningBoundaryVersion`은 region membership, 외부 관찰 포트, boundary invariant refs, 외부 read-binding index와 completeness evidence를 가진다. `BoundaryProof`는 before/after boundary version, projection hashes, 모든 외부 consumer binding, 검증자와 근거, graph/input version vector, verdict preserved/broken/unknown, expiry를 기록한다. `compatible: true` 문자열은 preserved proof가 아니다.

### 3.3 역할·실행·허가

`RoleVersion(roleId, version)`은 purpose, capabilities, promptRef, activationPolicyRef, requiredContext selectors, outputSchemaRef, validators, allowedTools/constraints, lifecycle candidate/temporary/validated/persistent, 근거와 평가 결과를 갖는다. 역할 정의 버전과 worker 인스턴스 ID를 분리한다. Architect/QA/Researcher/Critic/UX/Implementation/Security/Performance/Integration을 기능별 초기 catalog로 등록하되 등록이 곧 실행은 아니다.

`AgentRun`은 roleVersion, taskSpecVersion/region, dormant/candidate/active/waiting/completed 상태, activationDecisionRef, grantId, attempt token, start/end, cost/outcome refs를 갖는다. 완료된 run은 completed로 남기고 역할의 다음 실행 가능 상태는 dormant로 돌아간다. role별 여러 인스턴스를 허용한다. waiting은 모델 반복 호출이 아니라 자원·증거·외부 완료를 기다리는 durable 상태다.

`ActivationDecision`은 signalSnapshot, task eligibility, role version, hard trigger matches, soft feature values/weights/score/threshold, cooldown/quota 판단, activate/skip/defer, 이유, policy version을 기록한다. skip도 첫 클래스다. 영향 밖 역할은 후보를 인덱스로 만들지 않되 정책 catalog version과 exclusion 범위를 저장하여 당시 평가 모집단을 재구성한다.

`ActivationGrant`는 단일 사용 서버 발급 capability이다. task/region, spec/revision/input/graph/policy/role versions, reason evidence, precision profile, contextManifest hash, tool/read/write 범위, budget reservation, obligation IDs, worker binding, expiry, fencing generation을 묶는다. 클라이언트는 grant의 risk/role/context를 임의 재정의하지 못한다. lease 범위를 벗어난 MCP 요청·파일 접근·결과 제출은 서버/worker에서 거절한다.

`ReviewObligation`은 요구 근거, 대상 artifact/contract version tuple, validator/role, mandatory, state pending/running/satisfied/failed/deferred, evidence를 저장한다. task implementation attempt와 QA/Critic/Integration run은 다른 엔티티다. 검토를 위해 이미 완료된 implementation task를 다시 running으로 만들지 않는다.

### 3.4 SQLite 및 트랜잭션

논리 store는 Task/Knowledge/Evidence/Policy/Execution/Artifact 여섯 영역으로 나누고 초기 물리 저장소는 기존 SQLite를 사용한다. graph DB 도입은 요구사항이 아니다. 최소 새 테이블 묶음은 다음과 같다.

- 인과/예측: `causal_edges`, `causal_edge_versions`, `task_ports`, `assumptions`, `decision_versions`, `task_expectations`, `task_observations`, `prediction_errors`, `planning_boundaries`, `boundary_proofs`, `replan_regions`, `replan_leases`, `routine_versions`.
- 인지/증거: `evidence_versions`, `validation_obligations`, `role_versions`, `agent_runs`, `signal_snapshots`, `activation_decisions`, `activation_grants`, `context_manifests`, `cognitive_records`, `cognitive_dependencies`.
- 이벤트/학습: `event_outbox`, `event_consumers`, `event_effects`, `policy_versions`, `policy_heads`, `policy_proposals`, `policy_evaluations`, `outcome_labels`, `propagation_observations`, `execution_costs`, `budget_reservations`, `replay_jobs`.

각 참조에는 외래키 또는 커밋 시 동등한 검증을 둔다. 버전 테이블은 insert-only, 현행 head만 CAS 변경한다. outgoing/incoming edge, port consumer, assumption consumer, boundary external bindings, memory dependency, unconsumed event, unresolved obligation에 인덱스를 둔다. 기존 task_attempts의 state는 JSON payload에 있으므로 존재하지 않는 SQL state column을 조회하는 코드를 작성하지 않는다. 필요한 상태 인덱스를 추가할 때는 명시적 마이그레이션과 backfill을 한다.

상태 변경+domain event+outbox는 같은 SQLite transaction이다. consumer는 `(consumerId,eventId,policyVersion)` 처리 키로 멱등 효과를 기록한다. DB cursor만 먼저 전진시켜 이벤트를 잃으면 안 된다. 외부 SDK/Pod 생성은 transaction 밖에서 수행하고 transactional reservation/outbox와 immutable execution key로 재조정한다. 네트워크 exactly-once를 가정하지 않는다. 재시도해도 실행 키 하나에 활성 worker 하나만 채택한다.

<a id="spec-4"></a>

## 4. CP: 사건이 계산을 깨우는 실행 제어

모든 의미 상태 mutation은 event를 남긴다. 원문 event 종류 TaskCreated/Updated/Completed, ArtifactChanged, DependencyChanged, ValidationFailed, IntegrationRequired, AgentCompleted, PolicyUpdated 외에 RequirementChanged, ConfidenceDropped, ExternalObservationChanged, StopObserved, BudgetAvailable, ReplanCommitted 등을 타입화한다. envelope는 id,type,entityId,timestamp,payload,causationId,correlationId, schemaVersion, monotonic sequence를 갖는다. causation은 직전 원인, correlation은 사용자 목표/변경 episode이다.

파일 변경을 바로 LLM 호출로 연결하지 않는다. 변경 감지자는 실제 snapshot diff를 만들고 extractor가 changedFiles/symbols/interfaces, failingTests, affectedDependencies, uncertainty/risk/integrationRisk, externalKnowledgeRequired, semanticChange를 계산한다. AST/타입/도구가 판정하지 못하면 unknown을 남긴다. 파일명 하드코딩으로 역할을 켜지 않는다.

consumer는 해당 entity의 관계 인덱스만 조회한다. `resolveRunnable()`을 모델이 반복 호출하며 일감을 찾는 경로를 없애고 ready projection/queue를 유지한다. startup recovery와 운영 상태 polling은 허용하되 polling 자체는 reasoning event가 아니다. evidence expiry/cooldown 종료는 실제 정책상 상태가 바뀌는 durable timer event이며 무조건 모델 wake-up이 아니다.

각 event에서 이미 검증된 동일 dependency vector의 결과가 있으면 L0 채택한다. 없으면 필요한 결정론적 validator를 L1 실행한다. 모든 필요한 obligation이 해소되면 모델 호출 없이 완료하거나 계획 보존을 기록한다. 미해결 판단만 AP로 보낸다. 제어 엔진은 LLM에게 ID 생성·상태 전이·버전 증가·잠금·무효화를 위임하지 않는다.

부트스트랩의 사용자 자연어 요청은 user evidence가 있는 새 목표 event이다. 규칙만으로 불충분한 해석/분해에 한해 bounded planning role grant를 만든다. 기존 작업에서 의미 변화가 없는 후속 요청은 캐시된 상태 설명으로 답할 수 있다. 사용자 승인 정책은 기존 승인과 명시적 사전 권한을 존중한다.

<a id="spec-5"></a>

## 5. CG: 예측오차와 의미 변경

실행 전 기대치와 실제 관찰을 동일 port/schema로 투영한다. contract distance C는 required fields/types/protocol의 차이, behavior B는 명시 제약/시나리오의 차이, dependency D는 실제 read set/가정/환경 binding의 차이, goal/assumption G는 승인 objective/가정의 차이로 계산한다. 각 거리의 단위·분모·missing 처리·validator version을 고정한다. `SPE = wc*C + wb*B + wd*D + wg*G`에서 가중치는 비음수이며 정규화한다. unknown은 0이 아니다. evidence로 해소하거나 보수적 의무를 생성한다.

ChangeSignature는 원문의 syntactic/implementation/behavior/contract/dependency/assumption/subgoal/goal, magnitude, confidence를 모두 갖는다. 한 변경이 복수 scope를 가질 수 있으므로 내부적으로 scope 집합과 각각의 근거를 저장한다. A의 semantic/interface/behavioral/architectural cache classification은 B scope와 명시적으로 매핑한다. interface→contract, behavioral→behavior, architectural→dependency/subgoal/goal 및 boundary 구조 변화이다. 단순 rename이라도 reflection/export/serialization에 쓰이면 syntactic으로 단정하지 않는다.

오차가 낮고 hard violation/unknown obligation이 없으면 계획을 보존한다. 의미 있는 오차는 영향 계산으로 보낸다. critical invariant 위반은 SPE가 작아도 전파·검증한다. 원문 `<`, `>`, `>=`가 절별로 달라 경계값 규칙을 정책 schema에 명시한다. 기본은 `enter` 초과 진입, `exit` 미만 안정 복귀이며 정확히 같은 값은 현재 모드를 유지한다. critical trigger는 이 규칙을 우회하여 반드시 처리한다.

목표 변경은 goal 참조 consumer와 관련 subtree, subgoal 변경은 해당 subtree와 외부 인과 관계, assumption 변경은 참조자, contract 변경은 실제 port consumer와 공유 경계, implementation 변경은 실제 관찰되는 동작 의존성으로 보낸다. 변경 종류별 반경 순서는 일반 경향이며 고정 크기 보장이 아니다. 단일 고공유 implementation 변경이 작은 subgoal 변경보다 넓을 수 있다.

<a id="spec-6"></a>

## 6. CG: 정리가 성립하는 인과 전파

### 6.1 Locality의 구현 전제

원문 B 9–10절의 `O_v=f_v(I_v, predecessors)`를 쓰려면 **모든 영향 입력**이 기록되어야 한다. 소스 포트뿐 아니라 tool/version/model/policy, 환경 변수 중 실제 참조값, clock/random/network/external resource, 가정, 사용자 목표도 입력이다. f의 버전이나 자신의 I가 바뀌면 그것도 change source다. LLM의 재실행 결과가 동일하다는 주장을 하지 않는다. 유효한 기존 결과를 다시 실행할 필요가 없다는 정책이며, 확률·외부 동작은 명시 입력/유효기간 또는 unknown으로 다룬다.

read manifest는 선언 입력과 실제 관찰을 합친다. worker sandbox와 MCP gateway가 허가된 파일·증거·tool 접근을 기록한다. 외부 shell/네트워크를 관찰·제한하지 못하는 adapter는 completeness=unknown으로 표시한다. 이 경우 관계 누락을 근거로 외부 태스크를 안전하다고 증명하지 못한다. 보수적 dependency view로 넓히거나 경계 검증을 수행한다. 실제 사용하지 않은 선언 dependency를 지우는 일도 학습 검증을 거친다.

완전한 DAG에서 변경 source 집합 X로부터 도달 불가능한 v는 topological induction으로 기존 결과를 유지한다. 이 증명을 실행 결정의 `preservationReason`에 graphVersion/inputVector와 함께 남긴다. 그래프 불완전성·f 변경·외부 입력 변경이 있으면 전제가 깨졌음을 기록하고 이 정리를 적용하지 않는다.

### 6.2 Typed propagation

```text
syntactic       → 해당 view를 읽는 derived/generated 결과; 의미 불변 증거가 없으면 implementation도 포함
implementation  → 실제 behavior/implementation 소비 포트, 관련 validators
behavior        → depends_on, validates, integrates_with, 관련 constraints
contract        → depends_on, shares_contract, implements, integrates_with, validates
resource        → shares_resource, conflicts_with (dependency/behavior scope로 정규화)
assumption      → assumes 및 그 결과의 소비 관계
subgoal/goal    → implements_goal, derived_from, assumes, depends_on, 해당 hierarchy
```

A에서 추가된 blocks/generated_from/supersedes도 relation registry에 전파 semantics가 있어야 한다. blocks는 readiness, generated_from은 lineage input, supersedes는 현행 view 교체로 해석한다. 단지 relation 이름이 있다는 이유로 모든 scope를 모든 edge로 전파하지 않는다.

먼저 critical/required graph를 계산한다. critical edge는 weight 1이고 skip할 수 없다. 비critical 추측 재검토에는 `delta[x]=1`, `delta[v]=max(delta[u]*w[u,v])`를 사용한다. 소스별 magnitude는 별도 SPE이며 임의로 원문의 delta 정의를 바꾸지 않는다. delta가 커질 때만 재큐잉하고 [0,1] 범위를 검증한다. cycle에서도 단조 수렴하며 1 cycle은 visited로 반복을 멈춘다. 실수 오차 정책과 iteration 상한은 명시하고 상한 초과를 preserved로 처리하지 않는다.

임계치 미만은 speculative replan을 보류할 수 있지만 유효성 검사 의무와 unknown dependency를 없애지 못한다. hard constraint(type/security/schema/required interface/transaction/explicit user requirement)는 확률화하지 않는다. propagation trace에 방문 edge, 통과/차단 이유, 영향도, 정책 버전, 근거를 기록한다.

### 6.3 Boundary containment

경계의 외부 observable contract는 타입 선언뿐 아니라 소비자가 실제 의존하는 behavior, data shape, error semantics, 시간/순서, 자원 제약과 가정을 포함한다. 외부 consumer가 내부 파일을 직접 읽으면 그 read도 contract projection에 포함하거나 경계 보존을 인정하지 않는다.

`preserved` 판정은 before/after의 **완전한 외부 projection 값**이 같고 외부 binding이 전부 그 projection만 읽는 경우다. exact finite data/schema projection은 canonical equality로 비교한다. 일반 프로그램의 모든 동작 동등성은 코드 해시나 유한 테스트만으로 증명하지 못한다. 완전성을 증명할 수 없는 behavioral boundary는 `unknown`이며 추가 검증/전파 대상이다. 특정 시나리오 범위에서만 동등하면 그 범위 한정 proof와 consumer binding을 사용한다.

원문 `I(S')=I(S)`와 `compatible`을 구분한다. compatible 타입 변경이 있어도 consumer expectation이나 비기능 동작이 변하면 검토가 필요하다. preserved proof는 해당 change scope/port/version에만 적용하며 다른 변화까지 차단하지 않는다.

원문 B73의 `CausalClosure ∩ UnpreservedBoundaries`는 node 집합과 boundary 집합을 직접 교차할 수 없으므로 구현에서는 **보존 증명된 외부 arc를 잘라낸 그래프의 source reachability**로 정의한다. boundary 내부의 변경 node는 남고 모든 보존된 출구 너머만 제외된다. 다른 비보존 경로로 도달하는 외부 node는 여전히 포함한다.

<a id="spec-7"></a>

## 7. CG: 국소 재계획과 계획 안정성

### 7.1 복구 영역과 비용

계획 변경을 발견한 뒤 바로 새 계획을 요청하지 않는다. leaf action repair → task revision → subgoal region → goal region 순으로 invariant 복구 가능성을 확인한다. 각 실패에는 violated invariant, 시도한 repair, 실패 증거가 필요하다. 단순 높은 오차는 상위 wake-up 충분조건이 아니다. 부모 error는 max 또는 설정된 weighted aggregation으로 집계하지만 해당 지역에서 복구할 수 없을 때만 부모의 재계획 obligation을 만든다.

LCA는 hierarchy candidate 하나다. 변경 node와 필요한 consumer, boundary membership, 교차 통합 관계로 **허용 가능한 region 후보 집합**을 생성한다. 후보는 목표 요구사항 충족, 인과 closure 완전성, 외부 invariant 복구, immutable node 보존, 자원/실행 안전성 조건을 통과해야 한다. `Cost(region)`은 계획·추론·context·중단/재실행·통합 검증·예상 실패 비용을 같은 단위로 정규화한다.

원문의 argmin은 자동으로 성립하지 않는다. 등록된 finite boundary 및 필요한 connected unions에 대해 cost 하한 순 branch-and-bound로 feasible minimum을 찾는다. 작은 테스트 그래프는 전수 oracle과 대조한다. 탐색 예산이 끝나 최적성 gap이 남으면 `minimumProven=false`와 gap을 남기고 추가 탐색을 기다린다. 안전상 즉시 복구가 필요하면 feasible 후보를 사용할 수 있으나 전역 최소라고 표시하지 않는다. 전체 가능한 프로그램/계획의 최적성까지 주장하지 않는다. candidate domain과 비용 모델에 대한 최적성만 검증 가능하다.

`Ckeep=ExpectedFailure(P)`, `Cswitch=ReplanningCost+ExecutionChangeCost+ExpectedFailure(P')`와 `ExpectedGain>SwitchingCost`를 같은 utility 단위로 평가한다. 개선 추정의 근거·불확실성을 기록한다. 현재 계획이 critical requirement를 어기면 단순 저비용이라는 이유로 keep할 수 없다. 실행 중단, 폐기될 완료 작업, warm session 손실, 데이터 이동도 switch cost에 포함한다.

hysteresis state는 boundary별 stable/replanning/stabilizing으로 영속화한다. enter>exit를 schema로 강제한다. 예시 0.7/0.3은 기본 상수가 아니라 calibration fixture다. 계획을 고친 직후 expectation을 관찰값에 맞춰 바꾸고 안정이라고 하는 것을 금지한다. 새 기대치는 유효한 목표/contract 제약을 계속 만족하고 재검증 관찰로 오차를 계산해야 한다.

### 7.2 여러 변화와 실행 중 계획 변경

변경 episode마다 base graph/revision/input vector를 고정한다. source closure들의 overlap graph를 만들고 연결 성분별로 region을 병합한다. 단순 node overlap 외에 같은 boundary/resource/contract를 쓰는 충돌도 포함한다. 독립 region은 병렬 처리하되 write lock과 global capacity는 계속 적용한다.

변경 도중 더 새로운 event가 오면 오래된 lease에 새 결과를 커밋하지 않는다. 동일 episode로 coalesce하거나 lease generation을 fence하고 새 closure를 계산한다. 영향을 받지 않은 native/Pod worker는 계속 실행한다. 영향받은 worker는 기존 stop protocol을 통해 실제 종료를 확인한 후 대체 실행한다. stop 요청만으로 lock을 반환하지 않는다. stale/late result는 격리 저장하고 현행 plan을 완료시키지 못한다.

### 7.3 Committed prefix와 immutable decision

verified/executed이면서 변경 dependency와 무관하고 실제 artifact가 유지된 node·decision은 immutable set에 들어간다. 시간상 과거라는 이유만으로 항상 유효한 것은 아니다. 나중에 발견된 security/assumption/requirement evidence가 있으면 명시적 invalidation record를 만들어 재개할 수 있다. `reopenTask(taskId, reason: string)` 단독 경로는 evidence-based invalidation API로 교체한다.

기존 plan reuse key와 snapshot equality는 prefix 보존의 기초로 쓴다. runtime에서 동적으로 생성된 자식도 preserved owner와 함께 closure상 검사하여 보존한다. 계획 node ID에 없는 자식이라는 이유로 일괄 fence하지 않는다. 보존된 artifact/decision version은 이전 값 그대로 참조하고 요약을 다시 생성하여 의미를 바꾸지 않는다.

### 7.4 Replanner 계약

입력은 goal reference, boundary graph region, changedNodes, invalidatedNodes, preservedNodes, immutableDecisions, predictionErrors, violatedInvariants, evidence 전부와 scoped lease/base versions이다. outside node는 외부 port/불변조건에 필요한 최소 summary만 읽기 가능하다.

출력은 revisedTasks, newTasks, removedTasks, newDependencies, preservedDecisions, invalidatedAssumptions, expectedOutcomes, confidence 전부를 구조화한다. LLM이 영구 ID/버전을 만들지 않고 proposal-local ID를 제출하면 control plane이 할당한다. removed는 현행 plan membership에서 제외이며 역사 삭제가 아니다. patch에는 변경 이유와 evidence가 있어야 한다.

서버는 lease scope, immutable set, base revision CAS, 요구사항 coverage, 그래프 DAG/참조 무결성, 새 edge의 외부 영향, 기대치 충족 가능성, 역할/도구 권한, write scope 충돌을 검증한다. 영역 밖 새 dependency가 필요하면 patch 전체를 무조건 적용하지 않고 증거를 포함한 escalation proposal을 만든다. 수정된 계획을 임시 revision으로 검증한 뒤 commit한다. 실제 코드 통합 검증이 아직 불가능하면 pending obligation 상태이며 완료가 아니다.

<a id="spec-8"></a>

## 8. AP: 역할 활성화와 적응형 추론

task sparsity를 먼저 적용하고 role sparsity를 다음 적용한다. 후보 task는 causal repair region 또는 새 요청/필수 검증 의무에서만 나온다. AP는 `S=wR*R+wU*U+wD*D+wF*F+wI*I`를 계산하고 role별 threshold와 hard trigger를 평가한다. feature의 정규화, 값의 provenance, policyVersion을 고정한다.

QA의 test/integration failure, Architect의 architectural invariant violation, Research의 required external fact는 원문 hard trigger로 등록한다. public API/shared dependency/high risk, module boundary/dependency direction/new infrastructure, unfamiliar/version-dependent facts는 soft feature이다. Critic은 높은 confidence+약한 evidence, 높은 risk, architecture/irreversible decision, 반복 실패에서 활성화한다. QA는 테스트 실행기와 구분하여 누락 시나리오·의미 변화·미검증 조합을 찾는다.

cooldown과 maxInvocationsPerTask는 반복 소모를 막는다. 같은 episode/role/policy에 중복 grant를 내지 않는다. hard trigger가 quota와 충돌하면 의무를 satisfied/skip으로 위조하지 않고 waiting/escalation 또는 허용 예산 증액 정책으로 처리한다. `maxInvocations`를 늘리는 행위 자체도 정책 버전 변경이다.

L0의 무계산은 새 도메인 추론·검증 실행이 없다는 뜻이다. 허가·해시·유효성 조회에 필요한 제어 연산까지 0이라는 뜻은 아니다. L0는 유효 캐시/불필요 계산, L1은 AST/type/schema/test/dependency/policy/constraint 검증, L2 cheap inference, L3 normal, L4 deep, L5 독립 역할의 adversarial review이다. L5를 같은 에이전트 한 번 더 부르는 것으로 구현하지 않는다. 독립 structured findings를 evidence store에 제출하고 conflicts를 integration/critic obligation으로 합성한다.

`ReasoningProfile`은 provider/model/capability, input/output/total budget, tool call cap, wall time, context policy, allowed escalation level을 갖는다. 실제 SDK가 지원하는 모델·추론 옵션을 capability handshake로 검증한다. 지원하지 않는 reasoning-effort 필드를 있다고 가정하지 않는다. 모델별 다른 profile이 없으면 L2/L4 구분을 구현했다고 선언하지 않는다. `steps`만 바꾼 것을 모델 정밀도 변화로 취급하지 않는다. 토큰 실측을 제공하지 않는 backend는 usage unknown으로 기록하고 strict budget 실행에는 부적격으로 처리한다.

escalation에는 unresolved question, failure/invariant evidence, 현 profile의 한계, 필요한 role/precision, 이미 수행한 deterministic checks가 필수다. `requiresEscalation=true`만으로 자동 상위 LLM을 호출하지 않는다. router가 근거를 검증하고 허가한다.

<a id="spec-9"></a>

## 9. CM: 국소 컨텍스트와 재사용 가능한 인지

### 9.1 selector와 예산

원문 context 집합 T/D/K/E를 task, 실제 relevant dependency ports, decisions/knowledge, evidence로 구성한다. target에서 role.requiredContext에 따라 edge를 탐색하고 참조 decision, 충돌 assumption, validation evidence 순으로 모은다. role별 relation filter/required fields/깊이와 maxTokens/maxDependencyDepth/maxEvidenceItems/maxHistoricalDecisions를 모두 강제한다.

budget은 실제 직렬화된 prompt, system/role/output schema/tool schema/출력 예약을 포함한다. model tokenizer가 없으면 검증된 보수 상한을 사용하고 추정임을 기록한다. 무작정 앞에서 자르지 않는다. 필수 goal/contract/critical invariant/evidence가 맞지 않으면 grant를 내지 않고 요약 검증·분할·상위 예산 판단을 한다. optional history부터 relevance에 따라 제외한다.

raw→artifact summary→task summary→subtree summary→project knowledge의 다섯 레벨을 유지한다. summary는 원본 content/version vector, 생성 역할/정책, 보존하는 필수 facts, 생략 범위와 검증을 갖는다. coarse-to-fine 확장 요청도 같은 selector/budget gateway로 처리한다. summary 텍스트 유사성을 의미 동등성의 근거로 쓰지 않는다.

`ContextManifest`는 포함/제외 item, 포트·버전·내용 해시, relevance 근거/path, summary level, required 여부, token allocation/actual, selector/policy version을 남긴다. failed run의 부족한 context와 오래된 context를 구분할 수 있어야 한다. pinned attempt 중 manifest를 조용히 바꾸지 않고 expansion revision을 기록한다.

### 9.2 memory와 cache

decision, analysis, test result, architecture reasoning, dependency summary, risk assessment, research evidence **각 종류**를 `CognitiveRecord`로 저장한다. assumptions/conclusions/unresolvedQuestions/evidenceIndex/dependencyVersion을 모두 보존한다. input key는 task spec view, relevant dependency view vector, evidence versions/validity, policy/role/validator/schema version의 canonical hash다.

각 record는 자신이 읽은 dependency를 `(entityId, port, semanticView, version, hash)`로 명시한다. 역인덱스로 변경된 view를 읽은 record만 무효화한다. architecture reasoning은 AST 식별자 rename만으로 폐기할 필요가 없지만 public boundary projection이 보존되었다는 근거가 있어야 한다. 구현 코드/실행 테스트 cache는 실제 bytes/environment/command/read set까지 일치해야 한다. 분류 모델이 syntactic이라고 말한 것만으로 실행 결과를 재사용하지 않는다.

unresolved question이나 expired research는 그대로 valid conclusion으로 재사용하지 않는다. assumption invalidation, policy rollback, evidence retract는 관련 인지 record에 전파한다. 일부 conclusion만 유효하면 reasoning state의 영향 slice만 재계산한다. context retrieval 횟수를 useful decision 증가로 세지 않는다.

instance stage key는 전체 graph snapshot 대신 **그 단계가 소비한 input view digest**, command/image/env/tool version, declared+observed reads, 이전 단계 result keys를 사용한다. 이를 검증할 수 없는 legacy stage는 기존 전체 digest로 보수적으로 동작한다. manifest checksums와 declared output restore, 실제 code snapshot 증명은 유지한다. source workspace를 복구한 것과 유효한 실행 결과를 재사용한 것을 구분한다.

<a id="spec-10"></a>

## 10. EV: 결정론적 검증·통합·완료

validator registry는 AST, typecheck, schema, unit/integration tests, dependency constraints, policy rules, constraint solver를 등록한다. 무조건 전부 돌리지 않고 change scope와 obligation이 요구하는 validator를 선택한다. validator spec은 command/tool version, inputs, expected result schema, resource/time budget을 갖는다. 실제 실행 receipt, stdout/stderr artifact hash, exit status, 검증 범위를 evidence에 연결한다. assertion이 검증 범위를 넘지 않게 한다.

Integration Graph는 versioned artifact/output node와 integration relationship으로 유지한다. 공유 boundary를 둘 이상의 독립 task output이 바꾸면 `(boundaryVersion, exact member output tuple)`로 IntegrationRequired를 멱등 생성한다. 하나만 바꿔도 required contract/consumer 조합은 검증 대상이다. 이미 통과한 정확한 tuple만 cache hit한다. 멤버 교체나 boundary 변화는 과거 pass를 무효화한다.

통합 검증은 behavioral/interface/data/temporal/error propagation/resource contention/semantic consistency 모두를 시나리오 또는 evidence obligation으로 표현한다. IntegrationResult는 compatible, conflicts, emergentRisks, requiredRework를 포함한다. merge 성공은 integration 성공이 아니다. conflicts는 feedback의 실제 lineage를 통해 원인 task와 repair region으로 연결한다.

confidence는 중요 dependency의 min을 기본 집계로 사용한다. weighted product는 수치 범위·가중치·상관 관계 가정을 명시한 별도 heuristic이다. risk의 `1-product(1-Ri)`는 독립 위험일 때만 확률 의미를 가진다. 독립성 미확인 상태에서는 min/max 보수 신호와 joint obligation을 사용하고 확률이라고 표시하지 않는다. parent error의 weighted product도 동일하게 calibration된 score로 구분한다.

완료는 다음 conjunction이다: 현행 목표/요구사항 유효, 실행 graph 일관성, 최신 input/attempt 채택, 모든 필수 boundary contract 검증, critical invariant 충족, 필수 role/통합 obligation 해소, unknown validation 없음, 유효 기대치에 대한 오차가 안정 threshold 아래, stop/transition/feedback 미해결 없음. 단순 태스크 목록 생성이나 자식 verified만으로 완료하지 않는다. 예산 부족으로 미뤄진 mandatory replay/review는 완료를 막는다.

<a id="spec-11"></a>

## 11. PL: 구조적 자기개선 전체

### 11.1 결과 귀속과 학습 가능한 대상

failure attribution은 missed_activation/unnecessary_activation/bad_reasoning/insufficient_context/stale_context/bad_decomposition/integration_failure/validation_gap/bad_policy를 모두 지원한다. propagation 과잉/누락도 하위 원인으로 기록한다. 한 실패는 복수 원인 가설을 가질 수 있으며 검증 근거와 confidence를 분리한다. 단순히 마지막 agent가 틀렸다고 귀속하지 않는다.

FP는 “새 finding이 없다”만으로 확정하지 않는다. required assurance를 만족한 QA의 무발견은 가치일 수 있다. evidence/decision/issue 변화, 필수 의무 해소, 실제 downstream outcome을 비교한다. FN은 과거 skip trace와 나중 실패의 실제 인과 경로를 연결한다. 호출했다면 반드시 막았을 것이라는 counterfactual은 관찰 사실과 분리한다. 미관측을 성공/실패 label로 만들지 않는다.

activation reward `alpha*V-beta*C-gamma*M`, propagation reward `DetectedImpact-alpha*ReplanningCost-beta*MissedImpact`를 개별 ledger로 계산한다. correctness floor/critical recall constraint를 통과한 후보끼리 비용을 비교한다. 토큰·시간·위험 값을 단위 변환 없이 더하지 않는다.

학습 대상은 원문 전체인 activation, context selection, decomposition, role definitions, validation rules, integration rules, escalation thresholds, cache policy, reasoning level selection에 **propagation, boundary formation, expectation model, task routine**까지 포함한다. A56의 proposal target 예시는 A54 전체를 담지 못하므로 enum을 확장한다. 어떤 target도 즉시 active 설정값을 덮어쓰지 않는다.

### 11.2 구조적 규칙과 policy lifecycle

규칙 DSL은 signal feature, relation kind, port semantic category, invariant kind, risk band, fanout, scope, evidence quality와 조합 연산을 허용한다. 특정 task ID/title/파일 이름 일치가 조건의 본질이 되는 규칙은 거절한다. evidence 참조에 실제 파일 이름이 있는 것은 허용한다. 파일 경로가 아니라 authentication boundary/session representation consumer 같은 구조를 학습해야 한다.

PolicyProposal은 target, observedPattern, rootCause, proposedInvariant, proposedRule, expectedBenefit, regressionRisk와 supporting cases, counterexamples, structural abstraction, holdout criteria, rollback condition을 갖는다. 후보 형식검증→historical replay→shadow→validated→active 순으로 승격한다. shadow는 실제 routing, context, cache hit, task graph를 바꾸지 않고 predicted decision을 기록한다. validated와 active를 합치지 않는다.

immutable policy version과 policy head를 분리한다. 모든 run/skip/context/replan이 당시 policy bundle version을 고정한다. rollback은 과거 version으로 head를 이동하는 새 event이다. 이미 실행된 외부 효과를 되돌렸다고 주장하지 않는다. 진행 중 run의 정책은 바꾸지 않고 필요하면 명시적 fence와 새 허가를 만든다.

human approval은 원문대로 **정책 옵션**이다. persistent role, critical policy, architecture decision, high-impact rewrite, security exception에 대해 configured authorization predicate를 평가한다. 사용자의 기존 권한을 적용하고 모든 후보에 새 승인을 요구하지 않는다. hard correctness invariant를 약화시키는 학습은 일반 reward 최적화 경로에서 금지한다.

### 11.3 역할·분해·경계 학습

role 생성에는 반복 specialized work, 기존 role capability 부족, 재사용 가능성이 모두 있어야 한다. candidate는 실행되지 않고 temporary는 제한된 grant로 평가한다. 독립 사례에서 효과·비용·기존 역할 중복이 검증되면 validated, 정책상 승인 후 persistent가 된다. dormant 상태를 유지하며 생성 즉시 상시 process를 띄우지 않는다.

분해는 Complexity+Parallelism+RiskIsolation-CoordinationCost와 관찰된 실패율 F/불확실성 U/재계획 빈도 R를 정규화하여 평가한다. 초기 과분해를 피하고 실행 중 새 복잡성 증거에서 split proposal을 만든다. running task split도 scoped revision/stop protocol을 거친다. 검증 가능한 독립 output/contract가 없는 분할은 거절한다.

routine merge는 함께 실행된 빈도, 충분한 관측 횟수, independent change rate의 불확실성, 공통 invariant, 외부 ports 보존을 확인한다. `P≈0`을 한두 번의 성공으로 결론내리지 않는다. routine version은 원래 member lineage, 내부 validation checkpoints, 내부/외부 dependencies를 보존한다. 자주 함께 실패하는 node는 joint boundary 후보, 독립적으로 바뀌는 부분은 separate boundary 후보가 된다. 경계를 옮긴 후 containment 증거와 외부 read bindings를 다시 검증한다.

predictive edge는 successes/trials와 당시 change class를 저장하여 `P(v changes | u changes)`를 추정한다. 재실행했다는 사실을 실제 semantic change로 오인하지 않는다. threshold로 안 본 node는 censored data다. 경로 곱은 조건부 독립 근사의 speculative score이며 증명이 아니다. critical edge는 관측 확률이 0이어도 hard로 남는다.

### 11.4 replay·평가·관찰

meta role은 모든 task 완료마다 실행하지 않는다. 완료 execution 수/실패 sample 수/분포 변화의 정책상 batch 조건 또는 중요한 실패 근거가 있을 때만 grant를 받는다. 원문의 20회는 예시이며 검증한 정책값으로 저장한다. meta도 동일 예산·출력 검증·휴면 규칙을 따른다.

historical replay는 당시 event, graph/input/context/evidence/policy snapshot을 재구성한다. 과거 정책과 후보가 activate/skip/region/context를 어떻게 다르게 선택했는지 비교한다. “QA would activate + 과거 integration failure”는 missed trigger를 줄일 후보 근거이지 QA가 실제 문제를 해결했을 증명은 아니다. sandbox 재실행이 필요한 outcome은 별도 허가/비용을 기록한다. production 도구 효과를 historical replay에서 실행하지 않는다.

prioritized replay는 error*impact*risk를 사용한다. optional replay는 예상 비용과 가치로 knapsack을 풀되 mandatory critical jobs를 먼저 reserve한다. 남은 budget으로 선택하고 tie-break/solver version을 기록한다. mandatory 비용이 budget을 넘으면 대기·증액·escalation이며 조용히 skip하지 않는다. 정확한 최적화가 불가능하면 feasible 선택과 optimality gap을 표시한다.

trace에는 Event→Signals→activated/skipped→context supplied→reasoning level→evidence→decision→cost/latency→outcome 전체를 남긴다. 비용은 context/reasoning/validation/coordination, task/replan/role별로 분리하고 measured/estimated/unknown을 구분한다. 유용성 numerator는 resolved risk/useful decisions/detected failures를 근거로 중복 제거한다. ThinkingDensity, activation precision/recall/F-beta-cost, adaptation efficiency 모두 분모 0·미관측 label 처리 규칙을 갖는다. Security는 recall, formatting은 precision 가중을 다르게 둘 수 있지만 correctness floor는 유지한다.

<a id="spec-12"></a>

## 12. EX: 우회할 수 없는 실행 계약

Graph MCP는 상태 조회와 허가된 mutation을 분리한다. control-only command를 agent tool 목록에 노출하지 않는다. 기존 operationId 멱등 receipt에 grant/lease scope fingerprint도 포함한다. client가 임의로 policyVersion을 바꿔 재시도하면 같은 operation으로 채택하지 않는다.

필수 내부 command 계약은 다음과 같다.

```text
ingestObservation(entity, beforeRef, afterRef, evidence, idempotencyKey)
processEvent(eventId) → signal/prediction/propagation/obligations
requestActivation(taskOrRegion, roleRef, evidenceRefs) → grant | skip | wait
claimGrantedRun(grantId, workerIdentity, operationId) → attemptToken + pinned manifest
expandContext(grantId, selectors, reasonEvidence) → budgeted manifest revision | deny
submitRoleResult(grantId, attemptToken, structuredOutput, actualManifest) → validated result | quarantine
proposeScopedReplan(leaseId, baseRevision, structuredPatch) → stagedRevision | rejection
commitValidatedRevision(stagedRevision, validationEvidence) → CAS result
proposePolicy(proposal, supportingEvidence) → candidateVersion
```

`requestActivation`은 요청이지 허가가 아니다. engine이 signals/role/cost를 재평가한다. structured AgentOutput의 taskId/findings/decisions/risks/unresolvedQuestions/evidence/proposedTasks/confidence/requiresEscalation 전체를 schema validation하고 reference/version/scope/근거를 검증한다. finding과 decision에 출처 없는 단정이 있으면 unknown/검증 의무로 처리한다. agent끼리 자유 대화로 전달한 값은 authoritative state가 아니며 graph/evidence에 검증 제출된 결과만 다음 역할에 전달한다.

native OpenCode 세션은 role-specific prompt/tools/profile/manifest로 생성한다. 기존 task-manager는 사용자 요청 해석이나 필요한 synthesis 역할만 맡고 control-plane 운영 권한을 잃는다. nested subagent도 별도 grant가 필요하다. `server.ts`의 전역 model/maxRuns만으로 수준을 결정하는 경로를 바꾼다. read-only planner도 계산 비용을 사용하므로 예외가 아니다.

Kubernetes InstanceSpec에 schemaVersion, grantId, immutable role/policy/profile refs, contextManifest digest, per-stage input view manifests, budget/lease expiry/fence generation을 넣는다. CRD `deploy/kubernetes/chart/crds/taskinstances.yaml`, TS types, admission validator, controller/worker, restore/archive, stage script를 함께 변경한다. Pod 시작 전에 grant binding과 input hash를 검증하고 모델 호출 직전에도 expiry/fence를 확인한다. restore는 새 grant의 입력과 검증된 cache만 채택하며 이전 session을 다른 policy/context에 그대로 이어붙이지 않는다.

사용량은 native SDK와 stage JSON event에서 수집하고 backend가 지원하는 최대 출력/도구 횟수/timeout을 강제한다. 스트리밍 중 예산 초과는 실행 중단과 미완료 receipt로 처리한다. 한 response에서 이미 발생한 비용을 되돌릴 수 없으므로 admission에서 upper bound를 reserve하고 사용 후 settle한다. enforce 불가능한 strict profile은 시작하지 않는다.

<a id="spec-13"></a>

## 13. 마이그레이션과 완성 기준

단계는 작업 순서이지 일부만 구현하고 완료라고 부를 수 있는 선택지 목록이 아니다.

1. 원문/요구사항 ID를 고정하고 ST schemas, typed edges, evidence, expectation, event outbox를 구현한다. 기존 데이터는 유실 없이 이관하고 누락 dependency/contract completeness는 unknown으로 표시한다. 과거 원문 없는 cognition/policy evidence를 만들어 넣지 않는다.
2. CP event projections·deterministic preflight·CG propagation/boundary/replan leases를 구현한다. 기존 signal/revision/fencing/cache tests를 유지하고 실제 런타임에서 기존 경로와 판단을 비교한다. 이 단계의 shadow는 검증용이며 최종 상태가 아니다.
3. AP role grants·CM budgets/memory·EV obligations를 구현하고 native/Kubernetes 양쪽 입구를 의무 경로로 바꾼다. 기존 direct manager orchestration과 자유 전체 revise 경로를 제거한다. legacy 조회는 가능하나 old writer는 schema/version gate로 거절한다.
4. PL의 모든 학습 target, role lifecycle, split/chunk, predictive edge, prioritized replay, versioned promotion/rollback을 구현한다. 전체 수용 테스트와 비용·품질 평가를 통과한 뒤 기본 실행 경로로 전환한다.

DB 마이그레이션은 백업→schema version CAS→transactional backfill→integrity 검증 순서다. rolling 중 구버전 worker는 기존 fenced attempt의 결과만 정해진 호환 decoder로 제출할 수 있고 새 grant를 받을 수 없다. unknown legacy cache는 보수적으로 검증한다. 정책 rollback과 데이터 schema rollback을 혼동하지 않는다. 데이터 되돌림은 사전 백업 복구/검증된 다운 마이그레이션이 필요하다.

완료 판정은 A75/B76의 곱에 나오는 모든 기능이 실제 경로에서 작동하는 것이다. activation만 넣거나, region을 계산하지만 planner가 전체 그래프를 쓸 수 있거나, 학습 proposal만 저장하고 승격·rollback이 없거나, native에만 budget이 있으면 미완성이다.

<a id="spec-14"></a>

## 14. 검증 계약

아래 T 번호는 **앞으로 작성·실행할 수용 테스트**다. 이 명세 작성으로 테스트가 통과했다는 뜻이 아니다. 원문 절별 대응에서 구체 scenario를 추가 지정한다.

- **T01 사건/멱등성**: 무변화 idle에서 모델 호출 0, 동일 event 재전달의 effect/grant 1개, transaction 중단·재시작 뒤 누락 0, cursor/outbox 복구. global scan 횟수 대신 affected index 조회량 계측.
- **T02 이중 희소성/권한**: 비영향 task run 0, 영향 task의 필요한 role만 활성화, fabricated grant/직접 start/instance/nested planner 우회 거절, cooldown/quota hard obligation 유지, wait 중 polling reasoning 0.
- **T03 결정론/정밀도**: 유효 cache L0, 충분한 static evidence L1에서 모델 0, 미해결 evidence만 L2–L5, 실제 profile/model/usage enforcement 확인, L5 독립 findings 및 충돌 처리.
- **T04 컨텍스트/기억**: 각 role selector·4개 예산·5개 memory level, 필수 facts 초과 시 잘라내지 않고 wait, coarse-to-fine 확장, 정확한 dependency view만 무효화, evidence expiry/policy 변경/assumption retract.
- **T05 인과 정리**: 작은 DAG를 생성해 full recomputation oracle과 local 결과 비교, 모든 relation/scope/port, 숨은 환경 입력으로 locality 전제 깨지는 반례, f 변경, cycle·1-weight cycle 종료, unknown completeness 처리.
- **T06 경계 정리**: 완전한 finite projection equality이면 외부 run 0, 같은 type+다른 behavior는 preserved 아님, 내부 직접 read 누락 발견, 한 출구 보존+다른 경로 변경, 만료 proof와 graph version race 차단.
- **T07 예측/안정성**: 실행 전 고정 expectation, C/B/D/G 거리·unknown·경계값, critical low-score 전파, enter/exit hysteresis, 더 좋은 계획이지만 switch cost 높은 keep, 불유효 keep 거절, 기대치 사후 조작 거절.
- **T08 국소 계획/보존**: repair→task→subgoal→goal 실패 evidence, 작은 후보 그래프 전수 argmin oracle, LCA보다 작은 feasible region, budget 탐색 중 최소성 미증명 표시, immutable prefix/decision/동적 자식 보존, 범위 밖 patch와 stale CAS 거절.
- **T09 다중 변화/경합**: 독립 closure 병렬, overlap transitive merge, 공유 boundary/resource 교차, 실행 중 새 변화, 실제 stop 전 lock 유지, late result 격리, DB 재시작 전후 동일 결과.
- **T10 통합/완료**: 개별 pass+조합 fail, 인터페이스·행동·데이터·시간·오류·자원·의미 7종 시나리오, exact tuple pass cache, 새로운 tuple 무효화, 모든 완료 conjunction 중 하나만 false여도 완료 아님.
- **T11 구조 학습**: FP/FN 실제 근거·미관측 label, 9종 failure 귀속, 경로명 규칙 거절·동일 구조 다른 이름 일반화, 모든 target proposal, candidate/shadow/validated/active 격리, 정책 불변 버전/승인 정책/rollback 재현.
- **T12 역할/그래프 학습**: candidate/temporary/validated/persistent, 부족한 샘플 승격 거절, split threshold+실제 비용, chunk 외부 ports/내부 checkpoints 보존, joint/separate boundary 학습, 확률 edge와 hard edge 분리.
- **T13 replay/측정**: 과거 snapshot 재생, counterfactual과 실제 outcome 구별, holdout regression, priority/knapsack과 critical reserve, 예산 부족 의무 유지, 4종 비용/ThinkingDensity/P/R/F-beta 분모·중복·unknown 처리.
- **T14 실제 adapter/이관**: native·Pod·stage마다 같은 grant/context/profile 제한, restore hash/cache/input view 유효성, unsupported capability 거절, 구버전 DB/worker writer gate, 기존 결과 계보·cancel·archive 보존.
- **T15 전체 수용 시나리오**: A62의 공유 infrastructure→static pass→선택 역할→실제 통합 실패→원인 repair→policy shadow 개선; B1의 A1 변경→A2/A 통합만 재검토→B/C/prefix 유지; 외부 contract 변경 시 필요한 B consumer만 깨어남. 각각 event부터 learned policy까지 한 trace로 연결.

기존 regression 기반은 `test/input-signals.test.ts`, `plan-revisions.test.ts`, `revision-stage-cache.test.ts`, `task-feedback.test.ts`, `parallel-scheduling.test.ts`, `context.test.ts`, `integration-graph.test.ts`, `instance-model-stage.test.ts` 등이다. `npm run check`를 기본으로 하고 native/실제 Kubernetes 수용 검증은 별도로 실행·결과를 기록한다. unit mock 성공을 실제 모델/Pod 예산 강제 성공으로 대체하지 않는다.

효율 평가는 같은 목표·변경 workload·validator·quality floor·모델 설정에서 baseline과 비교한다. 초기 비용과 steady-state 비용, 그래프 방문량, 영향을 받은 task/role 수, input/output tokens, latency, 실제 발견/누락 실패, 계획 유지율, 무효화 precision/recall을 측정한다. 절감 수치는 측정 전 약속하지 않는다. 높은 위험의 recall이 감소하면 비용이 낮아도 수용하지 않는다.

<a id="spec-15"></a>

## 15. 원문 해석의 한계와 명세의 경계

뇌/인간 인지 문장은 engineering motivation으로 보존한다. 원문 B의 ChatGPT citation 토큰은 복원 가능한 논문 서지 정보가 아니므로 과학적 출처를 새로 만들어 넣지 않는다. 원문 정리의 전제, cost surrogate, 예시 threshold, 통계 독립 가정, 최적화 목표를 서로 구분한다.

이 문서는 원문에서 미정인 tokenizer/profile 지원, evidence completeness 확인, utility calibration, 유한 region domain, policy 승격 표본 조건을 명시적 구현 계약으로 보완한다. 임의의 수치·지원되지 않는 SDK 기능·일반 프로그램 의미 동등성을 이미 확보했다고 가정하지 않는다. 이런 계약을 구현·검증하지 않은 상태에서 원문 전체가 반영되었다고 판정하지 않는다.

### 15.1 설정값도 검증 대상이다

원문이 예시로 든 임계값을 그대로 production 상수로 박지 않는다. `PolicyBundle`에는 feature normalization, activation weights/thresholds, enter/exit, critical relation set, role/context/precision profiles, decomposition weights, propagation model, replay budget, reward unit weights, quality floor, evaluation sample criteria와 승인 규칙을 모두 불변 버전으로 저장한다. 누락된 설정을 0이나 무제한으로 해석하지 않는다.

초기 상태는 hard 의무와 알려진 validator를 사용하는 명시 baseline policy다. 학습 feature가 unknown이면 confidence 0의 낮은 위험으로 처리하지 않는다. cold-start 자료 부족은 충분한 증거 확보/검증 의무로 연결하고 narrow semantic reuse를 허가하지 않는다. optional cheap inference의 역할별 최소 profile은 실제 adapter capability 검사 후 등록한다.

후보 평가는 시간·목표 episode 단위로 train/holdout을 분리하여 동일 실패의 중복 샘플 누출을 막는다. 표본 기준은 단순 횟수가 아니라 policy에 정의된 신뢰구간 폭·minimum effective samples·critical strata coverage이다. 기준 미달은 candidate/shadow를 유지한다. 후보는 기존 정책 대비 quality floor와 critical missed-failure 상한을 만족한 뒤 정규화 순효용의 보수 하한이 양수일 때만 validated로 승격한다. 이 정책을 적용하기 위한 신뢰수준·비용 단위·품질 하한도 평가 데이터와 함께 버전으로 남긴다.

[전체 절별 대응](source-implementation-map.md) · [데이터 필드 계약](schema-field-contracts.md) · [수식 전체 목록](formula-contracts.md) · [검증 기록](traceability-audit.md)
