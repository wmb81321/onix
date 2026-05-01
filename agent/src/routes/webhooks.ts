import type { Router } from '../lib/router.js'
import { readRawBody, json } from '../lib/router.js'
import { verifyAndDispatch } from '../stripe/webhook.js'

export function registerWebhookRoutes(router: Router): void {

  // POST /webhooks/stripe — verify Stripe signature and dispatch to flow handlers
  router.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature']
    if (!sig || typeof sig !== 'string') {
      json(res, 400, { error: 'Missing Stripe-Signature header' })
      return
    }

    // Must read raw bytes — JSON parsing destroys the signature
    const rawBody = await readRawBody(req)

    try {
      await verifyAndDispatch(rawBody, sig)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Webhook error'
      console.error('[webhook] Rejected:', message)
      // WebhookSignatureVerificationError always starts with "No signatures" or "Webhook signature"
      const isSigError = /^(No signatures|Webhook signature|No timestamp found)/i.test(message)
      json(res, isSigError ? 400 : 500, { error: message })
      return
    }

    json(res, 200, { received: true })
  })
}
