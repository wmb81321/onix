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

  // settle is a public mppx endpoint — the 0.1 USDC payment IS the auth, no Bearer header
  let res: Response
  try {
    res = await fetch(`${agentUrl}/trades/${id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
