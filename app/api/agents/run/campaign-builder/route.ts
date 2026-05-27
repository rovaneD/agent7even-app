import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { models } from '@/lib/ai/client'
import { updateTaskStatus, saveAgentOutput } from '@/lib/agents/runner'

function parseCampaignSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const sectionNames = [
    'OVERVIEW', 'WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4',
    'CONTENT CALENDAR', 'EMAIL', 'BUDGET ALLOCATION', 'SUCCESS METRICS',
  ]

  sectionNames.forEach((name, i) => {
    const start = text.indexOf(name + ':')
    if (start === -1) return
    const nextPos = sectionNames
      .slice(i + 1)
      .map(n => text.indexOf(n + ':'))
      .filter(pos => pos > start)
      .sort((a, b) => a - b)[0]

    sections[name] = nextPos
      ? text.slice(start + name.length + 1, nextPos).trim()
      : text.slice(start + name.length + 1).trim()
  })

  return sections
}

export async function POST(req: Request) {
  const { taskId, input } = await req.json()

  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  await updateTaskStatus(taskId, 'running')

  const system = `You are a campaign strategist. Build a complete, specific, actionable 30-day marketing campaign.

Business: ${input.company_name ?? 'unknown'}
Type: ${input.business_type ?? 'unknown'}
Ideal customer: ${input.ideal_customer ?? 'not specified'}
Goals: ${(input.top_goals as string[] | undefined)?.join(', ') ?? 'not specified'}
Budget: ${input.marketing_budget ?? 'not specified'}
Sells via: ${(input.sell_locations as string[] | undefined)?.join(', ') ?? 'not specified'}
Competitors: ${(input.competitors as string[] | undefined)?.join(', ') ?? 'none'}
${input.rejection_feedback ? `\nIMPORTANT — Previous version was rejected with this feedback: "${input.rejection_feedback}". Address this directly.` : ''}

Deliver a structured campaign with these exact sections:
OVERVIEW: One paragraph summary of the strategy and why it fits this business.
WEEK 1: Day-by-day actions. Specific. Actionable. No vague advice.
WEEK 2: Same.
WEEK 3: Same.
WEEK 4: Same.
CONTENT CALENDAR: 12 specific post ideas with suggested captions.
EMAIL: 3-email sequence with subject lines and body copy.
BUDGET ALLOCATION: How to spend their budget this month.
SUCCESS METRICS: What to measure and what good looks like.`

  try {
    const { text } = await generateText({
      model: models.campaignGenerator,
      system,
      messages: [{
        role: 'user',
        content: `Build my 30-day marketing campaign.${input.conversation_summary ? ` Context from our conversation: ${JSON.stringify(input.conversation_summary)}` : ''}`,
      }],
      maxOutputTokens: 3000,
    })

    await saveAgentOutput({
      taskId,
      userId: input.userId as string,
      agent: 'campaign_builder',
      outputType: 'campaign',
      title: `30-Day Campaign — ${input.company_name ?? 'Your Business'}`,
      content: { raw: text, parsed: parseCampaignSections(text) },
    })

    await updateTaskStatus(taskId, 'complete', { outputSaved: true })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Campaign builder error:', err)
    await updateTaskStatus(taskId, 'failed', {}, String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
