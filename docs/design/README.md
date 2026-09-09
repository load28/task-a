# 두 설계 문서의 전체 구현 명세

[구현 명세 본문](implementation-spec.md)부터 읽는다. 후속 코드 작업의 현재 범위와 미완료 항목은 [구현 현황](implementation-progress.md)에 기록한다. 이 산출물은 구현할 아키텍처와 검증 계약이며 애플리케이션 코드의 구현 완료 보고가 아니다.

- **구조와 실행 계약**: [구현 명세](implementation-spec.md). 현재 코드의 차이, 신규 모듈, 데이터 모델, 실제 native/Kubernetes 실행 경로, 알고리즘, 학습·승격, 이관, 수용 테스트를 정의한다.
- **원문 의미별 대응**: [158개 구현 대응](source-implementation-map.md), [131개 필드·42개 열거값](schema-field-contracts.md), [168개 표시 수식](formula-contracts.md). 각 원문 요소를 변경 위치와 검증 조건에 연결한다.
- **원문 줄별 확인**: [에너지 효율 문서 2,479행](energy-line-ledger.md), [국소 재계획 문서 2,518행](replanning-line-ledger.md). 원문 내용·분류·구현 처리를 같은 행에 표시한다. [JSONL](line-ledger.jsonl)에는 원문 문자열을 그대로 보존한다.
- **누락 검사**: [검증 기록](traceability-audit.md). 원본 해시·4997행 순서·누락/중복·모든 TypeScript 필드/열거값과 수식 블록을 검사했다. 의미의 정확성과 실제 구현 성능은 별도의 수용 테스트 대상이다.

## 재생성

```sh
python3 docs/design/build-traceability.py
```

사람이 작성한 해석 원본은 `implementation-spec.md`, `requirements.tsv`, `schema-field-contracts.tsv`, `semantic-line-contracts.tsv`이다. 생성기는 이 해석을 줄별·절별·필드별 문서로 연결한다. `source-manifest.json`의 원문 해시와 다른 입력은 거절한다. 사용자 첨부가 로컬에 있으면 보존한 두 원문과 바이트 일치도 확인한다.

기준 commit은 `d21904656c9c2135ed66c68ed15cef8d5820c9ae`이다. 이후 구현한 애플리케이션 변경과 수용 검증 상태는 구현 현황에서 관리한다.
