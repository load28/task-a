import { createServer, type Server } from "node:http"
import { auth } from "@modelcontextprotocol/sdk/client/auth.js"
import { LocalOAuth } from "./oauth.ts"

/** An interactive login owned by the MCP connection, not by a terminal command. */
export class InteractiveLogin {
  private provider?: LocalOAuth
  private server?: Server
  private timer?: NodeJS.Timeout
  private active?: Promise<Record<string, unknown>>
  private result: Record<string, unknown> = { status: "not_started" }
  start(): Promise<Record<string, unknown>> {
    if (this.active) return this.active
    if (this.result.status === "login_required") return Promise.resolve(this.result)
    this.active = this.begin().finally(() => { this.active = undefined })
    return this.active
  }
  status() { return this.result }
  close() { clearTimeout(this.timer); this.server?.closeAllConnections(); this.server?.close(); this.server = undefined; this.provider?.close(); this.provider = undefined }
  private async begin() {
    this.close()
    const provider = new LocalOAuth()
    this.provider = provider
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", provider.redirectUrl)
      response.setHeader("Cache-Control", "no-store")
      if (request.method !== "GET" || url.pathname !== "/callback" || url.searchParams.get("state") !== provider.state()) { response.writeHead(400).end("Invalid callback"); return }
      let code: string
      try { code = provider.authorizationCode(url) } catch { response.writeHead(400).end("Invalid or expired callback"); return }
      response.end("Authorization received. Return to your agent and ask it to continue.")
      void auth(provider, { serverUrl: provider.resource, authorizationCode: code, fetchFn: provider.fetch }).then((status) => {
        this.result = { status: status === "AUTHORIZED" ? "authenticated" : "failed" }
      }).catch(() => { this.result = { status: "failed", message: "로그인을 완료하지 못했습니다. 대화에서 다시 연결을 요청해 주세요." } }).finally(() => this.close())
    })
    this.server = server
    try {
      await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(8765, "127.0.0.1", resolve) })
      provider.onRedirect = (url) => { this.result = { status: "login_required", loginUrl: String(url), message: "이 링크에서 본인 계정으로 로그인한 뒤 대화로 돌아오세요. 별도 터미널 명령은 필요하지 않습니다." } }
      const result = await auth(provider, { serverUrl: provider.resource, scope: provider.clientMetadata.scope, fetchFn: provider.fetch })
      if (result === "AUTHORIZED") { this.result = { status: "authenticated" }; this.close() }
      else this.timer = setTimeout(() => { this.result = { status: "expired" }; this.close() }, 300000)
      return this.result
    } catch {
      this.result = { status: "failed", message: "로그인 연결을 시작하지 못했습니다. 다른 창의 로그인 진행 여부와 연결 설정을 확인해 주세요." }
      this.close()
      return this.result
    }
  }
}
