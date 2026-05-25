import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectName = formData.get('projectName') as string
  const notes = formData.get('notes') as string
  const role = (formData.get('role') as string) ?? 'client'

  if (!file || !projectName) {
    return NextResponse.json({ error: 'File and project name required' }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
  }

  const filePath = `${profile.id}/${projectName.replace(/\s+/g, '_')}/${Date.now()}_${file.name}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: storageError } = await supabase.storage
    .from('deliverables')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError) {
    console.error('Storage upload error:', storageError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const { data: deliverable, error: dbError } = await supabase
    .from('deliverables')
    .insert({
      user_id: profile.id,
      uploaded_by: profile.id,
      project_name: projectName,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      notes: notes || null,
      uploaded_by_role: role,
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
    return NextResponse.json({ error: 'Failed to save file record.' }, { status: 500 })
  }

  return NextResponse.json({ deliverable })
}
