import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      meta_access_token: null,
      meta_ad_account_id: null,
      meta_ig_account_id: null,
      meta_connected: false,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)

  if (error) {
    console.error('Meta disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
