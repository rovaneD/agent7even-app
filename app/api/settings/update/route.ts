import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { companyName, websiteUrl, instagramHandle } = await req.json()
  console.log('Settings update called with:', { companyName, websiteUrl, instagramHandle })

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      company_name: companyName || null,
      website_url: websiteUrl || null,
      instagram_handle: instagramHandle || null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)

  if (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/analytics')

  return NextResponse.json({ success: true })
}
