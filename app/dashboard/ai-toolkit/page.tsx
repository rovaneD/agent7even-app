import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AIToolkitClient from './AIToolkitClient'

export default async function AIToolkitPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  // Fetch prompt library
  const { data: prompts } = await supabase
    .from('prompt_library')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  // Fetch saved prompts
  const { data: savedPrompts } = await supabase
    .from('saved_prompts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch usage stats
  const { data: usageStats } = await supabase
    .from('ai_tool_usage')
    .select('time_saved_mins')
    .eq('user_id', profile.id)

  const totalTimeSaved = usageStats?.reduce((a, u) => a + (u.time_saved_mins ?? 0), 0) ?? 0
  const totalRuns = usageStats?.length ?? 0

  // Monthly runs for Starter plan enforcement
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { count: monthlyRunsCount } = await supabase
    .from('ai_tool_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .gte('created_at', startOfMonth)
  const monthlyRuns = monthlyRunsCount ?? 0

  // Fetch brand documents — used for brand voice toggle
  const { data: brandDocs } = await supabase
    .from('brand_documents')
    .select('type, title')
    .eq('user_id', profile.id)

  const hasBrandKit = (brandDocs?.length ?? 0) > 0
  const brandKitComplete = ['voice', 'story', 'persona', 'positioning'].every(
    type => brandDocs?.some(d => d.type === type)
  )

  return (
    <AIToolkitClient
      prompts={prompts ?? []}
      savedPrompts={savedPrompts ?? []}
      totalTimeSaved={totalTimeSaved}
      totalRuns={totalRuns}
      plan={profile.plan ?? null}
      monthlyRuns={monthlyRuns}
      companyName={profile.company_name ?? ''}
      hasBrandKit={hasBrandKit}
      brandKitComplete={brandKitComplete}
    />
  )
}
