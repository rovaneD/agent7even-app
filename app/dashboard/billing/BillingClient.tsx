'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard, ExternalLink, Download,
  CheckCircle, AlertCircle, Clock,
  ArrowRight, Loader2, Zap, TrendingUp, Layers
} from 'lucide-react'

const PLAN_CONFIG = {
  ai_sprint: {
    name: 'AI Sprint',
    desc: 'AI workflow audit, prompt library, core automations.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  growth: {
    name: 'Growth',
    desc: 'AI Sprint + brand identity, website, email, SEO.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  done_for_you: {
    name: 'Done For You',
    desc: 'Full-service ongoing marketing — everything handled.',
    color: 'text-[#c8522a]',
    bg: 'bg-[#c8522a]/8',
    border: 'border-[#c8522a]/20',
  },
}

const UPGRADE_PLANS = [
  {
    id: 'ai_sprint',
    name: 'AI Sprint',
    price: '$3,500',
    period: 'one-time',
    icon: Zap,
    items: ['Workflow audit', 'AI prompt library', '2–3 workflows automated', 'Team training'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$7,500',
    period: 'one-time',
    icon: TrendingUp,
    featured: true,
    items: ['Everything in AI Sprint', 'Brand identity', '5-page website', 'Email setup', 'SEO foundations'],
  },
  {
    id: 'done_for_you',
    name: 'Done For You',
    price: '$5,000',
    period: '/month',
    icon: Layers,
    items: ['Everything in Growth', 'Social media management', 'Photography', 'Video editing', 'Ad management'],
  },
]

interface Invoice {
  id: string
  number: string | null
  amount_paid: number
  status: string | null
  created: number
  invoice_pdf: string | null
  hosted_invoice_url: string | null
}

interface Subscription {
  status: string
  current_period_end: number
  cancel_at_period_end: boolean
}

interface Profile {
  plan?: string | null
  status?: string
  stripe_customer_id?: string | null
}

export default function BillingClient({
  profile,
  invoices,
  subscription,
}: {
  profile: Profile | null
  invoices: Invoice[]
  subscription: Subscription | null
}) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const plan = profile?.plan
  const planConfig = plan ? PLAN_CONFIG[plan as keyof typeof PLAN_CONFIG] : null

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setCheckoutLoading(null)
    }
  }

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100)

  const formatDate = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">Billing</p>
        <h1 className="text-2xl font-bold text-gray-900">Billing & subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan, view invoices, and update payment details.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Current plan</p>
          {profile?.stripe_customer_id && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {portalLoading ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
              Manage in Stripe
            </button>
          )}
        </div>

        {plan && planConfig ? (
          <div className={`flex items-center justify-between p-4 rounded-xl border ${planConfig.bg} ${planConfig.border}`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-base font-bold ${planConfig.color}`}>{planConfig.name}</p>
                <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${planConfig.bg} ${planConfig.color}`}>
                  {profile?.status === 'active' ? 'Active' : profile?.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">{planConfig.desc}</p>
              {subscription?.cancel_at_period_end && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  Cancels on {formatDate(subscription.current_period_end)}
                </p>
              )}
              {subscription && !subscription.cancel_at_period_end && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={11} />
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
            <button
              onClick={openPortal}
              disabled={portalLoading || !profile?.stripe_customer_id}
              className="flex items-center gap-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 px-4 py-2 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-40"
            >
              {portalLoading ? <Loader2 size={13} className="animate-spin" /> : null}
              Manage plan
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">No active plan</p>
              <p className="text-xs text-gray-400">Choose a plan to get started with Agent7even.</p>
            </div>
            <Link
              href="/pricing"
              className="flex items-center gap-2 bg-[#c8522a] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#b04623] transition-colors"
            >
              Choose a plan <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* Invoice history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Invoice history</p>

        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={24} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No invoices yet</p>
            <p className="text-xs text-gray-300 mt-1">Invoices will appear here after your first payment.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map(invoice => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    invoice.status === 'paid' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {invoice.status === 'paid'
                      ? <CheckCircle size={13} className="text-green-500" />
                      : <AlertCircle size={13} className="text-gray-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {invoice.number || `Invoice ${invoice.id.slice(-6)}`}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(invoice.created)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-gray-900">{formatAmount(invoice.amount_paid)}</p>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                    invoice.status === 'paid'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-50 text-gray-400'
                  }`}>
                    {invoice.status}
                  </span>
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade section — show if no plan or on lower tier */}
      {(!plan || plan === 'ai_sprint') && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Upgrade your plan</p>
          <p className="text-sm text-gray-500 mb-6">Get more done with a higher tier.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {UPGRADE_PLANS.filter(p => p.id !== plan).map(upgradePlan => {
              const Icon = upgradePlan.icon
              return (
                <div
                  key={upgradePlan.id}
                  className={`rounded-xl border p-4 ${
                    upgradePlan.featured
                      ? 'border-[#c8522a]/30 bg-[#c8522a]/4'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      upgradePlan.featured ? 'bg-[#c8522a]/10' : 'bg-gray-50'
                    }`}>
                      <Icon size={13} className={upgradePlan.featured ? 'text-[#c8522a]' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{upgradePlan.name}</p>
                      <p className="text-xs text-gray-400">{upgradePlan.price}{upgradePlan.period !== 'one-time' ? upgradePlan.period : ''}</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {upgradePlan.items.map(item => (
                      <li key={item} className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(upgradePlan.id)}
                    disabled={checkoutLoading === upgradePlan.id}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      upgradePlan.featured
                        ? 'bg-[#c8522a] text-white hover:bg-[#b04623]'
                        : 'border border-gray-200 text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    {checkoutLoading === upgradePlan.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : null
                    }
                    Upgrade
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add-ons */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">À la carte add-ons</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Add individual services — photography, SEO, social media, ads, and more — to any plan.
          </p>
        </div>
        <Link
          href="/dashboard/services"
          className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-all whitespace-nowrap flex-shrink-0"
        >
          Browse services <ArrowRight size={11} />
        </Link>
      </div>

    </div>
  )
}
