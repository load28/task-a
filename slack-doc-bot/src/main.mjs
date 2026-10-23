import { App } from '@slack/bolt'
import { Octokit } from '@octokit/rest'
import { createOpencodeClient } from '@opencode-ai/sdk/v2'
import { loadConfig } from './config.mjs'
import { createDocRepository } from './docs.mjs'
import { createBrain } from './brain.mjs'
import { createProposalStore } from './proposals.mjs'
import { createHandlers, registerHandlers } from './bot.mjs'

const config = loadConfig()
const app = new App({ token: config.slackBotToken, appToken: config.slackAppToken, socketMode: true })
const octokit = new Octokit({ auth: config.githubToken })
const opencode = createOpencodeClient({
  baseUrl: config.opencodeUrl,
  headers: config.opencodePassword
    ? { Authorization: `Basic ${Buffer.from(`${config.opencodeUsername}:${config.opencodePassword}`).toString('base64')}` }
    : undefined,
})

const { user_id: botUserId } = await app.client.auth.test()
registerHandlers(app, createHandlers({
  channels: config.channels,
  docs: createDocRepository({ octokit, maxChars: config.docsMaxChars }),
  brain: createBrain({ client: opencode, model: config.model }),
  proposals: createProposalStore({ ttlMs: config.proposalTtlMs }),
  botUserId,
  watchCooldownMs: config.watchCooldownMs,
  watchHistoryLimit: config.watchHistoryLimit,
  logger: app.logger,
}))
await app.start()
app.logger.info(`프로젝트 문서 봇 시작: 채널 ${config.channels.size}개`)
