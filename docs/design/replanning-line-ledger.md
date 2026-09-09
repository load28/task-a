# 원문 B의 전체 줄별 구현 대응

원문 2,518논리행을 원래 순서로 모두 기록한다. 실제 기능 해석은 [절별 대응](source-implementation-map.md)과 [구현 본문](implementation-spec.md)을 함께 따른다. 수식/예시는 여러 행이 하나의 의미를 이루므로 소속 요구의 계약을 공유한다. 필드·열거값에는 별도 구체 계약을 부여한다. 빈 줄·구분선은 기능으로 계산하지 않는다.

상태: 구현할 요구의 추적표이며 코드 구현 완료 표가 아니다.

## B00 — 제목·초록

원문 1–47행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b00)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1) | # Adaptive Task Replanning | 제목 | 요구·계획·결과·구현·환경·의존·실패·통합 변화에 인과적으로 연결된 부분만 재계획한다. |
| [2](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [3](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:3) | ## 인간의 계층적 인지와 예측오차를 이용한 국소 재계획 아키텍처 | 제목 | 요구·계획·결과·구현·환경·의존·실패·통합 변화에 인과적으로 연결된 부분만 재계획한다. |
| [4](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:4) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [5](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:5) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [6](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:6) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [7](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:7) | # 초록 | 제목 | 요구·계획·결과·구현·환경·의존·실패·통합 변화에 인과적으로 연결된 부분만 재계획한다. |
| [8](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:8) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [9](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:9) | 복잡한 에이전트 시스템에서 태스크를 계층적으로 분할하는 것만으로는 충분하지 않다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [10](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:10) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [11](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:11) | 현실의 작업에서는 지속적으로 다음과 같은 변화가 발생한다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [12](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:12) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [13](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:13) | - 요구사항 변경 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [14](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:14) | - 계획 수정 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [15](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:15) | - 하위 태스크의 예상치 못한 결과 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [16](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:16) | - 구현 방식 변경 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [17](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:17) | - 외부 환경 변화 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [18](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:18) | - 의존성 변경 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [19](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:19) | - 실패에 따른 우회 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [20](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:20) | - 여러 하위 태스크 통합 과정에서 발견되는 새로운 문제 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [21](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:21) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [22](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:22) | 단순한 태스크 시스템은 이러한 변화가 발생할 때 두 극단 중 하나에 빠지기 쉽다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [23](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:23) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [24](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:24) | 첫 번째는 변경된 태스크만 수정하고 나머지는 그대로 두는 것이다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [25](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:25) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [26](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:26) | 이는 변화가 다른 태스크에 미치는 영향을 놓친다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [27](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:27) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [28](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:28) | 두 번째는 전체 계획을 다시 생성하는 것이다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [29](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:29) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [30](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:30) | 이는 정확성은 높일 수 있지만 계산 비용이 크고 이미 유효한 계획까지 파괴한다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [31](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:31) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [32](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:32) | 인간은 일반적으로 두 방식 모두를 사용하지 않는다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [33](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:33) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [34](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:34) | 사람은 복잡한 행동을 목표 → 하위 목표 → 행동으로 계층화하고, 상황이 예상과 달라졌을 때 현재 상황과 내부 모델 사이의 불일치를 감지하여 관련된 행동 계획을 수정한다. 인간 행동이 태스크와 하위 태스크로 계층화될 수 있다는 것은 인지과학과 계층적 강화학습 연구에서 오랫동안 연구되어 왔으며, 최근 인간의 model-based hierarchical behavior에서도 순차적인 subgoal representation이 관찰되고 있다. citeturn628734search2turn628734search13 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [35](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:35) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [36](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:36) | 또한 Event Segmentation Theory 계열의 연구에서는 진행 중인 사건에 대한 예측이 실제 관찰과 어긋나 prediction error가 증가하면 현재 event model을 갱신하는 메커니즘을 제안한다. 인간은 모든 순간 자신의 내부 모델을 다시 구성하는 것이 아니라 의미 있는 변화가 발생할 때 representation을 갱신하는 것으로 설명된다. citeturn628734search0turn628734search6 | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [37](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:37) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [38](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:38) | 본 설계는 이 두 특성을 에이전트의 태스크 관리 구조로 변환한다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [39](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:39) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [40](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:40) | 핵심은 다음이다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [41](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:41) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [42](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:42) | &gt; **전체 계획을 다시 세우지 않는다. 변경이 발생한 지점에서 예측오차를 계산하고, 그 변화가 의미론적으로 도달할 수 있는 태스크만 무효화하여 국소적으로 재계획한다.** | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [43](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:43) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [44](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:44) | 이를 **Local Causal Replanning**이라 정의한다. | 설명·요구 | 모든 변화 source를 event로 모델링하고 prediction→closure→boundary→scoped replan을 control plane에서 결정한다. |
| [45](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:45) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [46](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:46) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [47](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:47) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B01 — 문제

원문 48–129행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b01)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [48](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:48) | # 1. 문제 | 제목 | A1 변경은 필요한 A2와 A의 통합만 검토하고 무관 B/C는 유지한다. |
| [49](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:49) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [50](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:50) | 다음과 같은 계획이 있다고 하자. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [51](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:51) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [52](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:52) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [53](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:53) | 목표 G | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [54](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:54) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [55](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:55) | ├─ A | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [56](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:56) | │  ├─ A1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [57](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:57) | │  └─ A2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [58](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:58) | │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [59](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:59) | ├─ B | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [60](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:60) | │  ├─ B1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [61](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:61) | │  └─ B2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [62](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:62) | │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [63](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:63) | └─ C | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [64](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:64) |    ├─ C1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [65](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:65) |    └─ C2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [66](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:66) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [67](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:67) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [68](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:68) | A1의 구현 방식이 바뀌었다고 하자. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [69](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:69) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [70](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:70) | 가장 단순한 방법은 전체 계획을 다시 생성하는 것이다. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [71](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:71) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [72](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:72) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [73](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:73) | A1 변경 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [74](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:74) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [75](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:75) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [76](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:76) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [77](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:77) | G부터 다시 계획 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [78](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:78) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [79](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:79) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [80](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:80) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [81](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:81) | A | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [82](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:82) | B | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [83](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:83) | C | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [84](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:84) | A1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [85](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:85) | A2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [86](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:86) | B1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [87](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:87) | B2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [88](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:88) | C1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [89](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:89) | C2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [90](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:90) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [91](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:91) | 모두 재검토 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [92](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:92) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [93](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:93) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [94](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:94) | 하지만 실제로 A1이 B와 C에 아무 영향을 주지 않는다면 대부분의 계산은 낭비다. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [95](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:95) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [96](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:96) | 반대로 | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [97](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:97) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [98](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:98) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [99](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:99) | A1만 수정 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [100](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:100) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [101](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:101) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [102](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:102) | 하면 A2가 A1의 결과를 사용하는 경우 문제를 놓친다. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [103](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:103) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [104](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:104) | 따라서 우리가 원하는 것은 다음과 같다. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [105](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:105) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [106](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:106) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [107](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:107) | A1 변경 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [108](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:108) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [109](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:109) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [110](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:110) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [111](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:111) | 영향 범위 계산 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [112](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:112) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [113](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:113) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [114](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:114) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [115](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:115) | A1 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [116](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:116) | A2 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [117](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:117) | A의 통합 상태 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [118](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:118) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [119](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:119) | 만 재검토 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [120](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:120) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [121](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:121) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [122](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:122) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [123](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:123) | B와 C는 유지 | 예시·흐름 | 검증 fixture: T15: B/C의 task/spec/decision/run이 그대로이고 A2와 통합 의무만 생긴다. 구현: A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [124](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:124) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [125](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:125) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [126](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:126) | 이것을 수학적으로 정의할 수 있다. | 설명·요구 | A1→A2 typed dependency와 A boundary 통합을 fixture로 모델링하고 preserved 외부 arc를 절단한다. |
| [127](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:127) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [128](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:128) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [129](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:129) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B02 — 인간에게서 가져올 첫 번째 원리: 계층적 행동

원문 130–179행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b02)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [130](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:130) | # 2. 인간에게서 가져올 첫 번째 원리: 계층적 행동 | 제목 | Goal→Subgoal→Task→Action 계층과 하위 routine 재사용을 지원한다. |
| [131](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:131) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [132](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:132) | 인간의 행동은 평평한 action list로만 표현되지 않는다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [133](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:133) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [134](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:134) | 예를 들어 | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [135](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:135) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [136](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:136) | &gt; 저녁 식사를 만든다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [137](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:137) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [138](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:138) | 라는 목표는 자연스럽게 | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [139](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:139) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [140](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:140) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [141](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:141) | 저녁 식사 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [142](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:142) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [143](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:143) | ├─ 재료 준비 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [144](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:144) | │  ├─ 채소 세척 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [145](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:145) | │  ├─ 채소 절단 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [146](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:146) | │  └─ 고기 준비 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [147](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:147) | │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [148](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:148) | ├─ 조리 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [149](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:149) | │  ├─ 팬 가열 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [150](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:150) | │  ├─ 고기 조리 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [151](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:151) | │  └─ 채소 조리 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [152](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:152) | │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [153](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:153) | └─ 접시에 담기 | 예시·흐름 | 검증 fixture: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. 구현: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [154](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:154) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [155](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:155) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [156](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:156) | 처럼 분해된다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [157](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:157) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [158](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:158) | 계층적 강화학습 관점에서도 인간과 동물의 행동을 task → subtask → primitive action으로 조직되는 구조로 보는 접근이 연구되어 왔다. 이러한 구조의 장점 중 하나는 이미 만들어진 하위 행동 routine을 다른 문제에서도 재사용할 수 있다는 것이다. citeturn628734search1turn628734search3 | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [159](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:159) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [160](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:160) | 따라서 에이전트 시스템에서도 | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [161](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:161) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [162](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:162) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [163](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:163) | Goal | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [164](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:164) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [165](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:165) | Subgoal | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [166](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:166) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [167](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:167) | Task | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [168](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:168) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [169](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:169) | Action | 수식 본문 | 식 전체의 구현 계약: plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. 검증: T12: 다른 상위 목표에서 동일한 유효 routine을 재사용할 수 있다. |
| [170](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:170) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [171](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:171) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [172](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:172) | 구조를 기본값으로 삼는다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [173](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:173) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [174](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:174) | 그러나 이것만으로는 계획 변경 문제를 해결하지 못한다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [175](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:175) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [176](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:176) | 두 번째 원리가 필요하다. | 설명·요구 | plan level과 action/task boundary를 명시하고 routine version에 내부 계보·외부 ports를 보존한다. |
| [177](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:177) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [178](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:178) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [179](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:179) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B03 — 인간에게서 가져올 두 번째 원리: Prediction Error

원문 180–247행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b03)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [180](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:180) | # 3. 인간에게서 가져올 두 번째 원리: Prediction Error | 제목 | Mt의 예상 다음 상태와 실제 상태 사이 거리 epsilon이 모델 갱신 근거다. |
| [181](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:181) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [182](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:182) | 인간은 외부 세계에 대해 일종의 현재 모델을 유지한다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [183](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:183) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [184](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:184) | 이를 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [185](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:185) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [186](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:186) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [187](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:187) | M_t | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [188](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:188) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [189](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:189) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [190](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:190) | 라고 하자. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [191](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:191) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [192](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:192) | 현재 모델로부터 다음 상태를 예측한다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [193](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:193) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [194](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:194) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [195](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:195) | \hat{s}_{t+1}=F(M_t,s_t) | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [196](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:196) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [197](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:197) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [198](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:198) | 실제 결과는 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [199](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:199) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [200](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:200) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [201](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:201) | s_{t+1} | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [202](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:202) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [203](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:203) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [204](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:204) | 이다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [205](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:205) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [206](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:206) | 그러면 prediction error는 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [207](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:207) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [208](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:208) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [209](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:209) | \epsilon_t | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [210](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:210) | = | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [211](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:211) | d(s_{t+1},\hat{s}_{t+1}) | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [212](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:212) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [213](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:213) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [214](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:214) | 로 정의할 수 있다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [215](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:215) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [216](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:216) | \(d\)는 두 상태의 차이를 나타내는 함수다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [217](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:217) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [218](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:218) | 예측오차가 작다면 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [219](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:219) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [220](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:220) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [221](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:221) | \epsilon_t &lt; \theta | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [222](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:222) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [223](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:223) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [224](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:224) | 현재 모델을 유지한다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [225](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:225) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [226](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:226) | 하지만 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [227](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:227) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [228](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:228) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [229](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:229) | \epsilon_t \ge \theta | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [230](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:230) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [231](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:231) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [232](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:232) | 이면 현재 모델이 현실을 충분히 설명하지 못하고 있다는 뜻이다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [233](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:233) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [234](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:234) | 따라서 모델을 갱신한다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [235](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:235) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [236](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:236) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [237](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:237) | M_{t+1} | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [238](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:238) | = | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [239](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:239) | Update(M_t,s_{t+1}) | 수식 본문 | 식 전체의 구현 계약: Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 검증: T07: 기대치와 관찰이 같으면 계획을 다시 만들지 않고 불일치 근거를 기록한다. |
| [240](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:240) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [241](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:241) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [242](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:242) | Event Segmentation Theory는 이러한 prediction error 증가가 현재 event model을 갱신하는 신호가 될 수 있다고 설명한다. 최근 연구에서도 prediction error와 event segmentation의 관계가 기억 및 작업기억 관점에서 계속 연구되고 있다. citeturn628734search0turn628734search5 | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [243](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:243) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [244](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:244) | 에이전트에 적용하면 이것은 매우 강력하다. | 설명·요구 | Expectation/Observation/PredictionError를 versioned 저장하고 low error preserve와 significant error update를 분리한다. |
| [245](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:245) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [246](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:246) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [247](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:247) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B04 — Task Prediction

원문 248–289행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b04)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [248](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:248) | # 4. Task Prediction | 제목 | expectedArtifacts/interface/behavior/dependencies/risk를 실행 전에 정의하고 ActualOutcome과 비교한다. |
| [249](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:249) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [250](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:250) | 각 태스크는 결과만 갖는 것이 아니라 **예상 결과**를 가진다. | 설명·요구 | 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. |
| [251](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:251) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [252](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:252) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [253](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:253) | interface TaskExpectation { | 타입 선언 | TaskExpectation의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [254](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:254) |   expectedArtifacts: ArtifactExpectation[]; | 데이터 필드 | 종류/port/schema/수량/조건을 실행 전에 pin하고 실제 output receipt와 비교한다. |
| [255](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:255) |   expectedInterface: Contract; | 데이터 필드 | required contract version과 observable 제약이다. 단순 타입 이름으로 축약하지 않는다. |
| [256](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:256) |   expectedBehavior: BehaviorConstraint[]; | 데이터 필드 | 검증 가능한 행동 제약·시나리오와 validator를 저장한다. |
| [257](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:257) |   expectedDependencies: DependencyExpectation[]; | 데이터 필드 | 실제 input ports·가정·환경·tool/f 버전의 예상 binding이다. |
| [258](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:258) |   expectedRisk: number; | 데이터 필드 | 실행 전 위험 예상값이다. 관찰 risk residual은 SPE의 C/B/D/G와 별도로 저장한다. |
| [259](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:259) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [260](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:260) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [261](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:261) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [262](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:262) | 태스크 실행 전: | 설명·요구 | 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. |
| [263](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:263) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [264](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:264) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [265](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:265) | \hat{O}_T | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [266](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:266) | = | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [267](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:267) | ExpectedOutcome(T) | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [268](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:268) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [269](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:269) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [270](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:270) | 태스크 실행 후: | 설명·요구 | 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. |
| [271](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:271) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [272](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:272) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [273](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:273) | O_T | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [274](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:274) | = | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [275](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:275) | ActualOutcome(T) | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [276](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:276) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [277](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:277) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [278](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:278) | 두 값의 차이를 계산한다. | 설명·요구 | 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. |
| [279](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:279) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [280](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:280) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [281](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:281) | PE(T) | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [282](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:282) | = | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [283](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:283) | D(O_T,\hat{O}_T) | 수식 본문 | 식 전체의 구현 계약: 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. 검증: T07: 다섯 expected field 각각의 불일치·unknown과 사후 기대치 변조를 검사한다. |
| [284](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:284) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [285](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:285) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [286](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:286) | 이를 **Task Prediction Error**라고 정의한다. | 설명·요구 | 각 expectation field에 schema/validator/input binding을 두고 실행 전에 immutable pin한다. |
| [287](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:287) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [288](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:288) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [289](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:289) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B05 — 단순 변경과 의미론적 변경의 구분

원문 290–336행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b05)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [290](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:290) | # 5. 단순 변경과 의미론적 변경의 구분 | 제목 | 줄 수 변화가 아니라 contract/behavior/dependency/goal-assumption의 가중 의미 오차를 계산한다. |
| [291](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:291) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [292](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:292) | 모든 변경이 재계획을 요구하지 않는다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [293](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:293) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [294](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:294) | 예를 들어 | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [295](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:295) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [296](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:296) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [297](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:297) | 변수 이름 변경 | 예시·흐름 | 검증 fixture: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. 구현: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [298](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:298) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [299](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:299) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [300](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:300) | 은 실제 계획에는 영향을 주지 않을 수 있다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [301](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:301) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [302](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:302) | 반면 | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [303](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:303) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [304](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:304) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [305](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:305) | 함수 반환 타입 변경 | 예시·흐름 | 검증 fixture: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. 구현: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [306](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:306) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [307](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:307) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [308](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:308) | 은 downstream task에 영향을 준다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [309](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:309) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [310](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:310) | 따라서 change magnitude만 봐서는 안 된다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [311](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:311) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [312](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:312) | Semantic Prediction Error를 계산한다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [313](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:313) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [314](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:314) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [315](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:315) | SPE(T) | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [316](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:316) | = | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [317](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:317) | w_cC | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [318](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:318) | + | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [319](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:319) | w_bB | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [320](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:320) | + | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [321](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:321) | w_dD | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [322](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:322) | + | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [323](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:323) | w_gG | 수식 본문 | 식 전체의 구현 계약: C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. 검증: T07: 큰 문서 포맷 변화보다 작은 required return type 변화가 강한 의무를 만들 수 있다. |
| [324](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:324) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [325](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:325) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [326](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:326) | 여기서 | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [327](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:327) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [328](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:328) | - \(C\): contract change | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [329](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:329) | - \(B\): behavioral change | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [330](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:330) | - \(D\): dependency change | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [331](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:331) | - \(G\): goal/assumption change | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [332](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:332) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [333](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:333) | 이다. | 설명·요구 | C/B/D/G 거리·가중치·근거·정규화를 정의하고 rename과 return type change를 다른 scope로 분류한다. |
| [334](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:334) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [335](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:335) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [336](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:336) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B06 — Replanning Threshold

원문 337–361행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b06)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [337](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:337) | # 6. Replanning Threshold | 제목 | SPE threshold에 따라 preserve/영향 계산/상위 검토를 구분한다. |
| [338](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:338) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [339](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:339) | 다음 조건에서만 재계획한다. | 설명·요구 | boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [340](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:340) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [341](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:341) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [342](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:342) | SPE(T)&gt;\theta_T | 수식 본문 | 식 전체의 구현 계약: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. 검증: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. |
| [343](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:343) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [344](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:344) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [345](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:345) | 즉 | 설명·요구 | boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [346](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:346) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [347](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:347) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [348](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:348) | 작은 변화 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [349](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:349) | → 기존 계획 유지 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [350](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:350) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [351](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:351) | 의미 있는 변화 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [352](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:352) | → 영향 범위 계산 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [353](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:353) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [354](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:354) | 큰 구조적 변화 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [355](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:355) | → 상위 계획까지 재검토 | 예시·흐름 | 검증 fixture: T07: threshold 이하라도 critical violation은 반드시 처리되고 equality 규칙이 결정적이다. 구현: boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [356](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:356) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [357](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:357) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [358](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:358) | 한다. | 설명·요구 | boundary별 threshold/hysteresis와 hard override를 policy version에 저장한다. |
| [359](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:359) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [360](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:360) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [361](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:361) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B07 — Task Graph

원문 362–397행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b07)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [362](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:362) | # 7. Task Graph | 제목 | u→v는 v의 올바른 결과가 u에 의존한다는 방향이다. |
| [363](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:363) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [364](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:364) | 태스크 시스템을 그래프로 정의한다. | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [365](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:365) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [366](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:366) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [367](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:367) | G=(V,E) | 수식 본문 | 식 전체의 구현 계약: 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. 검증: T05: A1 변경이 A2/A3로 가고 역방향 A1의 predecessor를 불필요하게 무효화하지 않는다. |
| [368](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:368) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [369](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:369) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [370](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:370) | 각 node \(v\in V\)는 하나의 태스크다. | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [371](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:371) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [372](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:372) | edge | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [373](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:373) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [374](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:374) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [375](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:375) | u\rightarrow v | 수식 본문 | 식 전체의 구현 계약: 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. 검증: T05: A1 변경이 A2/A3로 가고 역방향 A1의 predecessor를 불필요하게 무효화하지 않는다. |
| [376](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:376) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [377](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:377) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [378](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:378) | 는 | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [379](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:379) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [380](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:380) | &gt; v의 올바른 실행 결과가 u에 의존한다. | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [381](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:381) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [382](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:382) | 는 의미로 정의하자. | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [383](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:383) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [384](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:384) | 예: | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [385](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:385) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [386](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:386) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [387](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:387) | A1 ──────→ A2 ──────→ A3 | 예시·흐름 | 검증 fixture: T05: A1 변경이 A2/A3로 가고 역방향 A1의 predecessor를 불필요하게 무효화하지 않는다. 구현: 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [388](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:388) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [389](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:389) | B1 ──────→ B2 | 예시·흐름 | 검증 fixture: T05: A1 변경이 A2/A3로 가고 역방향 A1의 predecessor를 불필요하게 무효화하지 않는다. 구현: 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [390](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:390) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [391](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:391) | C1 ──────→ C2 | 예시·흐름 | 검증 fixture: T05: A1 변경이 A2/A3로 가고 역방향 A1의 predecessor를 불필요하게 무효화하지 않는다. 구현: 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [392](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:392) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [393](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:393) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [394](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:394) | A1이 변경되면 영향을 받을 가능성이 있는 node는 A1에서 dependency edge를 따라 도달할 수 있는 node다. | 설명·요구 | 저장 source producer→target consumer로 정규화하고 API 변환을 한 곳에 둔다. |
| [395](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:395) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [396](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:396) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [397](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:397) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B08 — Affected Closure

원문 398–418행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b08)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [398](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:398) | # 8. Affected Closure | 제목 | Affected Closure는 source 자신과 source에서 도달 가능한 모든 node다. |
| [399](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:399) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [400](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:400) | 변경된 node를 \(x\)라고 하자. | 설명·요구 | source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. |
| [401](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:401) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [402](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:402) | 영향 집합을 | 설명·요구 | source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. |
| [403](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:403) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [404](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:404) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [405](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:405) | A(x) | 수식 본문 | 식 전체의 구현 계약: source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. 검증: T05: source 포함·독립 component 제외·다중 경로 중복 제거를 oracle과 대조한다. |
| [406](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:406) | = | 수식 본문 | 식 전체의 구현 계약: source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. 검증: T05: source 포함·독립 component 제외·다중 경로 중복 제거를 oracle과 대조한다. |
| [407](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:407) | \{v\in V\mid x\leadsto v\} | 수식 본문 | 식 전체의 구현 계약: source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. 검증: T05: source 포함·독립 component 제외·다중 경로 중복 제거를 oracle과 대조한다. |
| [408](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:408) | \cup\{x\} | 수식 본문 | 식 전체의 구현 계약: source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. 검증: T05: source 포함·독립 component 제외·다중 경로 중복 제거를 oracle과 대조한다. |
| [409](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:409) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [410](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:410) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [411](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:411) | 라고 정의한다. | 설명·요구 | source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. |
| [412](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:412) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [413](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:413) | 즉 \(x\)로부터 dependency path가 존재하는 모든 node다. | 설명·요구 | source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. |
| [414](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:414) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [415](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:415) | 이를 **Affected Closure**라고 부른다. | 설명·요구 | source 집합을 포함한 reachability 결과와 visited edges를 graphVersion에 고정한다. |
| [416](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:416) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [417](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:417) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [418](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:418) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B09 — 가장 중요한 정리

원문 419–465행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b09)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [419](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:419) | # 9. 가장 중요한 정리 | 제목 | Local Replanning Theorem은 자신의 입력과 직접 predecessor만으로 결과가 정해진다는 전제에서 성립한다. |
| [420](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:420) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [421](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:421) | ## Local Replanning Theorem | 제목 | Local Replanning Theorem은 자신의 입력과 직접 predecessor만으로 결과가 정해진다는 전제에서 성립한다. |
| [422](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:422) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [423](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:423) | 다음 조건을 만족한다고 하자. | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [424](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:424) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [425](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:425) | 각 태스크 \(v\)의 결과는 자신의 입력과 직접적인 predecessor의 결과에만 의존한다. | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [426](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:426) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [427](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:427) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [428](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:428) | O_v | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [429](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:429) | = | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [430](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:430) | f_v( | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [431](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:431) | I_v, | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [432](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:432) | O_{p_1}, | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [433](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:433) | O_{p_2}, | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [434](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:434) | \dots, | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [435](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:435) | O_{p_k} | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [436](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:436) | ) | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [437](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:437) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [438](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:438) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [439](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:439) | 어떤 태스크 \(x\)의 결과가 | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [440](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:440) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [441](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:441) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [442](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:442) | O_x | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [443](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:443) | \rightarrow O'_x | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [444](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:444) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [445](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:445) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [446](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:446) | 로 변경되었다고 하자. | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [447](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:447) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [448](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:448) | 그러면 | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [449](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:449) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [450](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:450) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [451](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:451) | v\notin A(x) | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [452](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:452) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [453](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:453) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [454](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:454) | 인 모든 태스크에 대해 | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [455](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:455) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [456](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:456) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [457](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:457) | O'_v=O_v | 수식 본문 | 식 전체의 구현 계약: declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. 검증: T05: 숨은 외부 입력이나 f 변경이 있는 반례는 안전 보존 판정을 받지 못한다. |
| [458](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:458) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [459](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:459) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [460](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:460) | 이다. | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [461](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:461) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [462](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:462) | 즉 **변경 node에서 도달할 수 없는 태스크는 다시 계산할 필요가 없다.** | 설명·요구 | declared+observed read manifest와 tool/model/policy/environment version을 입력으로 등록하고 unknown 전제에서는 locality proof를 발급하지 않는다. |
| [463](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:463) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [464](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:464) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [465](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:465) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B10 — 증명

원문 466–532행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b10)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [466](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:466) | # 10. 증명 | 제목 | 도달 불가능한 node의 predecessor와 own input이 동일하면 결과가 유지된다는 증명 단계가 필요하다. |
| [467](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:467) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [468](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:468) | \(v\notin A(x)\)라고 하자. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [469](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:469) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [470](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:470) | 이는 | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [471](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:471) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [472](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:472) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [473](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:473) | x\not\leadsto v | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [474](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:474) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [475](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:475) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [476](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:476) | 라는 뜻이다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [477](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:477) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [478](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:478) | 따라서 \(v\)의 어떤 predecessor chain에도 \(x\)가 존재하지 않는다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [479](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:479) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [480](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:480) | \(v\)의 결과는 | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [481](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:481) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [482](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:482) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [483](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:483) | O_v | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [484](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:484) | = | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [485](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:485) | f_v(I_v,O_{p_1},\dots,O_{p_k}) | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [486](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:486) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [487](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:487) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [488](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:488) | 로 결정된다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [489](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:489) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [490](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:490) | \(x\)에서 \(v\)로 가는 dependency path가 존재하지 않으므로 \(x\)의 변경은 \(p_1,\dots,p_k\) 중 어느 값에도 영향을 줄 수 없다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [491](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:491) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [492](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:492) | 따라서 | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [493](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:493) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [494](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:494) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [495](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:495) | O'_{p_i}=O_{p_i} | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [496](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:496) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [497](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:497) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [498](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:498) | 이며 입력 \(I_v\)도 변하지 않았다면 | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [499](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:499) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [500](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:500) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [501](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:501) | O'_v | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [502](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:502) | = | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [503](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:503) | f_v(I_v,O'_{p_1},\dots,O'_{p_k}) | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [504](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:504) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [505](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:505) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [506](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:506) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [507](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:507) | = | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [508](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:508) | f_v(I_v,O_{p_1},\dots,O_{p_k}) | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [509](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:509) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [510](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:510) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [511](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:511) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [512](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:512) | =O_v | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [513](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:513) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [514](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:514) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [515](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:515) | 이다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [516](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:516) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [517](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:517) | 따라서 | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [518](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:518) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [519](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:519) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [520](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:520) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [521](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:521) | v\notin A(x) | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [522](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:522) | \Rightarrow | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [523](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:523) | O'_v=O_v | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [524](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:524) | } | 수식 본문 | 식 전체의 구현 계약: DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. 검증: T05: 생성 DAG의 full evaluation과 local evaluation이 동일하고 전제 위반 시 proof가 거절된다. |
| [525](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:525) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [526](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:526) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [527](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:527) | 가 성립한다. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [528](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:528) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [529](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:529) | 증명 끝. | 설명·요구 | DAG topological induction의 입력 불변·f 불변·완전성 조건을 PreservationReason에 저장한다. cycle은 SCC 계약이 필요하다. |
| [530](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:530) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [531](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:531) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [532](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:532) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B11 — 이 정리가 의미하는 것

원문 533–578행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b11)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [533](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:533) | # 11. 이 정리가 의미하는 것 | 제목 | Clocal은 affected subset 합계라 Cfull 이하이나 작은 closure에서만 큰 절감이 기대된다. |
| [534](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:534) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [535](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:535) | 전체 node가 \(N\)개라고 하자. | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [536](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:536) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [537](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:537) | 전체 재계획 비용은 | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [538](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:538) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [539](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:539) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [540](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:540) | C_{full} | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [541](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:541) | = | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [542](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:542) | \sum_{v\in V}C(v) | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [543](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:543) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [544](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:544) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [545](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:545) | 이다. | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [546](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:546) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [547](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:547) | 하지만 Local Replanning에서는 | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [548](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:548) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [549](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:549) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [550](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:550) | C_{local} | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [551](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:551) | = | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [552](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:552) | \sum_{v\in A(x)}C(v) | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [553](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:553) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [554](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:554) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [555](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:555) | 만 필요하다. | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [556](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:556) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [557](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:557) | 따라서 | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [558](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:558) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [559](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:559) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [560](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:560) | C_{local}\le C_{full} | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [561](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:561) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [562](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:562) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [563](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:563) | 이며 | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [564](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:564) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [565](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:565) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [566](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:566) | &#124;A(x)&#124;\ll &#124;V&#124; | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [567](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:567) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [568](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:568) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [569](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:569) | 인 일반적인 국소 변경에서는 | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [570](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:570) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [571](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:571) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [572](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:572) | C_{local}\ll C_{full} | 수식 본문 | 식 전체의 구현 계약: 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. 검증: T13: 국소/전역 변경 각각의 비용을 보고하며 절감률을 사전 고정하지 않는다. |
| [573](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:573) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [574](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:574) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [575](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:575) | 가 된다. | 설명·요구 | 같은 workload에서 graph walk·검증·재계획·모델 비용을 모두 비교하고 전역 영향 변경도 포함한다. |
| [576](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:576) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [577](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:577) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [578](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:578) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B12 — Sparse Replanning

원문 579–609행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b12)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [579](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:579) | # 12. Sparse Replanning | 제목 | task별 zv=1은 영향 집합만 실행한다는 task sparsity다. |
| [580](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:580) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [581](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:581) | 이를 앞 문서의 Sparse Activation 개념과 결합할 수 있다. | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [582](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:582) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [583](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:583) | 각 태스크에 | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [584](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:584) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [585](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:585) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [586](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:586) | z_v= | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [587](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:587) | \begin{cases} | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [588](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:588) | 1 &amp; v\in A(x)\\ | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [589](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:589) | 0 &amp; v\notin A(x) | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [590](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:590) | \end{cases} | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [591](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:591) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [592](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:592) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [593](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:593) | 를 정의한다. | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [594](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:594) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [595](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:595) | 그러면 변경 후 계산 비용은 | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [596](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:596) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [597](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:597) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [598](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:598) | C | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [599](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:599) | = | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [600](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:600) | \sum_{v\in V} | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [601](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:601) | z_vC(v) | 수식 본문 | 식 전체의 구현 계약: causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. 검증: T02: 역할 정책이 높게 평가해도 비영향 task는 임의 재실행되지 않는다. |
| [602](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:602) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [603](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:603) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [604](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:604) | 이다. | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [605](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:605) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [606](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:606) | 즉 태스크 자체에서도 sparse activation이 발생한다. | 설명·요구 | causal eligibility 없이는 role 후보를 만들지 않고 보존 task에는 run을 발급하지 않는다. |
| [607](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:607) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [608](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:608) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [609](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:609) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B13 — 하지만 단순 dependency graph만으로 부족하다

원문 610–628행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b13)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [610](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:610) | # 13. 하지만 단순 dependency graph만으로 부족하다 | 제목 | depends_on 외 shares_contract/resource/assumes/conflicts/integrates/derived/constrained 관계가 필요하다. |
| [611](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:611) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [612](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:612) | 현실에서는 다음 관계도 존재한다. | 설명·요구 | 8개 relation을 causal edge registry에 등록하고 shared resource/contract node와 역방향 영향 규칙을 명시한다. |
| [613](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:613) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [614](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:614) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [615](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:615) | depends_on | 예시·흐름 | 실제 input/output port 의존으로 producer→consumer 전파한다. |
| [616](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:616) | shares_contract | 예시·흐름 | 공통 contract node를 통해 모든 관련 consumer와 통합 tuple을 찾는다. |
| [617](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:617) | shares_resource | 예시·흐름 | 공유 자원 상태/제약 변화로 경합하는 task를 연결한다. |
| [618](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:618) | assumes | 예시·흐름 | 가정 version을 참조한 task/decision에 invalidation을 전달한다. |
| [619](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:619) | conflicts_with | 예시·흐름 | 상충하는 요구/출력/자원을 명시하고 필요한 방향의 영향 arc를 만든다. |
| [620](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:620) | integrates_with | 예시·흐름 | 공동 검증 대상 output과 boundary를 연결한다. |
| [621](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:621) | derived_from | 예시·흐름 | 원본의 실제 view를 읽은 파생 결과의 lineage를 기록한다. |
| [622](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:622) | constrained_by | 예시·흐름 | required/critical invariant가 소비 task를 제약함을 기록한다. |
| [623](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:623) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [624](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:624) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [625](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:625) | 따라서 실제 그래프는 단순 dependency DAG보다 풍부해야 한다. | 설명·요구 | 8개 relation을 causal edge registry에 등록하고 shared resource/contract node와 역방향 영향 규칙을 명시한다. |
| [626](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:626) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [627](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:627) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [628](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:628) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B14 — Causal Task Graph

원문 629–652행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b14)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [629](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:629) | # 14. Causal Task Graph | 제목 | GC=(V,E,R)에서 relation별로 변경 종류의 전파 경로가 다르다. |
| [630](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:630) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [631](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:631) | 다음과 같이 정의한다. | 설명·요구 | 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [632](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:632) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [633](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:633) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [634](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:634) | G_C=(V,E,R) | 수식 본문 | 식 전체의 구현 계약: 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. 검증: T05: 같은 두 node라도 relation과 scope에 따라 서로 다른 전파 결과를 낸다. |
| [635](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:635) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [636](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:636) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [637](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:637) | 여기서 \(R\)은 edge relation이다. | 설명·요구 | 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [638](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:638) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [639](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:639) | 예: | 설명·요구 | 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [640](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:640) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [641](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:641) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [642](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:642) | A ──depends_on────→ B | 예시·흐름 | 검증 fixture: T05: 같은 두 node라도 relation과 scope에 따라 서로 다른 전파 결과를 낸다. 구현: 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [643](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:643) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [644](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:644) | C ──shares_contract→ B | 예시·흐름 | 검증 fixture: T05: 같은 두 node라도 relation과 scope에 따라 서로 다른 전파 결과를 낸다. 구현: 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [645](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:645) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [646](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:646) | D ──assumes────────→ C | 예시·흐름 | 검증 fixture: T05: 같은 두 node라도 relation과 scope에 따라 서로 다른 전파 결과를 낸다. 구현: 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [647](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:647) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [648](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:648) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [649](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:649) | 변경 종류에 따라 따라가야 할 edge 종류가 달라진다. | 설명·요구 | 각 relation의 allowed scopes/criticality/consumer view를 검증하고 의미 없는 무제한 문자열 edge를 거절한다. |
| [650](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:650) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [651](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:651) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [652](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:652) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B15 — Typed Propagation

원문 653–684행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b15)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [653](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:653) | # 15. Typed Propagation | 제목 | implementation은 실제 behavioral dependency, contract는 공유/구현/통합, goal은 goal/derived/assumption 의존으로 전파한다. |
| [654](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:654) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [655](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:655) | 예를 들어 implementation-only change라면 | 설명·요구 | 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [656](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:656) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [657](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:657) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [658](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:658) | depends_on | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [659](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:659) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [660](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:660) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [661](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:661) | 중에서도 실제 behavioral dependency만 전파하면 된다. | 설명·요구 | 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [662](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:662) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [663](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:663) | contract change라면 | 설명·요구 | 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [664](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:664) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [665](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:665) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [666](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:666) | depends_on | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [667](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:667) | shares_contract | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [668](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:668) | implements | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [669](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:669) | integrates_with | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [670](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:670) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [671](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:671) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [672](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:672) | 까지 추적한다. | 설명·요구 | 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [673](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:673) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [674](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:674) | goal change라면 더 넓어진다. | 설명·요구 | 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [675](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:675) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [676](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:676) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [677](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:677) | implements_goal | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [678](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:678) | derived_from | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [679](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:679) | assumes | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [680](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:680) | depends_on | 예시·흐름 | 검증 fixture: T05: 세 change class 각각의 통과/차단 edge fixture를 갖는다. 구현: 명세의 scope→relation matrix를 적용하고 실제 읽는 port projection과 결합한다. |
| [681](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:681) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [682](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:682) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [683](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:683) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [684](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:684) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B16 — Change Signature

원문 685–710행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b16)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [685](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:685) | # 16. Change Signature | 제목 | ChangeSignature의 8 scope/magnitude/confidence를 모두 보존한다. |
| [686](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:686) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [687](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:687) | 모든 변경에 signature를 만든다. | 설명·요구 | 복수 scope와 근거를 허용하고 A cache classification과 mapping한다. 판정 불가를 confident syntactic으로 저장하지 않는다. |
| [688](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:688) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [689](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:689) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [690](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:690) | interface ChangeSignature { | 타입 선언 | ChangeSignature의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [691](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:691) |   scope: | 데이터 필드 | 8가지 원문 scope를 보존하며 복합 변경은 scope 집합으로 내부 확장한다. |
| [692](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:692) |     &#124; "syntactic" | 열거값 | 관찰 의미 view 보존 근거가 있을 때만 관련 cognition을 유지한다. |
| [693](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:693) |     &#124; "implementation" | 열거값 | 실제 behavior/implementation 소비 포트로만 전파하되 unknown은 보수 처리한다. |
| [694](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:694) |     &#124; "behavior" | 열거값 | 행동·오류·시간 제약의 소비 관계와 validation/integration을 따라간다. |
| [695](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:695) |     &#124; "contract" | 열거값 | required port·공유 contract·implements·integration 관계를 추적한다. |
| [696](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:696) |     &#124; "dependency" | 열거값 | 추가/제거/변경된 실제 input/resource/tool/environment binding을 전파한다. |
| [697](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:697) |     &#124; "assumption" | 열거값 | 해당 AssumptionVersion의 소비 node와 그 결과 의존에 전파한다. |
| [698](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:698) |     &#124; "subgoal" | 열거값 | 변경 subgoal subtree 및 외부 인과 관계의 영향만 계산한다. |
| [699](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:699) |     &#124; "goal"; | 열거값 | 승인 objective 변화의 관련 계층·derived/assumes/depends 관계를 재검토한다. |
| [700](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:700) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [701](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:701) |   magnitude: number; | 데이터 필드 | 의미 변화 크기의 정규화 값이다. 줄 수만으로 결정하지 않는다. |
| [702](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:702) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [703](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:703) |   confidence: number; | 데이터 필드 | scope/magnitude 판단 근거의 신뢰도이다. 낮은 값은 불변 proof가 아니다. |
| [704](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:704) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [705](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:705) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [706](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:706) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [707](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:707) | 이 signature가 propagation rule을 결정한다. | 설명·요구 | 복수 scope와 근거를 허용하고 A cache classification과 mapping한다. 판정 불가를 confident syntactic으로 저장하지 않는다. |
| [708](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:708) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [709](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:709) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [710](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:710) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B17 — 인간에게서 가져올 세 번째 원리: Event Boundary

원문 711–726행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b17)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [711](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:711) | # 17. 인간에게서 가져올 세 번째 원리: Event Boundary | 제목 | 현재 계획이 유효한 동안 유지하고 의미 있는 오차에서만 event boundary를 갱신한다. |
| [712](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:712) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [713](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:713) | 인간은 입력의 모든 미세한 변화를 새로운 사건으로 취급하지 않는다. | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. |
| [714](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:714) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [715](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:715) | 현재 진행 중인 event model이 충분히 작동하는 동안 유지한다. | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. |
| [716](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:716) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [717](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:717) | 예측이 크게 실패할 때만 새로운 event boundary를 형성하는 것으로 설명할 수 있다. citeturn628734search6turn628734search8 | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [718](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:718) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [719](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:719) | 에이전트에서 이것은 | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. |
| [720](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:720) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [721](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:721) | &gt; **계획의 어느 시점까지 기존 계획을 그대로 유지할 것인가?** | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. |
| [722](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:722) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [723](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:723) | 라는 문제와 대응한다. | 설명·요구 | boundary별 stable/replanning/stabilizing 상태와 전이 근거를 저장한다. |
| [724](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:724) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [725](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:725) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [726](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:726) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B18 — Planning Boundary

원문 727–755행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b18)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [727](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:727) | # 18. Planning Boundary | 제목 | Backend/Frontend처럼 planning boundary를 명시하고 내부 변경이 외부 contract를 넘지 않으면 외부 plan을 유지한다. |
| [728](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:728) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [729](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:729) | 태스크 그래프에 **Planning Boundary**를 추가한다. | 설명·요구 | boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [730](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:730) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [731](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:731) | 예: | 설명·요구 | boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [732](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:732) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [733](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:733) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [734](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:734) | Goal | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [735](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:735) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [736](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:736) | ├──────── Boundary A ────────┐ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [737](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:737) | │                            │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [738](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:738) | │   Backend                  │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [739](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:739) | │   ├─ API                   │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [740](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:740) | │   ├─ DB                    │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [741](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:741) | │   └─ Cache                 │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [742](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:742) | │                            │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [743](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:743) | └────────────────────────────┘ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [744](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:744) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [745](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:745) | ├──────── Boundary B ────────┐ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [746](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:746) | │                            │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [747](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:747) | │   Frontend                 │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [748](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:748) | │                            │ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [749](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:749) | └────────────────────────────┘ | 예시·흐름 | 검증 fixture: T06: backend 내부 변경이 검증된 public projection을 유지하면 frontend run 0이다. 구현: boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [750](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:750) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [751](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:751) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [752](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:752) | Backend 내부 변경이 public contract를 넘지 않는다면 Frontend plan을 깨우지 않는다. | 설명·요구 | boundary membership/ports/invariants/external bindings를 versioned 저장한다. |
| [753](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:753) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [754](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:754) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [755](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:755) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B19 — Boundary Invariant

원문 756–783행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b19)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [756](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:756) | # 19. Boundary Invariant | 제목 | IB(S)=IB(S')가 내부 변경의 외부 차단 조건이다. |
| [757](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:757) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [758](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:758) | Boundary \(B\)가 외부에 보장하는 계약을 | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [759](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:759) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [760](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:760) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [761](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:761) | I_B | 수식 본문 | 식 전체의 구현 계약: before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. 검증: T06: invariant 이름만 같고 값이 바뀌면 preserved로 판정하지 않는다. |
| [762](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:762) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [763](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:763) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [764](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:764) | 라고 하자. | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [765](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:765) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [766](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:766) | 내부가 | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [767](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:767) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [768](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:768) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [769](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:769) | S_B\rightarrow S'_B | 수식 본문 | 식 전체의 구현 계약: before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. 검증: T06: invariant 이름만 같고 값이 바뀌면 preserved로 판정하지 않는다. |
| [770](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:770) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [771](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:771) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [772](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:772) | 로 변경되어도 | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [773](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:773) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [774](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:774) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [775](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:775) | I_B(S_B)=I_B(S'_B) | 수식 본문 | 식 전체의 구현 계약: before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. 검증: T06: invariant 이름만 같고 값이 바뀌면 preserved로 판정하지 않는다. |
| [776](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:776) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [777](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:777) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [778](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:778) | 라면 boundary 밖으로 변화가 전파되지 않는다. | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [779](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:779) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [780](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:780) | 이를 **Boundary Preservation Principle**이라 한다. | 설명·요구 | before/after projection·검증 범위·소비 read completeness를 BoundaryProof로 저장한다. |
| [781](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:781) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [782](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:782) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [783](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:783) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B20 — 또 하나의 중요한 정리

원문 784–809행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b20)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [784](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:784) | # 20. 또 하나의 중요한 정리 | 제목 | 외부가 I(S)에만 의존하고 그 값이 같다는 두 조건이 있어야 containment가 성립한다. |
| [785](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:785) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [786](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:786) | ## Boundary Containment Theorem | 제목 | 외부가 I(S)에만 의존하고 그 값이 같다는 두 조건이 있어야 containment가 성립한다. |
| [787](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:787) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [788](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:788) | subgraph \(S\)의 내부 상태가 변경되었지만 외부 observable contract \(I(S)\)가 보존된다고 하자. | 설명·요구 | 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. |
| [789](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:789) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [790](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:790) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [791](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:791) | I(S')=I(S) | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [792](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:792) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [793](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:793) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [794](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:794) | 외부 태스크들이 \(S\)의 내부 구현이 아니라 \(I(S)\)에만 의존한다면 외부 태스크의 결과는 변하지 않는다. | 설명·요구 | 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. |
| [795](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:795) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [796](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:796) | 즉 | 설명·요구 | 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. |
| [797](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:797) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [798](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:798) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [799](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:799) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [800](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:800) | I(S')=I(S) | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [801](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:801) | \Rightarrow | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [802](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:802) | Replan(Outside(S))=False | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [803](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:803) | } | 수식 본문 | 식 전체의 구현 계약: 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. 검증: T06: 타입이 같아도 외부 직접 read나 다른 error semantics가 있으면 차단 proof가 실패한다. |
| [804](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:804) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [805](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:805) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [806](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:806) | 이다. | 설명·요구 | 모든 external binding이 증명 projection으로 닫혔는지 확인한다. unknown이면 검사/전파를 계속한다. |
| [807](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:807) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [808](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:808) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [809](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:809) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B21 — 증명

원문 810–857행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b21)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [810](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:810) | # 21. 증명 | 제목 | Ov=fv(I(S),X)에서 I와 X와 f가 같아야 Ov가 유지된다. |
| [811](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:811) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [812](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:812) | 외부 태스크 \(v\)가 \(S\)에 의존한다고 하자. | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [813](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:813) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [814](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:814) | 단 외부에서 관찰할 수 있는 것은 | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [815](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:815) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [816](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:816) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [817](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:817) | I(S) | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [818](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:818) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [819](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:819) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [820](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:820) | 뿐이다. | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [821](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:821) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [822](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:822) | 그러므로 | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [823](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:823) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [824](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:824) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [825](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:825) | O_v=f_v(I(S),X) | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [826](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:826) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [827](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:827) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [828](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:828) | 이다. | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [829](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:829) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [830](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:830) | 변경 후 | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [831](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:831) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [832](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:832) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [833](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:833) | O'_v=f_v(I(S'),X) | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [834](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:834) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [835](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:835) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [836](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:836) | 인데 가정에 의해 | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [837](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:837) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [838](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:838) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [839](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:839) | I(S')=I(S) | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [840](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:840) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [841](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:841) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [842](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:842) | 이므로 | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [843](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:843) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [844](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:844) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [845](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:845) | O'_v | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [846](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:846) | = | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [847](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:847) | f_v(I(S),X) | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [848](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:848) | = | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [849](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:849) | O_v | 수식 본문 | 식 전체의 구현 계약: proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. 검증: T06,T09: boundary 보존과 별개 외부 입력 변화가 있으면 해당 외부 task는 재검토된다. |
| [850](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:850) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [851](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:851) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [852](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:852) | 이다. | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [853](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:853) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [854](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:854) | 따라서 외부 태스크는 재계획할 필요가 없다. | 설명·요구 | proof에 외부 input/function vector도 고정하고 다중 변화 episode에서 재검증한다. |
| [855](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:855) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [856](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:856) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [857](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:857) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B22 — 이 원리가 중요한 이유

원문 858–879행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b22)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [858](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:858) | # 22. 이 원리가 중요한 이유 | 제목 | 좋은 캡슐화가 affected graph와 reasoning 비용을 줄일 수 있다. |
| [859](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:859) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [860](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:860) | 이것이 **캡슐화가 AI reasoning 비용도 줄여주는 이유**다. | 설명·요구 | boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. |
| [861](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:861) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [862](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:862) | 좋은 software boundary는 코드 관리뿐 아니라 reasoning boundary이기도 하다. | 설명·요구 | boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. |
| [863](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:863) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [864](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:864) | 즉 architecture quality가 높으면 | 설명·요구 | boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. |
| [865](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:865) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [866](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:866) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [867](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:867) | AffectedGraphSize\downarrow | 수식 본문 | 식 전체의 구현 계약: boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. 검증: T13: 경계 도입 전후 동일 변화의 비용과 정확성을 비교한다. |
| [868](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:868) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [869](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:869) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [870](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:870) | 하고 따라서 | 설명·요구 | boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. |
| [871](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:871) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [872](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:872) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [873](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:873) | ReasoningCost\downarrow | 수식 본문 | 식 전체의 구현 계약: boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. 검증: T13: 경계 도입 전후 동일 변화의 비용과 정확성을 비교한다. |
| [874](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:874) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [875](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:875) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [876](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:876) | 한다. | 설명·요구 | boundary proof hit·외부 direct read 위반·방문 node·재계획 비용을 계측한다. |
| [877](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:877) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [878](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:878) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [879](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:879) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B23 — 계획 변경의 종류

원문 880–935행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b23)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [880](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:880) | # 23. 계획 변경의 종류 | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [881](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:881) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [882](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:882) | 계획 변경은 서로 다르게 처리해야 한다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [883](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:883) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [884](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:884) | ## Type 1 — Implementation Change | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [885](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:885) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [886](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:886) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [887](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:887) | 방법 변경 | 예시·흐름 | 검증 fixture: T05,T07: 다섯 유형 각각의 보존/영향 집합을 fixture로 명시한다. 구현: 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [888](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:888) | 목표 유지 | 예시·흐름 | 검증 fixture: T05,T07: 다섯 유형 각각의 보존/영향 집합을 fixture로 명시한다. 구현: 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [889](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:889) | contract 유지 | 예시·흐름 | 검증 fixture: T05,T07: 다섯 유형 각각의 보존/영향 집합을 fixture로 명시한다. 구현: 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [890](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:890) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [891](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:891) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [892](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:892) | 전파 범위가 작다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [893](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:893) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [894](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:894) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [895](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:895) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [896](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:896) | ## Type 2 — Contract Change | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [897](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:897) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [898](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:898) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [899](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:899) | input/output 변경 | 예시·흐름 | 검증 fixture: T05,T07: 다섯 유형 각각의 보존/영향 집합을 fixture로 명시한다. 구현: 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [900](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:900) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [901](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:901) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [902](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:902) | consumer까지 전파한다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [903](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:903) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [904](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:904) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [905](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:905) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [906](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:906) | ## Type 3 — Assumption Change | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [907](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:907) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [908](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:908) | 예: | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [909](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:909) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [910](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:910) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [911](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:911) | "DB는 항상 available하다" | 예시·흐름 | 검증 fixture: T05,T07: 다섯 유형 각각의 보존/영향 집합을 fixture로 명시한다. 구현: 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [912](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:912) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [913](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:913) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [914](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:914) | 라는 가정이 깨졌다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [915](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:915) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [916](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:916) | 해당 assumption을 참조하는 모든 node로 전파한다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [917](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:917) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [918](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:918) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [919](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:919) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [920](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:920) | ## Type 4 — Subgoal Change | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [921](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:921) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [922](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:922) | 중간 목표 자체가 달라진다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [923](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:923) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [924](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:924) | 해당 subgoal subtree를 다시 계획한다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [925](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:925) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [926](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:926) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [927](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:927) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [928](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:928) | ## Type 5 — Goal Change | 제목 | 구현/contract/assumption/subgoal/goal 다섯 변경을 구별한다. |
| [929](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:929) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [930](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:930) | 최상위 objective가 변한다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [931](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:931) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [932](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:932) | 가장 광범위한 재검토가 필요하다. | 설명·요구 | 구현은 observable consumer, contract는 port consumer, assumption은 ref index, subgoal은 subtree+교차 관계, goal은 objective 참조로 전달한다. |
| [933](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:933) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [934](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:934) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [935](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:935) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B24 — Change Radius

원문 936–966행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b24)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [936](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:936) | # 24. Change Radius | 제목 | 반경은 source와 change type의 함수이며 일반적인 크기 순서를 설명한다. |
| [937](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:937) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [938](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:938) | 변경의 영향 반경을 정의한다. | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [939](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:939) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [940](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:940) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [941](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:941) | R(x,c) | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [942](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:942) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [943](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:943) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [944](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:944) | 여기서 | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [945](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:945) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [946](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:946) | - \(x\): 변경 node | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [947](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:947) | - \(c\): change type | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [948](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:948) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [949](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:949) | 이다. | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [950](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:950) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [951](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:951) | 일반적으로 | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [952](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:952) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [953](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:953) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [954](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:954) | R_{implementation} | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [955](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:955) | &lt; | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [956](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:956) | R_{contract} | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [957](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:957) | &lt; | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [958](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:958) | R_{subgoal} | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [959](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:959) | &lt; | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [960](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:960) | R_{goal} | 수식 본문 | 식 전체의 구현 계약: 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. 검증: T05: 고공유 implementation이 작은 subgoal보다 넓은 반례도 올바르게 처리한다. |
| [961](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:961) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [962](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:962) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [963](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:963) | 가 된다. | 설명·요구 | 실제 typed reachability의 node/edge/depth를 radius로 측정한다. 원문의 부등식은 경향으로만 취급한다. |
| [964](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:964) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [965](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:965) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [966](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:966) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B25 — Replanning은 binary가 아니다

원문 967–1005행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b25)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [967](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:967) | # 25. Replanning은 binary가 아니다 | 제목 | 영향은 binary 외 max-product delta로 전파하며 source=1, edge weight는 0..1이다. |
| [968](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:968) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [969](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:969) | 어떤 node가 영향받았다고 해서 반드시 완전히 다시 계획할 필요는 없다. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [970](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:970) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [971](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:971) | 각 node에 변화 정도를 전파한다. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [972](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:972) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [973](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:973) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [974](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:974) | \Delta_v | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [975](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:975) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [976](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:976) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [977](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:977) | 라고 하자. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [978](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:978) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [979](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:979) | source node에서는 | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [980](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:980) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [981](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:981) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [982](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:982) | \Delta_x=1 | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [983](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:983) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [984](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:984) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [985](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:985) | 이다. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [986](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:986) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [987](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:987) | edge를 지나면서 영향을 감쇠할 수 있다. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [988](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:988) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [989](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:989) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [990](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:990) | \Delta_v | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [991](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:991) | = | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [992](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:992) | \max_{u\in pred(v)} | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [993](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:993) | \Delta_u w_{uv} | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [994](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:994) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [995](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:995) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [996](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:996) | 여기서 | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [997](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:997) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [998](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:998) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [999](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:999) | 0\le w_{uv}\le1 | 수식 본문 | 식 전체의 구현 계약: 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. 검증: T05: 여러 경로의 max·0/1 weight·cycle 수렴을 숫자 oracle과 대조한다. |
| [1000](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1000) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1001](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1001) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1002](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1002) | 이다. | 설명·요구 | 단조 max-product worklist와 방문 이유를 구현하고 scope별 독립 delta를 계산한다. |
| [1003](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1003) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1004](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1004) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1005](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1005) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B26 — Threshold Propagation

원문 1006–1023행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b26)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1006](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1006) | # 26. Threshold Propagation | 제목 | delta threshold 미만은 기존 plan 유지, 이상은 재검토한다. |
| [1007](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1007) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1008](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1008) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1009](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1009) | \Delta_v &lt; \theta_v | 수식 본문 | 식 전체의 구현 계약: noncritical optional replan에만 threshold skip을 허용하고 unknown/required validator는 계속 pending으로 남긴다. 검증: T05,T10: 낮은 delta가 필수 검증 의무를 삭제하지 못한다. |
| [1010](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1010) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1011](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1011) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1012](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1012) | 라면 기존 plan을 유지한다. | 설명·요구 | noncritical optional replan에만 threshold skip을 허용하고 unknown/required validator는 계속 pending으로 남긴다. |
| [1013](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1013) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1014](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1014) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1015](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1015) | \Delta_v\ge\theta_v | 수식 본문 | 식 전체의 구현 계약: noncritical optional replan에만 threshold skip을 허용하고 unknown/required validator는 계속 pending으로 남긴다. 검증: T05,T10: 낮은 delta가 필수 검증 의무를 삭제하지 못한다. |
| [1016](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1016) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1017](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1017) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1018](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1018) | 라면 재검토한다. | 설명·요구 | noncritical optional replan에만 threshold skip을 허용하고 unknown/required validator는 계속 pending으로 남긴다. |
| [1019](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1019) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1020](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1020) | 즉 변화가 그래프 전체로 무한 전파되는 것을 막는다. | 설명·요구 | noncritical optional replan에만 threshold skip을 허용하고 unknown/required validator는 계속 pending으로 남긴다. |
| [1021](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1021) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1022](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1022) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1023](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1023) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B27 — 그러나 Critical Edge에서는 감쇠시키지 않는다

원문 1024–1044행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b27)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1024](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1024) | # 27. 그러나 Critical Edge에서는 감쇠시키지 않는다 | 제목 | security/schema/public API/financial correctness는 감쇠하지 않는다. |
| [1025](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1025) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1026](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1026) | 예: | 설명·요구 | critical=true면 hard reachability를 우선 계산하고 weight=1을 강제한다. |
| [1027](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1027) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1028](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1028) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1029](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1029) | security invariant | 예시·흐름 | 학습 weight나 threshold와 무관한 hard 전파·검증 의무로 처리한다. |
| [1030](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1030) | database schema | 예시·흐름 | required schema 변화는 관련 data/consumer 경계까지 hard로 전달한다. |
| [1031](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1031) | public API | 예시·흐름 | required public interface 변화는 actual consumer/통합 의무를 건너뛰지 않는다. |
| [1032](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1032) | financial correctness | 예시·흐름 | 정확성 invariant를 비용·확률 추정으로 skip할 수 없게 한다. |
| [1033](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1033) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1034](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1034) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1035](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1035) | 등은 | 설명·요구 | critical=true면 hard reachability를 우선 계산하고 weight=1을 강제한다. |
| [1036](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1036) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1037](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1037) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1038](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1038) | w=1 | 수식 본문 | 식 전체의 구현 계약: critical=true면 hard reachability를 우선 계산하고 weight=1을 강제한다. 검증: T05: 매우 긴 critical path와 낮은 학습 확률에서도 의무가 끝까지 전파된다. |
| [1039](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1039) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1040](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1040) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1041](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1041) | 또는 hard propagation rule을 사용한다. | 설명·요구 | critical=true면 hard reachability를 우선 계산하고 weight=1을 강제한다. |
| [1042](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1042) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1043](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1043) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1044](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1044) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B28 — 인간에게서 가져올 네 번째 원리: Task Switching Cost

원문 1045–1062행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b28)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1045](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1045) | # 28. 인간에게서 가져올 네 번째 원리: Task Switching Cost | 제목 | 계획 전환에는 재구성·실행 변경 비용이 있다. |
| [1046](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1046) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1047](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1047) | 인간은 아무 비용 없이 계획 사이를 전환하지 않는다. | 설명·요구 | switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. |
| [1048](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1048) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1049](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1049) | task switching 연구에서는 반복 작업보다 task switch 상황에서 성능 또는 반응시간 비용이 발생하는 switching cost가 널리 관찰된다. 이러한 비용은 이전 task set의 간섭과 새로운 task set의 재구성 모두와 관련된 것으로 설명된다. citeturn628734search4 | 설명·요구 | switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [1050](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1050) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1051](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1051) | 에이전트에서도 이것을 고려해야 한다. | 설명·요구 | switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. |
| [1052](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1052) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1053](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1053) | 계획을 너무 쉽게 폐기하고 재구성하면 | 설명·요구 | switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. |
| [1054](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1054) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1055](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1055) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1056](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1056) | ReplanningCost | 수식 본문 | 식 전체의 구현 계약: switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. 검증: T07: 이미 진행한 작업이 큰 경우 작은 기대 개선만으로 교체하지 않는다. |
| [1057](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1057) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1058](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1058) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1059](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1059) | 가 과도하게 증가한다. | 설명·요구 | switch estimator에 replanning/context/session/중단/폐기 작업/통합 비용을 포함한다. |
| [1060](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1060) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1061](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1061) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1062](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1062) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B29 — Replanning Hysteresis

원문 1063–1088행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b29)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1063](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1063) | # 29. Replanning Hysteresis | 제목 | enter&gt;exit의 hysteresis로 작은 오차 진동에 계획이 흔들리지 않게 한다. |
| [1064](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1064) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1065](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1065) | 따라서 한 번의 작은 prediction error만으로 plan을 바꾸지 않는다. | 설명·요구 | stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1066](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1066) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1067](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1067) | 두 threshold를 둔다. | 설명·요구 | stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1068](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1068) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1069](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1069) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1070](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1070) | \theta_{enter} | 수식 본문 | 식 전체의 구현 계약: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. 검증: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. |
| [1071](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1071) | &gt; | 수식 본문 | 식 전체의 구현 계약: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. 검증: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. |
| [1072](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1072) | \theta_{exit} | 수식 본문 | 식 전체의 구현 계약: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. 검증: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. |
| [1073](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1073) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1074](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1074) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1075](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1075) | 예: | 설명·요구 | stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1076](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1076) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1077](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1077) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1078](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1078) | prediction error &gt; 0.7 | 예시·흐름 | 검증 fixture: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. 구현: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1079](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1079) | → replanning mode 진입 | 예시·흐름 | 검증 fixture: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. 구현: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1080](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1080) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1081](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1081) | prediction error &lt; 0.3 | 예시·흐름 | 검증 fixture: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. 구현: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1082](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1082) | → 안정 상태 복귀 | 예시·흐름 | 검증 fixture: T07: 두 임계값 사이 진동은 상태를 계속 전환하지 않는다. 구현: stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1083](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1083) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1084](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1084) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1085](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1085) | 이를 통해 작은 변화에 계획이 계속 흔들리는 것을 방지한다. | 설명·요구 | stable/replanning/stabilizing과 equality 규칙을 저장하고 재시작 후 유지한다. 0.7/0.3은 calibration 예시다. |
| [1086](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1086) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1087](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1087) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1088](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1088) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B30 — Plan Stability

원문 1089–1122행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b30)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1089](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1089) | # 30. Plan Stability | 제목 | Cswitch가 Ckeep보다 낮을 때 교체하되 expected failure 비용을 함께 고려한다. |
| [1090](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1090) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1091](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1091) | plan 변경 여부를 다음 최적화 문제로 볼 수 있다. | 설명·요구 | 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. |
| [1092](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1092) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1093](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1093) | 현재 계획 \(P\)를 유지하는 비용: | 설명·요구 | 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. |
| [1094](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1094) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1095](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1095) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1096](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1096) | C_{keep} | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1097](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1097) | = | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1098](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1098) | ExpectedFailure(P) | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1099](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1099) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1100](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1100) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1101](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1101) | 새 계획 \(P'\)로 전환하는 비용: | 설명·요구 | 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. |
| [1102](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1102) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1103](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1103) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1104](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1104) | C_{switch} | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1105](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1105) | = | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1106](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1106) | ReplanningCost | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1107](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1107) | + | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1108](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1108) | ExecutionChangeCost | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1109](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1109) | + | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1110](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1110) | ExpectedFailure(P') | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1111](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1111) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1112](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1112) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1113](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1113) | 따라서 | 설명·요구 | 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. |
| [1114](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1114) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1115](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1115) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1116](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1116) | C_{switch}&lt;C_{keep} | 수식 본문 | 식 전체의 구현 계약: 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. 검증: T07: 비용 우위라도 critical requirement 위반 계획을 keep하지 않는다. |
| [1117](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1117) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1118](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1118) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1119](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1119) | 일 때만 계획을 바꾼다. | 설명·요구 | 두 계획의 동일 단위 비용·오차·실패 추정과 confidence를 evidence로 비교한다. |
| [1120](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1120) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1121](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1121) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1122](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1122) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B31 — 이것은 중요한 설계 변화다

원문 1123–1153행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b31)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1123](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1123) | # 31. 이것은 중요한 설계 변화다 | 제목 | better와 worth changing은 다르며 expected gain이 switching cost보다 커야 한다. |
| [1124](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1124) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1125](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1125) | 단순하게 | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1126](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1126) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1127](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1127) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1128](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1128) | 더 좋은 계획 발견 | 예시·흐름 | 검증 fixture: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. 구현: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1129](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1129) | → 교체 | 예시·흐름 | 검증 fixture: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. 구현: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1130](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1130) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1131](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1131) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1132](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1132) | 하면 안 된다. | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1133](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1133) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1134](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1134) | 대신 | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1135](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1135) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1136](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1136) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1137](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1137) | ExpectedGain | 수식 본문 | 식 전체의 구현 계약: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. 검증: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. |
| [1138](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1138) | &gt; | 수식 본문 | 식 전체의 구현 계약: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. 검증: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. |
| [1139](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1139) | SwitchingCost | 수식 본문 | 식 전체의 구현 계약: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. 검증: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. |
| [1140](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1140) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1141](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1141) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1142](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1142) | 일 때만 교체해야 한다. | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1143](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1143) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1144](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1144) | 즉 | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1145](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1145) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1146](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1146) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1147](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1147) | better != worth changing | 예시·흐름 | 검증 fixture: T07: 이득=전환비용 경계값과 불확실 추정 처리 규칙을 검증한다. 구현: feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1148](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1148) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1149](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1149) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1150](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1150) | 이다. | 설명·요구 | feasibility gate 후 incremental gain 비교를 적용하고 keep decision도 이유를 기록한다. |
| [1151](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1151) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1152](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1152) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1153](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1153) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B32 — Hierarchical Replanning

원문 1154–1181행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b32)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1154](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1154) | # 32. Hierarchical Replanning | 제목 | action/task/subgoal/goal의 가장 작은 수준부터 복구한다. |
| [1155](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1155) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1156](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1156) | 변화가 발생했을 때 가장 작은 계획 수준부터 확인한다. | 설명·요구 | leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1157](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1157) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1158](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1158) | 예: | 설명·요구 | leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1159](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1159) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1160](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1160) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1161](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1161) | Action | 예시·흐름 | 검증 fixture: T08: local repair 성공 시 parent 역할을 깨우지 않는다. 구현: leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1162](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1162) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1163](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1163) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1164](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1164) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1165](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1165) | Task | 예시·흐름 | 검증 fixture: T08: local repair 성공 시 parent 역할을 깨우지 않는다. 구현: leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1166](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1166) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1167](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1167) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1168](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1168) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1169](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1169) | Subgoal | 예시·흐름 | 검증 fixture: T08: local repair 성공 시 parent 역할을 깨우지 않는다. 구현: leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1170](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1170) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1171](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1171) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1172](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1172) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1173](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1173) | Goal | 예시·흐름 | 검증 fixture: T08: local repair 성공 시 parent 역할을 깨우지 않는다. 구현: leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1174](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1174) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1175](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1175) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1176](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1176) | 먼저 Task 수준에서 해결을 시도한다. | 설명·요구 | leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1177](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1177) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1178](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1178) | 불가능한 경우에만 상위로 올라간다. | 설명·요구 | leaf repair 결과와 boundary invariant를 검증하고 실패 evidence가 있을 때만 상위 region 후보를 연다. |
| [1179](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1179) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1180](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1180) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1181](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1181) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B33 — Minimal Replanning Principle

원문 1182–1212행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b33)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1182](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1182) | # 33. Minimal Replanning Principle | 제목 | S*는 변경을 흡수해 유효 계획을 복구하는 영역 중 비용 최소다. |
| [1183](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1183) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1184](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1184) | 변경 \(c\)에 대해 이를 흡수할 수 있는 가장 작은 subgraph를 | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1185](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1185) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1186](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1186) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1187](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1187) | S^*(c) | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1188](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1188) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1189](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1189) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1190](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1190) | 라고 하자. | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1191](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1191) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1192](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1192) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1193](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1193) | S^*(c) | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1194](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1194) | = | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1195](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1195) | \arg\min_{S} | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1196](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1196) | Cost(S) | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1197](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1197) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1198](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1198) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1199](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1199) | subject to | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1200](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1200) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1201](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1201) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1202](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1202) | ValidPlanAfterChange(S,c)=True | 수식 본문 | 식 전체의 구현 계약: 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. 검증: T08: 작은 그래프 전수 oracle과 일치하며 미증명 최소를 최소라고 보고하지 않는다. |
| [1203](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1203) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1204](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1204) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1205](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1205) | 이다. | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1206](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1206) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1207](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1207) | 즉 | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1208](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1208) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1209](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1209) | &gt; **변경을 흡수하면서 정상 계획을 복구할 수 있는 가장 작은 부분만 다시 계산한다.** | 설명·요구 | 유한 candidate domain과 feasibility/cost를 정의하고 branch-and-bound·optimality gap을 기록한다. |
| [1210](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1210) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1211](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1211) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1212](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1212) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B34 — Replanning Escalation

원문 1213–1239행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b34)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1213](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1213) | # 34. Replanning Escalation | 제목 | leaf repair 실패→subtask 실패→subgoal 실패→goal 순서로 올라간다. |
| [1214](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1214) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1215](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1215) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1216](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1216) | Change detected | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1217](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1217) |        │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1218](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1218) |        ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1219](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1219) | Leaf repair possible? | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1220](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1220) |  ├─ YES → local repair | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1221](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1221) |  │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1222](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1222) |  └─ NO | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1223](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1223) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1224](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1224) | Subtask replanning possible? | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1225](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1225) |  ├─ YES | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1226](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1226) |  │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1227](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1227) |  └─ NO | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1228](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1228) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1229](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1229) | Subgoal replanning | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1230](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1230) |       │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1231](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1231) |       ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1232](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1232) | Still invalid? | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1233](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1233) |       │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1234](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1234) |       ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1235](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1235) | Goal-level replanning | 예시·흐름 | 검증 fixture: T08: 실패 증거 없는 goal-level replan 요청을 거절한다. 구현: escalation record에 시도·실패 validator·위반 invariant·다음 후보를 요구한다. |
| [1236](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1236) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1237](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1237) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1238](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1238) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1239](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1239) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B35 — 인간의 계획 적응과 매우 유사한 예

원문 1240–1275행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b35)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1240](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1240) | # 35. 인간의 계획 적응과 매우 유사한 예 | 제목 | 도로 폐쇄 예시는 과거 출발 선택을 재논의하지 않고 현재 이후 경로를 바꾸는 prefix 보존을 뜻한다. |
| [1241](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1241) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1242](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1242) | 예를 들어 사람이 | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1243](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1243) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1244](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1244) | &gt; 서울에서 부산까지 운전한다. | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1245](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1245) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1246](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1246) | 라는 목표를 가지고 있다고 하자. | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1247](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1247) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1248](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1248) | 계획: | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1249](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1249) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1250](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1250) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1251](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1251) | 서울 | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1252](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1252) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1253](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1253) | 경부고속도로 | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1254](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1254) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1255](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1255) | 대전 | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1256](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1256) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1257](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1257) | 대구 | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1258](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1258) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1259](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1259) | 부산 | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1260](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1260) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1261](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1261) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1262](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1262) | 대구 인근에서 특정 도로가 막혔다. | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1263](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1263) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1264](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1264) | 사람은 일반적으로 | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1265](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1265) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1266](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1266) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1267](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1267) | 서울에서 출발한 선택까지 다시 생각하지 않는다. | 예시·흐름 | 검증 fixture: T08: 우회 경로 생성 후 과거 artifact/decision/spec version은 그대로다. 구현: 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1268](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1268) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1269](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1269) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1270](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1270) | 현재 위치와 앞으로의 경로만 다시 계산한다. | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1271](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1271) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1272](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1272) | 즉 과거의 완료된 prefix는 고정한다. | 설명·요구 | 완료·검증·비영향 prefix fixture를 만들고 미래 변경 lease에서 해당 node를 읽기 전용으로 고정한다. |
| [1273](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1273) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1274](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1274) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1275](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1275) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B36 — Committed Prefix

원문 1276–1310행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b36)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1276](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1276) | # 36. Committed Prefix | 제목 | P=Pc+Pf에서 Pc는 완료되고 현재 변화에 영향받지 않은 부분이다. |
| [1277](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1277) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1278](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1278) | 이미 완료되고 현재 변경으로 영향받지 않는 태스크를 | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1279](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1279) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1280](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1280) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1281](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1281) | P_c | 수식 본문 | 식 전체의 구현 계약: committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. 검증: T08: 완료했지만 새 assumption evidence에 영향받은 node는 무조건 Pc로 분류하지 않는다. |
| [1282](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1282) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1283](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1283) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1284](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1284) | 라고 한다. | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1285](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1285) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1286](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1286) | 이를 **Committed Prefix**라고 정의한다. | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1287](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1287) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1288](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1288) | 계획은 | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1289](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1289) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1290](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1290) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1291](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1291) | P= | 수식 본문 | 식 전체의 구현 계약: committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. 검증: T08: 완료했지만 새 assumption evidence에 영향받은 node는 무조건 Pc로 분류하지 않는다. |
| [1292](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1292) | P_c+P_f | 수식 본문 | 식 전체의 구현 계약: committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. 검증: T08: 완료했지만 새 assumption evidence에 영향받은 node는 무조건 Pc로 분류하지 않는다. |
| [1293](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1293) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1294](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1294) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1295](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1295) | 로 나뉜다. | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1296](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1296) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1297](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1297) | - \(P_c\): 이미 확정된 과거 | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1298](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1298) | - \(P_f\): 미래 계획 | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1299](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1299) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1300](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1300) | 변경 시 | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1301](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1301) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1302](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1302) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1303](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1303) | P'= | 수식 본문 | 식 전체의 구현 계약: committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. 검증: T08: 완료했지만 새 assumption evidence에 영향받은 node는 무조건 Pc로 분류하지 않는다. |
| [1304](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1304) | P_c+P'_f | 수식 본문 | 식 전체의 구현 계약: committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. 검증: T08: 완료했지만 새 assumption evidence에 영향받은 node는 무조건 Pc로 분류하지 않는다. |
| [1305](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1305) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1306](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1306) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1307](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1307) | 만 계산한다. | 설명·요구 | committed set은 verified/executed와 causal unaffected 및 실제 artifact 유효성을 함께 검사한다. |
| [1308](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1308) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1309](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1309) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1310](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1310) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B37 — Past Preservation Theorem

원문 1311–1328행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b37)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1311](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1311) | # 37. Past Preservation Theorem | 제목 | artifact 불변과 소급 무효화 없음이라는 전제 아래 완료 task는 재계산하지 않는다. |
| [1312](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1312) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1313](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1313) | 완료된 task \(v\)의 artifact가 변경되지 않았고 변경된 미래 task가 \(v\)의 결과를 소급해서 무효화하지 않는다면 | 설명·요구 | 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. |
| [1314](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1314) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1315](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1315) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1316](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1316) | Recompute(v)=False | 수식 본문 | 식 전체의 구현 계약: 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. 검증: T08: 미래 변경만으로 과거 완료 task를 reopen하는 patch는 거절된다. |
| [1317](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1317) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1318](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1318) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1319](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1319) | 이다. | 설명·요구 | 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. |
| [1320](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1320) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1321](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1321) | 이는 당연해 보이지만 에이전트 시스템에서 매우 중요하다. | 설명·요구 | 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. |
| [1322](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1322) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1323](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1323) | LLM planner는 전체 문제를 다시 받으면 이미 확정된 결정을 쉽게 다시 논의하기 때문이다. | 설명·요구 | 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. |
| [1324](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1324) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1325](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1325) | Control Plane이 이를 차단해야 한다. | 설명·요구 | 보존 proof와 명시적 invalidation evidence를 분리하여 재개가 필요할 때만 새 revision을 만든다. |
| [1326](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1326) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1327](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1327) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1328](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1328) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B38 — Immutable Decisions

원문 1329–1344행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b38)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1329](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1329) | # 38. Immutable Decisions | 제목 | validated+executed+no affected dependency decision은 immutable이며 reopen에는 근거가 필요하다. |
| [1330](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1330) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1331](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1331) | 다음 조건을 만족하는 decision은 기본적으로 immutable 상태로 만든다. | 설명·요구 | DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1332](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1332) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1333](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1333) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1334](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1334) | validated | 예시·흐름 | 검증 fixture: T08: 이유 문자열만으로 immutable decision을 바꿀 수 없다. 구현: DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1335](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1335) | + | 예시·흐름 | 검증 fixture: T08: 이유 문자열만으로 immutable decision을 바꿀 수 없다. 구현: DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1336](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1336) | executed | 예시·흐름 | 검증 fixture: T08: 이유 문자열만으로 immutable decision을 바꿀 수 없다. 구현: DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1337](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1337) | + | 예시·흐름 | 검증 fixture: T08: 이유 문자열만으로 immutable decision을 바꿀 수 없다. 구현: DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1338](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1338) | no affected dependency | 예시·흐름 | 검증 fixture: T08: 이유 문자열만으로 immutable decision을 바꿀 수 없다. 구현: DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1339](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1339) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1340](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1340) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1341](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1341) | 이를 reopen하려면 명시적인 invalidation evidence가 필요하다. | 설명·요구 | DecisionVersion에 검증/실행 상태와 dependency vector를 두고 invalidation evidence API를 거쳐만 재개한다. |
| [1342](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1342) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1343](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1343) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1344](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1344) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B39 — Plan Memory

원문 1345–1376행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b39)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1345](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1345) | # 39. Plan Memory | 제목 | PlanNode는 objective/expected/actual/dependencies/assumptions/boundary/status/error/invalidation/version을 모두 기억한다. |
| [1346](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1346) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1347](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1347) | 각 plan node는 다음을 기억해야 한다. | 설명·요구 | PlanNodeVersion에 각 typed ref를 추가하고 이전 revision과 관찰을 append-only로 남긴다. |
| [1348](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1348) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1349](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1349) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1350](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1350) | interface PlanNode { | 타입 선언 | PlanNode의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1351](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1351) |   taskId: string; | 데이터 필드 | stable task와 해당 taskSpecVersion의 참조이다. |
| [1352](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1352) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1353](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1353) |   objective: string; | 데이터 필드 | 현행 plan node의 승인 목표이며 expectation의 기준이다. |
| [1354](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1354) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1355](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1355) |   expectedOutcome: ExpectedOutcome; | 데이터 필드 | 실행 전 ExpectationVersion ref이다. actual로 사후 덮어쓸 수 없다. |
| [1356](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1356) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1357](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1357) |   actualOutcome?: ActualOutcome; | 데이터 필드 | 실행·검증 ObservationVersion ref이다. 실행 전에는 부재를 unknown과 구분한다. |
| [1358](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1358) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1359](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1359) |   dependencies: Edge[]; | 데이터 필드 | graphVersion에 고정된 typed edge refs이다. |
| [1360](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1360) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1361](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1361) |   assumptions: AssumptionRef[]; | 데이터 필드 | 버전 가정 refs와 consumer index를 연결한다. |
| [1362](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1362) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1363](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1363) |   boundaryContract?: Contract; | 데이터 필드 | PlanningBoundaryVersion의 observable contract ref이다. 미정이면 보존 proof를 발급하지 않는다. |
| [1364](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1364) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1365](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1365) |   status: PlanStatus; | 데이터 필드 | 계획 유효/실행/검증 상태를 기존 task 상태와 혼동하지 않게 분리한다. |
| [1366](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1366) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1367](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1367) |   predictionError: number; | 데이터 필드 | C/B/D/G·SPE·evidence를 가진 PredictionErrorVersion ref로 구체화한다. |
| [1368](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1368) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1369](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1369) |   invalidationReason?: EvidenceRef[]; | 데이터 필드 | 재계획을 정당화하는 exact EvidenceVersion refs이다. 일반 이유 문자열로 대체하지 않는다. |
| [1370](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1370) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1371](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1371) |   planVersion: number; | 데이터 필드 | append-only revision reference이며 base version CAS에 사용한다. |
| [1372](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1372) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1373](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1373) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1374](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1374) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1375](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1375) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1376](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1376) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B40 — Change Event

원문 1377–1396행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b40)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1377](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1377) | # 40. Change Event | 제목 | PlanChangeEvent는 sourceTask/before/after/signature/evidence/timestamp를 갖는다. |
| [1378](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1378) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1379](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1379) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1380](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1380) | interface PlanChangeEvent { | 타입 선언 | PlanChangeEvent의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1381](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1381) |   sourceTask: TaskId; | 데이터 필드 | 변경 source task이다. 환경/contract source는 공통 event entity로 추가 표현한다. |
| [1382](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1382) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1383](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1383) |   before: SemanticState; | 데이터 필드 | 이전 SemanticState의 불변 ref와 input vector이다. |
| [1384](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1384) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1385](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1385) |   after: SemanticState; | 데이터 필드 | 관찰된 새 SemanticState의 불변 ref이다. |
| [1386](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1386) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1387](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1387) |   changeSignature: ChangeSignature; | 데이터 필드 | 여러 scope·크기·confidence·근거가 고정된 signature ref이다. |
| [1388](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1388) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1389](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1389) |   evidence: EvidenceRef[]; | 데이터 필드 | before/after 차이와 분류를 뒷받침하는 exact evidence이다. |
| [1390](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1390) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1391](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1391) |   timestamp: number; | 데이터 필드 | 변경 관찰시각이며 causation/sequence와 함께 episode를 정의한다. |
| [1392](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1392) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1393](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1393) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1394](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1394) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1395](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1395) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1396](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1396) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B41 — Replanning 알고리즘

원문 1397–1438행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b41)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1397](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1397) | # 41. Replanning 알고리즘 | 제목 | 비교→오차→preserve/classify→typed closure→boundary cut→impact→무효화→region→replan→검증→통합→commit의 16단계를 구현한다. |
| [1398](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1398) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1399](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1399) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1400](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1400) | INPUT: | 예시·흐름 | 입력은 graph/revision/input vector가 고정된 change episode이다. |
| [1401](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1401) | changed task x | 예시·흐름 | source task x와 before/after/evidence를 고정한다. 복수 변화는 source 집합으로 확장한다. |
| [1402](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1402) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1403](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1403) | 1. Compare expected and actual state | 예시·흐름 | 실행 전 ExpectationVersion과 실제 ObservationVersion을 동일 observable port로 투영한다. |
| [1404](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1404) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1405](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1405) | 2. Compute semantic prediction error | 예시·흐름 | C/B/D/G 거리와 가중 SPE를 근거·unknown·calculator version과 함께 계산한다. |
| [1406](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1406) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1407](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1407) | 3. If below threshold: | 예시·흐름 | critical violation/미해결 unknown이 없고 정책상 안정 조건을 만족하는지 확인한다. |
| [1408](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1408) |        preserve plan | 예시·흐름 | 기존 plan/spec/decision을 그대로 두고 preservation reason과 input vector만 기록한다. |
| [1409](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1409) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1410](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1410) | 4. Classify change | 예시·흐름 | 8개 scope 중 실제 변화 유형을 근거로 선택하며 복합 scope를 허용한다. |
| [1411](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1411) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1412](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1412) | 5. Select relevant edge types | 예시·흐름 | change scope와 relation registry의 propagation matrix를 적용한다. |
| [1413](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1413) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1414](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1414) | 6. Traverse causal graph | 예시·흐름 | source→consumer 인덱스를 따라가며 graphVersion·visited·critical path를 기록한다. |
| [1415](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1415) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1416](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1416) | 7. Build affected closure | 예시·흐름 | source 자신과 모든 관련 도달 node를 중복 없이 집계한다. |
| [1417](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1417) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1418](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1418) | 8. Stop propagation at preserved boundaries | 예시·흐름 | 완전한 external projection equality와 read completeness proof가 있는 exit arc만 절단한다. |
| [1419](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1419) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1420](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1420) | 9. Calculate impact for affected nodes | 예시·흐름 | noncritical에 max-product delta, critical에 hard reachability를 계산한다. |
| [1421](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1421) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1422](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1422) | 10. Preserve nodes below threshold | 예시·흐름 | 비필수 speculative replan만 보류한다. required/unknown validation 의무는 보존한다. |
| [1423](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1423) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1424](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1424) | 11. Invalidate remaining nodes | 예시·흐름 | 증거·scope·version을 고정하여 stale/fence/stop 의무를 생성하고 비영향 worker는 유지한다. |
| [1425](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1425) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1426](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1426) | 12. Find lowest common affected planning boundary | 예시·흐름 | LCA를 후보로 추가하고 더 작은 feasible boundary/connected union도 비용 비교한다. |
| [1427](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1427) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1428](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1428) | 13. Replan only that subgraph | 예시·흐름 | 서버가 발급한 ReplanLease의 영역·immutable set 안에서만 structured patch를 받는다. |
| [1429](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1429) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1430](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1430) | 14. Run deterministic validation | 예시·흐름 | patch의 요구 coverage·참조·DAG·scope·expectation·critical constraints를 검증한다. |
| [1431](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1431) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1432](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1432) | 15. Run integration validation if boundaries intersect | 예시·흐름 | 교차 boundary/resource의 exact output tuple에 joint obligation을 수행한다. |
| [1433](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1433) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1434](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1434) | 16. Commit new plan version | 예시·흐름 | 검증 evidence·lease generation·base revision CAS가 일치할 때 append-only revision head를 바꾼다. |
| [1435](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1435) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1436](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1436) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1437](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1437) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1438](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1438) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B42 — Lowest Common Replanning Ancestor

원문 1439–1470행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b42)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1439](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1439) | # 42. Lowest Common Replanning Ancestor | 제목 | 상호작용하는 affected node의 LCA는 공동 재계획 후보다. |
| [1440](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1440) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1441](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1441) | A1과 A2가 동시에 영향을 받았다고 하자. | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1442](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1442) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1443](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1443) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1444](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1444) | A | 예시·흐름 | 검증 fixture: T08: A1/A2 상호작용은 A 후보를 만들지만 자동 채택하지 않는다. 구현: LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1445](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1445) | ├─ A1 | 예시·흐름 | 검증 fixture: T08: A1/A2 상호작용은 A 후보를 만들지만 자동 채택하지 않는다. 구현: LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1446](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1446) | └─ A2 | 예시·흐름 | 검증 fixture: T08: A1/A2 상호작용은 A 후보를 만들지만 자동 채택하지 않는다. 구현: LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1447](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1447) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1448](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1448) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1449](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1449) | 각각 따로 재계획할 수도 있지만 두 변경이 상호작용한다면 A 수준에서 계획해야 한다. | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1450](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1450) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1451](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1451) | affected nodes 집합을 | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1452](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1452) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1453](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1453) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1454](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1454) | X=\{x_1,x_2,\dots,x_n\} | 수식 본문 | 식 전체의 구현 계약: LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. 검증: T08: A1/A2 상호작용은 A 후보를 만들지만 자동 채택하지 않는다. |
| [1455](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1455) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1456](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1456) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1457](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1457) | 이라고 하자. | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1458](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1458) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1459](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1459) | 트리형 계획에서는 | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1460](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1460) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1461](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1461) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1462](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1462) | LCA(X) | 수식 본문 | 식 전체의 구현 계약: LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. 검증: T08: A1/A2 상호작용은 A 후보를 만들지만 자동 채택하지 않는다. |
| [1463](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1463) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1464](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1464) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1465](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1465) | 를 계산할 수 있다. | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1466](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1466) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1467](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1467) | 이를 **Lowest Common Replanning Ancestor**로 사용한다. | 설명·요구 | LCA를 후보 registry에 추가하되 교차 인과 관계·더 작은 region도 함께 평가한다. |
| [1468](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1468) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1469](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1469) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1470](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1470) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B43 — 하지만 무조건 LCA까지 올라가지는 않는다

원문 1471–1498행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b43)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1471](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1471) | # 43. 하지만 무조건 LCA까지 올라가지는 않는다 | 제목 | ContainsAffected와 RestoreConsistency를 만족하는 최소 비용 boundary가 실제 선택이다. |
| [1472](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1472) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1473](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1473) | LCA는 candidate boundary다. | 설명·요구 | 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. |
| [1474](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1474) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1475](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1475) | contract가 유지된다면 더 작은 영역에서 해결할 수도 있다. | 설명·요구 | 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. |
| [1476](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1476) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1477](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1477) | 따라서 실제 replanning boundary는 | 설명·요구 | 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. |
| [1478](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1478) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1479](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1479) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1480](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1480) | B^* | 수식 본문 | 식 전체의 구현 계약: 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. 검증: T08: LCA보다 작은 유효 region을 선택하고 외부 invariant 깨진 작은 후보는 거절한다. |
| [1481](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1481) | = | 수식 본문 | 식 전체의 구현 계약: 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. 검증: T08: LCA보다 작은 유효 region을 선택하고 외부 invariant 깨진 작은 후보는 거절한다. |
| [1482](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1482) | \arg\min_B Cost(B) | 수식 본문 | 식 전체의 구현 계약: 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. 검증: T08: LCA보다 작은 유효 region을 선택하고 외부 invariant 깨진 작은 후보는 거절한다. |
| [1483](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1483) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1484](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1484) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1485](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1485) | subject to | 설명·요구 | 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. |
| [1486](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1486) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1487](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1487) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1488](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1488) | ContainsAffected(B)=True | 수식 본문 | 식 전체의 구현 계약: 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. 검증: T08: LCA보다 작은 유효 region을 선택하고 외부 invariant 깨진 작은 후보는 거절한다. |
| [1489](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1489) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1490](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1490) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1491](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1491) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1492](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1492) | RestoreConsistency(B)=True | 수식 본문 | 식 전체의 구현 계약: 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. 검증: T08: LCA보다 작은 유효 region을 선택하고 외부 invariant 깨진 작은 후보는 거절한다. |
| [1493](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1493) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1494](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1494) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1495](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1495) | 이다. | 설명·요구 | 외부 contract 보존을 feasibility predicate로 넣고 후보별 비용/탈락 이유/최적성 증거를 남긴다. |
| [1496](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1496) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1497](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1497) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1498](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1498) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B44 — Multi-Change 문제

원문 1499–1519행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b44)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1499](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1499) | # 44. Multi-Change 문제 | 제목 | 여러 change는 독립이면 별도, closure가 겹치면 joint 처리한다. |
| [1500](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1500) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1501](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1501) | 현실에서는 하나의 변경만 발생하지 않는다. | 설명·요구 | 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. |
| [1502](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1502) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1503](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1503) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1504](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1504) | C= | 수식 본문 | 식 전체의 구현 계약: 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. 검증: T09: 3개 change가 간접 overlap하면 한 연결 성분으로 병합된다. |
| [1505](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1505) | \{c_1,c_2,\dots,c_n\} | 수식 본문 | 식 전체의 구현 계약: 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. 검증: T09: 3개 change가 간접 overlap하면 한 연결 성분으로 병합된다. |
| [1506](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1506) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1507](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1507) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1508](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1508) | 여러 변경이 독립적이면 각각 처리할 수 있다. | 설명·요구 | 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. |
| [1509](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1509) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1510](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1510) | 하지만 affected closure가 겹치면 | 설명·요구 | 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. |
| [1511](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1511) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1512](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1512) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1513](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1513) | A(c_i)\cap A(c_j)\neq\emptyset | 수식 본문 | 식 전체의 구현 계약: 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. 검증: T09: 3개 change가 간접 overlap하면 한 연결 성분으로 병합된다. |
| [1514](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1514) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1515](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1515) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1516](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1516) | joint replanning이 필요하다. | 설명·요구 | 동일 episode source 집합과 overlap graph를 유지하고 새 event에서 region generation을 갱신한다. |
| [1517](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1517) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1518](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1518) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1519](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1519) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B45 — Replanning Merge Rule

원문 1520–1550행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b45)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1520](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1520) | # 45. Replanning Merge Rule | 제목 | Ai∩Aj가 비면 병렬, 아니면 merge affected regions 후 공동 재계획한다. |
| [1521](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1521) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1522](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1522) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1523](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1523) | A_i\cap A_j=\emptyset | 수식 본문 | 식 전체의 구현 계약: causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. 검증: T09: 파일 경로가 달라도 공유 contract overlap은 공동 계획이며 독립이면 병렬이다. |
| [1524](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1524) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1525](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1525) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1526](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1526) | 이면 | 설명·요구 | causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1527](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1527) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1528](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1528) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1529](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1529) | parallel local replanning | 예시·흐름 | 검증 fixture: T09: 파일 경로가 달라도 공유 contract overlap은 공동 계획이며 독립이면 병렬이다. 구현: causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1530](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1530) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1531](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1531) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1532](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1532) | 가능하다. | 설명·요구 | causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1533](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1533) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1534](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1534) | 반대로 | 설명·요구 | causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1535](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1535) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1536](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1536) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1537](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1537) | A_i\cap A_j\neq\emptyset | 수식 본문 | 식 전체의 구현 계약: causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. 검증: T09: 파일 경로가 달라도 공유 contract overlap은 공동 계획이며 독립이면 병렬이다. |
| [1538](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1538) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1539](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1539) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1540](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1540) | 이면 | 설명·요구 | causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1541](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1541) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1542](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1542) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1543](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1543) | merge affected regions | 예시·흐름 | 검증 fixture: T09: 파일 경로가 달라도 공유 contract overlap은 공동 계획이며 독립이면 병렬이다. 구현: causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1544](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1544) | → joint replanning | 예시·흐름 | 검증 fixture: T09: 파일 경로가 달라도 공유 contract overlap은 공동 계획이며 독립이면 병렬이다. 구현: causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1545](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1545) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1546](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1546) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1547](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1547) | 한다. | 설명·요구 | causal/boundary/resource overlap과 물리 write locks를 별개로 검사하고 독립 region에 개별 lease를 준다. |
| [1548](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1548) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1549](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1549) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1550](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1550) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B46 — 이로써 이전 설계의 통합 문제와 연결된다

원문 1551–1574행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b46)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1551](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1551) | # 46. 이로써 이전 설계의 통합 문제와 연결된다 | 제목 | A1/B2의 shared boundary 교차는 integration event를 만든다. |
| [1552](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1552) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1553](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1553) | 예: | 설명·요구 | 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1554](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1554) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1555](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1555) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1556](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1556) | A1 변경 ───┐ | 예시·흐름 | 검증 fixture: T09,T10: 별개 branch에서 만든 정상 결과의 조합 불일치를 검출한다. 구현: 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1557](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1557) |            ├── Shared Boundary X | 예시·흐름 | 검증 fixture: T09,T10: 별개 branch에서 만든 정상 결과의 조합 불일치를 검출한다. 구현: 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1558](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1558) | B2 변경 ───┘ | 예시·흐름 | 검증 fixture: T09,T10: 별개 branch에서 만든 정상 결과의 조합 불일치를 검출한다. 구현: 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1559](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1559) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1560](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1560) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1561](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1561) | 둘을 개별적으로 처리하면 둘 다 정상일 수 있다. | 설명·요구 | 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1562](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1562) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1563](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1563) | 하지만 | 설명·요구 | 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1564](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1564) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1565](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1565) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1566](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1566) | A(A1)\cap A(B2) | 수식 본문 | 식 전체의 구현 계약: 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. 검증: T09,T10: 별개 branch에서 만든 정상 결과의 조합 불일치를 검출한다. |
| [1567](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1567) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1568](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1568) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1569](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1569) | 에 Shared Boundary X가 존재한다. | 설명·요구 | 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1570](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1570) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1571](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1571) | 따라서 Integration Event를 발생시킨다. | 설명·요구 | 병합 region과 boundary member output tuple로 IntegrationRequired를 생성한다. |
| [1572](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1572) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1573](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1573) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1574](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1574) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B47 — Prediction Error를 node마다 유지한다

원문 1575–1609행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b47)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1575](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1575) | # 47. Prediction Error를 node마다 유지한다 | 제목 | node별 epsilon과 parent max 또는 weighted accumulation을 유지한다. |
| [1576](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1576) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1577](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1577) | 각 태스크의 prediction error를 | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1578](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1578) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1579](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1579) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1580](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1580) | \epsilon_i | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1581](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1581) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1582](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1582) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1583](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1583) | 라고 한다. | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1584](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1584) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1585](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1585) | 상위 subgoal error는 자식 error로부터 계산할 수 있다. | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1586](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1586) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1587](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1587) | 단순하게는 | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1588](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1588) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1589](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1589) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1590](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1590) | \epsilon_{parent} | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1591](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1591) | = | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1592](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1592) | \max_i\epsilon_i | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1593](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1593) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1594](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1594) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1595](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1595) | 를 사용할 수 있다. | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1596](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1596) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1597](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1597) | 또는 중요도에 따라 | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1598](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1598) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1599](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1599) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1600](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1600) | \epsilon_{parent} | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1601](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1601) | = | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1602](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1602) | 1- | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1603](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1603) | \prod_i(1-w_i\epsilon_i) | 수식 본문 | 식 전체의 구현 계약: PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. 검증: T07: 작은 자식 오류와 중요한 큰 오류의 집계 결과·모델 버전이 재현된다. |
| [1604](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1604) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1605](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1605) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1606](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1606) | 를 사용할 수 있다. | 설명·요구 | PredictionErrorVersion을 부모 집계에 연결하고 max/weighted model과 가정을 기록한다. |
| [1607](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1607) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1608](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1608) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1609](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1609) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B48 — Error가 위로 올라가는 조건

원문 1610–1633행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b48)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1610](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1610) | # 48. Error가 위로 올라가는 조건 | 제목 | 작은 오류는 local repair하고 큰 오류라도 local invariant 복구 불가일 때만 부모에 전달한다. |
| [1611](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1611) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1612](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1612) | 모든 작은 오류를 상위로 올리면 안 된다. | 설명·요구 | local repair outcome과 violated invariant refs를 함께 평가한다. |
| [1613](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1613) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1614](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1614) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1615](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1615) | \epsilon_{child}&lt;\theta_{local} | 수식 본문 | 식 전체의 구현 계약: local repair outcome과 violated invariant refs를 함께 평가한다. 검증: T08: 높은 error라도 local repair 성공이면 parent replan run이 없다. |
| [1616](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1616) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1617](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1617) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1618](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1618) | 이면 local repair한다. | 설명·요구 | local repair outcome과 violated invariant refs를 함께 평가한다. |
| [1619](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1619) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1620](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1620) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1621](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1621) | \epsilon_{child}\ge\theta_{local} | 수식 본문 | 식 전체의 구현 계약: local repair outcome과 violated invariant refs를 함께 평가한다. 검증: T08: 높은 error라도 local repair 성공이면 parent replan run이 없다. |
| [1622](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1622) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1623](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1623) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1624](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1624) | 이고 local invariant를 복구할 수 없다면 | 설명·요구 | local repair outcome과 violated invariant refs를 함께 평가한다. |
| [1625](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1625) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1626](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1626) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1627](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1627) | \epsilon | 수식 본문 | 식 전체의 구현 계약: local repair outcome과 violated invariant refs를 함께 평가한다. 검증: T08: 높은 error라도 local repair 성공이면 parent replan run이 없다. |
| [1628](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1628) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1629](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1629) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1630](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1630) | 을 parent로 전달한다. | 설명·요구 | local repair outcome과 violated invariant refs를 함께 평가한다. |
| [1631](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1631) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1632](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1632) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1633](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1633) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B49 — Error Escalation

원문 1634–1654행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b49)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1634](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1634) | # 49. Error Escalation | 제목 | A1 local 실패→A invariant 실패→parent→goal의 조건부 escalation이다. |
| [1635](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1635) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1636](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1636) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1637](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1637) | A1 error | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1638](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1638) |  │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1639](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1639) |  │ local repair failed | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1640](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1640) |  ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1641](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1641) | A error | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1642](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1642) |  │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1643](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1643) |  │ subgoal invariant failed | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1644](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1644) |  ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1645](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1645) | Parent error | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1646](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1646) |  │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1647](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1647) |  ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1648](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1648) | Goal replanning | 예시·흐름 | 검증 fixture: T02,T08: 작은 변화 처리 중 상위 역할은 dormant를 유지한다. 구현: 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1649](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1649) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1650](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1650) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1651](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1651) | 따라서 상위 에이전트는 작은 변화에 잠든 상태를 유지한다. | 설명·요구 | 각 경계 실패 event만 다음 level의 activation 후보로 만든다. |
| [1652](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1652) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1653](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1653) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1654](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1654) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B50 — Adaptive Task Granularity

원문 1655–1664행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b50)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1655](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1655) | # 50. Adaptive Task Granularity | 제목 | 실패 많은 영역은 split, 안정된 연속 작업은 routine chunk로 granularity를 학습한다. |
| [1656](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1656) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1657](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1657) | 인간의 행동 segmentation을 응용하면 태스크 분할 크기도 고정적일 필요가 없다. | 설명·요구 | 관찰 집계·분해 정책·routine 버전과 scoped revision을 연결한다. |
| [1658](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1658) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1659](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1659) | prediction error가 자주 발생하는 영역은 더 세밀하게 분할할 수 있다. | 설명·요구 | 관찰 집계·분해 정책·routine 버전과 scoped revision을 연결한다. |
| [1660](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1660) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1661](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1661) | 반대로 항상 안정적인 연속 태스크들은 하나의 routine으로 합칠 수 있다. | 설명·요구 | 관찰 집계·분해 정책·routine 버전과 scoped revision을 연결한다. |
| [1662](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1662) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1663](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1663) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1664](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1664) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B51 — Split Rule

원문 1665–1698행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b51)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1665](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1665) | # 51. Split Rule | 제목 | alpha*F+beta*U+gamma*R가 split threshold를 넘는지 본다. |
| [1666](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1666) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1667](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1667) | 태스크 \(T\)의 내부 실패 빈도를 | 설명·요구 | 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. |
| [1668](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1668) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1669](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1669) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1670](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1670) | F_T | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1671](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1671) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1672](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1672) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1673](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1673) | 불확실성을 | 설명·요구 | 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. |
| [1674](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1674) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1675](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1675) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1676](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1676) | U_T | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1677](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1677) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1678](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1678) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1679](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1679) | 재계획 빈도를 | 설명·요구 | 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. |
| [1680](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1680) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1681](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1681) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1682](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1682) | R_T | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1683](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1683) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1684](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1684) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1685](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1685) | 라고 하자. | 설명·요구 | 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. |
| [1686](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1686) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1687](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1687) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1688](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1688) | \alpha F_T+ | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1689](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1689) | \beta U_T+ | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1690](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1690) | \gamma R_T | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1691](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1691) | &gt; | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1692](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1692) | \theta_{split} | 수식 본문 | 식 전체의 구현 계약: 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. 검증: T12: 한 번 실패를 높은 빈도로 과장하지 않고 비용이 큰 무의미 분할은 거절한다. |
| [1693](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1693) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1694](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1694) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1695](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1695) | 이면 하위 태스크로 추가 분해한다. | 설명·요구 | 관측 window·분모·weights·threshold를 versioned policy로 두고 분할 비용/검증 가능성과 함께 평가한다. |
| [1696](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1696) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1697](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1697) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1698](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1698) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B52 — Merge Rule

원문 1699–1724행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b52)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1699](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1699) | # 52. Merge Rule | 제목 | 함께 실행되고 independent change 확률이 매우 낮은 태스크를 reusable routine으로 합친다. |
| [1700](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1700) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1701](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1701) | 반대로 여러 태스크가 항상 함께 실행되고 독립적인 재계획이 거의 발생하지 않는다면 | 설명·요구 | 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1702](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1702) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1703](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1703) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1704](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1704) | P(independent\ change)\approx0 | 수식 본문 | 식 전체의 구현 계약: 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. 검증: T12: 내부 단계를 복구할 수 있고 외부 dependency가 합치기 전후 동일하다. |
| [1705](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1705) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1706](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1706) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1707](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1707) | 이다. | 설명·요구 | 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1708](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1708) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1709](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1709) | 그렇다면 하나의 reusable routine으로 합칠 수 있다. | 설명·요구 | 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1710](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1710) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1711](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1711) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1712](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1712) | A1 | 예시·흐름 | 검증 fixture: T12: 내부 단계를 복구할 수 있고 외부 dependency가 합치기 전후 동일하다. 구현: 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1713](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1713) | A2 | 예시·흐름 | 검증 fixture: T12: 내부 단계를 복구할 수 있고 외부 dependency가 합치기 전후 동일하다. 구현: 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1714](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1714) | A3 | 예시·흐름 | 검증 fixture: T12: 내부 단계를 복구할 수 있고 외부 dependency가 합치기 전후 동일하다. 구현: 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1715](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1715) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1716](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1716) | ↓ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1717](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1717) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1718](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1718) | Routine A | 예시·흐름 | 검증 fixture: T12: 내부 단계를 복구할 수 있고 외부 dependency가 합치기 전후 동일하다. 구현: 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. |
| [1719](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1719) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1720](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1720) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1721](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1721) | 이는 인간이 자주 반복하는 행동을 chunk화하는 것과 유사한 계산적 전략이다. 계층적 강화학습 연구에서도 temporally extended behaviors와 reusable subroutines를 이용하여 큰 문제를 구조화하는 접근이 핵심이다. citeturn628734search7 | 설명·요구 | 충분한 표본·불확실성·외부 port 불변성을 확인하고 member lineage/내부 checkpoints를 보존한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [1722](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1722) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1723](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1723) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1724](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1724) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B53 — 따라서 태스크 그래프 자체도 학습한다

원문 1725–1748행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b53)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1725](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1725) | # 53. 따라서 태스크 그래프 자체도 학습한다 | 제목 | 큰 task split/공동 실행 chunk/공동 실패 integration boundary/독립 변화 separate boundary 네 구조를 배운다. |
| [1726](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1726) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1727](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1727) | 처음의 decomposition이 영구적이지 않다. | 설명·요구 | 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1728](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1728) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1729](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1729) | 시스템은 실행 경험으로부터 | 설명·요구 | 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1730](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1730) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1731](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1731) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1732](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1732) | 너무 큰 task | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1733](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1733) | → split | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1734](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1734) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1735](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1735) | 항상 함께 움직이는 tasks | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1736](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1736) | → chunk | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1737](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1737) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1738](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1738) | 자주 함께 실패하는 tasks | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1739](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1739) | → integration boundary | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1740](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1740) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1741](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1741) | 독립적으로 변하는 영역 | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1742](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1742) | → separate boundary | 예시·흐름 | 검증 fixture: T12: 각 변환 후 causal completeness·boundary proof·기존 artifact lineage를 다시 검증한다. 구현: 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1743](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1743) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1744](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1744) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1745](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1745) | 를 학습한다. | 설명·요구 | 네 proposal target을 graph schema·feasibility·shadow evaluator에 연결한다. |
| [1746](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1746) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1747](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1747) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1748](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1748) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B54 — Predictive Task Graph

원문 1749–1779행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b54)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1749](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1749) | # 54. Predictive Task Graph | 제목 | PredictiveEdge의 from/to/relation/impactWeight/changeTypes/observedPropagationRate를 모두 저장한다. |
| [1750](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1750) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1751](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1751) | 결국 Task Graph를 단순 dependency graph에서 다음 형태로 확장한다. | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1752](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1752) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1753](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1753) | 각 edge에 | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1754](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1754) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1755](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1755) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1756](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1756) | interface PredictiveEdge { | 타입 선언 | PredictiveEdge의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [1757](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1757) |   from: TaskId; | 데이터 필드 | 생산자 source entity/port ref로 확장한다. |
| [1758](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1758) |   to: TaskId; | 데이터 필드 | 영향받는 consumer entity/port ref로 확장한다. |
| [1759](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1759) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1760](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1760) |   relation: RelationType; | 데이터 필드 | typed relation registry의 값이며 scope별 전파 의미가 필수다. |
| [1761](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1761) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1762](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1762) |   impactWeight: number; | 데이터 필드 | [0,1] noncritical 영향 가중치이다. critical은 항상 hard/1이다. |
| [1763](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1763) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1764](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1764) |   changeTypes: ChangeType[]; | 데이터 필드 | 해당 edge를 통과하는 ChangeScope 집합이다. |
| [1765](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1765) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1766](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1766) |   observedPropagationRate: number; | 데이터 필드 | 성공/시도/미관측 구분·추정값·모델 버전으로 확장한다. 재실행 수를 semantic 영향 수로 세지 않는다. |
| [1767](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1767) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [1768](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1768) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1769](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1769) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1770](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1770) | 를 기록한다. | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1771](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1771) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1772](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1772) | 즉 시스템은 | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1773](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1773) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1774](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1774) | &gt; 이 태스크가 바뀌면 저 태스크도 얼마나 자주 바뀌는가? | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1775](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1775) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1776](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1776) | 를 학습한다. | 설명·요구 | CausalEdgeVersion에 evidence와 sample counts/modelVersion을 더해 원문 필드를 구체화한다. |
| [1777](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1777) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1778](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1778) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1779](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1779) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B55 — Empirical Propagation Probability

원문 1780–1807행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b55)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1780](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1780) | # 55. Empirical Propagation Probability | 제목 | P(v changes&#124;u changes)를 관측해 noncritical weight를 갱신한다. |
| [1781](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1781) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1782](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1782) | 과거 실행에서 | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1783](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1783) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1784](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1784) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1785](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1785) | P(v\ changes\mid u\ changes) | 수식 본문 | 식 전체의 구현 계약: semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. 검증: T12: 단지 실행했다는 이유로 propagation 성공 label이 되지 않는다. |
| [1786](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1786) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1787](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1787) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1788](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1788) | 를 추정할 수 있다. | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1789](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1789) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1790](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1790) | 이를 | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1791](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1791) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1792](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1792) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1793](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1793) | p_{uv} | 수식 본문 | 식 전체의 구현 계약: semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. 검증: T12: 단지 실행했다는 이유로 propagation 성공 label이 되지 않는다. |
| [1794](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1794) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1795](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1795) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1796](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1796) | 라고 하자. | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1797](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1797) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1798](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1798) | edge weight를 | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1799](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1799) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1800](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1800) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1801](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1801) | w_{uv}=p_{uv} | 수식 본문 | 식 전체의 구현 계약: semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. 검증: T12: 단지 실행했다는 이유로 propagation 성공 label이 되지 않는다. |
| [1802](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1802) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1803](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1803) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1804](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1804) | 로 업데이트할 수 있다. | 설명·요구 | semantic delta 검증으로 successes/trials를 만들고 미검토 node는 censored로 남긴다. |
| [1805](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1805) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1806](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1806) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1807](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1807) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B56 — 예상 영향도

원문 1808–1829행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b56)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1808](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1808) | # 56. 예상 영향도 | 제목 | 경로 확률 곱은 단순 근사이며 낮으면 speculative replanning을 생략한다. |
| [1809](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1809) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1810](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1810) | 경로 | 설명·요구 | product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. |
| [1811](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1811) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1812](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1812) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1813](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1813) | u\rightarrow a\rightarrow b\rightarrow v | 수식 본문 | 식 전체의 구현 계약: product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. 검증: T05,T12: 낮은 경로 확률이 필수 interface 검증을 차단하지 않는다. |
| [1814](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1814) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1815](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1815) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1816](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1816) | 가 있다면 단순 모델에서는 | 설명·요구 | product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. |
| [1817](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1817) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1818](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1818) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1819](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1819) | P(v&#124;u) | 수식 본문 | 식 전체의 구현 계약: product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. 검증: T05,T12: 낮은 경로 확률이 필수 interface 검증을 차단하지 않는다. |
| [1820](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1820) | \approx | 수식 본문 | 식 전체의 구현 계약: product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. 검증: T05,T12: 낮은 경로 확률이 필수 interface 검증을 차단하지 않는다. |
| [1821](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1821) | p_{ua}p_{ab}p_{bv} | 수식 본문 | 식 전체의 구현 계약: product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. 검증: T05,T12: 낮은 경로 확률이 필수 interface 검증을 차단하지 않는다. |
| [1822](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1822) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1823](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1823) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1824](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1824) | 로 볼 수 있다. | 설명·요구 | product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. |
| [1825](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1825) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1826](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1826) | 값이 충분히 낮으면 speculative replanning을 생략한다. | 설명·요구 | product를 speculative score로 표시하고 상관·모델 가정/불확실성을 보존한다. hard 검사에는 사용하지 않는다. |
| [1827](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1827) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1828](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1828) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1829](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1829) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B57 — 단 Critical Constraint는 확률화하지 않는다

원문 1830–1846행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b57)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1830](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1830) | # 57. 단 Critical Constraint는 확률화하지 않는다 | 제목 | type/security/schema/interface/transaction/user requirement는 확률로 skip할 수 없다. |
| [1831](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1831) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1832](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1832) | 다음 관계는 probability로 skip해서는 안 된다. | 설명·요구 | critical reachability/obligation을 별도 계산하고 learned weights·budget·hysteresis보다 우선한다. |
| [1833](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1833) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1834](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1834) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1835](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1835) | type safety | 예시·흐름 | 타입 제약 위반은 SPE/관측 전파 확률이 낮아도 hard 의무다. |
| [1836](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1836) | security invariant | 예시·흐름 | 보안 불변조건은 learned skip과 비용 효율 점수의 적용 대상이 아니다. |
| [1837](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1837) | schema validity | 예시·흐름 | 필수 데이터 schema의 유효성은 deterministic validator로 확인한다. |
| [1838](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1838) | required interface | 예시·흐름 | 사용자가 요구한 port/protocol contract는 consumer까지 반드시 전파한다. |
| [1839](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1839) | transaction correctness | 예시·흐름 | 원자성·일관성 요구는 확률/예산 부족을 이유로 satisfied 처리하지 않는다. |
| [1840](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1840) | explicit user requirement | 예시·흐름 | 명시 요구는 critical source/obligation으로 저장하고 일반 학습이 완화하지 못한다. |
| [1841](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1841) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1842](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1842) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1843](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1843) | 이들은 deterministic propagation이다. | 설명·요구 | critical reachability/obligation을 별도 계산하고 learned weights·budget·hysteresis보다 우선한다. |
| [1844](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1844) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1845](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1845) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1846](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1846) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B58 — 인간에게서 가져올 다섯 번째 원리: Replay

원문 1847–1854행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b58)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1847](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1847) | # 58. 인간에게서 가져올 다섯 번째 원리: Replay | 제목 | replay는 과거 경험을 선택적으로 재검토하는 계산 전략이다. |
| [1848](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1848) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1849](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1849) | 인간의 planning과 memory 연구에서는 predictive representation과 replay가 학습 및 계획 구조를 갱신하는 데 중요한 계산적 개념으로 연구되고 있다. 특히 모든 경험을 동일하게 다시 처리하기보다 중요한 상태를 우선적으로 replay하는 모델들이 인간 행동과 신경 representation을 설명하는 데 사용된다. citeturn628734search9 | 설명·요구 | 당시 snapshot과 evidence를 고정한 ReplayJob을 만들고 우선순위·budget·결과를 기록한다. 원문의 citation 토큰은 서지로 복원되지 않았으므로 과학적 증명이나 구현 완료 근거로 사용하지 않는다. |
| [1850](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1850) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1851](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1851) | 에이전트에서도 이것을 사용할 수 있다. | 설명·요구 | 당시 snapshot과 evidence를 고정한 ReplayJob을 만들고 우선순위·budget·결과를 기록한다. |
| [1852](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1852) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1853](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1853) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1854](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1854) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B59 — Prioritized Replay

원문 1855–1874행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b59)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1855](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1855) | # 59. Prioritized Replay | 제목 | Priority=PredictionError*Impact*Risk로 높은 가치부터 재검토한다. |
| [1856](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1856) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1857](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1857) | 변경 후 전체 history를 다시 평가하지 않는다. | 설명·요구 | 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. |
| [1858](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1858) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1859](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1859) | priority를 계산한다. | 설명·요구 | 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. |
| [1860](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1860) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1861](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1861) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1862](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1862) | Priority(v) | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1863](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1863) | = | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1864](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1864) | PredictionError(v) | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1865](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1865) | \times | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1866](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1866) | Impact(v) | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1867](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1867) | \times | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1868](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1868) | Risk(v) | 수식 본문 | 식 전체의 구현 계약: 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. 검증: T13: 같은 priority의 tie-break와 factor unknown 처리까지 결정적으로 재현한다. |
| [1869](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1869) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1870](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1870) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1871](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1871) | 높은 태스크부터 재검토한다. | 설명·요구 | 각 factor의 정규화·version·관측을 저장하고 mandatory job 우선 원칙을 추가한다. |
| [1872](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1872) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1873](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1873) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1874](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1874) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B60 — 계산 예산이 제한된 경우

원문 1875–1925행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b60)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1875](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1875) | # 60. 계산 예산이 제한된 경우 | 제목 | budget B에서 비용 ci와 가치 Vi로 0/1 replay 선택을 최적화한다. |
| [1876](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1876) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1877](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1877) | 재계획 budget을 | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1878](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1878) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1879](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1879) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1880](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1880) | B | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1881](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1881) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1882](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1882) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1883](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1883) | 라고 하자. | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1884](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1884) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1885](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1885) | 각 node의 재검토 비용이 | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1886](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1886) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1887](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1887) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1888](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1888) | c_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1889](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1889) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1890](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1890) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1891](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1891) | 라면 다음 최적화 문제로 볼 수 있다. | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1892](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1892) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1893](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1893) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1894](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1894) | \max | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1895](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1895) | \sum_i x_iV_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1896](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1896) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1897](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1897) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1898](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1898) | subject to | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1899](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1899) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1900](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1900) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1901](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1901) | \sum_i x_ic_i\le B | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1902](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1902) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1903](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1903) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1904](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1904) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1905](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1905) | x_i\in\{0,1\} | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1906](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1906) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1907](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1907) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1908](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1908) | 여기서 | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1909](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1909) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1910](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1910) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1911](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1911) | V_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1912](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1912) | = | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1913](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1913) | PredictionError_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1914](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1914) | \times | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1915](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1915) | Impact_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1916](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1916) | \times | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1917](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1917) | Risk_i | 수식 본문 | 식 전체의 구현 계약: mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. 검증: T13: 작은 집합은 전수 최적해와 같고 critical 비용이 B 초과면 조용히 skip하지 않는다. |
| [1918](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1918) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1919](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1919) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1920](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1920) | 이다. | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1921](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1921) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1922](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1922) | 즉 모든 것을 재검토하지 못한다면 가장 가치 있는 곳부터 생각한다. | 설명·요구 | mandatory reserve 후 optional solver를 실행하고 feasible/optimality gap 및 미선택 이유를 기록한다. |
| [1923](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1923) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1924](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1924) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1925](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1925) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B61 — 전체 시스템

원문 1926–1972행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b61)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1926](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1926) | # 61. 전체 시스템 | 제목 | CHANGE→오차→preserve/classify→causal→boundary→region→agent→integration→prediction의 전체 대응 흐름이다. |
| [1927](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1927) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1928](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1928) | 최종적으로 변경 대응 시스템은 다음 구조가 된다. | 설명·요구 | CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1929](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1929) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1930](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1930) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [1931](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1931) |                      CHANGE | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1932](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1932) |                         │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1933](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1933) |                         ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1934](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1934) |                 Prediction Error | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1935](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1935) |                         │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1936](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1936) |                  error significant? | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1937](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1937) |                   │             │ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1938](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1938) |                  NO            YES | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1939](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1939) |                   │             │ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1940](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1940) |              preserve       classify | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1941](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1941) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1942](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1942) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1943](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1943) |                        Change Signature | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1944](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1944) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1945](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1945) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1946](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1946) |                        Causal Propagation | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1947](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1947) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1948](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1948) |                 ┌───────────────┼───────────────┐ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1949](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1949) |                 │               │               │ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1950](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1950) |                 ▼               ▼               ▼ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1951](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1951) |             unaffected       affected       critical | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1952](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1952) |                 │               │               │ | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1953](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1953) |               sleep         evaluate        propagate | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1954](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1954) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1955](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1955) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1956](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1956) |                        Boundary Detection | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1957](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1957) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1958](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1958) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1959](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1959) |                       Minimal Replan Region | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1960](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1960) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1961](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1961) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1962](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1962) |                        Replanning Agents | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1963](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1963) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1964](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1964) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1965](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1965) |                         Integration Check | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1966](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1966) |                                 │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1967](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1967) |                                 ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [1968](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1968) |                        Prediction Updated | 예시·흐름 | 검증 fixture: T15: 세 분기와 prediction update까지 하나의 episode trace로 확인한다. 구현: CP pipeline에서 단계 순서를 고정하고 unaffected는 sleep, critical은 hard propagation, affected만 evaluate한다. |
| [1969](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1969) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [1970](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1970) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1971](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1971) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [1972](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1972) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B62 — 에이전트 상태까지 결합

원문 1973–2024행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b62)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [1973](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1973) | # 62. 에이전트 상태까지 결합 | 제목 | AffectedTasks를 먼저 고르고 그 안에서 ActivationPolicy로 ActiveAgents를 고른다. |
| [1974](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1974) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1975](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1975) | Affected Closure의 node만 해당 역할 에이전트를 깨운다. | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [1976](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1976) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1977](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1977) | 따라서 | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [1978](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1978) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1979](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1979) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1980](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1980) | ActiveAgents | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1981](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1981) | = | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1982](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1982) | ActivationPolicy( | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1983](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1983) | AffectedTasks | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1984](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1984) | ) | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1985](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1985) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1986](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1986) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1987](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1987) | 이다. | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [1988](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1988) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1989](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1989) | 즉 두 종류의 sparsity가 중첩된다. | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [1990](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1990) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1991](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1991) | ### Task sparsity | 제목 | AffectedTasks를 먼저 고르고 그 안에서 ActivationPolicy로 ActiveAgents를 고른다. |
| [1992](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1992) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1993](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1993) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [1994](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1994) | V_{active}\subset V | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [1995](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1995) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [1996](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1996) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1997](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1997) | ### Agent sparsity | 제목 | AffectedTasks를 먼저 고르고 그 안에서 ActivationPolicy로 ActiveAgents를 고른다. |
| [1998](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1998) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [1999](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:1999) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2000](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2000) | A_{active}\subset A | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2001](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2001) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2002](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2002) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2003](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2003) | 결과적으로 | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [2004](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2004) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2005](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2005) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2006](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2006) | Cost | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2007](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2007) | \propto | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2008](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2008) | &#124;V_{active}&#124; | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2009](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2009) | \times | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2010](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2010) | &#124;A_{active}&#124; | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2011](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2011) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2012](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2012) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2013](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2013) | 가 된다. | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [2014](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2014) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2015](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2015) | 기존 시스템의 | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [2016](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2016) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2017](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2017) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2018](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2018) | &#124;V&#124;\times&#124;A&#124; | 수식 본문 | 식 전체의 구현 계약: task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. 검증: T02: 100 task/9 role fixture에서 영향 task와 그 필요 role만 실행된다. |
| [2019](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2019) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2020](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2020) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2021](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2021) | 보다 훨씬 작아질 수 있다. | 설명·요구 | task eligibility와 role decision을 별도 저장하고 두 허가를 모두 통과해야 run을 생성한다. |
| [2022](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2022) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2023](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2023) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2024](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2024) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B63 — 이중 Sparse Architecture

원문 2025–2065행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b63)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2025](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2025) | # 63. 이중 Sparse Architecture | 제목 | sparse task/agent/context와 adaptive reasoning을 모두 곱으로 적용한다. |
| [2026](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2026) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2027](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2027) | 따라서 이전 문서에서 정의한 Sparse Agent Architecture를 한 단계 확장한다. | 설명·요구 | grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2028](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2028) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2029](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2029) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2030](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2030) | 전체 Task | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2031](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2031) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2032](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2032) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2033](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2033) | Sparse Task Activation | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2034](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2034) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2035](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2035) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2036](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2036) | Affected Tasks Only | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2037](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2037) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2038](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2038) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2039](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2039) | Sparse Agent Activation | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2040](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2040) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2041](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2041) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2042](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2042) | Required Agents Only | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2043](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2043) |    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2044](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2044) |    ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2045](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2045) | Adaptive Reasoning | 예시·흐름 | 검증 fixture: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. 구현: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2046](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2046) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2047](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2047) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2048](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2048) | 즉 | 설명·요구 | grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2049](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2049) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2050](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2050) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2051](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2051) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2052](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2052) | SparseTask | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2053](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2053) | \times | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2054](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2054) | SparseAgent | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2055](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2055) | \times | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2056](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2056) | SparseContext | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2057](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2057) | \times | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2058](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2058) | AdaptiveReasoning | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2059](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2059) | } | 수식 본문 | 식 전체의 구현 계약: grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. 검증: T02,T04: 어떤 축이든 우회하면 grant 또는 result 채택이 거절된다. |
| [2060](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2060) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2061](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2061) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2062](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2062) | 구조다. | 설명·요구 | grant가 region/role/profile/context manifest를 한 번에 고정하고 네 조건을 검증한다. |
| [2063](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2063) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2064](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2064) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2065](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2065) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B64 — Self-Improvement

원문 2066–2094행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b64)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2066](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2066) | # 64. Self-Improvement | 제목 | 과잉 무효화와 놓친 영향 모두에서 propagation policy를 개선한다. |
| [2067](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2067) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2068](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2068) | 시스템은 다음 것도 학습해야 한다. | 설명·요구 | observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2069](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2069) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2070](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2070) | ### 너무 많이 재계획했다 | 제목 | 과잉 무효화와 놓친 영향 모두에서 propagation policy를 개선한다. |
| [2071](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2071) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2072](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2072) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2073](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2073) | change | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2074](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2074) | → 15 tasks invalidated | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2075](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2075) | → 실제로 2개만 영향 | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2076](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2076) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2077](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2077) | → propagation policy too broad | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2078](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2078) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2079](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2079) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2080](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2080) | ### 너무 적게 재계획했다 | 제목 | 과잉 무효화와 놓친 영향 모두에서 propagation policy를 개선한다. |
| [2081](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2081) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2082](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2082) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2083](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2083) | change | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2084](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2084) | → 2 tasks invalidated | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2085](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2085) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2086](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2086) | later: | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2087](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2087) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2088](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2088) | task 7 failed | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2089](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2089) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2090](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2090) | → missing propagation edge | 예시·흐름 | 검증 fixture: T11: 15개 재검토 중 2개 영향과 누락 task7 실패를 서로 다른 구조 후보로 귀속한다. 구현: observed semantic delta와 later failure lineage를 연결해 과잉/누락 label을 만든다. |
| [2091](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2091) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2092](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2092) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2093](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2093) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2094](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2094) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B65 — Propagation Learning

원문 2095–2111행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b65)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2095](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2095) | # 65. Propagation Learning | 제목 | DetectedImpact-ReplanningCost-MissedImpact reward를 사용하고 중요한 영역은 누락 비용을 높인다. |
| [2096](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2096) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2097](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2097) | 보상을 다음처럼 설정한다. | 설명·요구 | 별도 propagation reward ledger와 risk-stratum 평가를 둔다. |
| [2098](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2098) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2099](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2099) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2100](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2100) | R= | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2101](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2101) | DetectedImpact | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2102](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2102) | - | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2103](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2103) | \alpha ReplanningCost | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2104](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2104) | - | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2105](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2105) | \beta MissedImpact | 수식 본문 | 식 전체의 구현 계약: 별도 propagation reward ledger와 risk-stratum 평가를 둔다. 검증: T13: cheap narrow propagation이 critical missed impact를 늘리면 승격되지 않는다. |
| [2106](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2106) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2107](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2107) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2108](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2108) | MissedImpact의 비용을 크게 설정하면 중요한 영역에서는 더 보수적으로 전파한다. | 설명·요구 | 별도 propagation reward ledger와 risk-stratum 평가를 둔다. |
| [2109](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2109) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2110](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2110) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2111](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2111) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B66 — 구조적 자기개선

원문 2112–2132행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b66)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2112](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2112) | # 66. 구조적 자기개선 | 제목 | 파일명 쌍이 아니라 authentication contract/session representation/consumer 관계를 학습한다. |
| [2113](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2113) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2114](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2114) | 잘못된 학습: | 설명·요구 | 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2115](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2115) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2116](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2116) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2117](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2117) | auth.ts가 바뀌면 UserPage도 다시 봐라. | 예시·흐름 | 검증 fixture: T11: auth.ts/UserPage literal rule은 거절하고 구조 동형 그래프에서 일반화된다. 구현: 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2118](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2118) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2119](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2119) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2120](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2120) | 올바른 학습: | 설명·요구 | 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2121](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2121) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2122](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2122) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2123](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2123) | authentication contract의 | 예시·흐름 | 검증 fixture: T11: auth.ts/UserPage literal rule은 거절하고 구조 동형 그래프에서 일반화된다. 구현: 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2124](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2124) | session representation이 변경되면 | 예시·흐름 | 검증 fixture: T11: auth.ts/UserPage literal rule은 거절하고 구조 동형 그래프에서 일반화된다. 구현: 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2125](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2125) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2126](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2126) | session consumer까지 propagation한다. | 예시·흐름 | 검증 fixture: T11: auth.ts/UserPage literal rule은 거절하고 구조 동형 그래프에서 일반화된다. 구현: 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2127](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2127) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2128](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2128) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2129](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2129) | 즉 node 이름이 아니라 causal relation을 학습한다. | 설명·요구 | 구조 relation/port semantic kind 중심 DSL과 다른 이름 holdout을 사용한다. |
| [2130](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2130) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2131](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2131) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2132](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2132) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B67 — Agent가 계획을 마음대로 다시 만들 수 없게 해야 한다

원문 2133–2154행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b67)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2133](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2133) | # 67. Agent가 계획을 마음대로 다시 만들 수 없게 해야 한다 | 제목 | Control Plane이 immutable/affected/boundary/invalid assumptions/evidence를 정하고 LLM은 그 안만 수정한다. |
| [2134](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2134) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2135](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2135) | LLM planner에게 전체 그래프를 주고 | 설명·요구 | ReplanLease와 scoped patch API를 도입하고 outside write·immutable rewrite·새 외부 edge를 서버에서 거절/확장 검토한다. |
| [2136](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2136) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2137](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2137) | &gt; 다시 계획해. | 설명·요구 | ReplanLease와 scoped patch API를 도입하고 outside write·immutable rewrite·새 외부 edge를 서버에서 거절/확장 검토한다. |
| [2138](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2138) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2139](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2139) | 라고 하면 이 설계의 의미가 사라진다. | 설명·요구 | ReplanLease와 scoped patch API를 도입하고 outside write·immutable rewrite·새 외부 edge를 서버에서 거절/확장 검토한다. |
| [2140](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2140) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2141](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2141) | Control Plane이 먼저 결정한다. | 설명·요구 | ReplanLease와 scoped patch API를 도입하고 outside write·immutable rewrite·새 외부 edge를 서버에서 거절/확장 검토한다. |
| [2142](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2142) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2143](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2143) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2144](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2144) | immutable nodes | 예시·흐름 | 검증·실행·비영향 조건을 만족한 node를 patch 금지 집합으로 고정한다. |
| [2145](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2145) | affected nodes | 예시·흐름 | typed closure·boundary proof·hard/soft 영향 판단 후 허용할 변경 집합을 결정한다. |
| [2146](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2146) | replanning boundary | 예시·흐름 | 복구 가능한 최소 후보 영역과 base versions를 ReplanLease에 고정한다. |
| [2147](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2147) | invalid assumptions | 예시·흐름 | 근거로 깨진 AssumptionVersion refs와 소비 영향을 제공한다. |
| [2148](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2148) | available evidence | 예시·흐름 | role·region selector와 context budget을 통과한 유효 증거만 제공한다. |
| [2149](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2149) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2150](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2150) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2151](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2151) | LLM은 지정된 subgraph 안에서만 계획을 수정한다. | 설명·요구 | ReplanLease와 scoped patch API를 도입하고 outside write·immutable rewrite·새 외부 edge를 서버에서 거절/확장 검토한다. |
| [2152](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2152) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2153](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2153) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2154](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2154) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B68 — Replanner Input

원문 2155–2180행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b68)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2155](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2155) | # 68. Replanner Input | 제목 | ReplanningContext의 goal/boundary/changed/invalidated/preserved/immutable/errors/invariants/evidence 필드를 모두 전달한다. |
| [2156](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2156) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2157](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2157) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2158](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2158) | interface ReplanningContext { | 타입 선언 | ReplanningContext의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [2159](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2159) |   goal: GoalRef; | 데이터 필드 | 승인 goal ref이며 region 밖 objective를 수정할 권한이 아니다. |
| [2160](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2160) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2161](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2161) |   boundary: GraphRegion; | 데이터 필드 | control plane이 계산한 허용 GraphRegion과 lease이다. |
| [2162](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2162) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2163](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2163) |   changedNodes: TaskRef[]; | 데이터 필드 | 관찰 변화의 source 집합과 before/after refs이다. |
| [2164](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2164) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2165](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2165) |   invalidatedNodes: TaskRef[]; | 데이터 필드 | 증거·typed closure·경계 검증 후 실제 재검토가 필요한 집합이다. |
| [2166](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2166) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2167](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2167) |   preservedNodes: TaskRef[]; | 데이터 필드 | 유효성을 확인해 보존하는 node 집합이며 patch 대상에서 제외한다. |
| [2168](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2168) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2169](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2169) |   immutableDecisions: DecisionRef[]; | 데이터 필드 | validated/executed/비영향 결정 refs로서 변경 불가능하다. |
| [2170](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2170) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2171](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2171) |   predictionErrors: PredictionError[]; | 데이터 필드 | 현재 lease snapshot의 기대/관찰 오차·근거이다. |
| [2172](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2172) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2173](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2173) |   violatedInvariants: Invariant[]; | 데이터 필드 | 지역 복구가 반드시 해소해야 할 제약이다. |
| [2174](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2174) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2175](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2175) |   evidence: EvidenceRef[]; | 데이터 필드 | region과 role selector에 적합한 근거만 예산 내 제공한다. |
| [2176](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2176) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [2177](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2177) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2178](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2178) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2179](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2179) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2180](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2180) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B69 — Replanner Output

원문 2181–2204행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b69)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2181](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2181) | # 69. Replanner Output | 제목 | ReplanningResult의 revised/new/removed/tasks/dependencies/preserved decisions/invalid assumptions/expectations/confidence를 모두 처리한다. |
| [2182](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2182) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2183](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2183) | &#96;&#96;&#96;ts | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2184](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2184) | interface ReplanningResult { | 타입 선언 | ReplanningResult의 원문 필드를 아래 필드별 계약으로 모두 구현한다. 기존 동일 이름 타입과 의미 차이는 본문 3절을 따른다. |
| [2185](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2185) |   revisedTasks: TaskPatch[]; | 데이터 필드 | lease 안의 기존 node patch이며 base revision·이유·evidence를 검증한다. |
| [2186](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2186) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2187](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2187) |   newTasks: TaskProposal[]; | 데이터 필드 | proposal-local ID의 새 task이다. 서버가 canonical ID/version을 할당한다. |
| [2188](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2188) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2189](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2189) |   removedTasks: TaskId[]; | 데이터 필드 | 현행 plan membership 제외이다. 역사 task/artifact를 삭제하지 않는다. |
| [2190](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2190) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2191](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2191) |   newDependencies: EdgeProposal[]; | 데이터 필드 | 새 typed edge 제안이다. 외부 영향·cycle·complete read binding을 검증한다. |
| [2192](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2192) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2193](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2193) |   preservedDecisions: DecisionRef[]; | 데이터 필드 | 입력 immutable set과 일치해야 한다. 생략하여 결정 보존을 우회할 수 없다. |
| [2194](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2194) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2195](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2195) |   invalidatedAssumptions: AssumptionRef[]; | 데이터 필드 | 근거 있는 가정 무효화 요청이며 실제 consumer로 전파한다. |
| [2196](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2196) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2197](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2197) |   expectedOutcomes: ExpectedOutcome[]; | 데이터 필드 | 새 task/spec의 목표·contract에 맞는 실행 전 기대치이다. 실패를 숨기려고 제약을 약화하지 않는다. |
| [2198](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2198) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2199](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2199) |   confidence: number; | 데이터 필드 | 계획 제안의 [0,1] 신뢰도이다. deterministic consistency·completion 검증을 대체하지 않는다. |
| [2200](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2200) | } | 타입 구문 | 타입 선언의 닫힘이다. 필드 누락 검사는 모든 선언 항목에 대해 별도로 수행한다. |
| [2201](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2201) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2202](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2202) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2203](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2203) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2204](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2204) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B70 — 완료 조건

원문 2205–2232행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b70)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2205](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2205) | # 70. 완료 조건 | 제목 | GoalValid/GraphConsistent/BoundaryContractsValid/CriticalInvariants/PredictionError&lt;threshold가 모두 참이어야 끝난다. |
| [2206](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2206) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2207](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2207) | 재계획은 단순히 새 task list를 만들었다고 끝나는 것이 아니다. | 설명·요구 | completion aggregator에 다섯 조건과 최신 snapshot·미해결 role/stop/unknown 의무를 conjunction으로 추가한다. |
| [2208](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2208) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2209](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2209) | 다음 조건을 만족해야 한다. | 설명·요구 | completion aggregator에 다섯 조건과 최신 snapshot·미해결 role/stop/unknown 의무를 conjunction으로 추가한다. |
| [2210](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2210) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2211](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2211) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2212](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2212) | GoalValid=True | 수식 본문 | 현재 승인 goal/explicit requirement의 의미를 새 계획이 계속 만족하는지 확인한다. |
| [2213](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2213) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2214](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2214) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2215](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2215) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2216](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2216) | GraphConsistent=True | 수식 본문 | 외래키·hierarchy·실행 DAG·port binding·현행 version 일관성을 확인한다. |
| [2217](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2217) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2218](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2218) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2219](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2219) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2220](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2220) | BoundaryContractsValid=True | 수식 본문 | 모든 required observable boundary와 exact 통합 tuple의 검증 의무를 확인한다. |
| [2221](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2221) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2222](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2222) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2223](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2223) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2224](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2224) | CriticalInvariants=True | 수식 본문 | 확률로 생략할 수 없는 hard constraint 의무가 모두 satisfied인지 확인한다. |
| [2225](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2225) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2226](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2226) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2227](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2227) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2228](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2228) | PredictionError&lt;\theta | 수식 본문 | 유효한 새 기대치에 대한 재관찰 오차가 안정 threshold 아래인지 확인한다. 기대치 사후 완화로 맞추지 않는다. |
| [2229](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2229) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2230](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2230) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2231](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2231) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2232](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2232) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B71 — 새로운 전체 원리

원문 2233–2264행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b71)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2233](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2233) | # 71. 새로운 전체 원리 | 제목 | 무엇을 다시 볼지를 먼저 결정하고 누가 생각할지를 다음 결정한다. |
| [2234](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2234) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2235](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2235) | 앞선 에이전트 설계의 핵심 질문은 | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2236](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2236) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2237](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2237) | &gt; 언제 생각해야 하는가? | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2238](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2238) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2239](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2239) | 였다. | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2240](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2240) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2241](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2241) | 이번 설계는 여기에 두 번째 질문을 추가한다. | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2242](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2242) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2243](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2243) | &gt; **무엇을 다시 생각해야 하는가?** | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2244](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2244) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2245](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2245) | 따라서 시스템은 두 단계로 판단한다. | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2246](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2246) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2247](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2247) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2248](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2248) | Change | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2249](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2249) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2250](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2250) | WhatShouldBeReconsidered? | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2251](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2251) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2252](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2252) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2253](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2253) | 그다음 | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2254](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2254) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2255](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2255) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2256](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2256) | AffectedTasks | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2257](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2257) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2258](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2258) | WhoShouldThink? | 수식 본문 | 식 전체의 구현 계약: causal region decision 없이 role activation을 실행할 수 없게 한다. 검증: T02,T15: 호출 순서와 grant 참조로 두 단계의 선후를 검증한다. |
| [2259](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2259) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2260](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2260) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2261](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2261) | 한다. | 설명·요구 | causal region decision 없이 role activation을 실행할 수 없게 한다. |
| [2262](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2262) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2263](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2263) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2264](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2264) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B72 — 전체 최적화 문제

원문 2265–2303행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b72)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2265](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2265) | # 72. 전체 최적화 문제 | 제목 | replanning/reasoning/coordination/failure 비용 최소화는 correctness 하한 제약 안에서 수행한다. |
| [2266](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2266) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2267](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2267) | 최종적으로 시스템은 | 설명·요구 | 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. |
| [2268](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2268) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2269](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2269) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2270](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2270) | \min | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2271](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2271) | C_{replanning} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2272](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2272) | + | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2273](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2273) | C_{reasoning} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2274](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2274) | + | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2275](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2275) | C_{coordination} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2276](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2276) | + | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2277](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2277) | C_{failure} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2278](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2278) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2279](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2279) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2280](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2280) | 를 최소화하면서 | 설명·요구 | 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. |
| [2281](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2281) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2282](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2282) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2283](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2283) | Correctness\ge Q_{required} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2284](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2284) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2285](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2285) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2286](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2286) | 를 만족시키는 것이 목표다. | 설명·요구 | 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. |
| [2287](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2287) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2288](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2288) | 또는 효율성으로 표현하면 | 설명·요구 | 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. |
| [2289](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2289) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2290](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2290) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2291](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2291) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2292](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2292) | \eta | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2293](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2293) | = | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2294](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2294) | \frac | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2295](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2295) | {\text{Successfully Adapted Plan}} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2296](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2296) | {\text{Replanning + Reasoning + Coordination Cost}} | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2297](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2297) | } | 수식 본문 | 식 전체의 구현 계약: 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. 검증: T13: 실패를 늘려 얻은 비용 절감을 개선으로 보고하지 않는다. |
| [2298](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2298) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2299](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2299) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2300](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2300) | 를 최대화한다. | 설명·요구 | 동일 workload baseline 대비 비용과 성공 적응/실패를 함께 측정하고 Qrequired 미달 후보를 거절한다. |
| [2301](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2301) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2302](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2302) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2303](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2303) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B73 — 핵심 수학적 결과

원문 2304–2347행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b73)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2304](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2304) | # 73. 핵심 수학적 결과 | 제목 | Locality와 Boundary Containment의 전제를 동시에 만족한 영역만 제외한다. 마지막 교차식은 구현 타입을 명확히 해야 한다. |
| [2305](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2305) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2306](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2306) | 이 설계에서 가장 중요한 두 성질은 실제로 증명할 수 있다. | 설명·요구 | 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. |
| [2307](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2307) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2308](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2308) | ## 1. Locality | 제목 | Locality와 Boundary Containment의 전제를 동시에 만족한 영역만 제외한다. 마지막 교차식은 구현 타입을 명확히 해야 한다. |
| [2309](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2309) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2310](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2310) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2311](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2311) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2312](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2312) | x\not\leadsto v | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2313](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2313) | \Rightarrow | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2314](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2314) | Recompute(v)=False | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2315](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2315) | } | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2316](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2316) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2317](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2317) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2318](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2318) | 변경 node와 causal dependency가 없는 node는 다시 계산할 필요가 없다. | 설명·요구 | 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. |
| [2319](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2319) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2320](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2320) | ## 2. Boundary Containment | 제목 | Locality와 Boundary Containment의 전제를 동시에 만족한 영역만 제외한다. 마지막 교차식은 구현 타입을 명확히 해야 한다. |
| [2321](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2321) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2322](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2322) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2323](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2323) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2324](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2324) | I(S')=I(S) | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2325](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2325) | \Rightarrow | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2326](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2326) | Replan(Outside(S))=False | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2327](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2327) | } | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2328](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2328) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2329](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2329) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2330](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2330) | 변경된 subgraph가 외부 contract를 그대로 유지한다면 변경은 그 boundary 내부에 격리될 수 있다. | 설명·요구 | 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. |
| [2331](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2331) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2332](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2332) | 두 정리를 합치면 다음 결과를 얻는다. | 설명·요구 | 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. |
| [2333](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2333) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2334](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2334) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2335](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2335) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2336](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2336) | ReplanRegion | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2337](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2337) | = | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2338](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2338) | CausalClosure(Change) | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2339](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2339) | \cap | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2340](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2340) | UnpreservedBoundaries | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2341](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2341) | } | 수식 본문 | 식 전체의 구현 계약: 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. 검증: T05,T06: 우회 경로·다중 경계·unknown proof 반례에서 필요한 node를 누락하지 않는다. |
| [2342](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2342) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2343](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2343) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2344](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2344) | 즉 전체 계획이 아니라 **인과적으로 영향받고 boundary에 의해 격리되지 않은 부분만 다시 생각하면 된다.** | 설명·요구 | 완전한 causal graph에서 preserved exit arcs를 절단한 reachability로 ReplanRegion을 정의한다. |
| [2345](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2345) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2346](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2346) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2347](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2347) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B74 — 인간의 인지에서 가져온 최종 대응관계

원문 2348–2367행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b74)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2348](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2348) | # 74. 인간의 인지에서 가져온 최종 대응관계 | 제목 | 인지 대응표의 13항목은 goal/subgoal/plan/expectation/error/boundary/replan/cost/routine/hierarchy/attention/control/replay의 시스템 대응이다. |
| [2349](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2349) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2350](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2350) | &#124; 인간의 인지 &#124; 에이전트 시스템 &#124; | 표 구조 | 이어지는 13개 인지/시스템 대응 행의 표 머리/구분이다. |
| [2351](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2351) | &#124;---&#124;---&#124; | 표 구조 | 이어지는 13개 인지/시스템 대응 행의 표 머리/구분이다. |
| [2352](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2352) | &#124; Goal &#124; 상위 Task &#124; | 대응표 행 | TaskSpecVersion의 상위 objective에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2353](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2353) | &#124; Subgoal &#124; 하위 Task &#124; | 대응표 행 | 하위 계층 objective 및 planning boundary에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2354](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2354) | &#124; Event Model &#124; Current Plan &#124; | 대응표 행 | 불변 PlanRevision과 현행 plan head에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2355](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2355) | &#124; Prediction &#124; Expected Outcome &#124; | 대응표 행 | 실행 전 ExpectationVersion에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2356](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2356) | &#124; Prediction Error &#124; Task Prediction Error &#124; | 대응표 행 | PredictionErrorVersion의 C/B/D/G 및 SPE에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2357](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2357) | &#124; Event Boundary &#124; Planning Boundary &#124; | 대응표 행 | PlanningBoundaryVersion 및 BoundaryProof에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2358](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2358) | &#124; Task Switching &#124; Replanning &#124; | 대응표 행 | scoped ReplanLease와 plan revision 교체에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2359](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2359) | &#124; Switching Cost &#124; Replanning Cost &#124; | 대응표 행 | 전환·중단·재실행·context의 CostEstimate에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2360](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2360) | &#124; Cognitive Chunk &#124; Reusable Task Routine &#124; | 대응표 행 | 내부 계보·검증을 보존한 RoutineVersion에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2361](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2361) | &#124; Hierarchical Behavior &#124; Task/Subtask Graph &#124; | 대응표 행 | goal/subgoal/task/action 계층에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2362](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2362) | &#124; Selective Attention &#124; Sparse Task Activation &#124; | 대응표 행 | causal task eligibility와 dormant 상태에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2363](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2363) | &#124; Cognitive Control &#124; Activation / Replanning Policy &#124; | 대응표 행 | versioned activation/replanning policy에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2364](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2364) | &#124; Replay &#124; Prioritized Revalidation &#124; | 대응표 행 | prioritized ReplayJob와 snapshot 재검증에 구현한다. 비유 자체를 검증 증거로 사용하지 않는다. |
| [2365](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2365) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2366](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2366) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2367](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2367) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B75 — 최종 아키텍처

원문 2368–2433행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b75)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2368](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2368) | # 75. 최종 아키텍처 | 제목 | 목표부터 관찰·오차·분류·인과·경계·최소 영역·이중 활성·검증·새 계획·예측 갱신까지 순환한다. |
| [2369](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2369) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2370](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2370) | &#96;&#96;&#96;text | 코드 시작 | 이어지는 코드/예시 전체를 소속 요구의 데이터 계약 또는 수용 fixture로 해석한다. |
| [2371](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2371) |                            GOAL | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2372](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2372) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2373](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2373) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2374](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2374) |                      Hierarchical Plan | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2375](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2375) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2376](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2376) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2377](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2377) |                          Execution | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2378](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2378) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2379](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2379) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2380](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2380) |                     Actual Observation | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2381](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2381) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2382](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2382) |                              ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2383](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2383) |                 Expected vs Actual Result | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2384](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2384) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2385](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2385) |                     Prediction Error | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2386](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2386) |                              │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2387](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2387) |                ┌─────────────┴─────────────┐ | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2388](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2388) |                │                           │ | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2389](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2389) |              small                       large | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2390](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2390) |                │                           │ | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2391](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2391) |            preserve                   classify | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2392](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2392) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2393](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2393) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2394](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2394) |                                     Change Type | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2395](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2395) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2396](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2396) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2397](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2397) |                                     Causal Graph | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2398](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2398) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2399](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2399) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2400](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2400) |                                   Affected Closure | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2401](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2401) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2402](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2402) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2403](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2403) |                                 Boundary Containment | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2404](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2404) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2405](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2405) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2406](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2406) |                               Minimal Replan Region | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2407](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2407) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2408](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2408) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2409](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2409) |                                Sparse Task Activation | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2410](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2410) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2411](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2411) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2412](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2412) |                                Sparse Agent Activation | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2413](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2413) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2414](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2414) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2415](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2415) |                                Adaptive Reasoning | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2416](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2416) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2417](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2417) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2418](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2418) |                              Deterministic Validation | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2419](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2419) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2420](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2420) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2421](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2421) |                                Integration Validation | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2422](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2422) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2423](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2423) |                                            ▼ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2424](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2424) |                                       New Plan | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2425](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2425) |                                            │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2426](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2426) |                                            └───────┐ | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2427](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2427) |                                                    │ | 예시·흐름 | 위아래 단계의 제어 흐름을 연결한다. 독립 모델 호출로 구현하지 않으며 소속 요구의 조건부 전이를 따른다. |
| [2428](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2428) |                                            Prediction Model | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2429](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2429) |                                                 Updated | 예시·흐름 | 검증 fixture: T15: 두 번 연속 변화 episode에서 이전 유효 계획을 재사용하며 필요한 부분만 갱신한다. 구현: 새 계획 commit 후 유효 목표 제약을 유지한 expectation을 pin하고 다음 관찰에서 다시 비교한다. |
| [2430](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2430) | &#96;&#96;&#96; | 코드 끝 | 위 코드/예시의 끝이다. 독립 실행 기능을 추가하지 않는다. |
| [2431](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2431) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2432](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2432) | --- | 구분선 | 원문 절 구분을 보존한다. 실행 데이터나 별도 기능을 생성하지 않는다. |
| [2433](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2433) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |

## B76 — 최종 정의

원문 2434–2518행 · [구현 해석·변경·수용 조건](source-implementation-map.md#b76)

| 원문 행 | 원문 그대로 | 종류 | 이 프로젝트의 구현 처리 |
|---|---|---|---|
| [2434](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2434) | # 76. 최종 정의 | 제목 | 최종 정의의 sparse task/agent/local causal/boundary/prediction/precision/structural learning은 모두 필요하며 실제 변화→재검토 대상→역할·깊이 순서를 지킨다. |
| [2435](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2435) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2436](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2436) | 본 시스템을 다음과 같이 정의한다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2437](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2437) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2438](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2438) | &gt; **Adaptive Causal Task System은 목표를 계층적 task/subtask graph로 표현하고, 각 태스크가 예상 결과와 실제 결과 사이의 prediction error를 지속적으로 관찰하며, 의미 있는 변화가 발생하면 typed causal dependency를 통해 영향 범위를 계산하고, 유지되는 boundary와 이미 확정된 결정을 보존하면서 문제를 복구할 수 있는 최소 subgraph만 재계획하는 시스템이다.** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2439](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2439) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2440](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2440) | 그 후에야 필요한 에이전트를 선택적으로 활성화한다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2441](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2441) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2442](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2442) | 따라서 최종 계산 구조는 | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2443](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2443) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2444](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2444) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2445](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2445) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2446](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2446) | Change | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2447](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2447) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2448](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2448) | PredictionError | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2449](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2449) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2450](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2450) | CausalPropagation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2451](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2451) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2452](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2452) | MinimalReplanning | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2453](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2453) | \rightarrow | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2454](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2454) | SparseAgentActivation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2455](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2455) | } | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2456](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2456) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2457](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2457) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2458](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2458) | 이다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2459](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2459) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2460](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2460) | 그리고 이 설계가 인간의 저비용 적응에서 가져오는 가장 중요한 원칙은 다음 한 문장으로 압축된다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2461](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2461) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2462](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2462) | &gt; **세상이 조금 바뀔 때마다 세계 전체를 다시 이해하지 않는다. 기존 모델을 유지하다가 예측이 의미 있게 틀린 지점에서만 모델을 깨뜨리고, 그 변화와 인과적으로 연결된 부분만 다시 구성한다.** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2463](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2463) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2464](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2464) | 따라서 우리가 원하는 에이전트 역시 | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2465](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2465) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2466](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2466) | &gt; **계획을 잘 만드는 에이전트** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2467](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2467) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2468](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2468) | 에서 끝나는 것이 아니라, | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2469](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2469) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2470](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2470) | &gt; **계획의 대부분을 보존하면서 정확히 필요한 부분만 다시 계획할 수 있는 에이전트** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2471](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2471) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2472](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2472) | 여야 한다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2473](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2473) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2474](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2474) | 최종적으로 앞선 에너지 효율형 에이전트 아키텍처와 결합하면 전체 철학은 다음 식으로 정리된다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2475](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2475) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2476](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2476) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2477](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2477) | \boxed{ | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2478](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2478) | EfficientAdaptiveIntelligence | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2479](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2479) | = | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2480](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2480) | SparseTaskActivation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2481](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2481) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2482](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2482) | SparseAgentActivation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2483](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2483) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2484](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2484) | LocalCausalReplanning | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2485](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2485) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2486](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2486) | BoundaryPreservation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2487](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2487) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2488](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2488) | PredictionError | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2489](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2489) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2490](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2490) | AdaptiveReasoning | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2491](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2491) | \times | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2492](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2492) | StructuralLearning | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2493](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2493) | } | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2494](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2494) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2495](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2495) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2496](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2496) | 즉 시스템은 세 가지 질문을 순서대로 해결해야 한다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2497](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2497) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2498](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2498) | **1. 무엇이 실제로 바뀌었는가?** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2499](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2499) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2500](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2500) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2501](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2501) | PredictionError | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2502](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2502) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2503](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2503) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2504](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2504) | **2. 무엇을 다시 생각해야 하는가?** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2505](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2505) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2506](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2506) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2507](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2507) | CausalAffectedClosure | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2508](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2508) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2509](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2509) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2510](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2510) | **3. 누가 어느 정도 깊이로 생각해야 하는가?** | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
| [2511](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2511) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2512](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2512) | \[ | 수식 시작 | 여러 행에 나뉜 하나의 수식이다. 아래 식 전체의 변수·가정·적용 범위를 소속 요구와 함께 사용한다. |
| [2513](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2513) | SparseAgentActivation | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2514](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2514) | + | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2515](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2515) | AdaptiveReasoning | 수식 본문 | 식 전체의 구현 계약: 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. 검증: T14,T15: 두 문서의 모든 요구 ID가 구현·검증 evidence에 연결되어야 최종 수용한다. |
| [2516](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2516) | \] | 수식 끝 | 수식 전체를 하나의 조건/비용/정리로 검증한다. 조각 행을 별개 요구로 세지 않는다. |
| [2517](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2517) | 〈빈 줄〉 | 빈 줄 | 문단/코드 가독성을 위한 구분이다. 독립 기능으로 세지 않으며 소속 요구의 의미를 유지한다. |
| [2518](/Users/seominyong/Downloads/source/task-a/docs/design/adaptive-task-replanning.md:2518) | 이 세 단계를 분리하는 것이 전체 시스템의 핵심이다. | 설명·요구 | 전체 곱의 각 항을 native/Pod 경로의 필수 gate로 만들고 부분 구현을 전체 완료로 표시하지 않는다. |
