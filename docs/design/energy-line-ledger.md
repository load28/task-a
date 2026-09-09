# 원문 A의 전체 줄별 구현 대응

원문 2,479논리행을 원래 순서로 모두 기록한다. 실제 기능 해석은 [절별 대응](source-implementation-map.md)과 [구현 본문](implementation-spec.md)을 함께 따른다. 수식/예시는 여러 행이 하나의 의미를 이루므로 소속 요구의 계약을 공유한다. 필드·열거값에는 별도 구체 계약을 부여한다. 빈 줄·구분선은 기능으로 계산하지 않는다.

상태: 구현할 요구의 추적표이며 코드 구현 완료 표가 아니다.

## A00 — 제목·초록

원문 1–45행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a00)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1) | # Energy-Efficient Graph Agent Architecture | 제목 | 초록의 12원칙은 동시에 만족해야 하는 시스템 요구다. 휴면은 실행 기본 상태이고 사고 여부 자체가 최적화 대상이다. |
| [2](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [3](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:3) | ## Sparse, Event-Driven, Self-Improving Multi-Agent System | 제목 | 초록의 12원칙은 동시에 만족해야 하는 시스템 요구다. 휴면은 실행 기본 상태이고 사고 여부 자체가 최적화 대상이다. |
| [4](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:4) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [5](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:5) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [6](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:6) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [7](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:7) | # 초록 | 제목 | 초록의 12원칙은 동시에 만족해야 하는 시스템 요구다. 휴면은 실행 기본 상태이고 사고 여부 자체가 최적화 대상이다. |
| [8](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:8) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [9](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:9) | 본 문서는 대규모 멀티에이전트 시스템에서 발생하는 과도한 추론 비용, 중복 계산, 불필요한 컨텍스트 전달, 통합 실패, 역할 중복, 그리고 자기개선 부재를 해결하기 위한 새로운 에이전트 아키텍처를 제안한다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [10](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:10) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [11](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:11) | 핵심 아이디어는 인간의 뇌가 높은 수준의 인지 능력을 상대적으로 작은 에너지로 수행하는 원리를 에이전트 시스템에 구조적으로 이식하는 것이다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [12](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:12) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [13](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:13) | 인간의 뇌는 모든 뉴런을 항상 동일한 강도로 활성화하지 않는다. 필요한 회로만 활성화하며, 대부분의 신경계는 특정 시점에 비활성 상태를 유지한다. 또한 계산은 중앙 집중식 메모리와 연산 장치를 왕복하는 방식이 아니라 국소적인 연결 구조에서 일어나며, 모든 판단을 최대 정밀도로 수행하지도 않는다. 불확실성이 높은 경우에만 추가 계산을 사용하고, 이미 학습된 구조와 신경 회로를 반복적으로 재사용한다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [14](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:14) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [15](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:15) | 본 설계는 이러한 특성을 다음과 같은 시스템 원칙으로 변환한다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [16](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:16) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [17](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:17) | 1. **Sparse Agent Activation** | 설명·요구 | AP의 role별 activation decision과 단일 사용 grant로 필요한 역할만 실행한다. A11–A12, T02. |
| [18](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:18) | 2. **Event-Driven Execution** | 설명·요구 | CP의 state/event/outbox transaction과 consumer로 의미 변화에서만 계산을 시작한다. A65–A66, T01. |
| [19](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:19) | 3. **Local Context Retrieval** | 설명·요구 | CM의 role selector·port 관계·budget manifest로 입력을 제한한다. A15–A18, T04. |
| [20](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:20) | 4. **Adaptive Reasoning Precision** | 설명·요구 | AP/EX가 실제 capability를 가진 L0–L5 profile을 선택하고 집행한다. A14, T03. |
| [21](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:21) | 5. **Deterministic Validation Before Reasoning** | 설명·요구 | EV가 해당 변화의 validator를 먼저 실행하고 잔여 질문만 모델에 보낸다. A13, T03. |
| [22](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:22) | 6. **Task and Dependency Graph Based Orchestration** | 설명·요구 | CG가 typed 관계와 실행 DAG를 저장·검증한다. A05/B13–B15, T05. |
| [23](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:23) | 7. **Integration-Aware Multi-Task Validation** | 설명·요구 | 공유 boundary의 exact output tuple에 독립 통합 의무를 만든다. A19–A22, T10. |
| [24](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:24) | 8. **Evidence-Based Escalation** | 설명·요구 | 위반·미해결 질문·실패 근거를 검증한 router만 추가 grant를 낸다. A38, T03. |
| [25](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:25) | 9. **Dormant-by-Default Agents** | 설명·요구 | 등록 역할에 상시 모델 세션을 만들지 않고 waiting도 event 기반으로 둔다. A09, T02. |
| [26](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:26) | 10. **Self-Improving Activation Policies** | 설명·요구 | 과거 activate/skip outcome을 후보→shadow→검증→활성 정책으로 반영한다. A28–A31, T11. |
| [27](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:27) | 11. **Reusable Intermediate Knowledge** | 설명·요구 | 일곱 인지 종류의 record와 dependency view vector를 저장한다. A03.5/A32–A35, T04. |
| [28](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:28) | 12. **Structural Rather Than Case-Specific Error Correction** | 설명·요구 | 파일명/ID 특례를 거절하고 관계·boundary·invariant 기반 DSL을 학습한다. A30/B66, T11. |
| [29](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:29) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [30](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:30) | 이 시스템에서 에이전트는 기본적으로 실행되지 않는다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [31](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:31) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [32](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:32) | 모든 에이전트의 기본 상태는 &#96;DORMANT&#96;이며, 시스템이 관찰한 이벤트, 위험도, 의존성 변화, 실패 증거, 불확실성 등의 신호가 일정 조건을 만족할 때만 활성화된다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [33](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:33) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [34](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:34) | 따라서 시스템의 목표는 단순히 다음을 최적화하는 것이 아니다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [35](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:35) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [36](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:36) | &gt; 어떻게 더 잘 생각할 것인가? | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [37](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:37) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [38](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:38) | 더 중요한 최적화 대상은 다음이다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [39](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:39) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [40](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:40) | &gt; 언제 생각해야 하며, 언제 생각하지 않아야 하는가? | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [41](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:41) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [42](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:42) | 본 문서는 이를 구현하기 위한 그래프 모델, 데이터 구조, 실행 엔진, 활성화 정책, 통합 검증 모델, 자기개선 루프 및 비용 모델을 정의한다. | 설명·요구 | 이벤트에서 영향 영역을 먼저 계산하고 역할·정밀도·컨텍스트 허가를 발급한다. 검증·통합·구조 학습까지 하나의 결과 피드백 경로로 닫는다. |
| [43](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:43) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [44](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:44) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [45](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:45) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A01 — 문제 정의

원문 46–135행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a01)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [46](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:46) | # 1. 문제 정의 | 제목 | 모든 태스크×모든 역할×전체 컨텍스트×최대 추론이 만드는 비용을 각각 줄여야 한다. UI 문자열과 공유 인터페이스 예시는 역할 필요성이 다름을 뜻한다. |
| [47](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:47) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [48](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:48) | 일반적인 멀티에이전트 시스템은 에이전트 수가 증가할수록 계산 비용이 빠르게 증가한다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [49](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:49) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [50](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:50) | 에이전트 집합을 | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [51](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:51) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [52](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:52) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [53](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:53) | A=\{a_1,a_2,\dots,a_n\} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [54](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:54) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [55](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:55) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [56](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:56) | 라고 하자. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [57](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:57) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [58](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:58) | 모든 에이전트가 모든 태스크에 참여하는 구조의 비용은 단순하게 다음처럼 표현할 수 있다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [59](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:59) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [60](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:60) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [61](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:61) | C_{\text{naive}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [62](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:62) | = | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [63](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:63) | \sum_{i=1}^{n}C(a_i) | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [64](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:64) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [65](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:65) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [66](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:66) | 에이전트가 다섯 개라면 하나의 태스크에도 다섯 번의 추론이 발생할 수 있다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [67](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:67) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [68](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:68) | 여기에 각각 동일한 전체 컨텍스트를 전달한다면 실제 비용은 | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [69](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:69) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [70](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:70) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [71](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:71) | C | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [72](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:72) | \propto | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [73](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:73) | N_{\text{agents}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [74](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:74) | \times | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [75](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:75) | N_{\text{context}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [76](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:76) | \times | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [77](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:77) | N_{\text{reasoning}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [78](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:78) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [79](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:79) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [80](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:80) | 으로 증가한다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [81](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:81) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [82](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:82) | 프로젝트가 커지면 더 큰 문제가 발생한다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [83](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:83) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [84](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:84) | 예를 들어 하나의 상위 태스크가 다음과 같이 분해된다고 하자. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [85](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:85) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [86](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:86) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [87](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:87) | Task A | 예시·흐름 | 검증 fixture: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. 구현: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [88](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:88) |  ├─ A1 | 예시·흐름 | 검증 fixture: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. 구현: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [89](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:89) |  ├─ A2 | 예시·흐름 | 검증 fixture: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. 구현: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [90](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:90) |  ├─ A3 | 예시·흐름 | 검증 fixture: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. 구현: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [91](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:91) |  └─ A4 | 예시·흐름 | 검증 fixture: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. 구현: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [92](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:92) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [93](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:93) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [94](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:94) | 각 태스크를 여러 에이전트가 반복 검토하면 비용은 | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [95](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:95) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [96](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:96) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [97](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:97) | C | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [98](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:98) | \sim | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [99](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:99) | N_{\text{tasks}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [100](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:100) | \times | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [101](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:101) | N_{\text{agents}} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [102](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:102) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [103](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:103) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [104](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:104) | 수준으로 증가한다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [105](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:105) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [106](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:106) | 하지만 실제로는 모든 역할이 모든 하위 태스크에 필요하지 않다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [107](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:107) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [108](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:108) | 예를 들어 UI 문자열 하나를 변경하는 태스크에 시스템 아키텍처 에이전트가 필요하지 않을 수 있다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [109](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:109) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [110](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:110) | 반대로 여러 하위 태스크가 공통 인터페이스를 동시에 변경했다면 각각의 개별 결과는 정상이더라도 통합 단계에서 문제가 발생할 수 있다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [111](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:111) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [112](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:112) | 따라서 필요한 것은 단순한 에이전트 호출이 아니라 다음을 판단하는 시스템이다. | 설명·요구 | task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. |
| [113](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:113) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [114](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:114) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [115](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:115) | \text{Who should think?} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [116](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:116) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [117](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:117) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [118](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:118) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [119](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:119) | \text{When should they think?} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [120](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:120) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [121](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:121) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [122](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:122) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [123](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:123) | \text{How deeply should they think?} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [124](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:124) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [125](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:125) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [126](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:126) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [127](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:127) | \text{What information should they receive?} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [128](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:128) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [129](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:129) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [130](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:130) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [131](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:131) | \text{When must several results be jointly reconsidered?} | 수식 본문 | 식 전체의 구현 계약: task/role/context/profile별 실측 비용을 분리하고 단순 문자열 변경과 다중 인터페이스 변경에 다른 허가·통합 의무를 만든다. 검증: T02,T13: 두 fixture의 활성 역할·컨텍스트·통합 의무 차이를 확인한다. |
| [132](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:132) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [133](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:133) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [134](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:134) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [135](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:135) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A02 — 설계 목표

원문 136–239행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a02)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [136](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:136) | # 2. 설계 목표 | 제목 | 2.1은 무계산→결정론→저가→일반→심층→다중 검토 순서, 2.2는 휴면, 2.3은 국소 context, 2.4는 구조적 실패 학습이다. |
| [137](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:137) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [138](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:138) | 본 시스템의 주요 목표는 다음과 같다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [139](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:139) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [140](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:140) | ## 2.1 최소 계산으로 최대 문제 해결 능력 확보 | 제목 | 2.1은 무계산→결정론→저가→일반→심층→다중 검토 순서, 2.2는 휴면, 2.3은 국소 context, 2.4는 구조적 실패 학습이다. |
| [141](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:141) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [142](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:142) | 시스템은 모든 문제에 최대 추론 자원을 투입하지 않는다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [143](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:143) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [144](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:144) | 가능한 한 다음 순서를 따른다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [145](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:145) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [146](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:146) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [147](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:147) | No computation | 예시·흐름 | 검증된 동일 입력 인지/실행 결과가 있거나 의무가 없으면 L0로 모델 호출 없이 채택/보존한다. |
| [148](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:148) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [149](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:149) | Deterministic computation | 예시·흐름 | L1 validator가 실제 AST/type/schema/test/constraint evidence를 생성한다. |
| [150](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:150) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [151](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:151) | Cheap inference | 예시·흐름 | L1 뒤 남은 좁은 분류/판단만 저비용 capability profile L2로 허가한다. |
| [152](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:152) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [153](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:153) | Normal reasoning | 예시·흐름 | L2로 해소되지 않은 도메인 질문에 L3 grant를 발급한다. |
| [154](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:154) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [155](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:155) | Deep reasoning | 예시·흐름 | 중대한 위험·불확실성 근거가 요구할 때 L4 profile을 선택한다. |
| [156](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:156) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [157](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:157) | Multi-agent review | 예시·흐름 | L5에서 독립 역할 결과를 구조화하고 충돌을 검증한다. 고정 전 역할 fanout이 아니다. |
| [158](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:158) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [159](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:159) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [160](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:160) | 즉 계산 비용은 문제의 난이도와 위험도에 따라 점진적으로 증가해야 한다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [161](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:161) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [162](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:162) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [163](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:163) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [164](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:164) | ## 2.2 필요할 때만 에이전트 활성화 | 제목 | 2.1은 무계산→결정론→저가→일반→심층→다중 검토 순서, 2.2는 휴면, 2.3은 국소 context, 2.4는 구조적 실패 학습이다. |
| [165](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:165) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [166](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:166) | 에이전트는 항상 실행 중인 작업자가 아니다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [167](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:167) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [168](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:168) | 에이전트의 기본 상태는 | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [169](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:169) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [170](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:170) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [171](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:171) | DORMANT | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [172](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:172) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [173](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:173) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [174](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:174) | 이며 특정 조건을 충족할 때만 | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [175](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:175) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [176](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:176) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [177](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:177) | ACTIVE | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [178](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:178) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [179](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:179) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [180](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:180) | 로 전환된다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [181](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:181) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [182](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:182) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [183](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:183) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [184](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:184) | ## 2.3 전역 컨텍스트 최소화 | 제목 | 2.1은 무계산→결정론→저가→일반→심층→다중 검토 순서, 2.2는 휴면, 2.3은 국소 context, 2.4는 구조적 실패 학습이다. |
| [185](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:185) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [186](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:186) | 각 에이전트는 전체 프로젝트를 받지 않는다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [187](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:187) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [188](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:188) | 다음 정보만 받는다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [189](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:189) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [190](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:190) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [191](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:191) | Context(a_i) | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [192](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:192) | = | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [193](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:193) | Task | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [194](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:194) | + | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [195](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:195) | RelevantDependencies | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [196](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:196) | + | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [197](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:197) | RelevantDecisions | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [198](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:198) | + | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [199](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:199) | Evidence | 수식 본문 | 식 전체의 구현 계약: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. 검증: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. |
| [200](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:200) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [201](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:201) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [202](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:202) | 즉 에이전트별 context slice를 구성한다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [203](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:203) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [204](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:204) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [205](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:205) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [206](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:206) | ## 2.4 문제를 특정 사례에 맞춰 임시로 해결하지 않음 | 제목 | 2.1은 무계산→결정론→저가→일반→심층→다중 검토 순서, 2.2는 휴면, 2.3은 국소 context, 2.4는 구조적 실패 학습이다. |
| [207](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:207) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [208](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:208) | 실패가 발생했을 때 시스템은 단순히 다음과 같은 규칙을 추가해서는 안 된다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [209](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:209) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [210](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:210) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [211](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:211) | if task.name == "Foo": | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [212](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:212) |     call QA | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [213](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:213) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [214](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:214) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [215](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:215) | 대신 실패의 원인을 구조적으로 분석해야 한다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [216](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:216) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [217](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:217) | 예: | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [218](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:218) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [219](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:219) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [220](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:220) | Shared interface changed | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [221](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:221) | + | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [222](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:222) | Two dependent tasks completed independently | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [223](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:223) | + | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [224](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:224) | No integration validation occurred | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [225](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:225) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [226](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:226) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [227](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:227) | 그러면 새 규칙은 | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [228](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:228) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [229](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:229) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [230](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:230) | Shared dependency mutation | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [231](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:231) | → integration validation required | 예시·흐름 | 검증 fixture: T02,T03,T04,T11: L0에서 시작하며 Foo라는 이름을 바꿔도 구조가 같으면 같은 정책 판단이다. 구현: preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [232](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:232) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [233](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:233) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [234](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:234) | 가 되어야 한다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [235](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:235) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [236](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:236) | 즉 시스템은 사례가 아니라 구조적 패턴을 학습한다. | 설명·요구 | preflight 결과로 잔여 판단을 만들고 grant 없이 추론하지 못하게 한다. role selector를 적용하고 학습 DSL에서 task.name 조건을 거절한다. |
| [237](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:237) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [238](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:238) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [239](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:239) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03 — 생물학적 영감

원문 240–247행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [240](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:240) | # 3. 생물학적 영감 | 제목 | 생물학 자체를 복제하는 것이 아니라 계산 원리를 추상화한다. |
| [241](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:241) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [242](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:242) | 본 아키텍처는 뇌 자체를 모방하는 것을 목표로 하지 않는다. | 설명·요구 | 생물학 문장은 설계 동기로 보존하고 희소성·이벤트·국소성·정밀도·재사용을 관찰 가능한 runtime 계약으로 번역한다. |
| [243](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:243) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [244](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:244) | 대신 에너지 효율성과 관련된 몇 가지 계산 원리를 추상화한다. | 설명·요구 | 생물학 문장은 설계 동기로 보존하고 희소성·이벤트·국소성·정밀도·재사용을 관찰 가능한 runtime 계약으로 번역한다. |
| [245](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:245) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [246](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:246) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [247](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:247) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03.1 — Sparse Activation

원문 248–285행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03-1)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [248](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:248) | # 3.1 Sparse Activation | 제목 | zi가 0인 역할이 다수여야 하며 비용은 실제 활성 역할에 대해서만 합산한다. |
| [249](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:249) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [250](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:250) | 뇌의 모든 뉴런이 동시에 활성화되지 않는다. | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [251](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:251) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [252](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:252) | 이를 에이전트 시스템에 적용하면 전체 에이전트 중 일부만 실행된다. | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [253](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:253) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [254](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:254) | 활성화 변수를 | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [255](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:255) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [256](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:256) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [257](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:257) | z_i\in\{0,1\} | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [258](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:258) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [259](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:259) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [260](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:260) | 이라고 하면 전체 비용은 | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [261](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:261) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [262](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:262) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [263](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:263) | C | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [264](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:264) | = | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [265](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:265) | \sum_i z_i C(a_i) | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [266](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:266) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [267](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:267) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [268](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:268) | 이다. | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [269](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:269) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [270](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:270) | 일반적인 시스템에서는 | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [271](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:271) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [272](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:272) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [273](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:273) | z_i=1 | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [274](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:274) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [275](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:275) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [276](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:276) | 인 경우가 많지만 본 시스템은 대부분의 경우 | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [277](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:277) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [278](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:278) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [279](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:279) | z_i=0 | 수식 본문 | 식 전체의 구현 계약: role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. 검증: T02: 9개 등록 역할 중 필요한 2개만 run을 만들고 나머지는 비활성 근거를 재구성한다. |
| [280](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:280) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [281](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:281) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [282](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:282) | 을 목표로 한다. | 설명·요구 | role catalog와 AgentRun을 분리하고 candidate 인덱스·activate/skip decision을 저장한다. dormant role은 세션을 생성하지 않는다. |
| [283](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:283) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [284](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:284) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [285](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:285) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03.2 — Event-Driven Computation

원문 286–309행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03-2)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [286](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:286) | # 3.2 Event-Driven Computation | 제목 | Code/Test/Dependency/Completion/Confidence/Requirement/Integration 변화가 계산을 일으킨다. |
| [287](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:287) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [288](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:288) | 뇌에는 CPU와 같은 글로벌 GHz 클럭이 없다. | 설명·요구 | outbox 소비자가 typed event를 signal로 투영하고 영향 인덱스만 갱신한다. 재시작 reconciliation은 모델 실행과 분리한다. |
| [289](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:289) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [290](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:290) | 활성화는 사건에 의해 발생한다. | 설명·요구 | outbox 소비자가 typed event를 signal로 투영하고 영향 인덱스만 갱신한다. 재시작 reconciliation은 모델 실행과 분리한다. |
| [291](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:291) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [292](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:292) | 에이전트 시스템도 polling 중심이 아니라 event 중심이어야 한다. | 설명·요구 | outbox 소비자가 typed event를 signal로 투영하고 영향 인덱스만 갱신한다. 재시작 reconciliation은 모델 실행과 분리한다. |
| [293](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:293) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [294](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:294) | 예: | 설명·요구 | outbox 소비자가 typed event를 signal로 투영하고 영향 인덱스만 갱신한다. 재시작 reconciliation은 모델 실행과 분리한다. |
| [295](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:295) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [296](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:296) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [297](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:297) | Code Changed | 예시·흐름 | 실제 code snapshot diff event를 만들고 semantic extractor로 넘긴다. |
| [298](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:298) | Test Failed | 예시·흐름 | 실패 receipt를 evidence화하고 QA hard obligation 및 원인 propagation을 생성한다. |
| [299](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:299) | Dependency Changed | 예시·흐름 | 변경 edge/input view의 consumer index부터 영향을 계산한다. |
| [300](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:300) | Task Completed | 예시·흐름 | 결과 채택·예측오차·공유 boundary 검사를 유발한다. 모든 역할 재호출 event가 아니다. |
| [301](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:301) | Confidence Dropped | 예시·흐름 | evidence 기반 confidence 갱신에서 필요한 역할만 재평가한다. |
| [302](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:302) | Requirement Changed | 예시·흐름 | explicit requirement를 critical source로 등록하고 관련 goal/consumer에 hard 전파한다. |
| [303](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:303) | Integration Conflict Detected | 예시·흐름 | exact 조합 conflict에서 causal repair region과 Integration/QA 의무를 만든다. |
| [304](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:304) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [305](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:305) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [306](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:306) | 이러한 이벤트가 계산을 유발한다. | 설명·요구 | outbox 소비자가 typed event를 signal로 투영하고 영향 인덱스만 갱신한다. 재시작 reconciliation은 모델 실행과 분리한다. |
| [307](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:307) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [308](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:308) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [309](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:309) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03.3 — Locality

원문 310–319행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03-3)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [310](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:310) | # 3.3 Locality | 제목 | Task/Knowledge 관계를 통해 정보 전달을 국소화한다. |
| [311](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:311) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [312](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:312) | 뇌의 연결은 대부분 국소적이다. | 설명·요구 | knowledge/decision/evidence의 소비 관계를 저장하고 role별 관련 포트만 context manifest에 포함한다. |
| [313](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:313) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [314](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:314) | 에이전트 시스템에서도 모든 데이터가 모든 에이전트에게 전달되면 안 된다. | 설명·요구 | knowledge/decision/evidence의 소비 관계를 저장하고 role별 관련 포트만 context manifest에 포함한다. |
| [315](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:315) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [316](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:316) | Task Graph와 Knowledge Graph를 통해 필요한 정보만 선택한다. | 설명·요구 | knowledge/decision/evidence의 소비 관계를 저장하고 role별 관련 포트만 context manifest에 포함한다. |
| [317](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:317) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [318](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:318) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [319](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:319) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03.4 — Approximate First

원문 320–341행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03-4)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [320](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:320) | # 3.4 Approximate First | 제목 | Rule→Classifier→Small model→Reasoning model→Deep review는 낮은 정밀도로 시작하는 계산 사다리다. |
| [321](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:321) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [322](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:322) | 뇌는 모든 문제를 최대 정밀도로 풀지 않는다. | 설명·요구 | 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [323](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:323) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [324](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:324) | 따라서 시스템은 먼저 저비용 판단을 사용한다. | 설명·요구 | 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [325](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:325) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [326](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:326) | 예: | 설명·요구 | 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [327](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:327) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [328](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:328) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [329](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:329) | Rule | 예시·흐름 | 검증 fixture: T03: 정적 분류가 충분하면 classifier 모델조차 호출하지 않는다. 구현: 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [330](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:330) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [331](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:331) | Classifier | 예시·흐름 | 검증 fixture: T03: 정적 분류가 충분하면 classifier 모델조차 호출하지 않는다. 구현: 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [332](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:332) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [333](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:333) | Small model | 예시·흐름 | 검증 fixture: T03: 정적 분류가 충분하면 classifier 모델조차 호출하지 않는다. 구현: 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [334](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:334) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [335](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:335) | Reasoning model | 예시·흐름 | 검증 fixture: T03: 정적 분류가 충분하면 classifier 모델조차 호출하지 않는다. 구현: 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [336](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:336) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [337](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:337) | Deep review | 예시·흐름 | 검증 fixture: T03: 정적 분류가 충분하면 classifier 모델조차 호출하지 않는다. 구현: 결정론 분류와 모델 분류를 구별하고 미해결 신호에만 capability 검증된 다음 profile을 허가한다. |
| [338](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:338) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [339](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:339) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [340](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:340) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [341](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:341) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A03.5 — Reuse

원문 342–361행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a03-5)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [342](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:342) | # 3.5 Reuse | 제목 | decision/analysis/test/architecture/dependency/risk/research를 모두 재사용한다. |
| [343](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:343) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [344](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:344) | 뇌는 매번 세상을 처음부터 해석하지 않는다. | 설명·요구 | 종류별 CognitiveRecord와 semantic view vector를 저장하고 각각 유효성·근거·만료를 확인한다. |
| [345](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:345) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [346](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:346) | 이전 계산 결과를 재사용한다. | 설명·요구 | 종류별 CognitiveRecord와 semantic view vector를 저장하고 각각 유효성·근거·만료를 확인한다. |
| [347](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:347) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [348](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:348) | 에이전트 시스템에서는 다음을 캐시한다. | 설명·요구 | 종류별 CognitiveRecord와 semantic view vector를 저장하고 각각 유효성·근거·만료를 확인한다. |
| [349](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:349) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [350](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:350) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [351](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:351) | decision | 예시·흐름 | 검증된 DecisionVersion과 assumption/evidence 소비 vector를 캐시한다. |
| [352](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:352) | analysis | 예시·흐름 | 분석 conclusion/question별 CognitiveRecord와 input view를 캐시한다. |
| [353](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:353) | test result | 예시·흐름 | 실제 validator/command/environment/input/output hash와 receipt가 같은 결과만 재사용한다. |
| [354](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:354) | architecture reasoning | 예시·흐름 | boundary/dependency 의미 view가 유효한 architecture conclusion을 재사용한다. |
| [355](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:355) | dependency summary | 예시·흐름 | 실제 graphVersion/port view를 요약한 record이며 해당 view 변경 시만 무효화한다. |
| [356](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:356) | risk assessment | 예시·흐름 | risk model/policy/evidence version을 고정하고 새로운 실패·가정 evidence에서 갱신한다. |
| [357](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:357) | research evidence | 예시·흐름 | 출처·관찰시각·내용 hash·만료 조건이 유효한 외부 사실만 재사용한다. |
| [358](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:358) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [359](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:359) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [360](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:360) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [361](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:361) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A04 — 핵심 아키텍처

원문 362–411행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a04)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [362](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:362) | # 4. 핵심 아키텍처 | 제목 | Ingestor→Extractor→Deterministic/Risk→Router→Role→Graph→Integration→Validation→Learning의 모든 연결이 필요하다. |
| [363](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:363) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [364](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:364) | 전체 시스템은 다음과 같이 구성된다. | 설명·요구 | graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [365](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:365) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [366](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:366) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [367](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:367) |                     User / External Event | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [368](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:368) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [369](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:369) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [370](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:370) |                      ┌───────────────┐ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [371](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:371) |                      │ Event Ingestor│ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [372](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:372) |                      └───────┬───────┘ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [373](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:373) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [374](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:374) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [375](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:375) |                      ┌───────────────┐ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [376](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:376) |                      │Signal Extractor│ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [377](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:377) |                      └───────┬───────┘ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [378](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:378) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [379](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:379) |                 ┌────────────┴────────────┐ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [380](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:380) |                 │                         │ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [381](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:381) |                 ▼                         ▼ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [382](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:382) |         Deterministic Engine        Risk Estimator | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [383](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:383) |                 │                         │ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [384](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:384) |                 └────────────┬────────────┘ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [385](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:385) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [386](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:386) |                     Activation Router | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [387](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:387) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [388](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:388) |                  ┌───────────┼────────────┐ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [389](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:389) |                  │           │            │ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [390](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:390) |                  ▼           ▼            ▼ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [391](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:391) |              Architect      QA         Research | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [392](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:392) |                  │           │            │ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [393](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:393) |                  └───────────┼────────────┘ | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [394](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:394) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [395](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:395) |                         Task Graph | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [396](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:396) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [397](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:397) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [398](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:398) |                    Integration Engine | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [399](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:399) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [400](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:400) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [401](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:401) |                     Validation Engine | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [402](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:402) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [403](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:403) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [404](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:404) |                      Result / Evidence | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [405](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:405) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [406](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:406) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [407](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:407) |                    Self-Improvement Loop | 예시·흐름 | 검증 fixture: T15: 앞단 신호부터 마지막 policy feedback까지 끊긴 구간 없이 trace된다. 구현: graph-runtime이 control runtime을 생성하고 event/evidence와 role result로 전체 흐름을 연결한다. OpenCode는 허가된 판단 실행만 맡는다. |
| [408](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:408) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [409](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:409) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [410](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:410) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [411](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:411) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A05 — Task Graph

원문 412–464행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a05)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [412](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:412) | # 5. Task Graph | 제목 | Task Graph는 트리 외 교차 관계와 depends_on/blocks/implements/validates/integrates_with/generated_from/supersedes를 표현한다. |
| [413](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:413) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [414](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:414) | 시스템의 중심은 태스크 그래프다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [415](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:415) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [416](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:416) | 태스크는 단순 목록이 아니다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [417](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:417) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [418](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:418) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [419](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:419) | G_T=(V,E) | 수식 본문 | 식 전체의 구현 계약: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. 검증: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. |
| [420](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:420) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [421](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:421) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [422](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:422) | 로 정의되는 방향성 그래프다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [423](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:423) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [424](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:424) | 각 노드 \(v\in V\)는 태스크를 의미한다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [425](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:425) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [426](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:426) | 각 edge는 관계를 의미한다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [427](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:427) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [428](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:428) | 예: | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [429](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:429) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [430](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:430) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [431](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:431) | depends_on | 예시·흐름 | 생산자 output/input view 변화가 실제 consumer로 전달되는 인과 관계다. |
| [432](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:432) | blocks | 예시·흐름 | readiness를 차단하는 관계이며 모든 semantic scope로 무조건 전파하지 않는다. |
| [433](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:433) | implements | 예시·흐름 | task가 contract/requirement를 실현하는 관계로 해당 contract/goal 변화에서 검증한다. |
| [434](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:434) | validates | 예시·흐름 | 검증 결과가 대상 버전에 의존한다. 대상 변경은 해당 validator obligation을 갱신한다. |
| [435](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:435) | integrates_with | 예시·흐름 | 공동 output tuple·boundary를 공유하는 관계로 joint validation을 만든다. |
| [436](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:436) | generated_from | 예시·흐름 | 생성 artifact가 원본의 실제 view를 소비한 lineage 관계다. |
| [437](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:437) | supersedes | 예시·흐름 | 현행 version 선택과 역사 계보를 나타내며 오래된 결과를 삭제하거나 무조건 재실행하지 않는다. |
| [438](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:438) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [439](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:439) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [440](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:440) | 예를 들어: | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [441](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:441) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [442](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:442) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [443](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:443) | Authentication | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [444](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:444) |  ├─ Token issuance | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [445](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:445) |  ├─ Token validation | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [446](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:446) |  ├─ Refresh handling | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [447](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:447) |  └─ Authorization middleware | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [448](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:448) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [449](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:449) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [450](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:450) | 하지만 트리만으로 충분하지 않다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [451](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:451) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [452](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:452) | 실제 의존 관계는 다음처럼 교차한다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [453](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:453) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [454](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:454) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [455](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:455) | Token issuance ──────┐ | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [456](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:456) |                      ├── API Gateway | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [457](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:457) | Token validation ────┤ | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [458](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:458) |                      └── Authorization middleware | 예시·흐름 | 검증 fixture: T05: 교차 의존과 각 relation의 전파·비전파 의미 및 cycle 처리가 검증된다. 구현: typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [459](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:459) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [460](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:460) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [461](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:461) | 따라서 DAG 또는 일반 graph가 필요하다. | 설명·요구 | typed edge registry에 일곱 관계를 등록하고 hierarchy/DAG 실행 순서/일반 인과 그래프를 분리한다. |
| [462](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:462) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [463](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:463) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [464](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:464) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A06 — Task Model

원문 465–508행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a06)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [465](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:465) | # 6. Task Model | 제목 | Task의 id/title/objective/status/parent/children/dependencies/artifacts/assumptions/decisions/evidence/risk/confidence/version 전부가 실행 가능한 지식 상태다. |
| [466](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:466) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [467](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:467) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [468](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:468) | interface Task { | 타입 선언 | Task의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [469](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:469) |   id: string | 데이터 필드 | 서버가 할당하는 stable task identity이며 spec/attempt/version과 구분한다. |
| [470](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:470) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [471](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:471) |   title: string | 데이터 필드 | 표시용 제목이다. 제목 변경만으로 semantic cache나 downstream을 무효화하지 않는다. |
| [472](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:472) |   objective: string | 데이터 필드 | 승인 목표의 의미를 TaskSpecVersion에 고정하고 변경은 goal/subgoal signature를 생성한다. |
| [473](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:473) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [474](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:474) |   status: | 데이터 필드 | 기존 상태와 의미 대응한다. review는 implemented 이후 검증 의무 상태이며 completed는 전체 완료 conjunction을 통과해야 한다. |
| [475](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:475) |     &#124; "created" | 열거값 | 기존 pending에 대응하며 기대·입력·의무 준비 전에는 실행할 수 없다. |
| [476](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:476) |     &#124; "ready" | 열거값 | dependency와 admission의 준비 상태를 구분한다. ready 자체는 모델 실행 허가가 아니다. |
| [477](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:477) |     &#124; "running" | 열거값 | 허가된 implementation attempt만 해당 상태를 갖고 role review run과 구분한다. |
| [478](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:478) |     &#124; "blocked" | 열거값 | 해결할 dependency/의무/실패 근거와 unblock event를 유지한다. |
| [479](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:479) |     &#124; "review" | 열거값 | implemented 이후 local/role/integration 검증 의무가 남은 상태로 대응한다. |
| [480](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:480) |     &#124; "completed" | 열거값 | 최신 입력과 모든 완료 conjunction 충족 후에만 task/goal 완료를 판정한다. |
| [481](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:481) |     &#124; "failed" | 열거값 | 실패 evidence와 attribution을 기록하고 해당 영향 영역만 복구한다. |
| [482](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:482) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [483](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:483) |   parent?: TaskId | 데이터 필드 | 계층 부모 참조이다. 외래키와 hierarchy cycle을 검사하며 인과 의존성과 구분한다. |
| [484](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:484) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [485](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:485) |   children: TaskId[] | 데이터 필드 | 정규화 parent 관계로 조회한다. 별도 배열을 이중 갱신하여 불일치를 만들지 않는다. |
| [486](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:486) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [487](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:487) |   dependencies: DependencyEdge[] | 데이터 필드 | typed CausalEdgeVersion의 실행 의존 view이다. source→consumer 방향과 버전을 고정한다. |
| [488](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:488) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [489](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:489) |   artifacts: ArtifactRef[] | 데이터 필드 | actual artifact/version refs이다. 문자열 요약이 아니라 실제 output hash·계보로 검증한다. |
| [490](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:490) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [491](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:491) |   assumptions: Assumption[] | 데이터 필드 | 버전 가정 참조를 저장하고 invalidation 시 assumes consumer index로 전파한다. |
| [492](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:492) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [493](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:493) |   decisions: DecisionRef[] | 데이터 필드 | DecisionVersion 참조이다. validated/executed/비영향 결정은 immutable로 보호한다. |
| [494](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:494) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [495](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:495) |   evidence: EvidenceRef[] | 데이터 필드 | EvidenceVersion exact refs를 저장하고 출처·hash·유효기간을 검증한다. |
| [496](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:496) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [497](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:497) |   risk: RiskState | 데이터 필드 | 현재 RiskState의 version ref로 저장하고 독립 확률/보수 score를 구분한다. |
| [498](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:498) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [499](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:499) |   confidence: number | 데이터 필드 | [0,1] 범위 및 evidence 근거를 검증하고 중요 dependency min으로 집계한다. |
| [500](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:500) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [501](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:501) |   version: number | 데이터 필드 | specVersion/runtime generation/attempt token을 분리하여 각 변경 의미를 보존한다. |
| [502](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:502) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [503](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:503) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [504](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:504) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [505](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:505) | 핵심은 태스크가 단순한 텍스트가 아니라 **실행 가능한 지식 단위**라는 점이다. | 설명·요구 | TaskSpecVersion·TaskRuntime으로 분리하고 모든 필드를 정규화 참조와 버전으로 연결한다. 원문 상태를 기존 상태와 명시 대응한다. |
| [506](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:506) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [507](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:507) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [508](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:508) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A07 — Agent와 Role 분리

원문 509–549행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a07)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [509](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:509) | # 7. Agent와 Role 분리 | 제목 | 역할은 능력·책임이고 agent는 실행 인스턴스다. 같은 역할의 복수 인스턴스와 새 전문 역할을 허용한다. |
| [510](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:510) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [511](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:511) | Agent와 Role을 분리한다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [512](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:512) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [513](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:513) | Role은 능력과 책임을 정의한다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [514](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:514) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [515](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:515) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [516](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:516) | Architect | 예시·흐름 | architecture boundary·dependency 방향·invariant 판단 역할로 등록한다. |
| [517](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:517) | QA | 예시·흐름 | 미검증 실패·의미 변화·조합 coverage 판단 역할로 등록한다. |
| [518](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:518) | Researcher | 예시·흐름 | 필요 외부 사실의 출처·버전·유효성 확보 역할로 등록한다. |
| [519](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:519) | Critic | 예시·흐름 | 가정·증거 공백·반례·거짓 확신을 찾는 선택적 역할로 등록한다. |
| [520](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:520) | UX | 예시·흐름 | 사용자 경험 관련 요구/신호가 있을 때만 후보가 되는 역할로 등록한다. |
| [521](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:521) | Implementation | 예시·흐름 | 허가된 task/spec/input/write scope의 구현 역할로 등록한다. |
| [522](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:522) | Security | 예시·흐름 | security invariant와 위험에 대한 recall 우선 검토 역할로 등록한다. |
| [523](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:523) | Performance | 예시·흐름 | 성능 요구·자원/시간 제약의 근거가 있을 때 검토하는 역할로 등록한다. |
| [524](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:524) | Integration | 예시·흐름 | 여러 output의 7차원 호환성·emergent risk를 판단하는 역할로 등록한다. |
| [525](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:525) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [526](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:526) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [527](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:527) | Agent는 실제 실행 인스턴스다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [528](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:528) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [529](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:529) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [530](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:530) | Agent Instance | 예시·흐름 | 검증 fixture: T02,T12: 동일 역할 두 run은 독립 상태이며 새 역할 등록만으로 실행하지 않는다. 구현: RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [531](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:531) |     │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [532](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:532) |     └── Assigned Role | 예시·흐름 | 검증 fixture: T02,T12: 동일 역할 두 run은 독립 상태이며 새 역할 등록만으로 실행하지 않는다. 구현: RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [533](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:533) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [534](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:534) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [535](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:535) | 동일한 role을 여러 에이전트가 맡을 수 있다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [536](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:536) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [537](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:537) | 또한 새로운 role을 동적으로 생성할 수 있다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [538](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:538) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [539](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:539) | 예: | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [540](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:540) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [541](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:541) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [542](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:542) | Role: | 예시·흐름 | 검증 fixture: T02,T12: 동일 역할 두 run은 독립 상태이며 새 역할 등록만으로 실행하지 않는다. 구현: RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [543](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:543) | Database Migration Specialist | 예시·흐름 | 검증 fixture: T02,T12: 동일 역할 두 run은 독립 상태이며 새 역할 등록만으로 실행하지 않는다. 구현: RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [544](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:544) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [545](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:545) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [546](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:546) | 새로운 agent가 이 role을 부여받을 수 있다. | 설명·요구 | RoleVersion과 AgentRun을 분리하고 roleId가 아니라 runId로 자원·비용·상태를 관리한다. 전문 역할은 검증된 capability 부족에서 제안한다. |
| [547](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:547) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [548](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:548) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [549](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:549) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A08 — Role Definition

원문 550–585행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a08)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [550](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:550) | # 8. Role Definition | 제목 | Role의 purpose/capabilities/activationPolicy/requiredContext/outputSchema/validators는 prompt와 동등한 필수 구성이다. |
| [551](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:551) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [552](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:552) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [553](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:553) | interface Role { | 타입 선언 | Role의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [554](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:554) |   id: string | 데이터 필드 | role identity이며 실제 worker/run ID와 다르다. |
| [555](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:555) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [556](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:556) |   name: string | 데이터 필드 | 표시용 이름이다. 이름 문자열이 activation condition이 되지 않는다. |
| [557](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:557) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [558](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:558) |   purpose: string | 데이터 필드 | 역할의 책임을 불변 RoleVersion에 저장하고 다른 역할과 중복 평가에 사용한다. |
| [559](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:559) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [560](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:560) |   capabilities: Capability[] | 데이터 필드 | 도메인 능력 집합으로 전문 역할 필요성과 기존 역할 부족을 평가한다. |
| [561](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:561) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [562](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:562) |   activationPolicy: ActivationPolicy | 데이터 필드 | 불변 정책 버전 참조이다. grant 발급에서 hard/soft/quota를 서버가 평가한다. |
| [563](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:563) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [564](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:564) |   requiredContext: ContextSelector[] | 데이터 필드 | relation/port/evidence selector 집합이다. prompt 요청이 아닌 context gateway의 강제 필터다. |
| [565](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:565) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [566](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:566) |   outputSchema: Schema | 데이터 필드 | structured result schema의 불변 ref이다. 파싱과 의미·근거 검증 전 결과를 채택하지 않는다. |
| [567](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:567) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [568](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:568) |   validators: ValidatorRef[] | 데이터 필드 | 필요 deterministic/role 검증자 version refs이다. 누락된 mandatory validator는 완료를 막는다. |
| [569](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:569) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [570](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:570) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [571](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:571) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [572](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:572) | Role은 단순 prompt가 아니다. | 설명·요구 | immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [573](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:573) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [574](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:574) | Role은 다음을 함께 가진다. | 설명·요구 | immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [575](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:575) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [576](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:576) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [577](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:577) | Prompt | 예시·흐름 | 검증 fixture: T02,T04: 필수 필드나 validator가 없는 role은 grant 발급이 거절된다. 구현: immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [578](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:578) | Activation rule | 예시·흐름 | 검증 fixture: T02,T04: 필수 필드나 validator가 없는 role은 grant 발급이 거절된다. 구현: immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [579](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:579) | Required context | 예시·흐름 | 검증 fixture: T02,T04: 필수 필드나 validator가 없는 role은 grant 발급이 거절된다. 구현: immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [580](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:580) | Expected output | 예시·흐름 | 검증 fixture: T02,T04: 필수 필드나 validator가 없는 role은 grant 발급이 거절된다. 구현: immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [581](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:581) | Validation rule | 예시·흐름 | 검증 fixture: T02,T04: 필수 필드나 validator가 없는 role은 grant 발급이 거절된다. 구현: immutable RoleVersion과 참조 스키마를 만들고 start·context·result admission 각각에서 정책·selector·schema·validator를 확인한다. |
| [582](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:582) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [583](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:583) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [584](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:584) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [585](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:585) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A09 — Dormant-by-Default 모델

원문 586–620행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a09)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [586](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:586) | # 9. Dormant-by-Default 모델 | 제목 | dormant→candidate→active→dormant와 waiting/completed의 lifecycle을 표현한다. |
| [587](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:587) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [588](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:588) | 모든 에이전트는 기본적으로 dormant다. | 설명·요구 | AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [589](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:589) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [590](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:590) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [591](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:591) | type AgentState = | 타입 선언 | AgentState의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [592](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:592) |   &#124; "dormant" | 열거값 | 등록 역할에 실행 세션이 없는 기본 상태다. |
| [593](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:593) |   &#124; "candidate" | 열거값 | 신호가 일치했지만 activation score/필수 조건/자원 허가 전인 상태다. |
| [594](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:594) |   &#124; "active" | 열거값 | 단일 사용 grant와 pinned context/profile로 실행 중이다. |
| [595](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:595) |   &#124; "waiting" | 열거값 | 증거·자원·종료 event를 기다리며 모델 polling을 하지 않는다. |
| [596](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:596) |   &#124; "completed" | 열거값 | 해당 run의 terminal 기록을 유지하고 역할은 다시 dormant가 된다. |
| [597](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:597) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [598](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:598) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [599](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:599) | 상태 전이는 다음과 같다. | 설명·요구 | AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [600](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:600) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [601](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:601) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [602](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:602) | DORMANT | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [603](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:603) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [604](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:604) | Signal matched | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [605](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:605) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [606](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:606) | CANDIDATE | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [607](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:607) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [608](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:608) | Activation score passed | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [609](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:609) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [610](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:610) | ACTIVE | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [611](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:611) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [612](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:612) | Task completed | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [613](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:613) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [614](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:614) | DORMANT | 예시·흐름 | 검증 fixture: T02: 실행 완료·실패·대기·재시작 뒤 상태 전이가 중복 세션을 만들지 않는다. 구현: AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [615](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:615) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [616](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:616) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [617](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:617) | 에이전트는 상시 프로세스가 아니라 필요할 때 잠깐 활성화되는 계산 단위다. | 설명·요구 | AgentRun terminal completed는 보존하고 role availability는 dormant로 복귀한다. waiting은 증거/자원 event에서만 깨어난다. |
| [618](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:618) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [619](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:619) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [620](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:620) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A10 — Signal Extraction

원문 621–668행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a10)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [621](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:621) | # 10. Signal Extraction | 제목 | File changed event를 public API/type/shared dependency/test coverage/fanout 등 여러 signal로 변환한다. SignalSet의 10필드를 모두 사용한다. |
| [622](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:622) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [623](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:623) | Event 자체가 바로 에이전트를 호출해서는 안 된다. | 설명·요구 | AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [624](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:624) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [625](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:625) | 먼저 signal로 변환한다. | 설명·요구 | AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [626](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:626) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [627](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:627) | 예: | 설명·요구 | AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [628](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:628) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [629](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:629) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [630](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:630) | Event: | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [631](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:631) | File changed | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [632](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:632) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [633](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:633) | Signals: | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [634](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:634) | - public API changed | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [635](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:635) | - type definition changed | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [636](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:636) | - shared dependency affected | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [637](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:637) | - test coverage exists | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [638](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:638) | - downstream modules = 7 | 예시·흐름 | 검증 fixture: T05,T07: 같은 파일 수라도 API 변경·단순 편집에 다른 signal이 나오고 판정 불가는 unknown이다. 구현: AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [639](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:639) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [640](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:640) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [641](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:641) | signal 구조: | 설명·요구 | AST/타입/테스트/graph extractor와 unknown 상태를 추가한다. changed files/symbols/interfaces와 모든 위험·외부지식·semantic 필드를 근거로 저장한다. |
| [642](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:642) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [643](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:643) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [644](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:644) | interface SignalSet { | 타입 선언 | SignalSet의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [645](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:645) |   changedFiles: FileRef[] | 데이터 필드 | 실제 before/after code snapshot diff의 파일 참조이다. 파일명 규칙 대신 의미 추출 입력으로 사용한다. |
| [646](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:646) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [647](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:647) |   changedSymbols: SymbolRef[] | 데이터 필드 | AST/symbol analyzer의 변경 symbol과 provenance이다. 분석 불가를 빈 집합으로 위조하지 않는다. |
| [648](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:648) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [649](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:649) |   changedInterfaces: InterfaceRef[] | 데이터 필드 | 실제 public port/contract 변경 참조이다. shared boundary·consumer 검토에 연결한다. |
| [650](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:650) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [651](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:651) |   failingTests: TestRef[] | 데이터 필드 | 실행 receipt에 연결된 실패 test refs이다. QA hard trigger 근거가 된다. |
| [652](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:652) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [653](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:653) |   affectedDependencies: DependencyRef[] | 데이터 필드 | graphVersion에 고정된 영향 dependency refs이며 단순 파일 수로 대체하지 않는다. |
| [654](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:654) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [655](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:655) |   uncertainty: number | 데이터 필드 | 미해결 질문·unknown 판정의 정규화 score와 근거를 저장한다. |
| [656](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:656) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [657](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:657) |   risk: number | 데이터 필드 | 일반 위험 score/model version이다. 값만 제출한 agent 자기평가로 확정하지 않는다. |
| [658](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:658) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [659](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:659) |   integrationRisk: number | 데이터 필드 | 공유 경계·미검증 tuple·cross-task 충돌의 별도 위험 score이다. |
| [660](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:660) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [661](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:661) |   externalKnowledgeRequired: boolean | 데이터 필드 | 현재 유효 evidence로 충족되지 않은 외부 사실 요구이다. Research hard trigger에 연결한다. |
| [662](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:662) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [663](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:663) |   semanticChange: boolean | 데이터 필드 | 기계적 diff와 구분되는 의미 변화 여부이다. unknown 판정을 보존하도록 내부 tri-state를 확장한다. |
| [664](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:664) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [665](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:665) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [666](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:666) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [667](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:667) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [668](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:668) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A11 — Activation Router

원문 669–701행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a11)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [669](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:669) | # 11. Activation Router | 제목 | R/U/D/F/I의 가중 점수와 역할별 threshold로 soft activation을 결정한다. |
| [670](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:670) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [671](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:671) | Activation Router는 어떤 에이전트를 활성화할지 판단한다. | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [672](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:672) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [673](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:673) | 각 에이전트 \(a_i\)에 대해 activation score를 계산한다. | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [674](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:674) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [675](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:675) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [676](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:676) | S_i = | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [677](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:677) | w_1R | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [678](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:678) | +w_2U | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [679](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:679) | +w_3D | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [680](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:680) | +w_4F | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [681](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:681) | +w_5I | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [682](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:682) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [683](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:683) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [684](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:684) | 여기서 | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [685](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:685) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [686](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:686) | - \(R\): risk | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [687](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:687) | - \(U\): uncertainty | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [688](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:688) | - \(D\): dependency impact | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [689](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:689) | - \(F\): failure evidence | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [690](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:690) | - \(I\): integration risk | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [691](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:691) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [692](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:692) | 활성화 조건: | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [693](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:693) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [694](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:694) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [695](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:695) | S_i&gt;\theta_i | 수식 본문 | 식 전체의 구현 계약: 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. 검증: T02: 동일 snapshot/policy의 score·판정이 재시작 전후 같고 경계값을 검사한다. |
| [696](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:696) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [697](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:697) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [698](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:698) | 이면 에이전트를 실행한다. | 설명·요구 | 정규화 feature vector와 immutable weights/threshold로 ActivationDecision을 생성한다. scheduler는 그 결정 이후 예약한다. |
| [699](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:699) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [700](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:700) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [701](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:701) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A12 — Activation Policy

원문 702–758행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a12)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [702](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:702) | # 12. Activation Policy | 제목 | hardTriggers/softSignals/threshold/cooldown/maxInvocations를 모두 적용한다. QA/Architect/Research의 hard/soft 사례도 각각 다르다. |
| [703](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:703) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [704](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:704) | 예: | 설명·요구 | 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [705](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:705) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [706](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:706) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [707](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:707) | interface ActivationPolicy { | 타입 선언 | ActivationPolicy의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [708](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:708) |   hardTriggers: Trigger[] | 데이터 필드 | 근거가 일치하면 mandatory obligation을 만든다. cooldown/budget 때문에 satisfied로 바꾸지 않는다. |
| [709](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:709) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [710](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:710) |   softSignals: WeightedSignal[] | 데이터 필드 | 정규화 feature와 weight의 불변 집합이다. 계산 내역을 decision에 기록한다. |
| [711](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:711) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [712](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:712) |   threshold: number | 데이터 필드 | role별 score 비교값이다. 허용 범위·경계값 규칙·calibration version을 검증한다. |
| [713](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:713) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [714](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:714) |   cooldown?: Duration | 데이터 필드 | 동일 episode/role 반복을 억제하는 시간 정책이다. expiry event는 재평가만 유발하며 자동 모델 호출이 아니다. |
| [715](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:715) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [716](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:716) |   maxInvocationsPerTask?: number | 데이터 필드 | task/role/policy 범위의 허용 호출 수이다. hard 의무와 충돌하면 wait/escalation한다. |
| [717](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:717) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [718](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:718) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [719](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:719) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [720](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:720) | QA Agent: | 설명·요구 | 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [721](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:721) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [722](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:722) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [723](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:723) | Hard trigger: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [724](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:724) | - test failure | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [725](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:725) | - integration failure | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [726](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:726) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [727](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:727) | Soft signals: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [728](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:728) | + public API changed | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [729](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:729) | + shared dependency changed | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [730](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:730) | + high-risk task | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [731](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:731) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [732](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:732) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [733](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:733) | Architect Agent: | 설명·요구 | 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [734](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:734) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [735](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:735) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [736](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:736) | Hard trigger: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [737](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:737) | - architectural invariant violated | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [738](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:738) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [739](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:739) | Soft signals: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [740](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:740) | + module boundary changed | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [741](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:741) | + dependency direction changed | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [742](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:742) | + new infrastructure component | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [743](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:743) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [744](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:744) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [745](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:745) | Research Agent: | 설명·요구 | 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [746](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:746) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [747](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:747) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [748](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:748) | Hard trigger: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [749](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:749) | - external fact required | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [750](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:750) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [751](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:751) | Soft signals: | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [752](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:752) | + low confidence | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [753](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:753) | + unfamiliar technology | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [754](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:754) | + version-dependent behavior | 예시·흐름 | 검증 fixture: T02: test failure·invariant violation·external fact 세 hard trigger와 각각의 soft 조합을 검사한다. 구현: 세 역할의 초기 규칙을 evidence 기반으로 정의하고 quota/cooldown 충돌은 defer/escalation으로 처리한다. hard trigger를 비용 때문에 skip하지 않는다. |
| [755](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:755) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [756](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:756) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [757](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:757) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [758](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:758) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A13 — Deterministic-First Principle

원문 759–811행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a13)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [759](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:759) | # 13. Deterministic-First Principle | 제목 | AST/type/schema/unit/integration/dependency/policy/constraint를 먼저 검사하고 남은 불확실성만 LLM에 보낸다. |
| [760](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:760) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [761](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:761) | LLM은 항상 첫 번째 계산 계층이어서는 안 된다. | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [762](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:762) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [763](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:763) | 가능하면 정적/결정론적 검사부터 사용한다. | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [764](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:764) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [765](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:765) | 예: | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [766](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:766) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [767](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:767) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [768](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:768) | AST | 예시·흐름 | 변경 source의 구문·symbol/export view를 분석하고 결과/도구 version을 evidence로 저장한다. |
| [769](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:769) | Type checker | 예시·흐름 | required type/interface 제약을 실제 검사하고 실패 시 hard 의무를 만든다. |
| [770](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:770) | Schema validator | 예시·흐름 | 입력·role output·plan patch·contract schema를 모델 호출 전/채택 전에 검증한다. |
| [771](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:771) | Unit test | 예시·흐름 | 영향 slice의 단위 시나리오를 실제 실행하고 exact input/version receipt를 남긴다. |
| [772](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:772) | Integration test | 예시·흐름 | 관련 output tuple의 조합 시나리오를 실제 실행하고 캐시 가능 범위를 pin한다. |
| [773](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:773) | Dependency graph | 예시·흐름 | 참조 무결성·DAG·실제 소비 관계·누락/충돌을 결정론적으로 검사한다. |
| [774](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:774) | Policy engine | 예시·흐름 | hard/soft trigger·권한·quota·critical 제약을 불변 정책으로 평가한다. |
| [775](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:775) | Constraint solver | 예시·흐름 | 선언된 유한 제약의 충족/반례를 계산한다. 일반 프로그램 동등성 solver로 과장하지 않는다. |
| [776](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:776) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [777](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:777) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [778](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:778) | 흐름: | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [779](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:779) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [780](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:780) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [781](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:781) | Change | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [782](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:782) |   ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [783](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:783) | AST validation | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [784](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:784) |   ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [785](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:785) | Type validation | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [786](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:786) |   ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [787](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:787) | Tests | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [788](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:788) |   ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [789](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:789) | Static constraints | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [790](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:790) |   ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [791](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:791) | Remaining uncertainty? | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [792](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:792) |        │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [793](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:793) |       YES | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [794](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:794) |        ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [795](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:795) |       LLM | 예시·흐름 | 검증 fixture: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. 구현: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [796](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:796) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [797](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:797) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [798](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:798) | 따라서 | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [799](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:799) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [800](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:800) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [801](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:801) | C_{\text{total}} | 수식 본문 | 식 전체의 구현 계약: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. 검증: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. |
| [802](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:802) | = | 수식 본문 | 식 전체의 구현 계약: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. 검증: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. |
| [803](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:803) | C_{\text{deterministic}} | 수식 본문 | 식 전체의 구현 계약: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. 검증: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. |
| [804](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:804) | + | 수식 본문 | 식 전체의 구현 계약: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. 검증: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. |
| [805](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:805) | C_{\text{reasoning only when needed}} | 수식 본문 | 식 전체의 구현 계약: validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. 검증: T03: 모든 필수 검사 통과·잔여 질문 없음이면 모델 0회, 실패 receipt는 해당 역할만 깨운다. |
| [806](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:806) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [807](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:807) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [808](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:808) | 가 된다. | 설명·요구 | validator registry와 versioned receipt를 구현하고 증거가 해결한 질문을 activation 후보에서 제거한다. |
| [809](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:809) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [810](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:810) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [811](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:811) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A14 — Adaptive Reasoning Precision

원문 812–862행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a14)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [812](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:812) | # 14. Adaptive Reasoning Precision | 제목 | L0–L5와 R/U/I/change magnitude 기반 수준 선택을 구현한다. 0.2/0.4/0.65/0.85는 학습할 예시 threshold다. |
| [813](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:813) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [814](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:814) | 각 문제의 reasoning level을 정의한다. | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [815](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:815) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [816](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:816) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [817](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:817) | L0 = no reasoning | 예시·흐름 | 유효 cache나 계산 불필요 근거에서 모델 호출 0으로 채택/보존한다. |
| [818](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:818) | L1 = deterministic | 예시·흐름 | 등록된 결정론적 validator만 실행하고 잔여 질문이 없으면 종료한다. |
| [819](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:819) | L2 = cheap inference | 예시·흐름 | 저비용 profile의 실제 모델/입출력/시간/tool 상한을 grant에 고정한다. |
| [820](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:820) | L3 = normal reasoning | 예시·흐름 | 일반 도메인 profile로 충분한 context를 예산 내 제공한다. |
| [821](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:821) | L4 = deep reasoning | 예시·흐름 | 위험·불확실성 근거가 정당화한 심층 profile을 capability 검증 후 실행한다. |
| [822](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:822) | L5 = multi-agent adversarial review | 예시·흐름 | 독립 역할별 grant·구조화 결과·counterexample·충돌 검증을 요구한다. |
| [823](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:823) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [824](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:824) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [825](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:825) | 필요한 level은 | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [826](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:826) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [827](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:827) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [828](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:828) | L=f(R,U,I,C) | 수식 본문 | 식 전체의 구현 계약: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. 검증: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. |
| [829](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:829) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [830](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:830) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [831](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:831) | 로 결정한다. | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [832](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:832) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [833](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:833) | 여기서 | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [834](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:834) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [835](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:835) | - \(R\): risk | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [836](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:836) | - \(U\): uncertainty | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [837](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:837) | - \(I\): integration complexity | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [838](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:838) | - \(C\): change magnitude | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [839](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:839) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [840](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:840) | 예: | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [841](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:841) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [842](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:842) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [843](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:843) | risk &lt; 0.2 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [844](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:844) | → L1 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [845](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:845) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [846](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:846) | risk &lt; 0.4 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [847](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:847) | → L2 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [848](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:848) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [849](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:849) | risk &lt; 0.65 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [850](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:850) | → L3 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [851](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:851) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [852](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:852) | risk &lt; 0.85 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [853](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:853) | → L4 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [854](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:854) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [855](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:855) | risk &gt;= 0.85 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [856](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:856) | → L5 | 예시·흐름 | 검증 fixture: T03,T14: 실제 실행 profile을 확인하고 지원하지 않는 수준을 구현됐다고 표시하지 않는다. 구현: ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [857](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:857) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [858](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:858) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [859](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:859) | 단, threshold는 경험적으로 학습된다. | 설명·요구 | ReasoningProfile/capability/실측 budget을 연결하고 L5는 독립 다중 adversarial review로 정의한다. 임계값은 정책 버전으로 calibration한다. |
| [860](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:860) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [861](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:861) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [862](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:862) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A15 — Local Context System

원문 863–895행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a15)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [863](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:863) | # 15. Local Context System | 제목 | context는 target/relevant dependency/knowledge/evidence의 합집합이다. |
| [864](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:864) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [865](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:865) | 가장 중요한 비용 중 하나는 context다. | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [866](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:866) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [867](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:867) | 모든 agent에게 전체 project context를 전달하면 안 된다. | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [868](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:868) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [869](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:869) | 에이전트 \(a_i\)의 context는 | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [870](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:870) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [871](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:871) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [872](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:872) | C_i | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [873](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:873) | = | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [874](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:874) | T_i | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [875](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:875) | \cup | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [876](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:876) | D_i | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [877](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:877) | \cup | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [878](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:878) | K_i | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [879](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:879) | \cup | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [880](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:880) | E_i | 수식 본문 | 식 전체의 구현 계약: role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. 검증: T04: 입력마다 T/D/K/E 분류와 관계 근거가 있고 비관련 subtree는 제외된다. |
| [881](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:881) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [882](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:882) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [883](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:883) | 이다. | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [884](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:884) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [885](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:885) | 각각 | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [886](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:886) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [887](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:887) | - \(T_i\): target task | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [888](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:888) | - \(D_i\): relevant dependencies | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [889](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:889) | - \(K_i\): relevant knowledge | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [890](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:890) | - \(E_i\): evidence | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [891](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:891) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [892](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:892) | 이다. | 설명·요구 | role scope에 필요한 포트·지식·증거를 선택하고 provenance와 제외 이유를 manifest에 남긴다. |
| [893](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:893) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [894](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:894) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [895](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:895) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A16 — Context Retrieval Algorithm

원문 896–912행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a16)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [896](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:896) | # 16. Context Retrieval Algorithm | 제목 | target 시작→필수 dependency→참조 decision→충돌 assumption→검증 evidence→budget 중단의 순서를 구현한다. |
| [897](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:897) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [898](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:898) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [899](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:899) | 1. Start at target task | 예시·흐름 | taskSpecVersion과 role.requiredContext를 pin하여 selector traversal의 시작점을 고정한다. |
| [900](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:900) | 2. Traverse required dependency edges | 예시·흐름 | role이 소비해야 할 typed relation/port만 깊이 예산 내 따라간다. |
| [901](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:901) | 3. Retrieve referenced decisions | 예시·흐름 | 참조된 DecisionVersion과 해당 evidence/assumption vector를 가져온다. |
| [902](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:902) | 4. Retrieve conflicting assumptions | 예시·흐름 | 현재 goal/contract/관찰과 충돌하는 가정의 근거를 우선 포함한다. |
| [903](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:903) | 5. Retrieve related validation evidence | 예시·흐름 | 관련 validator receipt·실패·boundary proof의 유효 버전만 조회한다. |
| [904](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:904) | 6. Stop when context budget reached | 예시·흐름 | 네 예산을 측정하고 optional retrieval을 중단한다. 필수 근거 부족이면 summary/증액 판단으로 대기한다. |
| [905](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:905) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [906](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:906) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [907](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:907) | 중요한 것은 context window를 단순 크기로 제한하지 않는다는 것이다. | 설명·요구 | selector 순서·relevance ranking·필수 item 우선 규칙을 명시하고 budget 부족 시 검증 요약 또는 대기한다. |
| [908](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:908) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [909](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:909) | 정보의 관계 기반 relevance를 사용한다. | 설명·요구 | selector 순서·relevance ranking·필수 item 우선 규칙을 명시하고 budget 부족 시 검증 요약 또는 대기한다. |
| [910](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:910) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [911](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:911) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [912](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:912) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A17 — Context Budget

원문 913–944행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a17)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [913](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:913) | # 17. Context Budget | 제목 | maxTokens/maxDependencyDepth/maxEvidenceItems/maxHistoricalDecisions 네 예산과 summary hierarchy가 모두 필요하다. |
| [914](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:914) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [915](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:915) | 각 agent에게 budget을 준다. | 설명·요구 | 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [916](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:916) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [917](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:917) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [918](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:918) | interface ContextBudget { | 타입 선언 | ContextBudget의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [919](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:919) |   maxTokens: number | 데이터 필드 | 실제 serialized system/role/tool/schema/context와 출력 예약을 포함하는 상한이다. |
| [920](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:920) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [921](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:921) |   maxDependencyDepth: number | 데이터 필드 | selector traversal의 최대 깊이다. 필수 dependency 누락이 발생하면 요약/예산 판단으로 처리한다. |
| [922](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:922) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [923](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:923) |   maxEvidenceItems: number | 데이터 필드 | 전달 evidence item 수 상한이다. 필수 invariant 근거를 임의로 버릴 수 없다. |
| [924](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:924) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [925](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:925) |   maxHistoricalDecisions: number | 데이터 필드 | 과거 결정 전달 수 상한이다. immutable 현재 결정과 역사 참고자료를 구분한다. |
| [926](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:926) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [927](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:927) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [928](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:928) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [929](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:929) | 초과하면 요약 hierarchy를 사용한다. | 설명·요구 | 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [930](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:930) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [931](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:931) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [932](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:932) | Raw artifact | 예시·흐름 | 검증 fixture: T04: 네 cap 각각 초과 시 동작과 필수 정보 초과시 grant 보류를 검증한다. 구현: 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [933](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:933) |    ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [934](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:934) | Local summary | 예시·흐름 | 검증 fixture: T04: 네 cap 각각 초과 시 동작과 필수 정보 초과시 grant 보류를 검증한다. 구현: 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [935](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:935) |    ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [936](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:936) | Task summary | 예시·흐름 | 검증 fixture: T04: 네 cap 각각 초과 시 동작과 필수 정보 초과시 grant 보류를 검증한다. 구현: 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [937](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:937) |    ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [938](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:938) | Subtree summary | 예시·흐름 | 검증 fixture: T04: 네 cap 각각 초과 시 동작과 필수 정보 초과시 grant 보류를 검증한다. 구현: 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [939](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:939) |    ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [940](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:940) | Project summary | 예시·흐름 | 검증 fixture: T04: 네 cap 각각 초과 시 동작과 필수 정보 초과시 grant 보류를 검증한다. 구현: 직렬화 전체 비용을 예약하고 각 cap을 별도 강제한다. raw→local→task→subtree→project 요약을 검증된 lineage로 제공한다. |
| [941](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:941) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [942](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:942) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [943](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:943) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [944](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:944) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A18 — Hierarchical Memory

원문 945–973행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a18)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [945](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:945) | # 18. Hierarchical Memory | 제목 | Raw/Artifact/Task/Subtree/Project 다섯 해상도와 필요시 하위 원본 확장을 지원한다. |
| [946](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:946) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [947](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:947) | 정보를 여러 해상도로 저장한다. | 설명·요구 | memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [948](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:948) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [949](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:949) | 예: | 설명·요구 | memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [950](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:950) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [951](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:951) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [952](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:952) | Level 0 | 예시·흐름 | 검증 fixture: T04: 상위 요약에서 원본으로 확장해도 추적성과 예산이 유지된다. 구현: memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [953](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:953) | Raw source | 예시·흐름 | level 0 원문/코드 bytes와 content hash를 저장한다. |
| [954](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:954) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [955](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:955) | Level 1 | 예시·흐름 | 검증 fixture: T04: 상위 요약에서 원본으로 확장해도 추적성과 예산이 유지된다. 구현: memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [956](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:956) | Artifact summary | 예시·흐름 | level 1 artifact별 요약에 원본 vector·보존 facts·생략 범위를 저장한다. |
| [957](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:957) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [958](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:958) | Level 2 | 예시·흐름 | 검증 fixture: T04: 상위 요약에서 원본으로 확장해도 추적성과 예산이 유지된다. 구현: memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [959](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:959) | Task summary | 예시·흐름 | level 2 task expectation/result/evidence의 요약을 저장한다. |
| [960](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:960) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [961](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:961) | Level 3 | 예시·흐름 | 검증 fixture: T04: 상위 요약에서 원본으로 확장해도 추적성과 예산이 유지된다. 구현: memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [962](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:962) | Subtree summary | 예시·흐름 | level 3 하위 목표 전체의 boundary·검증·미해결 의무 요약을 저장한다. |
| [963](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:963) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [964](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:964) | Level 4 | 예시·흐름 | 검증 fixture: T04: 상위 요약에서 원본으로 확장해도 추적성과 예산이 유지된다. 구현: memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [965](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:965) | Project knowledge | 예시·흐름 | level 4 전역 지식은 compact summary로 제공하고 필요한 하위 원본만 펼친다. |
| [966](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:966) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [967](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:967) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [968](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:968) | 필요한 경우에만 아래 레벨을 펼친다. | 설명·요구 | memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [969](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:969) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [970](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:970) | 이는 coarse-to-fine reasoning이다. | 설명·요구 | memory level별 dependency vector와 생략 범위를 저장하고 expandContext도 동일 허가·budget 검사를 거친다. |
| [971](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:971) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [972](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:972) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [973](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:973) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A19 — Integration Problem

원문 974–1008행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a19)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [974](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:974) | # 19. Integration Problem | 제목 | 개별 Correct(A1),Correct(A2)는 합성 Correct를 보장하지 않는다. |
| [975](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:975) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [976](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:976) | 하위 태스크 각각이 독립적으로 성공한다고 상위 태스크가 성공하는 것은 아니다. | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [977](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:977) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [978](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:978) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [979](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:979) | Correct(A_1)\land Correct(A_2) | 수식 본문 | 식 전체의 구현 계약: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. 검증: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. |
| [980](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:980) | \not\Rightarrow | 수식 본문 | 식 전체의 구현 계약: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. 검증: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. |
| [981](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:981) | Correct(A_1\oplus A_2) | 수식 본문 | 식 전체의 구현 계약: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. 검증: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. |
| [982](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:982) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [983](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:983) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [984](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:984) | 예를 들어: | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [985](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:985) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [986](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:986) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [987](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:987) | Task A | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [988](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:988) | → changes interface X | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [989](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:989) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [990](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:990) | Task B | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [991](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:991) | → changes implementation Y | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [992](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:992) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [993](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:993) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [994](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:994) | 각각 테스트는 통과한다. | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [995](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:995) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [996](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:996) | 하지만 함께 합치면 | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [997](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:997) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [998](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:998) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [999](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:999) | A + B | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [1000](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1000) | → contract mismatch | 예시·흐름 | 검증 fixture: T10: local tests 모두 pass지만 contract mismatch로 부모 완료가 차단된다. 구현: 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [1001](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1001) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1002](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1002) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1003](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1003) | 가 발생할 수 있다. | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [1004](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1004) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1005](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1005) | 따라서 integration은 별도의 계산 단위다. | 설명·요구 | 독립 local pass와 joint integration pass를 별도 obligation으로 만들고 부모 완료에서 둘을 구분한다. |
| [1006](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1006) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1007](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1007) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1008](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1008) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A20 — Integration Graph

원문 1009–1032행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a20)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1009](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1009) | # 20. Integration Graph | 제목 | Task Graph 외 artifact/output 간 Integration Graph를 유지하고 관련 edge만 활성화한다. |
| [1010](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1010) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1011](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1011) | Task Graph 외에 Integration Graph를 유지한다. | 설명·요구 | versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1012](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1012) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1013](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1013) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1014](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1014) | G_I=(V_I,E_I) | 수식 본문 | 식 전체의 구현 계약: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. 검증: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. |
| [1015](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1015) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1016](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1016) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1017](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1017) | node는 artifact 또는 task output이고 edge는 통합 관계다. | 설명·요구 | versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1018](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1018) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1019](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1019) | 예: | 설명·요구 | versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1020](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1020) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1021](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1021) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1022](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1022) | Auth API | 예시·흐름 | 검증 fixture: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. 구현: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1023](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1023) |  ├── Frontend | 예시·흐름 | 검증 fixture: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. 구현: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1024](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1024) |  ├── Mobile | 예시·흐름 | 검증 fixture: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. 구현: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1025](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1025) |  ├── Gateway | 예시·흐름 | 검증 fixture: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. 구현: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1026](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1026) |  └── Audit Service | 예시·흐름 | 검증 fixture: T10: 변경 포트를 소비하지 않는 integration edge는 깨우지 않는다. 구현: versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1027](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1027) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1028](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1028) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1029](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1029) | Auth API 변경 시 관련 integration edge를 활성화한다. | 설명·요구 | versioned output node·contract 소비 edge·scenario binding을 인덱싱하여 Auth API 변경의 Frontend/Mobile/Gateway/Audit 소비 조합을 선택한다. |
| [1030](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1030) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1031](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1031) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1032](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1032) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A21 — Multi-Task Integration Detection

원문 1033–1062행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a21)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1033](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1033) | # 21. Multi-Task Integration Detection | 제목 | 같은 boundary에 둘 이상 task output이 영향을 주면 IntegrationRequired를 만든다. |
| [1034](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1034) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1035](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1035) | 여러 하위 태스크의 결과가 같은 경계에 영향을 주는 경우 integration event를 발생시킨다. | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1036](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1036) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1037](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1037) | 조건: | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1038](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1038) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1039](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1039) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1040](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1040) | &#124;\{T_i : T_i\rightarrow B\}&#124; &gt; 1 | 수식 본문 | 식 전체의 구현 계약: boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. 검증: T09,T10: 2개·3개 변경의 중복 event는 같은 tuple에 의무 1개만 만든다. |
| [1041](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1041) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1042](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1042) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1043](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1043) | 여기서 \(B\)는 공유 boundary다. | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1044](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1044) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1045](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1045) | 예: | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1046](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1046) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1047](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1047) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1048](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1048) | A1 ──┐ | 예시·흐름 | 검증 fixture: T09,T10: 2개·3개 변경의 중복 event는 같은 tuple에 의무 1개만 만든다. 구현: boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1049](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1049) | A2 ──┼── shared interface | 예시·흐름 | 검증 fixture: T09,T10: 2개·3개 변경의 중복 event는 같은 tuple에 의무 1개만 만든다. 구현: boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1050](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1050) | A3 ──┘ | 예시·흐름 | 검증 fixture: T09,T10: 2개·3개 변경의 중복 event는 같은 tuple에 의무 1개만 만든다. 구현: boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1051](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1051) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1052](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1052) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1053](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1053) | 이 경우: | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1054](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1054) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1055](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1055) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1056](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1056) | IntegrationRequired | 예시·흐름 | 검증 fixture: T09,T10: 2개·3개 변경의 중복 event는 같은 tuple에 의무 1개만 만든다. 구현: boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1057](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1057) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1058](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1058) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1059](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1059) | 이벤트를 생성한다. | 설명·요구 | boundary별 변경 task 집합을 episode 내 집계하고 exact output tuple을 키로 의무를 멱등 생성한다. |
| [1060](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1060) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1061](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1061) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1062](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1062) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A22 — Integration Agent

원문 1063–1094행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a22)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1063](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1063) | # 22. Integration Agent | 제목 | 통합 역할은 merge 외 행동/인터페이스/데이터/시간/오류/자원/의미 7종 호환성을 판단하고 conflict/risk/rework를 낸다. |
| [1064](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1064) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1065](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1065) | Integration Agent의 역할은 단순 merge가 아니다. | 설명·요구 | 각 dimension을 validator/role obligation으로 표현하고 compatible/conflicts/emergentRisks/requiredRework를 schema화한다. |
| [1066](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1066) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1067](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1067) | 검사 대상: | 설명·요구 | 각 dimension을 validator/role obligation으로 표현하고 compatible/conflicts/emergentRisks/requiredRework를 schema화한다. |
| [1068](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1068) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1069](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1069) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1070](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1070) | behavioral compatibility | 예시·흐름 | 공동 output의 관찰 행동 제약을 시나리오/증거로 검증한다. |
| [1071](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1071) | interface compatibility | 예시·흐름 | required/provided port와 protocol/schema tuple을 비교한다. |
| [1072](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1072) | data compatibility | 예시·흐름 | 직렬화·field 의미·단위·저장 형식의 조합 제약을 검사한다. |
| [1073](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1073) | temporal assumptions | 예시·흐름 | 순서·timeout·동시성·유효기간 가정을 실제 시나리오로 검증한다. |
| [1074](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1074) | error propagation | 예시·흐름 | 한 output의 실패/오류가 consumer에서 어떻게 전파·처리되는지 검사한다. |
| [1075](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1075) | resource contention | 예시·흐름 | 공유 자원·잠금·capacity 경합을 integration graph의 resource 관계로 검증한다. |
| [1076](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1076) | semantic consistency | 예시·흐름 | 개별 output의 의미가 상위 목표/공통 가정/결정과 모순되지 않는지 검증한다. |
| [1077](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1077) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1078](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1078) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1079](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1079) | 결과: | 설명·요구 | 각 dimension을 validator/role obligation으로 표현하고 compatible/conflicts/emergentRisks/requiredRework를 schema화한다. |
| [1080](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1080) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1081](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1081) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1082](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1082) | interface IntegrationResult { | 타입 선언 | IntegrationResult의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1083](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1083) |   compatible: boolean | 데이터 필드 | 검증 범위 내 호환성 결과이다. 일반 행동 동등성 또는 BoundaryProof.preserved와 동일시하지 않는다. |
| [1084](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1084) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1085](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1085) |   conflicts: Conflict[] | 데이터 필드 | 서로 충돌하는 exact output/contract refs와 근거를 저장한다. |
| [1086](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1086) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1087](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1087) |   emergentRisks: Risk[] | 데이터 필드 | 개별 실행에 없던 조합 위험을 evidence·dimension과 함께 기록한다. |
| [1088](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1088) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1089](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1089) |   requiredRework: TaskProposal[] | 데이터 필드 | 원인 lineage와 scope가 있는 TaskProposal로 변환한다. 즉시 임의 task를 만들지 않는다. |
| [1090](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1090) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1091](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1091) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1092](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1092) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1093](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1093) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1094](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1094) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A23 — Evidence Model

원문 1095–1137행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a23)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1095](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1095) | # 23. Evidence Model | 제목 | Evidence 7종과 source/confidence/timestamp/contentHash, Decision conclusion/evidence/confidence/assumptions 전부를 저장한다. |
| [1096](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1096) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1097](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1097) | 에이전트의 판단은 가능한 한 evidence에 연결해야 한다. | 설명·요구 | EvidenceVersion·DecisionVersion·AssumptionVersion을 만들고 실제 input/producer/validator provenance와 만료를 연결한다. |
| [1098](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1098) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1099](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1099) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1100](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1100) | interface Evidence { | 타입 선언 | Evidence의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1101](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1101) |   id: string | 데이터 필드 | 서버 evidence identity이다. content/producer/version을 별도로 고정한다. |
| [1102](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1102) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1103](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1103) |   type: | 데이터 필드 | test/code/document/runtime/research/user/agent의 provenance 종류이다. 종류별 검증 신뢰 수준을 적용한다. |
| [1104](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1104) |     &#124; "test" | 열거값 | 실제 validator 실행 receipt·입력·결과·범위와 연결한다. |
| [1105](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1105) |     &#124; "code" | 열거값 | 실제 content/tree hash와 artifact version을 확인한다. |
| [1106](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1106) |     &#124; "document" | 열거값 | 문서 내용 hash·출처·version·적용 범위를 고정한다. |
| [1107](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1107) |     &#124; "runtime" | 열거값 | 실행 observation·시각·환경·producer attempt를 연결한다. |
| [1108](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1108) |     &#124; "research" | 열거값 | 외부 출처·관찰시각·만료/재검증 조건을 저장한다. |
| [1109](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1109) |     &#124; "user" | 열거값 | 명시 목표·요구·권한의 원문과 시점을 보존한다. |
| [1110](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1110) |     &#124; "agent" | 열거값 | 모델 판단 evidence이며 실제 실행/동등성 증명의 대체물이 아니다. |
| [1111](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1111) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1112](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1112) |   source: string | 데이터 필드 | 실제 도구 receipt/파일/version/외부 출처를 가리킨다. 사람이 읽는 요약만으로 대체하지 않는다. |
| [1113](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1113) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1114](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1114) |   confidence: number | 데이터 필드 | 근거와 calibration을 가진 [0,1] 값이다. agent claim을 실제 test pass로 승격하지 않는다. |
| [1115](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1115) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1116](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1116) |   timestamp: Date | 데이터 필드 | 관찰시각과 저장시각을 구분하고 external evidence expiry 판정에 사용한다. |
| [1117](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1117) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1118](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1118) |   contentHash: string | 데이터 필드 | canonical content 또는 실제 blob 해시이며 읽을 때 무결성을 확인한다. |
| [1119](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1119) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1120](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1120) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1121](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1121) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1122](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1122) | 판단: | 설명·요구 | EvidenceVersion·DecisionVersion·AssumptionVersion을 만들고 실제 input/producer/validator provenance와 만료를 연결한다. |
| [1123](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1123) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1124](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1124) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1125](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1125) | interface Decision { | 타입 선언 | Decision의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1126](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1126) |   conclusion: string | 데이터 필드 | 판단 명제이며 supporting evidence와 적용 범위를 함께 저장한다. |
| [1127](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1127) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1128](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1128) |   evidence: EvidenceRef[] | 데이터 필드 | 불변 EvidenceVersion refs를 사용한다. 해당 증거 무효화는 소비 결정에 전파한다. |
| [1129](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1129) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1130](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1130) |   confidence: number | 데이터 필드 | 근거 강도와 불확실성을 기록하며 높은 확신·약한 근거는 Critic signal이다. |
| [1131](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1131) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1132](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1132) |   assumptions: AssumptionRef[] | 데이터 필드 | 판단이 의존한 AssumptionVersion refs이며 깨지면 해당 conclusion만 무효화한다. |
| [1133](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1133) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1134](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1134) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1135](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1135) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1136](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1136) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1137](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1137) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A24 — Confidence Propagation

원문 1138–1162행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a24)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1138](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1138) | # 24. Confidence Propagation | 제목 | 중요 의존성의 낮은 confidence를 평균으로 숨기지 않는다. min 또는 weighted product를 명시적으로 선택한다. |
| [1139](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1139) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1140](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1140) | 상위 task confidence를 단순 평균으로 계산하면 안 된다. | 설명·요구 | min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. |
| [1141](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1141) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1142](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1142) | 의존 태스크 중 가장 낮은 confidence가 중요할 수 있다. | 설명·요구 | min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. |
| [1143](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1143) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1144](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1144) | 예: | 설명·요구 | min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. |
| [1145](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1145) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1146](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1146) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1147](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1147) | C_{parent} | 수식 본문 | 식 전체의 구현 계약: min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. 검증: T10: 자식 하나의 낮은 confidence가 다수 높은 값으로 소거되지 않는다. |
| [1148](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1148) | = | 수식 본문 | 식 전체의 구현 계약: min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. 검증: T10: 자식 하나의 낮은 confidence가 다수 높은 값으로 소거되지 않는다. |
| [1149](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1149) | \min(C_1,C_2,\dots,C_n) | 수식 본문 | 식 전체의 구현 계약: min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. 검증: T10: 자식 하나의 낮은 confidence가 다수 높은 값으로 소거되지 않는다. |
| [1150](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1150) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1151](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1151) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1152](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1152) | 또는 weighted form: | 설명·요구 | min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. |
| [1153](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1153) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1154](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1154) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1155](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1155) | C= | 수식 본문 | 식 전체의 구현 계약: min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. 검증: T10: 자식 하나의 낮은 confidence가 다수 높은 값으로 소거되지 않는다. |
| [1156](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1156) | \prod_iC_i^{w_i} | 수식 본문 | 식 전체의 구현 계약: min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. 검증: T10: 자식 하나의 낮은 confidence가 다수 높은 값으로 소거되지 않는다. |
| [1157](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1157) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1158](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1158) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1159](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1159) | 이 방식은 하나의 중요한 의존성이 낮은 confidence를 가질 경우 전체 confidence를 낮춘다. | 설명·요구 | min을 기본으로 두고 product는 weight·상관 가정·calibration을 기록한 별도 score로 사용한다. |
| [1160](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1160) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1161](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1161) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1162](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1162) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A25 — Risk Propagation

원문 1163–1176행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a25)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1163](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1163) | # 25. Risk Propagation | 제목 | 독립 위험에서 누적 risk는 1-product(1-Ri)이다. |
| [1164](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1164) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1165](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1165) | 반대로 risk는 최대값이 중요하다. | 설명·요구 | 독립성 근거를 가진 경우만 확률식을 쓰고 미확인 상관은 보수 신호와 joint validation으로 다룬다. |
| [1166](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1166) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1167](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1167) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1168](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1168) | R_{parent} | 수식 본문 | 식 전체의 구현 계약: 독립성 근거를 가진 경우만 확률식을 쓰고 미확인 상관은 보수 신호와 joint validation으로 다룬다. 검증: T10: 독립/동일 원인 중복 위험 fixture에서 확률 오표현·중복 누적을 막는다. |
| [1169](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1169) | = | 수식 본문 | 식 전체의 구현 계약: 독립성 근거를 가진 경우만 확률식을 쓰고 미확인 상관은 보수 신호와 joint validation으로 다룬다. 검증: T10: 독립/동일 원인 중복 위험 fixture에서 확률 오표현·중복 누적을 막는다. |
| [1170](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1170) | 1-\prod_i(1-R_i) | 수식 본문 | 식 전체의 구현 계약: 독립성 근거를 가진 경우만 확률식을 쓰고 미확인 상관은 보수 신호와 joint validation으로 다룬다. 검증: T10: 독립/동일 원인 중복 위험 fixture에서 확률 오표현·중복 누적을 막는다. |
| [1171](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1171) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1172](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1172) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1173](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1173) | 독립적인 위험을 가정하면 여러 위험이 쌓일수록 상위 위험도가 증가한다. | 설명·요구 | 독립성 근거를 가진 경우만 확률식을 쓰고 미확인 상관은 보수 신호와 joint validation으로 다룬다. |
| [1174](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1174) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1175](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1175) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1176](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1176) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A26 — Critic Agent

원문 1177–1204행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a26)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1177](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1177) | # 26. Critic Agent | 제목 | Critic은 약한 증거의 높은 확신·높은 위험·구조 변경·비가역 결정·반복 실패에서 숨은 가정/반례 등을 찾는다. |
| [1178](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1178) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1179](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1179) | Critic은 항상 실행되지 않는다. | 설명·요구 | 다섯 trigger와 hidden assumption/missing evidence/counterexample/integration failure/false certainty finding 분류를 등록한다. |
| [1180](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1180) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1181](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1181) | 다음 경우에만 활성화한다. | 설명·요구 | 다섯 trigger와 hidden assumption/missing evidence/counterexample/integration failure/false certainty finding 분류를 등록한다. |
| [1182](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1182) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1183](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1183) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1184](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1184) | High confidence but weak evidence | 예시·흐름 | confidence와 supporting evidence 강도의 불일치를 signal로 계산하고 Critic 후보를 만든다. |
| [1185](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1185) | High risk | 예시·흐름 | criticality/expected failure evidence가 role threshold를 넘으면 Critic을 평가한다. |
| [1186](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1186) | Architectural change | 예시·흐름 | boundary/dependency 방향/infrastructure invariant 변화의 Critic 필요성을 평가한다. |
| [1187](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1187) | Irreversible decision | 예시·흐름 | 되돌리기 비용/제약의 evidence를 가진 결정에 추가 반례 검토를 요구한다. |
| [1188](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1188) | Repeated failure pattern | 예시·흐름 | 검증된 반복 구조 실패가 있는 episode에서 Critic과 meta 필요성을 따로 평가한다. |
| [1189](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1189) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1190](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1190) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1191](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1191) | Critic의 목표는 답을 만드는 것이 아니다. | 설명·요구 | 다섯 trigger와 hidden assumption/missing evidence/counterexample/integration failure/false certainty finding 분류를 등록한다. |
| [1192](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1192) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1193](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1193) | 다음을 찾는다. | 설명·요구 | 다섯 trigger와 hidden assumption/missing evidence/counterexample/integration failure/false certainty finding 분류를 등록한다. |
| [1194](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1194) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1195](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1195) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1196](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1196) | hidden assumption | 예시·흐름 | 누락된 AssumptionVersion 후보와 영향 consumer를 evidence와 함께 출력한다. |
| [1197](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1197) | missing evidence | 예시·흐름 | 필요 판단을 뒷받침하지 못한 evidence gap을 obligation으로 만든다. |
| [1198](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1198) | counterexample | 예시·흐름 | 주장/계약을 깨는 구체 입력·결과·근거를 구조화한다. |
| [1199](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1199) | integration failure | 예시·흐름 | 조합 tuple과 깨진 invariant를 feedback lineage로 연결한다. |
| [1200](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1200) | false certainty | 예시·흐름 | 자기평가 confidence가 근거 범위를 초과했음을 finding으로 기록한다. |
| [1201](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1201) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1202](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1202) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1203](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1203) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1204](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1204) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A27 — QA Agent

원문 1205–1221행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a27)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1205](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1205) | # 27. QA Agent | 제목 | QA는 실패 가능성·미검증 영역·의미 변화·미검증 조합을 찾는 판단 역할이다. |
| [1206](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1206) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1207](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1207) | QA는 단순 테스트 실행기가 아니다. | 설명·요구 | deterministic test runner와 QA RoleVersion을 분리하고 coverage gap/semantic delta/combination 질문을 출력 schema에 연결한다. |
| [1208](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1208) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1209](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1209) | QA는 다음 질문을 담당한다. | 설명·요구 | deterministic test runner와 QA RoleVersion을 분리하고 coverage gap/semantic delta/combination 질문을 출력 schema에 연결한다. |
| [1210](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1210) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1211](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1211) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1212](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1212) | What can fail? | 예시·흐름 | 요구·가정·위험에서 실패 시나리오 후보를 만들고 실제 검증 의무로 연결한다. |
| [1213](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1213) | What was not tested? | 예시·흐름 | validator coverage와 필수 제약 차이를 계산해 미검증 영역을 명시한다. |
| [1214](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1214) | What changed semantically? | 예시·흐름 | ChangeSignature와 기대/실제 차이를 검토하고 누락된 의미 영향을 제안한다. |
| [1215](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1215) | What combinations have not been validated? | 예시·흐름 | Integration Graph의 required output tuple 중 유효 pass가 없는 조합을 찾는다. |
| [1216](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1216) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1217](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1217) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1218](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1218) | 특히 하위 태스크의 조합을 검증한다. | 설명·요구 | deterministic test runner와 QA RoleVersion을 분리하고 coverage gap/semantic delta/combination 질문을 출력 schema에 연결한다. |
| [1219](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1219) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1220](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1220) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1221](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1221) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A28 — Self-Improvement Loop

원문 1222–1267행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a28)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1222](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1222) | # 28. Self-Improvement Loop | 제목 | 28.1의 무가치 활성화와 28.2의 나중에 드러난 missed activation 양쪽에서 배운다. |
| [1223](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1223) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1224](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1224) | 이 시스템의 핵심은 단순 작업 실행이 아니라 실행 정책 자체를 개선하는 것이다. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1225](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1225) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1226](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1226) | 다음 두 가지 failure가 중요하다. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1227](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1227) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1228](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1228) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1229](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1229) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1230](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1230) | ## 28.1 False Positive Activation | 제목 | 28.1의 무가치 활성화와 28.2의 나중에 드러난 missed activation 양쪽에서 배운다. |
| [1231](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1231) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1232](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1232) | 에이전트를 실행했지만 가치가 없었던 경우. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1233](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1233) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1234](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1234) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1235](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1235) | Trigger | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1236](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1236) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1237](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1237) | Agent invoked | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1238](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1238) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1239](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1239) | No new evidence | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1240](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1240) | No decision change | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1241](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1241) | No issue found | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1242](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1242) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1243](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1243) | Waste detected | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1244](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1244) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1245](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1245) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1246](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1246) | activation policy를 약화시킨다. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1247](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1247) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1248](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1248) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1249](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1249) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1250](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1250) | ## 28.2 False Negative Activation | 제목 | 28.1의 무가치 활성화와 28.2의 나중에 드러난 missed activation 양쪽에서 배운다. |
| [1251](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1251) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1252](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1252) | 에이전트를 실행하지 않았는데 이후 문제가 발견된 경우. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1253](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1253) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1254](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1254) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1255](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1255) | No agent invoked | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1256](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1256) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1257](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1257) | Task completed | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1258](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1258) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1259](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1259) | Later integration failure | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1260](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1260) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1261](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1261) | Missed activation detected | 예시·흐름 | 검증 fixture: T11: 낭비·필수 QA 무발견·실제 skip 후 실패·관측 불충분 네 사례를 구분한다. 구현: ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1262](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1262) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1263](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1263) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1264](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1264) | 새 activation condition을 학습한다. | 설명·요구 | ActivationDecision·OutcomeLabel·실제 failure lineage를 연결한다. 무발견 필수 assurance를 FP로 단정하지 않고 미관측 FN을 꾸미지 않는다. |
| [1265](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1265) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1266](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1266) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1267](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1267) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A29 — Activation Learning

원문 1268–1325행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a29)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1268](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1268) | # 29. Activation Learning | 제목 | policy pi(s)→activate/skip의 보상은 useful value-cost-missed failure이며 기대 보상을 최적화한다. |
| [1269](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1269) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1270](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1270) | 각 activation rule을 하나의 policy로 본다. | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1271](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1271) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1272](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1272) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1273](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1273) | \pi(s)\rightarrow a | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1274](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1274) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1275](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1275) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1276](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1276) | 여기서 | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1277](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1277) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1278](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1278) | - \(s\): signal state | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1279](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1279) | - \(a\): activate / skip | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1280](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1280) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1281](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1281) | 보상은 다음처럼 정의할 수 있다. | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1282](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1282) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1283](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1283) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1284](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1284) | Reward | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1285](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1285) | = | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1286](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1286) | ValueFound | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1287](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1287) | - | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1288](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1288) | ExecutionCost | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1289](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1289) | - | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1290](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1290) | MissedFailureCost | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1291](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1291) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1292](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1292) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1293](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1293) | 더 구체적으로: | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1294](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1294) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1295](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1295) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1296](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1296) | R = | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1297](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1297) | \alpha V | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1298](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1298) | -\beta C | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1299](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1299) | -\gamma M | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1300](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1300) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1301](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1301) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1302](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1302) | 여기서 | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1303](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1303) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1304](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1304) | - \(V\): useful finding | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1305](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1305) | - \(C\): reasoning cost | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1306](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1306) | - \(M\): missed error cost | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1307](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1307) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1308](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1308) | 목표는 | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1309](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1309) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1310](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1310) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1311](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1311) | \max E[R] | 수식 본문 | 식 전체의 구현 계약: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. 검증: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. |
| [1312](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1312) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1313](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1313) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1314](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1314) | 이다. | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1315](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1315) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1316](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1316) | 즉 시스템은 단순 정확도가 아니라 | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1317](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1317) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1318](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1318) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1319](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1319) | accuracy / cost | 예시·흐름 | 검증 fixture: T11,T13: 호출 최소화만으로 모든 역할을 skip하는 후보가 승격되지 않는다. 구현: V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1320](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1320) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1321](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1321) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1322](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1322) | 를 최적화한다. | 설명·요구 | V/C/M의 측정 정의와 정규화 단위를 저장하고 correctness/critical recall 조건을 만족하는 정책만 reward 비교한다. |
| [1323](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1323) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1324](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1324) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1325](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1325) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A30 — Structural Rule Learning

원문 1326–1366행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a30)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1326](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1326) | # 30. Structural Rule Learning | 제목 | 실패→원인→구조 패턴→일반 invariant→후보→검증→갱신의 abstraction 단계가 필수다. |
| [1327](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1327) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1328](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1328) | 중요한 제약: | 설명·요구 | DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1329](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1329) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1330](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1330) | Self-improvement agent는 특정 사례를 그대로 rule로 추가할 수 없다. | 설명·요구 | DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1331](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1331) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1332](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1332) | 잘못된 예: | 설명·요구 | DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1333](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1333) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1334](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1334) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1335](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1335) | when file auth.ts changes | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1336](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1336) | → invoke architect | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1337](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1337) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1338](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1338) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1339](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1339) | 좋은 예: | 설명·요구 | DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1340](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1340) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1341](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1341) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1342](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1342) | when a public authentication boundary changes | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1343](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1343) | and downstream modules &gt; threshold | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1344](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1344) | → invoke architect | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1345](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1345) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1346](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1346) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1347](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1347) | 즉 rule generation 과정에 abstraction 단계가 필요하다. | 설명·요구 | DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1348](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1348) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1349](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1349) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1350](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1350) | Failure | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1351](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1351) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1352](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1352) | Root cause | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1353](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1353) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1354](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1354) | Structural pattern | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1355](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1355) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1356](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1356) | Generalizable invariant | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1357](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1357) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1358](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1358) | Candidate rule | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1359](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1359) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1360](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1360) | Validation | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1361](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1361) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1362](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1362) | Policy update | 예시·흐름 | 검증 fixture: T11: auth.ts 규칙은 거절하고 같은 authentication boundary를 다른 이름으로 옮겨도 규칙이 작동한다. 구현: DSL에서 파일명/태스크 ID 조건을 거절하고 boundary 종류·fanout·관계·가정에 기반한 설명 가능한 규칙만 제안한다. |
| [1363](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1363) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1364](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1364) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1365](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1365) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1366](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1366) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A31 — Rule Validation

원문 1367–1386행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a31)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1367](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1367) | # 31. Rule Validation | 제목 | candidate→shadow→validated→active를 단계별로 유지한다. |
| [1368](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1368) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1369](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1369) | 새 rule은 바로 production에 적용하지 않는다. | 설명·요구 | 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1370](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1370) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1371](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1371) | 다음 상태를 거친다. | 설명·요구 | 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1372](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1372) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1373](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1373) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1374](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1374) | candidate | 예시·흐름 | 검증 fixture: T11: candidate/shadow가 production routing을 바꾸지 않고 validated도 승인 gate 전엔 active가 아니다. 구현: 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1375](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1375) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1376](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1376) | shadow | 예시·흐름 | 검증 fixture: T11: candidate/shadow가 production routing을 바꾸지 않고 validated도 승인 gate 전엔 active가 아니다. 구현: 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1377](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1377) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1378](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1378) | validated | 예시·흐름 | 검증 fixture: T11: candidate/shadow가 production routing을 바꾸지 않고 validated도 승인 gate 전엔 active가 아니다. 구현: 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1379](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1379) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1380](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1380) | active | 예시·흐름 | 검증 fixture: T11: candidate/shadow가 production routing을 바꾸지 않고 validated도 승인 gate 전엔 active가 아니다. 구현: 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1381](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1381) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1382](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1382) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1383](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1383) | Shadow 단계에서는 실제 실행 여부에 영향을 주지 않고 결과만 비교한다. | 설명·요구 | 정책 버전과 head를 분리하고 각 승격 gate에 replay·holdout·shadow evidence를 요구한다. |
| [1384](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1384) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1385](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1385) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1386](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1386) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A32 — Knowledge Reuse

원문 1387–1408행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a32)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1387](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1387) | # 32. Knowledge Reuse | 제목 | Task/Dependencies/Evidence/Policy input hash로 인지 결과를 재사용하고 영향 subset만 무효화한다. |
| [1388](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1388) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1389](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1389) | 이미 계산한 결과는 가능한 한 재사용한다. | 설명·요구 | 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. |
| [1390](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1390) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1391](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1391) | 각 reasoning output에는 input hash를 기록한다. | 설명·요구 | 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. |
| [1392](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1392) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1393](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1393) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1394](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1394) | H= | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1395](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1395) | hash( | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1396](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1396) | Task, | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1397](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1397) | Dependencies, | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1398](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1398) | Evidence, | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1399](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1399) | Policy | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1400](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1400) | ) | 수식 본문 | 식 전체의 구현 계약: 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. 검증: T04: 독립 evidence 변화는 무관한 reasoning record를 무효화하지 않는다. |
| [1401](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1401) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1402](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1402) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1403](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1403) | 동일한 hash라면 기존 결과를 사용한다. | 설명·요구 | 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. |
| [1404](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1404) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1405](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1405) | 변화가 발생했다면 affected subset만 invalidation한다. | 설명·요구 | 인지 종류별 dependency view key와 역인덱스를 만들고 사용한 정책·증거·validator version까지 고정한다. |
| [1406](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1406) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1407](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1407) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1408](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1408) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A33 — Semantic Cache

원문 1409–1434행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a33)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1409](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1409) | # 33. Semantic Cache | 제목 | syntactic/semantic/interface/behavioral/architectural 분류에 따라 cache invalidation 범위가 달라진다. |
| [1410](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1410) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1411](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1411) | 단순 text hash만으로는 부족하다. | 설명·요구 | B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1412](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1412) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1413](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1413) | 예: | 설명·요구 | B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1414](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1414) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1415](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1415) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1416](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1416) | "rename variable" | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1417](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1417) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1418](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1418) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1419](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1419) | 은 코드가 변경되었지만 architecture reasoning을 무효화할 필요가 없다. | 설명·요구 | B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1420](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1420) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1421](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1421) | 따라서 change classification을 사용한다. | 설명·요구 | B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1422](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1422) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1423](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1423) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1424](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1424) | syntactic | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1425](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1425) | semantic | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1426](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1426) | interface | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1427](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1427) | behavioral | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1428](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1428) | architectural | 예시·흐름 | 검증 fixture: T04,T06: 안전한 local rename은 architecture cache 유지, export/reflection rename은 검증 없이 유지하지 않는다. 구현: B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1429](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1429) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1430](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1430) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1431](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1431) | 캐시 invalidation도 이를 기준으로 한다. | 설명·요구 | B ChangeScope와 매핑하고 view equality 근거가 있는 인지 결과만 유지한다. text/summary hash로 행동 동등성을 단정하지 않는다. |
| [1432](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1432) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1433](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1433) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1434](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1434) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A34 — Incremental Reasoning

원문 1435–1458행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a34)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1435](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1435) | # 34. Incremental Reasoning | 제목 | ReasoningState의 assumptions/conclusions/unresolvedQuestions/evidenceIndex/dependencyVersion을 보존하고 일부만 갱신한다. |
| [1436](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1436) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1437](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1437) | 큰 태스크를 매번 처음부터 분석하지 않는다. | 설명·요구 | conclusion별 소비 vector를 만들고 변경된 assumption·evidence의 영향 slice만 재검토한다. |
| [1438](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1438) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1439](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1439) | 기존 reasoning state를 유지한다. | 설명·요구 | conclusion별 소비 vector를 만들고 변경된 assumption·evidence의 영향 slice만 재검토한다. |
| [1440](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1440) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1441](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1441) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1442](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1442) | interface ReasoningState { | 타입 선언 | ReasoningState의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1443](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1443) |   assumptions: Assumption[] | 데이터 필드 | 현재 reasoning slice의 가정과 유효성 버전을 유지한다. |
| [1444](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1444) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1445](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1445) |   conclusions: Decision[] | 데이터 필드 | 각 DecisionVersion과 소비 vector를 저장하여 부분 재계산한다. |
| [1446](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1446) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1447](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1447) |   unresolvedQuestions: Question[] | 데이터 필드 | 미해결 질문을 보존하고 유효한 확정 결론으로 cache hit하지 않는다. |
| [1448](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1448) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1449](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1449) |   evidenceIndex: EvidenceRef[] | 데이터 필드 | reasoning이 읽은 증거의 역참조와 버전이다. |
| [1450](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1450) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1451](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1451) |   dependencyVersion: VersionVector | 데이터 필드 | entity/port/semanticView/version/hash vector를 pin한다. |
| [1452](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1452) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1453](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1453) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1454](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1454) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1455](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1455) | 변경된 부분만 다시 계산한다. | 설명·요구 | conclusion별 소비 vector를 만들고 변경된 assumption·evidence의 영향 slice만 재검토한다. |
| [1456](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1456) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1457](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1457) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1458](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1458) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A35 — Version Vector

원문 1459–1475행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a35)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1459](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1459) | # 35. Version Vector | 제목 | Task/Interface/Decision/Research의 개별 version vector로 affected reasoning을 식별한다. |
| [1460](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1460) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1461](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1461) | 각 dependency의 version을 기록한다. | 설명·요구 | entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1462](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1462) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1463](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1463) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1464](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1464) | Task A: 13 | 예시·흐름 | 검증 fixture: T04: 연구 R만 갱신하면 R을 읽은 인지 결과만 stale이다. 구현: entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1465](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1465) | Interface X: 4 | 예시·흐름 | 검증 fixture: T04: 연구 R만 갱신하면 R을 읽은 인지 결과만 stale이다. 구현: entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1466](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1466) | Decision D: 7 | 예시·흐름 | 검증 fixture: T04: 연구 R만 갱신하면 R을 읽은 인지 결과만 stale이다. 구현: entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1467](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1467) | Research R: 2 | 예시·흐름 | 검증 fixture: T04: 연구 R만 갱신하면 R을 읽은 인지 결과만 stale이다. 구현: entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1468](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1468) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1469](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1469) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1470](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1470) | agent reasoning output은 해당 version vector에 묶인다. | 설명·요구 | entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1471](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1471) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1472](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1472) | 하나가 변경되면 영향을 받은 reasoning만 invalidation한다. | 설명·요구 | entity/port/view/version/hash 튜플을 표준화하고 각 consumer record에서 실제 read vector를 고정한다. |
| [1473](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1473) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1474](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1474) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1475](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1475) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A36 — Agent Communication

원문 1476–1497행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a36)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1476](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1476) | # 36. Agent Communication | 제목 | agent 간 authoritative communication은 structured output→graph/evidence→다음 agent이다. |
| [1477](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1477) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1478](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1478) | 에이전트끼리 자유 대화하도록 두지 않는다. | 설명·요구 | 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1479](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1479) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1480](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1480) | 자유로운 conversation topology는 비용과 오염을 증가시킨다. | 설명·요구 | 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1481](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1481) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1482](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1482) | 대신 graph-mediated communication을 사용한다. | 설명·요구 | 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1483](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1483) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1484](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1484) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1485](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1485) | Agent | 예시·흐름 | 검증 fixture: T02,T04: 직접 전달한 미검증 주장으로 다음 task를 완료시키지 못한다. 구현: 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1486](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1486) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1487](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1487) | Structured output | 예시·흐름 | 검증 fixture: T02,T04: 직접 전달한 미검증 주장으로 다음 task를 완료시키지 못한다. 구현: 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1488](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1488) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1489](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1489) | Task Graph / Evidence Store | 예시·흐름 | 검증 fixture: T02,T04: 직접 전달한 미검증 주장으로 다음 task를 완료시키지 못한다. 구현: 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1490](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1490) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1491](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1491) | Other Agent | 예시·흐름 | 검증 fixture: T02,T04: 직접 전달한 미검증 주장으로 다음 task를 완료시키지 못한다. 구현: 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1492](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1492) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1493](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1493) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1494](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1494) | 즉 agent-to-agent 직접 대화보다 shared state를 통한 통신을 기본값으로 한다. | 설명·요구 | 모든 역할 result를 schema·evidence 검증 후 저장하고 다른 역할은 승인 manifest를 통해 읽는다. 대화가 상태 mutation을 우회하지 못한다. |
| [1495](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1495) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1496](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1496) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1497](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1497) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A37 — Structured Agent Output

원문 1498–1525행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a37)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1498](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1498) | # 37. Structured Agent Output | 제목 | AgentOutput의 taskId/findings/decisions/risks/questions/evidence/proposedTasks/confidence/escalation 필드를 모두 요구한다. |
| [1499](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1499) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1500](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1500) | 모든 agent output은 최소한 다음 구조를 가진다. | 설명·요구 | role별 추가 schema 위에 공통 envelope를 두고 exact refs·scope·근거·범위를 검증한다. |
| [1501](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1501) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1502](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1502) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1503](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1503) | interface AgentOutput { | 타입 선언 | AgentOutput의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1504](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1504) |   taskId: TaskId | 데이터 필드 | grant의 task/region 대상과 일치해야 하며 다른 task 결과 제출을 거절한다. |
| [1505](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1505) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1506](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1506) |   findings: Finding[] | 데이터 필드 | 새 발견의 근거·novelty·적용 범위를 저장하고 중복 finding으로 reward를 부풀리지 않는다. |
| [1507](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1507) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1508](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1508) |   decisions: Decision[] | 데이터 필드 | 검증된 conclusion/evidence/assumption 구조를 요구한다. |
| [1509](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1509) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1510](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1510) |   risks: Risk[] | 데이터 필드 | 위험 차원·evidence·추정 불확실성을 포함하고 parent/integration aggregate에 연결한다. |
| [1511](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1511) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1512](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1512) |   unresolvedQuestions: Question[] | 데이터 필드 | 미해결 사항을 obligation 또는 escalation 후보로 변환한다. |
| [1513](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1513) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1514](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1514) |   evidence: EvidenceRef[] | 데이터 필드 | 실제 접근한 유효 evidence refs인지 검증하고 provenance를 보존한다. |
| [1515](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1515) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1516](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1516) |   proposedTasks: TaskProposal[] | 데이터 필드 | scope가 있는 제안이다. 서버 검증 후에만 ID를 할당한다. |
| [1517](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1517) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1518](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1518) |   confidence: number | 데이터 필드 | [0,1] 자기평가와 evidence 기반 calibrated 값의 구분을 보존한다. |
| [1519](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1519) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1520](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1520) |   requiresEscalation: boolean | 데이터 필드 | 추가 판단 요청 표시이다. 근거 검증과 router 허가 없이 상위 실행을 만들지 않는다. |
| [1521](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1521) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1522](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1522) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1523](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1523) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1524](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1524) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1525](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1525) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A38 — Escalation

원문 1526–1547행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a38)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1526](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1526) | # 38. Escalation | 제목 | 불확실성이나 구조 충돌의 증거에 따라 필요한 역할·수준으로 escalation한다. |
| [1527](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1527) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1528](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1528) | 에이전트가 자신이 해결할 수 없다고 판단하면 다음 level로 escalation한다. | 설명·요구 | unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1529](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1529) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1530](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1530) | 예: | 설명·요구 | unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1531](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1531) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1532](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1532) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1533](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1533) | Implementation Agent | 예시·흐름 | 검증 fixture: T03: requiresEscalation 플래그만 있고 근거가 없으면 추가 모델 호출이 없다. 구현: unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1534](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1534) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1535](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1535) | uncertainty 0.82 | 예시·흐름 | 검증 fixture: T03: requiresEscalation 플래그만 있고 근거가 없으면 추가 모델 호출이 없다. 구현: unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1536](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1536) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1537](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1537) | Architect Agent | 예시·흐름 | 검증 fixture: T03: requiresEscalation 플래그만 있고 근거가 없으면 추가 모델 호출이 없다. 구현: unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1538](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1538) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1539](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1539) | architecture conflict | 예시·흐름 | 검증 fixture: T03: requiresEscalation 플래그만 있고 근거가 없으면 추가 모델 호출이 없다. 구현: unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1540](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1540) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1541](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1541) | Critic + Integration Agent | 예시·흐름 | 검증 fixture: T03: requiresEscalation 플래그만 있고 근거가 없으면 추가 모델 호출이 없다. 구현: unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1542](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1542) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1543](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1543) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1544](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1544) | 중요한 점은 무조건 상위 agent를 호출하는 게 아니라 evidence-based escalation이라는 점이다. | 설명·요구 | unresolved question·검사 결과·profile 한계·요청 역할을 proposal로 받고 router가 grant를 결정한다. |
| [1545](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1545) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1546](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1546) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1547](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1547) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A39 — Cost Model

원문 1548–1583행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a39)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1548](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1548) | # 39. Cost Model | 제목 | context/reasoning/validation/coordination 네 비용을 각각 줄이고 합계를 관찰한다. |
| [1549](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1549) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1550](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1550) | 전체 시스템 비용을 다음처럼 볼 수 있다. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1551](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1551) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1552](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1552) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1553](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1553) | C_{\text{total}} | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1554](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1554) | = | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1555](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1555) | C_{\text{context}} | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1556](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1556) | + | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1557](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1557) | C_{\text{reasoning}} | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1558](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1558) | + | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1559](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1559) | C_{\text{validation}} | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1560](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1560) | + | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1561](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1561) | C_{\text{coordination}} | 수식 본문 | 식 전체의 구현 계약: ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. 검증: T13: 테스트 비용 증가가 추론 감소 뒤에 숨지 않고 전체 합계에 반영된다. |
| [1562](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1562) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1563](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1563) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1564](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1564) | 본 설계는 네 가지를 모두 줄인다. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1565](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1565) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1566](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1566) | ### Context | 제목 | context/reasoning/validation/coordination 네 비용을 각각 줄이고 합계를 관찰한다. |
| [1567](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1567) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1568](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1568) | Local retrieval. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1569](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1569) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1570](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1570) | ### Reasoning | 제목 | context/reasoning/validation/coordination 네 비용을 각각 줄이고 합계를 관찰한다. |
| [1571](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1571) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1572](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1572) | Sparse activation. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1573](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1573) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1574](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1574) | ### Validation | 제목 | context/reasoning/validation/coordination 네 비용을 각각 줄이고 합계를 관찰한다. |
| [1575](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1575) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1576](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1576) | Deterministic-first. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1577](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1577) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1578](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1578) | ### Coordination | 제목 | context/reasoning/validation/coordination 네 비용을 각각 줄이고 합계를 관찰한다. |
| [1579](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1579) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1580](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1580) | Graph-mediated communication. | 설명·요구 | ExecutionCost에 네 category와 단위·실측/추정 상태를 기록하고 local retrieval/sparse/preflight/graph communication 변경을 각각 측정한다. |
| [1581](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1581) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1582](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1582) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1583](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1583) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A40 — Efficiency Metric

원문 1584–1611행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a40)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1584](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1584) | # 40. Efficiency Metric | 제목 | 효율 numerator는 resolved risk/useful decision/detected failure이고 denominator는 token/latency/invocation이다. |
| [1585](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1585) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1586](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1586) | 단순 토큰 비용으로만 평가하지 않는다. | 설명·요구 | 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. |
| [1587](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1587) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1588](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1588) | 다음 지표를 사용한다. | 설명·요구 | 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. |
| [1589](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1589) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1590](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1590) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1591](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1591) | Efficiency | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1592](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1592) | = | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1593](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1593) | \frac | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1594](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1594) | { | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1595](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1595) | ResolvedRisk | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1596](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1596) | + | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1597](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1597) | UsefulDecisions | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1598](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1598) | + | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1599](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1599) | DetectedFailures | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1600](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1600) | } | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1601](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1601) | { | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1602](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1602) | Tokens | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1603](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1603) | + | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1604](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1604) | Latency | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1605](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1605) | + | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1606](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1606) | AgentInvocations | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1607](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1607) | } | 수식 본문 | 식 전체의 구현 계약: 중복 제거된 outcome refs와 비용 변환 가중치/관측 구간을 저장한다. 원시 지표도 함께 보존한다. 검증: T13: 동일 finding 중복 제출로 효율을 올리지 못하고 단위 변경에 score가 임의 변하지 않는다. |
| [1608](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1608) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1609](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1609) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1610](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1610) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1611](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1611) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A41 — Thinking Density

원문 1612–1628행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a41)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1612](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1612) | # 41. Thinking Density | 제목 | ThinkingDensity는 유용한 reasoning output의 비율이다. |
| [1613](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1613) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1614](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1614) | 새로운 메트릭을 정의할 수 있다. | 설명·요구 | 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. |
| [1615](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1615) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1616](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1616) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1617](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1617) | ThinkingDensity | 수식 본문 | 식 전체의 구현 계약: 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. 검증: T13: 빈 출력·중복 finding·유효 assurance가 정의대로 분류되고 분모 0은 미정이다. |
| [1618](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1618) | = | 수식 본문 | 식 전체의 구현 계약: 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. 검증: T13: 빈 출력·중복 finding·유효 assurance가 정의대로 분류되고 분모 0은 미정이다. |
| [1619](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1619) | \frac{\text{useful reasoning outputs}} | 수식 본문 | 식 전체의 구현 계약: 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. 검증: T13: 빈 출력·중복 finding·유효 assurance가 정의대로 분류되고 분모 0은 미정이다. |
| [1620](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1620) | {\text{total reasoning outputs}} | 수식 본문 | 식 전체의 구현 계약: 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. 검증: T13: 빈 출력·중복 finding·유효 assurance가 정의대로 분류되고 분모 0은 미정이다. |
| [1621](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1621) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1622](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1622) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1623](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1623) | 이 값이 낮으면 불필요한 에이전트 호출이 많다는 의미다. | 설명·요구 | 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. |
| [1624](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1624) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1625](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1625) | 목표는 Thinking Density를 높이는 것이다. | 설명·요구 | 근거로 채택된 decision/finding/assurance와 전체 reasoning outputs의 집계를 분리한다. |
| [1626](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1626) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1627](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1627) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1628](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1628) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A42 — Activation Precision / Recall

원문 1629–1658행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a42)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1629](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1629) | # 42. Activation Precision / Recall | 제목 | activation precision과 recall을 함께 평가해야 한다. |
| [1630](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1630) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1631](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1631) | activation 자체도 분류 문제로 평가한다. | 설명·요구 | 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. |
| [1632](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1632) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1633](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1633) | ### Precision | 제목 | activation precision과 recall을 함께 평가해야 한다. |
| [1634](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1634) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1635](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1635) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1636](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1636) | P= | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1637](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1637) | \frac | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1638](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1638) | {\text{useful activations}} | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1639](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1639) | {\text{all activations}} | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1640](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1640) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1641](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1641) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1642](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1642) | ### Recall | 제목 | activation precision과 recall을 함께 평가해야 한다. |
| [1643](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1643) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1644](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1644) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1645](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1645) | R= | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1646](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1646) | \frac | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1647](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1647) | {\text{problems caught by activation}} | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1648](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1648) | {\text{problems that required activation}} | 수식 본문 | 식 전체의 구현 계약: 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. 검증: T13: 모두 호출/모두 skip 후보가 각각 precision/recall tradeoff를 드러낸다. |
| [1649](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1649) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1650](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1650) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1651](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1651) | Precision만 높이면 중요한 문제를 놓칠 수 있다. | 설명·요구 | 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. |
| [1652](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1652) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1653](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1653) | Recall만 높이면 모든 agent를 항상 실행하는 시스템이 된다. | 설명·요구 | 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. |
| [1654](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1654) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1655](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1655) | 따라서 F-score 또는 cost-weighted score를 사용한다. | 설명·요구 | 활성·skip episode와 확인된 필요한 activation label을 연결하고 unknown/censored는 분모에서 구분한다. |
| [1656](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1656) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1657](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1657) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1658](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1658) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A43 — Cost-Weighted Activation Score

원문 1659–1684행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a43)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1659](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1659) | # 43. Cost-Weighted Activation Score | 제목 | F-beta에서 recall 비중과 비용 패널티를 역할 위험별로 설정한다. |
| [1660](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1660) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1661](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1661) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1662](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1662) | Score | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1663](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1663) | = | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1664](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1664) | \frac | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1665](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1665) | {(1+\beta^2)PR} | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1666](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1666) | {\beta^2P+R} | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1667](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1667) | - | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1668](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1668) | \lambda C | 수식 본문 | 식 전체의 구현 계약: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. 검증: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. |
| [1669](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1669) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1670](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1670) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1671](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1671) | 중요한 시스템에서는 recall의 가중치를 높일 수 있다. | 설명·요구 | beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1672](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1672) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1673](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1673) | 예: | 설명·요구 | beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1674](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1674) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1675](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1675) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1676](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1676) | Security | 예시·흐름 | 검증 fixture: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. 구현: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1677](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1677) | → recall priority | 예시·흐름 | 검증 fixture: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. 구현: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1678](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1678) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1679](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1679) | Formatting | 예시·흐름 | 검증 fixture: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. 구현: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1680](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1680) | → precision priority | 예시·흐름 | 검증 fixture: T13: security missed failure를 낮은 토큰 비용으로 상쇄해 승격하지 못한다. 구현: beta/lambda와 normalized cost를 versioned 평가 정책에 두고 correctness floor 아래 후보를 제외한다. |
| [1681](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1681) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1682](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1682) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1683](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1683) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1684](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1684) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A44 — Work Execution Lifecycle

원문 1685–1728행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a44)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1685](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1685) | # 44. Work Execution Lifecycle | 제목 | 요청부터 분해·그래프·의존성·신호·검사·위험·활성·실행·증거·local·child·통합·parent·final·outcome·feedback의 18단계를 닫는다. |
| [1686](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1686) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1687](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1687) | 전체 태스크 실행은 다음과 같다. | 설명·요구 | 각 단계 전후 durable event/의무를 정의하고 생략 가능한 단계는 유효 cache/불필요 근거를 trace한다. |
| [1688](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1688) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1689](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1689) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1690](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1690) | 1. User request | 예시·흐름 | user evidence와 goal event를 영속화한다. 필요한 자연어 해석만 bounded planning grant로 보낸다. |
| [1691](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1691) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1692](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1692) | 2. Task decomposition | 예시·흐름 | 분해 가치와 독립 산출물/검증 가능성을 검사한 후 scoped proposal을 채택한다. |
| [1693](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1693) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1694](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1694) | 3. Task graph construction | 예시·흐름 | 서버 ID·spec version·계층·실행 DAG를 transaction으로 저장한다. |
| [1695](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1695) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1696](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1696) | 4. Dependency identification | 예시·흐름 | declared/observed input ports·가정·환경·관계를 등록하고 completeness를 표시한다. |
| [1697](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1697) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1698](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1698) | 5. Initial signal extraction | 예시·흐름 | 목표/입력/변화의 신호를 versioned snapshot으로 만든다. |
| [1699](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1699) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1700](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1700) | 6. Deterministic checks | 예시·흐름 | 관련 validator를 실제 실행하고 receipt/evidence를 생성한다. |
| [1701](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1701) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1702](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1702) | 7. Risk estimation | 예시·흐름 | 유효 evidence와 독립성/상관 가정에 맞는 risk model로 score를 계산한다. |
| [1703](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1703) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1704](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1704) | 8. Agent activation | 예시·흐름 | task eligibility 뒤 role hard/soft policy를 평가하여 허가 또는 skip/wait를 기록한다. |
| [1705](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1705) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1706](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1706) | 9. Task execution | 예시·흐름 | native/Pod adapter가 단일 grant·input snapshot·scope·budget으로 실행한다. |
| [1707](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1707) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1708](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1708) | 10. Evidence generation | 예시·흐름 | 실제 output/read/write/validator receipt를 hash/version/provenance와 함께 저장한다. |
| [1709](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1709) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1710](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1710) | 11. Local validation | 예시·흐름 | 원문 role schema와 task acceptance/behavior/critical 의무를 검증한다. |
| [1711](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1711) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1712](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1712) | 12. Child task completion | 예시·흐름 | 현행 input/attempt 결과만 채택하고 자식의 검증·오차·미해결 의무를 집계한다. |
| [1713](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1713) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1714](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1714) | 13. Integration detection | 예시·흐름 | 여러 output이 같은 boundary를 바꿨는지 exact tuple로 확인한다. |
| [1715](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1715) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1716](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1716) | 14. Integration validation | 예시·흐름 | 공유/필수 조합의 7차원 compatibility 시나리오와 역할 의무를 수행한다. |
| [1717](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1717) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1718](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1718) | 15. Parent aggregation | 예시·흐름 | 자식 confidence/risk/error와 integration status를 집계하되 local repair 가능하면 상위 reasoning을 깨우지 않는다. |
| [1719](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1719) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1720](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1720) | 16. Final validation | 예시·흐름 | goal/graph/boundary/critical/error/현재 결과/미해결 의무의 conjunction을 검사한다. |
| [1721](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1721) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1722](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1722) | 17. Outcome evaluation | 예시·흐름 | 실제 유용성·비용·놓친 실패·과잉 재검토를 인과 evidence로 귀속한다. |
| [1723](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1723) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1724](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1724) | 18. Activation policy feedback | 예시·흐름 | 관측 label을 batch/critical meta 평가에 넣고 검증된 불변 policy version만 다음 실행에 반영한다. |
| [1725](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1725) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1726](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1726) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1727](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1727) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1728](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1728) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A45 — Task Decomposition

원문 1729–1752행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a45)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1729](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1729) | # 45. Task Decomposition | 제목 | Complexity+Parallelism+RiskIsolation-CoordinationCost가 충분할 때만 분해한다. |
| [1730](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1730) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1731](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1731) | 하위 태스크는 무조건 작게 나누지 않는다. | 설명·요구 | 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. |
| [1732](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1732) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1733](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1733) | 분해 비용 자체가 존재한다. | 설명·요구 | 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. |
| [1734](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1734) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1735](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1735) | 따라서 다음 함수로 판단한다. | 설명·요구 | 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. |
| [1736](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1736) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1737](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1737) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1738](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1738) | D(T) | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1739](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1739) | = | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1740](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1740) | Complexity | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1741](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1741) | + | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1742](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1742) | Parallelism | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1743](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1743) | + | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1744](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1744) | RiskIsolation | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1745](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1745) | - | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1746](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1746) | CoordinationCost | 수식 본문 | 식 전체의 구현 계약: 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. 검증: T12: 단순 작업 과분해는 거절되고 독립 위험 격리는 비용 근거와 함께 승인된다. |
| [1747](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1747) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1748](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1748) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1749](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1749) | \(D(T)\)가 threshold 이상일 때만 분해한다. | 설명·요구 | 정규화 지표·관측 비용·threshold를 정책으로 두고 독립 산출물/검증 가능성까지 확인한다. |
| [1750](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1750) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1751](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1751) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1752](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1752) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A46 — Dynamic Decomposition

원문 1753–1772행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a46)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1753](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1753) | # 46. Dynamic Decomposition | 제목 | 처음부터 전부 나누지 않고 실행 중 예상 밖 복잡성에서 split한다. |
| [1754](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1754) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1755](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1755) | 처음부터 모든 하위 task를 생성할 필요도 없다. | 설명·요구 | complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1756](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1756) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1757](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1757) | 작업 중 새로운 complexity가 발견되면 분해한다. | 설명·요구 | complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1758](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1758) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1759](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1759) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1760](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1760) | Task | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1761](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1761) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1762](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1762) | Execution | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1763](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1763) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1764](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1764) | Unexpected complexity | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1765](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1765) |  ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1766](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1766) | Split | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1767](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1767) |  ├─ Subtask A | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1768](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1768) |  └─ Subtask B | 예시·흐름 | 검증 fixture: T09,T12: running task 분할이 늦은 결과와 충돌하지 않고 비영향 sibling은 유지된다. 구현: complexity evidence→split proposal→region lease→기존 attempt stop/결과 보존→새 plan commit 순으로 처리한다. |
| [1769](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1769) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1770](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1770) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1771](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1771) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1772](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1772) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A47 — Dynamic Role Creation

원문 1773–1796행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a47)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1773](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1773) | # 47. Dynamic Role Creation | 제목 | 반복 전문 작업+기존 역할 부족+재사용 능력의 세 조건이 새 역할을 정당화한다. |
| [1774](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1774) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1775](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1775) | 기존 role로 문제를 해결할 수 없는 경우 새 role을 만들 수 있다. | 설명·요구 | capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1776](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1776) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1777](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1777) | 하지만 새 role 생성에도 조건이 필요하다. | 설명·요구 | capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1778](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1778) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1779](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1779) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1780](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1780) | Repeated specialized work | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1781](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1781) | + | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1782](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1782) | Existing roles insufficient | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1783](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1783) | + | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1784](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1784) | Reusable capability detected | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1785](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1785) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1786](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1786) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1787](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1787) | 예: | 설명·요구 | capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1788](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1788) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1789](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1789) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1790](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1790) | Kafka migration issues repeated | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1791](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1791) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1792](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1792) | Kafka Migration Specialist role | 예시·흐름 | 검증 fixture: T12: 일회성 Kafka 이름만으로 persistent 전문 역할을 만들지 못한다. 구현: capability gap evidence와 반복 사례·대체 역할 평가를 RoleProposal에 요구한다. |
| [1793](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1793) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1794](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1794) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1795](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1795) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1796](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1796) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A48 — Role Lifecycle

원문 1797–1812행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a48)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1797](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1797) | # 48. Role Lifecycle | 제목 | candidate→temporary→validated→persistent의 역할 lifecycle로 남발을 막는다. |
| [1798](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1798) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1799](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1799) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1800](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1800) | candidate | 예시·흐름 | 검증 fixture: T12: 각 전이 조건과 미검증 역할의 영구 승격 거절을 검사한다. 구현: temporary에 제한 grant/평가 budget을 부여하고 중복·비용·유용성 gate를 통과해야 persistent head를 등록한다. |
| [1801](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1801) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1802](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1802) | temporary | 예시·흐름 | 검증 fixture: T12: 각 전이 조건과 미검증 역할의 영구 승격 거절을 검사한다. 구현: temporary에 제한 grant/평가 budget을 부여하고 중복·비용·유용성 gate를 통과해야 persistent head를 등록한다. |
| [1803](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1803) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1804](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1804) | validated | 예시·흐름 | 검증 fixture: T12: 각 전이 조건과 미검증 역할의 영구 승격 거절을 검사한다. 구현: temporary에 제한 grant/평가 budget을 부여하고 중복·비용·유용성 gate를 통과해야 persistent head를 등록한다. |
| [1805](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1805) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1806](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1806) | persistent | 예시·흐름 | 검증 fixture: T12: 각 전이 조건과 미검증 역할의 영구 승격 거절을 검사한다. 구현: temporary에 제한 grant/평가 budget을 부여하고 중복·비용·유용성 gate를 통과해야 persistent head를 등록한다. |
| [1807](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1807) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1808](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1808) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1809](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1809) | 일회성 role 생성 남발을 방지한다. | 설명·요구 | temporary에 제한 grant/평가 budget을 부여하고 중복·비용·유용성 gate를 통과해야 persistent head를 등록한다. |
| [1810](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1810) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1811](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1811) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1812](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1812) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A49 — Orchestrator의 역할

원문 1813–1832행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a49)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1813](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1813) | # 49. Orchestrator의 역할 | 제목 | orchestrator의 책임은 event routing/graph mutation/policy/resource/escalation이며 중앙 AI 판단 독점이 아니다. |
| [1814](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1814) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1815](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1815) | Orchestrator는 모든 판단을 하는 중앙 AI여서는 안 된다. | 설명·요구 | graph-runtime의 control service가 다섯 책임을 소유하고 도메인 판단만 RoleVersion grant로 실행한다. |
| [1816](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1816) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1817](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1817) | 그러면 병목이 된다. | 설명·요구 | graph-runtime의 control service가 다섯 책임을 소유하고 도메인 판단만 RoleVersion grant로 실행한다. |
| [1818](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1818) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1819](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1819) | Orchestrator의 역할은 다음으로 제한한다. | 설명·요구 | graph-runtime의 control service가 다섯 책임을 소유하고 도메인 판단만 RoleVersion grant로 실행한다. |
| [1820](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1820) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1821](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1821) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1822](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1822) | event routing | 예시·흐름 | CP consumer가 event 종류/영향 entity 인덱스에 따라 처리기를 선택한다. |
| [1823](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1823) | graph mutation | 예시·흐름 | 서버가 scoped patch·외래키·DAG·version CAS를 검증해 변경한다. |
| [1824](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1824) | policy evaluation | 예시·흐름 | AP/CG/CM 정책 평가를 당시 불변 bundle로 재현 가능하게 실행한다. |
| [1825](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1825) | resource allocation | 예시·흐름 | 검증된 grant에만 scope lock·worker capacity·budget reservation을 부여한다. |
| [1826](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1826) | escalation | 예시·흐름 | 미해결 근거·local 실패·권한/예산을 검증한 뒤 다음 역할/영역을 허가한다. |
| [1827](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1827) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1828](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1828) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1829](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1829) | 실제 도메인 판단은 해당 role agent가 수행한다. | 설명·요구 | graph-runtime의 control service가 다섯 책임을 소유하고 도메인 판단만 RoleVersion grant로 실행한다. |
| [1830](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1830) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1831](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1831) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1832](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1832) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A50 — Control Plane / Intelligence Plane

원문 1833–1866행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a50)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1833](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1833) | # 50. Control Plane / Intelligence Plane | 제목 | 상태/그래프/이벤트/정책/스케줄/cache/version과 reasoning/research/architecture/criticism/synthesis를 분리한다. |
| [1834](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1834) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1835](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1835) | 시스템을 두 계층으로 분리한다. | 설명·요구 | CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1836](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1836) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1837](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1837) | ## Control Plane | 제목 | 상태/그래프/이벤트/정책/스케줄/cache/version과 reasoning/research/architecture/criticism/synthesis를 분리한다. |
| [1838](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1838) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1839](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1839) | 결정론적 코드 중심. | 설명·요구 | CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1840](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1840) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1841](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1841) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1842](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1842) | Task state | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1843](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1843) | Graph | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1844](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1844) | Events | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1845](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1845) | Policy | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1846](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1846) | Scheduling | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1847](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1847) | Caching | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1848](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1848) | Versioning | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1849](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1849) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1850](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1850) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1851](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1851) | ## Intelligence Plane | 제목 | 상태/그래프/이벤트/정책/스케줄/cache/version과 reasoning/research/architecture/criticism/synthesis를 분리한다. |
| [1852](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1852) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1853](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1853) | LLM 중심. | 설명·요구 | CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1854](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1854) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1855](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1855) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1856](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1856) | Reasoning | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1857](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1857) | Research | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1858](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1858) | Architecture | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1859](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1859) | Criticism | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1860](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1860) | Synthesis | 예시·흐름 | 검증 fixture: T02: intelligence result가 검증 없는 control state 직접 변경을 수행하지 못한다. 구현: CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1861](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1861) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1862](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1862) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1863](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1863) | 가능한 모든 것은 Control Plane에서 처리한다. | 설명·요구 | CP가 admission과 상태 권한을 갖고 EX는 제한된 semantic proposal/result adapter가 된다. |
| [1864](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1864) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1865](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1865) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1866](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1866) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A51 — 이 분리의 중요성

원문 1867–1886행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a51)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1867](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1867) | # 51. 이 분리의 중요성 | 제목 | ID/의존성 무결성/전이/version/cache/locking/status는 LLM 책임이 아니다. |
| [1868](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1868) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1869](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1869) | LLM이 다음을 직접 관리하게 하면 안 된다. | 설명·요구 | 서버가 ID/version을 할당하고 scoped mutation/CAS/fencing/cache proof를 강제한다. |
| [1870](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1870) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1871](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1871) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1872](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1872) | task IDs | 예시·흐름 | proposal-local ID를 서버 stable ID로 치환하며 LLM이 영구 ID를 확정하지 않는다. |
| [1873](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1873) | dependency integrity | 예시·흐름 | 외래키·실행 cycle·port/schema binding을 graph mutation transaction에서 검사한다. |
| [1874](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1874) | state transitions | 예시·흐름 | CP가 상태 전이 precondition과 obligation을 검사한다. |
| [1875](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1875) | version numbers | 예시·흐름 | append-only version 생성과 head CAS는 서버가 수행한다. |
| [1876](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1876) | cache invalidation | 예시·흐름 | actual read vector·typed change·boundary proof의 역인덱스로 계산한다. |
| [1877](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1877) | locking | 예시·흐름 | scheduler가 grant scope·실제 종료 evidence를 기준으로 lock을 관리한다. |
| [1878](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1878) | execution status | 예시·흐름 | native/Pod의 실제 receipt와 attempt token으로 상태를 확정한다. |
| [1879](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1879) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1880](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1880) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1881](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1881) | 이것은 deterministic system이 담당한다. | 설명·요구 | 서버가 ID/version을 할당하고 scoped mutation/CAS/fencing/cache proof를 강제한다. |
| [1882](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1882) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1883](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1883) | LLM은 의미 판단에 집중한다. | 설명·요구 | 서버가 ID/version을 할당하고 scoped mutation/CAS/fencing/cache proof를 강제한다. |
| [1884](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1884) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1885](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1885) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1886](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1886) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A52 — Failure Attribution

원문 1887–1904행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a52)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1887](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1887) | # 52. Failure Attribution | 제목 | 분해/context/reasoning/activation/validation/integration/policy 계층을 나눠 실패를 귀속한다. |
| [1888](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1888) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1889](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1889) | 실패가 발생하면 누가 틀렸는지만 찾지 않는다. | 설명·요구 | 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1890](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1890) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1891](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1891) | 다음 중 어느 계층의 문제인지 분석한다. | 설명·요구 | 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1892](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1892) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1893](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1893) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1894](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1894) | Task decomposition failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1895](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1895) | Context retrieval failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1896](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1896) | Agent reasoning failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1897](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1897) | Activation failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1898](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1898) | Validation failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1899](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1899) | Integration failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1900](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1900) | Policy failure | 예시·흐름 | 검증 fixture: T11: 부족한 context 사례를 reasoning failure로 자동 확정하지 않는다. 구현: 실패 evidence와 실행 trace에서 복수 원인 가설·confidence를 만들고 검증된 원인만 학습 label로 사용한다. |
| [1901](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1901) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1902](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1902) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1903](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1903) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1904](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1904) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A53 — Failure Taxonomy

원문 1905–1921행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a53)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1905](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1905) | # 53. Failure Taxonomy | 제목 | 아홉 FailureType을 모두 지원한다. |
| [1906](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1906) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1907](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1907) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1908](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1908) | type FailureType = | 타입 선언 | FailureType의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1909](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1909) |   &#124; "missed_activation" | 열거값 | 과거 skip과 나중 실패의 인과 근거를 연결한다. |
| [1910](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1910) |   &#124; "unnecessary_activation" | 열거값 | 실질 가치와 필수 assurance를 평가한 후 낭비로 귀속한다. |
| [1911](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1911) |   &#124; "bad_reasoning" | 열거값 | 충분하고 유효한 context에서도 판단이 틀린 근거를 확인한다. |
| [1912](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1912) |   &#124; "insufficient_context" | 열거값 | 필요한 정보가 selector/budget에서 누락됐는지 manifest로 확인한다. |
| [1913](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1913) |   &#124; "stale_context" | 열거값 | 당시 사용한 evidence/dependency vector의 유효성 위반을 확인한다. |
| [1914](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1914) |   &#124; "bad_decomposition" | 열거값 | 분할/결합/경계가 실패를 만든 구조 근거를 확인한다. |
| [1915](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1915) |   &#124; "integration_failure" | 열거값 | 정확한 조합 tuple과 충돌 dimension 및 원인 lineage를 남긴다. |
| [1916](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1916) |   &#124; "validation_gap" | 열거값 | 필요 validator/시나리오/조합 의무의 누락 근거를 남긴다. |
| [1917](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1917) |   &#124; "bad_policy" | 열거값 | 당시 불변 정책 버전의 판단 오류를 재생하고 후보 수정에 연결한다. |
| [1918](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1918) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1919](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1919) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1920](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1920) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1921](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1921) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A54 — Self-Improvement 대상

원문 1922–1941행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a54)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1922](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1922) | # 54. Self-Improvement 대상 | 제목 | prompt 외 activation/context/decomposition/role/validation/integration/escalation/cache/precision을 전부 개선 대상으로 삼는다. |
| [1923](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1923) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1924](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1924) | 시스템은 prompt만 개선하지 않는다. | 설명·요구 | 아홉 target별 schema·replay evaluator·shadow 영향 계산·승격·rollback adapter를 구현한다. |
| [1925](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1925) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1926](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1926) | 다음을 모두 개선할 수 있다. | 설명·요구 | 아홉 target별 schema·replay evaluator·shadow 영향 계산·승격·rollback adapter를 구현한다. |
| [1927](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1927) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1928](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1928) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1929](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1929) | activation policy | 예시·흐름 | trigger/weight/threshold/cooldown/quota 후보에 replay·shadow·quality gate를 적용한다. |
| [1930](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1930) | context selection | 예시·흐름 | selector/relevance/summary/budget allocation 후보의 필수 근거 보존을 검증한다. |
| [1931](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1931) | task decomposition | 예시·흐름 | split/chunk 후보의 비용·독립성·검증성·기존 prefix 보존을 평가한다. |
| [1932](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1932) | role definitions | 예시·흐름 | purpose/capability/prompt/context/schema/validator 변경을 역할 버전·lifecycle로 평가한다. |
| [1933](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1933) | validation rules | 예시·흐름 | coverage gap을 보완하는 validator/시나리오 정책을 검증하며 hard 제약 약화를 금지한다. |
| [1934](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1934) | integration rules | 예시·흐름 | 공유 boundary 탐지와 joint tuple/scenario 선택을 missed conflict/비용으로 평가한다. |
| [1935](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1935) | escalation thresholds | 예시·흐름 | local 복구 실패·risk/evidence 기준의 상위 활성화 임계값을 검증한다. |
| [1936](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1936) | cache policy | 예시·흐름 | semantic view 선택·만료·무효화 규칙을 false reuse/불필요 miss의 근거로 평가한다. |
| [1937](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1937) | reasoning level selection | 예시·흐름 | 실제 capability profile별 품질·비용·실패를 비교하여 L0–L5 선택 정책을 개선한다. |
| [1938](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1938) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1939](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1939) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1940](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1940) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1941](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1941) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A55 — 메타 에이전트

원문 1942–1961행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a55)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1942](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1942) | # 55. 메타 에이전트 | 제목 | meta는 batch sample 또는 중요한 실패에서만 실행한다. 20회는 예시다. |
| [1943](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1943) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1944](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1944) | Self-improvement를 담당하는 Meta Agent는 작업마다 실행되지 않는다. | 설명·요구 | 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1945](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1945) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1946](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1946) | 충분한 failure sample이 쌓였을 때 batch로 실행한다. | 설명·요구 | 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1947](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1947) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1948](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1948) | 예: | 설명·요구 | 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1949](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1949) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1950](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1950) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1951](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1951) | 20 executions | 예시·흐름 | 검증 fixture: T11,T13: 매 task마다 meta가 실행되지 않고 같은 batch의 중복 event도 실행 1회다. 구현: 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1952](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1952) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1953](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1953) | policy evaluation | 예시·흐름 | 검증 fixture: T11,T13: 매 task마다 meta가 실행되지 않고 같은 batch의 중복 event도 실행 1회다. 구현: 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1954](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1954) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1955](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1955) | candidate improvements | 예시·흐름 | 검증 fixture: T11,T13: 매 task마다 meta가 실행되지 않고 같은 batch의 중복 event도 실행 1회다. 구현: 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1956](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1956) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1957](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1957) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1958](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1958) | 또는 중요한 failure 발생 시 즉시 실행할 수도 있다. | 설명·요구 | 정책상 표본 조건과 critical failure event로 meta grant를 만들고 평가 구간을 pin한다. |
| [1959](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1959) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1960](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1960) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1961](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1961) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A56 — Meta Agent의 출력

원문 1962–1989행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a56)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1962](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1962) | # 56. Meta Agent의 출력 | 제목 | PolicyProposal의 target/pattern/rootCause/invariant/rule/benefit/regressionRisk를 모두 검증한다. |
| [1963](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1963) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1964](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1964) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1965](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1965) | interface PolicyProposal { | 타입 선언 | PolicyProposal의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1966](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1966) |   target: | 데이터 필드 | A56의 6예시를 A54의 9대상과 B propagation/boundary/expectation/routine까지 확장한다. |
| [1967](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1967) |     &#124; "activation" | 열거값 | 역할 trigger/weight/threshold/cooldown/quota 평가·shadow·승격 대상이다. |
| [1968](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1968) |     &#124; "context" | 열거값 | selector·budget allocation·summary hierarchy 정책의 평가·승격 대상이다. |
| [1969](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1969) |     &#124; "validation" | 열거값 | 필수 검증 coverage를 약화하지 않는 validator 선택 정책을 평가한다. |
| [1970](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1970) |     &#124; "decomposition" | 열거값 | split/chunk의 비용·품질·scope 검증 정책을 평가한다. |
| [1971](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1971) |     &#124; "role" | 열거값 | capability/prompt/schema/validator/lifecycle 정책을 평가한다. |
| [1972](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1972) |     &#124; "integration" | 열거값 | 공유 boundary 탐지·조합 시나리오·통합 의무 정책을 평가한다. |
| [1973](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1973) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1974](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1974) |   observedPattern: string | 데이터 필드 | 실제 사례·episode refs에 연결된 반복 구조이다. |
| [1975](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1975) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1976](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1976) |   rootCause: string | 데이터 필드 | 검증 근거와 대안 가설을 가진 원인 귀속이다. 마지막 agent를 자동 지목하지 않는다. |
| [1977](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1977) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1978](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1978) |   proposedInvariant: string | 데이터 필드 | 사례 이름이 아닌 일반 구조 제약이다. critical correctness를 일반 학습으로 약화하지 않는다. |
| [1979](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1979) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1980](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1980) |   proposedRule: Rule | 데이터 필드 | 허용된 구조 DSL AST이며 ID/파일명 특례와 숨은 mutation을 거절한다. |
| [1981](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1981) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1982](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1982) |   expectedBenefit: number | 데이터 필드 | 정규화 utility의 추정값과 불확실성이다. 실측 효과와 구분한다. |
| [1983](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1983) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1984](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1984) |   regressionRisk: number | 데이터 필드 | holdout/shadow 실패와 영향 범위를 평가하며 승격·rollback gate에 사용한다. |
| [1985](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1985) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1986](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1986) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1987](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1987) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1988](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1988) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1989](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1989) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A57 — 인간의 역할

원문 1990–2007행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a57)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1990](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1990) | # 57. 인간의 역할 | 제목 | persistent role/critical policy/architecture/high-impact rewrite/security exception의 승인은 설정 가능한 정책이다. |
| [1991](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1991) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1992](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1992) | 시스템은 완전 자율 시스템으로 설계할 필요가 없다. | 설명·요구 | authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [1993](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1993) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1994](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1994) | 특히 다음 변경은 인간 승인 대상으로 둘 수 있다. | 설명·요구 | authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [1995](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1995) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1996](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1996) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1997](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1997) | new persistent role | 예시·흐름 | 검증 fixture: T11: 승인 필요·사전 승인·승인 불필요 세 정책 경로를 각각 검증한다. 구현: authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [1998](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1998) | critical policy changes | 예시·흐름 | 검증 fixture: T11: 승인 필요·사전 승인·승인 불필요 세 정책 경로를 각각 검증한다. 구현: authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [1999](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:1999) | architecture decisions | 예시·흐름 | 검증 fixture: T11: 승인 필요·사전 승인·승인 불필요 세 정책 경로를 각각 검증한다. 구현: authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [2000](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2000) | high-impact task rewrites | 예시·흐름 | 검증 fixture: T11: 승인 필요·사전 승인·승인 불필요 세 정책 경로를 각각 검증한다. 구현: authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [2001](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2001) | security exceptions | 예시·흐름 | 검증 fixture: T11: 승인 필요·사전 승인·승인 불필요 세 정책 경로를 각각 검증한다. 구현: authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [2002](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2002) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2003](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2003) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2004](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2004) | Self-improvement는 제안과 검증까지 수행하고 적용은 policy에 따라 결정한다. | 설명·요구 | authorization predicate를 versioned policy로 평가하고 사용자 사전 권한을 재사용한다. 제안·검증 단계는 미리 완료한다. |
| [2005](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2005) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2006](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2006) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2007](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2007) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A58 — 안전장치

원문 2008–2021행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a58)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2008](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2008) | # 58. 안전장치 | 제목 | 무기록/숨은 mutation을 금지하고 불변 버전·되돌릴 수 있는 변경·설명 가능한 학습을 요구한다. |
| [2009](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2009) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2010](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2010) | 자기개선 시스템에는 다음 제한이 필요하다. | 설명·요구 | append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2011](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2011) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2012](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2012) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2013](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2013) | no self-modification without trace | 예시·흐름 | 검증 fixture: T11: SQL/API 경로의 head 변경도 event 없이 성공하지 못한다. 구현: append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2014](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2014) | no hidden policy mutation | 예시·흐름 | 검증 fixture: T11: SQL/API 경로의 head 변경도 event 없이 성공하지 못한다. 구현: append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2015](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2015) | all policy versions immutable | 예시·흐름 | 검증 fixture: T11: SQL/API 경로의 head 변경도 event 없이 성공하지 못한다. 구현: append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2016](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2016) | all changes reversible | 예시·흐름 | 검증 fixture: T11: SQL/API 경로의 head 변경도 event 없이 성공하지 못한다. 구현: append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2017](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2017) | all learned rules explainable | 예시·흐름 | 검증 fixture: T11: SQL/API 경로의 head 변경도 event 없이 성공하지 못한다. 구현: append-only version과 auditable head 변경을 사용하고 모든 rule에 구조·근거·rollback target을 요구한다. |
| [2018](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2018) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2019](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2019) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2020](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2020) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2021](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2021) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A59 — Policy Versioning

원문 2022–2035행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a59)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2022](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2022) | # 59. Policy Versioning | 제목 | 모든 실행은 activation-policy/vN 같은 당시 정책 버전을 고정하고 rollback 가능해야 한다. |
| [2023](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2023) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2024](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2024) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2025](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2025) | activation-policy/v41 | 예시·흐름 | 검증 fixture: T11,T14: 진행 run의 정책은 조용히 바뀌지 않고 새 run은 되돌린 버전을 사용한다. 구현: grant/run/skip/replan/context에 policy bundle ref를 pin하고 rollback은 새 event로 head만 전환한다. |
| [2026](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2026) | activation-policy/v42 | 예시·흐름 | 검증 fixture: T11,T14: 진행 run의 정책은 조용히 바뀌지 않고 새 run은 되돌린 버전을 사용한다. 구현: grant/run/skip/replan/context에 policy bundle ref를 pin하고 rollback은 새 event로 head만 전환한다. |
| [2027](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2027) | activation-policy/v43 | 예시·흐름 | 검증 fixture: T11,T14: 진행 run의 정책은 조용히 바뀌지 않고 새 run은 되돌린 버전을 사용한다. 구현: grant/run/skip/replan/context에 policy bundle ref를 pin하고 rollback은 새 event로 head만 전환한다. |
| [2028](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2028) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2029](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2029) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2030](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2030) | 모든 실행은 사용한 policy version을 기록한다. | 설명·요구 | grant/run/skip/replan/context에 policy bundle ref를 pin하고 rollback은 새 event로 head만 전환한다. |
| [2031](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2031) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2032](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2032) | 문제가 생기면 rollback할 수 있다. | 설명·요구 | grant/run/skip/replan/context에 policy bundle ref를 pin하고 rollback은 새 event로 head만 전환한다. |
| [2033](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2033) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2034](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2034) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2035](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2035) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A60 — Observability

원문 2036–2055행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a60)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2036](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2036) | # 60. Observability | 제목 | Event부터 Outcome까지 신호·활성/skip·context·level·evidence·decision·cost·latency를 모두 추적한다. |
| [2037](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2037) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2038](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2038) | 모든 실행에 대해 다음 trace를 남긴다. | 설명·요구 | correlation/causation으로 각 artifact를 join하고 실제 prompt manifest/profile/usage receipt까지 기록한다. |
| [2039](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2039) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2040](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2040) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2041](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2041) | Event | 예시·흐름 | trace 시작 source event의 id/type/entity/before/after를 기록한다. |
| [2042](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2042) | Signals | 예시·흐름 | 당시 feature 값·추출 근거·extractor version을 pin한다. |
| [2043](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2043) | Activated agents | 예시·흐름 | 발급 grant·role version·attempt/worker binding을 기록한다. |
| [2044](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2044) | Skipped agents | 예시·흐름 | 후보 제외/threshold/cooldown/영향 밖 이유와 policy catalog를 기록한다. |
| [2045](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2045) | Context supplied | 예시·흐름 | 실제 serialized context manifest와 확장 revision·token 사용을 기록한다. |
| [2046](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2046) | Reasoning level | 예시·흐름 | 실제 provider/model/profile/capability와 L0–L5 선택 근거를 기록한다. |
| [2047](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2047) | Evidence | 예시·흐름 | 실제 실행/검증/외부 출처의 exact refs를 기록한다. |
| [2048](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2048) | Decision | 예시·흐름 | 채택된 conclusion·assumption·confidence와 보존/변경 판단을 기록한다. |
| [2049](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2049) | Cost | 예시·흐름 | context/reasoning/validation/coordination별 실측·추정·미관측을 구분한다. |
| [2050](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2050) | Latency | 예시·흐름 | queue/wait/execution/validation/coordination 시간을 별도로 측정한다. |
| [2051](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2051) | Outcome | 예시·흐름 | 실제 유용성·실패·의무 충족·FP/FN/unknown label을 인과 근거로 연결한다. |
| [2052](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2052) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2053](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2053) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2054](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2054) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2055](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2055) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A61 — 왜 Skip 기록이 중요한가

원문 2056–2075행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a61)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2056](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2056) | # 61. 왜 Skip 기록이 중요한가 | 제목 | skip 이유와 당시 risk/threshold를 남겨야 missed activation을 분석할 수 있다. |
| [2057](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2057) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2058](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2058) | 대부분의 시스템은 실행한 agent만 기록한다. | 설명·요구 | ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2059](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2059) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2060](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2060) | 하지만 본 시스템에서는 실행하지 않은 결정이 중요하다. | 설명·요구 | ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2061](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2061) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2062](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2062) | 예: | 설명·요구 | ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2063](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2063) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2064](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2064) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2065](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2065) | Architect skipped | 예시·흐름 | 검증 fixture: T11: 뒤늦은 실패에서 Architect가 왜 skip됐는지 당시 값으로 설명할 수 있다. 구현: ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2066](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2066) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2067](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2067) | Reason: | 예시·흐름 | 검증 fixture: T11: 뒤늦은 실패에서 Architect가 왜 skip됐는지 당시 값으로 설명할 수 있다. 구현: ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2068](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2068) | architectureRisk = 0.12 | 예시·흐름 | 검증 fixture: T11: 뒤늦은 실패에서 Architect가 왜 skip됐는지 당시 값으로 설명할 수 있다. 구현: ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2069](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2069) | threshold = 0.65 | 예시·흐름 | 검증 fixture: T11: 뒤늦은 실패에서 Architect가 왜 skip됐는지 당시 값으로 설명할 수 있다. 구현: ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2070](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2070) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2071](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2071) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2072](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2072) | 이 기록이 있어야 missed activation을 분석할 수 있다. | 설명·요구 | ActivationDecision에 feature/score/threshold/cooldown/영향 제외 사유를 저장한다. |
| [2073](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2073) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2074](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2074) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2075](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2075) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A62 — Execution Trace 예시

원문 2076–2112행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a62)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2076](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2076) | # 62. Execution Trace 예시 | 제목 | cache invalidation 사례는 static pass 이후 Architect/QA/Implementation만 활성화하고 통합 실패를 찾아 비용과 연결하는 예시다. |
| [2077](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2077) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2078](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2078) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2079](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2079) | Task #182 | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2080](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2080) | "Add cache invalidation" | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2081](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2081) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2082](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2082) | Signals | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2083](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2083) | - shared infrastructure touched | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2084](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2084) | - public API unchanged | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2085](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2085) | - integration risk 0.72 | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2086](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2086) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2087](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2087) | Deterministic | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2088](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2088) | - typecheck PASS | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2089](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2089) | - unit tests PASS | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2090](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2090) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2091](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2091) | Activation | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2092](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2092) | Implementation: YES | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2093](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2093) | Architect: YES | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2094](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2094) | QA: YES | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2095](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2095) | Research: NO | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2096](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2096) | UX: NO | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2097](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2097) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2098](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2098) | Integration | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2099](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2099) | Redis client | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2100](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2100) | API server | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2101](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2101) | worker | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2102](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2102) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2103](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2103) | Result | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2104](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2104) | integration test failure detected | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2105](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2105) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2106](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2106) | Cost | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2107](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2107) | 3 agent invocations | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2108](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2108) | instead of 7 | 예시·흐름 | 검증 fixture: T15: 3/7은 고정 절감 약속이 아니라 fixture 관찰값이며 이름을 바꿔도 같은 구조 결과다. 구현: 공유 infrastructure·통합 위험 구조의 E2E fixture로 만들고 필요한 역할·관계·실제 실패 evidence를 검증한다. |
| [2109](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2109) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2110](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2110) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2111](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2111) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2112](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2112) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A63 — 데이터 저장 구조

원문 2113–2132행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a63)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2113](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2113) | # 63. 데이터 저장 구조 | 제목 | Task/Knowledge/Evidence/Policy/Execution/Artifact의 논리 저장 책임을 분리한다. |
| [2114](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2114) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2115](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2115) | 핵심 저장소는 다음과 같이 분리하는 것이 좋다. | 설명·요구 | 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2116](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2116) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2117](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2117) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2118](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2118) | Task Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2119](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2119) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2120](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2120) | Knowledge Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2121](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2121) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2122](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2122) | Evidence Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2123](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2123) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2124](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2124) | Policy Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2125](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2125) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2126](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2126) | Execution Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2127](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2127) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2128](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2128) | Artifact Store | 예시·흐름 | 검증 fixture: T14: 영역 간 참조 integrity와 backup/restore가 함께 검증된다. 구현: 물리 DB는 유지하되 여섯 소유 영역의 repository와 versioned refs를 정의한다. |
| [2129](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2129) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2130](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2130) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2131](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2131) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2132](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2132) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A64 — Graph Storage

원문 2133–2155행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a64)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2133](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2133) | # 64. Graph Storage | 제목 | 관계형 tables로 graph를 구현할 수 있으며 graph DB는 선택이다. |
| [2134](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2134) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2135](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2135) | 초기 구현에서는 반드시 graph database가 필요한 것은 아니다. | 설명·요구 | 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2136](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2136) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2137](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2137) | 관계형 데이터베이스에서도 충분하다. | 설명·요구 | 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2138](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2138) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2139](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2139) | 예: | 설명·요구 | 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2140](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2140) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2141](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2141) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2142](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2142) | tasks | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2143](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2143) | task_edges | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2144](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2144) | artifacts | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2145](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2145) | artifact_edges | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2146](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2146) | decisions | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2147](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2147) | evidence | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2148](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2148) | agent_runs | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2149](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2149) | policies | 예시·흐름 | 검증 fixture: T05,T14: graph DB 없이 인과 조회·무결성·재시작 재현을 만족한다. 구현: 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2150](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2150) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2151](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2151) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2152](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2152) | 필요하면 향후 graph DB로 전환한다. | 설명·요구 | 필요 테이블·외래키·edge/consumer/obligation 인덱스를 추가하고 기존 artifact 계보와 연결한다. |
| [2153](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2153) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2154](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2154) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2155](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2155) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A65 — Event Bus

원문 2156–2175행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a65)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2156](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2156) | # 65. Event Bus | 제목 | 모든 의미 상태 변화는 Task/Artifact/Dependency/Validation/Integration/Agent/Policy event를 생성한다. |
| [2157](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2157) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2158](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2158) | 모든 상태 변화는 Event를 생성한다. | 설명·요구 | state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2159](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2159) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2160](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2160) | 예: | 설명·요구 | state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2161](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2161) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2162](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2162) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2163](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2163) | TaskCreated | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2164](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2164) | TaskUpdated | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2165](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2165) | TaskCompleted | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2166](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2166) | ArtifactChanged | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2167](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2167) | DependencyChanged | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2168](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2168) | ValidationFailed | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2169](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2169) | IntegrationRequired | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2170](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2170) | AgentCompleted | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2171](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2171) | PolicyUpdated | 예시·흐름 | 검증 fixture: T01: mutation 후 crash해도 event가 사라지거나 외부 run이 중복 채택되지 않는다. 구현: state+event+outbox atomic transaction과 idempotent consumer effects를 추가한다. |
| [2172](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2172) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2173](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2173) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2174](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2174) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2175](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2175) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A66 — Event 형태

원문 2176–2197행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a66)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2176](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2176) | # 66. Event 형태 | 제목 | event id/type/entityId/timestamp/payload/causationId/correlationId 전부를 유지한다. |
| [2177](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2177) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2178](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2178) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2179](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2179) | interface AgentSystemEvent&lt;T = unknown&gt; { | 타입 선언 | AgentSystemEvent의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [2180](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2180) |   id: string | 데이터 필드 | 서버가 생성하는 event identity이며 소비자 멱등 처리 키에 사용한다. |
| [2181](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2181) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2182](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2182) |   type: string | 데이터 필드 | schema registry에 등록된 의미 변화 종류이다. |
| [2183](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2183) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2184](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2184) |   entityId: string | 데이터 필드 | 영향 entity를 가리키고 graph consumer index의 시작점이 된다. |
| [2185](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2185) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2186](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2186) |   timestamp: Date | 데이터 필드 | 관찰/기록시각을 보존하되 처리 순서는 durable sequence로 확정한다. |
| [2187](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2187) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2188](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2188) |   payload: T | 데이터 필드 | 종류별 schemaVersion으로 검증한 불변 payload이며 참조 버전을 고정한다. |
| [2189](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2189) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2190](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2190) |   causationId?: string | 데이터 필드 | 직접 원인 event ID이다. 연쇄 실패·repair의 이유를 추적한다. |
| [2191](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2191) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2192](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2192) |   correlationId?: string | 데이터 필드 | 같은 사용자 목표/변경 episode의 상관 ID이다. causation과 혼용하지 않는다. |
| [2193](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2193) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [2194](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2194) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2195](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2195) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2196](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2196) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2197](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2197) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A67 — Event Sourcing 가능성

원문 2198–2215행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a67)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2198](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2198) | # 67. Event Sourcing 가능성 | 제목 | 과거 event와 새로운 정책을 재생해 판단 차이를 비교할 수 있어야 한다. full event sourcing 자체는 선택이다. |
| [2199](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2199) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2200](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2200) | 시스템 상태를 event sourcing 기반으로 구성하면 매우 유리하다. | 설명·요구 | 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2201](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2201) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2202](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2202) | 왜냐하면 self-improvement를 위해 과거 판단을 재생할 수 있기 때문이다. | 설명·요구 | 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2203](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2203) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2204](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2204) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2205](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2205) | Past events | 예시·흐름 | 검증 fixture: T13: 과거 시점에 없던 증거가 replay 입력으로 누출되지 않는다. 구현: 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2206](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2206) | + | 예시·흐름 | 검증 fixture: T13: 과거 시점에 없던 증거가 replay 입력으로 누출되지 않는다. 구현: 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2207](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2207) | New policy | 예시·흐름 | 검증 fixture: T13: 과거 시점에 없던 증거가 replay 입력으로 누출되지 않는다. 구현: 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2208](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2208) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2209](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2209) | Replay | 예시·흐름 | 검증 fixture: T13: 과거 시점에 없던 증거가 replay 입력으로 누출되지 않는다. 구현: 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2210](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2210) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2211](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2211) | Would new policy have done better? | 예시·흐름 | 검증 fixture: T13: 과거 시점에 없던 증거가 replay 입력으로 누출되지 않는다. 구현: 불변 snapshot+event journal+policy/evidence refs를 보관하고 replay snapshot 일관성을 검증한다. |
| [2212](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2212) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2213](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2213) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2214](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2214) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2215](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2215) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A68 — Counterfactual Evaluation

원문 2216–2236행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a68)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2216](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2216) | # 68. Counterfactual Evaluation | 제목 | QA skip 과거 실패에 후보가 activate했을지를 비교한다. |
| [2217](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2217) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2218](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2218) | Policy 개선 시 실제 production에 바로 적용하지 않고 과거 실행을 다시 평가한다. | 설명·요구 | would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2219](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2219) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2220](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2220) | 예: | 설명·요구 | would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2221](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2221) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2222](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2222) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2223](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2223) | Old policy: | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2224](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2224) | QA skipped | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2225](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2225) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2226](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2226) | New candidate policy: | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2227](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2227) | QA would activate | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2228](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2228) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2229](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2229) | Historical result: | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2230](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2230) | integration failure occurred | 예시·흐름 | 검증 fixture: T13: 호출 예측만으로 실패를 막았다는 reward를 확정하지 않는다. 구현: would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2231](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2231) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2232](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2232) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2233](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2233) | 새 policy가 더 좋았다는 증거가 된다. | 설명·요구 | would-activate와 observed failure를 별도 label로 기록하고 해결 효과는 sandbox 실행 또는 검증 evidence가 있어야 인정한다. |
| [2234](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2234) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2235](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2235) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2236](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2236) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A69 — Shadow Policy

원문 2237–2252행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a69)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2237](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2237) | # 69. Shadow Policy | 제목 | shadow는 production action을 바꾸지 않고 predicted action만 만든다. |
| [2238](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2238) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2239](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2239) | 새 policy는 실제 routing을 바꾸지 않고 예측만 수행한다. | 설명·요구 | shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2240](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2240) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2241](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2241) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2242](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2242) | Production policy | 예시·흐름 | 검증 fixture: T11: shadow 활성화가 실제 worker·context·cache head를 바꾸지 않는다. 구현: shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2243](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2243) | → actual action | 예시·흐름 | 검증 fixture: T11: shadow 활성화가 실제 worker·context·cache head를 바꾸지 않는다. 구현: shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2244](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2244) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2245](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2245) | Shadow policy | 예시·흐름 | 검증 fixture: T11: shadow 활성화가 실제 worker·context·cache head를 바꾸지 않는다. 구현: shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2246](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2246) | → predicted action | 예시·흐름 | 검증 fixture: T11: shadow 활성화가 실제 worker·context·cache head를 바꾸지 않는다. 구현: shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2247](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2247) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2248](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2248) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2249](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2249) | 결과를 비교한다. | 설명·요구 | shadow evaluator에 mutation/dispatch 권한을 주지 않고 동일 pinned signal snapshot을 입력한다. |
| [2250](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2250) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2251](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2251) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2252](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2252) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A70 — 장기 목표

원문 2253–2278행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a70)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2253](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2253) | # 70. 장기 목표 | 제목 | Observe→최소 activate→local reason→deterministic→필요 통합→낭비/누락 학습→구조 개선의 순환이다. |
| [2254](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2254) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2255](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2255) | 시스템의 최종 형태는 단순 멀티에이전트가 아니다. | 설명·요구 | outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2256](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2256) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2257](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2257) | 다음과 같은 adaptive computational organism에 가깝다. | 설명·요구 | outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2258](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2258) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2259](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2259) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2260](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2260) | Observe | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2261](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2261) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2262](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2262) | Activate minimally | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2263](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2263) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2264](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2264) | Reason locally | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2265](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2265) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2266](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2266) | Validate deterministically | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2267](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2267) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2268](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2268) | Integrate globally when needed | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2269](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2269) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2270](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2270) | Learn from wasted computation | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2271](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2271) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2272](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2272) | Learn from missed failures | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2273](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2273) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2274](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2274) | Improve activation structure | 예시·흐름 | 검증 fixture: T15: 한 episode의 검증된 학습이 다음 episode에만 versioned 방식으로 반영된다. 구현: outcome에서 실제 policy evaluation/promotion으로 이어지고 다음 동일 구조 event에서 달라진 판단을 관찰한다. |
| [2275](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2275) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2276](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2276) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2277](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2277) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2278](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2278) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A71 — 핵심 수학적 목표

원문 2279–2297행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a71)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2279](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2279) | # 71. 핵심 수학적 목표 | 제목 | Useful Cognitive Work/Computation Cost를 최적화한다. |
| [2280](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2280) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2281](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2281) | 에이전트 시스템이 최적화해야 할 것은 최대 intelligence가 아니다. | 설명·요구 | 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. |
| [2282](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2282) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2283](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2283) | 다음 비율이다. | 설명·요구 | 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. |
| [2284](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2284) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2285](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2285) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2286](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2286) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2287](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2287) | \eta | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2288](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2288) | = | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2289](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2289) | \frac{\text{Useful Cognitive Work}} | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2290](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2290) | {\text{Computation Cost}} | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2291](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2291) | } | 수식 본문 | 식 전체의 구현 계약: 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. 검증: T13: 품질을 떨어뜨린 후보는 efficiency가 높아 보여도 수용되지 않는다. |
| [2292](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2292) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2293](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2293) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2294](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2294) | 즉 cognitive efficiency다. | 설명·요구 | 유용성 evidence와 품질 하한을 먼저 고정하고 비용 denominator를 실제 execution ledger로 계산한다. |
| [2295](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2295) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2296](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2296) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2297](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2297) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A72 — 기존 멀티에이전트 시스템과 차이

원문 2298–2337행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a72)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2298](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2298) | # 72. 기존 멀티에이전트 시스템과 차이 | 제목 | 고정 Planner+A/B/C/D+Synthesis 대신 deterministic→signals→필요 역할→필요 통합 흐름이다. |
| [2299](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2299) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2300](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2300) | 일반 시스템: | 설명·요구 | manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2301](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2301) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2302](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2302) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2303](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2303) | Task | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2304](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2304) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2305](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2305) | Planner | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2306](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2306) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2307](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2307) | Agent A | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2308](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2308) | Agent B | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2309](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2309) | Agent C | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2310](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2310) | Agent D | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2311](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2311) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2312](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2312) | Synthesis | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2313](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2313) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2314](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2314) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2315](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2315) | 본 시스템: | 설명·요구 | manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2316](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2316) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2317](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2317) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2318](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2318) | Task | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2319](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2319) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2320](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2320) | Deterministic analysis | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2321](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2321) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2322](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2322) | Signals | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2323](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2323) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2324](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2324) | Sparse activation | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2325](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2325) |    ├─ A | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2326](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2326) |    └─ C | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2327](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2327) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2328](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2328) | Local execution | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2329](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2329) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2330](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2330) | Integration detector | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2331](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2331) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2332](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2332) | Only if needed: | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2333](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2333) |    B + QA | 예시·흐름 | 검증 fixture: T02,T15: 전 역할 fanout이 기본 실행 경로에 존재하지 않는다. 구현: manager dispatch 권한을 제거하고 role grants와 integration obligations로 실제 실행 순서를 통제한다. |
| [2334](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2334) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2335](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2335) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2336](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2336) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2337](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2337) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A73 — 가장 중요한 설계 철학

원문 2338–2361행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a73)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2338](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2338) | # 73. 가장 중요한 설계 철학 | 제목 | 필요한 사고인가→누가→깊이→무엇이 바뀌면 다시 하는가 순서를 결정한다. |
| [2339](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2339) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2340](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2340) | 기존 AI 시스템은 대부분 다음에 집중한다. | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2341](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2341) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2342](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2342) | &gt; 어떻게 더 많이 추론할 것인가? | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2343](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2343) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2344](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2344) | 본 시스템은 반대 질문에서 시작한다. | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2345](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2345) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2346](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2346) | &gt; 이 추론은 정말 필요한가? | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2347](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2347) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2348](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2348) | 그리고 필요한 경우에만 다음 질문으로 넘어간다. | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2349](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2349) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2350](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2350) | &gt; 어느 역할이 해야 하는가? | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2351](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2351) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2352](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2352) | 그리고 그다음: | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2353](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2353) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2354](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2354) | &gt; 어느 정도 깊이로 해야 하는가? | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2355](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2355) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2356](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2356) | 그리고 마지막: | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2357](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2357) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2358](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2358) | &gt; 무엇이 바뀌었을 때 다시 해야 하는가? | 설명·요구 | eligibility/activation/profile/dependency vector를 순차적 immutable decision으로 연결한다. |
| [2359](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2359) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2360](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2360) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2361](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2361) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A74 — 최종 원칙

원문 2362–2439행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a74)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2362](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2362) | # 74. 최종 원칙 | 제목 | 12개 최종 원칙은 각각 독립 수용 조건이며 앞선 상세 항목을 대체하는 요약이 아니다. |
| [2363](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2363) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2364](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2364) | 시스템 전체를 다음 열두 가지 원칙으로 요약할 수 있다. | 설명·요구 | 각 Principle을 대응 절과 테스트에 연결해 하나라도 실제 경로에서 빠지면 전체 완료를 거절한다. |
| [2365](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2365) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2366](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2366) | ## Principle 1 | 제목 | Principle 1: 휴면과 grant 없는 실행 금지. 상세 구현·검증은 A09를 적용한다. |
| [2367](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2367) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2368](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2368) | **Dormant by default** | 설명·요구 | Principle 1: 휴면과 grant 없는 실행 금지. 상세 구현·검증은 A09를 적용한다. |
| [2369](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2369) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2370](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2370) | 아무 에이전트도 이유 없이 실행되지 않는다. | 설명·요구 | Principle 1: 휴면과 grant 없는 실행 금지. 상세 구현·검증은 A09를 적용한다. |
| [2371](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2371) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2372](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2372) | ## Principle 2 | 제목 | Principle 2: 의미 변화 event만 계산 재평가. 상세 구현·검증은 A03.2를 적용한다. |
| [2373](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2373) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2374](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2374) | **Events trigger computation** | 설명·요구 | Principle 2: 의미 변화 event만 계산 재평가. 상세 구현·검증은 A03.2를 적용한다. |
| [2375](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2375) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2376](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2376) | 시간이 아니라 변화가 계산을 일으킨다. | 설명·요구 | Principle 2: 의미 변화 event만 계산 재평가. 상세 구현·검증은 A03.2를 적용한다. |
| [2377](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2377) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2378](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2378) | ## Principle 3 | 제목 | Principle 3: 역할별 국소 context. 상세 구현·검증은 A15를 적용한다. |
| [2379](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2379) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2380](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2380) | **Local context only** | 설명·요구 | Principle 3: 역할별 국소 context. 상세 구현·검증은 A15를 적용한다. |
| [2381](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2381) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2382](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2382) | 필요한 정보만 전달한다. | 설명·요구 | Principle 3: 역할별 국소 context. 상세 구현·검증은 A15를 적용한다. |
| [2383](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2383) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2384](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2384) | ## Principle 4 | 제목 | Principle 4: 결정론적 검증 우선. 상세 구현·검증은 A13를 적용한다. |
| [2385](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2385) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2386](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2386) | **Deterministic before probabilistic** | 설명·요구 | Principle 4: 결정론적 검증 우선. 상세 구현·검증은 A13를 적용한다. |
| [2387](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2387) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2388](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2388) | 검증 가능한 것은 코드로 검증한다. | 설명·요구 | Principle 4: 결정론적 검증 우선. 상세 구현·검증은 A13를 적용한다. |
| [2389](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2389) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2390](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2390) | ## Principle 5 | 제목 | Principle 5: 실제 profile을 갖는 L0–L5. 상세 구현·검증은 A14를 적용한다. |
| [2391](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2391) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2392](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2392) | **Adaptive reasoning depth** | 설명·요구 | Principle 5: 실제 profile을 갖는 L0–L5. 상세 구현·검증은 A14를 적용한다. |
| [2393](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2393) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2394](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2394) | 모든 문제를 같은 비용으로 풀지 않는다. | 설명·요구 | Principle 5: 실제 profile을 갖는 L0–L5. 상세 구현·검증은 A14를 적용한다. |
| [2395](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2395) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2396](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2396) | ## Principle 6 | 제목 | Principle 6: typed 교차 의존 그래프. 상세 구현·검증은 A05를 적용한다. |
| [2397](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2397) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2398](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2398) | **Graph-based dependency awareness** | 설명·요구 | Principle 6: typed 교차 의존 그래프. 상세 구현·검증은 A05를 적용한다. |
| [2399](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2399) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2400](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2400) | 태스크를 독립적인 목록으로 보지 않는다. | 설명·요구 | Principle 6: typed 교차 의존 그래프. 상세 구현·검증은 A05를 적용한다. |
| [2401](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2401) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2402](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2402) | ## Principle 7 | 제목 | Principle 7: 통합을 독립 검증 의무로 관리. 상세 구현·검증은 A19를 적용한다. |
| [2403](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2403) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2404](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2404) | **Integration is a first-class task** | 설명·요구 | Principle 7: 통합을 독립 검증 의무로 관리. 상세 구현·검증은 A19를 적용한다. |
| [2405](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2405) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2406](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2406) | 개별 성공과 통합 성공을 구분한다. | 설명·요구 | Principle 7: 통합을 독립 검증 의무로 관리. 상세 구현·검증은 A19를 적용한다. |
| [2407](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2407) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2408](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2408) | ## Principle 8 | 제목 | Principle 8: evidence-based escalation. 상세 구현·검증은 A38를 적용한다. |
| [2409](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2409) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2410](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2410) | **Evidence drives escalation** | 설명·요구 | Principle 8: evidence-based escalation. 상세 구현·검증은 A38를 적용한다. |
| [2411](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2411) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2412](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2412) | 추측이 아니라 증거가 추가 추론을 유발한다. | 설명·요구 | Principle 8: evidence-based escalation. 상세 구현·검증은 A38를 적용한다. |
| [2413](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2413) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2414](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2414) | ## Principle 9 | 제목 | Principle 9: 유효 dependency vector의 인지 재사용. 상세 구현·검증은 A32를 적용한다. |
| [2415](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2415) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2416](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2416) | **Reuse previous cognition** | 설명·요구 | Principle 9: 유효 dependency vector의 인지 재사용. 상세 구현·검증은 A32를 적용한다. |
| [2417](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2417) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2418](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2418) | 이미 계산한 것은 다시 계산하지 않는다. | 설명·요구 | Principle 9: 유효 dependency vector의 인지 재사용. 상세 구현·검증은 A32를 적용한다. |
| [2419](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2419) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2420](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2420) | ## Principle 10 | 제목 | Principle 10: 낭비 활성화의 근거 있는 학습. 상세 구현·검증은 A28를 적용한다. |
| [2421](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2421) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2422](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2422) | **Learn when not to think** | 설명·요구 | Principle 10: 낭비 활성화의 근거 있는 학습. 상세 구현·검증은 A28를 적용한다. |
| [2423](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2423) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2424](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2424) | 불필요한 activation도 실패다. | 설명·요구 | Principle 10: 낭비 활성화의 근거 있는 학습. 상세 구현·검증은 A28를 적용한다. |
| [2425](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2425) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2426](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2426) | ## Principle 11 | 제목 | Principle 11: 놓친 활성화와 나중 실패의 인과 학습. 상세 구현·검증은 A28를 적용한다. |
| [2427](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2427) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2428](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2428) | **Learn from missed reasoning** | 설명·요구 | Principle 11: 놓친 활성화와 나중 실패의 인과 학습. 상세 구현·검증은 A28를 적용한다. |
| [2429](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2429) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2430](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2430) | 필요했는데 호출하지 않은 것도 실패다. | 설명·요구 | Principle 11: 놓친 활성화와 나중 실패의 인과 학습. 상세 구현·검증은 A28를 적용한다. |
| [2431](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2431) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2432](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2432) | ## Principle 12 | 제목 | Principle 12: 사례 이름이 아닌 구조 규칙 학습. 상세 구현·검증은 A30를 적용한다. |
| [2433](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2433) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2434](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2434) | **Fix structures, not cases** | 설명·요구 | Principle 12: 사례 이름이 아닌 구조 규칙 학습. 상세 구현·검증은 A30를 적용한다. |
| [2435](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2435) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2436](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2436) | 개별 케이스를 때우지 않고 원인을 구조화한다. | 설명·요구 | Principle 12: 사례 이름이 아닌 구조 규칙 학습. 상세 구현·검증은 A30를 적용한다. |
| [2437](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2437) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2438](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2438) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2439](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2439) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## A75 — 최종 시스템 정의

원문 2440–2479행 · [구현 해석·변경·수용 조건](source-implementation-map.md#a75)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2440](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2440) | # 75. 최종 시스템 정의 | 제목 | 최종 곱의 sparse activation/local context/adaptive reasoning/deterministic validation/graph integration/policy learning은 모두 필수다. |
| [2441](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2441) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2442](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2442) | 본 아키텍처를 한 문장으로 정의하면 다음과 같다. | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
| [2443](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2443) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2444](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2444) | &gt; **상태 변화와 위험 신호를 기반으로 필요한 에이전트만 선택적으로 활성화하고, 필요한 최소 컨텍스트와 적절한 추론 깊이만 사용하며, 결정론적 검증과 그래프 기반 통합 검증을 통해 결과를 평가하고, 성공과 실패의 기록으로부터 “언제 어떤 사고를 수행해야 하는지” 자체를 지속적으로 개선하는 자기개선형 에이전트 시스템.** | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
| [2445](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2445) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2446](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2446) | 이를 수학적으로 축약하면 다음과 같다. | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
| [2447](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2447) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2448](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2448) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2449](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2449) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2450](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2450) | Agent\ Intelligence | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2451](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2451) | = | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2452](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2452) | SparseActivation | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2453](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2453) | \times | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2454](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2454) | LocalContext | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2455](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2455) | \times | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2456](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2456) | AdaptiveReasoning | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2457](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2457) | \times | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2458](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2458) | DeterministicValidation | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2459](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2459) | \times | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2460](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2460) | GraphIntegration | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2461](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2461) | \times | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2462](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2462) | PolicyLearning | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2463](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2463) | } | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2464](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2464) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2465](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2465) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2466](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2466) | 그리고 시스템의 궁극적인 최적화 목표는 다음이다. | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
| [2467](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2467) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2468](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2468) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2469](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2469) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2470](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2470) | \max | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2471](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2471) | \frac | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2472](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2472) | {\text{Correct and Useful Decisions}} | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2473](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2473) | {\text{Reasoning Cost + Context Cost + Coordination Cost}} | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2474](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2474) | } | 수식 본문 | 식 전체의 구현 계약: 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. 검증: T14,T15: 하나라도 advisory-only 또는 미연결이면 미완성이다. |
| [2475](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2475) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2476](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2476) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2477](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2477) | 즉 이 시스템에서 최고의 에이전트는 가장 많이 생각하는 에이전트가 아니다. | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
| [2478](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2478) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2479](/Users/seominyong/Downloads/source/task-a/docs/design/energy-efficient-graph-agent.md:2479) | **정확히 필요한 순간에, 필요한 만큼만 생각하는 에이전트 시스템이 가장 효율적인 시스템이다.** | 설명·요구 | 각 기능을 실제 native/Pod 경로에서 강제하고 correctness/useful decisions 대비 전체 비용을 평가한다. |
