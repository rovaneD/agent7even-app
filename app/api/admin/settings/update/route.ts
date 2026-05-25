import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile || !['admin', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { key, value } = await req.json()
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
