import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const API_URL            = process.env['CONVEXO_API_URL']          ?? 'https://convexo-p2p.vercel.app'
const BUYER_ADDRESS      = process.env['CONVEXO_BUYER_ADDRESS']     ?? null
const SELLER_ADDRESS     = process.env['CONVEXO_SELLER_ADDRESS']    ?? null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${res.status}: ${text}`)
  }

  return res.json()
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}

function err(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }] }
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'convexo-p2p',
  version: '1.0.0',
  description: 'Agentic P2P crypto-fiat settlement on Tempo',
})

// ---------------------------------------------------------------------------
// Tool: list_orders
// ---------------------------------------------------------------------------

server.tool(
  'list_orders',
  'List open orders on the Convexo order book.',
  {
    type: z.enum(['buy', 'sell', 'all']).optional().describe("Filter by order type. Default is 'all'."),
  },
  async ({ type }) => {
    try {
      const t = type ?? 'all'
      const qs = t === 'all'
        ? 'status=open'
        : `type=${t}&status=open`
      const data = await apiFetch(`/api/orders?${qs}`)
      return ok(JSON.stringify(data, null, 2))
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: get_trade
// ---------------------------------------------------------------------------

server.tool(
  'get_trade',
  'Get current status and details of a trade.',
  {
    trade_id: z.string().describe('The trade UUID.'),
  },
  async ({ trade_id }) => {
    try {
      const data = await apiFetch(`/api/trades/${trade_id}`)
      return ok(JSON.stringify(data, null, 2))
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: get_my_trades
// ---------------------------------------------------------------------------

server.tool(
  'get_my_trades',
  'Get all trades for a wallet address.',
  {
    address: z
      .string()
      .optional()
      .describe('Wallet address (0x...). Defaults to CONVEXO_BUYER_ADDRESS or CONVEXO_SELLER_ADDRESS env var.'),
  },
  async ({ address }) => {
    try {
      const addr = address ?? BUYER_ADDRESS ?? SELLER_ADDRESS
      if (!addr) {
        return err(
          'No address provided and neither CONVEXO_BUYER_ADDRESS nor CONVEXO_SELLER_ADDRESS is set.',
        )
      }
      const data = await apiFetch(`/api/trades/by-user?address=${encodeURIComponent(addr)}`)
      return ok(JSON.stringify(data, null, 2))
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: create_order
// ---------------------------------------------------------------------------

server.tool(
  'create_order',
  'Post a new buy or sell order to the order book.',
  {
    type:         z.enum(['buy', 'sell']).describe("Order type: 'buy' or 'sell'."),
    usdc_amount:  z.number().positive().describe('Amount of USDC to trade (minimum 5).'),
    rate:         z.number().positive().describe('Exchange rate: USD per USDC (e.g. 1.05).'),
    user_address: z
      .string()
      .optional()
      .describe(
        'Wallet address posting the order. Defaults to CONVEXO_BUYER_ADDRESS (buy) or CONVEXO_SELLER_ADDRESS (sell).',
      ),
  },
  async ({ type, usdc_amount, rate, user_address }) => {
    try {
      const addr =
        user_address ??
        (type === 'buy' ? BUYER_ADDRESS : SELLER_ADDRESS) ??
        BUYER_ADDRESS

      if (!addr) {
        return err(
          `No user_address provided and CONVEXO_${type.toUpperCase()}_ADDRESS env var is not set.`,
        )
      }

      const data = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ user_address: addr, type, usdc_amount, rate }),
      })
      return ok(JSON.stringify(data, null, 2))
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: match_order
// ---------------------------------------------------------------------------

server.tool(
  'match_order',
  'Match an existing open order to create a trade. Returns trade_id, virtual_deposit_address, and deposit_deadline.',
  {
    order_id:       z.string().describe('ID of the open order to match.'),
    buyer_address:  z.string().optional().describe('Buyer wallet address. Defaults to CONVEXO_BUYER_ADDRESS.'),
    seller_address: z.string().optional().describe('Seller wallet address. Defaults to CONVEXO_SELLER_ADDRESS.'),
  },
  async ({ order_id, buyer_address, seller_address }) => {
    try {
      // 1. Fetch order details
      const orderData = await apiFetch(`/api/orders?id=${encodeURIComponent(order_id)}`)
      const order = orderData as {
        id: string
        type: string
        usdc_amount: number
        usd_amount: number
        user_address: string
        status: string
      }

      if (order.status !== 'open') {
        return err(`Order ${order_id} is not open (status: ${order.status}).`)
      }

      // 2. Resolve addresses — for BUY orders, roles are swapped
      let resolvedBuyer: string
      let resolvedSeller: string

      if (order.type === 'buy') {
        // Order poster is the buyer; matcher is the seller
        const resolved = seller_address ?? SELLER_ADDRESS
        if (!resolved) {
          return err(
            'Matching a BUY order requires a seller address. Provide seller_address or set CONVEXO_SELLER_ADDRESS.',
          )
        }
        resolvedBuyer  = order.user_address
        resolvedSeller = resolved
      } else {
        // order.type === 'sell': order poster is the seller; matcher is the buyer
        const resolved = buyer_address ?? BUYER_ADDRESS
        if (!resolved) {
          return err(
            'Matching a SELL order requires a buyer address. Provide buyer_address or set CONVEXO_BUYER_ADDRESS.',
          )
        }
        resolvedSeller = order.user_address
        resolvedBuyer  = resolved
      }

      // 3. Create trade
      const data = await apiFetch('/api/trades', {
        method: 'POST',
        body: JSON.stringify({
          order_id:       order.id,
          buyer_address:  resolvedBuyer,
          seller_address: resolvedSeller,
          usdc_amount:    order.usdc_amount,
          usd_amount:     order.usd_amount,
        }),
      })

      return ok(JSON.stringify(data, null, 2))
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: initiate_payment
// ---------------------------------------------------------------------------

server.tool(
  'initiate_payment',
  'Initiate a Stripe Link spend request to pay for a deposited trade (buyer action). The buyer must have a Stripe Link PM registered at /account first.',
  {
    trade_id: z.string().describe('The trade UUID to pay for.'),
  },
  async ({ trade_id }) => {
    try {
      const data = await apiFetch(`/api/trades/${trade_id}/link-pay`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const result = data as { spendRequestId?: string; approvalUrl?: string; error?: string }

      if (result.error) {
        return err(result.error)
      }

      return ok(
        JSON.stringify(
          {
            spendRequestId: result.spendRequestId,
            approvalUrl:    result.approvalUrl,
            next_step:
              'Share approvalUrl with the user so they can approve the Stripe Link payment. Once approved, USDC will be released automatically.',
          },
          null,
          2,
        ),
      )
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: get_trade_status_description
// ---------------------------------------------------------------------------

server.tool(
  'get_trade_status_description',
  'Get a human-readable description of what needs to happen next in a trade.',
  {
    trade_id: z.string().describe('The trade UUID.'),
  },
  async ({ trade_id }) => {
    try {
      const data = await apiFetch(`/api/trades/${trade_id}`)
      const trade = data as {
        status:                  string
        usdc_amount:             number
        usd_amount:              number
        virtual_deposit_address: string | null
        buyer_address:           string | null
        seller_address:          string | null
      }

      const { status, usdc_amount, usd_amount, virtual_deposit_address } = trade

      const descriptions: Record<string, string> = {
        created:
          virtual_deposit_address
            ? `Seller needs to deposit ${usdc_amount} USDC to ${virtual_deposit_address} within 30 minutes.`
            : `Trade created. Waiting for deposit address to be assigned.`,
        deposited:
          `Deposit confirmed. Buyer needs to pay $${usd_amount} USD — call initiate_payment to start Stripe Link flow.`,
        fee_paid:
          `Service fee paid. Fiat transfer in progress — waiting for Stripe to confirm payment.`,
        fiat_sent:
          `USD payment sent to seller. USDC is being released on-chain — almost done.`,
        released:
          `USDC released to buyer. Trade is complete. Both parties can now rate each other.`,
        complete:
          `Trade finished. All settlement steps completed successfully.`,
        deposit_timeout:
          `Trade expired — seller did not deposit USDC within 30 minutes. Order has been returned to open status.`,
        stripe_failed:
          `Stripe payment failed. The buyer's payment was not processed. Contact support or retry.`,
        refunded:
          `Trade was refunded. USDC returned to seller.`,
      }

      const description = descriptions[status] ?? `Trade is in an unknown state: ${status}`

      return ok(
        JSON.stringify(
          {
            trade_id,
            status,
            description,
            usdc_amount,
            usd_amount,
            virtual_deposit_address: virtual_deposit_address ?? null,
            buyer_address:           trade.buyer_address  ?? null,
            seller_address:          trade.seller_address ?? null,
          },
          null,
          2,
        ),
      )
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Tool: settle_trade
// ---------------------------------------------------------------------------

server.tool(
  'settle_trade',
  'Pay the 0.1 USDC service fee to settle a deposited trade (pure crypto-native path — no Stripe required). The agent pays 0.1 USDC via MPP and the platform releases USDC to the buyer. Use this instead of initiate_payment if the buyer prefers an on-chain-only flow.',
  {
    trade_id: z.string().describe('The trade UUID to settle.'),
  },
  async ({ trade_id }) => {
    try {
      const data = await apiFetch(`/api/trades/${trade_id}/settle`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const result = data as { status?: string; error?: string; message?: string }

      if (result.error) {
        return err(result.error)
      }

      return ok(
        JSON.stringify(
          {
            trade_id,
            status: result.status ?? 'settled',
            message: result.message ?? 'Service fee paid. USDC will be released to buyer after fiat transfer confirms.',
            next_step: 'Monitor trade status with get_trade. Once status reaches "released", the USDC has been sent on-chain.',
          },
          null,
          2,
        ),
      )
    } catch (e) {
      return err(e instanceof Error ? e.message : String(e))
    }
  },
)

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
