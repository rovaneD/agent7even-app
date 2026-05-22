'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type StepType = 'text' | 'select' | 'multiselect' | 'done'

interface Step {
  id: string
  question: string
  subtext?: string
  type: StepType
  placeholder?: string
  options?: { value: string; label: string; emoji: string }[]
  field: string
}

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: 'company_name',
    question: "First things first — what's the name of your business?",
    subtext: "This is how we'll refer to you throughout your dashboard.",
    type: 'text',
    placeholder: 'e.g. Bloom Skincare',
    field: 'company_name',
  },
  {
    id: 'business_type',
    question: "What kind of business is it?",
    subtext: "This helps us tailor your tools and recommendations.",
    type: 'select',
    field: 'business_type',
    options: [
      { value: 'ecommerce', label: 'E-commerce / Online store', emoji: '🛍️' },
      { value: 'service', label: 'Service business', emoji: '🤝' },
      { value: 'restaurant', label: 'Restaurant / Food & Beverage', emoji: '🍽️' },
      { value: 'retail', label: 'Brick & mortar retail', emoji: '🏪' },
      { value: 'creative', label: 'Creative / Studio', emoji: '🎨' },
      { value: 'health', label: 'Health & Wellness', emoji: '💪' },
      { value: 'other', label: 'Something else', emoji: '✨' },
    ],
  },
  {
    id: 'business_goals',
    question: "What are you trying to get better at?",
    subtext: "Pick everything that applies — no wrong answers.",
    type: 'multiselect',
    field: 'business_goals',
    options: [
      { value: 'save_time', label: 'Save time on repetitive tasks', emoji: '⏱️' },
      { value: 'grow_social', label: 'Grow on social media', emoji: '📱' },
      { value: 'get_leads', label: 'Get more leads and customers', emoji: '🎯' },
      { value: 'build_website', label: 'Build or improve my website', emoji: '💻' },
      { value: 'run_ads', label: 'Run better ads', emoji: '📣' },
      { value: 'create_content', label: 'Create more content consistently', emoji: '✍️' },
      { value: 'email_marketing', label: 'Set up email marketing', emoji: '✉️' },
      { value: 'brand_identity', label: 'Build a stronger brand', emoji: '🎨' },
    ],
  },
  {
    id: 'website_url',
    question: "Do you have a website?",
    subtext: "Paste the URL if you do — skip if not yet.",
    type: 'text',
    placeholder: 'https://yourbusiness.com',
    field: 'website_url',
  },
  {
    id: 'instagram_handle',
    question: "What's your Instagram handle?",
    subtext: "We'll use this to connect your analytics later.",
    type: 'text',
    placeholder: '@yourbusiness',
    field: 'instagram_handle',
  },
  {
    id: 'done',
    question: '',
    type: 'done',
    field: '',
  },
]

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [inputValue, setInputValue] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayedQuestion, setDisplayedQuestion] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const step = STEPS[currentStep]
  const progress = ((currentStep) / (STEPS.length - 1)) * 100

  // Typing animation effect
  useEffect(() => {
    if (step.type === 'done') {
      handleSubmit()
      return
    }

    setIsTyping(true)
    setShowInput(false)
    setDisplayedQuestion('')
    setInputValue('')
    setSelectedOptions([])

    const question = step.question
    let i = 0
    const speed = 28

    const timer = setInterval(() => {
      if (i < question.length) {
        setDisplayedQuestion(question.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        setTimeout(() => setShowInput(true), 200)
      }
    }, speed)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  useEffect(() => {
    if (showInput && step.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [showInput, step.type])

  const handleNext = (value?: string | string[]) => {
    const finalValue = value ?? (step.type === 'multiselect' ? selectedOptions : inputValue)

    if (step.type === 'text' && !inputValue.trim() && step.id !== 'website_url' && step.id !== 'instagram_handle') {
      return
    }

    setAnswers(prev => ({ ...prev, [step.field]: finalValue ?? '' }))
    setCompletedSteps(prev => [...prev, currentStep])
    setCurrentStep(prev => prev + 1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  const toggleOption = (value: string) => {
    setSelectedOptions(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          clerk_user_id: user?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      router.push('/dashboard')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step.type === 'done' || isSubmitting) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#c8522a]/10 border border-[#c8522a]/20 flex items-center justify-center mx-auto mb-6">
            {isSubmitting
              ? <Loader2 size={24} className="text-[#c8522a] animate-spin" />
              : <Check size={24} className="text-[#c8522a]" />
            }
          </div>
          <p className="text-white/50 text-sm">Setting up your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-white/5">
        <div
          className="h-full bg-[#c8522a] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5">
        <span className="text-white font-bold text-sm tracking-wide">
          AGENT<span className="text-[#c8522a]">7</span>EVEN
        </span>
        <span className="text-white/20 text-xs">
          {currentStep + 1} of {STEPS.length - 1}
        </span>
      </div>

      {/* Main conversation area */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full px-8 pb-24">

        {/* Completed steps summary */}
        {completedSteps.length > 0 && (
          <div className="mb-12 flex flex-col gap-3">
            {completedSteps.map((stepIndex) => {
              const s = STEPS[stepIndex]
              const answer = answers[s.field]
              if (!answer || (Array.isArray(answer) && answer.length === 0)) return null
              return (
                <div key={s.id} className="flex items-start gap-3 opacity-40">
                  <div className="w-5 h-5 rounded-full bg-[#c8522a]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={10} className="text-[#c8522a]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-0.5">{s.question}</p>
                    <p className="text-white text-sm font-medium">
                      {Array.isArray(answer) ? answer.join(', ') : answer}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Current question */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#c8522a] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">A7</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-xl leading-relaxed font-medium min-h-[2rem]">
                {displayedQuestion}
                {isTyping && (
                  <span className="inline-block w-0.5 h-5 bg-[#c8522a] ml-0.5 animate-pulse" />
                )}
              </p>
              {!isTyping && step.subtext && (
                <p className="text-white/40 text-sm mt-2 animate-in fade-in duration-300">
                  {step.subtext}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Input area */}
        {showInput && (
          <div className="ml-11 animate-in slide-in-from-bottom-2 fade-in duration-300">

            {/* Text input */}
            {step.type === 'text' && (
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={step.placeholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#c8522a]/50 transition-colors"
                />
                <button
                  onClick={() => handleNext()}
                  disabled={!inputValue.trim() && step.id !== 'website_url' && step.id !== 'instagram_handle'}
                  className="w-11 h-11 rounded-xl bg-[#c8522a] flex items-center justify-center disabled:opacity-30 hover:bg-[#b04623] transition-colors flex-shrink-0"
                >
                  <ArrowRight size={16} className="text-white" />
                </button>
              </div>
            )}

            {/* Skip link for optional fields */}
            {step.type === 'text' && (step.id === 'website_url' || step.id === 'instagram_handle') && (
              <button
                onClick={() => handleNext('')}
                className="mt-3 text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                Skip for now →
              </button>
            )}

            {/* Single select */}
            {step.type === 'select' && (
              <div className="grid grid-cols-1 gap-2">
                {step.options?.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleNext(option.value)}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left hover:border-[#c8522a]/50 hover:bg-white/8 transition-all group"
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Multi select */}
            {step.type === 'multiselect' && (
              <div>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {step.options?.map(option => {
                    const selected = selectedOptions.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        onClick={() => toggleOption(option.value)}
                        className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-left transition-all ${
                          selected
                            ? 'border-[#c8522a]/60 bg-[#c8522a]/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'bg-[#c8522a]' : 'border border-white/20'
                        }`}>
                          {selected && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-lg">{option.emoji}</span>
                        <span className={`text-sm transition-colors ${selected ? 'text-white' : 'text-white/70'}`}>
                          {option.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => handleNext(selectedOptions)}
                  disabled={selectedOptions.length === 0}
                  className="flex items-center gap-2 bg-[#c8522a] text-white text-sm font-medium px-6 py-3 rounded-xl disabled:opacity-30 hover:bg-[#b04623] transition-colors"
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
