// Generate a reviewable AI task. No credentials or model call are needed here.
const [image,model]=process.argv.slice(2)
if(!image||!model)throw Error('Usage: codex-smoke.mjs PINNED_IMAGE MODEL')
const goal='math.mjs와 math.test.mjs를 읽고 sum 함수가 두 수를 더하도록 구현을 수정하세요. 테스트 파일은 수정하지 마세요. 테스트를 실행하고 math.mjs를 산출물로 남기세요.'
const tests="import assert from 'node:assert/strict';\nimport {sum} from './math.mjs';\nassert.equal(sum(2,3),5);\nassert.equal(sum(-1,4),3);\n"
console.log(JSON.stringify({id:'ax-codex-smoke',revision:1,tasks:[{id:'repair',goal,contract:'sum(a,b)는 두 수의 합을 반환한다. 고정된 독립 테스트를 통과한 math.mjs만 채택한다.',image,command:['/usr/local/bin/task-agent-codex',model,goal],files:{'math.mjs':'export const sum = (a,b) => a-b;\n','math.test.mjs':tests},outputs:['math.mjs'],validator:{image,command:['node','math.test.mjs']}}]},null,2))
