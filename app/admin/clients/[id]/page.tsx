import { requireAdmin } from '@/lib/requireAdmin'
import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdminNotes from './AdminNotes'
import OrderStatusUpdater from './OrderStatusUpdater'
import {
  ArrowLeft, Globe, Mail, Hash,
  Calendar, CreditCard, ShoppingBag,
} from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  ai_sprint: 'AI Sprint',
  growth: 'Growth',
  done_for_you: 'Done For You',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-600',
  in_review: 'bg-yellow-50 text-yellow-600',
  in_progress: 'bg-purple-50 text-purple-600',
  delivered: 'bg-green-50 text-green-600',
  approved: 'bg-green-50 text-green-600',
  cancelled: 'bg-gray-50 text-gray-400',
  revision_requested: 'bg-orange-50 text-orange-600',
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await requireAdmin()
  const supabase = createServiceClient()

  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })

  const { data: notes } = await supabase
    .from('admin_notes')
    .select('*, profiles!admin_notes_admin_id_fkey(full_name)')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="px-8 py-8 max-w-6xl">

      <Link href="/admin/clients" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
        <ArrowLeft size={14} /> Back to clients
      </Link>

      {/* Client header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#c8522a]/10 flex items-center justify-center">
            <span className="text-[#c8522a] text-xl font-bold">
              {(client.company_name || client.full_name || client.email || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {client.company_name || client.full_name || client.email}
            </h1>
            <p className="text-sm text-gray-400">{client.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {client.plan && (
                <span className="text-[10px] font-semibold uppercase tracking-widest bg-[#c8522a]/8 text-[#c8522a] px-2.5 py-1 rounded-full">
                  {PLAN_LABELS[client.plan] ?? client.plan}
                </span>
              )}
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                client.status === 'active' ? 'bg-green-50 text-green-600' :
                client.status === 'onboarding' ? 'bg-yellow-50 text-yellow-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                {client.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Left column */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Business info</p>
            <div className="space-y-3">
              {[
                { icon: Globe, label: 'Website', value: client.website_url },
                { icon: Hash, label: 'Instagram', value: client.instagram_handle },
                { icon: Mail, label: 'Email', value: client.email },
                { icon: CreditCard, label: 'Stripe ID', value: client.stripe_customer_id ? `...${client.stripe_customer_id.slice(-8)}` : null },
                { icon: Calendar, label: 'Joined', value: new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon size={13} className="text-gray-300 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p className="text-xs text-gray-700 font-medium">{value}</p>
                  </div>
                </div>
              ) : null)}
            </div>
            {client.business_goals && client.business_goals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-[10px] text-gray-400 mb-2">Goals</p>
                <div className="flex flex-wrap gap-1">
                  {client.business_goals.map((goal: string) => (
                    <span key={goal} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-1 rounded-full">
                      {goal.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tickets && tickets.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Support tickets</p>
              <div className="space-y-2">
                {tickets.map((ticket: { id: string; subject: string; status: string }) => (
                  <div key={ticket.id} className="flex items-center justify-between">
                    <p className="text-xs text-gray-700 truncate flex-1">{ticket.subject}</p>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${
                      ticket.status === 'open' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Orders ({orders?.length ?? 0})
            </p>
            {!orders || orders.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingBag size={18} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order: { id: string; title: string; status: string; created_at: string; brief?: string }) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{order.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </div>
                    {order.brief && (
                      <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3 mt-2">
                        {order.brief}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <AdminNotes
            clientId={client.id}
            adminId={userId}
            initialNotes={notes ?? []}
          />
        </div>
      </div>
    </div>
  )
}
