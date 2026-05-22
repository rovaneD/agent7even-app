'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle, AlertCircle,
  ArrowRight, Loader2, ExternalLink,
  Zap, TrendingUp, Users, FileText, Download,
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
  tier: number
}> = {
  ai_sprint: {
    label: 'AI Sprint',
    description: 'Core AI systems set up and running.',
    price: '$3,500',
    period: 'one-time',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    tier: 1,
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
    tier: 2,
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
    tier: 3,
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
  active:  { label: 'Active',    color: 'bg-green-50 text-green-600',   icon: CheckCircle },
  paused:  { label: 'Paused',    color: 'bg-yellow-50 text-yellow-600', icon: AlertCircle },
  churned: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',    icon: AlertCircle },
}

const INVOICE_STATUS: Record<string, { label: string; color: string }> = {
  paid:           { label: 'Paid',       color: 'bg-green-50 text-green-600'   },
  open:           { label: 'Open',       color: 'bg-yellow-50 text-yellow-600' },
  void:           { label: 'Void',       color: 'bg-gray-100 text-gray-400'    },
  uncollectible:  { label: 'Failed',     color: 'bg-red-50 text-red-500'       },
}

interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string | null
  created: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
  description: string | null
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

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function formatDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function BillingClient({
  profile,
  invoices,
}: {
  profile: Profile | null
  invoices: Invoice[]
}) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  const plan = profile?.plan ? PLAN_META[profile.plan] : null
  const currentTier = plan?.tier ?? 0
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

      {plan && (
        <div className="space-y-4">

          {/* Current plan card */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${plan.bg} flex items-center justify-center`}>
                    <plan.icon size={18} className={plan.color} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{plan.label}</p>
                      {statusDisplay && (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusDisplay.color}`}>
                          <statusDisplay.icon size={10} />
                          {statusDisplay.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-400 ml-1">{plan.period}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 mb-3">What&apos;s included</p>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-500">
                    <CheckCircle size={12} className="text-[#c8522a] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Manage billing */}
          {profile?.stripe_customer_id && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Payment method & settings</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Update card, download invoices, or cancel your plan via Stripe.
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-900 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {portalLoading
                    ? <><Loader2 size={13} className="animate-spin" /> Opening...</>
                    : <><ExternalLink size={13} /> Manage billing</>
                  }
                </button>
                {portalError && (
                  <p className="text-xs text-red-500 mt-2 text-right">{portalError}</p>
                )}
              </div>
            </div>
          )}

          {/* Invoice history */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">Invoice history</p>
              </div>
              <div className="divide-y divide-gray-50">
                {invoices.map(inv => {
                  const st = INVOICE_STATUS[inv.status ?? 'open'] ?? INVOICE_STATUS.open
                  return (
                    <div key={inv.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {inv.description ?? inv.number ?? `Invoice ${inv.id.slice(-6)}`}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(inv.created)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 w-16 text-right">
                          {formatAmount(inv.amount, inv.currency)}
                        </span>
                        {inv.invoice_pdf && (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upgrade option */}
          {currentTier < 3 && (
            <div className="bg-[#0d0d0d] rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  {currentTier === 1 ? 'Ready to grow faster?' : 'Want full-service management?'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentTier === 1
                    ? 'Upgrade to Growth — brand, website, email, and SEO included.'
                    : 'Upgrade to Done For You for ongoing content, ads, and reports.'}
                </p>
              </div>
              <Link
                href="/pricing"
                className="flex items-center gap-1.5 text-xs font-medium bg-[#c8522a] text-white px-4 py-2.5 rounded-xl hover:bg-[#b04623] transition-colors whitespace-nowrap flex-shrink-0"
              >
                Upgrade <ArrowRight size={11} />
              </Link>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
