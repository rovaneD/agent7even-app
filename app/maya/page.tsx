import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import MayaShell from './MayaShell'

export default async function MayaPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, business_type, full_name, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  return (
    <MayaShell
      companyName={profile.company_name ?? profile.full_name ?? 'there'}
      businessType={profile.business_type ?? ''}
      plan={profile.plan ?? ''}
    />
  )
}
