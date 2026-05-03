import { NextResponse } from 'next/server'
// Stripe Link removed in v2.0
export async function POST() {
  return NextResponse.json({ error: 'Removed' }, { status: 410 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Removed' }, { status: 410 })
}
