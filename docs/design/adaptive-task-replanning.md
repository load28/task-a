# Adaptive Task Replanning

## 인간의 계층적 인지와 예측오차를 이용한 국소 재계획 아키텍처

---

# 초록

복잡한 에이전트 시스템에서 태스크를 계층적으로 분할하는 것만으로는 충분하지 않다.

현실의 작업에서는 지속적으로 다음과 같은 변화가 발생한다.

- 요구사항 변경
- 계획 수정
- 하위 태스크의 예상치 못한 결과
- 구현 방식 변경
- 외부 환경 변화
- 의존성 변경
- 실패에 따른 우회
- 여러 하위 태스크 통합 과정에서 발견되는 새로운 문제

단순한 태스크 시스템은 이러한 변화가 발생할 때 두 극단 중 하나에 빠지기 쉽다.

첫 번째는 변경된 태스크만 수정하고 나머지는 그대로 두는 것이다.

이는 변화가 다른 태스크에 미치는 영향을 놓친다.

두 번째는 전체 계획을 다시 생성하는 것이다.

이는 정확성은 높일 수 있지만 계산 비용이 크고 이미 유효한 계획까지 파괴한다.

인간은 일반적으로 두 방식 모두를 사용하지 않는다.

사람은 복잡한 행동을 목표 → 하위 목표 → 행동으로 계층화하고, 상황이 예상과 달라졌을 때 현재 상황과 내부 모델 사이의 불일치를 감지하여 관련된 행동 계획을 수정한다. 인간 행동이 태스크와 하위 태스크로 계층화될 수 있다는 것은 인지과학과 계층적 강화학습 연구에서 오랫동안 연구되어 왔으며, 최근 인간의 model-based hierarchical behavior에서도 순차적인 subgoal representation이 관찰되고 있다. citeturn628734search2turn628734search13

또한 Event Segmentation Theory 계열의 연구에서는 진행 중인 사건에 대한 예측이 실제 관찰과 어긋나 prediction error가 증가하면 현재 event model을 갱신하는 메커니즘을 제안한다. 인간은 모든 순간 자신의 내부 모델을 다시 구성하는 것이 아니라 의미 있는 변화가 발생할 때 representation을 갱신하는 것으로 설명된다. citeturn628734search0turn628734search6

본 설계는 이 두 특성을 에이전트의 태스크 관리 구조로 변환한다.

핵심은 다음이다.

> **전체 계획을 다시 세우지 않는다. 변경이 발생한 지점에서 예측오차를 계산하고, 그 변화가 의미론적으로 도달할 수 있는 태스크만 무효화하여 국소적으로 재계획한다.**

이를 **Local Causal Replanning**이라 정의한다.

---

# 1. 문제

다음과 같은 계획이 있다고 하자.

```text
목표 G

├─ A
│  ├─ A1
│  └─ A2
│
├─ B
│  ├─ B1
│  └─ B2
│
└─ C
   ├─ C1
   └─ C2
```

A1의 구현 방식이 바뀌었다고 하자.

가장 단순한 방법은 전체 계획을 다시 생성하는 것이다.

```text
A1 변경

↓

G부터 다시 계획

↓

A
B
C
A1
A2
B1
B2
C1
C2

모두 재검토
```

하지만 실제로 A1이 B와 C에 아무 영향을 주지 않는다면 대부분의 계산은 낭비다.

반대로

```text
A1만 수정
```

하면 A2가 A1의 결과를 사용하는 경우 문제를 놓친다.

따라서 우리가 원하는 것은 다음과 같다.

```text
A1 변경

↓

영향 범위 계산

↓

A1
A2
A의 통합 상태

만 재검토

↓

B와 C는 유지
```

이것을 수학적으로 정의할 수 있다.

---

# 2. 인간에게서 가져올 첫 번째 원리: 계층적 행동

인간의 행동은 평평한 action list로만 표현되지 않는다.

예를 들어

> 저녁 식사를 만든다.

라는 목표는 자연스럽게

```text
저녁 식사

├─ 재료 준비
│  ├─ 채소 세척
│  ├─ 채소 절단
│  └─ 고기 준비
│
├─ 조리
│  ├─ 팬 가열
│  ├─ 고기 조리
│  └─ 채소 조리
│
└─ 접시에 담기
```

처럼 분해된다.

계층적 강화학습 관점에서도 인간과 동물의 행동을 task → subtask → primitive action으로 조직되는 구조로 보는 접근이 연구되어 왔다. 이러한 구조의 장점 중 하나는 이미 만들어진 하위 행동 routine을 다른 문제에서도 재사용할 수 있다는 것이다. citeturn628734search1turn628734search3

따라서 에이전트 시스템에서도

\[
Goal
\rightarrow
Subgoal
\rightarrow
Task
\rightarrow
Action
\]

구조를 기본값으로 삼는다.

그러나 이것만으로는 계획 변경 문제를 해결하지 못한다.

두 번째 원리가 필요하다.

---

# 3. 인간에게서 가져올 두 번째 원리: Prediction Error

인간은 외부 세계에 대해 일종의 현재 모델을 유지한다.

이를

\[
M_t
\]

라고 하자.

현재 모델로부터 다음 상태를 예측한다.

\[
\hat{s}_{t+1}=F(M_t,s_t)
\]

실제 결과는

\[
s_{t+1}
\]

이다.

그러면 prediction error는

\[
\epsilon_t
=
d(s_{t+1},\hat{s}_{t+1})
\]

로 정의할 수 있다.

\(d\)는 두 상태의 차이를 나타내는 함수다.

예측오차가 작다면

\[
\epsilon_t < \theta
\]

현재 모델을 유지한다.

하지만

\[
\epsilon_t \ge \theta
\]

이면 현재 모델이 현실을 충분히 설명하지 못하고 있다는 뜻이다.

따라서 모델을 갱신한다.

\[
M_{t+1}
=
Update(M_t,s_{t+1})
\]

Event Segmentation Theory는 이러한 prediction error 증가가 현재 event model을 갱신하는 신호가 될 수 있다고 설명한다. 최근 연구에서도 prediction error와 event segmentation의 관계가 기억 및 작업기억 관점에서 계속 연구되고 있다. citeturn628734search0turn628734search5

에이전트에 적용하면 이것은 매우 강력하다.

---

# 4. Task Prediction

각 태스크는 결과만 갖는 것이 아니라 **예상 결과**를 가진다.

```ts
interface TaskExpectation {
  expectedArtifacts: ArtifactExpectation[];
  expectedInterface: Contract;
  expectedBehavior: BehaviorConstraint[];
  expectedDependencies: DependencyExpectation[];
  expectedRisk: number;
}
```

태스크 실행 전:

\[
\hat{O}_T
=
ExpectedOutcome(T)
\]

태스크 실행 후:

\[
O_T
=
ActualOutcome(T)
\]

두 값의 차이를 계산한다.

\[
PE(T)
=
D(O_T,\hat{O}_T)
\]

이를 **Task Prediction Error**라고 정의한다.

---

# 5. 단순 변경과 의미론적 변경의 구분

모든 변경이 재계획을 요구하지 않는다.

예를 들어

```text
변수 이름 변경
```

은 실제 계획에는 영향을 주지 않을 수 있다.

반면

```text
함수 반환 타입 변경
```

은 downstream task에 영향을 준다.

따라서 change magnitude만 봐서는 안 된다.

Semantic Prediction Error를 계산한다.

\[
SPE(T)
=
w_cC
+
w_bB
+
w_dD
+
w_gG
\]

여기서

- \(C\): contract change
- \(B\): behavioral change
- \(D\): dependency change
- \(G\): goal/assumption change

이다.

---

# 6. Replanning Threshold

다음 조건에서만 재계획한다.

\[
SPE(T)>\theta_T
\]

즉

```text
작은 변화
→ 기존 계획 유지

의미 있는 변화
→ 영향 범위 계산

큰 구조적 변화
→ 상위 계획까지 재검토
```

한다.

---

# 7. Task Graph

태스크 시스템을 그래프로 정의한다.

\[
G=(V,E)
\]

각 node \(v\in V\)는 하나의 태스크다.

edge

\[
u\rightarrow v
\]

는

> v의 올바른 실행 결과가 u에 의존한다.

는 의미로 정의하자.

예:

```text
A1 ──────→ A2 ──────→ A3

B1 ──────→ B2

C1 ──────→ C2
```

A1이 변경되면 영향을 받을 가능성이 있는 node는 A1에서 dependency edge를 따라 도달할 수 있는 node다.

---

# 8. Affected Closure

변경된 node를 \(x\)라고 하자.

영향 집합을

\[
A(x)
=
\{v\in V\mid x\leadsto v\}
\cup\{x\}
\]

라고 정의한다.

즉 \(x\)로부터 dependency path가 존재하는 모든 node다.

이를 **Affected Closure**라고 부른다.

---

# 9. 가장 중요한 정리

## Local Replanning Theorem

다음 조건을 만족한다고 하자.

각 태스크 \(v\)의 결과는 자신의 입력과 직접적인 predecessor의 결과에만 의존한다.

\[
O_v
=
f_v(
I_v,
O_{p_1},
O_{p_2},
\dots,
O_{p_k}
)
\]

어떤 태스크 \(x\)의 결과가

\[
O_x
\rightarrow O'_x
\]

로 변경되었다고 하자.

그러면

\[
v\notin A(x)
\]

인 모든 태스크에 대해

\[
O'_v=O_v
\]

이다.

즉 **변경 node에서 도달할 수 없는 태스크는 다시 계산할 필요가 없다.**

---

# 10. 증명

\(v\notin A(x)\)라고 하자.

이는

\[
x\not\leadsto v
\]

라는 뜻이다.

따라서 \(v\)의 어떤 predecessor chain에도 \(x\)가 존재하지 않는다.

\(v\)의 결과는

\[
O_v
=
f_v(I_v,O_{p_1},\dots,O_{p_k})
\]

로 결정된다.

\(x\)에서 \(v\)로 가는 dependency path가 존재하지 않으므로 \(x\)의 변경은 \(p_1,\dots,p_k\) 중 어느 값에도 영향을 줄 수 없다.

따라서

\[
O'_{p_i}=O_{p_i}
\]

이며 입력 \(I_v\)도 변하지 않았다면

\[
O'_v
=
f_v(I_v,O'_{p_1},\dots,O'_{p_k})
\]

\[
=
f_v(I_v,O_{p_1},\dots,O_{p_k})
\]

\[
=O_v
\]

이다.

따라서

\[
\boxed{
v\notin A(x)
\Rightarrow
O'_v=O_v
}
\]

가 성립한다.

증명 끝.

---

# 11. 이 정리가 의미하는 것

전체 node가 \(N\)개라고 하자.

전체 재계획 비용은

\[
C_{full}
=
\sum_{v\in V}C(v)
\]

이다.

하지만 Local Replanning에서는

\[
C_{local}
=
\sum_{v\in A(x)}C(v)
\]

만 필요하다.

따라서

\[
C_{local}\le C_{full}
\]

이며

\[
|A(x)|\ll |V|
\]

인 일반적인 국소 변경에서는

\[
C_{local}\ll C_{full}
\]

가 된다.

---

# 12. Sparse Replanning

이를 앞 문서의 Sparse Activation 개념과 결합할 수 있다.

각 태스크에

\[
z_v=
\begin{cases}
1 & v\in A(x)\\
0 & v\notin A(x)
\end{cases}
\]

를 정의한다.

그러면 변경 후 계산 비용은

\[
C
=
\sum_{v\in V}
z_vC(v)
\]

이다.

즉 태스크 자체에서도 sparse activation이 발생한다.

---

# 13. 하지만 단순 dependency graph만으로 부족하다

현실에서는 다음 관계도 존재한다.

```text
depends_on
shares_contract
shares_resource
assumes
conflicts_with
integrates_with
derived_from
constrained_by
```

따라서 실제 그래프는 단순 dependency DAG보다 풍부해야 한다.

---

# 14. Causal Task Graph

다음과 같이 정의한다.

\[
G_C=(V,E,R)
\]

여기서 \(R\)은 edge relation이다.

예:

```text
A ──depends_on────→ B

C ──shares_contract→ B

D ──assumes────────→ C
```

변경 종류에 따라 따라가야 할 edge 종류가 달라진다.

---

# 15. Typed Propagation

예를 들어 implementation-only change라면

```text
depends_on
```

중에서도 실제 behavioral dependency만 전파하면 된다.

contract change라면

```text
depends_on
shares_contract
implements
integrates_with
```

까지 추적한다.

goal change라면 더 넓어진다.

```text
implements_goal
derived_from
assumes
depends_on
```

---

# 16. Change Signature

모든 변경에 signature를 만든다.

```ts
interface ChangeSignature {
  scope:
    | "syntactic"
    | "implementation"
    | "behavior"
    | "contract"
    | "dependency"
    | "assumption"
    | "subgoal"
    | "goal";

  magnitude: number;

  confidence: number;
}
```

이 signature가 propagation rule을 결정한다.

---

# 17. 인간에게서 가져올 세 번째 원리: Event Boundary

인간은 입력의 모든 미세한 변화를 새로운 사건으로 취급하지 않는다.

현재 진행 중인 event model이 충분히 작동하는 동안 유지한다.

예측이 크게 실패할 때만 새로운 event boundary를 형성하는 것으로 설명할 수 있다. citeturn628734search6turn628734search8

에이전트에서 이것은

> **계획의 어느 시점까지 기존 계획을 그대로 유지할 것인가?**

라는 문제와 대응한다.

---

# 18. Planning Boundary

태스크 그래프에 **Planning Boundary**를 추가한다.

예:

```text
Goal

├──────── Boundary A ────────┐
│                            │
│   Backend                  │
│   ├─ API                   │
│   ├─ DB                    │
│   └─ Cache                 │
│                            │
└────────────────────────────┘

├──────── Boundary B ────────┐
│                            │
│   Frontend                 │
│                            │
└────────────────────────────┘
```

Backend 내부 변경이 public contract를 넘지 않는다면 Frontend plan을 깨우지 않는다.

---

# 19. Boundary Invariant

Boundary \(B\)가 외부에 보장하는 계약을

\[
I_B
\]

라고 하자.

내부가

\[
S_B\rightarrow S'_B
\]

로 변경되어도

\[
I_B(S_B)=I_B(S'_B)
\]

라면 boundary 밖으로 변화가 전파되지 않는다.

이를 **Boundary Preservation Principle**이라 한다.

---

# 20. 또 하나의 중요한 정리

## Boundary Containment Theorem

subgraph \(S\)의 내부 상태가 변경되었지만 외부 observable contract \(I(S)\)가 보존된다고 하자.

\[
I(S')=I(S)
\]

외부 태스크들이 \(S\)의 내부 구현이 아니라 \(I(S)\)에만 의존한다면 외부 태스크의 결과는 변하지 않는다.

즉

\[
\boxed{
I(S')=I(S)
\Rightarrow
Replan(Outside(S))=False
}
\]

이다.

---

# 21. 증명

외부 태스크 \(v\)가 \(S\)에 의존한다고 하자.

단 외부에서 관찰할 수 있는 것은

\[
I(S)
\]

뿐이다.

그러므로

\[
O_v=f_v(I(S),X)
\]

이다.

변경 후

\[
O'_v=f_v(I(S'),X)
\]

인데 가정에 의해

\[
I(S')=I(S)
\]

이므로

\[
O'_v
=
f_v(I(S),X)
=
O_v
\]

이다.

따라서 외부 태스크는 재계획할 필요가 없다.

---

# 22. 이 원리가 중요한 이유

이것이 **캡슐화가 AI reasoning 비용도 줄여주는 이유**다.

좋은 software boundary는 코드 관리뿐 아니라 reasoning boundary이기도 하다.

즉 architecture quality가 높으면

\[
AffectedGraphSize\downarrow
\]

하고 따라서

\[
ReasoningCost\downarrow
\]

한다.

---

# 23. 계획 변경의 종류

계획 변경은 서로 다르게 처리해야 한다.

## Type 1 — Implementation Change

```text
방법 변경
목표 유지
contract 유지
```

전파 범위가 작다.

---

## Type 2 — Contract Change

```text
input/output 변경
```

consumer까지 전파한다.

---

## Type 3 — Assumption Change

예:

```text
"DB는 항상 available하다"
```

라는 가정이 깨졌다.

해당 assumption을 참조하는 모든 node로 전파한다.

---

## Type 4 — Subgoal Change

중간 목표 자체가 달라진다.

해당 subgoal subtree를 다시 계획한다.

---

## Type 5 — Goal Change

최상위 objective가 변한다.

가장 광범위한 재검토가 필요하다.

---

# 24. Change Radius

변경의 영향 반경을 정의한다.

\[
R(x,c)
\]

여기서

- \(x\): 변경 node
- \(c\): change type

이다.

일반적으로

\[
R_{implementation}
<
R_{contract}
<
R_{subgoal}
<
R_{goal}
\]

가 된다.

---

# 25. Replanning은 binary가 아니다

어떤 node가 영향받았다고 해서 반드시 완전히 다시 계획할 필요는 없다.

각 node에 변화 정도를 전파한다.

\[
\Delta_v
\]

라고 하자.

source node에서는

\[
\Delta_x=1
\]

이다.

edge를 지나면서 영향을 감쇠할 수 있다.

\[
\Delta_v
=
\max_{u\in pred(v)}
\Delta_u w_{uv}
\]

여기서

\[
0\le w_{uv}\le1
\]

이다.

---

# 26. Threshold Propagation

\[
\Delta_v < \theta_v
\]

라면 기존 plan을 유지한다.

\[
\Delta_v\ge\theta_v
\]

라면 재검토한다.

즉 변화가 그래프 전체로 무한 전파되는 것을 막는다.

---

# 27. 그러나 Critical Edge에서는 감쇠시키지 않는다

예:

```text
security invariant
database schema
public API
financial correctness
```

등은

\[
w=1
\]

또는 hard propagation rule을 사용한다.

---

# 28. 인간에게서 가져올 네 번째 원리: Task Switching Cost

인간은 아무 비용 없이 계획 사이를 전환하지 않는다.

task switching 연구에서는 반복 작업보다 task switch 상황에서 성능 또는 반응시간 비용이 발생하는 switching cost가 널리 관찰된다. 이러한 비용은 이전 task set의 간섭과 새로운 task set의 재구성 모두와 관련된 것으로 설명된다. citeturn628734search4

에이전트에서도 이것을 고려해야 한다.

계획을 너무 쉽게 폐기하고 재구성하면

\[
ReplanningCost
\]

가 과도하게 증가한다.

---

# 29. Replanning Hysteresis

따라서 한 번의 작은 prediction error만으로 plan을 바꾸지 않는다.

두 threshold를 둔다.

\[
\theta_{enter}
>
\theta_{exit}
\]

예:

```text
prediction error > 0.7
→ replanning mode 진입

prediction error < 0.3
→ 안정 상태 복귀
```

이를 통해 작은 변화에 계획이 계속 흔들리는 것을 방지한다.

---

# 30. Plan Stability

plan 변경 여부를 다음 최적화 문제로 볼 수 있다.

현재 계획 \(P\)를 유지하는 비용:

\[
C_{keep}
=
ExpectedFailure(P)
\]

새 계획 \(P'\)로 전환하는 비용:

\[
C_{switch}
=
ReplanningCost
+
ExecutionChangeCost
+
ExpectedFailure(P')
\]

따라서

\[
C_{switch}<C_{keep}
\]

일 때만 계획을 바꾼다.

---

# 31. 이것은 중요한 설계 변화다

단순하게

```text
더 좋은 계획 발견
→ 교체
```

하면 안 된다.

대신

\[
ExpectedGain
>
SwitchingCost
\]

일 때만 교체해야 한다.

즉

```text
better != worth changing
```

이다.

---

# 32. Hierarchical Replanning

변화가 발생했을 때 가장 작은 계획 수준부터 확인한다.

예:

```text
Action

↓

Task

↓

Subgoal

↓

Goal
```

먼저 Task 수준에서 해결을 시도한다.

불가능한 경우에만 상위로 올라간다.

---

# 33. Minimal Replanning Principle

변경 \(c\)에 대해 이를 흡수할 수 있는 가장 작은 subgraph를

\[
S^*(c)
\]

라고 하자.

\[
S^*(c)
=
\arg\min_{S}
Cost(S)
\]

subject to

\[
ValidPlanAfterChange(S,c)=True
\]

이다.

즉

> **변경을 흡수하면서 정상 계획을 복구할 수 있는 가장 작은 부분만 다시 계산한다.**

---

# 34. Replanning Escalation

```text
Change detected
       │
       ▼
Leaf repair possible?
 ├─ YES → local repair
 │
 └─ NO
      ↓
Subtask replanning possible?
 ├─ YES
 │
 └─ NO
      ↓
Subgoal replanning
      │
      ↓
Still invalid?
      │
      ▼
Goal-level replanning
```

---

# 35. 인간의 계획 적응과 매우 유사한 예

예를 들어 사람이

> 서울에서 부산까지 운전한다.

라는 목표를 가지고 있다고 하자.

계획:

```text
서울
↓
경부고속도로
↓
대전
↓
대구
↓
부산
```

대구 인근에서 특정 도로가 막혔다.

사람은 일반적으로

```text
서울에서 출발한 선택까지 다시 생각하지 않는다.
```

현재 위치와 앞으로의 경로만 다시 계산한다.

즉 과거의 완료된 prefix는 고정한다.

---

# 36. Committed Prefix

이미 완료되고 현재 변경으로 영향받지 않는 태스크를

\[
P_c
\]

라고 한다.

이를 **Committed Prefix**라고 정의한다.

계획은

\[
P=
P_c+P_f
\]

로 나뉜다.

- \(P_c\): 이미 확정된 과거
- \(P_f\): 미래 계획

변경 시

\[
P'=
P_c+P'_f
\]

만 계산한다.

---

# 37. Past Preservation Theorem

완료된 task \(v\)의 artifact가 변경되지 않았고 변경된 미래 task가 \(v\)의 결과를 소급해서 무효화하지 않는다면

\[
Recompute(v)=False
\]

이다.

이는 당연해 보이지만 에이전트 시스템에서 매우 중요하다.

LLM planner는 전체 문제를 다시 받으면 이미 확정된 결정을 쉽게 다시 논의하기 때문이다.

Control Plane이 이를 차단해야 한다.

---

# 38. Immutable Decisions

다음 조건을 만족하는 decision은 기본적으로 immutable 상태로 만든다.

```text
validated
+
executed
+
no affected dependency
```

이를 reopen하려면 명시적인 invalidation evidence가 필요하다.

---

# 39. Plan Memory

각 plan node는 다음을 기억해야 한다.

```ts
interface PlanNode {
  taskId: string;

  objective: string;

  expectedOutcome: ExpectedOutcome;

  actualOutcome?: ActualOutcome;

  dependencies: Edge[];

  assumptions: AssumptionRef[];

  boundaryContract?: Contract;

  status: PlanStatus;

  predictionError: number;

  invalidationReason?: EvidenceRef[];

  planVersion: number;
}
```

---

# 40. Change Event

```ts
interface PlanChangeEvent {
  sourceTask: TaskId;

  before: SemanticState;

  after: SemanticState;

  changeSignature: ChangeSignature;

  evidence: EvidenceRef[];

  timestamp: number;
}
```

---

# 41. Replanning 알고리즘

```text
INPUT:
changed task x

1. Compare expected and actual state

2. Compute semantic prediction error

3. If below threshold:
       preserve plan

4. Classify change

5. Select relevant edge types

6. Traverse causal graph

7. Build affected closure

8. Stop propagation at preserved boundaries

9. Calculate impact for affected nodes

10. Preserve nodes below threshold

11. Invalidate remaining nodes

12. Find lowest common affected planning boundary

13. Replan only that subgraph

14. Run deterministic validation

15. Run integration validation if boundaries intersect

16. Commit new plan version
```

---

# 42. Lowest Common Replanning Ancestor

A1과 A2가 동시에 영향을 받았다고 하자.

```text
A
├─ A1
└─ A2
```

각각 따로 재계획할 수도 있지만 두 변경이 상호작용한다면 A 수준에서 계획해야 한다.

affected nodes 집합을

\[
X=\{x_1,x_2,\dots,x_n\}
\]

이라고 하자.

트리형 계획에서는

\[
LCA(X)
\]

를 계산할 수 있다.

이를 **Lowest Common Replanning Ancestor**로 사용한다.

---

# 43. 하지만 무조건 LCA까지 올라가지는 않는다

LCA는 candidate boundary다.

contract가 유지된다면 더 작은 영역에서 해결할 수도 있다.

따라서 실제 replanning boundary는

\[
B^*
=
\arg\min_B Cost(B)
\]

subject to

\[
ContainsAffected(B)=True
\]

\[
RestoreConsistency(B)=True
\]

이다.

---

# 44. Multi-Change 문제

현실에서는 하나의 변경만 발생하지 않는다.

\[
C=
\{c_1,c_2,\dots,c_n\}
\]

여러 변경이 독립적이면 각각 처리할 수 있다.

하지만 affected closure가 겹치면

\[
A(c_i)\cap A(c_j)\neq\emptyset
\]

joint replanning이 필요하다.

---

# 45. Replanning Merge Rule

\[
A_i\cap A_j=\emptyset
\]

이면

```text
parallel local replanning
```

가능하다.

반대로

\[
A_i\cap A_j\neq\emptyset
\]

이면

```text
merge affected regions
→ joint replanning
```

한다.

---

# 46. 이로써 이전 설계의 통합 문제와 연결된다

예:

```text
A1 변경 ───┐
           ├── Shared Boundary X
B2 변경 ───┘
```

둘을 개별적으로 처리하면 둘 다 정상일 수 있다.

하지만

\[
A(A1)\cap A(B2)
\]

에 Shared Boundary X가 존재한다.

따라서 Integration Event를 발생시킨다.

---

# 47. Prediction Error를 node마다 유지한다

각 태스크의 prediction error를

\[
\epsilon_i
\]

라고 한다.

상위 subgoal error는 자식 error로부터 계산할 수 있다.

단순하게는

\[
\epsilon_{parent}
=
\max_i\epsilon_i
\]

를 사용할 수 있다.

또는 중요도에 따라

\[
\epsilon_{parent}
=
1-
\prod_i(1-w_i\epsilon_i)
\]

를 사용할 수 있다.

---

# 48. Error가 위로 올라가는 조건

모든 작은 오류를 상위로 올리면 안 된다.

\[
\epsilon_{child}<\theta_{local}
\]

이면 local repair한다.

\[
\epsilon_{child}\ge\theta_{local}
\]

이고 local invariant를 복구할 수 없다면

\[
\epsilon
\]

을 parent로 전달한다.

---

# 49. Error Escalation

```text
A1 error
 │
 │ local repair failed
 ▼
A error
 │
 │ subgoal invariant failed
 ▼
Parent error
 │
 ▼
Goal replanning
```

따라서 상위 에이전트는 작은 변화에 잠든 상태를 유지한다.

---

# 50. Adaptive Task Granularity

인간의 행동 segmentation을 응용하면 태스크 분할 크기도 고정적일 필요가 없다.

prediction error가 자주 발생하는 영역은 더 세밀하게 분할할 수 있다.

반대로 항상 안정적인 연속 태스크들은 하나의 routine으로 합칠 수 있다.

---

# 51. Split Rule

태스크 \(T\)의 내부 실패 빈도를

\[
F_T
\]

불확실성을

\[
U_T
\]

재계획 빈도를

\[
R_T
\]

라고 하자.

\[
\alpha F_T+
\beta U_T+
\gamma R_T
>
\theta_{split}
\]

이면 하위 태스크로 추가 분해한다.

---

# 52. Merge Rule

반대로 여러 태스크가 항상 함께 실행되고 독립적인 재계획이 거의 발생하지 않는다면

\[
P(independent\ change)\approx0
\]

이다.

그렇다면 하나의 reusable routine으로 합칠 수 있다.

```text
A1
A2
A3

↓

Routine A
```

이는 인간이 자주 반복하는 행동을 chunk화하는 것과 유사한 계산적 전략이다. 계층적 강화학습 연구에서도 temporally extended behaviors와 reusable subroutines를 이용하여 큰 문제를 구조화하는 접근이 핵심이다. citeturn628734search7

---

# 53. 따라서 태스크 그래프 자체도 학습한다

처음의 decomposition이 영구적이지 않다.

시스템은 실행 경험으로부터

```text
너무 큰 task
→ split

항상 함께 움직이는 tasks
→ chunk

자주 함께 실패하는 tasks
→ integration boundary

독립적으로 변하는 영역
→ separate boundary
```

를 학습한다.

---

# 54. Predictive Task Graph

결국 Task Graph를 단순 dependency graph에서 다음 형태로 확장한다.

각 edge에

```ts
interface PredictiveEdge {
  from: TaskId;
  to: TaskId;

  relation: RelationType;

  impactWeight: number;

  changeTypes: ChangeType[];

  observedPropagationRate: number;
}
```

를 기록한다.

즉 시스템은

> 이 태스크가 바뀌면 저 태스크도 얼마나 자주 바뀌는가?

를 학습한다.

---

# 55. Empirical Propagation Probability

과거 실행에서

\[
P(v\ changes\mid u\ changes)
\]

를 추정할 수 있다.

이를

\[
p_{uv}
\]

라고 하자.

edge weight를

\[
w_{uv}=p_{uv}
\]

로 업데이트할 수 있다.

---

# 56. 예상 영향도

경로

\[
u\rightarrow a\rightarrow b\rightarrow v
\]

가 있다면 단순 모델에서는

\[
P(v|u)
\approx
p_{ua}p_{ab}p_{bv}
\]

로 볼 수 있다.

값이 충분히 낮으면 speculative replanning을 생략한다.

---

# 57. 단 Critical Constraint는 확률화하지 않는다

다음 관계는 probability로 skip해서는 안 된다.

```text
type safety
security invariant
schema validity
required interface
transaction correctness
explicit user requirement
```

이들은 deterministic propagation이다.

---

# 58. 인간에게서 가져올 다섯 번째 원리: Replay

인간의 planning과 memory 연구에서는 predictive representation과 replay가 학습 및 계획 구조를 갱신하는 데 중요한 계산적 개념으로 연구되고 있다. 특히 모든 경험을 동일하게 다시 처리하기보다 중요한 상태를 우선적으로 replay하는 모델들이 인간 행동과 신경 representation을 설명하는 데 사용된다. citeturn628734search9

에이전트에서도 이것을 사용할 수 있다.

---

# 59. Prioritized Replay

변경 후 전체 history를 다시 평가하지 않는다.

priority를 계산한다.

\[
Priority(v)
=
PredictionError(v)
\times
Impact(v)
\times
Risk(v)
\]

높은 태스크부터 재검토한다.

---

# 60. 계산 예산이 제한된 경우

재계획 budget을

\[
B
\]

라고 하자.

각 node의 재검토 비용이

\[
c_i
\]

라면 다음 최적화 문제로 볼 수 있다.

\[
\max
\sum_i x_iV_i
\]

subject to

\[
\sum_i x_ic_i\le B
\]

\[
x_i\in\{0,1\}
\]

여기서

\[
V_i
=
PredictionError_i
\times
Impact_i
\times
Risk_i
\]

이다.

즉 모든 것을 재검토하지 못한다면 가장 가치 있는 곳부터 생각한다.

---

# 61. 전체 시스템

최종적으로 변경 대응 시스템은 다음 구조가 된다.

```text
                     CHANGE
                        │
                        ▼
                Prediction Error
                        │
                 error significant?
                  │             │
                 NO            YES
                  │             │
             preserve       classify
                                │
                                ▼
                       Change Signature
                                │
                                ▼
                       Causal Propagation
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
            unaffected       affected       critical
                │               │               │
              sleep         evaluate        propagate
                                │
                                ▼
                       Boundary Detection
                                │
                                ▼
                      Minimal Replan Region
                                │
                                ▼
                       Replanning Agents
                                │
                                ▼
                        Integration Check
                                │
                                ▼
                       Prediction Updated
```

---

# 62. 에이전트 상태까지 결합

Affected Closure의 node만 해당 역할 에이전트를 깨운다.

따라서

\[
ActiveAgents
=
ActivationPolicy(
AffectedTasks
)
\]

이다.

즉 두 종류의 sparsity가 중첩된다.

### Task sparsity

\[
V_{active}\subset V
\]

### Agent sparsity

\[
A_{active}\subset A
\]

결과적으로

\[
Cost
\propto
|V_{active}|
\times
|A_{active}|
\]

가 된다.

기존 시스템의

\[
|V|\times|A|
\]

보다 훨씬 작아질 수 있다.

---

# 63. 이중 Sparse Architecture

따라서 이전 문서에서 정의한 Sparse Agent Architecture를 한 단계 확장한다.

```text
전체 Task
   │
   ▼
Sparse Task Activation
   │
   ▼
Affected Tasks Only
   │
   ▼
Sparse Agent Activation
   │
   ▼
Required Agents Only
   │
   ▼
Adaptive Reasoning
```

즉

\[
\boxed{
SparseTask
\times
SparseAgent
\times
SparseContext
\times
AdaptiveReasoning
}
\]

구조다.

---

# 64. Self-Improvement

시스템은 다음 것도 학습해야 한다.

### 너무 많이 재계획했다

```text
change
→ 15 tasks invalidated
→ 실제로 2개만 영향

→ propagation policy too broad
```

### 너무 적게 재계획했다

```text
change
→ 2 tasks invalidated

later:

task 7 failed

→ missing propagation edge
```

---

# 65. Propagation Learning

보상을 다음처럼 설정한다.

\[
R=
DetectedImpact
-
\alpha ReplanningCost
-
\beta MissedImpact
\]

MissedImpact의 비용을 크게 설정하면 중요한 영역에서는 더 보수적으로 전파한다.

---

# 66. 구조적 자기개선

잘못된 학습:

```text
auth.ts가 바뀌면 UserPage도 다시 봐라.
```

올바른 학습:

```text
authentication contract의
session representation이 변경되면

session consumer까지 propagation한다.
```

즉 node 이름이 아니라 causal relation을 학습한다.

---

# 67. Agent가 계획을 마음대로 다시 만들 수 없게 해야 한다

LLM planner에게 전체 그래프를 주고

> 다시 계획해.

라고 하면 이 설계의 의미가 사라진다.

Control Plane이 먼저 결정한다.

```text
immutable nodes
affected nodes
replanning boundary
invalid assumptions
available evidence
```

LLM은 지정된 subgraph 안에서만 계획을 수정한다.

---

# 68. Replanner Input

```ts
interface ReplanningContext {
  goal: GoalRef;

  boundary: GraphRegion;

  changedNodes: TaskRef[];

  invalidatedNodes: TaskRef[];

  preservedNodes: TaskRef[];

  immutableDecisions: DecisionRef[];

  predictionErrors: PredictionError[];

  violatedInvariants: Invariant[];

  evidence: EvidenceRef[];
}
```

---

# 69. Replanner Output

```ts
interface ReplanningResult {
  revisedTasks: TaskPatch[];

  newTasks: TaskProposal[];

  removedTasks: TaskId[];

  newDependencies: EdgeProposal[];

  preservedDecisions: DecisionRef[];

  invalidatedAssumptions: AssumptionRef[];

  expectedOutcomes: ExpectedOutcome[];

  confidence: number;
}
```

---

# 70. 완료 조건

재계획은 단순히 새 task list를 만들었다고 끝나는 것이 아니다.

다음 조건을 만족해야 한다.

\[
GoalValid=True
\]

\[
GraphConsistent=True
\]

\[
BoundaryContractsValid=True
\]

\[
CriticalInvariants=True
\]

\[
PredictionError<\theta
\]

---

# 71. 새로운 전체 원리

앞선 에이전트 설계의 핵심 질문은

> 언제 생각해야 하는가?

였다.

이번 설계는 여기에 두 번째 질문을 추가한다.

> **무엇을 다시 생각해야 하는가?**

따라서 시스템은 두 단계로 판단한다.

\[
Change
\rightarrow
WhatShouldBeReconsidered?
\]

그다음

\[
AffectedTasks
\rightarrow
WhoShouldThink?
\]

한다.

---

# 72. 전체 최적화 문제

최종적으로 시스템은

\[
\min
C_{replanning}
+
C_{reasoning}
+
C_{coordination}
+
C_{failure}
\]

를 최소화하면서

\[
Correctness\ge Q_{required}
\]

를 만족시키는 것이 목표다.

또는 효율성으로 표현하면

\[
\boxed{
\eta
=
\frac
{\text{Successfully Adapted Plan}}
{\text{Replanning + Reasoning + Coordination Cost}}
}
\]

를 최대화한다.

---

# 73. 핵심 수학적 결과

이 설계에서 가장 중요한 두 성질은 실제로 증명할 수 있다.

## 1. Locality

\[
\boxed{
x\not\leadsto v
\Rightarrow
Recompute(v)=False
}
\]

변경 node와 causal dependency가 없는 node는 다시 계산할 필요가 없다.

## 2. Boundary Containment

\[
\boxed{
I(S')=I(S)
\Rightarrow
Replan(Outside(S))=False
}
\]

변경된 subgraph가 외부 contract를 그대로 유지한다면 변경은 그 boundary 내부에 격리될 수 있다.

두 정리를 합치면 다음 결과를 얻는다.

\[
\boxed{
ReplanRegion
=
CausalClosure(Change)
\cap
UnpreservedBoundaries
}
\]

즉 전체 계획이 아니라 **인과적으로 영향받고 boundary에 의해 격리되지 않은 부분만 다시 생각하면 된다.**

---

# 74. 인간의 인지에서 가져온 최종 대응관계

| 인간의 인지 | 에이전트 시스템 |
|---|---|
| Goal | 상위 Task |
| Subgoal | 하위 Task |
| Event Model | Current Plan |
| Prediction | Expected Outcome |
| Prediction Error | Task Prediction Error |
| Event Boundary | Planning Boundary |
| Task Switching | Replanning |
| Switching Cost | Replanning Cost |
| Cognitive Chunk | Reusable Task Routine |
| Hierarchical Behavior | Task/Subtask Graph |
| Selective Attention | Sparse Task Activation |
| Cognitive Control | Activation / Replanning Policy |
| Replay | Prioritized Revalidation |

---

# 75. 최종 아키텍처

```text
                           GOAL
                             │
                             ▼
                     Hierarchical Plan
                             │
                             ▼
                         Execution
                             │
                             ▼
                    Actual Observation
                             │
                             ▼
                Expected vs Actual Result
                             │
                    Prediction Error
                             │
               ┌─────────────┴─────────────┐
               │                           │
             small                       large
               │                           │
           preserve                   classify
                                           │
                                           ▼
                                    Change Type
                                           │
                                           ▼
                                    Causal Graph
                                           │
                                           ▼
                                  Affected Closure
                                           │
                                           ▼
                                Boundary Containment
                                           │
                                           ▼
                              Minimal Replan Region
                                           │
                                           ▼
                               Sparse Task Activation
                                           │
                                           ▼
                               Sparse Agent Activation
                                           │
                                           ▼
                               Adaptive Reasoning
                                           │
                                           ▼
                             Deterministic Validation
                                           │
                                           ▼
                               Integration Validation
                                           │
                                           ▼
                                      New Plan
                                           │
                                           └───────┐
                                                   │
                                           Prediction Model
                                                Updated
```

---

# 76. 최종 정의

본 시스템을 다음과 같이 정의한다.

> **Adaptive Causal Task System은 목표를 계층적 task/subtask graph로 표현하고, 각 태스크가 예상 결과와 실제 결과 사이의 prediction error를 지속적으로 관찰하며, 의미 있는 변화가 발생하면 typed causal dependency를 통해 영향 범위를 계산하고, 유지되는 boundary와 이미 확정된 결정을 보존하면서 문제를 복구할 수 있는 최소 subgraph만 재계획하는 시스템이다.**

그 후에야 필요한 에이전트를 선택적으로 활성화한다.

따라서 최종 계산 구조는

\[
\boxed{
Change
\rightarrow
PredictionError
\rightarrow
CausalPropagation
\rightarrow
MinimalReplanning
\rightarrow
SparseAgentActivation
}
\]

이다.

그리고 이 설계가 인간의 저비용 적응에서 가져오는 가장 중요한 원칙은 다음 한 문장으로 압축된다.

> **세상이 조금 바뀔 때마다 세계 전체를 다시 이해하지 않는다. 기존 모델을 유지하다가 예측이 의미 있게 틀린 지점에서만 모델을 깨뜨리고, 그 변화와 인과적으로 연결된 부분만 다시 구성한다.**

따라서 우리가 원하는 에이전트 역시

> **계획을 잘 만드는 에이전트**

에서 끝나는 것이 아니라,

> **계획의 대부분을 보존하면서 정확히 필요한 부분만 다시 계획할 수 있는 에이전트**

여야 한다.

최종적으로 앞선 에너지 효율형 에이전트 아키텍처와 결합하면 전체 철학은 다음 식으로 정리된다.

\[
\boxed{
EfficientAdaptiveIntelligence
=
SparseTaskActivation
\times
SparseAgentActivation
\times
LocalCausalReplanning
\times
BoundaryPreservation
\times
PredictionError
\times
AdaptiveReasoning
\times
StructuralLearning
}
\]

즉 시스템은 세 가지 질문을 순서대로 해결해야 한다.

**1. 무엇이 실제로 바뀌었는가?**

\[
PredictionError
\]

**2. 무엇을 다시 생각해야 하는가?**

\[
CausalAffectedClosure
\]

**3. 누가 어느 정도 깊이로 생각해야 하는가?**

\[
SparseAgentActivation
+
AdaptiveReasoning
\]

이 세 단계를 분리하는 것이 전체 시스템의 핵심이다.