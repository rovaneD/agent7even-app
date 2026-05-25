import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, company_name, website_url, instagram_handle, business_type, plan, status')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  return <SettingsClient profile={profile} />
}
