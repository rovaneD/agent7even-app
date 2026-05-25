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

  const { userId: targetId, role, status, plan } = await req.json()
  if (!targetId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (role !== undefined) updates.role = role
  if (status !== undefined) updates.status = status
  if (plan !== undefined) updates.plan = plan

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', targetId)

  if (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
