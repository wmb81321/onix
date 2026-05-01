import { createServerClient } from '@/lib/supabase-server'
import { AccountClient } from './account-client'

export default async function AccountPage() {
  // Orders and trades are loaded client-side — server just provides the shell
  return <AccountClient />
}
