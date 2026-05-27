'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  companyName: string
  businessType: string
  plan: string
}

const NAV = [
  { icon: 'ti-message-circle', label: 'Talk to Maya', id: 'maya' },
  { icon: 'ti-layout-grid', label: 'My campaigns', id: 'campaigns' },
  { icon: 'ti-calendar', label: 'Content calendar', id: 'calendar' },
  { icon: 'ti-chart-bar', label: 'Results', id: 'results' },
  { icon: 'ti-heart', label: 'Saved', id: 'saved' },
  { icon: 'ti-sparkles', label: 'Brand kit', id: 'brand' },
  { icon: 'ti-shopping-bag', label: 'Services', id: 'services' },
]

const SUGGESTIONS = [
  { icon: 'ti-sparkles', text: 'Build my 30-day campaign' },
  { icon: 'ti-photo', text: 'What should I post this week?' },
  { icon: 'ti-eye', text: 'Help me stand out from competitors' },
]

const COMPETITOR_CARDS = [
  {
    initials: 'FS',
    name: 'Fresh Start Co.',
    time: '2h ago',
    caption: 'New arrivals just landed — spring collection is here and it\'s everything you\'ve been waiting for. Limited stock.',
    likes: 847,
    comments: 62,
    shares: 118,
    tip: 'They\'re leading with scarcity + season. Your audience responds well to "limited" framing — try pairing it with a specific number.',
  },
  {
    initials: 'BL',
    name: 'Bloom & Co.',
    time: '5h ago',
    caption: 'Customer story: how Sarah went from overwhelmed to thriving using our weekly system. Read the full story on the blog.',
    likes: 1204,
    comments: 91,
    shares: 203,
    tip: 'Social proof is outperforming product posts 3:1 in this niche right now. One real customer story beats ten product photos.',
  },
]

export default function MayaShell({ companyName, businessType, plan }: Props) {
  const [activeNav, setActiveNav] = useState('maya')
  const [activeTab, setActiveTab] = useState<'competitors' | 'inspiration' | 'campaigns'>('competitors')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [chatStarted, setChatStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const initials = companyName.slice(0, 2).toUpperCase()

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setChatStarted(true)
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...next, assistantMsg])

    try {
      const res = await fetch('/api/maya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          profile: { companyName, businessType },
        }),
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Parse SSE-style lines: data: <text>
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6)
            if (token === '[DONE]') continue
            accumulated += token
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: accumulated }
              return updated
            })
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleSuggestion(text: string) {
    setInput(text)
    setTimeout(() => sendMessage(text), 50)
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'var(--font-geist), system-ui, sans-serif',
        background: '#fff',
      }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRight: '0.5px solid #ebebeb',
          padding: '16px 12px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingLeft: 4 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: '#0a0a0a',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>7</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', letterSpacing: '-0.2px' }}>Agent7even</span>
        </div>

        {/* New campaign button */}
        <button
          style={{
            width: '100%',
            background: '#0a0a0a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            fontFamily: 'inherit',
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          New campaign
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map((item) => {
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#0a0a0a' : '#bbb',
                  background: isActive ? '#f0f0f0' : 'transparent',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#555'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#bbb'
                  }
                }}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 15, flexShrink: 0 }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            borderTop: '0.5px solid #f0f0f0',
            paddingTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>{initials}</span>
          </div>
          <span style={{ fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {companyName}
          </span>
        </div>
      </div>

      {/* ── CENTER PANEL ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '0.5px solid #f0f0f0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0a0a0a', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>Maya is ready</span>
          </div>
          {businessType && (
            <span style={{ fontSize: 12, color: '#bbb' }}>{businessType}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!chatStarted ? (
            /* ── GREETING STATE ── */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px 40px',
              }}
            >
              {/* Maya avatar */}
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  border: '0.5px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: 16,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: '#0a0a0a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>M</span>
                </div>
                {/* Pip */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#0a0a0a',
                    border: '1.5px solid #fff',
                  }}
                />
              </div>

              <p
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#ccc',
                  marginBottom: 14,
                }}
              >
                Maya · Your marketing strategist
              </p>

              <p
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: '#0a0a0a',
                  marginBottom: 10,
                  textAlign: 'center',
                  letterSpacing: '-0.4px',
                }}
              >
                Hey {companyName}, good to see you.
              </p>

              <p
                style={{
                  fontSize: 14,
                  color: '#888',
                  textAlign: 'center',
                  maxWidth: 340,
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}
              >
                I've been keeping an eye on what's happening in your space. Ready to build something? Tell me what's on your mind — or pick a place to start.
              </p>

              {/* Suggestion pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSuggestion(s.text)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: '0.5px solid #e8e8e8',
                      background: '#fafafa',
                      fontSize: 13,
                      color: '#444',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#0a0a0a' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e8e8e8' }}
                  >
                    <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: '#aaa' }} />
                    {s.text}
                  </button>
                ))}
              </div>

              {/* Input */}
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={() => sendMessage(input)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
              />

              <p style={{ fontSize: 11, color: '#ccc', marginTop: 10, textAlign: 'center' }}>
                Maya knows your brand, your goals, and your market.
              </p>
            </div>
          ) : (
            /* ── CHAT STATE ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      padding: '0 24px',
                    }}
                  >
                    {msg.role === 'assistant' && msg.content === '' && streaming ? (
                      <div
                        style={{
                          background: '#f5f5f5',
                          borderRadius: 18,
                          padding: '10px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {[0, 1, 2].map(d => (
                          <div
                            key={d}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#ccc',
                              animation: 'pulse 1.2s ease-in-out infinite',
                              animationDelay: `${d * 0.2}s`,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          maxWidth: '75%',
                          background: msg.role === 'user' ? '#0a0a0a' : '#f5f5f5',
                          color: msg.role === 'user' ? '#fff' : '#0a0a0a',
                          borderRadius: 18,
                          padding: '10px 14px',
                          fontSize: 14,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input bar at bottom */}
              <div style={{ padding: '12px 24px 20px', flexShrink: 0 }}>
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={() => sendMessage(input)}
                  onKeyDown={handleKeyDown}
                  ref={inputRef}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          width: 284,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#fafafa',
          borderLeft: '0.5px solid #ebebeb',
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            padding: '12px 12px 0',
            gap: 2,
            borderBottom: '0.5px solid #ebebeb',
            flexShrink: 0,
          }}
        >
          {(['competitors', 'inspiration', 'campaigns'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '7px 4px',
                fontSize: 12,
                fontWeight: activeTab === tab ? 500 : 400,
                color: activeTab === tab ? '#0a0a0a' : '#aaa',
                background: activeTab === tab ? '#f0f0f0' : 'transparent',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
          {activeTab === 'competitors' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Trending in your space
                </span>
                <button style={{ fontSize: 11, color: '#aaa', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Refresh
                </button>
              </div>

              {COMPETITOR_CARDS.map((card) => (
                <div key={card.initials} style={{ marginBottom: 10 }}>
                  {/* Card */}
                  <div
                    style={{
                      background: '#fff',
                      border: '0.5px solid #ebebeb',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Image placeholder */}
                    <div
                      style={{
                        height: 72,
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i className="ti ti-hanger" style={{ fontSize: 22, color: '#ccc' }} />
                    </div>
                    {/* Body */}
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#0a0a0a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ color: '#fff', fontSize: 8, fontWeight: 600 }}>{card.initials}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#0a0a0a', flex: 1 }}>{card.name}</span>
                        <span style={{ fontSize: 11, color: '#ccc' }}>{card.time}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>{card.caption}</p>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[
                          { icon: 'ti-heart', val: card.likes },
                          { icon: 'ti-message-circle', val: card.comments },
                          { icon: 'ti-share', val: card.shares },
                        ].map(s => (
                          <span key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#aaa' }}>
                            <i className={`ti ${s.icon}`} style={{ fontSize: 12 }} />
                            {s.val.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Maya's take */}
                  <div
                    style={{
                      background: '#f5f5f5',
                      border: '0.5px solid #ebebeb',
                      borderRadius: '0 0 8px 8px',
                      padding: '8px 10px',
                      marginTop: -1,
                    }}
                  >
                    <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 600, color: '#0a0a0a' }}>Maya's take: </span>
                      {card.tip}
                    </p>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Watch list</span>
                <button style={{ fontSize: 11, color: '#aaa', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  + Add
                </button>
              </div>
            </div>
          )}

          {activeTab === 'inspiration' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { bg: '#efefef' },
                { bg: '#e8e8e8' },
                { bg: '#f2f2f2' },
                { dashed: true },
              ].map((tile, i) => (
                <div
                  key={i}
                  style={{
                    height: 100,
                    borderRadius: 10,
                    background: tile.dashed ? 'transparent' : tile.bg,
                    border: tile.dashed ? '0.5px dashed #ccc' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {tile.dashed && <i className="ti ti-plus" style={{ fontSize: 18, color: '#ccc' }} />}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Active campaign */}
              <div style={{ background: '#fff', border: '0.5px solid #ebebeb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#0a0a0a' }}>Spring Push</span>
                  <span style={{ fontSize: 10, background: '#f0f0f0', color: '#888', padding: '2px 7px', borderRadius: 20 }}>Active</span>
                </div>
                <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>14 pieces · 8 published · ends Jun 1</p>
              </div>

              {/* Draft */}
              <div style={{ background: '#fff', border: '0.5px solid #ebebeb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#0a0a0a' }}>Summer Launch</span>
                  <span style={{ fontSize: 10, background: '#f0f0f0', color: '#aaa', padding: '2px 7px', borderRadius: 20 }}>Draft</span>
                </div>
                <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>Not started · 0 pieces</p>
              </div>

              {/* Maya suggests */}
              <div style={{ background: '#fff', border: '0.5px solid #ebebeb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Maya suggests</span>
                  <span
                    style={{
                      fontSize: 10,
                      background: '#0a0a0a',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontWeight: 500,
                    }}
                  >
                    Build this
                  </span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#0a0a0a', marginBottom: 4 }}>Re-engagement blast</p>
                <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>3-email sequence targeting customers who haven't purchased in 60 days.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── Chat input sub-component ──

interface ChatInputProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ value, onChange, onSubmit, onKeyDown }, ref) => {
    return (
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Maya anything about your marketing..."
          rows={1}
          style={{
            width: '100%',
            border: '0.5px solid #e0e0e0',
            borderRadius: 24,
            padding: '13px 50px 13px 18px',
            fontSize: 13.5,
            background: '#fafafa',
            color: '#0a0a0a',
            resize: 'none',
            outline: 'none',
            fontFamily: 'var(--font-geist), system-ui, sans-serif',
            lineHeight: 1.5,
            boxSizing: 'border-box',
            display: 'block',
          }}
        />
        <button
          onClick={onSubmit}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#0a0a0a',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <i className="ti ti-arrow-up" style={{ fontSize: 15, color: '#fff' }} />
        </button>
      </div>
    )
  }
)
ChatInput.displayName = 'ChatInput'
