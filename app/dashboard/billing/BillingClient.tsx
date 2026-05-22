'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle, AlertCircle,
  ArrowRight, Loader2, ExternalLink, Zap, TrendingUp, Users
} from 'lucide-react'

const PLAN_META: Record<string, {
  label: string
  description: string
  price: string
  period: string
  icon: React.ElementType
  color: string
  bg: string
  features: string[]
}> = {
  ai_sprint: {
    label: 'AI Sprint',
    description: 'Core AI systems set up and running.',
    price: '$3,500',
    period: 'one-time',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    features: [
      'Workflow audit & bottleneck mapping',
      'Custom AI prompt library',
      '2–3 core workflows built & tested',
      '60-min team training session',
      '1-week post-launch check-in',
    ],
  },
  growth: {
    label: 'Growth',
    description: 'AI sprint plus the highest-leverage creative services.',
    price: '$7,500',
    period: 'one-time',
    icon: TrendingUp,
    color: 'text-[#c8522a]',
    bg: 'bg-[#c8522a]/8',
    features: [
      'Everything in AI Sprint',
      'Brand identity & logo design',
      '5-page website built & launched',
      'Email marketing setup & templates',
      'SEO foundations configured',
      '30-day post-launch support',
    ],
  },
  done_for_you: {
    label: 'Done For You',
    description: 'We handle everything on an ongoing basis.',
    price: '$5,000',
    period: '/month',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    features: [
      'Everything in Growth',
      'Social media management',
      'Monthly product photography',
      'Reels & video editing',
      'Ad management (Meta & Google)',
      'Weekly performance reports',
    ],
  },
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:   { label: 'Active',   color: 'bg-green-50 text-green-600',   icon: CheckCircle },
  paused:   { label: 'Paused',   color: 'bg-yellow-50 text-yellow-600', icon: AlertCircle },
  churned:  { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',   icon: AlertCircle },
}

interface Profile {
  plan?: string | null
  status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  email?: string | null
  company_name?: string | null
  full_name?: string | null
}

export default function BillingClient({ profile }: { profile: Profile | null }) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  const plan = profile?.plan ? PLAN_META[profile.plan] : null
  const statusDisplay = profile?.status ? STATUS_DISPLAY[profile.status] : null

  const openPortal = async () => {
    setPortalLoading(true)
    setPortalError('')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError('Could not open billing portal. Please try again.')
      }
    } catch {
      setPortalError('Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">Billing</p>
        <h1 className="text-2xl font-bold text-gray-900">Billing & plan</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan and payment details.</p>
      </div>

      {/* No plan */}
      {!plan && (
        <div className="bg-[#0d0d0d] rounded-2xl p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <CreditCard size={20} className="text-gray-400" />
          </div>
          <p className="text-white font-semibold mb-2">No active plan</p>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Choose a plan to unlock your full workspace and get your team started.
          </p>
          <Link
            href="/pricing"
            className="flex items-center gap-2 bg-[#c8522a] text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-[#b04623] transition-colors"
          >
            View plans <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Active plan */}
      {plan && (
        <div className="space-y-4">

          {/* Plan card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center`}>
                    <plan.icon size={18} className={plan.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{plan.label}</p>
                      {statusDisplay && (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusDisplay.color}`}>
                          <statusDisplay.icon size={10} />
                          {statusDisplay.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{plan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-3">What's included</p>
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-500">
                    <CheckCircle size={13} className="text-[#c8522a] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Manage billing */}
          {profile?.stripe_customer_id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Payment & invoices</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Update payment method, download invoices, or cancel your plan.
                  </p>
                </div>
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all"
                >
                  {portalLoading
                    ? <><Loader2 size={13} className="animate-spin" /> Opening...</>
                    : <><ExternalLink size={13} /> Manage billing</>
                  }
                </button>
              </div>
              {portalError && (
                <p className="text-xs text-red-500 mt-3">{portalError}</p>
              )}
            </div>
          )}

          {/* Upgrade prompt for one-time plans */}
          {profile?.plan !== 'done_for_you' && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Want ongoing support?</p>
                <p className="text-xs text-gray-400 mt-0.5">Upgrade to Done For You for full-service monthly management.</p>
              </div>
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 text-xs font-medium text-[#c8522a] hover:text-[#b04623] transition-colors flex-shrink-0"
              >
                View plans <ArrowRight size={11} />
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
