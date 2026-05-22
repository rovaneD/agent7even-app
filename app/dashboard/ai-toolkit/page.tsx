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
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  const { data: prompts } = await supabase
    .from('prompt_library')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const { data: savedPrompts } = await supabase
    .from('saved_prompts')
    .select('*')
    .eq('user_id', profile?.id)
    .order('created_at', { ascending: false })

  const { count: totalOutputs } = await supabase
    .from('ai_tool_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile?.id)

  const { data: usageData } = await supabase
    .from('ai_tool_usage')
    .select('time_saved_mins')
    .eq('user_id', profile?.id)

  const totalTimeSaved = usageData?.reduce((sum, row) => sum + (row.time_saved_mins ?? 0), 0) ?? 0

  return (
    <AIToolkitClient
      profile={profile}
      prompts={prompts ?? []}
      savedPrompts={savedPrompts ?? []}
      totalOutputs={totalOutputs ?? 0}
      totalTimeSaved={totalTimeSaved}
    />
  )
}
