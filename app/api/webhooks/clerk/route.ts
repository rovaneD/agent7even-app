import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  const supabase = createServiceClient()

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses[0]?.email_address ?? ''
    const full_name = `${first_name ?? ''} ${last_name ?? ''}`.trim()

    const { error } = await supabase.from('profiles').upsert(
      {
        clerk_user_id: id,
        email,
        full_name: full_name || null,
        avatar_url: image_url ?? null,
      },
      { onConflict: 'clerk_user_id' },
    )

    if (error) {
      console.error('profiles upsert error (user.created):', error)
      return new Response('DB error', { status: 500 })
    }
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const email = email_addresses[0]?.email_address ?? ''
    const full_name = `${first_name ?? ''} ${last_name ?? ''}`.trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        email,
        full_name: full_name || null,
        avatar_url: image_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', id)

    if (error) {
      console.error('profiles update error (user.updated):', error)
      return new Response('DB error', { status: 500 })
    }
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    if (id) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('clerk_user_id', id)

      if (error) {
        console.error('profiles delete error (user.deleted):', error)
        return new Response('DB error', { status: 500 })
      }
    }
  }

  return new Response('OK', { status: 200 })
}
