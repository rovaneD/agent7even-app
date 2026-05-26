import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ServicesClient from './ServicesClient'
import { getTeamPermissions, hasPermission } from '@/lib/teamPermissions'

export default async function ServicesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (profile?.id) {
    const teamPerms = await getTeamPermissions(profile.id)
    if (!hasPermission(teamPerms, 'services')) redirect('/dashboard')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', profile?.id)
    .order('created_at', { ascending: false })

  return (
    <ServicesClient
      profile={profile}
      orders={orders ?? []}
    />
  )
}
