import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('clerk_user_id', userId)
    .single()

  if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const projectName = formData.get('projectName') as string
  const notes = formData.get('notes') as string
  const clientId = formData.get('clientId') as string

  if (!file || !projectName || !clientId) {
    return NextResponse.json({ error: 'File, project name, and client ID required' }, { status: 400 })
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
  }

  const filePath = `${clientId}/${projectName.replace(/\s+/g, '_')}/${Date.now()}_${file.name}`

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
      user_id: clientId,
      uploaded_by: adminProfile.id,
      project_name: projectName,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      notes: notes || null,
      uploaded_by_role: 'admin',
    })
    .select()
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
    return NextResponse.json({ error: 'Failed to save file record.' }, { status: 500 })
  }

  return NextResponse.json({ deliverable })
}
