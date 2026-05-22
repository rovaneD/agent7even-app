import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()
  const supabase = createServiceClient()

  // Fetch the user's profile row (created by the Clerk webhook on sign-up)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  // Fetch active services linked to this profile
  const { data: services } = await supabase
    .from('services')
    .select('id, name, status, started_at')
    .eq('clerk_user_id', userId)
    .eq('status', 'active')

  // Fetch recent content items
  const { data: contentItems } = await supabase
    .from('content_items')
    .select('id')
    .eq('clerk_user_id', userId)

  const activeServiceCount = services?.length ?? 0
  const totalContent = contentItems?.length ?? 0

  // Placeholder metric — replace with real data once tracked
  const hoursReclaimed = profile?.hours_reclaimed ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-sm tracking-wide">
          AGENT<span className="text-[#c8522a]">7</span>EVEN
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user?.firstName ? `Hey, ${user.firstName}` : 'Dashboard'}
          </span>
          <UserButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">
            Welcome back
          </p>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.firstName
              ? `${user.firstName}'s dashboard`
              : 'Your dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-light">
            Your marketing command center.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <StatCard
            label="Hours reclaimed"
            value={hoursReclaimed !== null ? String(hoursReclaimed) : '—'}
            sub="This month"
          />
          <StatCard
            label="Content produced"
            value={totalContent > 0 ? String(totalContent) : '—'}
            sub="All time"
          />
          <StatCard
            label="Active services"
            value={activeServiceCount > 0 ? String(activeServiceCount) : '—'}
            sub="Running now"
          />
        </div>

        {/* Active services list */}
        {services && services.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-4">
              Active services
            </p>
            <ul className="divide-y divide-gray-50">
              {services.map((svc) => (
                <li key={svc.id} className="py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                  <span className="text-[10px] font-semibold tracking-widest uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                    {svc.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: 'AI Toolkit', desc: 'Caption generator, email builder, ad copy, and more', soon: true },
            { title: 'Services & Orders', desc: 'Request and track managed marketing services', soon: true },
            { title: 'Analytics', desc: 'Social, website, and email performance in one view', soon: true },
            { title: 'Templates & Resources', desc: 'Downloadable content calendars, SOPs, and brand kits', soon: true },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 relative overflow-hidden"
            >
              {item.soon && (
                <span className="absolute top-4 right-4 text-[9px] font-semibold tracking-widest uppercase bg-gray-100 text-gray-400 px-2 py-1 rounded-full">
                  Coming soon
                </span>
              )}
              <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
