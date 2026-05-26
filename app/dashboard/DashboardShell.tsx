'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Zap,
  ShoppingBag,
  BarChart2,
  FileText,
  Headphones,
  CreditCard,
  Settings,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Bell,
  Users,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  link: string | null
  read: boolean
  created_at: string
}

interface Props {
  children: React.ReactNode
  profileId: string
  initialNotifications: Notification[]
}

const NAV = [
  {
    section: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Your workspace',
    items: [
      { href: '/dashboard/services', label: 'Services', icon: ShoppingBag },
      { href: '/dashboard/ai-toolkit', label: 'AI Toolkit', icon: Zap },
      { href: '/dashboard/brand-kit', label: 'Brand Kit', icon: Sparkles },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
      { href: '/dashboard/deliverables', label: 'Deliverables', icon: FileText },
    ],
  },
  {
    section: 'Account',
    items: [
      { href: '/dashboard/support', label: 'Support', icon: Headphones },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { href: '/dashboard/team', label: 'Team', icon: Users },
      { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export default function DashboardShell({ children, profileId, initialNotifications }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-100
          flex flex-col transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="font-bold text-sm tracking-wide text-gray-900">
            AGENT<span className="text-[#c8522a]">7</span>EVEN
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 px-2 mb-2">
                {group.section}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5
                      ${active
                        ? 'bg-[#c8522a]/8 text-[#c8522a] font-medium'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon size={15} className={active ? 'text-[#c8522a]' : 'text-gray-400'} />
                    {item.label}
                    {active && (
                      <ChevronRight size={12} className="ml-auto text-[#c8522a]" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-gray-400 truncate">My account</span>
        </div>

        {/* Legal links */}
        <div className="px-5 pb-4 flex items-center gap-3">
          <a href="/privacy" target="_blank" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">Privacy</a>
          <span className="text-gray-200 text-[10px]">·</span>
          <a href="/terms" target="_blank" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">Terms</a>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500">
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm tracking-wide">
            AGENT<span className="text-[#c8522a]">7</span>EVEN
          </span>
          <div className="flex items-center gap-2">
            <NotificationBell profileId={profileId} initialNotifications={initialNotifications} />
            <UserButton />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  )
}
