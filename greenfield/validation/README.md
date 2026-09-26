# 제어 영역에서 발급하는 검증 증거

`ValidationService(runtime, artifacts).validate(request)`는 무결성과 실행 결과를 확인한 뒤 증거를 발급한다.
제어 영역은 호출 전에 stable `request.id`, 후보 manifest, 입력 snapshot을 저장한다.
같은 ID의 다른 payload를 거부하며 재시작 후 같은 ID는 기존 runtime intent와 증거를 사용한다.
`inconclusive`는 확정 증거로 저장하지 않으므로 동일 요청을 다시 관측할 수 있다.
보고서는 CAS에 저장하며 증거에는 정확한 후보 manifest·입력 snapshot·검증기 revision·실제 검증 환경 digest를 기록한다.
후보 manifest의 `validationEvidenceIds`는 사후 변경하지 않고 채택 기록에서 증거를 참조한다.
`verifyValidationEvidence(request, evidence, artifacts)`는 CAS 보고서 본문의 request ID·전체 요청 digest·outcome·환경 digest까지 증거와 대조한다.
issuer 문자열 자체가 인증 수단인 것은 아니다. 제어기가 직접 호출한 전용 검증 포트의 응답만 이 검사에 전달한다.

`sources.ts`의 `validateSources(bundle, validator, artifacts)`는 활성화 전에 source shape와 모든 계약 검증기를 확인한다.
직접 소비 task의 정확한 template/policy 조합마다 검증하며, 요청과 확정 증거를 durable ledger에 저장한다.
반환한 증거는 graph activation과 같은 트랜잭션에서 제어 상태에 기록한다. 검증 실패·미확정이면 활성화하지 않는다.
공통 `InputSnapshot` 운반 형식의 `taskSpecRef`는 이 경우 `source-registration-*` 등록 전용 context를 가리킨다.
이는 graph 실행 leaf나 source 생산 attempt가 아니며 source manifest에 `consumedInputs`를 추가하지 않는다.
입력 binding은 비어 있고 검증할 source 자체가 candidate mount로 제공된다.
소비자가 없는 source의 builtin 검증은 제어 영역에서 수행한다. argv 검증은 선언된 소비 환경이 없으면 `validation_pending`으로 거부한다.

`validateArtifactShape(artifact, contract, store)`는 원본 등록과 후보 채택이 공유한다.
JSON/file 계약은 tree 안의 일반 파일이 정확히 하나여야 한다.
JSON은 UTF-8과 구문을 검사하고 [Ajv의 draft-07·2019-09·2020-12 구현](https://ajv.js.org/json-schema.html#json-schema-versions)을 선택한다.
[ajv-formats](https://ajv.js.org/guide/formats.html)의 format 검증을 적용하며 기본값 삽입·형변환·추가 속성 삭제는 수행하지 않는다.
외부 `$ref` 다운로드와 `$async`, 알려지지 않은 dialect/keyword는 성공 처리하지 않는다.
스키마 컴파일·평가는 메모리 한도를 둔 worker thread에서 실행하고 5초를 넘으면 종료하여 `inconclusive`를 돌려준다.
이 제한은 [Ajv의 복잡한 스키마·정규식 관련 주의점](https://ajv.js.org/security.html)에 대응하는 본 구현의 선택이다.

argv 검증은 원 작업과 다른 task·attempt·workspace에서 실행한다.
후보는 `/inputs/candidate-<index>`, 소비 입력은 `/inputs/input-<index>`에 읽기 전용으로 제공한다.
file artifact의 파일명은 해당 mount 아래에 유지된다. JSON fixture라면 `/inputs/candidate-0/data.json`이다.
검증 template은 고정된 원 이미지만 사용하며 source snapshot과 bootstrap은 비워 별도 환경을 만든다.
검증 명령은 이미지의 도구와 위 입력만 사용할 수 있다. 이것은 원 workspace 재현과 다른 명시적 검증 환경이다.
원 policy의 resource/network/secret/effect 제한을 유지하고 validator timeout을 적용한다.
첫 Docker backend에서 network restricted, secret, 외부 effect는 지원하지 않으며 성공 처리하지 않는다.
`all-writers-terminated` 증명 이후 캡처한 supervisor 보고서와 runtime 성공이 모두 확인되어야 통과한다.
명령의 stdout·stderr는 child-process의 1MiB maxBuffer 제한 내에서 보고서에 포함한다.

`node --test validation/*.test.ts`로 계약·스키마·재시작 ID 테스트를 실행한다.
`TASK_AGENT_DOCKER_TEST=1 node --test validation/*.test.ts`는 실제 Docker에서 후보/입력 쓰기 거부와 재시도 중복 생성 방지를 추가 검증한다.
테스트가 생성한 컨테이너만 종료·삭제한다.
