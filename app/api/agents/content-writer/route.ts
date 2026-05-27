import { runAgent } from '@/lib/ai/runAgent'

export async function POST(req: Request) {
  const { prompt, brandVoice, contentType } = await req.json()

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), { status: 400 })
  }

  const system = `You are a content writer specializing in short-form marketing copy for small businesses.
You write in the brand's voice — never generic. Always specific, always punchy.
Content type: ${contentType || 'general'}
Brand voice: ${brandVoice || 'Not yet defined — write in a warm, direct tone.'}`

  return runAgent({
    agent: 'contentWriter',
    system,
    messages: [{ role: 'user', content: prompt }],
    maxOutputTokens: 500,
  })
}
