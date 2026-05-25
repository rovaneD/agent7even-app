import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    promptId,
    prompt,
    timeSavedMins,
    useBrandVoice = false,
  } = await req.json()

  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('clerk_user_id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Enforce Starter plan run limit (dynamic from platform_settings)
  if (!profile.plan || profile.plan === 'starter') {
    const { data: limitSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'starter_ai_limit')
      .single()
    const STARTER_LIMIT = (limitSetting?.value as number) ?? 15

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('ai_tool_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= STARTER_LIMIT) {
      return NextResponse.json(
        { error: 'Monthly limit reached. Upgrade to Growth for unlimited runs.' },
        { status: 429 }
      )
    }
  }

  // Build system prompt
  let systemPrompt = `You are an expert marketing copywriter. Write compelling, professional marketing content based on the user's request. Be specific, actionable, and ready to use.`

  // Inject brand context if toggle is on
  if (useBrandVoice) {
    const { data: brandDocs } = await supabase
      .from('brand_documents')
      .select('type, content')
      .eq('user_id', profile.id)
      .in('type', ['voice', 'positioning', 'persona'])

    if (brandDocs && brandDocs.length > 0) {
      const voiceDoc = brandDocs.find(d => d.type === 'voice')
      const positioningDoc = brandDocs.find(d => d.type === 'positioning')
      const personaDoc = brandDocs.find(d => d.type === 'persona')

      systemPrompt = `You are an expert marketing copywriter writing exclusively for this specific brand. Study the brand documents below carefully and write all content in this brand's voice, tone, and style. Never deviate from their personality, positioning, or audience.

${voiceDoc ? `## BRAND VOICE & TONE\n${voiceDoc.content}\n` : ''}
${positioningDoc ? `## BRAND POSITIONING\n${positioningDoc.content}\n` : ''}
${personaDoc ? `## IDEAL CLIENT PROFILE\n${personaDoc.content}\n` : ''}

## YOUR INSTRUCTIONS
- Always write in this brand's established voice and tone
- Keep the ideal client profile in mind for every word you write  
- Reflect the brand's positioning and what makes them unique
- Never use generic marketing language that could apply to any business
- Make every output feel distinctly like this brand

Now complete the following task:`
    }
  }

  // Run Claude
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  const output = message.content[0].type === 'text' ? message.content[0].text : ''

  // Log usage
  await supabase.from('ai_tool_usage').insert({
    user_id: profile.id,
    tool: 'prompt_library',
    prompt_id: promptId ?? null,
    output_length: output.length,
    time_saved_mins: timeSavedMins ?? 0,
  })

  return NextResponse.json({ output })
}
