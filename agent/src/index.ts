import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../../.env') })

import { createServer } from 'node:http'
import { ENV } from './lib/env.js'
import { db } from './lib/supabase.js'
import { createRouter } from './lib/router.js'
import { registerTradeRoutes } from './routes/trades.js'
import { registerWebhookRoutes } from './routes/webhooks.js'
import { registerFlowAHandlers } from './flows/flowA.js'
import { startDepositMonitor } from './tempo/monitor.js'

async function main() {
  // Verify Supabase connection
  const { error } = await db.from('trades').select('id').limit(1)
  if (error) throw new Error(`Supabase connection failed: ${error.message}`)
  console.log('[agent] Supabase connected ✓')
  console.log('[agent] Environment validated ✓')

  // Register Stripe webhook handlers (must happen before any webhook arrives)
  registerFlowAHandlers()
  console.log('[agent] Flow A handlers registered ✓')

  // Build router
  const router = createRouter()

  router.get('/health', async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', version: '0.1.0' }))
  })

  registerTradeRoutes(router)
  registerWebhookRoutes(router)

  // Start HTTP server
  const server = createServer((req, res) => router.handle(req, res))

  server.listen(ENV.PORT, () => {
    console.log(`[agent] Listening on port ${ENV.PORT} ✓`)
    console.log('[agent] Routes: POST /trades, POST /trades/:id/settle, POST /webhooks/stripe')
  })

  // Resume monitoring any trades that were pending before this boot
  const tokenAddress = ENV.TEMPO_PATHUSDC_ADDRESS as `0x${string}`
  await startDepositMonitor(tokenAddress)
  console.log('[agent] Deposit monitor started ✓')
  console.log('[agent] Ready — waiting for trades')
}

main().catch((err) => {
  console.error('[agent] Fatal:', err)
  process.exit(1)
})
