import { readFileSync } from 'node:fs'

function normalizeChannel(channelId, entry) {
  for (const key of ['owner', 'repo', 'docsPath']) {
    if (typeof entry?.[key] !== 'string' || entry[key].trim() === '') {
      throw new Error(`채널 ${channelId}의 ${key} 값이 필요합니다`)
    }
  }
  return {
    channelId,
    owner: entry.owner,
    repo: entry.repo,
    branch: entry.branch ?? 'main',
    docsPath: entry.docsPath.replace(/^\/+|\/+$/g, ''),
    reviewers: entry.reviewers ?? [],
    watch: entry.watch ?? true,
  }
}

export function parseChannels(text) {
  const raw = JSON.parse(text)
  return new Map(Object.entries(raw).map(([channelId, entry]) => [channelId, normalizeChannel(channelId, entry)]))
}

function parseModel(value) {
  if (!value) return undefined
  const slash = value.indexOf('/')
  if (slash <= 0 || slash === value.length - 1) throw new Error('OPENCODE_MODEL은 provider/model 형식이어야 합니다')
  return { providerID: value.slice(0, slash), modelID: value.slice(slash + 1) }
}

function positiveNumber(env, name, fallback) {
  const value = env[name] === undefined || env[name] === '' ? fallback : Number(env[name])
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name}는 양수여야 합니다`)
  return value
}

export function loadConfig(env = process.env, readFile = path => readFileSync(path, 'utf8')) {
  const required = name => {
    if (!env[name]) throw new Error(`환경 변수 ${name}가 필요합니다`)
    return env[name]
  }
  return {
    slackBotToken: required('SLACK_BOT_TOKEN'),
    slackAppToken: required('SLACK_APP_TOKEN'),
    githubToken: required('GITHUB_TOKEN'),
    opencodeUrl: env.OPENCODE_URL || 'http://127.0.0.1:4096',
    opencodeUsername: env.OPENCODE_SERVER_USERNAME || 'opencode',
    opencodePassword: env.OPENCODE_SERVER_PASSWORD || '',
    model: parseModel(env.OPENCODE_MODEL),
    channels: parseChannels(readFile(env.CHANNELS_FILE || 'channels.json')),
    docsMaxChars: positiveNumber(env, 'DOCS_MAX_CHARS', 200000),
    watchCooldownMs: positiveNumber(env, 'WATCH_COOLDOWN_SECONDS', 600) * 1000,
    watchHistoryLimit: positiveNumber(env, 'WATCH_HISTORY_LIMIT', 15),
    proposalTtlMs: positiveNumber(env, 'PROPOSAL_TTL_HOURS', 24) * 3600 * 1000,
  }
}
