import { NextResponse } from 'next/server'
// Stripe removed in v2.0
export async function POST() {
  return NextResponse.json({ error: 'Removed' }, { status: 410 })
}
