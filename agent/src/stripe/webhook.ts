/**
 * Stripe webhook verification and dispatch.
 *
 * Hard rule: constructEvent MUST succeed before any handler runs.
 * If the signature check throws, the caller returns 400 — no processing.
 *
 * Handlers are registered by flow modules (flowA.ts, flowB.ts) at startup.
 * This module is intentionally side-effect-free until a handler fires.
 */

import type Stripe from 'stripe'
import { stripe } from './client.js'
import { ENV } from '../lib/env.js'

type WebhookHandler = (event: Stripe.Event) => Promise<void>

const handlers = new Map<string, WebhookHandler>()

export function registerWebhookHandler(eventType: string, handler: WebhookHandler): void {
  handlers.set(eventType, handler)
}

export async function verifyAndDispatch(rawBody: Buffer, sig: string): Promise<void> {
  // Throws WebhookSignatureVerificationError if invalid — caller must catch and return 400
  const event = stripe.webhooks.constructEvent(rawBody, sig, ENV.STRIPE_WEBHOOK_SECRET)

  const handler = handlers.get(event.type)
  if (!handler) {
    console.log(`[webhook] Unhandled event type: ${event.type}`)
    return
  }

  try {
    await handler(event)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[webhook] Handler for ${event.type} failed: ${message}`)
  }
}
