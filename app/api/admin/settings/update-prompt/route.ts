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

  const { id, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'Prompt ID required' }, { status: 400 })

  const { error } = await supabase
    .from('prompt_library')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    console.error('Prompt update error:', error)
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
