import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import DeliverablesClient from './DeliverablesClient'
import { getTeamPermissions, hasPermission } from '@/lib/teamPermissions'

export default async function DeliverablesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  const teamPerms = await getTeamPermissions(profile.id)
  if (!hasPermission(teamPerms, 'deliverables')) redirect('/dashboard')

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  return (
    <DeliverablesClient
      profileId={profile.id}
      companyName={profile.company_name ?? ''}
      deliverables={deliverables ?? []}
    />
  )
}
