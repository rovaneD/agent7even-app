import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BrandKitClient from './BrandKitClient'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export default async function BrandKitPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, plan, stripe_subscription_id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) redirect('/dashboard')

  // Check if on trial
  let onTrial = false
  if (profile.plan === 'starter' && profile.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      onTrial = subscription.status === 'trialing'
    } catch {
      // If check fails, assume not on trial
    }
  }

  // Brand Kit locked during trial
  if (onTrial) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Lock size={24} className="text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Brand Kit not available on trial</h1>
        <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto mb-8">
          The Brand Kit is available on all paid plans. Upgrade your Starter plan to unlock
          your Brand Voice Statement, Brand Story, Ideal Client Profile, and Positioning Statement.
        </p>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#b8471f] transition-colors"
        >
          Upgrade to unlock Brand Kit
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Your 3-day trial gives you access to the dashboard, analytics, and 5 AI Toolkit runs.
        </p>
      </div>
    )
  }

  const { data: answers } = await supabase
    .from('brand_answers')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  const { data: documents } = await supabase
    .from('brand_documents')
    .select('*')
    .eq('user_id', profile.id)
    .order('type')

  return (
    <BrandKitClient
      profileId={profile.id}
      companyName={profile.company_name ?? ''}
      savedAnswers={answers?.answers ?? null}
      answersComplete={answers?.completed ?? false}
      documents={documents ?? []}
    />
  )
}
