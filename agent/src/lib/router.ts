import type { IncomingMessage, ServerResponse } from 'node:http'

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) => Promise<void>

type Route = {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: RouteHandler
}

export type Router = ReturnType<typeof createRouter>

export function createRouter() {
  const routes: Route[] = []

  function register(method: string, path: string, handler: RouteHandler) {
    const paramNames: string[] = []
    const pattern = new RegExp(
      '^' + path.replace(/:([^/]+)/g, (_, name: string) => { paramNames.push(name); return '([^/]+)' }) + '$',
    )
    routes.push({ method, pattern, paramNames, handler })
  }

  return {
    get:  (path: string, handler: RouteHandler) => register('GET',  path, handler),
    post: (path: string, handler: RouteHandler) => register('POST', path, handler),

    async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
      const url    = (req.url ?? '/').split('?')[0] ?? '/'
      const method = req.method ?? 'GET'

      for (const route of routes) {
        if (route.method !== method) continue
        const match = url.match(route.pattern)
        if (!match) continue

        const params: Record<string, string> = {}
        route.paramNames.forEach((name, i) => { params[name] = match[i + 1] ?? '' })

        try {
          await route.handler(req, res, params)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Internal error'
          console.error('[router] Unhandled error:', message)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: message }))
          }
        }
        return
      }

      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    },
  }
}

// ── Body helpers ─────────────────────────────────────────────────────────────

export function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: unknown) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)),
    )
    req.on('end',   () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const raw = await readRawBody(req)
  return JSON.parse(raw.toString('utf8'))
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}
