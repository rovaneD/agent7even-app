import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BrandKitClient from './BrandKitClient'

export default async function BrandKitPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  const { data: answers } = await supabase
    .from('brand_answers')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  const { data: documents } = await supabase
    .from('brand_documents')
    .select('*')
    .eq('user_id', profile.id)
    .order('type')

  return (
    <BrandKitClient
      profileId={profile.id}
      companyName={profile.company_name ?? ''}
      savedAnswers={answers?.answers ?? null}
      answersComplete={answers?.completed ?? false}
      documents={documents ?? []}
    />
  )
}
