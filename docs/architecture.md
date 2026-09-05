# 설계 — 재귀형 Task Graph + Integration Graph 기반 Task Agent

이 문서는 시스템의 최종 설계와 현재 구현의 대응 관계를 정리한다.

## 한 문장 정의

자연어 요청을 영속적인 재귀형 Task Graph로 변환하고, 작업을 필요한 수준까지 점진적으로 분해하며, 각 Task가 버전된 Artifact를 생성하도록 하고, 여러 Artifact의 실제 결합 관계를 Integration Graph로 별도 관리하여 특정 Artifact 버전 조합을 검증한 Verified Bundle만 상위 Task로 승격시키며, 변경과 실패가 발생하면 Artifact Lineage와 Contract를 기반으로 영향 범위를 계산하고 필요한 Task와 Integration만 선택적으로 다시 수행하도록 하는 Agent Task Runtime.

즉 **Persistent Recursive Task Graph + Versioned Artifact Graph + Integration Graph + Context Runtime**이다.

## 설계 원칙

1. **Prompt는 입력이다.** Prompt → Task. 이후 작업은 최초 Prompt가 아니라 Task 상태를 사용한다.
2. **Session은 Worker다.** GPT/Claude/기타 세션은 언제든 종료될 수 있고, 영속 상태는 Task Store에 있다.
3. **Task는 재귀적으로 분해한다.** Task → Subtask → Atomic Task. 처음부터 모두 쪼개지 않고 진행하면서 점진적으로 분해한다. Atomic 기준: 1 Agent + 1 clear objective + 1 bounded context + 1 independently verifiable result.
4. **Hierarchy와 Dependency를 분리한다.** Hierarchy는 "무엇의 일부인가"(`parentId`), Dependency는 "무엇이 먼저 필요한가"(`dependencies`)다.
5. **Task 성공과 Integration 성공을 분리한다.** A ✓ B ✓ C ✓ 여도 A+B+C ✗ 일 수 있다. `implemented`/`verified`와 `integrated`는 다른 상태다.
6. **Integration은 Artifact 버전 조합 단위로 검증한다.** `A@3 + B@7 + C@2`라는 정확한 조합 자체가 검증 대상이며, 조합 hash(Integration Identity)로 캐시한다.
7. **상위로 전달되는 것은 Verified Bundle이다.** 부모는 개별 Artifact 대신 통과한 조합의 Bundle을 소비한다.
8. **Artifact는 항상 versioned다.** lineage(입력 버전)와 contract 참조를 기록한다.
9. **Upstream 변경은 Downstream을 stale로 만든다.** Contract-compatible이면 Integration만 재검증하고, breaking이면 소비 Task를 reopen 대상으로 표시한다.
10. **실패는 새로운 Graph를 만든다.** 원인 불명의 Integration 실패는 Diagnostic Task를 자동 생성하고, 원인 분류 후 영향 Task만 선택적으로 stale/reopen한다. Architecture 자체도 reopen 대상이 될 수 있다.
11. **LLM은 제안하고 Engine이 결정한다.** 분해·Integration 구성은 Proposal로 제출되어 검증(cycle, 중복 책임, 잘못된 참조, 상태 전이) 후 적용된다. 상태 전이는 Agent가 제출한 Result를 근거로 Engine이 판단한다.
12. **Context는 대화가 아니라 Graph에서 생성한다.** Task ancestry, dependency, artifact lineage, integration membership, contract 관계를 기준으로 필요한 정보만 컴파일한다.

## 네 종류의 Graph

| Graph | 의미 | 구현 |
|---|---|---|
| Task Hierarchy | 어떤 상위 작업에 포함되는가 | `tasks.parent_id` |
| Dependency Graph | 실행 순서상 무엇이 먼저 필요한가 | `task_dependencies` |
| Artifact Graph | 결과물이 어떤 입력 버전에서 만들어졌는가 | `artifact_versions` + `artifact_lineage` |
| Integration Graph | 어떤 Artifact 조합이 함께 검증되어야 하는가 | `integration_sets/members/scenarios/runs` + `verified_bundles` |

Integration은 Hypergraph 대신 Join Node(Integration Set)로 표현하여 일반 DAG 엔진을 재사용한다. 모든 조합을 검증하지 않고 Architecture Boundary 기준의 Set만 검증하며, Set은 다른 Set의 Bundle을 멤버로 삼아 계층적으로 결합한다(`bundle:<set name>` artifact).

## Task Lifecycle

```
pending → ready → running → implemented → verified → integrating → integrated
                     ↘ failed / blocked         ↘ stale ────────────┘
```

- `ready`는 의존성이 모두 `verified`/`integrated`일 때 Engine이 부여한다.
- `task_complete`는 summary·artifacts·local verification을 제출할 뿐이며, acceptance criteria 충족까지 확인되어야 `verified`가 된다.
- Composite Task 상태는 자식·Integration Set·Requirement Coverage·Bundle 유효성으로부터 유도된다(설계 61–62의 완료 조건).

## 코어 객체

`Task`, `TaskDependency`, `Requirement`, `Artifact`, `ArtifactVersion`, `ArtifactLineage`, `TaskContract`, `IntegrationSet`, `IntegrationScenario`, `IntegrationRun`, `VerifiedBundle`, `Role`, `Event`가 1급 객체다(`packages/task-domain`). 저장 구조는 SQLite의 15개 테이블로 정규화되어 있다(`packages/task-store`). 설계는 초기 저장소로 PostgreSQL을 예시했으나, 동일한 관계형 스키마를 기존 운영 구성과 같은 SQLite(`node:sqlite`) 위에 구현했다. 테이블 구성이 같으므로 필요 시 PostgreSQL로 이전할 수 있다.

## 구현 Phase

| Phase | 범위 | 상태 |
|---|---|---|
| 1 | Task/Subtask/Dependency, Task Store, Load, Runnable Leaf, Context Builder | 구현됨 |
| 2 | Artifact, Version, Lineage, Contract | 구현됨 |
| 3 | Integration Set/Scenario, Verified Bundle, Stale Propagation | 구현됨 |
| 4 | Diagnostic Graph, Impact Analysis, Selective Reopen, Integration Planner 검증 | 구현됨 |
| 5 | Multi Agent 병렬 실행, Role Engine, OpenCode Execution Harness, 자동 orchestration | 미구현(확장 지점) |

Phase 5를 위해 Role은 도메인·저장소에 1급으로 존재하며(`roles` 테이블, `assignedRole`), Task Agent API는 Worker 식별 정보(`agent`, `sessionId`, `role`)를 `task_start`에서 받는다. Execution Harness는 `task_get_context` 출력물을 입력으로 받아 `task_complete`/`artifact_publish`로 결과를 제출하는 형태로 붙인다.
