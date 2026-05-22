import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  // Gate: redirect to onboarding if not complete
  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-sm tracking-wide text-gray-900">
          AGENT<span className="text-[#c8522a]">7</span>EVEN
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {profile?.company_name || profile?.full_name || 'Welcome'}
          </span>
          <div className="w-8 h-8 rounded-full bg-[#c8522a]/10 flex items-center justify-center">
            <span className="text-[#c8522a] text-xs font-bold">
              {(profile?.company_name || profile?.full_name || 'U')[0].toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#c8522a] mb-2">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{profile?.company_name ? `, ${profile.company_name}` : ''}.
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your business.
          </p>
        </div>

        {/* Value scorecard */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Hours reclaimed', value: '—', sub: 'This month', color: 'text-[#c8522a]' },
            { label: 'Content produced', value: '—', sub: 'Total pieces', color: 'text-blue-500' },
            { label: 'Active services', value: '—', sub: 'Running now', color: 'text-green-500' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-3">
                {card.label}
              </p>
              <p className={`text-3xl font-bold ${card.color} mb-1`}>{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Empty state — services */}
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#c8522a]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#c8522a] text-lg">⚡</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Your workspace is ready
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Services, AI tools, analytics, and more are on the way.
            Your account is active and your team has been notified.
          </p>
          <a
            href="https://agent7even.com/#pricing"
            className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#b04623] transition-colors"
          >
            Explore services →
          </a>
        </div>

      </main>
    </div>
  )
}
