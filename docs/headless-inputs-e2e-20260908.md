# Codex 터미널 → Task Agent → Kubernetes 실험

2026-09-08에 빈 Git 저장소 `/private/tmp/headless-inputs-task-agent-20260908`에서 헤드리스 TextInput·NumberInput 구현을 요청했다. 입력 컴포넌트를 관찰자가 직접 구현하지 않고, Codex CLI의 설치된 훅과 Task Agent를 거쳐 Pod 모델이 구현하도록 실행했다.

## 요청과 승인

- Codex 세션: `01a07e59-59ab-7c50-bee5-2dbcb66150a8`
- 요청: 헤드리스 아키텍처 기반 TextInput·NumberInput 구현 및 검증
- 사용자가 제시된 계획을 승인한 뒤 `codex exec --approve-for-me resume --json`으로 실제 승인 답변을 전달했다.
- 작업공간 그래프 DB: `~/.task-agent/graphs/372266e8c9541e6ff9ad2c2b.db`

## 실제 실행에서 발견한 도구 결함

계획 생성의 선택 항목인 `dependsOnNodeIds`를 생략하면 SQLite 바인딩 오류가 발생했다. 빈 배열을 명시하면 저장되지만 반환값에 `planId`가 없어 에이전트가 제목을 ID로 사용했고 승인 도구가 실패했다. 에이전트는 이후 계획과 연결되지 않은 단일 구현 태스크를 생성했다. 따라서 최초 실행을 정상적인 계획 DAG 실행 성공으로 간주하지 않는다.

Pod 생성 도구는 `spec`을 내용 없는 object 스키마로 노출했다. 실제로 에이전트는 taskId, run, desiredState, deletionPolicy, storage, command, outputs를 차례로 추측하며 오류를 반복했다.

이번 수정은 의존성 생략을 빈 배열로 저장하고, 계획 생성 결과에 후속 호출용 `planId`를 반환한다. Pod spec 필드·열거형·필수 command를 스키마에 노출하고, taskId/run/state/storage/deletionPolicy 기본값을 제공한다. 기본 Pod에는 Graph 도구가 없으므로 상위 manager가 실행 증거로 artifact와 완료를 기록하도록 지침을 명시한다.

회귀 검증: `npm run check` — TypeScript 검사 및 테스트 110개 통과. 프로토콜 테스트는 DB 내부 조회 없이 생성 응답의 planId로 승인하고, 의존성 생략 입력을 사용한다. 인스턴스 테스트는 잘못된 spec이 태스크를 claim하지 않는 것과 최소 spec의 기본값·멱등 재시도를 검증한다.

이 수정은 실행 중인 이전 MCP 프로세스를 재시작하여 소급 적용하지 않았다. 아래 최초 실행 기록은 수정 전 도구 경로의 결과다.

## 구현과 아카이브 복원

| 단계 | 그래프 태스크 | 실제 결과 |
| --- | --- | --- |
| 첫 구현 | `c0619c0a-37f6-4b2a-a4df-dd8f581d022d` | 테스트 10개·타입·린트 통과, Archived |
| 복원 검토 | `ec634289-67ef-4640-a555-afaa4fc598a4` | 첫 아카이브 복원, native 제약 props·키 처리 수정, 테스트 11개·타입·린트 통과 |
| 소수 회귀 수정 | `2e15cdcf-92f4-47ed-8b1a-d9dd53c24b37` | 직전 아카이브 복원, 테스트 12개·타입·린트 통과, Archived |

첫 Pod `task-4ea87339436904098457e64c`는 `/data/workspace`에서 코드를 생성했다. `git rev-parse --git-dir`의 실제 출력은 `/data/repository.git/worktrees/workspace`였다. 호스트 저장소를 마운트해 수정하지 않았다.

첫 아카이브 SHA-256: `bcfa45f4f10d619f7e09e3b58c80ceafd1ca4fef35e886d13738c6f91f94bac0`. TaskInstance는 exitCode 0, Archived 상태를 기록하고 실행 Pod/PVC를 제거했다.

상위 manager는 기본 Pod에 Graph 도구가 없다는 이유로 첫 태스크를 failed 처리하고 복원 태스크를 만들었다. 관찰자는 manager가 증거를 회수하여 완료를 기록해야 한다는 지침과 실제 로그 경로를 Codex 터미널에 전달했다.

검토에서 `defaultValue=0.2, step=0.1`의 increment 결과 `0.30000000000000004`와 native props의 min/max/step 누락을 재현했다. 후속 수정도 기존 아카이브를 재사용하는 Kubernetes 태스크에 맡겼다.

## 원시 증거 위치

- 최초 Codex 요청: `/private/tmp/headless-inputs-codex.jsonl`
- 승인 전달: `/private/tmp/headless-inputs-codex-resume.jsonl`
- 검토 의견 전달: `/private/tmp/headless-inputs-codex-review.jsonl`
- 첫 Pod 전체 로그: `/private/tmp/headless-worker-full.jsonl`
- 복원 Pod 로그: `/private/tmp/headless-worker-recovery.jsonl`
- 첫 아카이브 상태: `/private/tmp/headless-instance-archived.json`
- Task Agent 회귀 검사: `/private/tmp/headless-agent-check.log`

원시 로그는 로컬 임시 파일이며 Git에 포함하지 않는다. 소스 내보내기는 workspace의 코드·문서·테스트·잠금 파일만 대상으로 하고, 인증·모델 홈 데이터는 제외한다.

## 최종 소스 확인

최종 작업은 직전 복원 작업의 아카이브를 사용하여 이미 수정된 native props와 키보드 처리를 보존했다. 소수 정밀도와 native props의 명시적 회귀 테스트를 추가했으며 총 12개 테스트, 타입 검사, 린트가 Pod에서 통과했다.

최종 아카이브 SHA-256: `374c6bdd5cb34bc5689da31d8d11b1006c867de1dc3dc8b6bbb43d6d2c489e83`. 세 실행 Pod/PVC가 모두 정리된 것을 확인했다. 최종 소스는 manager가 `/private/tmp/headless-inputs-task-agent-20260908`로 내보냈다. 내보낸 소스에서도 0.2+0.1의 정확한 0.3 결과와 min/max/step props를 관찰자가 독립적으로 확인했다.

- 최종 Pod 로그: `/private/tmp/headless-worker-final.jsonl`
- 최종 인스턴스 상태: `/private/tmp/headless-instance-final.json`

상위 manager가 코드·테스트 artifact를 게시하고 최종 수정 태스크를 `verified`로 완료했다. 원래 두 시도의 `failed` 기록과 최초 계획의 `awaiting_approval` 상태는 남아 있다. 따라서 입력 컴포넌트 결과와 Pod 아카이브 복원은 검증됐지만, 최초 승인 계획의 DAG 실행·상태 수렴까지 성공한 실험은 아니다.

## 공통 도구 수정 적용과 별도 검증

후속 수정에서는 최초 실험의 상태 기록을 유지한 채 공통 도구를 검증했다. 승인된 계획을 승인 대기로 잘못 표시하는 문제와 호스트 재투영 시 단계·조사 구분이 사라지는 문제도 수정했다.

- `npm run check`: 타입 검사 및 테스트 112개 통과.
- 파일 DB에 의존성을 생략한 계획을 저장한 뒤 MCP를 재연결하고, 응답으로 받은 planId로 승인했다. 계획 생성 재전송과 승인 재전송에도 계획·태스크가 중복되지 않았다.
- 실제 `kind-task-agent-local`에서 최소 spec으로 Pod를 실행했다. 다시 MCP에 연결해 같은 생성 요청을 보내도 동일한 인스턴스 UID를 반환했다. 명령 exitCode 0을 확인한 뒤 테스트 Pod·PVC·TaskInstance를 정리했다.
- 실행 중인 요청이 없는 것을 확인하고 로컬 서비스를 재시작했다. 새 호스트 PID는 3318이며, 등록된 6개 작업공간의 task_graph MCP 연결이 모두 connected임을 확인했다.

이 검증은 대화형 Codex와 exec/resume이 공유하는 MCP·저장·인스턴스 계층의 결정적 동작을 대상으로 한다. 모델 대화를 두 방식으로 다시 실행한 비교 실험이나 모든 모델 판단에 대한 보장은 아니다. 기존 실험의 실패·승인 대기 상태를 소급 변경하지 않았다.

증거: `/private/tmp/task-agent-common-fixes-check.log`, `/private/tmp/task-agent-common-smoke.log`, `/private/tmp/task-agent-common-doctor.json`.
