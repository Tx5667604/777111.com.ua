// src/components/chat/AdminChat.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { collection, query, orderBy, onSnapshot, addDoc, doc, Timestamp, updateDoc, where, getDocs } from "firebase/firestore"
import { initFirebase } from "@/lib/firebase"
import { Send, MessageCircle, Search, ChevronLeft, CheckCheck, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  text: string
  senderName?: string
  senderRole: "admin" | "client"
  createdAt: any
  read?: boolean
}

interface ChatRoom {
  id: string
  orderId?: string
  clientEmail: string
  clientName: string
  lastMessage?: string
  lastMessageAt?: any
}

export default function AdminChat() {
  const [chats, setChats] = useState<ChatRoom[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [search, setSearch] = useState("")
  const [showNewChat, setShowNewChat] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevUnreadMap = useRef<Record<string, number>>({})

  useEffect(() => {
    const chatId = sessionStorage.getItem("selectedChat")
    if (chatId) { setSelectedChat(chatId); sessionStorage.removeItem("selectedChat") }
  }, [])

  useEffect(() => {
    const { db } = initFirebase()
    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"))
    return onSnapshot(q, (snap) => {
      const chatList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatRoom))
      setChats(chatList)

      // Відстежуємо нові непрочитані → push
      snap.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data() as any
          const unreadNow = data.unreadAdmin || 0
          const unreadPrev = prevUnreadMap.current[change.doc.id] || 0
          if (unreadNow > unreadPrev && Notification.permission === "granted") {
            new Notification(`💬 ${data.clientName || "Клієнт"} — нове повідомлення`, {
              body: data.lastMessage?.substring(0, 120) || "Напишіть клієнту",
              icon: "/icons/icon-192.png",
              tag: `chat-admin-${change.doc.id}`,
            })
          }
          prevUnreadMap.current[change.doc.id] = unreadNow
        }
      })
    })
  }, [])

  useEffect(() => {
    if (!selectedChat) return
    const { db } = initFirebase()
    const q = query(collection(db, "chats", selectedChat, "messages"), orderBy("createdAt", "asc"))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message)))
      snap.docChanges().forEach((change) => {
        if (change.doc.data().senderRole === "client" && !change.doc.data().read) {
          updateDoc(doc(db, "chats", selectedChat, "messages", change.doc.id), { read: true })
        }
      })
      // Скидаємо лічильник непрочитаних
      updateDoc(doc(db, "chats", selectedChat), { unreadAdmin: 0 })
    })
    return unsub
  }, [selectedChat])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || !selectedChat) return
    const { db } = initFirebase()
    await addDoc(collection(db, "chats", selectedChat, "messages"), {
      text: text.trim(), sender: "admin@777111.com.ua", senderName: "Адміністратор",
      senderRole: "admin", createdAt: Timestamp.now(), read: false,
    })
    await updateDoc(doc(db, "chats", selectedChat), { lastMessage: text.trim(), lastMessageAt: Timestamp.now() })
    setText("")
  }

  const createChat = async () => {
    if (!newName.trim() || !newEmail.trim()) return
    const { db } = initFirebase()
    const ref = await addDoc(collection(db, "chats"), {
      clientEmail: newEmail.trim(), clientName: newName.trim(),
      createdAt: Timestamp.now(), lastMessage: "Чат створено", lastMessageAt: Timestamp.now(),
    })
    setSelectedChat(ref.id); setShowNewChat(false); setNewName(""); setNewEmail("")
  }

  const filtered = chats.filter((c) =>
    c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    c.clientEmail?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  )

  const selectedData = chats.find((c) => c.id === selectedChat)
  const formatTime = (s: number) => new Date(s * 1000).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })
  const formatShort = (s: number) => {
    const d = new Date(s * 1000); const t = new Date()
    return d.toDateString() === t.toDateString()
      ? formatTime(s)
      : d.toLocaleDateString("uk-UA", { day: "numeric", month: "short" })
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 border rounded-xl overflow-hidden bg-background" style={{ height: "calc(100vh - 220px)", minHeight: 450 }}>
      {/* Mobile: Contacts toggle */}
      <div className="lg:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center gap-2 p-2 bg-muted/10 border-b text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4 text-primary" />
          Контакти ({filtered.length})
          <ChevronLeft className={`w-4 h-4 ml-auto transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Sidebar - collapsible */}
      <div className={`${sidebarOpen ? "block" : "hidden"} lg:block lg:w-56 xl:w-64 shrink-0 flex flex-col border-r bg-muted/10`}>
        <div className="p-2 border-b bg-background flex items-center gap-1 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 text-xs h-8" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="hidden lg:block p-1 hover:bg-accent rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-6">Чатів ще немає</p>
          )}
          {filtered.map((chat) => {
            const unread = chat.unreadAdmin || 0
            return (
              <button key={chat.id} onClick={() => { setSelectedChat(chat.id); setSidebarOpen(false) }}
                className={`w-full text-left p-2.5 border-b hover:bg-accent/30 transition-colors ${
                  selectedChat === chat.id ? "bg-accent/50 border-l-2 border-l-primary" : ""
                }`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{chat.clientName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{chat.lastMessage || chat.clientEmail}</p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div className="p-2 border-t bg-background">
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setShowNewChat(!showNewChat)}>
            <Plus className="w-3 h-3 mr-1" /> Новий чат
          </Button>
          {showNewChat && (
            <div className="mt-2 space-y-1.5">
              <Input placeholder="Ім'я" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-xs h-7" />
              <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="text-xs h-7" type="email" />
              <Button size="sm" className="w-full h-7 text-xs" onClick={createChat} disabled={!newName.trim() || !newEmail.trim()}>Створити</Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/5">
            <div className="text-center p-6">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm mb-4">Оберіть чат або створіть новий</p>
              <Button size="sm" onClick={() => setShowNewChat(true)}>
                <Plus className="w-4 h-4 mr-1" /> Новий чат
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-3 border-b bg-background flex items-center gap-3 shrink-0">
              <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-accent rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedData?.clientName}</p>
                <p className="text-xs text-muted-foreground truncate">{selectedData?.clientEmail}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50/50">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Повідомлень ще немає. Напишіть першим!</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.senderRole === "admin"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-white border rounded-bl-md shadow-sm"
                  }`}>
                    <p className="text-xs opacity-70 mb-0.5">{msg.senderRole === "admin" ? "Ви" : msg.senderName || "Клієнт"}</p>
                    <p>{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-0.5 ${msg.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] opacity-50">
                        {msg.createdAt?.seconds ? formatTime(msg.createdAt.seconds) : ""}
                      </span>
                      {msg.senderRole === "admin" && (
                        <CheckCheck className={`w-3 h-3 ${msg.read ? "text-blue-300" : "opacity-30"}`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-background shrink-0">
              <div className="flex gap-2">
                <Input value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Написати клієнту..." className="flex-1 text-sm h-10" />
                <Button size="icon" onClick={sendMessage} disabled={!text.trim()} className="h-10 w-10 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
