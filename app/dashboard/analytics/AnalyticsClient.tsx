'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Globe, Hash, Info, Eye, MousePointerClick,
  Lock, Calendar, ArrowUpRight, ArrowDownRight,
  X, CheckCircle, Clock, Wifi, RefreshCw,
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
  gaOAuthConnected: boolean
  gaOAuthEmail: string | null
}

// ── Dummy chart data ──────────────────────────────────────────────────────────

const websiteData7d = [
  { day: 'Mon', sessions: 142, users: 118 },
  { day: 'Tue', sessions: 189, users: 154 },
  { day: 'Wed', sessions: 201, users: 167 },
  { day: 'Thu', sessions: 176, users: 143 },
  { day: 'Fri', sessions: 224, users: 191 },
  { day: 'Sat', sessions: 98, users: 82 },
  { day: 'Sun', sessions: 87, users: 71 },
]

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

function BrandIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
      <img src={src} alt={alt} className="w-5 h-5 object-contain" />
    </div>
  )
}

function StatCard({
  label, value, delta, icon: Icon, logoSrc, locked,
}: {
  label: string; value: string; delta?: number; icon: React.ElementType; logoSrc?: string; locked?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        {logoSrc ? (
          <BrandIcon src={logoSrc} alt={label} />
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
            <span className={`flex items-center gap-0.5 text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
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

// ── GA Connect Modal (two-path) ───────────────────────────────────────────────

function GAConnectModal({
  onClose,
  onAgencySuccess,
  currentPropertyId,
}: {
  onClose: () => void
  onAgencySuccess: (value: string) => void
  currentPropertyId: string
}) {
  const [showAgencyForm, setShowAgencyForm] = useState(false)
  const [value, setValue] = useState(currentPropertyId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitAgency = async () => {
    if (!value.trim()) { setError('Please enter a Property ID.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'google_analytics', value: value.trim() }),
      })
      if (!res.ok) throw new Error('Failed')
      onAgencySuccess(value.trim())
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

        <div className="flex items-center gap-3 mb-5">
          <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a]">Connect</p>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Google Analytics</h2>
          </div>
        </div>

        {!showAgencyForm ? (
          <>
            {/* OAuth path */}
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Sign in with Google to automatically connect your GA4 property and see live data.
            </p>

            <a
              href="/api/analytics/ga-connect"
              className="flex items-center justify-center gap-3 w-full py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-sm font-semibold text-gray-700 mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={() => setShowAgencyForm(true)}
              className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Set up with Agent7even's help →
            </button>
          </>
        ) : (
          <>
            {/* Agency path */}
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Enter your GA4 Property ID and our team will complete the connection for you.
            </p>

            <label className="block text-xs font-semibold text-gray-700 mb-1.5">GA4 Property ID</label>
            <input
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="123456789"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#c8522a] focus:ring-1 focus:ring-[#c8522a] transition-colors"
            />
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Find this in Google Analytics → Admin → Property Settings → Property ID (the numeric ID, not the G-... code).
            </p>

            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowAgencyForm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={submitAgency}
                disabled={loading}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c8522a] rounded-xl hover:bg-[#b8471f] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving…' : 'Request connection'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Property Selector Modal (after OAuth) ─────────────────────────────────────

interface GAProperty { id: string; name: string; account?: string }

function PropertySelectorModal({
  oauthEmail,
  onClose,
  onSelect,
}: {
  oauthEmail: string | null
  onClose: () => void
  onSelect: (propertyId: string) => void
}) {
  const [properties, setProperties] = useState<GAProperty[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/analytics/ga-properties')
      .then(r => r.json())
      .then(d => {
        setProperties(d.properties ?? [])
        if (d.properties?.length === 1) setSelected(d.properties[0].id)
      })
      .catch(() => setError('Could not load properties. Try refreshing.'))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!selected) { setError('Please select a property.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/analytics/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'google_analytics', value: selected }),
      })
      if (!res.ok) throw new Error('Failed')
      onSelect(selected)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
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

        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={18} className="text-emerald-500" />
          <p className="text-[10px] font-semibold tracking-widest uppercase text-emerald-600">Google Connected</p>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Select your property</h2>
        {oauthEmail && (
          <p className="text-xs text-gray-400 mb-5">Signed in as <span className="font-medium text-gray-600">{oauthEmail}</span></p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-6 h-6 border-2 border-[#c8522a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 font-medium mb-2">No GA4 properties found</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              The Google account you signed in with doesn't have access to any GA4 properties.
            </p>
            <a
              href="/api/analytics/ga-connect"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#c8522a] px-4 py-2.5 rounded-lg hover:bg-[#b8471f] transition-colors"
            >
              Try a different Google account
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  selected === p.id
                    ? 'border-[#c8522a] bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.account ? `${p.account} · ` : ''}ID: {p.id}</p>
                </div>
                {selected === p.id && (
                  <CheckCircle size={16} className="text-[#c8522a] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

        {properties.length > 0 && (
          <button
            onClick={save}
            disabled={saving || !selected}
            className="w-full mt-5 py-3 text-sm font-semibold text-white bg-[#c8522a] rounded-xl hover:bg-[#b8471f] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Connecting…' : 'Connect property'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Other platform connect modal ──────────────────────────────────────────────

const OTHER_PLATFORM_CONFIG = {
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

function OtherConnectModal({
  platform,
  initialValue,
  onClose,
  onSuccess,
}: {
  platform: 'instagram' | 'meta'
  initialValue: string
  onClose: () => void
  onSuccess: (value: string) => void
}) {
  const cfg = OTHER_PLATFORM_CONFIG[platform]
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
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-1">Connect</p>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{cfg.label}</h2>
        <p className="text-sm text-gray-400 mb-5">Enter your {cfg.fieldLabel.toLowerCase()} and we'll set up the connection for you.</p>
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
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c8522a] rounded-xl hover:bg-[#b8471f] disabled:opacity-50 transition-colors">
            {loading ? 'Saving…' : 'Request connection'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Locked section (Instagram / Meta) ─────────────────────────────────────────

function LockedSection({
  title, description, tooltip, icon: Icon, logoSrc, connectLabel, platform, pendingValue, onConnect,
}: {
  title: string; description: string; tooltip: string; icon: React.ElementType; logoSrc?: string
  connectLabel: string; platform: Platform; pendingValue: string | null; onConnect: (p: Platform) => void
}) {
  const isPending = Boolean(pendingValue)
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between rounded-t-2xl overflow-visible">
        <div className="flex items-center gap-3">
          {logoSrc ? <BrandIcon src={logoSrc} alt={title} /> : (
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><Icon size={16} className="text-gray-400" /></div>
          )}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <InfoTooltip text={tooltip} />
        </div>
        {isPending ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><Clock size={11} />Pending</span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full"><Lock size={11} />Not connected</span>
        )}
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
  propertyId, oauthConnected, range, tooltip, onConnect, onSessionsLoaded, onDisconnect,
}: {
  propertyId: string | null; oauthConnected: boolean; range: Range; tooltip: string
  onConnect: (p: Platform) => void; onSessionsLoaded: (n: number | null) => void
  onDisconnect: () => void
}) {
  const [status, setStatus] = useState<GaStatus>('loading')
  const [data, setData] = useState<GaData | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const disconnect = async () => {
    if (!confirm('Disconnect Google Analytics? This will clear your property ID and OAuth connection.')) return
    setDisconnecting(true)
    await fetch('/api/analytics/disconnect', { method: 'POST' })
    setDisconnecting(false)
    onDisconnect()
  }

  const fetchData = useCallback(async () => {
    if (!propertyId) { setStatus('pending'); onSessionsLoaded(null); return }
    setStatus('loading')
    try {
      const res = await fetch(`/api/analytics/ga-data?range=${range}`)
      const json = await res.json()
      if (json.connected) {
        setData(json); setStatus('connected'); onSessionsLoaded(json.summary.sessions)
      } else {
        setStatus('pending'); onSessionsLoaded(null)
      }
    } catch {
      setStatus('error'); onSessionsLoaded(null)
    }
  }, [propertyId, range, onSessionsLoaded])

  useEffect(() => { fetchData() }, [fetchData])

  // Header bar (reused across states)
  const header = (badge: React.ReactNode) => (
    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between rounded-t-2xl overflow-visible">
      <div className="flex items-center gap-3">
        <BrandIcon src="/google_analytics_icon.png" alt="Google Analytics" />
        <h3 className="text-sm font-semibold text-gray-700">Website Analytics</h3>
        <InfoTooltip text={tooltip} />
      </div>
      {badge}
    </div>
  )

  if (!propertyId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        {header(
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
            <Lock size={11} /> Not connected
          </span>
        )}
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
              {oauthConnected
                ? <p className="text-xs text-gray-400">Google is connected — select your property to start seeing data.</p>
                : <p className="text-xs text-gray-400">Connect your account to see live data here.</p>
              }
            </div>
            <button
              onClick={() => onConnect('google_analytics')}
              className="inline-flex items-center gap-2 bg-[#c8522a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8471f] transition-colors pointer-events-auto"
            >
              {oauthConnected ? 'Select property' : 'Connect Google Analytics'}
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
        {header(
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <RefreshCw size={11} className="animate-spin" /> Loading…
          </span>
        )}
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#c8522a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (status === 'connected' && data) {
    const chartData = data.chartData.map(d => ({
      ...d,
      day: d.day.length === 8 ? `${d.day.slice(4, 6)}/${d.day.slice(6, 8)}` : d.day,
    }))
    return (
      <div className="bg-white rounded-2xl border border-gray-100">
        {header(
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Wifi size={11} /> Connected
          </span>
        )}
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
          <div className="flex items-center justify-between mt-1 px-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-0.5 bg-[#c8522a] inline-block rounded" />Sessions</span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray-400"><span className="w-3 h-0.5 bg-[#e8a87c] inline-block rounded" />Users</span>
            </div>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="text-[10px] text-gray-300 hover:text-gray-500 underline underline-offset-2 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Pending — service account needs access
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {header(
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" title="Retry">
            <RefreshCw size={11} className="text-gray-400" />
          </button>
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            <Clock size={11} /> Pending
          </span>
        </div>
      )}
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
            <p className="text-sm font-semibold text-gray-800 mb-1">Connection requested</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Your Agent7even team has your Property ID and will complete the connection for you. You'll see live data here once it's active.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Want to connect instantly?{' '}
              <button onClick={() => onConnect('google_analytics')} className="font-semibold text-[#c8522a] underline underline-offset-2 pointer-events-auto hover:text-[#b8471f]">
                Use Google sign-in instead →
              </button>
            </p>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              className="mt-3 text-xs text-gray-300 hover:text-gray-500 underline underline-offset-2 pointer-events-auto transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Reset connection'}
            </button>
          </div>
        </div>
      </div>
      <div className="h-16 rounded-b-2xl overflow-hidden" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsClient({
  companyName, gaMeasurementId, instagramHandle, metaAdAccountId, gaOAuthConnected, gaOAuthEmail,
}: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [range, setRange] = useState<Range>('7d')
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null)
  const [showPropertySelector, setShowPropertySelector] = useState(false)
  const [oauthError, setOauthError] = useState('')
  const [liveSessions, setLiveSessions] = useState<number | null>(null)

  const [gaId, setGaId] = useState(gaMeasurementId)
  const [igHandle, setIgHandle] = useState(instagramHandle)
  const [metaId, setMetaId] = useState(metaAdAccountId)
  const [oauthConnected, setOauthConnected] = useState(gaOAuthConnected)

  // Handle OAuth redirect query params
  useEffect(() => {
    const oauthStatus = searchParams.get('ga_oauth')
    const gaError = searchParams.get('ga_error')
    if (oauthStatus === 'success') {
      setOauthConnected(true)
      setShowPropertySelector(true)
      router.replace('/dashboard/analytics')
    } else if (gaError) {
      const msgs: Record<string, string> = {
        access_denied: 'Google sign-in was cancelled.',
        no_refresh_token: 'Could not get access token. Please try again.',
        save_failed: 'Failed to save connection. Please try again.',
      }
      setOauthError(msgs[gaError] ?? 'Something went wrong. Please try again.')
      router.replace('/dashboard/analytics')
    }
  }, [searchParams, router])

  const handleGAConnect = (platform: Platform) => {
    if (platform === 'google_analytics') {
      // If OAuth is already connected, show property selector; else show GA connect modal
      if (oauthConnected) {
        setShowPropertySelector(true)
      } else {
        setActivePlatform('google_analytics')
      }
    } else {
      setActivePlatform(platform)
    }
  }

  const handlePropertySelected = (propertyId: string) => {
    setGaId(propertyId)
    setShowPropertySelector(false)
  }

  const handleDisconnect = () => {
    setGaId(null)
    setOauthConnected(false)
    setLiveSessions(null)
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Modals */}
      {activePlatform === 'google_analytics' && (
        <GAConnectModal
          currentPropertyId={gaId ?? ''}
          onClose={() => setActivePlatform(null)}
          onAgencySuccess={(value) => { setGaId(value); setActivePlatform(null) }}
        />
      )}
      {activePlatform === 'instagram' && (
        <OtherConnectModal
          platform="instagram"
          initialValue={igHandle ?? ''}
          onClose={() => setActivePlatform(null)}
          onSuccess={(value) => { setIgHandle(value); setActivePlatform(null) }}
        />
      )}
      {activePlatform === 'meta' && (
        <OtherConnectModal
          platform="meta"
          initialValue={metaId ?? ''}
          onClose={() => setActivePlatform(null)}
          onSuccess={(value) => { setMetaId(value); setActivePlatform(null) }}
        />
      )}
      {showPropertySelector && (
        <PropertySelectorModal
          oauthEmail={gaOAuthEmail}
          onClose={() => setShowPropertySelector(false)}
          onSelect={handlePropertySelected}
        />
      )}

      {/* OAuth error toast */}
      {oauthError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-xs text-red-600 font-medium">{oauthError}</p>
          <button onClick={() => setOauthError('')} className="text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {companyName ? `${companyName} — ` : ''}Performance overview
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === '7d' ? '7D' : r === '30d' ? '30D' : '90D'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Website sessions" value={liveSessions !== null ? fmt(liveSessions) : '—'} icon={Globe} logoSrc="/google_analytics_icon.png" locked={liveSessions === null} />
        <StatCard label="Instagram followers" value="—" icon={Hash} logoSrc="/instagram-logo.png" locked />
        <StatCard label="Total reach" value="—" icon={Eye} locked />
        <StatCard label="Ad clicks" value="—" icon={MousePointerClick} logoSrc="/MetaLogo.png" locked />
      </div>

      {/* Notice banner */}
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

      {/* Website Analytics */}
      <WebsiteAnalyticsSection
        propertyId={gaId}
        oauthConnected={oauthConnected}
        range={range}
        tooltip="Connect Google Analytics to see live sessions, users, and pageviews. Use 'Connect with Google' for instant setup, or choose the agency-assisted option if you prefer."
        onConnect={handleGAConnect}
        onSessionsLoaded={setLiveSessions}
        onDisconnect={handleDisconnect}
      />

      {/* Social */}
      <LockedSection
        title="Social Media"
        description="Connect Instagram to track followers, reach, and impressions."
        tooltip="Your Instagram must be a Business or Creator account. Share access with Agent7even via Meta Business Suite."
        icon={Hash}
        logoSrc="/instagram-logo.png"
        connectLabel="Connect Instagram"
        platform="instagram"
        pendingValue={igHandle}
        onConnect={setActivePlatform}
      />

      {/* Ads */}
      <LockedSection
        title="Paid Ads"
        description="Connect Meta Ads to track spend, clicks, and conversions."
        tooltip="Go to Meta Business Suite → Settings → People and add your Agent7even team as a Partner with Advertiser access."
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
