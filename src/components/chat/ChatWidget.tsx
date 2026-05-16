'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, Timestamp, updateDoc, increment } from 'firebase/firestore'
import { initFirebase } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { Send, MessageCircle, X, CheckCheck, Loader2, GripVertical } from 'lucide-react'
import { setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  text: string
  senderName?: string
  senderRole: 'admin' | 'client'
  createdAt: any
  read?: boolean
}

const LS_KEY = 'chat-btn-pos'

export default function ChatWidget() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', date: '', time: '', device: '', issue: '' })
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const prevUnreadRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Устанавливаем начальную позицию через DOM, минуя React style
  useEffect(() => {
    const el = btnRef.current
    if (!el) return
    el.style.left = pos.x + 'px'
    el.style.top = pos.y + 'px'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag state
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 16, y: 16 }
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      x: Math.max(16, window.innerWidth - 200),
      y: Math.max(16, window.innerHeight - 90),
    }
  })
  const wasDragged = useRef(false)
  const posRef = useRef(pos)
  posRef.current = pos

  const savePos = useCallback((x: number, y: number) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ x, y })) } catch {}
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    wasDragged.current = false
    const el = e.currentTarget as HTMLElement
    const startX = e.clientX
    const startY = e.clientY
    const origLeft = posRef.current.x
    const origTop = posRef.current.y
    let rafId = 0

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (Math.abs(dx) + Math.abs(dy) > 5) wasDragged.current = true
      const newLeft = Math.max(0, Math.min(window.innerWidth - 80, origLeft + dx))
      const newTop = Math.max(0, Math.min(window.innerHeight - 80, origTop + dy))
      // DOM — сразу, без задержки
      el.style.left = newLeft + 'px'
      el.style.top = newTop + 'px'
      posRef.current = { x: newLeft, y: newTop }
      // React — через requestAnimationFrame (не чаще 60fps)
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0
          setPos({ x: newLeft, y: newTop })
        })
      }
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      if (rafId) cancelAnimationFrame(rafId)
      setPos({ x: posRef.current.x, y: posRef.current.y })
      savePos(posRef.current.x, posRef.current.y)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.body.style.userSelect = 'none'
  }

  const clientEmail = user?.email || ''
  const clientName = profile?.name || user?.displayName || 'Клієнт'

  useEffect(() => {
    if (!clientEmail) return
    const { db } = initFirebase()
    const q = query(collection(db, 'chats'), where('clientEmail', '==', clientEmail))
    const unsub = onSnapshot(q, (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (chats.length > 0) {
        setChatId(chats[0].id)
      } else if (open) {
        const newRef = doc(collection(db, 'chats'))
        const newId = newRef.id
        setDoc(newRef, { clientEmail, clientName, createdAt: Timestamp.now(), lastMessage: 'Чат створено', lastMessageAt: Timestamp.now() })
        setChatId(newId)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [clientEmail, open])

  useEffect(() => {
    if (!chatId) return
    const { db } = initFirebase()
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))
      setMessages(msgs)

      if (!open) {
        const adminMsgs = msgs.filter((m) => m.senderRole === 'admin' && !m.read)
        setUnread(adminMsgs.length)
      }

      snap.docChanges().forEach((change) => {
        if (change.doc.data().senderRole === 'admin' && !change.doc.data().read) {
          updateDoc(doc(db, 'chats', chatId, 'messages', change.doc.id), { read: true })
        }
      })
    })
    return () => unsub()
  }, [chatId, open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (open) { inputRef.current?.focus(); setUnread(0) }
  }, [messages, open])

  // Push notification for new admin messages
  useEffect(() => {
    if (unread > prevUnreadRef.current && !open && Notification.permission === 'granted') {
      const lastAdminMsg = [...messages].reverse().find((m) => m.senderRole === 'admin')
      if (lastAdminMsg) {
        new Notification('💬 777 Ремонт — нове повідомлення', {
          body: lastAdminMsg.text.substring(0, 120),
          icon: '/icons/icon-192.png',
          tag: 'chat-777',
        })
      }
    }
    prevUnreadRef.current = unread
  }, [unread, open, messages])

  const sendMessage = async () => {
    if (!text.trim() || !chatId) return
    const { db } = initFirebase()
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: text.trim(), sender: clientEmail, senderName: clientName, senderRole: 'client',
      createdAt: Timestamp.now(), read: false,
    })
    await updateDoc(doc(db, 'chats', chatId), { lastMessage: text.trim(), lastMessageAt: Timestamp.now(), unreadAdmin: increment(1) })
    setText('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (seconds: number) => {
    const d = new Date(seconds * 1000)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Сьогодні'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Вчора'
    return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
  }

  if (!user) {
    return (
      <>
        {!open && (
          <button
            ref={btnRef}
            onPointerDown={onPointerDown}
            onClick={() => { if (!wasDragged.current) setOpen(true) }}
            className="fixed z-40 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 py-3 shadow-xl transition-all duration-200 touch-none select-none"
            style={{ left: pos.x, top: pos.y }}
          >
            <GripVertical className="w-4 h-4 opacity-60 shrink-0" />
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">Написати</span>
          </button>
        )}

        {open && (
          <div className="fixed right-4 bottom-4 z-40 w-[calc(100vw-32px)] sm:w-80 bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Написати нам</p>
                  <p className="text-[10px] opacity-70">Оберіть зручний спосіб</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm">
                <X className="w-4 h-4" />
                Закрити
              </button>
            </div>
            <div className="p-4 space-y-2">
              {!bookingOpen ? (
                <>
              <a href="https://t.me/tx5667604bot" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] transition-colors font-medium">
                <MessageCircle className="w-5 h-5" />
                <span>Telegram</span>
              </a>
              <a href="viber://chat?number=%2B380960777111" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors font-medium">
                <MessageCircle className="w-5 h-5" />
                <span>Viber</span>
              </a>
              <button onClick={() => setBookingOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors font-medium">
                <span className="text-lg">📅</span>
                <span>Записатись на ремонт</span>
              </button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground mb-1">Запис на ремонт</p>
                  <input type="text" placeholder="Ваше ім'я" value={bookingForm.name}
                    onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background" />
                  <input type="tel" placeholder="Номер телефону *" value={bookingForm.phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background" />
                  <input type="text" placeholder="Модель телефону" value={bookingForm.device}
                    onChange={(e) => setBookingForm({ ...bookingForm, device: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background" />
                  <textarea placeholder="Опис проблеми" value={bookingForm.issue} rows={2}
                    onChange={(e) => setBookingForm({ ...bookingForm, issue: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border bg-background resize-none" />
                  <div className="flex gap-2">
                    <input type="date" value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border bg-background" />
                    <input type="time" value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border bg-background" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setBookingOpen(false)}
                      className="flex-1 text-xs px-3 py-2 rounded-lg border text-muted-foreground hover:bg-accent transition-colors">
                      Назад
                    </button>
                    <button onClick={async () => {
                      if (!bookingForm.phone.trim()) return
                      try {
                        const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
                        const text = `📅 НОВИЙ ЗАПИС\nІм'я: ${bookingForm.name || 'не вказано'}\nТелефон: ${bookingForm.phone}\nТелефон: ${bookingForm.device || 'не вказано'}\nПроблема: ${bookingForm.issue || 'не вказано'}\nДата: ${bookingForm.date || 'не обрано'}\nЧас: ${bookingForm.time || 'не обрано'}`
                        await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ chat_id: 5651005104, text, parse_mode: 'HTML' }),
                        })
                        setBookingOpen(false)
                        setBookingForm({ name: '', phone: '', date: '', time: '', device: '', issue: '' })
                        setOpen(false)
                      } catch {}
                    }}
                      className="flex-1 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                      Надіслати
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {!open && (
        <button
          ref={btnRef}
          onPointerDown={onPointerDown}
          onClick={() => { if (!wasDragged.current) setOpen(true) }}
          className="fixed z-40 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 py-3 shadow-xl transition-all duration-200 touch-none select-none"
          style={{ left: pos.x, top: pos.y }}
        >
          <GripVertical className="w-4 h-4 opacity-60 shrink-0" />
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap">Написати адміну</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-4 z-40 w-[calc(100vw-32px)] sm:w-80 md:w-96 bg-background border rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'min(450px, calc(100vh - 100px))' }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Чат з адміном</p>
                <p className="text-[10px] opacity-70">Відповімо найближчим часом</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm">
              <X className="w-4 h-4" />
              Згорнути
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50 dark:bg-gray-900/50 min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Напишіть нам, і ми відповімо</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Зазвичай відповідаємо протягом години</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const prev = idx > 0 ? messages[idx - 1] : null
                  const showDate = prev && msg.createdAt?.seconds && prev.createdAt?.seconds &&
                    Math.abs(msg.createdAt.seconds - prev.createdAt.seconds) > 300
                  const showTime = !prev || showDate || prev.senderRole !== msg.senderRole

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <p className="text-center text-[10px] text-muted-foreground py-2">
                          {formatDate(msg.createdAt.seconds)}
                        </p>
                      )}
                      <div className={`flex ${msg.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                          msg.senderRole === 'client'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-foreground border rounded-bl-md shadow-sm'
                        }`}>
                          <p>{msg.text}</p>
                          <div className={`flex items-center gap-1 mt-0.5 ${msg.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] opacity-50">
                              {msg.createdAt?.seconds ? formatTime(msg.createdAt.seconds) : ''}
                            </span>
                            {msg.senderRole === 'client' && (
                              <CheckCheck className={`w-3 h-3 ${msg.read ? 'text-blue-300' : 'opacity-30'}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-background shrink-0">
            <div className="flex gap-2 items-end">
              <Input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKey} placeholder="Написати повідомлення..."
                className="flex-1 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border-0 focus-visible:ring-1 h-10" />
              <Button size="icon" onClick={sendMessage} disabled={!text.trim()}
                className="rounded-xl h-10 w-10 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
