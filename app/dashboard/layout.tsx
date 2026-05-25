import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import DashboardShell from './DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const supabase = createServiceClient()

  let profileId = ''
  let notifications: {
    id: string
    title: string
    body: string
    type: string
    link: string | null
    read: boolean
    created_at: string
  }[] = []

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (profile?.id) {
      profileId = profile.id

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      notifications = data ?? []
    }
  }

  return (
    <DashboardShell profileId={profileId} initialNotifications={notifications}>
      {children}
    </DashboardShell>
  )
}
