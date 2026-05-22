import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const PRICE_MAP: Record<string, string> = {
  ai_sprint: process.env.STRIPE_AI_SPRINT_PRICE_ID!,
  growth: process.env.STRIPE_GROWTH_PRICE_ID!,
  done_for_you: process.env.STRIPE_DONE_FOR_YOU_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await req.json()
    const priceId = PRICE_MAP[plan]

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get or create Stripe customer
    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name, company_name')
      .eq('clerk_user_id', userId)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        name: profile?.company_name || profile?.full_name || undefined,
        metadata: { clerk_user_id: userId },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('clerk_user_id', userId)
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan === 'done_for_you' ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        clerk_user_id: userId,
        plan,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
