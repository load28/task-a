# AX 기반 Task Agent 확장

실행 경로는 `task-agent` Go CLI → AX gRPC → AX Redis Streams/controller → Substrate actor → AX Go runner다. 그래프 상태도 같은 Redis에 별도 prefix로 저장한다. 자체 Docker backend·SQLite·파일 mailbox 모델 중계는 사용하지 않는다.

## 계약과 지원 범위

Plan은 `id`, `revision`, `tasks`를 가진다. task의 계약·목표·고정 image·argv·입력 파일·의존 출력·산출물·검증기를 명시한다. [계획 안내](skill/references/planning.md)를 따른다. 기존 `greenfield` GraphBundle과 상태는 자동 변환하지 않는다. C01–C12 전체 구현 완료를 의미하지 않으며, 아래 지원 범위 안에서만 사용한다.

Go 그래프 확장은 각 leaf를 AX Task와 Workspace로 만든다. 원본 golden snapshot 생성 중에는 task-agent-exec가 업무 argv 실행을 기다린다. 실제 actor가 Running이고 egress가 설정된 뒤 기존 AX guest 파일 API로 실행 허가를 전달한다. 진입 명령은 syscall.Exec로 교체되며 별도 감독기를 만들지 않는다. 이미지·명령 감독·actor·snapshot·네트워크는 AX/Substrate 구현을 사용한다. 프로젝트 실경로의 해시로 Redis key와 actor 신원을 분리한다. 입력은 다른 actor의 출력 bytes를 독립 복사한다. 직접 공유하는 가변 작업 공간은 없다. 현재 파일 시스템 차원의 읽기 전용 입력 mount는 제공하지 않는다.

결과는 AX `OnCommandExit` hook으로 수집한다. 종료된 명령 뒤에도 AX runner와 metadata 서버는 그대로 살아 있다. 기존 AX guest gRPC로 후보를 읽고, Substrate의 실제 SUSPENDED 상태와 worker assignment 해제를 확인한다. 후보를 별도의 AX validator Task로 전달하고 검증기 종료·중단까지 확인해야 채택한다. AX Running 또는 명령 exit 0만으로 완료하지 않는다. 결과 receipt는 작업 공간에 있으므로 악의적인 작업 코드에 대한 별도의 신뢰 경계로 보장하지 않는다.

지원 산출물은 UTF-8 일반 파일이며 파일당 1 MiB, 합계 4 MiB다. 다음 task로 전달하는 전체 Workspace YAML은 AX 환경 변수 전달 방식에 맞춰 32 KiB 이하여야 한다. 더 큰 데이터, 바이너리·디렉터리 산출물, symlink는 별도 artifact 전송 확장을 구현하기 전 지원하지 않는다. 검증 명령도 이 이미지의 AX runner hook과 task-agent-exec를 포함해야 한다. 외부 부작용이 없는 재실행 가능한 명령만 제출한다.

## 변경과 중단·재개

AX Task는 불변이다. Plan revision을 정확히 1 증가시켜 변경한다. 진행 중인 actor가 있다면 먼저 suspend와 실제 중단 확인을 완료한다. 새 revision의 task 정의와 해결된 입력 bytes가 같으면 이전 검증 결과를 재사용한다. 상위 task가 재실행돼도 출력 bytes가 같으면 후속 task를 재사용할 수 있다. `impact`는 사전 영향 후보이며 실제 재사용 판정은 입력이 준비된 뒤 이루어진다.

재개는 AX의 DATA snapshot에서 동일 actor를 재시작한다. AX 초기화 marker는 확장 task에 한해 durable workspace 안에 두어 재개 시 초기 파일로 덮어쓰지 않는다. 완료 receipt가 있으면 명령을 다시 실행하지 않는다. 미완료 Codex는 저장한 정확한 session id로 `codex exec resume`한다. 프로세스 메모리·소켓 복원이 아니다.

그래프 state와 event는 Redis MULTI/EXEC으로 같이 저장한다. 외부 요청 전에 결정된 task 신원을 저장하므로 응답 유실 뒤 같은 Task를 재조회한다. 운영 명령은 Redis의 만료 없는 lock으로 직렬화한다. 강제 종료로 lock이 남으면 자동 만료시키지 않는다. lock의 host/PID 소유자가 종료됐고 후속 명령이 전달되지 않음을 확인한 운영자만 해당 lock을 복구할 수 있다. 분산 lease/fencing과 자동 장애 복구는 아직 제공하지 않는다. AX controller는 현재 배포처럼 replica 1로 운용한다.

## Codex와 현재 로그인

`codex/Dockerfile`은 우리 소스로 빌드한 AX runner와 고정 Codex CLI를 포함한다. 명령은 `/usr/local/bin/task-agent-codex MODEL GOAL`이다. Codex Home과 session은 durable 공간에 두되 auth 파일이나 refresh token은 넣지 않는다. 현재 로그인에서 access token과 account id만 Kubernetes credential provider에 동기화한다.

Substrate native egress가 `chatgpt.com` TLS를 중계하고 지정한 credential URI에서 Authorization·ChatGPT-Account-Id를 주입한다. actor에는 원본 `systemInfo.trustBundle`로 CA를 투영한다. validator의 egress policy는 빈 규칙으로 TCP 외부 요청을 거절한다. Substrate DNS relay는 egress 정책과 별개이므로 DNS까지 차단했다고 주장하지 않는다.

`node codex/sync-login.mjs KUBECONFIG CONTEXT NAMESPACE`는 로컬 로그인 값을 출력하거나 plan에 기록하지 않는다. refresh token을 전송하지 않으며 만료 시 Codex로 로그인 상태를 갱신한 뒤 재동기화한다. 비밀을 환경 변수로 actor에 전달하거나 자체 호스트 모델 proxy로 우회하지 않는다. ChatGPT backend URL은 안정성을 보장하는 공개 API가 아니므로 실제 로그인 연동 검증을 별도 기록한다.

## 빌드·배포·운용

`node build.mjs`는 원본 모듈에서 CLI·server·controller·Linux runner를 빌드한다. `infra/local.mjs`는 고정한 Substrate 소스의 공식 설치 스크립트를 호출하고 AX 배포 manifest를 최소 설정 변경으로 적용한다. 우리의 AX 코드를 빌드하며 외부 AX CLI를 설치해 대신 호출하지 않는다. Redis에는 AOF와 PVC를 추가한다. snapshot bucket과 이미지 registry는 전용 로컬 환경에 맞춘다.

전용 클러스터 이름은 `task-agent-ax-source`다. 원본 create 스크립트의 삭제 동작을 피하기 위해 기존 같은 이름 클러스터나 공유 registry가 있으면 create를 거절한다. 기본 kubeconfig를 바꾸지 않고 `engine/.state/local/kubeconfig`를 쓴다. `TASK_AGENT_SUBSTRATE_SOURCE`는 infra lock에 맞는 소스 경로다.

접속 설정은 `TASK_AGENT_AX_ENDPOINT`, `TASK_AGENT_REDIS_ADDR`, `TASK_AGENT_SUBSTRATE_ENDPOINT`, `TASK_AGENT_SUBSTRATE_AUTHORITY`, `SUBSTRATE_TOKEN_FILE`, `SUBSTRATE_CA_FILE`, `TASK_AGENT_ROUTER`, `TASK_AGENT_ATESPACE`다. AX·Redis의 로컬 포워딩은 신뢰된 호스트 연결에만 연다. Codex에는 `TASK_AGENT_CODEX_CREDENTIAL_URI=ate-secret://k8s.io/default/ax-system/task-agent-codex`도 필요하다.

CLI: `validate PLAN`, `impact PLAN`, `apply PLAN`, `status ID`, `run ID`, `suspend ID`, `resume ID`, `result ID`. `--project`와 다른 옵션은 명령 앞에 둔다. run은 한 번의 유한 조정이다. 이후 status 확인과 다음 run으로 진행한다. 완료가 아니면 result는 실패한다.

전용 환경의 `node infra/connect.mjs`는 localhost 포워딩과 수명이 제한된 제어 토큰을 준비한다. 이 프로세스를 실행한 동안 전역 래퍼가 `.state/local/connection.json`을 읽는다. 포워딩 종료나 토큰 만료 후에는 재연결해야 한다.
