import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import InquiryForm from './InquiryForm'

export default async function InquiryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  return (
    <InquiryForm companyName={profile.company_name ?? ''} />
  )
}
