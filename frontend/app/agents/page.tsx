import type { Metadata } from 'next'
import { AgentsContent } from '@/components/agents-content'

export const metadata: Metadata = {
  title: 'For Agents — p2pai',
  description: 'Add p2pai to your AI agent. Buy and sell crypto-for-fiat autonomously.',
}

export default function AgentsPage() {
  return <AgentsContent />
}
