import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clerk_user_id,
      company_name,
      business_type,
      business_goals,
      website_url,
      instagram_handle,
    } = body

    if (!clerk_user_id) {
      return NextResponse.json({ error: 'Missing clerk_user_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id,
        company_name: company_name || null,
        business_type: business_type || null,
        business_goals: business_goals || [],
        website_url: website_url || null,
        instagram_handle: instagram_handle || null,
        onboarding_complete: true,
        status: 'active',
        role: 'client',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clerk_user_id' })

    if (error) {
      console.error('Onboarding upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
