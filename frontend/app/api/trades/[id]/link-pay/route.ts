import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const agentUrl = process.env.FACILITATOR_URL
  const apiKey   = process.env.AGENT_API_KEY
  if (!agentUrl || !apiKey) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  let res: Response
  try {
    res = await fetch(`${agentUrl}/trades/${id}/link-pay`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Settlement agent unreachable' }, { status: 503 })
  }

  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch {
    return NextResponse.json({ error: `Agent error (${res.status})` }, { status: 502 })
  }
  return NextResponse.json(data, { status: res.status })
}
