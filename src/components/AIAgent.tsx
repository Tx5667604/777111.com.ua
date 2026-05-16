'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface AIAgentProps {
  brand: string
  model: string
  productName: string
  copyPrice: number
  origPrice: number
  origFramePrice: number
}

const SESSION_KEY = '777111_ai_session'
const API_URL = '/api/chat'

interface Message {
  role: 'ai' | 'user'
  text: string
}

export default function AIAgent({ brand, model, productName, copyPrice, origPrice, origFramePrice }: AIAgentProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const context = { brand, model, productName, copyPrice, origPrice, origFramePrice }

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate welcome message on first open
  const handleOpen = useCallback(async () => {
    setOpen(true)
    if (greeted) return

    setGreeted(true)
    setMessages(prev => [...prev, { role: 'ai', text: '⏳' }])
    setLoading(true)

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, welcome: true }),
      })
      const data = await resp.json()
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'ai', text: data.reply || 'Вітаю! Чим можу допомогти?' }
        return next
      })
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'ai', text: 'Вітаю! Чим можу допомогти? Зателефонуйте +38 (096) 077-71-11 або завітайте в майстерню.' }
        return next
      })
    } finally {
      setLoading(false)
    }
  }, [greeted, context])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, messages: history, userMessage: userText }),
      })
      const data = await resp.json()
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || '...' }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Вибачте, помилка. Зателефонуйте +38 (096) 077-71-111' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, context])

  return (
    <>
      {/* Chat button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full px-5 py-3.5 shadow-xl hover:bg-primary/90 hover:shadow-2xl transition-all flex items-center gap-2 text-sm font-medium"
        style={{ animation: 'fab-in 0.3s ease-out' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden sm:inline">AI-консультант</span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border flex flex-col overflow-hidden"
          style={{ maxHeight: '60vh', minHeight: 300, animation: 'fab-in 0.2s ease-out' }}
        >
          {/* Header */}
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="font-medium text-sm">AI-консультант</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white border shadow-sm rounded-bl-md'
                }`}>
                  {msg.text === '⏳' ? (
                    <span className="text-gray-400">Думаю...</span>
                  ) : (
                    msg.text.split('\n').map((line, j) => (
                      <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                    ))
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Напишіть повідомлення..."
                disabled={loading}
                className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              AI-консультант на базі DeepSeek. Може помилятися.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fab-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
