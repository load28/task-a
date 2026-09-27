# Task Agent

Superpowers 인터뷰로 개념과 방향을 합의한 뒤 계약으로 작은 태스크를 연결하고, 각 태스크의 Codex를 격리 실행하는 AX 소스 기반 엔진이다. 입력이나 계약이 바뀌면 영향받는 작업을 다시 실행하고, 동일한 성공 결과는 재사용한다. 중단한 작업은 Substrate DATA snapshot과 저장된 Codex 세션으로 재개한다.

## 구조

```text
Codex 전담 서브에이전트 → Superpowers 인터뷰·설계 검토 → 계약·Plan
  → 전역 스킬 → Go task-agent
  → AX gRPC · Redis Streams · controller
  → Substrate gVisor actor → AX runner → Codex CLI
```

계약 DAG·변경 판정·독립 검증은 AX 위의 확장이다. AX 원본 코드·라이선스·출처는 [engine](engine/README.md)과 [원본 잠금 파일](engine/upstream.lock.json)에 보존한다.

| 경로 | 역할 |
|---|---|
| [docs/rebuild](docs/rebuild/README.md) | 요구·계약·설계·구현 DAG·검증 근거 |
| [engine/ax](engine/ax/) | AX 원본과 Go 그래프 확장·테스트 |
| [engine/codex](engine/codex/) · [engine/infra](engine/infra/) | Codex 이미지·세션·native 인증, 고정 Substrate 배포 |
| [engine/skill](engine/skill/SKILL.md) | 자연어 위임·계획·실행·중단·재개 진입점 |

## 빌드와 검사

Node.js 24 이상과 Go 1.27.1 toolchain이 필요하다. 루트 npm 패키지는 명령 진입점이며 설치할 npm 의존성은 없다. Go 의존성은 `engine/ax/go.mod`와 `go.sum`을 따른다.

```sh
npm run build
npm run check
```

`check`는 AX·Superpowers 원본 해시, 계약 DAG와 생성 문서 일치, Node 래퍼, Go 테스트를 검사한다. 실제 Redis 저장소 테스트는 `TASK_AGENT_TEST_REDIS`, Docker 안의 모의 Codex 어댑터 테스트는 `TASK_AGENT_TEST_IMAGE`를 지정했을 때 실행한다. 해당 환경을 지정하지 않으면 이 통합 테스트는 건너뛴다. 실제 모델 호출 시험과는 구분한다.

원본의 중첩 `.github/workflows`는 출처 보존용이다. 이 저장소의 CI는 루트 [.github/workflows/check.yml](.github/workflows/check.yml)에서 실행한다.

## 설치와 실행

처음 실행할 환경은 [로컬 인프라 안내](engine/infra/README.md)에 따라 준비한다. 이미 구성된 환경은 연결 프로세스를 실행하고 유지한다.

```sh
npm run infra:connect
```

다른 터미널에서 전역 스킬을 설치한다.

```sh
npm run skill:install
```

Codex에 “태스크 에이전트로 이 프로젝트에 할 일 CLI를 만들어줘”처럼 요청하면 전담 서브에이전트가 질문을 하나씩 하며 목적과 방향을 정리한다. 신규 프로젝트는 설계 문서 검토 후 계약과 Plan으로 넘어간다. 작은 변경·조사는 원본의 가벼운 경로를 따르며, 상태 조회·중단·재개에 인터뷰를 반복하지 않는다. [인터뷰 설계](docs/rebuild/interview-design.md)에 원본 채택과 연결 범위를 기록했다. 자연어 분해는 에이전트가 담당하며 Go 엔진은 검증된 Plan을 실행한다.

직접 호출할 때는 실제 프로젝트 절대 경로와 [Plan 형식](engine/skill/references/planning.md)을 사용한다.

```sh
npm start -- --project /absolute/project validate /absolute/plan.json
npm start -- --project /absolute/project apply /absolute/plan.json
npm start -- --project /absolute/project run my-task
npm start -- --project /absolute/project status my-task
npm start -- --project /absolute/project result my-task
```

`run`은 조정 한 번이다. 상태를 확인하며 다음 `run`을 호출하고, `complete: true` 뒤 `result`를 조회한다. `result`는 파일 내용을 JSON으로 반환하며 호스트 프로젝트에 자동으로 쓰지 않는다. 중단은 `suspend my-task`로 요청하고 실제 중단을 확인한 뒤 `resume my-task`와 `run my-task`로 이어간다.

## 지원 범위

현재는 UTF-8 일반 파일을 전달하는 leaf DAG를 지원한다. 입력은 각 actor에 복사하며, 별도 검증 actor의 성공과 중단을 확인해야 결과를 채택한다. 전체 C01–C12 계약 충족을 선언하지 않는다. 크기 제한, 입력 mount, 장애 복구와 인증의 정확한 경계는 [지원 범위](engine/extensions.md)를 따른다.

실제 Codex 생성, 동일 세션 중단·재개, 입력 변경에 따른 후속 재작업, 선택적 재사용의 근거는 [구현 상태](docs/rebuild/implementation-status.md)에 있다. 이전 제품·실험 구현과 배포 경로는 제거했으며 변경 이력은 Git에 남는다. 기존 로컬 실행 데이터와 외부에 설치된 서비스는 이 소스 정리로 자동 삭제하거나 이관하지 않는다.
