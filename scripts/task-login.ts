import { createServer } from "node:http"
import { auth } from "@modelcontextprotocol/sdk/client/auth.js"
import { LocalOAuth } from "../packages/host-integration/src/oauth.ts"

const provider = new LocalOAuth()
if (process.argv[2] === "logout") {
  provider.invalidateCredentials("tokens")
  provider.close()
  console.log("Task Agent local credentials cleared; remote token revocation is separate")
} else {
  const server = createServer()
  let timer: NodeJS.Timeout | undefined
  try {
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(8765, "127.0.0.1", resolve) })
    const code = new Promise<string>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Login timed out")), 300000)
      server.on("request", (request, response) => {
        const url = new URL(request.url ?? "/", provider.redirectUrl)
        if (request.method !== "GET" || url.pathname !== "/callback" || url.searchParams.get("state") !== provider.state()) { response.writeHead(400).end("Invalid callback"); return }
        response.setHeader("Cache-Control", "no-store")
        try {
          const code = provider.authorizationCode(url)
          response.end("Authorization received. Check your terminal for completion.")
          resolve(code)
        } catch { response.writeHead(400).end("Login failed"); reject(new Error("Login declined")) }
      })
    })
    // Attach immediately so an expired callback cannot create an unhandled rejection.
    code.catch(() => {})
    provider.onRedirect = (url) => console.log(`Open this URL in your browser to log in:\n${url}`)
    const result = await auth(provider, { serverUrl: provider.resource, scope: provider.clientMetadata.scope, fetchFn: provider.fetch })
    if (result === "REDIRECT") {
      const completed = await auth(provider, { serverUrl: provider.resource, authorizationCode: await code, fetchFn: provider.fetch })
      if (completed !== "AUTHORIZED") throw new Error("Login did not complete")
    }
    console.log("Task Agent login complete")
  } catch { process.stderr.write("Task Agent login failed. Check the configured server/client and retry.\n"); process.exitCode = 1 }
  finally { clearTimeout(timer); server.closeAllConnections(); server.close(); provider.close() }
}
