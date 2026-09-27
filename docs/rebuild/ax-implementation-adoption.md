# AX 원본 우선 도입 계약·설계

2026-09-27 사용자 결정: AX 설계·구현·내부 기술을 최대한 그대로 가져온다. 우리 요구에 꼭 필요한 차이만 수정한다. 선택적 Go supervisor 차용과 Node/Docker 실행기 중심 설계는 새 실행 엔진의 기준에서 제외한다. 기존 제품 구현은 요구사항이나 호환성 기준으로 사용하지 않는다.

## 1. 원본 보존을 기본 계약으로 삼는다

[engine/ax](../../engine/ax/)에 AX 원본 추적 파일 65개를 가져왔다. 출처는 [고정 커밋 d0bc38b](https://github.com/google/ax/tree/d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9)다. 현재 원본 65개 중 60개를 그대로 유지하고, 연결 및 Substrate 버전 정합성에 필요한 5개 파일만 수정했다. 원본 라이선스·저작권·Go 모듈·의존 버전·테스트·배포 명세를 보존한다. 자체 저장소에서 빌드하고 필요한 수정도 이 소스에 적용한다.

변경은 다음 조건을 모두 만족해야 한다. 기존 확장 지점·설정으로 충족할 수 없다는 근거가 있어야 한다. C01–C12 또는 사용자 요구와 연결되어야 한다. 최소 변경과 회귀 검증을 기록해야 한다. [원본 잠금 파일](../../engine/upstream.lock.json)의 원본 해시는 보존하며 수정 사유·수정 후 해시를 별도로 등록한다. `node engine/verify-upstream.mjs`로 미기록 변경을 거절한다.

## 2. 내부 기술과 수명주기를 유지한다

| 영역 | 기준 구현 | 우리 쪽 원칙 |
|---|---|---|
| API·조정·상태 | Go, protobuf/gRPC, Redis, Redis Streams, controller reconciler | 원본 경로를 사용하고 별도 Node 실행 제어기로 대체하지 않는다 |
| 격리·snapshot·통신 | AX Substrate client, Agent Substrate, 원본 actor template | 인증 주입을 지원하는 고정 Substrate 버전으로 서버·클라이언트 정합성 유지, gVisor·snapshot·egress 체계 사용 |
| 공간·프로세스 | AX workspace planner/setup, Go runner, metadata server, process group | 원본의 준비·감독·신호 전달 유지, 기존 hook 우선 사용 |
| 추가 요구 | 계약 DAG·변경 영향·검증/채택, Codex CLI·현재 로그인 | AX가 제공하지 않는 경계에만 추가하고 원본을 재구현하지 않는다 |

Substrate는 별도 인프라 의존성으로 유지한다. AX 소스에 Substrate를 임의 복사하지 않는다. native credential injection은 원본 AX가 고정한 Substrate 버전에 구현되어 있지 않아, 서버와 Go 클라이언트를 ed6d2a1 커밋으로 함께 고정했다. SnapshotConfig·WakeupProbe 필드명 대응은 이 버전 정합성에 필요한 변경이다. AX의 기본 재개 정책은 DATA snapshot에서 새 실행이다. runner가 명령 완료 후 계속 살아 있으므로 AX의 Running을 업무 성공으로 해석하지 않는다.

## 3. 필요한 차이만 연결한다

계약 DAG는 실행 가능한 leaf를 AX Task로 제출하고 정확한 graph revision·task revision·attempt와 연결한다. AX의 Task·Actor·Workspace를 별도 자체 실행 자원으로 대체하지 않는다. 그래프 변경 영향과 검증 후 채택은 AX 위의 기능으로 추가한다. Redis를 쓰는 그래프 상태의 원자성·중복 전달 계약은 구현 전에 명시하고 검증한다. 과거 SQLite 구현이 기술 선택을 제한하지 않는다.

Codex는 AX runner가 실행하는 명령과 이미지로 연결한다. 기존 `OnCommandExit` 등 확장 지점을 먼저 사용한다. 현재 ChatGPT 로그인 지원을 위한 인증 연결은 Substrate의 통신·비밀 전달 경계에 맞춰 설계한다. 앞서 만든 호스트 파일 mailbox 중계는 채택한 기술이 아니다. 로그인 비밀이 workspace·snapshot·로그에 들어가면 안 된다.

C07–C10의 중단 증거와 단일 writer 계약은 그대로 지킨다. 원본 reconciler의 suspend 실패 후 상태 처리와 template 생성 실패 시 fallback을 확인 대상으로 삼는다. 오류가 있었는데 중단 성공 또는 요구 이미지 실행으로 간주해서는 안 된다. 원본으로 계약을 충족할 수 없음이 확인된 경계만 작은 수정으로 보완한다.

## 4. 연결 작업과 완료 기준

작업 의존성은 `AX01 → AX02 → AX03 → AX04 → AX05`다.

| 작업 | 산출물과 완료 조건 | 현재 상태 |
|---|---|---|
| AX01 원본 기반 | 소스·라이선스·고정 해시·원본 전체 테스트 | 도입·원본 차이 검증 완료 |
| AX02 원본 인프라 | 고정 Substrate 버전, Redis·gRPC·gVisor actor·DATA 재개 | 전용 로컬 클러스터 실제 검증 완료 |
| AX03 계약 그래프 | Go Plan·AX Task 매핑, Redis 상태/event, 별도 validator, 선택적 재사용 | 제한된 파일 계약 구현·실제 검증, C01–C12 전체 충족은 아님 |
| AX04 Codex 연결 | AX runner·native egress·현재 로그인 sync·정확한 세션 재개 | native 인증·실제 Codex 구현·동일 actor/세션 재개 확인, 중단 시점은 첫 도구 호출 전 |
| AX05 전역 진입점 | 전역 스킬·역할·프로젝트별 연결 | 전역 스킬 위임·별도 프로젝트 생성·독립 검증·선택 재작업 확인 |

제거한 이전 실행기의 시험 결과는 AX02–AX05의 완료 근거로 사용하지 않는다. 전역 스킬의 실행 대상은 `engine/ax/bin/task-agent`로 전환했다. 기존 SQLite 작업을 Redis로 자동 이관하지 않는다. 상세 지원 범위와 검증 한계는 [확장 문서](../../engine/extensions.md)를 따른다.
