# 격리된 AI 에이전트 실행 — 계약과 구현

> 이전 설계의 구현·실험 기록이다. 2026-09-27부터 새 실행 엔진은 `engine/ax/`의 AX 원본을 기준으로 한다. 이 문서의 자체 Docker·인증 중계·선택적 supervisor 구현은 새 AX 기반의 완료 증거가 아니다.

작성일: 2026-09-27. 기존 C01–C12를 유지하고 C07–C09의 에이전트 실행 부분을 구체화한다. 기존 제품 구현은 참조하지 않는다. 실제 AX 코드 차용 범위는 [AX 원본 도입](ax-implementation-adoption.md)을 따른다.

## 1. 목표와 계약

목표를 해석해 계약·태스크 그래프를 만드는 계획 에이전트와, 각 leaf의 격리 공간에서 코드를 읽고 판단·수정하는 작업 에이전트를 구분한다. 실행기는 목표를 코드 수정 스크립트로 대신 구현하지 않는다.

- **AE01 실행 정의:** 에이전트 실행 파일과 인수, 자연어 목표, 읽기 전용 입력과 기대 산출물, 에이전트 버전이 고정된 이미지, 세션 저장 위치를 불변 태스크 명세에 기록한다. 문자열을 셸 명령으로 보간하지 않는다. 목표·에이전트·설정 변경은 spec digest와 재작업 판단에 반영한다.
- **AE02 권한:** 모델 통신과 인증은 실행 정책으로 명시한다. 호스트 로그인 전체나 Docker socket을 노출하지 않는다. secret 값은 계획·DB·산출물·checkpoint에 기록하지 않는다. 통신 허용 목록을 실제 집행할 수 없으면 시작을 거절한다. 모델 호출의 재시도로 비용이 중복될 수 있다는 의미와 배포·메시지 전송 같은 외부 효과를 구분한다.
- **AE03 수명:** 초기 실행과 세션 재개 명령을 구분한다. 재개는 파일과 해당 에이전트의 명시적 세션을 복원해 새 프로세스를 시작하는 것이다. SIGTERM을 자식 프로세스 그룹에 전달하고 제한 시간 뒤 종료한다. 전체 writer 종료 증거를 확인한 뒤 snapshot을 만든다. 세션이 없거나 호환되지 않으면 재개를 성공으로 가장하지 않는다.
- **AE04 결과:** 에이전트 종료 코드 0이나 완료 메시지만으로 태스크를 채택하지 않는다. 계약에 지정한 파일과 독립 검증기의 증거가 필요하다. 실패·중단·모델 연결 불가를 구분해 기록한다.

## 2. 설계 경계

계획 계층은 각 leaf의 목표·입출력 계약·실행 정의를 만든다. Runner는 읽기 전용 실행 문맥을 제공하고 에이전트 프로세스를 감독한다. 에이전트는 자신의 workspace만 수정하고 세션을 그 공간에 보존한다. Backend는 네트워크·인증·자원과 공간 격리를 집행한다. Controller는 기존 intent/fence/StopReceipt/checkpoint/adoption 흐름을 유지한다.

첫 에이전트는 Codex CLI 0.154.0이며 기존 호스트 ChatGPT 로그인을 사용한다. 제품별 세션 재개 인수를 일반 명령 실행과 혼동하지 않는다. 단순 파일 수정 fixture는 lifecycle 검증용이며 실제 AI 판단 검증으로 세지 않는다.

## 3. 구현 의존 순서와 수용 조건

1. 실행 계약·파서 → 목표와 세션 정의 검증, 기존 스크립트 계획 호환, 명세 변경 시 재작업 검증.
2. Runner 명령 감독 → 목표 전달, 새 실행/재개 분기, 실패·timeout·중단 및 자식 프로세스 종료 검증.
3. 모델 통신·인증 어댑터 → 허용된 통신만 가능하고 credential이 영속 상태에 남지 않는지 검증.
4. 실제 에이전트 종단 시험 → 자연어 목표로 파일을 읽고 수정·검증하며 중단 뒤 같은 작업 공간에서 이어가는지 확인.

2와 3이 모두 충족되어야 4를 수행한다. 모의 에이전트 통과와 실제 모델 연결 통과는 별도 보고한다.

## 4. AX에서 참고한 부분

[AX Runner 계약](https://github.com/google/ax/blob/main/docs/runner.md)은 runner가 task 명령을 자식 프로세스로 실행하고 작업 공간 준비와 종료 신호를 관리하도록 정의한다. [샌드박스 문서](https://github.com/google/ax/blob/main/docs/sandbox.md)는 에이전트 실행에 쓰이는 환경과 모델 인증 전달을 설명한다.

우리 시스템은 이 역할 분리를 참고한다. 결과 채택에는 기존 독립 검증을 유지하고, 네트워크와 secret 정책을 무시해 연결하지 않는다. AX의 컨테이너 유지·디버그 서버 구조 자체를 복제할 필요는 없다.

## 5. Codex 연결 구현

`ExecutionStep.agent`는 sessionPath와 resumeArgv를 선언한다. Runner가 태스크 목표·입출력을 JSON stdin으로 제공하고 중단된 동일 단계에만 resumeArgv를 사용한다. 기존 argv 단계는 그대로 동작한다. 이미지에는 digest뿐 아니라 로컬 Docker의 불변 `sha256:<image-id>`도 사용할 수 있다.

컨테이너는 `--network none`을 유지한다. Codex는 컨테이너 loopback의 HTTP 서버에 Responses 요청을 보내고, 서버는 태스크별 파일 통로로 호스트 중계기에 전달한다. 호스트만 기존 auth.json을 읽어 `https://chatgpt.com/backend-api/codex/responses`와 `/responses/compact`에 인증을 붙인다. 임의 URL·메서드·원격 도구·redirect는 허용하지 않는다. TLS는 호스트 fetch가 검증한다. workspace와 체크포인트에는 인증 파일을 넣지 않는다.

정책은 `network: restricted`, `allowedHosts: ["chatgpt.com"]`, `secretRefs: ["codex-chatgpt"]`, `allowedEffects: ["model-inference"]`를 모두 요구한다. secret reference는 작업 프로세스에 secret을 공개하는 권한이 아니라 호스트 중계기의 인증 사용 권한이다. 호스트 CLI는 `TASK_AGENT_CODEX_AUTH_FILE`로 명시적으로 연결한다. 검증기는 이 권한을 상속하지 않고 offline 정책으로 실행한다.

Codex의 실행 환경 내부에서는 Docker가 격리 경계이므로 CLI의 도구 실행 sandbox는 외부 격리를 사용한다. 호스트의 Codex 권한은 변경하지 않는다. 임시 CODEX_HOME은 컨테이너 `/tmp`에 두며 세션 transcript와 정확한 thread ID만 workspace에 주기적으로 보존한다. resume은 그 ID를 지정하고 `--last`로 다른 태스크를 추측하지 않는다.

모델 요청은 전송 전에 host-only claim을 남긴다. 프로세스 장애 후 결과가 불명확한 호출을 중계기가 자동 재전송하지 않는다. 모델 호출 실패 뒤 사용자가 작업을 재시도하면 추가 사용량이 발생할 수 있다. 모델 응답은 최대 32MiB까지 버퍼링하며 요청·응답 deadline이 있다. `run` 제어기가 실행 중이어야 중계가 진행된다. 로그인 만료 시 호스트 로그인 갱신이 필요하며 worker에게 refresh token을 주지 않는다.

### 확인한 OpenAI 근거

[공식 비대화형 실행 문서](https://learn.chatgpt.com/docs/non-interactive-mode)는 `codex exec`와 명시적 세션 ID를 받는 `exec resume`을 설명한다. [인증 문서](https://learn.chatgpt.com/docs/auth)는 ChatGPT 로그인, 로컬 자격 증명 저장, 사용자 정의 모델 제공자의 인증 구성을 설명한다. 여기서 사용한 ChatGPT 내부 Responses 경로는 공개 안정 API 계약이 아니다. 현재 설치 버전과 실제 실행으로 확인한 통합 경계이며 향후 Codex 변경에 맞춘 재검증이 필요하다.
