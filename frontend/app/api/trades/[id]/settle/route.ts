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
  const res = await fetch(`${agentUrl}/trades/${id}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await res.json() as unknown
  return NextResponse.json(data, { status: res.status })
}
