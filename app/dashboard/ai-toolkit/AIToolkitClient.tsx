'use client'

import { useState } from 'react'
import {
  Zap, Mail, Hash, Megaphone, Brush,
  BookOpen, Search, Copy, Check, Loader2,
  ChevronRight, Clock, Star, Plus, X
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Prompt {
  id: string
  category: string
  title: string
  description: string
  prompt: string
  variables: { key: string; label: string }[]
  time_saved_mins: number
}

interface SavedPrompt {
  id: string
  title: string
  prompt: string
  category: string
}

interface Profile {
  id: string
  company_name?: string
  full_name?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all', label: 'All tools', icon: Zap },
  { id: 'social', label: 'Social', icon: Hash },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'ads', label: 'Ads', icon: Megaphone },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'brand', label: 'Brand', icon: Brush },
  { id: 'operations', label: 'Operations', icon: BookOpen },
]

const CATEGORY_COLORS: Record<string, string> = {
  social: 'bg-pink-50 text-pink-600',
  email: 'bg-blue-50 text-blue-600',
  ads: 'bg-orange-50 text-orange-600',
  seo: 'bg-green-50 text-green-600',
  brand: 'bg-purple-50 text-purple-600',
  operations: 'bg-gray-50 text-gray-600',
  general: 'bg-gray-50 text-gray-600',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `[${key}]`)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function PromptRunner({
  prompt,
  profileId,
  onClose,
}: {
  prompt: Prompt
  profileId: string
  onClose: () => void
}) {
  const [vars, setVars] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filledPrompt = fillPrompt(prompt.prompt, vars)
  const allVarsFilled = prompt.variables.every(v => vars[v.key]?.trim())

  const run = async () => {
    setLoading(true)
    setOutput('')
    try {
      const res = await fetch('/api/ai/run-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: filledPrompt,
          promptId: prompt.id,
          timeSavedMins: prompt.time_saved_mins,
        }),
      })
      const data = await res.json()
      if (data.output) setOutput(data.output)
    } finally {
      setLoading(false)
    }
  }

  const savePrompt = async () => {
    setSaving(true)
    try {
      await fetch('/api/ai/save-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: prompt.title,
          prompt: filledPrompt,
          category: prompt.category,
        }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${CATEGORY_COLORS[prompt.category] ?? 'bg-gray-50 text-gray-500'}`}>
              {prompt.category}
            </span>
            <h2 className="text-base font-bold text-gray-900 mt-2">{prompt.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock size={10} /> Saves ~{prompt.time_saved_mins} min
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Variables */}
          {prompt.variables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Fill in your details</p>
              <div className="space-y-3">
                {prompt.variables.map(v => (
                  <div key={v.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{v.label}</label>
                    <input
                      type="text"
                      value={vars[v.key] ?? ''}
                      onChange={e => setVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                      placeholder={`Enter ${v.label.toLowerCase()}...`}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#c8522a]/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run button */}
          <button
            onClick={run}
            disabled={loading || (!allVarsFilled && prompt.variables.length > 0)}
            className="w-full bg-[#c8522a] text-white font-medium text-sm py-3 rounded-xl hover:bg-[#b04623] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Zap size={14} /> Generate</>}
          </button>

          {/* Output */}
          {output && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Output</p>
                <div className="flex items-center gap-3">
                  <CopyButton text={output} />
                  <button
                    onClick={savePrompt}
                    disabled={saving || saved}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {saved ? <><Check size={12} className="text-green-500" /> Saved</> : <><Star size={12} /> Save prompt</>}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                {output}
              </div>

              {/* Regenerate */}
              <button
                onClick={run}
                disabled={loading}
                className="mt-3 text-xs text-[#c8522a] hover:text-[#b04623] transition-colors flex items-center gap-1"
              >
                <Zap size={11} /> Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIToolkitClient({
  profile,
  prompts,
  savedPrompts,
  totalOutputs,
  totalTimeSaved,
}: {
  profile: Profile | null
  prompts: Prompt[]
  savedPrompts: SavedPrompt[]
  totalOutputs: number
  totalTimeSaved: number
}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'library' | 'saved'>('library')
  const [search, setSearch] = useState('')
  const [runningPrompt, setRunningPrompt] = useState<Prompt | null>(null)

  const filtered = prompts.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    const matchesSearch = search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalHours = Math.round(totalTimeSaved / 60 * 10) / 10

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8 max-w-5xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#c8522a] mb-2">AI Toolkit</p>
          <h1 className="text-2xl font-bold text-gray-900">Your AI tools</h1>
          <p className="text-gray-500 text-sm mt-1">Generate content, copy, and strategy in seconds.</p>
        </div>
        <div className="flex gap-3 sm:flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center flex-1 sm:flex-initial sm:px-5">
            <p className="text-xl font-bold text-[#c8522a]">{totalOutputs}</p>
            <p className="text-xs text-gray-400">Outputs</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 text-center flex-1 sm:flex-initial sm:px-5">
            <p className="text-xl font-bold text-green-500">{totalHours}h</p>
            <p className="text-xs text-gray-400">Time saved</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {([['library', 'Prompt library'], ['saved', `Saved (${savedPrompts.length})`]] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <>
          {/* Search + category filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#c8522a]/40 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'bg-[#c8522a] text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={11} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prompt cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => setRunningPrompt(prompt)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${CATEGORY_COLORS[prompt.category] ?? 'bg-gray-50 text-gray-500'}`}>
                    {prompt.category}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-300">
                    <Clock size={10} />
                    ~{prompt.time_saved_mins}m saved
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-[#c8522a] transition-colors">
                  {prompt.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{prompt.description}</p>
                <div className="flex items-center gap-1 text-xs font-medium text-[#c8522a]">
                  Use prompt <ChevronRight size={11} />
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Zap size={20} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No prompts found</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedPrompts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Star size={20} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No saved prompts yet</p>
              <p className="text-xs text-gray-300 mt-1">Run a prompt and save it to find it here.</p>
              <button
                onClick={() => setActiveTab('library')}
                className="mt-4 text-sm font-medium text-[#c8522a] hover:text-[#b04623] transition-colors"
              >
                Browse prompt library →
              </button>
            </div>
          ) : (
            savedPrompts.map(sp => (
              <div key={sp.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full ${CATEGORY_COLORS[sp.category] ?? 'bg-gray-50 text-gray-500'}`}>
                      {sp.category || 'custom'}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{sp.title}</p>
                  </div>
                  <CopyButton text={sp.prompt} />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed bg-gray-50 rounded-lg p-3 mt-2 font-mono">
                  {sp.prompt.slice(0, 200)}{sp.prompt.length > 200 ? '...' : ''}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Prompt runner modal */}
      {runningPrompt && (
        <PromptRunner
          prompt={runningPrompt}
          profileId={profile?.id ?? ''}
          onClose={() => setRunningPrompt(null)}
        />
      )}
    </div>
  )
}
