import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import BillingClient from './BillingClient'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, status, stripe_customer_id, stripe_subscription_id, email, company_name, full_name')
    .eq('clerk_user_id', userId)
    .single()

  // Fetch invoices from Stripe if customer exists
  let invoices: {
    id: string
    number: string | null
    amount: number
    currency: string
    status: string | null
    created: number
    invoice_pdf: string | null
    hosted_invoice_url: string | null
    description: string | null
  }[] = []

  if (profile?.stripe_customer_id) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: profile.stripe_customer_id,
        limit: 12,
      })
      invoices = stripeInvoices.data.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: inv.created,
        invoice_pdf: inv.invoice_pdf ?? null,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        description: inv.lines.data[0]?.description ?? null,
      }))
    } catch (err) {
      console.error('Failed to fetch invoices:', err)
    }
  }

  return <BillingClient profile={profile} invoices={invoices} />
}
