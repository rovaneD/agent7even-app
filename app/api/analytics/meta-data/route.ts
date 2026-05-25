import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') ?? '7d'

  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[range] ?? 7

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]
  const untilStr = new Date().toISOString().split('T')[0]

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('meta_access_token, meta_ad_account_id, meta_ig_account_id, instagram_handle')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile?.meta_access_token) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 })
  }

  const token = profile.meta_access_token
  const results: Record<string, unknown> = {}

  // ── Instagram Insights ───────────────────────────────────────────────────
  if (profile.meta_ig_account_id) {
    try {
      const igMetricsRes = await fetch(
        `https://graph.facebook.com/v19.0/${profile.meta_ig_account_id}/insights?` +
        new URLSearchParams({
          metric: 'reach,impressions,profile_views,follower_count',
          period: 'day',
          since: sinceStr,
          until: untilStr,
          access_token: token,
        }).toString()
      )
      const igMetrics = await igMetricsRes.json()

      const igProfileRes = await fetch(
        `https://graph.facebook.com/v19.0/${profile.meta_ig_account_id}?` +
        new URLSearchParams({
          fields: 'followers_count,media_count,username',
          access_token: token,
        }).toString()
      )
      const igProfile = await igProfileRes.json()

      results.instagram = {
        handle: profile.instagram_handle,
        followers: igProfile.followers_count ?? 0,
        media_count: igProfile.media_count ?? 0,
        insights: igMetrics.data ?? [],
      }
    } catch (err) {
      console.error('Instagram insights error:', err)
      results.instagram = { error: 'Failed to fetch Instagram data' }
    }
  }

  // ── Meta Ads Insights ───────────────────────────────────────────────────
  if (profile.meta_ad_account_id) {
    try {
      const adsRes = await fetch(
        `https://graph.facebook.com/v19.0/${profile.meta_ad_account_id}/insights?` +
        new URLSearchParams({
          fields: 'spend,clicks,impressions,reach,ctr,cpc,actions',
          time_range: JSON.stringify({ since: sinceStr, until: untilStr }),
          time_increment: '1',
          access_token: token,
        }).toString()
      )
      const adsData = await adsRes.json()

      const daily = (adsData.data ?? []).map((d: {
        date_start: string
        spend: string
        clicks: string
        impressions: string
        reach: string
        ctr: string
        cpc: string
        actions?: Array<{ action_type: string; value: string }>
      }) => ({
        date: d.date_start,
        spend: parseFloat(d.spend ?? '0'),
        clicks: parseInt(d.clicks ?? '0'),
        impressions: parseInt(d.impressions ?? '0'),
        reach: parseInt(d.reach ?? '0'),
        ctr: parseFloat(d.ctr ?? '0'),
        cpc: parseFloat(d.cpc ?? '0'),
        conversions: d.actions?.find(
          (a) => a.action_type === 'offsite_conversion.fb_pixel_purchase'
        )?.value ?? 0,
      }))

      const totals = daily.reduce(
        (acc: { spend: number; clicks: number; impressions: number; reach: number; conversions: number }, d: { spend: number; clicks: number; impressions: number; reach: number; conversions: number | string }) => ({
          spend: acc.spend + d.spend,
          clicks: acc.clicks + d.clicks,
          impressions: acc.impressions + d.impressions,
          reach: acc.reach + d.reach,
          conversions: acc.conversions + Number(d.conversions),
        }),
        { spend: 0, clicks: 0, impressions: 0, reach: 0, conversions: 0 }
      )

      results.ads = { daily, totals }
    } catch (err) {
      console.error('Meta Ads insights error:', err)
      results.ads = { error: 'Failed to fetch Meta Ads data' }
    }
  }

  return NextResponse.json(results)
}
