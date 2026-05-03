import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const agentUrl = process.env.FACILITATOR_URL
  if (!agentUrl) {
    return NextResponse.json({ error: 'Agent not configured' }, { status: 503 })
  }

  const body = await req.json() as unknown

  let res: Response
  try {
    res = await fetch(`${agentUrl}/trades/${id}/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 503 })
  }

  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch {
    return NextResponse.json({ error: `Agent error (${res.status})` }, { status: 502 })
  }
  return NextResponse.json(data, { status: res.status })
}
