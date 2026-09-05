# AWS 배포 절차

## 배포 범위와 현재 제한

EC2 한 대, Docker Compose, Caddy HTTPS, 서버 디스크의 SQLite, Cognito 로그인, S3 백업을 사용한다. 여러 장소의 Host는 같은 `/mcp`에 접속한다. DB는 외부에 노출하지 않는다. 이 서버 전체는 하나의 `(issuer, sub)` 소유이며 이메일이나 요청 본문의 사용자 ID를 신뢰하지 않는다. 다른 사용자와 공동 소유하는 다중 tenant 서비스가 아니다.

템플릿은 아직 실제 AWS에 적용하지 않았다. AWS 로그인·리전·도메인·콜백 URL·본인 Cognito 계정 및 모델 설정이 필요하다. EC2, 디스크, 공인 IPv4, Cognito, S3와 모델 호출은 비용을 발생시킨다. 계정과 예상 비용을 확인한 후 change set을 실행한다. EBS·Cognito·ECR·S3는 삭제 시에도 보존되므로 스택 삭제만으로 모든 비용이 끝나지 않는다.

로컬 검증: 자동 테스트, 공식 SDK 원격 MCP 검사, Linux amd64 이미지 빌드가 기준이다. 두 CloudFormation 템플릿은 cfn-lint 검사를 통과했다. 이 결과는 AWS 배포·Cognito 대화형 로그인 완료를 뜻하지 않는다.

## AWS 리소스 준비

1. 사용할 AWS 프로필로 로그인하고 `aws sts get-caller-identity`로 계정을 확인한다. 비밀키를 채팅이나 저장소에 넣지 않는다.
2. `aws-server.json`과 `aws-auth.json`을 `aws cloudformation validate-template`로 검사한다. 리전은 모든 명령에 명시한다. 로컬 JSON 검사만으로 AWS 배포 가능성을 확정하지 않는다.
3. 서버 change set을 먼저 만든다. `--no-execute-changeset`으로 리소스·IAM 권한을 검토한 후 콘솔에서 실행한다.

```sh
aws cloudformation deploy --region "$AWS_REGION" \
  --stack-name private-task-agent-server --template-file deploy/aws-server.json \
  --capabilities CAPABILITY_IAM --no-execute-changeset
```

서버 출력의 PublicIp로 도메인 A 레코드를 설정한다. 인증 스택에는 다음 파라미터를 전달한다.

- ResourceUrl: `https://실제도메인/mcp`
- LoginDomainPrefix: 사용 가능한 Cognito 도메인 접두사
- ChatGPTCallback: ChatGPT 연결 설정 화면에서 복사한 정확한 콜백 URL
- ClaudeCallback: 고정한 Claude Code 콜백 포트의 정확한 URL

```sh
aws cloudformation deploy --region "$AWS_REGION" \
  --stack-name private-task-agent-auth --template-file deploy/aws-auth.json \
  --parameter-overrides "ResourceUrl=$TASK_AGENT_RESOURCE" \
    "LoginDomainPrefix=$TASK_AGENT_LOGIN_PREFIX" \
    "ChatGPTCallback=$TASK_AGENT_CHATGPT_CALLBACK" \
    "ClaudeCallback=$TASK_AGENT_CLAUDE_CALLBACK" \
  --no-execute-changeset
```

Cognito는 공개 가입을 막고 MFA를 요구한다. AWS 콘솔에서 본인 사용자만 생성하고 초기 비밀번호 변경·TOTP 등록을 마친다. 본인의 변경 불가능한 `sub`를 확인한다. 계정 생성이나 로그인만으로 Task 소유권이 부여되지는 않는다. `TASK_AGENT_OWNER_SUBJECT`와 일치해야 한다.

## 컨테이너와 인증 연결

Codex/Claude 공통 작업 클라이언트는 인증 스택의 `WorkClientId`를 사용한다. 이 ID를 서버의 `TASK_AGENT_CLIENT_IDS` 허용 목록에도 추가하고 각 호스트의 MCP OAuth 설정으로 로그인한다.

로컬 Docker 엔진에서 `docker build --platform linux/amd64 -t task-agent:release .`로 검증한 뒤 서버 스택의 ECR에 업로드한다. 태그 대신 실제 image digest를 배포에 사용한다. EC2에는 SSM Session Manager로 접속하고 Docker Compose 플러그인을 공식 Docker 설치 방법으로 설치한다. SSH 포트는 열지 않는다.

`compose.yaml`, `Caddyfile`, `backup.sh`는 `/opt/task-agent`에 둔다. `agent.env.example`을 참고해 `/etc/task-agent/agent.env`를 생성하고 권한을 600으로 제한한다. 예시 issuer 대신 실제 Cognito discovery의 issuer와 JWKS URI를 사용한다. 템플릿과 user data에는 비밀을 넣지 않는다.

`/opt/task-agent/.env`에는 비밀이 아닌 `TASK_AGENT_IMAGE=ECR주소@sha256:실제다이제스트`와 `TASK_AGENT_DOMAIN=실제도메인`을 설정한다. 이어서 다음을 실행한다.

```sh
docker compose -f /opt/task-agent/compose.yaml up -d
docker compose -f /opt/task-agent/compose.yaml ps
```

배포 후 `node scripts/check-auth.ts`로 discovery와 S256 광고를 검사한다. Cognito managed login과 resource binding이 켜져 있어야 access token의 `aud`가 MCP resource와 일치한다. 검사 실패를 우회하거나 다른 audience를 허용하지 않는다. 실제 ChatGPT와 Claude Code에서 authorization code + PKCE 로그인, `aud`, scope, refresh, 연결 철회를 끝까지 검증해야 한다. Cognito 메타데이터가 MCP 계약에 맞지 않으면 공개 운영을 중단하고 인증 어댑터 또는 제공자 설정을 보완한다.

ChatGPT는 사전 등록 OAuth Client 방식으로 ChatGPTClientId를 사용한다. 등록 화면의 콜백 URL을 Cognito에 정확히 등록하며 임의로 추측하지 않는다. Claude Code도 별도 ClaudeClientId를 사용한다. 설치된 버전에서 지원하는 OAuth 설정은 공식 문서를 확인한다.

```sh
claude mcp add-json task-agent '{"type":"http","url":"https://실제도메인/mcp","oauth":{"clientId":"CLAUDE_CLIENT_ID","callbackPort":8080}}'
```

일반 REST 서버 명령 `npm start` 대신 원격 전용 `npm run remote`만 공개 운영한다. Docker 기본 명령도 이 원격 모드를 사용한다. `/v1/*`와 정적 공유 토큰 인증은 원격 모드에 없다.

## 백업·복구와 접근 철회

`backup.sh`는 SQLite online backup API와 integrity_check를 사용한다. 실행 중인 DB 파일만 단순 복사하지 않는다. 서버 역할로 비공개 S3에 업로드하고 성공 후에만 임시 파일을 제거한다. `/etc/task-agent/backup.env`에는 `AWS_REGION`과 `TASK_AGENT_BACKUP_BUCKET`을 넣는다. 제공한 systemd service와 timer를 설치하고 `systemctl enable --now task-agent-backup.timer`로 활성화한다. 첫 백업과 복구 검사를 성공시킨 뒤 운영한다.

복구는 서비스를 멈춘 상태에서 새 Docker volume에 수행한다. 백업 DB를 검증한 뒤 새 volume의 `/data/tasks.db`로 배치하고 node 사용자 소유권을 설정한다. 기존 volume은 유지한다. 기존 소유자 `(issuer, sub)`와 일치하는 설정으로 다시 시작하여 Context를 확인한다. EBS가 남아 있어도 EC2 재생성 시 자동 복원되지는 않는다.

Cognito의 refresh token 철회는 이미 발행된 JWT를 즉시 무효화하지 않는다. access token 유효기간은 5분이다. 즉시 전체 차단하려면 `TASK_AGENT_REVOKED_BEFORE`를 현재 Unix 초로 갱신하고 재시작한다. 특정 연결은 `TASK_AGENT_CLIENT_IDS`에서 해당 ClientId를 제거하여 재시작하고 Cognito에서도 철회한다. 소유자 변경은 기존 DB 재할당을 거부한다.

출처: [OpenAI 인증](https://developers.openai.com/plugins/build/auth), [Claude Code MCP](https://code.claude.com/docs/en/mcp), [Cognito resource binding](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html), [Cognito PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html).
