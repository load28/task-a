# Slack 프로젝트 문서 봇

Slack 프로젝트 채널마다 GitHub 저장소의 문서 경로를 하나씩 연결하고, 그 문서를 유일한 기준으로 답하고 고치는 봇이다. 판단은 [OpenCode 서버](https://opencode.ai/docs/server/)의 전용 에이전트가 하고, Slack 연결은 [Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/concepts/socket-mode)의 Socket Mode를 쓴다.

## 동작

| 상황 | 봇의 동작 |
|---|---|
| 채널에서 봇을 멘션 | `doc-steward` 에이전트가 문서에 근거해 답한다. 문서 변경 요청은 평가해 되묻거나 거절하거나 변경안을 제안한다. 같은 스레드의 멘션은 같은 OpenCode 세션에서 이어진다. |
| 변경안 합의 | 제안 메시지의 **합의하고 PR 만들기** 버튼을 요청자가 누르면 문서 경로 안의 파일만 커밋한 브랜치와 PR을 만들고, 채널에 PR 승인 요청을 올린다. |
| 멘션 없는 채널 대화 | `doc-watcher` 에이전트가 문서와 충돌하는 발언, 문서에 없는 결정, 문서로 답할 수 있는 질문을 감지하면 해당 메시지 스레드에 먼저 개입한다. 개입 후 `WATCH_COOLDOWN_SECONDS` 동안 그 채널은 다시 판단하지 않는다. |

봇이 진행 중인 스레드의 메시지, 봇·편집 메시지, 연결되지 않은 채널은 감시하지 않는다. 두 에이전트는 [OpenCode 권한 설정](https://opencode.ai/docs/agents/)으로 파일 읽기·수정·셸·웹 도구를 모두 거부하며, 문서는 봇이 GitHub에서 읽어 프롬프트로 넘긴다.

## 구성

| 경로 | 역할 |
|---|---|
| `src/main.mjs` | Slack·GitHub·OpenCode 클라이언트 연결 |
| `src/bot.mjs` | 멘션·채널 메시지·버튼 처리 |
| `src/brain.mjs` | OpenCode 세션과 구조화 출력(`format: json_schema`) 호출 |
| `src/docs.mjs` | GitHub Git Data API로 문서 읽기, 브랜치·커밋·PR 생성 |
| `opencode.json`, `prompts/` | OpenCode 에이전트 정의와 지침 |
| `slack-manifest.json` | Slack 앱 매니페스트 |

## 준비

1. **Slack 앱**: [앱 매니페스트](https://docs.slack.dev/reference/app-manifest)로 `slack-manifest.json`을 넣어 앱을 만들고 워크스페이스에 설치한다. Basic Information에서 `connections:write` 범위의 App-Level Token(`xapp-`)을 만든다. 봇을 각 프로젝트 채널에 초대한다.
2. **GitHub 토큰**: 문서 저장소에 Contents 쓰기와 Pull requests 쓰기 권한이 있는 토큰을 준비한다.
3. **채널 연결**: `channels.example.json`을 `channels.json`으로 복사해 채널 ID별 `owner`, `repo`, `branch`, `docsPath`, `reviewers`, `watch`를 적는다.
4. **환경 변수**: `.env.example`을 참고해 설정한다. `OPENCODE_MODEL`은 `provider/model` 형식이며 비우면 OpenCode 기본 모델을 쓴다.

## 실행

Node.js 22 이상이 필요하다.

```sh
npm install
OPENCODE_SERVER_PASSWORD=<비밀번호> npm run opencode
```

OpenCode 서버는 이 디렉터리에서 실행해야 `opencode.json`의 에이전트가 로드된다. 모델 공급자 인증은 [OpenCode 공급자 안내](https://opencode.ai/docs/providers/)를 따른다. 다른 터미널에서 봇을 실행한다.

```sh
npm start
npm test
```

## 문서 변경을 봇으로만 제한하기

봇이 PR을 만드는 것만으로는 다른 경로의 변경을 막지 못한다. 문서 저장소에서 GitHub [규칙 세트](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)를 설정한다.

- 기본 브랜치에 **Require a pull request before merging**과 필요 승인 수를 켠다.
- [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)에 문서 경로의 승인자를 두고 code owner 리뷰를 요구한다.
- 사람의 직접 수정을 막으려면 push 규칙 세트의 **Restrict file paths**로 문서 경로를 막고, 봇 계정(또는 GitHub App)만 bypass 목록에 둔다.

## 한계

- 스레드 세션과 대기 중인 제안은 메모리에만 있다. 봇을 재시작하면 진행 중인 제안은 사라지고 스레드는 새 세션으로 시작한다.
- 문서는 `DOCS_MAX_CHARS`까지만 프롬프트에 넣고, 넘치는 파일은 생략 목록으로 알린다.
- 감시 기능은 채널의 사람 메시지마다 모델을 한 번 호출한다. 비용을 줄이려면 채널 설정에서 `watch`를 끄거나 대기 시간을 늘린다.
