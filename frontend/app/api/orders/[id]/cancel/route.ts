import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const agentUrl = process.env.FACILITATOR_URL
  const apiKey   = process.env.AGENT_API_KEY
  if (!agentUrl || !apiKey) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  const body = await req.text()
  const agentRes = await fetch(`${agentUrl}/orders/${id}/cancel`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body,
  })

  const text = await agentRes.text()
  return new NextResponse(text, {
    status:  agentRes.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
