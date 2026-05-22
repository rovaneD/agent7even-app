'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Users, ShoppingBag, Headphones,
  CreditCard, Settings, ChevronRight, Menu, X, Shield,
} from 'lucide-react'

const NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Manage',
    items: [
      { href: '/admin/clients', label: 'Clients', icon: Users },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/support', label: 'Support', icon: Headphones },
    ],
  },
  {
    section: 'Business',
    items: [
      { href: '/admin/revenue', label: 'Revenue', icon: CreditCard },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-[#0d0d0d] flex flex-col
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
          <div>
            <span className="font-bold text-sm tracking-wide text-white">
              AGENT<span className="text-[#c8522a]">7</span>EVEN
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={9} className="text-[#c8522a]" />
              <span className="text-[9px] font-semibold tracking-widest uppercase text-[#c8522a]">Admin</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/40">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="text-[9px] font-semibold tracking-widest uppercase text-white/20 px-2 mb-2">
                {group.section}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5
                      ${active ? 'bg-white/8 text-white font-medium' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                    `}
                  >
                    <Icon size={15} className={active ? 'text-[#c8522a]' : 'text-white/30'} />
                    {item.label}
                    {active && <ChevronRight size={12} className="ml-auto text-[#c8522a]" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/30 hover:text-white/50 transition-colors"
          >
            ← Client dashboard
          </Link>
        </div>

        <div className="px-5 py-4 border-t border-white/5 flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-white/30 truncate">Admin account</span>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500">
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm">AGENT<span className="text-[#c8522a]">7</span>EVEN</span>
          <UserButton />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
