---
name: task-agent
description: 어느 프로젝트에서든 태스크 에이전트를 전담 서브에이전트로 운용합니다. Superpowers 방식의 인터뷰로 방향을 정리한 뒤 계약·태스크 그래프 작성과 실행·변경·중단·재개·상태 확인에 사용합니다. AX 소스 기반 Go·Redis·Substrate 엔진을 사용하며 일반 코드 수정이나 Codex 채팅 관리에는 적용하지 않습니다.
---

# Task Agent

부모 Codex는 요청 원문·대상 프로젝트 절대 경로·허용된 범위·기존 graph id를 전담 서브에이전트에 한 번 위임한다. `task_agent` 역할을 선택할 수 없으면 일반 서브에이전트에 이 스킬 경로를 전달한다. 이미 전담 역할이면 재귀 위임하지 않는다. 채팅 생성 도구로 대체하지 않는다. 서브에이전트가 없으면 같은 절차를 직접 수행한다.

## 실행 기반을 확인한다

`node <스킬 경로>/scripts/task-agent.mjs --context --project <대상 프로젝트>`를 실행한다. 반환된 engineRoot의 README.md와 extensions.md를 읽는다. AX 원본 Go CLI·gRPC·Redis·Substrate·runner를 사용한다. `greenfield/`나 이전 제품, 호스트 직접 실행으로 대체하지 않는다. 엔진 경로와 작업 프로젝트를 구분한다.

실행 바이너리가 없으면 engineRoot에서 `node build.mjs`로 빌드한다. Redis·AX·Substrate 접속과 native egress credential injection이 준비되어야 실제 Codex를 실행할 수 있다. 준비 실패나 미검증 상태를 완료로 보고하지 않는다. 기존 SQLite state를 새 Redis 그래프로 자동 이관했다고 가정하지 않는다. 기존 작업 조회 요청이면 이전 상태가 남아 있음을 알리고 새 엔진의 상태와 섞지 않는다.

## 계획 전에 인터뷰한다

새 목표·프로젝트·기능 변경이면 [인터뷰 연결](references/discovery.md)을 읽고 동봉된 Superpowers brainstorming 원본을 따른다. 질문은 하나씩 하고, 목적·성공 기준을 합의한 뒤 접근과 설계를 검토받는다. architectural 경로의 spec 사용자 검토 전에는 태스크 Plan을 만들지 않는다. 상태 조회·중단·재개 요청은 이 단계를 다시 시작하지 않는다. 이미 검토한 설계가 있으면 확인한 지점부터 이어간다.

부모는 전담 에이전트의 질문과 검토 요청을 사용자에게 전달하고 실제 답변을 돌려준다. 미응답이면 기다리며 계획이나 구현을 대신 확정하지 않는다. 인터뷰 기록과 검토한 문서 버전을 대상 프로젝트에 남긴다.

## 계약과 그래프를 만든다

[계획 안내](references/planning.md)를 읽고 사용자 목표 → 계약 → 작은 leaf → 입력 의존성 순서로 Plan을 만든다. 대상 프로젝트 `.task-agent/requests/<요청 식별자>/`에 원문과 계획을 보존한다. 예제 그래프를 사용자 목표 대신 실행하지 않는다.

래퍼의 `validate PLAN`으로 먼저 검사한다. 검토만 요청받으면 여기서 멈춘다. 선택한 인터뷰 경로의 검토가 완료되고 실행이 허용됐으면 `apply PLAN` 후 `run ID`로 이어간다. 매 run은 조정 1회이며, `status ID`의 실제 상태를 확인하면서 진행한다. 인프라 연결 실패를 무한 반복하지 않는다. 배포·푸시·외부 메시지 전송으로 권한을 확대하지 않는다.

## 변경·중단·재개를 처리한다

같은 프로젝트와 graph id를 유지한다. 변경 시 실행 중인 actor를 `suspend ID`로 중단하고 모든 attempt가 suspended/succeeded/failed인지 확인한다. 새 Plan revision은 정확히 1 증가시킨다. `impact PLAN`으로 영향 후보를 확인하고 `apply PLAN` 후 실행한다. 입력 bytes와 task 계약이 동일한 성공 결과는 재사용된다. 변경된 결과에 의존하는 작업은 새 AX Task에서 실행된다.

`suspend ID`는 요청과 완료가 다르다. 불확실하거나 실패한 중단은 완료가 아니다. `resume ID`는 모든 중단 증거가 확보됐을 때만 허용된다. DATA snapshot의 동일 actor와 Codex의 정확한 session id를 이어간다. 대화가 중단되어도 원격 actor가 자동 중단됐다고 가정하지 않는다.

Redis 작업 lock 오류가 나면 소유 프로세스가 종료됐다는 증거 없이 lock을 지우지 않는다. 새 graph id로 우회하지 않는다. 장애 복구 범위는 extensions.md를 따른다.

## 결과를 보고한다

`status ID`의 complete와 `result ID`를 확인한다. AX Running, 에이전트 메시지, exit 0만으로 완료를 판정하지 않는다. 별도 AX validator와 actor 중단 확인이 필요하다. 부모에게 graph id·project 경로·실제 상태·결과·재사용/재작업 내역을 반환한다. 미지원 계약이나 실제 클러스터 검증이 남으면 그대로 보고한다.
