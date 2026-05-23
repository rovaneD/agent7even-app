import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

function getAnalyticsClient() {
  const email = process.env.GOOGLE_SA_CLIENT_EMAIL
  const key = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !key) throw new Error('Google service account credentials not configured')

  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key: key },
  })
}

function dateRange(range: string): { startDate: string; endDate: string } {
  const map: Record<string, string> = {
    '7d': '7daysAgo',
    '30d': '30daysAgo',
    '90d': '90daysAgo',
  }
  return { startDate: map[range] ?? '7daysAgo', endDate: 'today' }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = req.nextUrl.searchParams.get('range') ?? '7d'

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('ga_measurement_id')
    .eq('clerk_user_id', userId)
    .single()

  const propertyId = profile?.ga_measurement_id
  if (!propertyId) {
    return NextResponse.json({ error: 'No GA property configured' }, { status: 404 })
  }

  try {
    const analyticsClient = getAnalyticsClient()
    const { startDate, endDate } = dateRange(range)

    const [chartResponse, totalsResponse] = await Promise.all([
      // Daily breakdown for the chart
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),
      // Aggregate totals for the stat card
      analyticsClient.runReport({
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

    const totals = totalsResponse[0].rows?.[0]
    const summary = {
      sessions: Number(totals?.metricValues?.[0].value ?? 0),
      users: Number(totals?.metricValues?.[1].value ?? 0),
      pageviews: Number(totals?.metricValues?.[2].value ?? 0),
      bounceRate: Number(totals?.metricValues?.[3].value ?? 0).toFixed(1),
    }

    return NextResponse.json({ connected: true, chartData, summary })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    // Service account doesn't have access yet — still pending
    if (
      message.includes('does not have access') ||
      message.includes('permission') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('403')
    ) {
      return NextResponse.json({ connected: false, pending: true })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
