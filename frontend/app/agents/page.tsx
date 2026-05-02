import type { Metadata } from 'next'
import { AgentsContent } from '@/components/agents-content'

export const metadata: Metadata = {
  title: 'For Agents — Convexo P2P',
  description: 'Add Convexo P2P to your AI agent. Buy and sell crypto-for-fiat autonomously.',
}

export default function AgentsPage() {
  return <AgentsContent />
}
