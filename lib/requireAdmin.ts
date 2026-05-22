import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export async function requireAdmin() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return { userId, role: profile.role }
}
