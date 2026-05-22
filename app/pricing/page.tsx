'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

const PLANS = [
  {
    id: 'ai_sprint',
    name: 'AI Sprint',
    badge: 'Starter',
    price: '$3,500',
    period: 'one-time',
    description: 'Get your core AI systems set up and running in two weeks.',
    featured: false,
    items: [
      'Workflow audit & bottleneck mapping',
      'Custom AI prompt library',
      '2–3 core workflows built & tested',
      '60-min team training session',
      '1-week post-launch check-in',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    badge: 'Most popular',
    price: '$7,500',
    period: 'one-time',
    description: 'AI sprint plus the highest-leverage creative services for growing businesses.',
    featured: true,
    items: [
      'Everything in AI Sprint',
      'Brand identity & logo design',
      '5-page website built & launched',
      'Email marketing setup & templates',
      'SEO foundations configured',
      '30-day post-launch support',
    ],
  },
  {
    id: 'done_for_you',
    name: 'Done For You',
    badge: 'Full stack',
    price: '$5,000',
    period: '/month',
    description: 'We handle everything — brand, content, and ads — on an ongoing basis.',
    featured: false,
    items: [
      'Everything in Growth',
      'Social media management',
      'Monthly product photography',
      'Reels & video editing',
      'Ad management (Meta & Google)',
      'Weekly performance reports',
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (planId: string) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Nav */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-sm tracking-wide text-gray-900">
          AGENT<span className="text-[#c8522a]">7</span>EVEN
        </span>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to dashboard
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#c8522a] mb-3">
            Pricing
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Choose your plan
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Start with what you need. Scale as you grow.
            All plans include access to the Agent7even dashboard.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-4 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl overflow-hidden border transition-all ${
                plan.featured
                  ? 'border-[#c8522a] border-[1.5px] shadow-lg shadow-[#c8522a]/10'
                  : 'border-gray-100 bg-white'
              }`}
            >
              {/* Head */}
              <div className={`px-6 pt-6 pb-5 border-b ${
                plan.featured
                  ? 'bg-[#0d0d0d] border-[#1a1a1a]'
                  : 'bg-white border-gray-100'
              }`}>
                <span className={`text-[10px] font-semibold tracking-widest uppercase block mb-2 ${
                  plan.featured ? 'text-[#c8522a]' : 'text-[#c8522a]'
                }`}>
                  {plan.badge}
                </span>
                <div className={`text-xl font-bold mb-1.5 ${
                  plan.featured ? 'text-white' : 'text-gray-900'
                }`}>
                  {plan.name}
                </div>
                <div className={`text-xs leading-relaxed font-light mb-4 ${
                  plan.featured ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {plan.description}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-bold ${
                    plan.featured ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.price}
                  </span>
                  <span className={`text-xs ${
                    plan.featured ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-6 py-5">
                <ul className="space-y-2.5 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500">
                      <Check size={14} className="text-[#c8522a] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.featured
                      ? 'bg-[#c8522a] text-white hover:bg-[#b04623]'
                      : 'border border-gray-200 text-gray-800 hover:border-gray-400'
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? (
                    <><Loader2 size={14} className="animate-spin" /> Processing...</>
                  ) : (
                    'Get started'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Secure payment via Stripe · Cancel anytime (Done For You) · Questions?{' '}
          <a href="mailto:hello@agent7even.com" className="text-[#c8522a] hover:underline">
            hello@agent7even.com
          </a>
        </p>

      </main>
    </div>
  )
}
