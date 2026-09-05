# 로컬 Docker 서버

AWS 배포용 Dockerfile과 인증된 remote MCP 서버를 그대로 사용한다. HTTPS는 Caddy, 인증은 Cognito 대신 Keycloak으로 구성한다. Task는 운영 구성과 같은 SQLite 볼륨에 저장하며 PostgreSQL은 Keycloak 전용이다. localhost 전용이므로 다른 PC에서 접속하는 구성은 아니다.

## 최초 준비

Node.js 24 이상과 Docker가 필요하다. 저장소 루트에서 실행한다.

```sh
npm ci
node scripts/prepare-local-docker.ts
docker compose --env-file data/local-docker/.env -f deploy/local/compose.yaml up -d --build
docker compose --env-file data/local-docker/.env -f deploy/local/compose.yaml cp ca-export:/trust/root.crt data/local-docker/root.crt
```

인증 서버의 초기 기동에는 추가 시간이 걸릴 수 있다. 연결 주소는 `https://localhost:8443/mcp`다. 준비 스크립트는 임의의 테스트 계정과 비밀번호를 `data/local-docker/login.txt`에 생성한다. 생성 파일은 Git에서 제외되며 비밀번호를 출력하지 않는다. 기존 계정 ID, 비밀번호와 `agent.env`는 재실행해도 유지한다. realm.json의 변경은 이미 생성된 Keycloak realm에 자동 반영되지 않는다.

브라우저 로그인에는 `data/local-docker/root.crt`를 로컬 신뢰 인증서로 한 번 등록해야 한다. macOS에서는 키체인 접근에서 이 인증서를 가져와 신뢰 설정을 확인한다. 이는 로컬 CA를 신뢰하는 보안 설정이므로 스크립트가 자동 변경하지 않는다. 인증서 경고 무시나 TLS 검증 해제는 사용하지 않는다. Node 클라이언트는 아래 설정의 `NODE_EXTRA_CA_CERTS`로 이 연결에만 CA를 추가한다.

## Codex·Claude 안에서 사용

`data/local-docker/codex-mcp.toml` 또는 `claude-mcp.json`을 기존 MCP 설정에 병합한다. 같은 디렉터리의 해당 호스트 `*-hooks.json`도 기존 훅 설정에 병합한다. 기존 설정을 덮어쓰지 않는다. 공통 동작과 Host 지침은 [대화 내 사용 안내](../../docs/in-host-experience.md)를 따른다.

호스트를 다시 시작한 뒤 “Task Agent에 연결하고 이 작업을 기록해 줘”라고 요청한다. 제공된 로그인 링크에서 `login.txt`의 테스트 계정으로 로그인한다. 이후 작업 조회·기록 연결·종료 시 기록은 기존 원격 연동 경로를 사용한다. 매 작업마다 CLI 로그인이나 Task ID 입력은 필요하지 않다. 종료 훅의 대화는 로컬 outbox에 먼저 보관하며, 종료 시 전송하지 못한 내용은 다음 호스트 실행에서 재시도한다.

자연어 처리는 컨테이너의 OpenCode 모델을 사용하며 완전 오프라인이 아니다. 필요하면 실행 셸의 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`를 설정하고 agent를 재생성하거나, `data/local-docker/opencode-auth.json`에 OpenCode에서 정상 발급받은 인증을 구성한다. 다른 앱의 인증 파일을 임의 복사하지 않는다. `agent.env`의 `TASK_AGENT_MODEL`로 모델을 지정할 수 있다.

## 검증과 재시작

```sh
NODE_EXTRA_CA_CERTS="$PWD/data/local-docker/root.crt" node scripts/smoke-local-docker.ts
NODE_EXTRA_CA_CERTS="$PWD/data/local-docker/root.crt" TASK_AGENT_SMOKE_MODEL=1 node scripts/smoke-local-docker.ts
docker compose --env-file data/local-docker/.env -f deploy/local/compose.yaml ps
docker compose --env-file data/local-docker/.env -f deploy/local/compose.yaml stop
docker compose --env-file data/local-docker/.env -f deploy/local/compose.yaml up -d
```

첫 검증은 실제 로그인 폼·PKCE·토큰 갱신·사용자 격리·쓰기 권한을 검사한다. 두 번째는 실제 모델 호출과 테스트 Task 생성을 포함하므로 모델 비용이 발생할 수 있다. Task 이름에 `Docker 실사용 검증`이 붙는다. 인증 테스트용 토큰은 실제 사용자 연결과 분리된 smoke 자격 증명 DB에 저장한다.

컨테이너 재시작과 일반 `down`은 볼륨을 유지한다. `down -v` 또는 Docker 볼륨 삭제는 Task·인증 계정·인증서를 잃게 하므로 사용하지 않는다. `data/local-docker`도 연결 설정과 자격 증명을 포함하므로 보존한다. AWS에서는 localhost/로컬 CA/Keycloak을 실제 도메인·공인 TLS·Cognito로 교체한다. 이 환경은 AWS IAM·네트워크·백업 복구 검증을 대체하지 않는다.
