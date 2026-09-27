# AX 소스 기반 실행 엔진

`ax/`는 Google AX의 소스를 이 저장소에서 소유·빌드·수정하는 실행 엔진 기반이다. 외부 AX CLI 설치를 우리 엔진 대신 호출하는 구성이나 일부 알고리즘만 재작성하는 구성이 아니다. 고정한 원본 추적 파일 65개 중 60개는 바이트 그대로 유지하고, 불가피한 연결 5개 파일만 수정했다. 추가 코드는 별도 taskgraph·Codex·운용 경계에 둔다.

- 원본: https://github.com/google/ax
- 커밋: `d0bc38bcf90bb2ad9c012ff1be9d68ff05347ba9`
- 라이선스: [Apache 2.0](ax/LICENSE). 원본 저작권 헤더를 보존한다.
- 파일별 원본 SHA-256과 변경 사유: [upstream.lock.json](upstream.lock.json)

Go 모듈 경로 `github.com/google/ax`는 내부 import 변경을 피하려고 보존했다. 이 프로젝트가 Google 공식 배포판이라는 의미는 아니다. 원본 README·배포 파일·이미지 저장소 기본값도 비교를 위해 보존했다. 실제 배포에서는 우리 저장소·클러스터·snapshot 저장소를 명시해야 한다.

## 유지하는 기술

Go CLI → gRPC server → Redis 상태·Streams → Go controller → Agent Substrate → 격리된 Go runner의 구조를 유지한다. Substrate의 격리·snapshot·네트워크 구현을 사용하며 자체 Docker backend나 파일 mailbox로 대체하지 않는다. Substrate는 native credential injection을 지원하는 고정 커밋으로 서버와 Go 클라이언트를 일치시켰다. 이 불가피한 의존성 변경은 lock에 기록한다. 인프라 소스를 별도로 고정할 때도 AX가 요구하는 버전과의 호환성을 확인한다.

AX 기본 snapshot 정책은 DATA다. 프로세스 메모리까지 복원하는 구성으로 임의 변경하거나 그렇게 동작한다고 설명하지 않는다. runner가 명령 종료 뒤 살아 있는 동작도 그대로 유지한다.

## 변경 규칙과 검증

기존 확장 지점이나 배포 설정으로 충족할 수 있으면 원본을 수정하지 않는다. 불가피한 수정에는 충족해야 하는 계약, 원본으로 불가능한 이유, 변경 파일, 회귀 검증을 남기고 lock의 `modifications`에 사유와 변경 후 SHA-256을 기록한다. 기존 `files` 해시는 바꾸지 않는다.

```sh
node engine/verify-upstream.mjs
cd engine/ax
go test ./...
```

Go 1.27.1과 원본 모듈 의존성이 필요하다. 도입 순서와 아직 연결되지 않은 기능은 [도입 계약·설계](../docs/rebuild/ax-implementation-adoption.md)를 따른다. 이 엔진의 테스트와 실제 실행 증거로 완료 범위를 판단한다.

## 현재 진입점

[Task Agent 확장과 지원 범위](extensions.md)에 그래프·Codex·인증·배포·검증 경계를 기록한다. `node build.mjs`로 빌드하고 `node install-skill.mjs`로 전역 스킬을 AX 경로에 연결한다. 전역 진입점은 이전 Docker/SQLite 실행기를 호출하지 않는다. 실제 검증 결과와 미완료 항목은 [구현 상태](../docs/rebuild/implementation-status.md)를 따른다.
