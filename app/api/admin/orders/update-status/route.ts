import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/createNotification'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: admin } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (!admin || !['admin', 'owner'].includes(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { order_id, status } = await req.json()

  const validStatuses = ['submitted', 'in_review', 'in_progress', 'delivered', 'revision_requested', 'approved', 'cancelled']
  if (!order_id || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      ...(status === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
      ...(status === 'approved' ? { approved_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the client on status changes
  const { data: order } = await supabase
    .from('orders')
    .select('user_id, title, profiles(email, full_name)')
    .eq('id', order_id)
    .single() as any

  if (order?.user_id) {
    await createNotification({
      userId: order.user_id,
      title: status === 'delivered' ? 'Your order has been delivered!' : 'Order status updated',
      body: `Your ${order.title} order is now ${status.replace(/_/g, ' ')}.`,
      type: status === 'delivered' ? 'order_delivered' : 'order_status',
      link: '/dashboard/services',
      sendEmail: status === 'delivered',
      emailSubject: `Your ${order.title} has been delivered`,
    })
  }

  if (status === 'delivered') {
    if (order?.profiles?.email) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Agent7even <hello@agent7even.com>',
          to: order.profiles.email,
          subject: `✅ Your ${order.title} has been delivered`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
              <div style="background: #0d0d0d; padding: 24px; border-radius: 12px 12px 0 0;">
                <h2 style="color: #f0ece6; margin: 0; font-size: 18px;">Your delivery is ready</h2>
              </div>
              <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #eee;">
                <p style="font-size: 14px; color: #555; margin: 0 0 16px;">
                  Hi ${order.profiles.full_name?.split(' ')[0] || 'there'}, your <strong>${order.title}</strong> has been delivered and is ready for your review.
                </p>
                <a href="https://app.agent7even.com/dashboard/services" style="display: inline-block; background: #c8522a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                  Review your delivery →
                </a>
              </div>
            </div>
          `,
        })
      } catch (e) {
        console.error('Delivery email failed:', e)
      }
    }
  }

  return NextResponse.json({ success: true })
}
