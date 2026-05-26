import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'
import { getTeamPermissions, hasPermission } from '@/lib/teamPermissions'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      company_name,
      plan,
      ga_connected,
      ga_measurement_id,
      ga_oauth_email,
      meta_connected,
      instagram_handle,
      meta_ad_account_id
    `)
    .eq('clerk_user_id', userId)
    .single()

  if (profile?.id) {
    const teamPerms = await getTeamPermissions(profile.id)
    if (!hasPermission(teamPerms, 'analytics')) redirect('/dashboard')
  }

  return (
    <AnalyticsClient
      companyName={profile?.company_name ?? ''}
      plan={profile?.plan ?? ''}
      gaMeasurementId={profile?.ga_measurement_id ?? null}
      gaOAuthConnected={profile?.ga_connected ?? false}
      gaOAuthEmail={profile?.ga_oauth_email ?? null}
      metaConnected={profile?.meta_connected ?? false}
      igHandle={profile?.instagram_handle ?? null}
      metaAdAccountId={profile?.meta_ad_account_id ?? null}
    />
  )
}
