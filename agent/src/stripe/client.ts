import Stripe from 'stripe'
import { ENV } from '../lib/env.js'

// Pinned to preview API required for v2/core/accounts (Global Payouts)
export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.preview' as Stripe.LatestApiVersion,
})
