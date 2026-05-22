import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, status, stripe_customer_id, stripe_subscription_id, email, company_name, full_name')
    .eq('clerk_user_id', userId)
    .single()

  return <BillingClient profile={profile} />
}
