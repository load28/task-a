# Energy-Efficient Graph Agent Architecture

## Sparse, Event-Driven, Self-Improving Multi-Agent System

---

# 초록

본 문서는 대규모 멀티에이전트 시스템에서 발생하는 과도한 추론 비용, 중복 계산, 불필요한 컨텍스트 전달, 통합 실패, 역할 중복, 그리고 자기개선 부재를 해결하기 위한 새로운 에이전트 아키텍처를 제안한다.

핵심 아이디어는 인간의 뇌가 높은 수준의 인지 능력을 상대적으로 작은 에너지로 수행하는 원리를 에이전트 시스템에 구조적으로 이식하는 것이다.

인간의 뇌는 모든 뉴런을 항상 동일한 강도로 활성화하지 않는다. 필요한 회로만 활성화하며, 대부분의 신경계는 특정 시점에 비활성 상태를 유지한다. 또한 계산은 중앙 집중식 메모리와 연산 장치를 왕복하는 방식이 아니라 국소적인 연결 구조에서 일어나며, 모든 판단을 최대 정밀도로 수행하지도 않는다. 불확실성이 높은 경우에만 추가 계산을 사용하고, 이미 학습된 구조와 신경 회로를 반복적으로 재사용한다.

본 설계는 이러한 특성을 다음과 같은 시스템 원칙으로 변환한다.

1. **Sparse Agent Activation**
2. **Event-Driven Execution**
3. **Local Context Retrieval**
4. **Adaptive Reasoning Precision**
5. **Deterministic Validation Before Reasoning**
6. **Task and Dependency Graph Based Orchestration**
7. **Integration-Aware Multi-Task Validation**
8. **Evidence-Based Escalation**
9. **Dormant-by-Default Agents**
10. **Self-Improving Activation Policies**
11. **Reusable Intermediate Knowledge**
12. **Structural Rather Than Case-Specific Error Correction**

이 시스템에서 에이전트는 기본적으로 실행되지 않는다.

모든 에이전트의 기본 상태는 `DORMANT`이며, 시스템이 관찰한 이벤트, 위험도, 의존성 변화, 실패 증거, 불확실성 등의 신호가 일정 조건을 만족할 때만 활성화된다.

따라서 시스템의 목표는 단순히 다음을 최적화하는 것이 아니다.

> 어떻게 더 잘 생각할 것인가?

더 중요한 최적화 대상은 다음이다.

> 언제 생각해야 하며, 언제 생각하지 않아야 하는가?

본 문서는 이를 구현하기 위한 그래프 모델, 데이터 구조, 실행 엔진, 활성화 정책, 통합 검증 모델, 자기개선 루프 및 비용 모델을 정의한다.

---

# 1. 문제 정의

일반적인 멀티에이전트 시스템은 에이전트 수가 증가할수록 계산 비용이 빠르게 증가한다.

에이전트 집합을

\[
A=\{a_1,a_2,\dots,a_n\}
\]

라고 하자.

모든 에이전트가 모든 태스크에 참여하는 구조의 비용은 단순하게 다음처럼 표현할 수 있다.

\[
C_{\text{naive}}
=
\sum_{i=1}^{n}C(a_i)
\]

에이전트가 다섯 개라면 하나의 태스크에도 다섯 번의 추론이 발생할 수 있다.

여기에 각각 동일한 전체 컨텍스트를 전달한다면 실제 비용은

\[
C
\propto
N_{\text{agents}}
\times
N_{\text{context}}
\times
N_{\text{reasoning}}
\]

으로 증가한다.

프로젝트가 커지면 더 큰 문제가 발생한다.

예를 들어 하나의 상위 태스크가 다음과 같이 분해된다고 하자.

```text
Task A
 ├─ A1
 ├─ A2
 ├─ A3
 └─ A4
```

각 태스크를 여러 에이전트가 반복 검토하면 비용은

\[
C
\sim
N_{\text{tasks}}
\times
N_{\text{agents}}
\]

수준으로 증가한다.

하지만 실제로는 모든 역할이 모든 하위 태스크에 필요하지 않다.

예를 들어 UI 문자열 하나를 변경하는 태스크에 시스템 아키텍처 에이전트가 필요하지 않을 수 있다.

반대로 여러 하위 태스크가 공통 인터페이스를 동시에 변경했다면 각각의 개별 결과는 정상이더라도 통합 단계에서 문제가 발생할 수 있다.

따라서 필요한 것은 단순한 에이전트 호출이 아니라 다음을 판단하는 시스템이다.

\[
\text{Who should think?}
\]

\[
\text{When should they think?}
\]

\[
\text{How deeply should they think?}
\]

\[
\text{What information should they receive?}
\]

\[
\text{When must several results be jointly reconsidered?}
\]

---

# 2. 설계 목표

본 시스템의 주요 목표는 다음과 같다.

## 2.1 최소 계산으로 최대 문제 해결 능력 확보

시스템은 모든 문제에 최대 추론 자원을 투입하지 않는다.

가능한 한 다음 순서를 따른다.

```text
No computation
      ↓
Deterministic computation
      ↓
Cheap inference
      ↓
Normal reasoning
      ↓
Deep reasoning
      ↓
Multi-agent review
```

즉 계산 비용은 문제의 난이도와 위험도에 따라 점진적으로 증가해야 한다.

---

## 2.2 필요할 때만 에이전트 활성화

에이전트는 항상 실행 중인 작업자가 아니다.

에이전트의 기본 상태는

```text
DORMANT
```

이며 특정 조건을 충족할 때만

```text
ACTIVE
```

로 전환된다.

---

## 2.3 전역 컨텍스트 최소화

각 에이전트는 전체 프로젝트를 받지 않는다.

다음 정보만 받는다.

\[
Context(a_i)
=
Task
+
RelevantDependencies
+
RelevantDecisions
+
Evidence
\]

즉 에이전트별 context slice를 구성한다.

---

## 2.4 문제를 특정 사례에 맞춰 임시로 해결하지 않음

실패가 발생했을 때 시스템은 단순히 다음과 같은 규칙을 추가해서는 안 된다.

```text
if task.name == "Foo":
    call QA
```

대신 실패의 원인을 구조적으로 분석해야 한다.

예:

```text
Shared interface changed
+
Two dependent tasks completed independently
+
No integration validation occurred
```

그러면 새 규칙은

```text
Shared dependency mutation
→ integration validation required
```

가 되어야 한다.

즉 시스템은 사례가 아니라 구조적 패턴을 학습한다.

---

# 3. 생물학적 영감

본 아키텍처는 뇌 자체를 모방하는 것을 목표로 하지 않는다.

대신 에너지 효율성과 관련된 몇 가지 계산 원리를 추상화한다.

---

# 3.1 Sparse Activation

뇌의 모든 뉴런이 동시에 활성화되지 않는다.

이를 에이전트 시스템에 적용하면 전체 에이전트 중 일부만 실행된다.

활성화 변수를

\[
z_i\in\{0,1\}
\]

이라고 하면 전체 비용은

\[
C
=
\sum_i z_i C(a_i)
\]

이다.

일반적인 시스템에서는

\[
z_i=1
\]

인 경우가 많지만 본 시스템은 대부분의 경우

\[
z_i=0
\]

을 목표로 한다.

---

# 3.2 Event-Driven Computation

뇌에는 CPU와 같은 글로벌 GHz 클럭이 없다.

활성화는 사건에 의해 발생한다.

에이전트 시스템도 polling 중심이 아니라 event 중심이어야 한다.

예:

```text
Code Changed
Test Failed
Dependency Changed
Task Completed
Confidence Dropped
Requirement Changed
Integration Conflict Detected
```

이러한 이벤트가 계산을 유발한다.

---

# 3.3 Locality

뇌의 연결은 대부분 국소적이다.

에이전트 시스템에서도 모든 데이터가 모든 에이전트에게 전달되면 안 된다.

Task Graph와 Knowledge Graph를 통해 필요한 정보만 선택한다.

---

# 3.4 Approximate First

뇌는 모든 문제를 최대 정밀도로 풀지 않는다.

따라서 시스템은 먼저 저비용 판단을 사용한다.

예:

```text
Rule
↓
Classifier
↓
Small model
↓
Reasoning model
↓
Deep review
```

---

# 3.5 Reuse

뇌는 매번 세상을 처음부터 해석하지 않는다.

이전 계산 결과를 재사용한다.

에이전트 시스템에서는 다음을 캐시한다.

```text
decision
analysis
test result
architecture reasoning
dependency summary
risk assessment
research evidence
```

---

# 4. 핵심 아키텍처

전체 시스템은 다음과 같이 구성된다.

```text
                    User / External Event
                             │
                             ▼
                     ┌───────────────┐
                     │ Event Ingestor│
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │Signal Extractor│
                     └───────┬───────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        Deterministic Engine        Risk Estimator
                │                         │
                └────────────┬────────────┘
                             ▼
                    Activation Router
                             │
                 ┌───────────┼────────────┐
                 │           │            │
                 ▼           ▼            ▼
             Architect      QA         Research
                 │           │            │
                 └───────────┼────────────┘
                             ▼
                        Task Graph
                             │
                             ▼
                   Integration Engine
                             │
                             ▼
                    Validation Engine
                             │
                             ▼
                     Result / Evidence
                             │
                             ▼
                   Self-Improvement Loop
```

---

# 5. Task Graph

시스템의 중심은 태스크 그래프다.

태스크는 단순 목록이 아니다.

\[
G_T=(V,E)
\]

로 정의되는 방향성 그래프다.

각 노드 \(v\in V\)는 태스크를 의미한다.

각 edge는 관계를 의미한다.

예:

```text
depends_on
blocks
implements
validates
integrates_with
generated_from
supersedes
```

예를 들어:

```text
Authentication
 ├─ Token issuance
 ├─ Token validation
 ├─ Refresh handling
 └─ Authorization middleware
```

하지만 트리만으로 충분하지 않다.

실제 의존 관계는 다음처럼 교차한다.

```text
Token issuance ──────┐
                     ├── API Gateway
Token validation ────┤
                     └── Authorization middleware
```

따라서 DAG 또는 일반 graph가 필요하다.

---

# 6. Task Model

```ts
interface Task {
  id: string

  title: string
  objective: string

  status:
    | "created"
    | "ready"
    | "running"
    | "blocked"
    | "review"
    | "completed"
    | "failed"

  parent?: TaskId

  children: TaskId[]

  dependencies: DependencyEdge[]

  artifacts: ArtifactRef[]

  assumptions: Assumption[]

  decisions: DecisionRef[]

  evidence: EvidenceRef[]

  risk: RiskState

  confidence: number

  version: number
}
```

핵심은 태스크가 단순한 텍스트가 아니라 **실행 가능한 지식 단위**라는 점이다.

---

# 7. Agent와 Role 분리

Agent와 Role을 분리한다.

Role은 능력과 책임을 정의한다.

```text
Architect
QA
Researcher
Critic
UX
Implementation
Security
Performance
Integration
```

Agent는 실제 실행 인스턴스다.

```text
Agent Instance
    │
    └── Assigned Role
```

동일한 role을 여러 에이전트가 맡을 수 있다.

또한 새로운 role을 동적으로 생성할 수 있다.

예:

```text
Role:
Database Migration Specialist
```

새로운 agent가 이 role을 부여받을 수 있다.

---

# 8. Role Definition

```ts
interface Role {
  id: string

  name: string

  purpose: string

  capabilities: Capability[]

  activationPolicy: ActivationPolicy

  requiredContext: ContextSelector[]

  outputSchema: Schema

  validators: ValidatorRef[]
}
```

Role은 단순 prompt가 아니다.

Role은 다음을 함께 가진다.

```text
Prompt
Activation rule
Required context
Expected output
Validation rule
```

---

# 9. Dormant-by-Default 모델

모든 에이전트는 기본적으로 dormant다.

```ts
type AgentState =
  | "dormant"
  | "candidate"
  | "active"
  | "waiting"
  | "completed"
```

상태 전이는 다음과 같다.

```text
DORMANT
   │
Signal matched
   ▼
CANDIDATE
   │
Activation score passed
   ▼
ACTIVE
   │
Task completed
   ▼
DORMANT
```

에이전트는 상시 프로세스가 아니라 필요할 때 잠깐 활성화되는 계산 단위다.

---

# 10. Signal Extraction

Event 자체가 바로 에이전트를 호출해서는 안 된다.

먼저 signal로 변환한다.

예:

```text
Event:
File changed

Signals:
- public API changed
- type definition changed
- shared dependency affected
- test coverage exists
- downstream modules = 7
```

signal 구조:

```ts
interface SignalSet {
  changedFiles: FileRef[]

  changedSymbols: SymbolRef[]

  changedInterfaces: InterfaceRef[]

  failingTests: TestRef[]

  affectedDependencies: DependencyRef[]

  uncertainty: number

  risk: number

  integrationRisk: number

  externalKnowledgeRequired: boolean

  semanticChange: boolean
}
```

---

# 11. Activation Router

Activation Router는 어떤 에이전트를 활성화할지 판단한다.

각 에이전트 \(a_i\)에 대해 activation score를 계산한다.

\[
S_i =
w_1R
+w_2U
+w_3D
+w_4F
+w_5I
\]

여기서

- \(R\): risk
- \(U\): uncertainty
- \(D\): dependency impact
- \(F\): failure evidence
- \(I\): integration risk

활성화 조건:

\[
S_i>\theta_i
\]

이면 에이전트를 실행한다.

---

# 12. Activation Policy

예:

```ts
interface ActivationPolicy {
  hardTriggers: Trigger[]

  softSignals: WeightedSignal[]

  threshold: number

  cooldown?: Duration

  maxInvocationsPerTask?: number
}
```

QA Agent:

```text
Hard trigger:
- test failure
- integration failure

Soft signals:
+ public API changed
+ shared dependency changed
+ high-risk task
```

Architect Agent:

```text
Hard trigger:
- architectural invariant violated

Soft signals:
+ module boundary changed
+ dependency direction changed
+ new infrastructure component
```

Research Agent:

```text
Hard trigger:
- external fact required

Soft signals:
+ low confidence
+ unfamiliar technology
+ version-dependent behavior
```

---

# 13. Deterministic-First Principle

LLM은 항상 첫 번째 계산 계층이어서는 안 된다.

가능하면 정적/결정론적 검사부터 사용한다.

예:

```text
AST
Type checker
Schema validator
Unit test
Integration test
Dependency graph
Policy engine
Constraint solver
```

흐름:

```text
Change
  ↓
AST validation
  ↓
Type validation
  ↓
Tests
  ↓
Static constraints
  ↓
Remaining uncertainty?
       │
      YES
       ↓
      LLM
```

따라서

\[
C_{\text{total}}
=
C_{\text{deterministic}}
+
C_{\text{reasoning only when needed}}
\]

가 된다.

---

# 14. Adaptive Reasoning Precision

각 문제의 reasoning level을 정의한다.

```text
L0 = no reasoning
L1 = deterministic
L2 = cheap inference
L3 = normal reasoning
L4 = deep reasoning
L5 = multi-agent adversarial review
```

필요한 level은

\[
L=f(R,U,I,C)
\]

로 결정한다.

여기서

- \(R\): risk
- \(U\): uncertainty
- \(I\): integration complexity
- \(C\): change magnitude

예:

```text
risk < 0.2
→ L1

risk < 0.4
→ L2

risk < 0.65
→ L3

risk < 0.85
→ L4

risk >= 0.85
→ L5
```

단, threshold는 경험적으로 학습된다.

---

# 15. Local Context System

가장 중요한 비용 중 하나는 context다.

모든 agent에게 전체 project context를 전달하면 안 된다.

에이전트 \(a_i\)의 context는

\[
C_i
=
T_i
\cup
D_i
\cup
K_i
\cup
E_i
\]

이다.

각각

- \(T_i\): target task
- \(D_i\): relevant dependencies
- \(K_i\): relevant knowledge
- \(E_i\): evidence

이다.

---

# 16. Context Retrieval Algorithm

```text
1. Start at target task
2. Traverse required dependency edges
3. Retrieve referenced decisions
4. Retrieve conflicting assumptions
5. Retrieve related validation evidence
6. Stop when context budget reached
```

중요한 것은 context window를 단순 크기로 제한하지 않는다는 것이다.

정보의 관계 기반 relevance를 사용한다.

---

# 17. Context Budget

각 agent에게 budget을 준다.

```ts
interface ContextBudget {
  maxTokens: number

  maxDependencyDepth: number

  maxEvidenceItems: number

  maxHistoricalDecisions: number
}
```

초과하면 요약 hierarchy를 사용한다.

```text
Raw artifact
   ↓
Local summary
   ↓
Task summary
   ↓
Subtree summary
   ↓
Project summary
```

---

# 18. Hierarchical Memory

정보를 여러 해상도로 저장한다.

예:

```text
Level 0
Raw source

Level 1
Artifact summary

Level 2
Task summary

Level 3
Subtree summary

Level 4
Project knowledge
```

필요한 경우에만 아래 레벨을 펼친다.

이는 coarse-to-fine reasoning이다.

---

# 19. Integration Problem

하위 태스크 각각이 독립적으로 성공한다고 상위 태스크가 성공하는 것은 아니다.

\[
Correct(A_1)\land Correct(A_2)
\not\Rightarrow
Correct(A_1\oplus A_2)
\]

예를 들어:

```text
Task A
→ changes interface X

Task B
→ changes implementation Y
```

각각 테스트는 통과한다.

하지만 함께 합치면

```text
A + B
→ contract mismatch
```

가 발생할 수 있다.

따라서 integration은 별도의 계산 단위다.

---

# 20. Integration Graph

Task Graph 외에 Integration Graph를 유지한다.

\[
G_I=(V_I,E_I)
\]

node는 artifact 또는 task output이고 edge는 통합 관계다.

예:

```text
Auth API
 ├── Frontend
 ├── Mobile
 ├── Gateway
 └── Audit Service
```

Auth API 변경 시 관련 integration edge를 활성화한다.

---

# 21. Multi-Task Integration Detection

여러 하위 태스크의 결과가 같은 경계에 영향을 주는 경우 integration event를 발생시킨다.

조건:

\[
|\{T_i : T_i\rightarrow B\}| > 1
\]

여기서 \(B\)는 공유 boundary다.

예:

```text
A1 ──┐
A2 ──┼── shared interface
A3 ──┘
```

이 경우:

```text
IntegrationRequired
```

이벤트를 생성한다.

---

# 22. Integration Agent

Integration Agent의 역할은 단순 merge가 아니다.

검사 대상:

```text
behavioral compatibility
interface compatibility
data compatibility
temporal assumptions
error propagation
resource contention
semantic consistency
```

결과:

```ts
interface IntegrationResult {
  compatible: boolean

  conflicts: Conflict[]

  emergentRisks: Risk[]

  requiredRework: TaskProposal[]
}
```

---

# 23. Evidence Model

에이전트의 판단은 가능한 한 evidence에 연결해야 한다.

```ts
interface Evidence {
  id: string

  type:
    | "test"
    | "code"
    | "document"
    | "runtime"
    | "research"
    | "user"
    | "agent"

  source: string

  confidence: number

  timestamp: Date

  contentHash: string
}
```

판단:

```ts
interface Decision {
  conclusion: string

  evidence: EvidenceRef[]

  confidence: number

  assumptions: AssumptionRef[]
}
```

---

# 24. Confidence Propagation

상위 task confidence를 단순 평균으로 계산하면 안 된다.

의존 태스크 중 가장 낮은 confidence가 중요할 수 있다.

예:

\[
C_{parent}
=
\min(C_1,C_2,\dots,C_n)
\]

또는 weighted form:

\[
C=
\prod_iC_i^{w_i}
\]

이 방식은 하나의 중요한 의존성이 낮은 confidence를 가질 경우 전체 confidence를 낮춘다.

---

# 25. Risk Propagation

반대로 risk는 최대값이 중요하다.

\[
R_{parent}
=
1-\prod_i(1-R_i)
\]

독립적인 위험을 가정하면 여러 위험이 쌓일수록 상위 위험도가 증가한다.

---

# 26. Critic Agent

Critic은 항상 실행되지 않는다.

다음 경우에만 활성화한다.

```text
High confidence but weak evidence
High risk
Architectural change
Irreversible decision
Repeated failure pattern
```

Critic의 목표는 답을 만드는 것이 아니다.

다음을 찾는다.

```text
hidden assumption
missing evidence
counterexample
integration failure
false certainty
```

---

# 27. QA Agent

QA는 단순 테스트 실행기가 아니다.

QA는 다음 질문을 담당한다.

```text
What can fail?
What was not tested?
What changed semantically?
What combinations have not been validated?
```

특히 하위 태스크의 조합을 검증한다.

---

# 28. Self-Improvement Loop

이 시스템의 핵심은 단순 작업 실행이 아니라 실행 정책 자체를 개선하는 것이다.

다음 두 가지 failure가 중요하다.

---

## 28.1 False Positive Activation

에이전트를 실행했지만 가치가 없었던 경우.

```text
Trigger
↓
Agent invoked
↓
No new evidence
No decision change
No issue found
↓
Waste detected
```

activation policy를 약화시킨다.

---

## 28.2 False Negative Activation

에이전트를 실행하지 않았는데 이후 문제가 발견된 경우.

```text
No agent invoked
↓
Task completed
↓
Later integration failure
↓
Missed activation detected
```

새 activation condition을 학습한다.

---

# 29. Activation Learning

각 activation rule을 하나의 policy로 본다.

\[
\pi(s)\rightarrow a
\]

여기서

- \(s\): signal state
- \(a\): activate / skip

보상은 다음처럼 정의할 수 있다.

\[
Reward
=
ValueFound
-
ExecutionCost
-
MissedFailureCost
\]

더 구체적으로:

\[
R =
\alpha V
-\beta C
-\gamma M
\]

여기서

- \(V\): useful finding
- \(C\): reasoning cost
- \(M\): missed error cost

목표는

\[
\max E[R]
\]

이다.

즉 시스템은 단순 정확도가 아니라

```text
accuracy / cost
```

를 최적화한다.

---

# 30. Structural Rule Learning

중요한 제약:

Self-improvement agent는 특정 사례를 그대로 rule로 추가할 수 없다.

잘못된 예:

```text
when file auth.ts changes
→ invoke architect
```

좋은 예:

```text
when a public authentication boundary changes
and downstream modules > threshold
→ invoke architect
```

즉 rule generation 과정에 abstraction 단계가 필요하다.

```text
Failure
↓
Root cause
↓
Structural pattern
↓
Generalizable invariant
↓
Candidate rule
↓
Validation
↓
Policy update
```

---

# 31. Rule Validation

새 rule은 바로 production에 적용하지 않는다.

다음 상태를 거친다.

```text
candidate
↓
shadow
↓
validated
↓
active
```

Shadow 단계에서는 실제 실행 여부에 영향을 주지 않고 결과만 비교한다.

---

# 32. Knowledge Reuse

이미 계산한 결과는 가능한 한 재사용한다.

각 reasoning output에는 input hash를 기록한다.

\[
H=
hash(
Task,
Dependencies,
Evidence,
Policy
)
\]

동일한 hash라면 기존 결과를 사용한다.

변화가 발생했다면 affected subset만 invalidation한다.

---

# 33. Semantic Cache

단순 text hash만으로는 부족하다.

예:

```text
"rename variable"
```

은 코드가 변경되었지만 architecture reasoning을 무효화할 필요가 없다.

따라서 change classification을 사용한다.

```text
syntactic
semantic
interface
behavioral
architectural
```

캐시 invalidation도 이를 기준으로 한다.

---

# 34. Incremental Reasoning

큰 태스크를 매번 처음부터 분석하지 않는다.

기존 reasoning state를 유지한다.

```ts
interface ReasoningState {
  assumptions: Assumption[]

  conclusions: Decision[]

  unresolvedQuestions: Question[]

  evidenceIndex: EvidenceRef[]

  dependencyVersion: VersionVector
}
```

변경된 부분만 다시 계산한다.

---

# 35. Version Vector

각 dependency의 version을 기록한다.

```text
Task A: 13
Interface X: 4
Decision D: 7
Research R: 2
```

agent reasoning output은 해당 version vector에 묶인다.

하나가 변경되면 영향을 받은 reasoning만 invalidation한다.

---

# 36. Agent Communication

에이전트끼리 자유 대화하도록 두지 않는다.

자유로운 conversation topology는 비용과 오염을 증가시킨다.

대신 graph-mediated communication을 사용한다.

```text
Agent
 ↓
Structured output
 ↓
Task Graph / Evidence Store
 ↓
Other Agent
```

즉 agent-to-agent 직접 대화보다 shared state를 통한 통신을 기본값으로 한다.

---

# 37. Structured Agent Output

모든 agent output은 최소한 다음 구조를 가진다.

```ts
interface AgentOutput {
  taskId: TaskId

  findings: Finding[]

  decisions: Decision[]

  risks: Risk[]

  unresolvedQuestions: Question[]

  evidence: EvidenceRef[]

  proposedTasks: TaskProposal[]

  confidence: number

  requiresEscalation: boolean
}
```

---

# 38. Escalation

에이전트가 자신이 해결할 수 없다고 판단하면 다음 level로 escalation한다.

예:

```text
Implementation Agent
↓
uncertainty 0.82
↓
Architect Agent
↓
architecture conflict
↓
Critic + Integration Agent
```

중요한 점은 무조건 상위 agent를 호출하는 게 아니라 evidence-based escalation이라는 점이다.

---

# 39. Cost Model

전체 시스템 비용을 다음처럼 볼 수 있다.

\[
C_{\text{total}}
=
C_{\text{context}}
+
C_{\text{reasoning}}
+
C_{\text{validation}}
+
C_{\text{coordination}}
\]

본 설계는 네 가지를 모두 줄인다.

### Context

Local retrieval.

### Reasoning

Sparse activation.

### Validation

Deterministic-first.

### Coordination

Graph-mediated communication.

---

# 40. Efficiency Metric

단순 토큰 비용으로만 평가하지 않는다.

다음 지표를 사용한다.

\[
Efficiency
=
\frac
{
ResolvedRisk
+
UsefulDecisions
+
DetectedFailures
}
{
Tokens
+
Latency
+
AgentInvocations
}
\]

---

# 41. Thinking Density

새로운 메트릭을 정의할 수 있다.

\[
ThinkingDensity
=
\frac{\text{useful reasoning outputs}}
{\text{total reasoning outputs}}
\]

이 값이 낮으면 불필요한 에이전트 호출이 많다는 의미다.

목표는 Thinking Density를 높이는 것이다.

---

# 42. Activation Precision / Recall

activation 자체도 분류 문제로 평가한다.

### Precision

\[
P=
\frac
{\text{useful activations}}
{\text{all activations}}
\]

### Recall

\[
R=
\frac
{\text{problems caught by activation}}
{\text{problems that required activation}}
\]

Precision만 높이면 중요한 문제를 놓칠 수 있다.

Recall만 높이면 모든 agent를 항상 실행하는 시스템이 된다.

따라서 F-score 또는 cost-weighted score를 사용한다.

---

# 43. Cost-Weighted Activation Score

\[
Score
=
\frac
{(1+\beta^2)PR}
{\beta^2P+R}
-
\lambda C
\]

중요한 시스템에서는 recall의 가중치를 높일 수 있다.

예:

```text
Security
→ recall priority

Formatting
→ precision priority
```

---

# 44. Work Execution Lifecycle

전체 태스크 실행은 다음과 같다.

```text
1. User request

2. Task decomposition

3. Task graph construction

4. Dependency identification

5. Initial signal extraction

6. Deterministic checks

7. Risk estimation

8. Agent activation

9. Task execution

10. Evidence generation

11. Local validation

12. Child task completion

13. Integration detection

14. Integration validation

15. Parent aggregation

16. Final validation

17. Outcome evaluation

18. Activation policy feedback
```

---

# 45. Task Decomposition

하위 태스크는 무조건 작게 나누지 않는다.

분해 비용 자체가 존재한다.

따라서 다음 함수로 판단한다.

\[
D(T)
=
Complexity
+
Parallelism
+
RiskIsolation
-
CoordinationCost
\]

\(D(T)\)가 threshold 이상일 때만 분해한다.

---

# 46. Dynamic Decomposition

처음부터 모든 하위 task를 생성할 필요도 없다.

작업 중 새로운 complexity가 발견되면 분해한다.

```text
Task
 ↓
Execution
 ↓
Unexpected complexity
 ↓
Split
 ├─ Subtask A
 └─ Subtask B
```

---

# 47. Dynamic Role Creation

기존 role로 문제를 해결할 수 없는 경우 새 role을 만들 수 있다.

하지만 새 role 생성에도 조건이 필요하다.

```text
Repeated specialized work
+
Existing roles insufficient
+
Reusable capability detected
```

예:

```text
Kafka migration issues repeated
↓
Kafka Migration Specialist role
```

---

# 48. Role Lifecycle

```text
candidate
↓
temporary
↓
validated
↓
persistent
```

일회성 role 생성 남발을 방지한다.

---

# 49. Orchestrator의 역할

Orchestrator는 모든 판단을 하는 중앙 AI여서는 안 된다.

그러면 병목이 된다.

Orchestrator의 역할은 다음으로 제한한다.

```text
event routing
graph mutation
policy evaluation
resource allocation
escalation
```

실제 도메인 판단은 해당 role agent가 수행한다.

---

# 50. Control Plane / Intelligence Plane

시스템을 두 계층으로 분리한다.

## Control Plane

결정론적 코드 중심.

```text
Task state
Graph
Events
Policy
Scheduling
Caching
Versioning
```

## Intelligence Plane

LLM 중심.

```text
Reasoning
Research
Architecture
Criticism
Synthesis
```

가능한 모든 것은 Control Plane에서 처리한다.

---

# 51. 이 분리의 중요성

LLM이 다음을 직접 관리하게 하면 안 된다.

```text
task IDs
dependency integrity
state transitions
version numbers
cache invalidation
locking
execution status
```

이것은 deterministic system이 담당한다.

LLM은 의미 판단에 집중한다.

---

# 52. Failure Attribution

실패가 발생하면 누가 틀렸는지만 찾지 않는다.

다음 중 어느 계층의 문제인지 분석한다.

```text
Task decomposition failure
Context retrieval failure
Agent reasoning failure
Activation failure
Validation failure
Integration failure
Policy failure
```

---

# 53. Failure Taxonomy

```ts
type FailureType =
  | "missed_activation"
  | "unnecessary_activation"
  | "bad_reasoning"
  | "insufficient_context"
  | "stale_context"
  | "bad_decomposition"
  | "integration_failure"
  | "validation_gap"
  | "bad_policy"
```

---

# 54. Self-Improvement 대상

시스템은 prompt만 개선하지 않는다.

다음을 모두 개선할 수 있다.

```text
activation policy
context selection
task decomposition
role definitions
validation rules
integration rules
escalation thresholds
cache policy
reasoning level selection
```

---

# 55. 메타 에이전트

Self-improvement를 담당하는 Meta Agent는 작업마다 실행되지 않는다.

충분한 failure sample이 쌓였을 때 batch로 실행한다.

예:

```text
20 executions
↓
policy evaluation
↓
candidate improvements
```

또는 중요한 failure 발생 시 즉시 실행할 수도 있다.

---

# 56. Meta Agent의 출력

```ts
interface PolicyProposal {
  target:
    | "activation"
    | "context"
    | "validation"
    | "decomposition"
    | "role"
    | "integration"

  observedPattern: string

  rootCause: string

  proposedInvariant: string

  proposedRule: Rule

  expectedBenefit: number

  regressionRisk: number
}
```

---

# 57. 인간의 역할

시스템은 완전 자율 시스템으로 설계할 필요가 없다.

특히 다음 변경은 인간 승인 대상으로 둘 수 있다.

```text
new persistent role
critical policy changes
architecture decisions
high-impact task rewrites
security exceptions
```

Self-improvement는 제안과 검증까지 수행하고 적용은 policy에 따라 결정한다.

---

# 58. 안전장치

자기개선 시스템에는 다음 제한이 필요하다.

```text
no self-modification without trace
no hidden policy mutation
all policy versions immutable
all changes reversible
all learned rules explainable
```

---

# 59. Policy Versioning

```text
activation-policy/v41
activation-policy/v42
activation-policy/v43
```

모든 실행은 사용한 policy version을 기록한다.

문제가 생기면 rollback할 수 있다.

---

# 60. Observability

모든 실행에 대해 다음 trace를 남긴다.

```text
Event
Signals
Activated agents
Skipped agents
Context supplied
Reasoning level
Evidence
Decision
Cost
Latency
Outcome
```

---

# 61. 왜 Skip 기록이 중요한가

대부분의 시스템은 실행한 agent만 기록한다.

하지만 본 시스템에서는 실행하지 않은 결정이 중요하다.

예:

```text
Architect skipped

Reason:
architectureRisk = 0.12
threshold = 0.65
```

이 기록이 있어야 missed activation을 분석할 수 있다.

---

# 62. Execution Trace 예시

```text
Task #182
"Add cache invalidation"

Signals
- shared infrastructure touched
- public API unchanged
- integration risk 0.72

Deterministic
- typecheck PASS
- unit tests PASS

Activation
Implementation: YES
Architect: YES
QA: YES
Research: NO
UX: NO

Integration
Redis client
API server
worker

Result
integration test failure detected

Cost
3 agent invocations
instead of 7
```

---

# 63. 데이터 저장 구조

핵심 저장소는 다음과 같이 분리하는 것이 좋다.

```text
Task Store

Knowledge Store

Evidence Store

Policy Store

Execution Store

Artifact Store
```

---

# 64. Graph Storage

초기 구현에서는 반드시 graph database가 필요한 것은 아니다.

관계형 데이터베이스에서도 충분하다.

예:

```text
tasks
task_edges
artifacts
artifact_edges
decisions
evidence
agent_runs
policies
```

필요하면 향후 graph DB로 전환한다.

---

# 65. Event Bus

모든 상태 변화는 Event를 생성한다.

예:

```text
TaskCreated
TaskUpdated
TaskCompleted
ArtifactChanged
DependencyChanged
ValidationFailed
IntegrationRequired
AgentCompleted
PolicyUpdated
```

---

# 66. Event 형태

```ts
interface AgentSystemEvent<T = unknown> {
  id: string

  type: string

  entityId: string

  timestamp: Date

  payload: T

  causationId?: string

  correlationId?: string
}
```

---

# 67. Event Sourcing 가능성

시스템 상태를 event sourcing 기반으로 구성하면 매우 유리하다.

왜냐하면 self-improvement를 위해 과거 판단을 재생할 수 있기 때문이다.

```text
Past events
+
New policy
↓
Replay
↓
Would new policy have done better?
```

---

# 68. Counterfactual Evaluation

Policy 개선 시 실제 production에 바로 적용하지 않고 과거 실행을 다시 평가한다.

예:

```text
Old policy:
QA skipped

New candidate policy:
QA would activate

Historical result:
integration failure occurred
```

새 policy가 더 좋았다는 증거가 된다.

---

# 69. Shadow Policy

새 policy는 실제 routing을 바꾸지 않고 예측만 수행한다.

```text
Production policy
→ actual action

Shadow policy
→ predicted action
```

결과를 비교한다.

---

# 70. 장기 목표

시스템의 최종 형태는 단순 멀티에이전트가 아니다.

다음과 같은 adaptive computational organism에 가깝다.

```text
Observe
↓
Activate minimally
↓
Reason locally
↓
Validate deterministically
↓
Integrate globally when needed
↓
Learn from wasted computation
↓
Learn from missed failures
↓
Improve activation structure
```

---

# 71. 핵심 수학적 목표

에이전트 시스템이 최적화해야 할 것은 최대 intelligence가 아니다.

다음 비율이다.

\[
\boxed{
\eta
=
\frac{\text{Useful Cognitive Work}}
{\text{Computation Cost}}
}
\]

즉 cognitive efficiency다.

---

# 72. 기존 멀티에이전트 시스템과 차이

일반 시스템:

```text
Task
↓
Planner
↓
Agent A
Agent B
Agent C
Agent D
↓
Synthesis
```

본 시스템:

```text
Task
↓
Deterministic analysis
↓
Signals
↓
Sparse activation
   ├─ A
   └─ C
↓
Local execution
↓
Integration detector
↓
Only if needed:
   B + QA
```

---

# 73. 가장 중요한 설계 철학

기존 AI 시스템은 대부분 다음에 집중한다.

> 어떻게 더 많이 추론할 것인가?

본 시스템은 반대 질문에서 시작한다.

> 이 추론은 정말 필요한가?

그리고 필요한 경우에만 다음 질문으로 넘어간다.

> 어느 역할이 해야 하는가?

그리고 그다음:

> 어느 정도 깊이로 해야 하는가?

그리고 마지막:

> 무엇이 바뀌었을 때 다시 해야 하는가?

---

# 74. 최종 원칙

시스템 전체를 다음 열두 가지 원칙으로 요약할 수 있다.

## Principle 1

**Dormant by default**

아무 에이전트도 이유 없이 실행되지 않는다.

## Principle 2

**Events trigger computation**

시간이 아니라 변화가 계산을 일으킨다.

## Principle 3

**Local context only**

필요한 정보만 전달한다.

## Principle 4

**Deterministic before probabilistic**

검증 가능한 것은 코드로 검증한다.

## Principle 5

**Adaptive reasoning depth**

모든 문제를 같은 비용으로 풀지 않는다.

## Principle 6

**Graph-based dependency awareness**

태스크를 독립적인 목록으로 보지 않는다.

## Principle 7

**Integration is a first-class task**

개별 성공과 통합 성공을 구분한다.

## Principle 8

**Evidence drives escalation**

추측이 아니라 증거가 추가 추론을 유발한다.

## Principle 9

**Reuse previous cognition**

이미 계산한 것은 다시 계산하지 않는다.

## Principle 10

**Learn when not to think**

불필요한 activation도 실패다.

## Principle 11

**Learn from missed reasoning**

필요했는데 호출하지 않은 것도 실패다.

## Principle 12

**Fix structures, not cases**

개별 케이스를 때우지 않고 원인을 구조화한다.

---

# 75. 최종 시스템 정의

본 아키텍처를 한 문장으로 정의하면 다음과 같다.

> **상태 변화와 위험 신호를 기반으로 필요한 에이전트만 선택적으로 활성화하고, 필요한 최소 컨텍스트와 적절한 추론 깊이만 사용하며, 결정론적 검증과 그래프 기반 통합 검증을 통해 결과를 평가하고, 성공과 실패의 기록으로부터 “언제 어떤 사고를 수행해야 하는지” 자체를 지속적으로 개선하는 자기개선형 에이전트 시스템.**

이를 수학적으로 축약하면 다음과 같다.

\[
\boxed{
Agent\ Intelligence
=
SparseActivation
\times
LocalContext
\times
AdaptiveReasoning
\times
DeterministicValidation
\times
GraphIntegration
\times
PolicyLearning
}
\]

그리고 시스템의 궁극적인 최적화 목표는 다음이다.

\[
\boxed{
\max
\frac
{\text{Correct and Useful Decisions}}
{\text{Reasoning Cost + Context Cost + Coordination Cost}}
}
\]

즉 이 시스템에서 최고의 에이전트는 가장 많이 생각하는 에이전트가 아니다.

**정확히 필요한 순간에, 필요한 만큼만 생각하는 에이전트 시스템이 가장 효율적인 시스템이다.**