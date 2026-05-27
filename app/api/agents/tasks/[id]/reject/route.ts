import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: taskId } = await params
  const { outputId, note = '' } = await req.json()

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const now = new Date().toISOString()

  // Reject the output
  const { error: outputErr } = await supabase
    .from('agent_outputs')
    .update({ status: 'rejected' })
    .eq('id', outputId)
    .eq('user_id', profile.id)

  if (outputErr) return NextResponse.json({ error: outputErr.message }, { status: 500 })

  // Get the original task to re-queue it
  const { data: task } = await supabase
    .from('agent_tasks')
    .update({ rejected_at: now, rejection_note: note })
    .eq('id', taskId)
    .eq('user_id', profile.id)
    .select()
    .single()

  // Re-queue with rejection note as additional context
  if (task && note) {
    const { createTask } = await import('@/lib/agents/runner')
    await createTask({
      userId: profile.id,
      agent: task.agent,
      input: { ...(task.input as Record<string, unknown>), rejection_feedback: note },
      triggerType: 'user',
      priority: task.priority,
    })
  }

  return NextResponse.json({ success: true })
}
