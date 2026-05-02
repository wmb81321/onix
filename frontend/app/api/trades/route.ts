import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const agentUrl = process.env.FACILITATOR_URL
  const apiKey   = process.env.AGENT_API_KEY
  if (!agentUrl || !apiKey) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  const body = await req.json() as unknown

  let res: Response
  try {
    res = await fetch(`${agentUrl}/trades`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Settlement agent unreachable — try again in a moment' },
      { status: 503 },
    )
  }

  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { error: `Agent error (${res.status})` },
      { status: res.status >= 500 ? res.status : 502 },
    )
  }
  return NextResponse.json(data, { status: res.status })
}
