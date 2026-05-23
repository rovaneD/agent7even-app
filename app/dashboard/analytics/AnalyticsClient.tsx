'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Globe, Hash, Info, Eye, MousePointerClick,
  Lock, Calendar, ArrowUpRight, ArrowDownRight,
  X, CheckCircle, Clock, Wifi, WifiOff, RefreshCw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type Range = '7d' | '30d' | '90d'

type Platform = 'google_analytics' | 'instagram' | 'meta'

interface Props {
  companyName: string
  plan: string
  gaMeasurementId: string | null
  instagramHandle: string | null
  metaAdAccountId: string | null
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

const PLATFORM_CONFIG: Record<Platform, {
  label: string
  fieldLabel: string
  placeholder: string
  hint: string
}> = {
  google_analytics: {
    label: 'Google Analytics',
    fieldLabel: 'GA4 Property ID',
    placeholder: '123456789',
    hint: 'Find this in Google Analytics → Admin → Property Settings → Property ID (the numeric ID at the top, not the G-... tracking code).',
  },
  instagram: {
    label: 'Instagram',
    fieldLabel: 'Instagram handle',
    placeholder: '@yourbrand',
    hint: 'Your Instagram username (with or without @). Must be a Business or Creator account.',
  },
  meta: {
    label: 'Meta Ads',
    fieldLabel: 'Ad Account ID',
    placeholder: 'act_XXXXXXXXXX',
    hint: 'Find this in Meta Business Suite → Ad Accounts. Format is usually act_ followed by digits.',
  },
}

function ConnectModal({
  platform,
  initialValue,
  onClose,
  onSuccess,
}: {
  platform: Platform
  initialValue: string
  onClose: () => void
  onSuccess: (value: string) => void
}) {
  const cfg = PLATFORM_CONFIG[platform]
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!value.trim()) { setError('Please enter a value.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, value: value.trim() }),
      })
      if (!res.ok) throw new Error('Failed')
      onSuccess(value.trim())
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={14} className="text-gray-500" />
        </button>

        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-1">Connect</p>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{cfg.label}</h2>
        <p className="text-sm text-gray-400 mb-5">
          Enter your {cfg.fieldLabel.toLowerCase()} and we'll set up the connection for you.
        </p>

        <label className="block text-xs font-semibold text-gray-700 mb-1.5">{cfg.fieldLabel}</label>
        <input
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder={cfg.placeholder}
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#c8522a] focus:ring-1 focus:ring-[#c8522a] transition-colors"
        />
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{cfg.hint}</p>

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c8522a] rounded-xl hover:bg-[#b8471f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : 'Request connection'}
          </button>
        </div>
      </div>
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
  platform,
  pendingValue,
  onConnect,
}: {
  title: string
  description: string
  tooltip: string
  icon: React.ElementType
  logoSrc?: string
  logoDark?: boolean
  connectLabel: string
  platform: Platform
  pendingValue: string | null
  onConnect: (platform: Platform) => void
}) {
  const isPending = Boolean(pendingValue)

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
        {isPending ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock size={11} />
            Pending
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            <Lock size={11} />
            Not connected
          </span>
        )}
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
          {isPending ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle size={18} className="text-amber-500" />
                <p className="text-sm font-semibold text-gray-800">Connection requested</p>
              </div>
              <p className="text-xs text-gray-400 mb-1">Your Agent7even team will confirm this shortly.</p>
              <p className="text-xs text-gray-300">{pendingValue}</p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 mb-1">{description}</p>
                <p className="text-xs text-gray-400">Connect your account to see live data here.</p>
              </div>
              <button
                onClick={() => onConnect(platform)}
                className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8471f] transition-colors pointer-events-auto"
              >
                {connectLabel}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="h-16 rounded-b-2xl overflow-hidden" />
    </div>
  )
}

// ── Live GA section ───────────────────────────────────────────────────────────

type GaStatus = 'loading' | 'connected' | 'pending' | 'error'

interface GaData {
  chartData: { day: string; sessions: number; users: number }[]
  summary: { sessions: number; users: number; pageviews: number; bounceRate: string }
}

function WebsiteAnalyticsSection({
  propertyId,
  range,
  tooltip,
  onConnect,
  onSessionsLoaded,
}: {
  propertyId: string | null
  range: Range
  tooltip: string
  onConnect: (p: Platform) => void
  onSessionsLoaded: (n: number | null) => void
}) {
  const [status, setStatus] = useState<GaStatus>('loading')
  const [data, setData] = useState<GaData | null>(null)

  const fetchData = useCallback(async () => {
    if (!propertyId) { setStatus('pending'); onSessionsLoaded(null); return }
    setStatus('loading')
    try {
      const res = await fetch(`/api/analytics/ga-data?range=${range}`)
      const json = await res.json()
      if (json.connected) {
        setData(json)
        setStatus('connected')
        onSessionsLoaded(json.summary.sessions)
      } else {
        setStatus('pending')
        onSessionsLoaded(null)
      }
    } catch {
      setStatus('error')
      onSessionsLoaded(null)
    }
  }, [propertyId, range, onSessionsLoaded])

  useEffect(() => { fetchData() }, [fetchData])

  const SA_EMAIL = process.env.NEXT_PUBLIC_GOOGLE_SA_CLIENT_EMAIL ?? 'analytics@agent7even.iam.gserviceaccount.com'

  if (!propertyId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between rounded-t-2xl overflow-visible">
          <div className="flex items-center gap-3">
            <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
            <h3 className="text-sm font-semibold text-gray-700">Website Analytics</h3>
            <InfoTooltip text={tooltip} />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            <Lock size={11} /> Not connected
          </span>
        </div>
        <div className="relative px-6 pt-6 pb-2 select-none pointer-events-none" aria-hidden="true">
          <div className="blur-sm opacity-30">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={websiteData7d} barSize={14}>
                <Bar dataKey="sessions" fill="#c8522a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/60">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-800 mb-1">Connect Google Analytics to track sessions, users, and pageviews.</p>
              <p className="text-xs text-gray-400">Connect your account to see live data here.</p>
            </div>
            <button
              onClick={() => onConnect('google_analytics')}
              className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8471f] transition-colors pointer-events-auto"
            >
              Connect Google Analytics
            </button>
          </div>
        </div>
        <div className="h-16 rounded-b-2xl overflow-hidden" />
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
            <h3 className="text-sm font-semibold text-gray-700">Website Analytics</h3>
            <InfoTooltip text={tooltip} />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <RefreshCw size={11} className="animate-spin" /> Loading…
          </span>
        </div>
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#c8522a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (status === 'connected' && data) {
    const chartData = data.chartData.map(d => ({
      ...d,
      day: d.day.length === 8
        ? `${d.day.slice(4, 6)}/${d.day.slice(6, 8)}`
        : d.day,
    }))
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
            <h3 className="text-sm font-semibold text-gray-700">Website Analytics</h3>
            <InfoTooltip text={tooltip} />
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Wifi size={11} /> Connected
          </span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
          {[
            { label: 'Sessions', value: fmt(data.summary.sessions) },
            { label: 'Users', value: fmt(data.summary.users) },
            { label: 'Pageviews', value: fmt(data.summary.pageviews) },
            { label: 'Bounce rate', value: `${data.summary.bounceRate}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white px-5 py-3">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Live chart */}
        <div className="px-4 pt-5 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f0f0f0' }} />
              <Line type="monotone" dataKey="sessions" stroke="#c8522a" strokeWidth={2} dot={false} name="Sessions" />
              <Line type="monotone" dataKey="users" stroke="#e8a87c" strokeWidth={2} dot={false} name="Users" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-1 px-1">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-0.5 bg-[#c8522a] inline-block rounded" />Sessions</span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-0.5 bg-[#e8a87c] inline-block rounded" />Users</span>
          </div>
        </div>
      </div>
    )
  }

  // Pending — property ID saved but service account not yet granted access
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between rounded-t-2xl overflow-visible">
        <div className="flex items-center gap-3">
          <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
          <h3 className="text-sm font-semibold text-gray-700">Website Analytics</h3>
          <InfoTooltip text={tooltip} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Retry connection"
          >
            <RefreshCw size={11} className="text-gray-400" />
          </button>
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock size={11} /> Pending
          </span>
        </div>
      </div>

      <div className="relative px-6 pt-6 pb-2 select-none pointer-events-none" aria-hidden="true">
        <div className="blur-sm opacity-20">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={websiteData7d} barSize={14}>
              <Bar dataKey="sessions" fill="#c8522a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-6">
          <CheckCircle size={20} className="text-amber-500" />
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800 mb-1">One more step to go live</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              In Google Analytics, go to <strong>Admin → Property Access Management</strong> and add:
            </p>
            <code className="block mt-2 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-mono pointer-events-auto select-text">
              {SA_EMAIL}
            </code>
            <p className="text-xs text-gray-400 mt-2">Set the role to <strong>Viewer</strong>. Data will appear here within a few minutes.</p>
          </div>
          <button
            onClick={() => onConnect('google_analytics')}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 pointer-events-auto"
          >
            Update property ID
          </button>
        </div>
      </div>
      <div className="h-16 rounded-b-2xl overflow-hidden" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsClient({
  companyName,
  gaMeasurementId,
  instagramHandle,
  metaAdAccountId,
}: Props) {
  const [range, setRange] = useState<Range>('7d')
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
  const [liveSessions, setLiveSessions] = useState<number | null>(null)

  const [gaId, setGaId] = useState(gaMeasurementId)
  const [igHandle, setIgHandle] = useState(instagramHandle)
  const [metaId, setMetaId] = useState(metaAdAccountId)

  const handleSuccess = (platform: Platform, value: string) => {
    if (platform === 'google_analytics') setGaId(value)
    if (platform === 'instagram') setIgHandle(value)
    if (platform === 'meta') setMetaId(value)
    setActivePlatform(null)
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {activePlatform && (
        <ConnectModal
          platform={activePlatform}
          initialValue={
            activePlatform === 'google_analytics' ? (gaId ?? '') :
            activePlatform === 'instagram' ? (igHandle ?? '') :
            (metaId ?? '')
          }
          onClose={() => setActivePlatform(null)}
          onSuccess={(value) => handleSuccess(activePlatform, value)}
        />
      )}

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
        <StatCard
          label="Website sessions"
          value={liveSessions !== null ? fmt(liveSessions) : '—'}
          icon={Globe}
          logoSrc="/google_analytics_icon.png"
          locked={liveSessions === null}
        />
        <StatCard label="Instagram followers" value="—" icon={Hash} logoSrc="/instagram-logo.png" locked />
        <StatCard label="Total reach" value="—" icon={Eye} locked />
        <StatCard label="Ad clicks" value="—" icon={MousePointerClick} logoSrc="/MetaLogo.png" locked />
      </div>

      {/* Notice banner — hide when GA is connected */}
      {liveSessions === null && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <Calendar size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">Live analytics are coming.</span>{' '}
            Connect your Google Analytics, Instagram, and Meta Ads accounts below to start seeing real data.
            Your Agent7even team can also help with setup —{' '}
            <a href="/dashboard/support" className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors">reach out via Support</a>.
          </p>
        </div>
      )}

      {/* Website Analytics — live when connected */}
      <WebsiteAnalyticsSection
        propertyId={gaId}
        range={range}
        tooltip="To connect: enter your GA4 Property ID (numeric, found in Google Analytics → Admin → Property Settings). Then add our service account as a Viewer in GA4 → Admin → Property Access Management."
        onConnect={setActivePlatform}
        onSessionsLoaded={setLiveSessions}
      />

      {/* Social Media */}
      <LockedSection
        title="Social Media"
        description="Connect Instagram to track followers, reach, and impressions."
        tooltip="To connect, your Instagram must be a Business or Creator account linked to a Facebook Page. Go to instagram.com → Settings → Account → Switch to Professional Account. Then share access with your Agent7even team via Meta Business Suite."
        icon={Hash}
        logoSrc="/instagram-logo.png"
        connectLabel="Connect Instagram"
        platform="instagram"
        pendingValue={igHandle}
        onConnect={setActivePlatform}
      />

      {/* Paid Ads */}
      <LockedSection
        title="Paid Ads"
        description="Connect Meta Ads to track spend, clicks, and conversions."
        tooltip="To connect, go to Meta Business Suite → Settings → People, and add your Agent7even team as a Partner with Advertiser access to your Ad Account. This lets us pull spend, clicks, and conversion data into your dashboard."
        icon={MousePointerClick}
        logoSrc="/MetaLogo.png"
        connectLabel="Connect Meta Ads"
        platform="meta"
        pendingValue={metaId}
        onConnect={setActivePlatform}
      />

    </div>
  )
}
