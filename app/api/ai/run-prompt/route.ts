import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt, promptId, timeSavedMins } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const output = response.content[0].type === 'text' ? response.content[0].text : ''

    // Log usage to Supabase
    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (profile?.id) {
      await supabase.from('ai_tool_usage').insert({
        user_id: profile.id,
        tool: 'prompt_library',
        prompt_id: promptId ?? null,
        output_length: output.length,
        time_saved_mins: timeSavedMins ?? 15,
      })
    }

    return NextResponse.json({ output })
  } catch (err) {
    console.error('AI run error:', err)
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 })
  }
}
