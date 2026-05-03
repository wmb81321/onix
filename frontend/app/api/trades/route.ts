import { NextRequest, NextResponse } from 'next/server'

// POST /api/trades — proxy to agent with transparent 402 passthrough.
// The agent charges a 0.1 USDC taker fee via mppx; the browser mppx/client
// intercepts the 402, pays, and retries automatically.
export async function POST(req: NextRequest) {
  const agentUrl = process.env.FACILITATOR_URL
  if (!agentUrl) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  const forwardHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
  const authorization = req.headers.get('authorization')
  if (authorization) forwardHeaders['authorization'] = authorization

  const body = await req.text()

  let agentRes: Response
  try {
    agentRes = await fetch(`${agentUrl}/trades`, {
      method: 'POST',
      headers: forwardHeaders,
      body,
      cache: 'no-store',
    })
  } catch (err) {
    console.error('[POST /api/trades] fetch to agent failed:', err)
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }

  const text = await agentRes.text()
  const resHeaders = new Headers({ 'Content-Type': 'application/json' })

  for (const header of ['www-authenticate', 'x-payment-response', 'x-payment-required', 'accept-payment']) {
    const val = agentRes.headers.get(header)
    if (val) resHeaders.set(header, val)
  }

  return new NextResponse(text, { status: agentRes.status, headers: resHeaders })
}
