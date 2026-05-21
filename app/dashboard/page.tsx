import { auth, currentUser } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()

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
            Your marketing command center is being set up. More features coming soon.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Hours reclaimed', value: '—', sub: 'This month' },
            { label: 'Content produced', value: '—', sub: 'All time' },
            { label: 'Active services', value: '—', sub: 'Running now' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-2">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Coming soon grid */}
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
