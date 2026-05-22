import { requireAdmin } from '@/lib/requireAdmin'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  ai_sprint: 'AI Sprint',
  growth: 'Growth',
  done_for_you: 'Done For You',
}

const STATUS_COLORS: Record<string, string> = {
  onboarding: 'bg-yellow-50 text-yellow-600',
  active: 'bg-green-50 text-green-600',
  paused: 'bg-orange-50 text-orange-600',
  churned: 'bg-gray-50 text-gray-400',
}

export default async function AdminClientsPage() {
  await requireAdmin()
  const supabase = createServiceClient()

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">Admin</p>
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="text-gray-500 text-sm mt-1">{clients?.length ?? 0} total clients</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {!clients || clients.length === 0 ? (
          <div className="text-center py-16">
            <Users size={24} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No clients yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#c8522a]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#c8522a] text-xs font-bold">
                          {(client.company_name || client.full_name || client.email || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.company_name || client.full_name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {client.plan ? PLAN_LABELS[client.plan] ?? client.plan : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_COLORS[client.status] ?? 'bg-gray-50 text-gray-400'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">
                      {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/clients/${client.id}`} className="flex items-center justify-end">
                      <ChevronRight size={14} className="text-gray-300 hover:text-gray-500 transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
