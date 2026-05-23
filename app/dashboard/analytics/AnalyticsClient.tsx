'use client'

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Globe, Hash, TrendingUp, Info, Users, Eye, MousePointerClick,
  Lock, ExternalLink, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d'

interface Props {
  companyName: string
  plan: string
}

// ── Dummy data ────────────────────────────────────────────────────────────────

const websiteData7d = [
  { day: 'Mon', sessions: 142, users: 118 },
  { day: 'Tue', sessions: 189, users: 154 },
  { day: 'Wed', sessions: 201, users: 167 },
  { day: 'Thu', sessions: 176, users: 143 },
  { day: 'Fri', sessions: 224, users: 191 },
  { day: 'Sat', sessions: 98, users: 82 },
  { day: 'Sun', sessions: 87, users: 71 },
]

const websiteData30d = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  sessions: Math.floor(120 + Math.random() * 120),
  users: Math.floor(90 + Math.random() * 100),
}))

const websiteData90d = Array.from({ length: 90 }, (_, i) => ({
  day: `${i + 1}`,
  sessions: Math.floor(100 + Math.random() * 150),
  users: Math.floor(80 + Math.random() * 120),
}))

const socialData7d = [
  { day: 'Mon', reach: 1240, impressions: 1820 },
  { day: 'Tue', reach: 1580, impressions: 2340 },
  { day: 'Wed', reach: 980, impressions: 1450 },
  { day: 'Thu', reach: 2100, impressions: 3120 },
  { day: 'Fri', reach: 1760, impressions: 2680 },
  { day: 'Sat', reach: 2340, impressions: 3510 },
  { day: 'Sun', reach: 1920, impressions: 2840 },
]

const adsData7d = [
  { day: 'Mon', spend: 48, clicks: 312, conversions: 14 },
  { day: 'Tue', spend: 52, clicks: 378, conversions: 18 },
  { day: 'Wed', spend: 61, clicks: 421, conversions: 22 },
  { day: 'Thu', spend: 44, clicks: 289, conversions: 11 },
  { day: 'Fri', spend: 58, clicks: 402, conversions: 19 },
  { day: 'Sat', spend: 31, clicks: 198, conversions: 8 },
  { day: 'Sun', spend: 27, clicks: 171, conversions: 6 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

function BrandIcon({
  src,
  alt,
  dark,
}: {
  src: string
  alt: string
  dark?: boolean
}) {
  return (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${
        dark ? 'bg-[#0a0a0a]' : 'bg-gray-50'
      }`}
    >
      <img src={src} alt={alt} className="w-5 h-5 object-contain" />
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  logoSrc,
  logoDark,
  locked,
}: {
  label: string
  value: string
  delta?: number
  icon: React.ElementType
  logoSrc?: string
  logoDark?: boolean
  locked?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        {logoSrc ? (
          <BrandIcon src={logoSrc} alt={label} dark={logoDark} />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
            <Icon size={15} className="text-gray-400" />
          </div>
        )}
      </div>
      {locked ? (
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-gray-300" />
          <span className="text-sm text-gray-300">Not connected</span>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold text-gray-900">{value}</span>
          {delta !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                delta >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors flex-shrink-0"
        aria-label="More info"
      >
        <Info size={11} />
      </button>
      {show && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 bg-gray-900 text-white text-xs leading-relaxed rounded-xl px-3 py-2.5 shadow-xl pointer-events-none">
          <div className="absolute left-2 bottom-full w-2 h-2 bg-gray-900 rotate-45 mb-[-4px]" />
          {text}
        </div>
      )}
    </div>
  )
}

function LockedSection({
  title,
  description,
  tooltip,
  icon: Icon,
  logoSrc,
  logoDark,
  connectLabel,
  connectHref,
}: {
  title: string
  description: string
  tooltip: string
  icon: React.ElementType
  logoSrc?: string
  logoDark?: boolean
  connectLabel: string
  connectHref: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between rounded-t-2xl overflow-visible">
        <div className="flex items-center gap-3">
          {logoSrc ? (
            <BrandIcon src={logoSrc} alt={title} dark={logoDark} />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Icon size={16} className="text-gray-400" />
            </div>
          )}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <InfoTooltip text={tooltip} />
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
          <Lock size={11} />
          Not connected
        </span>
      </div>

      {/* Blurred dummy chart */}
      <div className="relative px-6 pt-6 pb-2 select-none pointer-events-none" aria-hidden="true">
        <div className="blur-sm opacity-30">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={websiteData7d} barSize={14}>
              <Bar dataKey="sessions" fill="#c8522a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/60">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 mb-1">{description}</p>
            <p className="text-xs text-gray-400">Connect your account to see live data here.</p>
          </div>
          <a
            href={connectHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8471f] transition-colors pointer-events-auto"
          >
            {connectLabel}
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      <div className="h-16 rounded-b-2xl overflow-hidden" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsClient({ companyName }: Props) {
  const [range, setRange] = useState<Range>('7d')

  const websiteData =
    range === '7d' ? websiteData7d : range === '30d' ? websiteData30d : websiteData90d

  const rangeLabel: Record<Range, string> = {
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {companyName ? `${companyName} — ` : ''}Performance overview
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                range === r
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === '7d' ? '7D' : r === '30d' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Website sessions" value="—" icon={Globe} logoSrc="/_google_analytics_icon.png" locked />
        <StatCard label="Instagram followers" value="—" icon={Hash} logoSrc="/instagram-logo.png" locked />
        <StatCard label="Total reach" value="—" icon={Eye} locked />
        <StatCard label="Ad clicks" value="—" icon={MousePointerClick} logoSrc="/MetaLogo.png" logoDark locked />
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <Calendar size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">          Live analytics are coming.</span>{' '}
          Connect your Google Analytics, Instagram, and Meta Ads accounts below to start seeing real data.
          Your Agent7even team can also help with setup —{' '}
          <a href="/dashboard/support" className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors">reach out via Support</a>.
        </p>
      </div>

      {/* Website Analytics */}
      <LockedSection
        title="Website Analytics"
        description="Connect Google Analytics to track sessions, users, and pageviews."
        tooltip="To connect, go to analytics.google.com, create a property for your website, then share View access with your Agent7even team or paste your Measurement ID into your site settings. We'll wire it up for you."
        icon={Globe}
        logoSrc="/_google_analytics_icon.png"
        connectLabel="Connect Google Analytics"
        connectHref="https://analytics.google.com"
      />

      {/* Social Media */}
      <LockedSection
        title="Social Media"
        description="Connect Instagram to track followers, reach, and impressions."
        tooltip="To connect, your Instagram must be a Business or Creator account linked to a Facebook Page. Go to instagram.com → Settings → Account → Switch to Professional Account. Then share access with your Agent7even team via Meta Business Suite."
        icon={Hash}
        logoSrc="/instagram-logo.png"
        connectLabel="Connect Instagram"
        connectHref="https://www.instagram.com/accounts/convert_to_business/"
      />

      {/* Paid Ads */}
      <LockedSection
        title="Paid Ads"
        description="Connect Meta Ads to track spend, clicks, and conversions."
        tooltip="To connect, go to Meta Business Suite → Settings → People, and add your Agent7even team as a Partner with Advertiser access to your Ad Account. This lets us pull spend, clicks, and conversion data into your dashboard."
        icon={MousePointerClick}
        logoSrc="/MetaLogo.png"
        logoDark
        connectLabel="Connect Meta Ads"
        connectHref="https://business.facebook.com/settings"
      />

    </div>
  )
}
