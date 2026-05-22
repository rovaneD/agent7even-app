import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

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

  const { client_id, body } = await req.json()
  if (!client_id || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: note, error } = await supabase
    .from('admin_notes')
    .insert({ user_id: client_id, admin_id: admin.id, body })
    .select('*, profiles!admin_notes_admin_id_fkey(full_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ note })
}
