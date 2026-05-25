import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { deliverableId } = await req.json()
  if (!deliverableId) return NextResponse.json({ error: 'Deliverable ID required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('*')
    .eq('id', deliverableId)
    .single()

  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = profile.role === 'admin' || profile.role === 'owner'
  const ownsFile = deliverable.user_id === profile.id || deliverable.uploaded_by === profile.id

  if (!ownsFile && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { error: storageError } = await supabase.storage
    .from('deliverables')
    .remove([deliverable.file_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  await supabase.from('deliverables').delete().eq('id', deliverableId)

  return NextResponse.json({ success: true })
}
