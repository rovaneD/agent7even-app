import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, plan')
    .eq('clerk_user_id', userId)
    .single()

  return (
    <AnalyticsClient
      companyName={profile?.company_name ?? ''}
      plan={profile?.plan ?? ''}
    />
  )
}
