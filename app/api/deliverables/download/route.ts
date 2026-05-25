import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filePath } = await req.json()
  if (!filePath) return NextResponse.json({ error: 'File path required' }, { status: 400 })

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Check ownership — file path starts with profile.id, or user is admin/owner
  const isAdmin = profile.role === 'admin' || profile.role === 'owner'
  const ownsFile = filePath.startsWith(profile.id)

  if (!ownsFile && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { data, error } = await supabase.storage
    .from('deliverables')
    .createSignedUrl(filePath, 60)

  if (error || !data?.signedUrl) {
    console.error('Signed URL error:', error)
    return NextResponse.json({ error: 'Failed to generate download link.' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
