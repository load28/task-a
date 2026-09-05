import { launchHost, serviceRoot } from "../packages/opencode-harness/src/host.ts"
const host = await launchHost()
try {
  const options = { throwOnError: true as const, signal: AbortSignal.timeout(15000) }
  const providers = await host.client.provider.list({ directory: serviceRoot }, options)
  const config = await host.client.config.get({ directory: serviceRoot }, options)
  console.log(JSON.stringify({ configuredModel: config.data?.model ?? null, connectedProviders: providers.data?.connected ?? [] }))
} finally { host.close() }
