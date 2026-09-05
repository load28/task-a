# 자연스러운 Task 기록

정상 종료 시 자동 sync→handoff와 로컬 재시도 대기열은 [세션 종료 연동](session-lifecycle.md)을 참고한다.

## Host 지침

`packages/host-integration/src/index.ts`의 HOST_TASK_INSTRUCTIONS를 로컬·원격 MCP initialize 응답에 제공한다. Host가 MCP 서버 지침을 반영하지 않는 경우 사용자가 관리하는 프로젝트/에이전트 지침에 같은 정책을 추가해야 한다. 이 서버가 Host의 모든 대화를 자동 수집하는 것은 아니다.

작업 시작·재개에는 context, 결정·실제 완료·계획 변경·blocker·artifact·중단에는 sync, 에이전트 교체에는 handoff를 사용한다. 한 대화에서 작업이 바뀌면 Task ID를 재확인한다. 미확정 제안과 잡담은 저장하지 않으며 승인·확인 UI를 우회하지 않는다. 재시도 키와 미반영 구간은 Host가 성공 응답까지 유지한다.

## 검증 계층

- `npm run check`: Task Engine, 원자적 저장, 이벤트 근거, 동시성, 인증의 결정적 회귀 검사.
- `npm run smoke:remote`: 외부 전송 없이 실제 SDK 클라이언트와 로컬 HTTP 소켓으로 MCP 및 접근 통제 검사.
- `node scripts/evaluate-agent.ts`: 외부 모델에 가상 대화를 보내 Task Agent 자체의 추출·저장 검사.
- `node scripts/evaluate-host.ts`: 외부 모델을 Host로 사용하여 Gateway MCP 도구만 제공한다. 사용자는 저장 명령 없이 재개·제안·확정·인계를 말한다. 전체 세션의 실제 Tool 호출과 격리된 DB를 검사한다.

모델 평가는 명시적으로 실행해야 한다. 실제 작업 내용이나 기존 DB를 사용하지 않는다. 이 평가의 성공이 ChatGPT·Claude Code 제품의 도구 선택과 승인 동작을 보장하지 않는다. 배포 후 두 실제 제품에서 동일 시나리오를 반복해야 한다.

## 출시 확인

2026-09-05 가상 Host 실모델 평가에서 처음에는 현황 조회에 run·sync를 불필요하게 호출했다. 전용 OpenCode Agent 설정과 명시적인 빈 Context 표현으로 보완했다. 최종 검사에서는 재개 시 context 1회, 미확정 제안 시 호출 0회, 확정 시 sync 1회, 종료 시 handoff 1회가 확인됐다. DB에는 결정·제약·다음 행동 각 1개만 남았다. 단일 가상 시나리오 결과이며 실제 ChatGPT·Claude Code 연결 검증은 AWS 배포 후 남아 있다.

실제 Host별로 시작, 제안, 확정, 중복 재전송, 인증 만료, 다른 Task로 전환, 중단, 다른 장소에서 재개 시나리오를 검사한다. 각 턴의 기대 기록과 실제 기록을 비교하고 누락·잘못된 확정·잘못된 Task 연결·저장 실패 은폐를 남긴다. 사용자가 저장을 거부한 경우에는 기록하지 않아야 한다. Hook이 없는 Host에서는 모든 턴의 자동 기록을 보장할 수 없다.
