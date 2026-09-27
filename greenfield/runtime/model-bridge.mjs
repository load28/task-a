// Loopback-only HTTP endpoint in a network-disabled container; host gateway handles fixed-destination inference.
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { writeFileSync, renameSync, readFileSync, existsSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
export async function startModelBridge(directory) {
  const server = createServer(async (request, response) => {
    if (request.method !== 'POST' || !['/responses', '/responses/compact'].includes(request.url)) { response.writeHead(403).end(); return }
    let id
    try {
      const chunks = []; let size = 0
      for await (const chunk of request) { size += chunk.length; if (size > 16 * 1024 * 1024) throw new Error('too large'); chunks.push(chunk) }
      id = `${randomUUID()}.json`
      const path = join(directory, 'requests', id), temporary = `${path}.tmp`
      writeFileSync(temporary, JSON.stringify({ method: 'POST', path: request.url, body: Buffer.concat(chunks).toString('utf8') }), { mode: 0o600 }); renameSync(temporary, path)
      const resultPath = join(directory, 'responses', id), deadline = Date.now() + 190000
      while (!existsSync(resultPath)) { if (Date.now() > deadline || response.destroyed) throw new Error('gateway unavailable'); await delay(100) }
      const result = JSON.parse(readFileSync(resultPath, 'utf8'))
      response.writeHead(result.status, { 'content-type': result.contentType }); response.end(result.body)
    } catch { if (!response.destroyed) response.writeHead(502).end('{"error":{"message":"Model gateway unavailable"}}') }
    finally { if (id) try { unlinkSync(join(directory, 'requests', id)) } catch {} }
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => { server.closeAllConnections(); server.close() } }
}
