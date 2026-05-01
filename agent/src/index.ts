import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') })

import { createServer } from 'node:http'
import { ENV } from './lib/env.js'
import { db } from './lib/supabase.js'

async function main() {
  const { error } = await db.from('trades').select('id').limit(1)
  if (error) throw new Error(`Supabase connection failed: ${error.message}`)
  console.log('[agent] Supabase connected ✓')
  console.log('[agent] Environment validated ✓')

  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', version: '0.1.0' }))
      return
    }
    res.writeHead(404)
    res.end('Not found')
  })

  server.listen(ENV.PORT, () => {
    console.log(`[agent] Listening on port ${ENV.PORT} ✓`)
    console.log('[agent] Ready — waiting for trades')
  })
}

main().catch((err) => {
  console.error('[agent] Fatal:', err)
  process.exit(1)
})
