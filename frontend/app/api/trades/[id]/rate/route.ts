import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase-server'

const Body = z.object({
  rater_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/i),
  score:         z.number().int().min(1).max(5),
  comment:       z.string().max(300).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tradeId } = await params
  const parsed = Body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 })
  }
  const body = parsed.data
  const supabase = createServerClient()

  const { data: trade } = await supabase
    .from('trades')
    .select('buyer_address, seller_address, status')
    .eq('id', tradeId)
    .single()

  if (!trade) return NextResponse.json({ error: 'Trade not found' }, { status: 404 })

  const raterLower = body.rater_address.toLowerCase()
  const isBuyer   = trade.buyer_address.toLowerCase()  === raterLower
  const isSeller  = trade.seller_address.toLowerCase() === raterLower
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: 'Not a party to this trade' }, { status: 403 })
  }

  if (trade.status !== 'released' && trade.status !== 'complete') {
    return NextResponse.json({ error: 'Trade not yet settled' }, { status: 409 })
  }

  const rateeAddress = isBuyer ? trade.seller_address : trade.buyer_address

  const { error } = await supabase
    .from('ratings')
    .upsert(
      {
        trade_id:      tradeId,
        rater_address: body.rater_address,
        ratee_address: rateeAddress,
        score:         body.score,
        comment:       body.comment ?? null,
      },
      { onConflict: 'trade_id,rater_address' },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recompute ratee's aggregate rating
  const { data: scores } = await supabase
    .from('ratings')
    .select('score')
    .eq('ratee_address', rateeAddress)

  if (scores && scores.length > 0) {
    const avg = scores.reduce((s, r) => s + r.score, 0) / scores.length
    await supabase
      .from('users')
      .update({ rating_avg: avg, trade_count: scores.length })
      .eq('address', rateeAddress)
  }

  return NextResponse.json({ ok: true })
}
