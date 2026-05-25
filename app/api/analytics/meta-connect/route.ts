import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const appId = process.env.META_APP_ID!
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.agent7even.com'
  const redirectUri = `${appUrl}/api/analytics/meta-callback`

  const scopes = [
    'ads_read',
    'ads_management',
    'business_management',
    'pages_read_engagement',
    'pages_show_list',
    'public_profile',
  ].join(',')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state: userId,
  })

  redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`)
}
