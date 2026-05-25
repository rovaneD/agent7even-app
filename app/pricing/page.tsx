'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, TrendingUp, Star, Gift } from 'lucide-react'

const plans = [
  {
    key: 'starter',
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 49,
    annualPrice: 490,
    description: 'Everything you need to get started with smart marketing automation.',
    trial: true,
    trialDays: 3,
    features: [
      'Full client dashboard & portal',
      'AI Toolkit — 15 runs/month',
      'Analytics & reporting',
      'Deliverables hub',
      '1 active service request',
      'Email support',
      'Add-on services available',
    ],
    cta: 'Start free trial',
    popular: false,
  },
  {
    key: 'growth',
    name: 'Growth',
    icon: TrendingUp,
    monthlyPrice: 89,
    annualPrice: 890,
    description: 'Unlimited AI, more active projects, and priority support for growing businesses.',
    trial: false,
    trialDays: 0,
    features: [
      'Everything in Starter',
      'AI Toolkit — unlimited runs',
      'Brand Kit — full access',
      '3 active service requests',
      'Priority email support',
      '10% discount on add-on services',
      'Advanced analytics',
      'Early access to new features',
    ],
    cta: 'Get started',
    popular: true,
  },
  {
    key: 'proagent',
    name: 'ProAgent',
    icon: Star,
    monthlyPrice: 149,
    annualPrice: 1490,
    description: 'Unlimited everything, dedicated support, and maximum add-on savings.',
    trial: false,
    trialDays: 0,
    features: [
      'Everything in Growth',
      'Unlimited active service requests',
      'Dedicated account support',
      '15% discount on add-on services',
      'Quarterly strategy review',
      'White-glove onboarding',
      'First access to beta features',
    ],
    cta: 'Get started',
    popular: false,
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(planKey: string) {
    setLoading(planKey)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, annual }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f5f4f0]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <a href="/" className="text-sm font-semibold tracking-widest uppercase text-[#c8522a]">
          Agent7even
        </a>
        <div className="flex items-center gap-6">
          <a href="/sign-in" className="text-sm text-white/40 hover:text-white/70 transition-colors">
            Sign in
          </a>
          <a href="/sign-up" className="text-sm font-medium bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg transition-colors">
            Sign up
          </a>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-[#c8522a] mb-4">Pricing</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
          One platform for your marketing dashboard, AI tools, and managed services.
          No contracts. Cancel anytime.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`text-sm font-medium px-5 py-2 rounded-lg transition-all ${
              !annual ? 'bg-white text-[#0d0d0d]' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`text-sm font-medium px-5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              annual ? 'bg-white text-[#0d0d0d]' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Annual
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
              annual ? 'bg-[#c8522a] text-white' : 'bg-white/10 text-white/50'
            }`}>
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = annual
              ? Math.round(plan.annualPrice / 12)
              : plan.monthlyPrice
            const isLoading = loading === plan.key

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border flex flex-col ${
                  plan.popular
                    ? 'bg-[#c8522a] border-[#c8522a]'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                } transition-all`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#f5f4f0] text-[#0d0d0d] text-xs font-bold px-4 py-1.5 rounded-full tracking-wide uppercase">
                      Most popular
                    </span>
                  </div>
                )}

                {/* Trial badge */}
                {plan.trial && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      <Gift size={11} />
                      {plan.trialDays}-day free trial
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-white/20' : 'bg-white/5'
                    }`}>
                      <Icon size={17} className={plan.popular ? 'text-white' : 'text-white/60'} />
                    </div>
                    <h3 className={`text-lg font-semibold ${plan.popular ? 'text-white' : 'text-[#f5f4f0]'}`}>
                      {plan.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="mb-2">
                    <div className="flex items-end gap-1.5">
                      <span className={`text-4xl font-semibold tracking-tight ${
                        plan.popular ? 'text-white' : 'text-[#f5f4f0]'
                      }`}>
                        ${price}
                      </span>
                      <span className={`text-sm mb-1.5 ${plan.popular ? 'text-white/60' : 'text-white/30'}`}>
                        /mo
                      </span>
                    </div>
                    {annual && (
                      <p className={`text-xs mt-1 ${plan.popular ? 'text-white/70' : 'text-white/30'}`}>
                        ${plan.annualPrice} billed annually
                      </p>
                    )}
                    {plan.trial && (
                      <p className="text-xs mt-1 text-emerald-400 font-medium">
                        {plan.trialDays} days free — cancel anytime before being charged
                      </p>
                    )}
                    {!plan.trial && (
                      <p className={`text-xs mt-1 ${plan.popular ? 'text-white/50' : 'text-white/25'}`}>
                        Billed immediately — cancel anytime
                      </p>
                    )}
                  </div>

                  <p className={`text-sm mb-8 leading-relaxed ${
                    plan.popular ? 'text-white/70' : 'text-white/40'
                  }`}>
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular ? 'bg-white/20' : 'bg-white/10'
                        }`}>
                          <Check size={10} className={plan.popular ? 'text-white' : 'text-white/60'} />
                        </div>
                        <span className={`text-sm leading-snug ${
                          plan.popular ? 'text-white/80' : 'text-white/50'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(plan.key)}
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      plan.popular
                        ? 'bg-white text-[#c8522a] hover:bg-[#f5f4f0]'
                        : plan.trial
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-white/10 text-[#f5f4f0] hover:bg-white/15 border border-white/10'
                    }`}
                  >
                    {isLoading ? 'Redirecting...' : plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer notes */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-sm text-white/20">
            Starter includes a 3-day free trial — card required, no charge until day 4.
            Growth and ProAgent are charged immediately.
          </p>
          <p className="text-sm text-white/20">
            Questions?{' '}
            <a href="mailto:hello@agent7even.com" className="text-white/40 hover:text-white/60 underline underline-offset-2">
              hello@agent7even.com
            </a>
          </p>
        </div>

        {/* Comparison table */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-semibold text-[#f5f4f0] tracking-tight mb-2">
            Compare plans
          </h2>
          <p className="text-center text-sm text-white/30 mb-10">
            Everything included in each tier, side by side.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-6 py-4 text-white/30 font-medium w-1/2">Feature</th>
                  <th className="text-center px-6 py-4 text-[#f5f4f0] font-semibold">Starter</th>
                  <th className="text-center px-6 py-4 text-[#c8522a] font-semibold bg-[#c8522a]/5">Growth</th>
                  <th className="text-center px-6 py-4 text-[#f5f4f0] font-semibold">ProAgent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Dashboard & client portal", starter: true, growth: true, proagent: true },
                  { feature: "AI Toolkit", starter: "15 runs/mo", growth: "Unlimited", proagent: "Unlimited" },
                  { feature: "Brand Kit", starter: false, growth: true, proagent: true },
                  { feature: "Analytics", starter: "Basic", growth: "Full", proagent: "Full" },
                  { feature: "Deliverables hub", starter: true, growth: true, proagent: true },
                  { feature: "Active service requests", starter: "1", growth: "3", proagent: "Unlimited" },
                  { feature: "Add-on discount", starter: "—", growth: "10% off", proagent: "15% off" },
                  { feature: "Support", starter: "Email", growth: "Priority email", proagent: "Dedicated" },
                  { feature: "Quarterly strategy review", starter: false, growth: false, proagent: true },
                  { feature: "White-glove onboarding", starter: false, growth: false, proagent: true },
                  { feature: "3-day free trial", starter: true, growth: false, proagent: false },
                  { feature: "Annual billing option", starter: true, growth: true, proagent: true },
                ].map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <td className="px-6 py-4 text-white/50">{row.feature}</td>
                    <td className="px-6 py-4 text-center"><Cell value={row.starter} /></td>
                    <td className="px-6 py-4 text-center bg-[#c8522a]/5"><Cell value={row.growth} highlight /></td>
                    <td className="px-6 py-4 text-center"><Cell value={row.proagent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-4">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-sm text-white/30">
            <span className="font-semibold tracking-widest uppercase text-[#c8522a] text-xs">Agent7even</span>
            <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="mailto:hello@agent7even.com" className="hover:text-white/60 transition-colors">hello@agent7even.com</a>
          </div>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Agent7even. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function Cell({ value, highlight = false }: { value: boolean | string; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${highlight ? "bg-[#c8522a]/20" : "bg-white/10"}`}>
        <Check size={11} className={highlight ? "text-[#c8522a]" : "text-white/50"} />
      </span>
    )
  }
  if (value === false) return <span className="text-white/15">—</span>
  return <span className={`font-medium ${highlight ? "text-[#c8522a]" : "text-white/60"}`}>{value}</span>
}
