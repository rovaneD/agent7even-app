import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import MayaShell from './MayaShell'

export default async function MayaPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const [{ data: profile }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        id, company_name, business_type, full_name, plan,
        website_url, instagram_handle, business_goals,
        ideal_customer, sell_locations, marketing_budget,
        competitors, top_goals, marketing_challenge, content_comfort
      `)
      .eq('clerk_user_id', userId)
      .single(),

    supabase
      .from('agent_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('requires_approval', true)
      .eq('status', 'complete')
      .is('approved_at', null)
      .is('rejected_at', null),
  ])

  return (
    <MayaShell
      companyName={profile?.company_name ?? profile?.full_name ?? 'there'}
      businessType={profile?.business_type ?? ''}
      plan={profile?.plan ?? ''}
      websiteUrl={profile?.website_url ?? ''}
      instagramHandle={profile?.instagram_handle ?? ''}
      businessGoals={profile?.business_goals ?? []}
      idealCustomer={profile?.ideal_customer ?? ''}
      sellLocations={profile?.sell_locations ?? []}
      marketingBudget={profile?.marketing_budget ?? ''}
      competitors={profile?.competitors ?? []}
      topGoals={profile?.top_goals ?? []}
      marketingChallenge={profile?.marketing_challenge ?? ''}
      contentComfort={profile?.content_comfort ?? ''}
      pendingApprovalCount={pendingCount ?? 0}
    />
  )
}
