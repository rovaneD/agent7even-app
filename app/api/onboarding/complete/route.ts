import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      clerk_user_id,
      company_name,
      business_type,
      ideal_customer,
      business_goals,
      website_url,
      instagram_handle,
      sell_locations,
      marketing_budget,
      competitors,
      top_goals,
      marketing_challenge,
      content_comfort,
    } = body

    if (!clerk_user_id) {
      return NextResponse.json({ error: 'Missing clerk_user_id' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: company_name || null,
        business_type: business_type || null,
        ideal_customer: ideal_customer || null,
        business_goals: business_goals || [],
        website_url: website_url || null,
        instagram_handle: instagram_handle || null,
        sell_locations: sell_locations || [],
        marketing_budget: marketing_budget || null,
        competitors: competitors || [],
        top_goals: top_goals || [],
        marketing_challenge: marketing_challenge || null,
        content_comfort: content_comfort || null,
        onboarding_complete: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerk_user_id)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
