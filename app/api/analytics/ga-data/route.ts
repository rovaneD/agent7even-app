import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getServiceAccountClient() {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL
  const key = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (!email || !key) throw new Error('Service account credentials not configured')
  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key: key },
  })
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token ?? null
}

// ── Date range ────────────────────────────────────────────────────────────────

function dateRange(range: string) {
  const map: Record<string, string> = {
    '7d': '7daysAgo',
    '30d': '30daysAgo',
    '90d': '90daysAgo',
  }
  return { startDate: map[range] ?? '7daysAgo', endDate: 'today' }
}

// ── Query via OAuth (REST) ────────────────────────────────────────────────────

async function queryViaOAuth(
  propertyId: string,
  accessToken: string,
  range: string
) {
  const { startDate, endDate } = dateRange(range)
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  }
  const totalsBody = {
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'bounceRate' },
    ],
  }

  const [chartRes, totalsRes] = await Promise.all([
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(totalsBody),
    }),
  ])

  const chartData = await chartRes.json()
  const totalsData = await totalsRes.json()

  if (chartData.error) throw new Error(chartData.error.message)

  const rows = (chartData.rows ?? []).map((r: {dimensionValues: [{value: string}]; metricValues: [{value: string}, {value: string}]}) => ({
    day: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value),
    users: Number(r.metricValues[1].value),
  }))

  const t = totalsData.rows?.[0]
  const summary = {
    sessions: Number(t?.metricValues?.[0]?.value ?? 0),
    users: Number(t?.metricValues?.[1]?.value ?? 0),
    pageviews: Number(t?.metricValues?.[2]?.value ?? 0),
    bounceRate: Number(t?.metricValues?.[3]?.value ?? 0).toFixed(1),
  }

  return { chartData: rows, summary }
}

// ── Query via service account ─────────────────────────────────────────────────

async function queryViaServiceAccount(propertyId: string, range: string) {
  const client = getServiceAccountClient()
  const { startDate, endDate } = dateRange(range)

  const [chartResponse, totalsResponse] = await Promise.all([
    client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    }),
    client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
      ],
    }),
  ])

  const chartData = (chartResponse[0].rows ?? []).map((row) => ({
    day: row.dimensionValues?.[0].value ?? '',
    sessions: Number(row.metricValues?.[0].value ?? 0),
    users: Number(row.metricValues?.[1].value ?? 0),
  }))

  const t = totalsResponse[0].rows?.[0]
  const summary = {
    sessions: Number(t?.metricValues?.[0].value ?? 0),
    users: Number(t?.metricValues?.[1].value ?? 0),
    pageviews: Number(t?.metricValues?.[2].value ?? 0),
    bounceRate: Number(t?.metricValues?.[3].value ?? 0).toFixed(1),
  }

  return { chartData, summary }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = req.nextUrl.searchParams.get('range') ?? '7d'

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('ga_measurement_id, ga_refresh_token')
    .eq('clerk_user_id', userId)
    .single()

  const propertyId = profile?.ga_measurement_id
  if (!propertyId) {
    return NextResponse.json({ error: 'No GA property configured' }, { status: 404 })
  }

  try {
    // Prefer OAuth if available
    if (profile?.ga_refresh_token) {
      const accessToken = await refreshAccessToken(profile.ga_refresh_token)
      if (accessToken) {
        const result = await queryViaOAuth(propertyId, accessToken, range)
        return NextResponse.json({ connected: true, via: 'oauth', ...result })
      }
    }

    // Fallback: service account
    const result = await queryViaServiceAccount(propertyId, range)
    return NextResponse.json({ connected: true, via: 'service_account', ...result })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isPending =
      message.includes('does not have access') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('403')

    if (isPending) return NextResponse.json({ connected: false, pending: true })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
