import { requireAdmin } from '@/lib/requireAdmin'

export default async function AdminRevenuePage() {
  await requireAdmin()
  return (
    <div className="px-8 py-8">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">Admin</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Revenue</h1>
      <p className="text-gray-400 text-sm">This section is coming soon.</p>
    </div>
  )
}
