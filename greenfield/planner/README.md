# 제안 입력과 그래프 검증

`GraphPlanner`는 주입된 `ProposalSource`에서 제안을 받고 계약, 참조, DAG를 검증한다.
승인과 실행은 control의 명령으로 별도 수행한다. 목표 문장을 임의로 완료 처리하지 않는다.

`JsonProposalSource`는 호출자가 제공한 파일·stdin·모델 응답 JSON을 읽는다.
`CommandProposalSource`는 운영자가 명시한 호스트 명령에 `{objective,current?,requirements?,feedback?}` JSON을 stdin으로 보내고 stdout의 단일 GraphBundle JSON을 읽는다.
shell은 사용하지 않는다. 시간·출력 크기를 제한하고 오류·비정상 종료·잘못된 그래프를 거부한다.
이 명령은 신뢰된 호스트 프로그램이며 Docker 작업 격리나 네트워크 제한을 제공하지 않는다.
명령 인수와 실행 권한을 제안 JSON에서 가져오지 않는다.

GraphPlanner는 `requirements`에 단일 책임 leaf, 계약·정확한 참조, 독립 검증, 데이터·순서 의존성, integration, 검토 근거를 요구하는 버전된 분해 규칙을 제공한다.
잘못된 JSON·계약·그래프·revision을 반환하면 `feedback`에 오류와 직전 JSON 제안을 담아 수정을 요청한다.
`new GraphPlanner(source,{maxRepairs:2})`는 최초 제안 이후 최대 두 번 수정한다. 기본값도 2이며 0–10으로 제한한다.
제공자 실행 자체의 실패는 즉시 오류로 반환한다. 수정 한도 초과는 `ProposalValidationError`로 시도 횟수와 원인을 보존한다.
정적 검증은 자연어 책임 분해의 정확성을 판정하지 않는다. tests의 고정 목표 provider는 프로토콜·수정 반복·구조 평가를 검증한다.
외부 hosted 모델의 분해 품질을 호출 없이 검증했다고 주장하지 않는다.

첫 runtime은 `network:none`, secret 없음, 로컬 재실행 가능 단계만 지원한다.
원격 모델 연결과 자동 목표 분해용 모델 provider는 포함하지 않는다.
모델 provider는 ProposalSource로 주입할 수 있으며 그 출력도 동일하게 검증한다.
`examples/createExample`은 통합 테스트용 고정 그래프 생성 함수이고 제품 planner가 아니다.
