# 격리된 Codex leaf

계획 에이전트가 작성한 명세의 자연어 목표를 컨테이너 내부 Codex CLI가 받아 직접 파일을 읽고 수정한다. Node 24와 Codex CLI 0.154.0이 들어 있는 이미지를 `Dockerfile`로 만들고 정확한 image digest 또는 로컬 `sha256:<image-id>`를 사용한다.

`index.ts`의 `codexStep({ id, model, outputs, timeoutMs })`를 design.steps에 넣는다. model은 명시적으로 전달한다. 정책은 `chatgptInferencePolicy`와 유한 자원 한도를 사용한다. sourceSnapshots로 초기 프로젝트를 제공하고, outputPorts의 경로는 에이전트 sessionPath와 겹치지 않게 한다. 요구를 검증하는 별도 argv/schema 검증기를 지정한다.

호스트에서 `TASK_AGENT_CODEX_AUTH_FILE=<기존 Codex auth.json 경로>`로 실행한다. 파일이나 토큰을 컨테이너에 복사하지 않는다. backend는 `chatgpt` 모드의 인증을 읽어 고정된 ChatGPT Responses 경로에 요청한다. 새로운 API 키는 필요하지 않다. 로그인 만료나 모델 접근 실패는 호스트에서 해결한다.

컨테이너는 `--network none`이다. 로컬 HTTP→태스크 전용 파일 통로→호스트 인증 중계기로 모델 요청만 전달한다. shell, 배포, 외부 메시지 전송을 호스트에서 대신 실행하지 않는다. 중계기는 임의 URL·redirect·원격 내장 도구를 거절하며 검증기에는 모델 권한을 전달하지 않는다.

`run` 제어기가 실행 중이어야 중계가 진행된다. 요청당 유한 deadline과 크기 제한이 있고 응답은 버퍼링된다. 제어기 장애로 결과가 불명확한 요청은 자동 재전송하지 않는다. 사용자가 작업을 재시도하면 모델 사용량이 추가될 수 있다.

Codex 세션 transcript와 명시적 thread ID는 `.agent/<step id>`에 보존한다. 재개 시 해당 세션 ID를 사용하며 다른 태스크의 최근 세션을 검색하지 않는다. 임시 CODEX_HOME·인증·cache·소켓은 checkpoint에 넣지 않는다. 중단 후 worker 전체 종료가 확인되어야 checkpoint를 채택한다.

AX에서 차용한 Go 명령 감독기를 함께 쓰려면 `node greenfield/runner-go/build.mjs` 후 `TASK_AGENT_STEP_SUPERVISOR_PATH=<생성된 실행기>`를 설정한다. 표준 Go만 빌드에 필요하며 AX 서버·Redis·Kubernetes는 요구하지 않는다.
