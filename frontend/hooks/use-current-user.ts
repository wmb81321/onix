'use client'

import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { createClient, type User } from '@/lib/supabase'

export function useCurrentUser() {
  const { address, isConnected } = useAccount()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setUser(null)
      return
    }

    setLoading(true)
    const supabase = createClient()
    supabase
      .from('users')
      .select()
      .eq('address', address)
      .single()
      .then(({ data }) => {
        setUser(data)
        setLoading(false)
      })
  }, [isConnected, address])

  return { user, loading, address, isConnected }
}
