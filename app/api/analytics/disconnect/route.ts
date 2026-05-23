import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      ga_measurement_id: null,
      ga_refresh_token: null,
      ga_oauth_email: null,
      ga_connected: false,
    })
    .eq('clerk_user_id', userId)

  if (error) return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  return NextResponse.json({ success: true })
}
