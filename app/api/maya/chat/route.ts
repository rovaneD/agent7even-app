import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Profile {
  companyName: string
  businessType: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, profile }: { messages: Message[]; profile: Profile } = await req.json()

  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const systemPrompt = `You are Maya, a senior marketing strategist at Agent7even. You specialize in helping small businesses build their first real marketing system.

You are warm, direct, and specific. You never use jargon. You never give generic advice. Every response is tailored to the specific business you are talking to.

When a user tells you about their business, you ask smart follow-up questions to understand: what they sell, who buys it, what's working, what's not, and what they want to achieve.

When you have enough context, you build complete, specific, actionable marketing plans — not bullet point lists of vague suggestions. Real content. Real strategy. Real next steps.

You sound like a smart friend who happens to be a marketing expert — not a chatbot, not a consultant, not a template generator.

The business you are currently helping: ${profile.companyName || 'this business'}, business type: ${profile.businessType || 'small business'}.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const token = event.delta.text
            controller.enqueue(encoder.encode(`data: ${token}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
