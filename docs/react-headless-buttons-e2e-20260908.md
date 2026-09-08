# 대화형 Codex에서 React 헤드리스 버튼 제작

## 실행 경로와 결과

2026-09-08 대화형 Codex TUI를 실제 PTY로 실행했다. `codex exec`를 사용하지 않았으며, 새 빈 Git 저장소에서 설치된 Task Agent로 요청을 전달했다. 사용자가 계획을 승인한 뒤 동일 터미널에 승인 답변을 입력했다. 이후 계획 변경·수정 지시를 추가하지 않았다.

- Codex 세션: `01a080a8-53bc-7093-b1e2-30b5c6ad2706`
- 요청 작업공간: `/private/tmp/react-headless-buttons-task-agent-20260908`
- 계획: `78dc158c-20ff-4e9a-ac6a-eace52c2e23d`
- 루트 태스크: `ac6715e6-f321-4b44-94d7-770f3921c246`, 최종 `verified`
- 그래프 DB: `~/.task-agent/graphs/77b55034ebdbd1f72e9ae9f8.db`
- 검토용 최종 소스: `/private/tmp/react-headless-buttons-result-20260908`

승인 후 계획은 `active`로 전환됐고, 루트와 하위 태스크가 계획에 연결됐다. 각 하위 작업은 Kubernetes에서 실행됐다. 최종적으로 루트와 하위 5개가 모두 `verified`가 됐다. 계획의 `active`는 승인된 계획 개정을 가리키며 실행 완료 여부는 태스크 상태로 확인했다.

## 태스크 진행

| 단계 | 태스크 | 최종 상태 |
| --- | --- | --- |
| 저장소·도구 조사 | `5bb1d1b7-87ad-4f1d-b319-e6c5db993655` | verified / Archived |
| 공식 React·접근성 조사 | `19480486-b1f4-401e-9cef-6cb988868879` | verified / Archived |
| API 설계 | `96006377-309d-46f7-856b-98f427c26573` | verified / Archived |
| React 구현 | `c509bc23-e514-48c9-9e6c-d82fe4aac0b1` | verified / Archived |
| 동작·타입·접근성 검증 | `0e555a34-aacd-4bc4-b7c3-6eba2114b953` | verified / Archived |

구현 태스크는 설계 artifact를 입력으로 받았다. QA 태스크는 `restoreFromTaskId`에 구현 태스크를 지정하여 코드, 설치된 의존성, Git 이력이 포함된 작업공간을 복원했다. QA가 실행한 `git log`에서 구현 커밋을 확인했다.

## 실제 산출물과 검증

- `BaseButton`: native button, 표준 props·ref·className·style 전달, 자체 CSS 없음.
- `IconButton`: BaseButton 재사용, 필수 aria-label 타입, 공백 이름 런타임 거절.
- `PrimaryButton`: BaseButton 재사용, data-variant=primary, 자체 스타일 없음.

QA Pod에서 `npm run typecheck`와 `npm test`가 통과했다. 테스트는 1개 파일의 6개 사례이며 클릭·disabled·ref·소비자 props, 접근 가능한 이름과 axe, 공백 이름 거절, primary 표식과 스타일 미주입을 확인했다. 별도 타입 검사 파일은 aria-label 생략을 `@ts-expect-error`로 검증한다. 이는 jsdom/axe 기반 검사이며 실제 브라우저·스크린리더 수동 검증은 수행하지 않았다.

첫 테스트 실행은 DOM 정리 누락으로 3개가 실패했다. QA 모델이 `afterEach(cleanup)`을 추가한 뒤 6개 모두 통과했다. 계획 생성 첫 호출에서는 operationId를 생략했으나 도구가 거절했고 모델이 보완해 성공했다. 구현·QA 커밋은 Git 작성자 설정 부재로 한 번씩 실패했으며 모델이 명령 단위 작성자를 지정해 재시도했다. 이 오류들에 대해 관찰자가 별도 수정 지시를 보내지는 않았다.

관리자는 Pod의 성공 종료와 아카이브 상태를 근거로 그래프 완료를 기록했다. 관찰자는 보존한 실제 Pod 로그에서 타입 검사·테스트 출력을 별도로 확인했다. 모든 테스트가 항상 증거 파일과 기계적으로 대조되는 시스템이라는 의미는 아니다.

## 보존과 회수

QA 아카이브 SHA-256: `f42c7e87736521c8e14a357fa643dea5b790762a322069f47187cdd6ac92d062`.

5개 작업의 실행 Pod/PVC는 아카이브 저장 후 정리됐다. 최종 소스는 관찰자가 임시 읽기 전용 아카이브 조회 Pod로 추출했다. workspace의 소스·테스트·설정·잠금 파일만 회수하고 .git, node_modules, 인증·모델 홈 데이터는 내보내지 않았다. 원래 요청 폴더에 자동 병합하는 단계는 에이전트가 수행하지 않았다.

원시 증거:

- `/private/tmp/react-buttons-manager.json`
- `/private/tmp/react-buttons-instances.json`
- `/private/tmp/react-buttons-implementation.jsonl`
- `/private/tmp/react-buttons-qa.jsonl`
- `/private/tmp/react-headless-buttons-source.tar.gz`

회수된 결과를 로컬에서 검사하려면:

```sh
cd /private/tmp/react-headless-buttons-result-20260908
npm ci
npm run typecheck
npm test -- --run
```
