import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const agentUrl = process.env.FACILITATOR_URL
  const apiKey   = process.env.AGENT_API_KEY
  if (!agentUrl || !apiKey) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  const body = await req.json() as unknown

  const res = await fetch(`${agentUrl}/trades`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  const data = await res.json() as unknown
  return NextResponse.json(data, { status: res.status })
}
