import { requireAdmin } from '@/lib/requireAdmin'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminInquiryDetail from './AdminInquiryDetail'

export default async function AdminInquiryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()

  const { id } = await params
  const supabase = createServiceClient()

  const { data: inquiry } = await supabase
    .from('project_inquiries')
    .select('*, profiles(id, full_name, company_name, email)')
    .eq('id', id)
    .single()

  if (!inquiry) redirect('/admin/inquiries')

  return <AdminInquiryDetail inquiry={inquiry} />
}
