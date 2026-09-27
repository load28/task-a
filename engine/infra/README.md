# AX 로컬 실행 환경

저장소 루트에서 실행한다. Node.js 24+, Go 1.27.1 toolchain, Git, Docker, kind, kubectl, ko가 필요하다. Substrate 소스는 [잠금 파일](substrate.lock.json)의 commit으로 고정한다. ARM64 로컬 환경의 실제 검증 근거는 [구현 상태](../../docs/rebuild/implementation-status.md)에 있다.

## 처음 준비하는 전용 클러스터

```sh
node engine/infra/local.mjs prepare
export TASK_AGENT_SUBSTRATE_SOURCE="$PWD/engine/.state/substrate"
node engine/infra/local.mjs create
node engine/infra/local.mjs install
node engine/infra/local.mjs deploy
node engine/infra/credentials.mjs
npm run build
```

`prepare`는 고정한 원본 소스를 가져오고, `create`와 `install`은 원본 설치 스크립트를 호출한다. `deploy`는 이 저장소의 AX server/controller와 원본 Substrate worker를 빌드한다. 클러스터 이름은 `task-agent-ax-source`, kubeconfig는 `engine/.state/local/kubeconfig`다. 같은 클러스터나 공유 `kind-registry`가 이미 있으면 `create`는 덮어쓰기를 거절한다. 이미 준비된 환경은 생성 단계를 반복하지 않는다.

기존 소스 checkout을 사용하려면 `TASK_AGENT_SUBSTRATE_SOURCE`를 해당 절대 경로로 지정한다. 원본 commit이 잠금 파일과 다르면 거절한다. 각 단계는 필요한 도구와 네트워크를 사용하므로 오류가 나면 다음 단계로 넘어가지 않는다.

## 실행 이미지와 로그인

```sh
docker build -f engine/codex/Dockerfile -t localhost:5001/task-agent/codex:local engine
docker push localhost:5001/task-agent/codex:local
```

push가 반환한 `sha256` digest를 Plan의 task·validator image에 `localhost:5001/task-agent/codex@sha256:...` 형태로 기록한다. Docker build context는 어댑터와 컴파일된 AX guest 바이너리만 포함한다.

인증 provider 설치와 사용자 로그인 값 저장은 별도 단계다. 현재 ChatGPT 로그인 사용이 허용된 환경에서 다음 명령으로 access token과 account id만 전용 클러스터 인증 Secret에 저장한다. refresh token과 auth.json은 actor에 전달하지 않는다. 로그인 값은 출력하거나 Plan에 넣지 않는다.

```sh
node engine/codex/sync-login.mjs engine/.state/local/kubeconfig kind-task-agent-ax-source ax-system
```

## 연결과 운용

```sh
npm run infra:connect
```

프로세스가 localhost AX·Redis·Substrate·guest router 포트를 연결하고 2시간 수명의 Substrate 제어 토큰을 준비한다. 전역 스킬과 `npm start -- ...`는 `engine/.state/local/connection.json`을 읽는다. 프로세스를 유지하고, 연결 종료나 토큰 만료 후에는 다시 연결한다. ChatGPT access token 만료는 별도로 로그인 갱신·동기화가 필요하다.

Plan과 실행 명령은 [루트 안내](../../README.md), 지원 범위와 복구 제약은 [확장 문서](../extensions.md)를 따른다. 이 안내의 설치 명령은 기존 클러스터나 사용자 데이터를 자동으로 삭제하지 않는다.
