# 신규 구현 상태와 검증 근거

## 2026-09-27 — 실제 Codex 중단·재개와 변경 재작업

같은 `/Users/seominyong/Downloads/source/task-agent-demo` 프로젝트와 `todo-demo` 그래프를 revision 1 → 2 → 3으로 진행했다. 엔진 소스 변경 없이 다음을 확인했다.

- **중단·재개:** revision 2 core의 실제 Codex 세션이 시작되고 완료 receipt가 없는 상태에서 suspend했다. 그래프 paused와 core suspended를 확인한 뒤 같은 actor `ta-d9a406c6a070ed8ad924e187166ce7f1d34c136c`를 재개했다. 프로세스 argv에서 `codex exec resume 01a0e138-a4d6-7943-ad55-8dca862ff528`을 직접 관찰했고, 같은 세션의 후속 도구 호출·완료와 독립 validator exit 0을 확인했다. 입력 파일 bytes도 보존됐다. 중단 시점은 세션 생성 후 첫 도구 호출 전이므로, 편집 도중 생성된 파일의 복원까지 입증한 시험으로 확대하지 않는다.
- **의존 결과 변경:** revision 2는 core에 `removeTodo` 계약과 테스트만 추가하고 CLI 정의 전체를 revision 1과 동일하게 유지했다. core 출력 bytes가 바뀌자 CLI도 새 actor에서 재실행됐다. 두 작업 모두 reused=false, 독립 validator exit 0, 그래프 complete=true였다.
- **선택 재작업:** revision 3은 CLI에 `remove ID` 계약과 테스트를 추가하고 core 정의를 그대로 유지했다. core는 같은 actor·같은 출력의 성공 결과를 reused=true로 재사용했고, CLI만 새 actor에서 실행·검증됐다. 그래프 complete=true를 확인했다.

최종 결과를 대상 프로젝트로 그대로 내보내고 호스트에서도 Core/Remove/CLI 계약 테스트가 통과했다. 근거는 프로젝트 `.task-agent/requests/todo-demo/`의 `plan-revision2.json`, `plan-revision3.json`, `suspend-proof.json`, `resume-proof.json`, `resume-process-proof.json`, `proof-revision2.json`, `proof-revision3.json` 및 각 revision의 state/result 파일이다. 아래 최초 생성 시험과 후속 중단·재개 시험의 검증 범위를 구분한다.

## 2026-09-27 — AX 실행 경로와 전역 진입점 전환

최신 기준은 [engine/extensions.md](../../engine/extensions.md)다. AX 원본 65개 중 60개는 해시가 같고, 5개는 [잠금 파일](../../engine/upstream.lock.json)에 사유와 수정 해시를 기록했다. 원본 Go runner·gRPC·Redis Streams·controller·workspace·Substrate를 사용한다. AX의 옛 클라이언트에는 native credential injector가 없어 Substrate 클라이언트/인프라를 `ed6d2a1fc8ae8337eb055d51b0b767b023cb3b5c`로 일치시켰다.

Go 그래프 CLI는 프로젝트별 Redis 상태와 이벤트, 불변 AX Task 신원, 입력 의존성, 별도 검증 Task, 실제 Substrate 중단 관측, revision 변경과 동일 출력 재사용을 구현한다. golden template 준비 중 업무 명령을 실행하지 않도록 `task-agent-exec`가 기다린다. 준비된 실제 actor에 AX guest API로 activation을 전달한 뒤 syscall.Exec로 업무 명령을 시작한다. AX의 프로세스 감독을 재작성하지 않는다.

검증 근거:

- 전체 `go test ./...` 통과. 실제 Redis를 지정한 저장·재접속·state/event·동시 lock 검사 포함. 기본 테스트에서 Redis opt-in을 건너뛴 결과와 구분한다.
- 전용 `task-agent-ax-source` 클러스터에 원본 Substrate gVisor·RustFS snapshot·egress·credential provider 및 우리 AX server/controller와 Redis AOF/PVC를 배포했다. 기존 `task-agent-local` 클러스터는 변경하지 않았다.
- 최종 이미지 `localhost:5001/task-agent/codex@sha256:f2dab91d75c0399a9f67020354aefdfa0ee357bd4f3e18edae2905db95504976`에서 `ax-final-smoke` 의존 작업 2개와 각각의 별도 validator가 완료됐다. revision 2에서 produce는 재실행하고 동일 출력 `AX`를 받은 consume은 재사용했다. 통합 결과는 `AX-child`다.
- `ax-final-resume` revision 2는 중단 전 실제 명령이 count=1을 쓴 것을 AX guest로 확인했다. DATA 중단·재개 후 같은 actor에서 count=2를 만들고 별도 validator까지 통과했다. 제어 상태의 Running만으로 시험 시작을 판단하지 않았다.
- 네트워크를 끈 Docker 안에서 fake Codex 실행 파일로 activation 전 실행 안 됨, activation 후 시작, 정확한 session id로 resume, auth.json 없음 확인. 실제 모델 추론이나 로그인 검증의 근거로 세지 않는다.
- 전역 스킬과 역할을 AX 경로로 전환했다. 별도 프로젝트 context·문자 그대로의 argv·기존 SQLite --state 거절·TOML 및 실제 AX 래퍼 실행을 확인했다. named-role 로더를 통한 새 서브에이전트 호출은 별도 검증하지 않았다.

시험 계획과 상태는 로컬 `engine/.state/smoke/`의 `final-dag-proof.json`, `final-reuse-proof.json`, `final-resume-proof.json` 등에 보존한다. 이전 image·준비 대기·실패 시험은 같은 폴더와 임시 로그에 남아 있으며 최종 성공 근거와 구분한다.

사용자 명시적 승인 후 현재 ChatGPT 로그인 access token과 account id를 전용 로컬 클러스터의 인증 Secret에 동기화했다. refresh token은 전송하지 않았다. `/Users/seominyong/Downloads/source/task-agent-demo`에서 전역 스킬의 전담 서브에이전트가 작성한 `todo-demo` revision 1을 실행했다. 격리된 실제 Codex가 core → cli 두 작업을 수행했으며, 각각 별도 AX validator의 exit 0과 actor 중단을 확인하여 `complete: true`가 됐다. 엔진 소스 변경 없이 native 인증 주입과 실제 모델 호출을 종단 검증했다.

AX result의 원본 bytes로 `todo.mjs`, `cli.mjs`, `package.json`, `README.md`를 대상 프로젝트에 내보냈다. 호스트에서도 고정 core·CLI 계약 테스트가 통과했다. 대상 프로젝트 `.task-agent/requests/todo-demo/`의 `plan.json`, `result.json`, `proof.json`에 계약·결과·actor 신원·Codex 세션·출력 해시를 보존한다. 최초 생성 시험은 실제 Codex 생성과 의존 결과 전달을 검증했다. 후속 세션 중단·재개 시험은 이 문서 첫 절에 기록한다.

이 버전은 UTF-8 파일 계약의 연결 구현이다. read-only 입력 mount, 대용량 artifact 전송, 분산 fencing·자동 crash lock 회수, C01–C12 전체 수용을 완료했다고 주장하지 않는다. 이전 구현의 이력은 Git에서 확인하며 현재 엔진의 완료 근거로 사용하지 않는다.
