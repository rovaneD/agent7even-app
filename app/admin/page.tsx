import { requireAdmin } from '@/lib/requireAdmin'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, ShoppingBag, Headphones,
  TrendingUp, AlertCircle, Clock, ChevronRight, CheckCircle
} from 'lucide-react'

export default async function AdminPage() {
  await requireAdmin()

  const supabase = createServiceClient()

  // Fetch all key metrics in parallel
  const [
    { count: totalClients },
    { count: activeClients },
    { data: recentOrders },
    { count: openTickets },
    { data: recentClients },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client').eq('status', 'active'),
    supabase.from('orders').select('*, profiles(full_name, company_name, email)').order('created_at', { ascending: false }).limit(5),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false }).limit(5),
  ])

  const pendingOrders = recentOrders?.filter(o => ['submitted', 'in_review'].includes(o.status)) ?? []

  const STATUS_COLORS: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-600',
    in_review: 'bg-yellow-50 text-yellow-600',
    in_progress: 'bg-purple-50 text-purple-600',
    delivered: 'bg-green-50 text-green-600',
    approved: 'bg-green-50 text-green-600',
    cancelled: 'bg-gray-50 text-gray-400',
    revision_requested: 'bg-orange-50 text-orange-600',
  }

  const PLAN_LABELS: Record<string, string> = {
    ai_sprint: 'AI Sprint',
    growth: 'Growth',
    done_for_you: 'Done For You',
  }

  return (
    <div className="px-8 py-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">Admin</p>
        <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
        <p className="text-gray-500 text-sm mt-1">Everything happening across Agent7even right now.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total clients', value: totalClients ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', href: '/admin/clients' },
          { label: 'Active clients', value: activeClients ?? 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', href: '/admin/clients' },
          { label: 'Pending orders', value: pendingOrders.length, icon: ShoppingBag, color: 'text-[#c8522a]', bg: 'bg-[#c8522a]/8', href: '/admin/orders' },
          { label: 'Open tickets', value: openTickets ?? 0, icon: Headphones, color: 'text-purple-500', bg: 'bg-purple-50', href: '/admin/support' },
        ].map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center mb-3`}>
              <metric.icon size={15} className={metric.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <p className="text-xs text-gray-400">{metric.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent orders</p>
            <Link href="/admin/orders" className="text-xs text-[#c8522a] hover:underline">View all →</Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{order.title}</p>
                    <p className="text-xs text-gray-400">
                      {order.profiles?.company_name || order.profiles?.full_name || order.profiles?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-400'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <ShoppingBag size={20} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No orders yet</p>
            </div>
          )}
        </div>

        {/* Recent clients */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recent clients</p>
            <Link href="/admin/clients" className="text-xs text-[#c8522a] hover:underline">View all →</Link>
          </div>
          {recentClients && recentClients.length > 0 ? (
            <div className="space-y-3">
              {recentClients.map((client: any) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#c8522a]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#c8522a] text-xs font-bold">
                        {(client.company_name || client.full_name || client.email || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {client.company_name || client.full_name || client.email}
                      </p>
                      <p className="text-xs text-gray-400">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.plan && (
                      <span className="text-[10px] font-medium text-gray-400">
                        {PLAN_LABELS[client.plan] ?? client.plan}
                      </span>
                    )}
                    <ChevronRight size={12} className="text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users size={20} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No clients yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
