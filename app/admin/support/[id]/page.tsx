import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/requireAdmin'
import AdminSupportThread from './AdminSupportThread'

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const supabase = createServiceClient()

  const { data: ticket } = await supabase
    .from('support_tickets')
    .select(`
      *,
      profiles!support_tickets_user_id_fkey (
        id, full_name, company_name, email
      ),
      support_messages (
        id, sender_id, sender_role, body, created_at
      )
    `)
    .eq('id', id)
    .single()

  if (!ticket) redirect('/admin/support')

  return <AdminSupportThread ticket={ticket} />
}
