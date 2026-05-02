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

  const res = await fetch(`${agentUrl}/trades/${id}/link-pay`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  })

  const data = await res.json() as unknown
  return NextResponse.json(data, { status: res.status })
}
