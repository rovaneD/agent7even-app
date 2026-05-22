import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import BillingClient from './BillingClient'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  let invoices: {
    id: string
    number: string | null
    amount_paid: number
    status: string | null
    created: number
    invoice_pdf: string | null
    hosted_invoice_url: string | null
  }[] = []
  let subscription: {
    status: string
    current_period_end: number
    cancel_at_period_end: boolean
  } | null = null

  if (profile?.stripe_customer_id) {
    try {
      const invoiceList = await stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: 10,
      })
      invoices = invoiceList.data.map(inv => ({
        id: inv.id,
        number: inv.number ?? null,
        amount_paid: inv.amount_paid,
        status: inv.status ?? null,
        created: inv.created,
        invoice_pdf: inv.invoice_pdf ?? null,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
      }))

      if (profile.stripe_subscription_id) {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
        subscription = {
          status: sub.status,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          current_period_end: (sub as any).current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
        }
      }
    } catch (err) {
      console.error('Stripe fetch error:', err)
    }
  }

  return (
    <BillingClient
      profile={profile}
      invoices={invoices}
      subscription={subscription}
    />
  )
}
