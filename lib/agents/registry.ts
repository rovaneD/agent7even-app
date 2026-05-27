export type AgentId =
  | 'competitor_watcher'
  | 'content_writer'
  | 'campaign_builder'
  | 'analytics_reader'
  | 'trend_spotter'
  | 'email_sequence_builder'
  | 'ad_copy_generator'
  | 'seo_scanner'
  | 'brand_voice_guardian'

export type AgentTrigger = 'user' | 'maya' | 'scheduled' | 'event'

export interface AgentDefinition {
  id: AgentId
  name: string
  description: string
  icon: string
  autonomyLevel: 'autonomous' | 'approval_required'
  defaultSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    dayOfWeek?: number
    hourOfDay?: number
  }
  outputType: string
  model: string
}

export const AGENTS: Record<AgentId, AgentDefinition> = {
  competitor_watcher: {
    id: 'competitor_watcher',
    name: 'Competitor Watcher',
    description: 'Monitors your competitors and surfaces what\'s working for them',
    icon: 'ti-eye',
    autonomyLevel: 'autonomous',
    defaultSchedule: { frequency: 'weekly', dayOfWeek: 1, hourOfDay: 8 },
    outputType: 'competitor_report',
    model: 'google/gemini-2.5-flash',
  },
  content_writer: {
    id: 'content_writer',
    name: 'Content Writer',
    description: 'Writes captions, emails, and ad copy in your brand voice',
    icon: 'ti-pencil',
    autonomyLevel: 'approval_required',
    outputType: 'content',
    model: 'anthropic/claude-haiku-4',
  },
  campaign_builder: {
    id: 'campaign_builder',
    name: 'Campaign Builder',
    description: 'Builds complete 30-day marketing campaigns',
    icon: 'ti-rocket',
    autonomyLevel: 'approval_required',
    outputType: 'campaign',
    model: 'anthropic/claude-sonnet-4',
  },
  analytics_reader: {
    id: 'analytics_reader',
    name: 'Analytics Reader',
    description: 'Reads your GA and Meta data and surfaces actionable insights',
    icon: 'ti-chart-bar',
    autonomyLevel: 'autonomous',
    defaultSchedule: { frequency: 'daily', hourOfDay: 7 },
    outputType: 'analytics_insight',
    model: 'google/gemini-2.5-flash',
  },
  trend_spotter: {
    id: 'trend_spotter',
    name: 'Trend Spotter',
    description: 'Monitors industry trends and viral content in your niche',
    icon: 'ti-trending-up',
    autonomyLevel: 'autonomous',
    defaultSchedule: { frequency: 'daily', hourOfDay: 6 },
    outputType: 'trend_report',
    model: 'google/gemini-2.5-flash',
  },
  email_sequence_builder: {
    id: 'email_sequence_builder',
    name: 'Email Sequence Builder',
    description: 'Builds complete email flows — welcome, nurture, promotional',
    icon: 'ti-mail',
    autonomyLevel: 'approval_required',
    outputType: 'email_sequence',
    model: 'anthropic/claude-sonnet-4',
  },
  ad_copy_generator: {
    id: 'ad_copy_generator',
    name: 'Ad Copy Generator',
    description: 'Creates multiple ad variations optimized for your audience',
    icon: 'ti-speakerphone',
    autonomyLevel: 'approval_required',
    outputType: 'ad_copy',
    model: 'anthropic/claude-haiku-4',
  },
  seo_scanner: {
    id: 'seo_scanner',
    name: 'SEO Scanner',
    description: 'Audits your website and suggests improvements',
    icon: 'ti-search',
    autonomyLevel: 'autonomous',
    defaultSchedule: { frequency: 'weekly', dayOfWeek: 1, hourOfDay: 9 },
    outputType: 'seo_report',
    model: 'anthropic/claude-sonnet-4',
  },
  brand_voice_guardian: {
    id: 'brand_voice_guardian',
    name: 'Brand Voice Guardian',
    description: 'Reviews all content against your brand voice before it goes out',
    icon: 'ti-shield-check',
    autonomyLevel: 'autonomous',
    outputType: 'brand_review',
    model: 'anthropic/claude-haiku-4',
  },
}

export const AUTONOMOUS_AGENTS = Object.values(AGENTS)
  .filter(a => a.autonomyLevel === 'autonomous')
  .map(a => a.id)

export const APPROVAL_REQUIRED_AGENTS = Object.values(AGENTS)
  .filter(a => a.autonomyLevel === 'approval_required')
  .map(a => a.id)
