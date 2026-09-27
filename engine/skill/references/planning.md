# AX 기반 Plan

새 목표의 Plan을 만들기 전에 [인터뷰 연결](discovery.md)의 경로별 설계 검토를 완료한다. architectural 작업은 검토된 spec에서 Superpowers writing-plans 단계로 넘어온 뒤 작성한다. 문서 계획의 입력·출력 인터페이스와 검증 조건을 아래 형식에 옮긴다. Plan JSON에 임의 인터뷰 필드를 추가하지 않는다.

계획은 JSON이다. `id`와 task `id`는 영문 소문자로 시작하는 40자 이내 소문자·숫자·하이픈이다. revision은 1부터 시작한다. 지원하지 않는 기존 GraphBundle을 그대로 제출하지 않는다.

각 task는 `id`, `goal`, `contract`, `image`, `command`, `files`, `inputs`, `outputs`, `validator`를 가진다. image와 validator.image는 `repository@sha256:<64 hex>`다. command는 셸 문자열이 아닌 argv 배열이다. files는 작업 공간의 상대 파일 경로와 UTF-8 내용이다. inputs는 로컬 경로에서 `{task, output}`로의 매핑이며 생산자의 선언된 output을 가리킨다. outputs는 상대 파일 경로 배열이다. validator는 별도 image·command·files로 고정된 검증을 정의한다. 검증 파일로 후보 산출물을 덮어쓸 수 없다.

Codex task command는 `["/usr/local/bin/task-agent-codex", "<사용자가 선택한 모델>", "<goal과 contract를 포함한 실제 목표>"]`다. image는 이 저장소의 engine/codex/Dockerfile로 빌드한 digest를 사용한다. 자연어 목표를 미리 정답을 쓰는 스크립트로 바꾸지 않는다. AX runner가 Codex CLI를 직접 실행하고 Substrate가 격리를 담당한다. 모델 통신에는 현재 로그인을 native credential provider로 동기화한 설정이 필요하다.

입력과 결과는 현재 일반 UTF-8 파일만 지원한다. 파일당 1 MiB, 총 출력 4 MiB 한도다. 다음 작업으로 전달할 전체 Workspace YAML은 32 KiB 이하만 지원한다. 심볼릭 링크·디렉터리·바이너리·외부 부작용·임의 네트워크·일반 비밀 전달이 필요한 작업은 지원한다고 주장하지 않는다. 입력은 각 actor에 독립 복사되며 파일 시스템 차원의 read-only 입력 mount는 아직 제공하지 않는다. 이를 요구하는 계약이면 실행 전에 미지원으로 보고한다.

계획에 의도한 수용 조건을 검증하는 validator를 정의한다. Codex가 작성한 성공 문구나 task의 exit 0을 validator 대신 사용하지 않는다. 검증 전용 파일을 생산 task의 산출물과 겹치게 만들지 않는다.
