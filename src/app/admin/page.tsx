// src/app/admin/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { initFirebase } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  getDocs,
  setDoc,
  writeBatch,
  where,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Users,
  Calculator,
  ShoppingCart,
  Smartphone,
  Search,
  Trash2,
  Plus,
  Edit3,
  X,
  Check,
  Phone,
  Mail,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Save,
  Upload,
  Download,
  Eye,
  MessageCircle,
} from "lucide-react"
import { brandPartsData } from "@/app/phone-parts-data"
import type { PartVariant, BrandParts, PartCategory } from "@/app/types"
import { PART_CATEGORIES } from "@/app/types"
import { useAdmins, isSuperadmin } from "@/lib/admin"
import VisitCalendar from "@/components/admin/VisitCalendar"
import AdminChat from "@/components/chat/AdminChat"

const ADMIN_EMAILS = ["fit5667604@gmail.com", "pavlovich2008@gmail.com", "vihnykov354@gmail.com", "perpetoto@gmail.com"]

// ========== Helpers ==========
const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
const TG_CHAT_ID = 5651005104

function sendTG(text: string) {
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
  }).catch(() => {})
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} хв`
  if (minutes < 1440) return `${Math.round(minutes / 60)} год`
  return `${Math.round(minutes / 1440)} дн`
}

async function sendEmailNotification(email: string, name: string, device: string, order: any) {
  if (!email) return
  try {
    const msg = `Вітаємо, ${name}! Ваш телефон${device ? ` (${device})` : ""} готовий до отримання.\n\n📍 Адреса: м. Вознесенськ, Центральний ринок, сектор Б, контейнер 96\n🕐 Графік: Вт-Нд 9:00-16:00\n📞 ${order.clientPhone || order.phone || "+38 (096) 077-71-11"}\n\nЧекаємо на вас!`
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ subject: `✅ Ваш телефон готов! — ${device || "Ремонт"}`, message: msg, _template: "box" })
    })
  } catch {}
}

// ========== Users Tab ==========
function UsersTab({ onSetTab }: { onSetTab: (tab: string) => void }) {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()

  const openChat = async (client: any) => {
    const { db } = initFirebase()
    const q = query(collection(db, "chats"), where("clientEmail", "==", client.email))
    const snap = await getDocs(q)

    let chatId: string
    if (snap.empty) {
      const ref = await addDoc(collection(db, "chats"), {
        clientEmail: client.email,
        clientName: client.name || "Клієнт",
        createdAt: Timestamp.now(),
        lastMessage: "Чат створено",
        lastMessageAt: Timestamp.now(),
      })
      chatId = ref.id
      // Відправляємо привітання від адміна
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: `Вітаю, ${client.name || "клієнте"}! Чим можу допомогти?`,
        sender: "admin@777111.com.ua",
        senderName: "Адміністратор",
        senderRole: "admin",
        createdAt: Timestamp.now(),
        read: false,
      })
      await updateDoc(doc(db, "chats", chatId), { lastMessage: "Вітаю! Чим можу допомогти?" })
    } else {
      chatId = snap.docs[0].id
    }
    sessionStorage.setItem("selectedChat", chatId)
    onSetTab("chats")
  }

  useEffect(() => {
    const { db } = initFirebase()
    const q = query(collection(db, "users"), orderBy("lastLogin", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search)
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук клієнта..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} клієнтів</p>
      </div>
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Клієнтів не знайдено</p>}
      {filtered.map((u) => (
        <Card key={u.id} className="hover:shadow-md transition-shadow mb-1.5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{(u.name || "?").charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
              <span className="font-medium truncate">{u.name || "—"}</span>
              <span className="text-xs text-muted-foreground truncate">{u.email || "—"}</span>
              {u.phone && <span className="text-xs text-muted-foreground">{u.phone}</span>}
              <span className="text-[10px] text-muted-foreground">
                {u.lastLogin ? new Date(u.lastLogin.seconds * 1000 || u.lastLogin).toLocaleDateString("uk-UA") : ""}
              </span>
            </div>
            <button
              onClick={() => openChat(u)}
              className="shrink-0 text-xs text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
              title="Написати клієнту"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Написати
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ========== Calculator Editor Tab ==========
function CalculatorTab() {
  const [brands, setBrands] = useState<any[]>([])
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState("")
  const [modelSearch, setModelSearch] = useState("")

  useEffect(() => {
    // Load from static data and merge with Firestore
    loadData()
  }, [])

  const loadData = async () => {
    const { db } = initFirebase()
    const snap = await getDocs(collection(db, "calculator_brands"))
    const fbBrands: any[] = []
    snap.forEach((d) => fbBrands.push({ id: d.id, ...d.data() }))

    if (fbBrands.length === 0) {
      // First time — seed from static file
      setBrands(brandPartsData)
    } else {
      // Merge: Firestore overrides static data
      const merged = brandPartsData.map((staticBrand) => {
        const fb = fbBrands.find((b: any) => b.id === staticBrand.id)
        return fb || staticBrand
      })
      // Add brands that only exist in Firestore
      fbBrands.forEach((fb: any) => {
        if (!merged.find((m) => m.id === fb.id)) merged.push(fb)
      })
      setBrands(merged)
    }
  }

  const seedToFirestore = async () => {
    setSaving(true)
    setStatusMsg("Завантаження даних у Firestore...")
    const { db } = initFirebase()
    const batch = writeBatch(db)

    for (const brand of brandPartsData) {
      const ref = doc(db, "calculator_brands", brand.id)
      batch.set(ref, { name: brand.name, logo: brand.logo, models: brand.models, updatedAt: Timestamp.now() })
    }
    await batch.commit()
    setStatusMsg(`${brandPartsData.length} брендів завантажено!`)
    setTimeout(() => setStatusMsg(""), 2000)
    setSaving(false)
    loadData()
  }

  const saveBrand = async (brandId: string, updatedModels: any[]) => {
    setSaving(true)
    const { db } = initFirebase()
    await setDoc(doc(db, "calculator_brands", brandId), {
      id: brandId,
      name: brands.find((b) => b.id === brandId)?.name || brandId,
      logo: brands.find((b) => b.id === brandId)?.logo || "📱",
      models: updatedModels,
      updatedAt: Timestamp.now(),
    }, { merge: true })
    setSaving(false)
  }

  const handleModelEdit = (brandId: string, modelIndex: number, field: string, value: any) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id !== brandId) return b
        const updatedModels = [...b.models]
        updatedModels[modelIndex] = { ...updatedModels[modelIndex], [field]: value }
        return { ...b, models: updatedModels }
      })
    )
  }

  const handleModelSave = async (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId)
    if (!brand) return
    await saveBrand(brandId, brand.models)
    setEditingModel(null)
  }

  const addModel = (brandId: string) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id !== brandId) return b
        const newModel = {
          modelCode: "NEW",
          modelName: "Нова модель",
          parts: {
            display: { copy: 300, orig: 500, labor: 200 },
            battery: { copy: 150, orig: 250, labor: 150 },
            back_cover: { copy: 100, orig: 200, labor: 100 },
            speaker: { price: 100, labor: 100 },
          },
        }
        return { ...b, models: [...b.models, newModel] }
      })
    )
  }

  const deleteModel = async (brandId: string, modelIndex: number) => {
    const brand = brands.find((b) => b.id === brandId)
    if (!brand) return
    const updatedModels = brand.models.filter((_: any, i: number) => i !== modelIndex)
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, models: updatedModels } : b)))
    await saveBrand(brandId, updatedModels)
  }

  const filteredBrands = brands
    .filter((b) => {
      if (b.name.toLowerCase().includes(search.toLowerCase())) return true
      if (search && b.models?.some((m: any) =>
        (m.modelName || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.modelCode || "").toLowerCase().includes(search.toLowerCase())
      )) return true
      return !search
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  const getFilteredModels = (models: any[]) => {
    if (!modelSearch) return models
    return models.filter((m) =>
      (m.modelCode || "").toLowerCase().includes(modelSearch.toLowerCase()) ||
      (m.modelName || "").toLowerCase().includes(modelSearch.toLowerCase())
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук бренду..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{brands.length} брендів</p>
        <Button variant="outline" size="sm" onClick={seedToFirestore} disabled={saving}>
          <Upload className="w-4 h-4 mr-1" />
          Завантажити в Firestore
        </Button>
        {statusMsg && <span className="text-sm text-green-600">{statusMsg}</span>}
      </div>

      {filteredBrands.length === 0 && <p className="text-center text-muted-foreground py-8">Брендів не знайдено</p>}

      {filteredBrands.map((brand) => (
        <Card key={brand.id} className="mb-2">
          <button
            onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}
            className="w-full text-left p-4 flex items-center gap-3 hover:bg-accent/30 transition-colors"
          >
            {expandedBrand === brand.id ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            <span className="text-lg">{brand.logo}</span>
            <span className="font-medium">{brand.name}</span>
            <span className="text-sm text-muted-foreground">({brand.models?.length || 0} моделей)</span>
          </button>

          {expandedBrand === brand.id && (
            <CardContent className="pt-0 pb-4 px-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Пошук моделі..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => addModel(brand.id)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Модель
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium pr-2">Модель</th>
                      <th className="pb-2 font-medium px-2">Назва</th>
                      <th className="pb-2 font-medium px-2">Дисплей</th>
                      <th className="pb-2 font-medium px-2">АКБ</th>
                      <th className="pb-2 font-medium px-2">Зад. кришка</th>
                      <th className="pb-2 font-medium px-2">Спікер</th>
                      <th className="pb-2 font-medium px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredModels(brand.models).map((model: any, idx: number) => {
                      const isEditing = editingModel === `${brand.id}-${idx}`
                      const p = model.parts || {}
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/20">
                          <td className="py-1.5 pr-2">
                            {isEditing ? (
                              <Input value={model.modelCode} onChange={(e) => handleModelEdit(brand.id, idx, "modelCode", e.target.value)} className="h-7 text-xs w-20" />
                            ) : (
                              <span className="font-mono text-[11px]">{model.modelCode}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2">
                            {isEditing ? (
                              <Input value={model.modelName} onChange={(e) => handleModelEdit(brand.id, idx, "modelName", e.target.value)} className="h-7 text-xs w-36" />
                            ) : (
                              <span className="max-w-[120px] truncate block">{model.modelName}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">
                            {p.display ? `${p.display[0]?.price || p.display.copy || "?"}₴` : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">
                            {p.battery ? `${p.battery[0]?.price || p.battery.copy || "?"}₴` : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">
                            {p.back_cover ? `${p.back_cover[0]?.price || p.back_cover.copy || "?"}₴` : "—"}
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">{p.speaker ? `${p.speaker.price || "?"}₴` : "—"}</td>
                          <td className="py-1.5">
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleModelSave(brand.id)} className="p-1 hover:bg-green-100 rounded"><Check className="w-3 h-3 text-green-600" /></button>
                                  <button onClick={() => setEditingModel(null)} className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400" /></button>
                                </>
                              ) : (
                                <button onClick={() => setEditingModel(`${brand.id}-${idx}`)} className="p-1 hover:bg-accent rounded"><Edit3 className="w-3 h-3 text-muted-foreground" /></button>
                              )}
                              <button onClick={() => deleteModel(brand.id, idx)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}

// ========== Orders Tab ==========
const STATUS_CONFIG: Record<string, { label: string; color: string; next: string | null; prev: string | null }> = {
  accepted: { label: "Прийнято", color: "bg-blue-100 text-blue-700", next: "in_progress", prev: null },
  in_progress: { label: "В роботі", color: "bg-yellow-100 text-yellow-700", next: "ready", prev: "accepted" },
  ready: { label: "Готово", color: "bg-green-100 text-green-700", next: "handed_over", prev: "in_progress" },
  handed_over: { label: "Видано", color: "bg-gray-200 text-gray-800", next: null, prev: null },
}

// For client view
const CLIENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted: { label: "Прийнято", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В роботі", color: "bg-yellow-100 text-yellow-700" },
  ready: { label: "Готово", color: "bg-green-100 text-green-700" },
  handed_over: { label: "Отримано ✅", color: "bg-gray-200 text-gray-800" },
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [showArchived, setShowArchived] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [orderForm, setOrderForm] = useState({
    clientName: "", clientPhone: "", clientEmail: "", deviceModel: "", deviceIssue: "", price: 0,
  })
  const [reminderOrder, setReminderOrder] = useState<any | null>(null)
  const [reminderInterval, setReminderInterval] = useState(60)
  const [reminderUnit, setReminderUnit] = useState<"minutes" | "hours" | "days">("hours")

  useEffect(() => {
    const { db } = initFirebase()
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderForm.clientName.trim() || !orderForm.clientPhone.trim()) return
    const { db } = initFirebase()
    await addDoc(collection(db, "orders"), {
      ...orderForm,
      type: "repair",
      status: "accepted",
      clientId: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    setOrderForm({ clientName: "", clientPhone: "", clientEmail: "", deviceModel: "", deviceIssue: "", price: 0 })
    setShowCreateForm(false)
    sendTG(
      `<b>🆕 Нове замовлення (ремонт)!</b>\n\n` +
      `<b>Клієнт:</b> ${orderForm.clientName}\n` +
      `<b>Телефон:</b> ${orderForm.clientPhone}\n` +
      `<b>Email:</b> ${orderForm.clientEmail || "—"}\n` +
      `<b>Пристрій:</b> ${orderForm.deviceModel || "—"}\n` +
      `<b>Проблема:</b> ${orderForm.deviceIssue || "—"}\n` +
      `<b>Ціна:</b> ${orderForm.price || 0}₴`
    )
  }

  // ===== Status Management =====
  const changeStatus = async (orderId: string, currentStatus: string, direction: "next" | "prev" = "next") => {
    const config = STATUS_CONFIG[currentStatus]
    const targetStatus = direction === "next" ? config?.next : config?.prev
    if (!targetStatus) return
    const { db } = initFirebase()
    await updateDoc(doc(db, "orders", orderId), { status: targetStatus, updatedAt: Timestamp.now() })

      // При статусе "Готово" — автоматическое уведомление клиенту
    if (targetStatus === "ready") {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        await sendEmailNotification(
          order.clientEmail || order.email || "",
          order.clientName || order.name || "Клієнт",
          order.deviceModel || "",
          order
        )
        sendTG(
          `<b>✅ Замовлення готове!</b>\n\n` +
          `<b>Клієнт:</b> ${order.clientName || order.name || "—"}\n` +
          `<b>Телефон:</b> ${order.clientPhone || order.phone || "—"}\n` +
          `<b>Email:</b> ${order.clientEmail || order.email || "—"}\n` +
          `<b>Пристрій:</b> ${order.deviceModel || "—"}\n` +
          `<b>Ціна:</b> ${order.price || order.total || 0}₴\n\n` +
          `⚠️ Клієнт сповіщений! Нагадування вимкнені. Увімкніть вручну.`
        )

        // Push-сповіщення клієнту
        try {
          const q = query(
            collection(db, "user_push_subscriptions"),
            where("email", "==", order.clientEmail || order.email || "")
          )
          const snap = await getDocs(q)
          snap.forEach(async (d) => {
            const subData = d.data()
            if (subData.subscription) {
              const subscription = JSON.parse(subData.subscription)
              fetch("http://127.0.0.1:3999/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  subscription,
                  title: "✅ Ваше замовлення готове!",
                  body: `Телефон${order.deviceModel ? ` ${order.deviceModel}` : ""} готовий до видачі. Чекаємо на вас!`,
                  url: "/account",
                }),
              }).catch(() => {})
            }
          })
        } catch {}
      }
    }
  }

  // ===== Reminder Management =====
  const startReminder = async () => {
    if (!reminderOrder) return
    const mult = reminderUnit === "minutes" ? 1 : reminderUnit === "hours" ? 60 : 1440
    const intervalMinutes = reminderInterval * mult
    const { db } = initFirebase()
    await updateDoc(doc(db, "orders", reminderOrder.id), {
      reminderEnabled: true,
      reminderInterval: intervalMinutes,
      reminderCount: 0,
      lastReminderAt: Timestamp.now(),
      nextReminderAt: new Date(Date.now() + intervalMinutes * 60 * 1000),
    })
    await sendEmailNotification(
      reminderOrder.clientEmail || reminderOrder.email || "",
      reminderOrder.clientName || reminderOrder.name || "Клієнт",
      reminderOrder.deviceModel || "",
      reminderOrder
    )
    await updateDoc(doc(db, "orders", reminderOrder.id), {
      reminderCount: 1,
      lastReminderAt: Timestamp.now(),
      nextReminderAt: new Date(Date.now() + intervalMinutes * 60 * 1000),
    })
    sendTG(`⏰ Запущено нагадування для ${reminderOrder.clientName || "клієнта"} — кожні ${formatInterval(intervalMinutes)}`)
    setReminderOrder(null)
  }

  const stopReminder = async (orderId: string) => {
    const { db } = initFirebase()
    await updateDoc(doc(db, "orders", orderId), {
      reminderEnabled: false,
      nextReminderAt: null,
    })
  }

  const filtered = orders.filter(
    (o) => {
      // Фільтр архіву
      if (!showArchived && o.archived) return false
      // Пошук
      return (
        (o.clientName || o.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.clientPhone || o.phone || "").includes(search) ||
        (o.deviceModel || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.deviceIssue || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.items || []).some((i: any) => i.name?.toLowerCase().includes(search.toLowerCase()))
      )
    }
  )

  return (
    <>
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук замовлення..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} замовлень</p>
        <Button size="sm" variant={showArchived ? "default" : "outline"} onClick={() => setShowArchived(!showArchived)}>
          📦 {showArchived ? "Активні" : "Архів"}
        </Button>
        <Button size="sm" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-1" />
          {showCreateForm ? "Скасувати" : "Додати ремонт"}
        </Button>
      </div>

      {/* Create repair order form */}
      {showCreateForm && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="p-4">
            <form onSubmit={createOrder} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Ім'я клієнта *" value={orderForm.clientName} onChange={(e) => setOrderForm({ ...orderForm, clientName: e.target.value })} required />
                <Input placeholder="Телефон *" value={orderForm.clientPhone} onChange={(e) => setOrderForm({ ...orderForm, clientPhone: e.target.value })} required />
                <Input placeholder="Email" value={orderForm.clientEmail} onChange={(e) => setOrderForm({ ...orderForm, clientEmail: e.target.value })} />
                <Input placeholder="Модель пристрою" value={orderForm.deviceModel} onChange={(e) => setOrderForm({ ...orderForm, deviceModel: e.target.value })} />
                <Input placeholder="Проблема / що зробити" value={orderForm.deviceIssue} onChange={(e) => setOrderForm({ ...orderForm, deviceIssue: e.target.value })} />
                <Input type="number" placeholder="Ціна (грн)" value={orderForm.price || ""} onChange={(e) => setOrderForm({ ...orderForm, price: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" size="sm">Створити замовлення</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders list */}
      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Замовлень ще немає</p>}
      {filtered.map((order) => {
        const status = STATUS_CONFIG[order.status as string] || STATUS_CONFIG.accepted
        return (
          <Card key={order.id} className="mb-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{order.clientName || order.name || "—"}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    {order.type === "cart" && <span className="text-[10px] text-muted-foreground">🛒 Кошик</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{order.clientPhone || order.phone}</p>
                  {order.clientEmail && <p className="text-xs text-muted-foreground">{order.clientEmail}</p>}
                  {order.deviceModel && <p className="text-xs mt-1">📱 {order.deviceModel}{order.deviceIssue ? ` — ${order.deviceIssue}` : ""}</p>}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-1">
                      {order.items.map((item: any, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">• {item.name} ({item.quality}) — {item.price}₴</p>
                      ))}
                    </div>
                  )}
                  {order.message && <p className="text-xs text-muted-foreground mt-1">💬 {order.message}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{order.price || order.total || 0} ₴</p>
                  <p className="text-xs text-muted-foreground">
                    {order.createdAt ? new Date(order.createdAt.seconds * 1000 || order.createdAt).toLocaleDateString("uk-UA") : ""}
                  </p>
                  {status.next && (
                    <button
                      onClick={() => changeStatus(order.id, order.status || "accepted", "next")}
                      className="text-xs text-primary hover:text-primary/80 mt-2 underline underline-offset-2 block"
                    >
                      {status.next === "in_progress" ? "Взяти в роботу →" : status.next === "handed_over" ? "Видати клієнту →" : "Позначити готовим →"}
                    </button>
                  )}
                  {status.prev && (
                    <button
                      onClick={() => changeStatus(order.id, order.status || "accepted", "prev")}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1 underline underline-offset-2 block"
                    >
                      ← Повернути назад
                    </button>
                  )}
                  {!status.next && !status.prev && (
                    <div>
                      <p className="text-xs text-green-600 mt-2">✅ Виконано</p>
                      {!order.archived && (
                        <button
                          onClick={async () => {
                            const { db } = initFirebase()
                            await updateDoc(doc(db, "orders", order.id), { archived: true })
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground mt-1 underline underline-offset-2 block"
                        >
                          📦 Архівувати
                        </button>
                      )}
                    </div>
                  )}
                  {order.clientConfirmed && (
                    <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3 h-3" /> Клієнт підтвердив
                    </p>
                  )}
                  {order.status === "ready" && (
                    <div className="mt-2 border-t pt-2 space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        ⏰ Нагадування: {order.reminderCount || 0}× {order.reminderEnabled ? `/ ${formatInterval(order.reminderInterval || 1440)}` : "(вимкнено)"}
                      </p>
                      {order.reminderEnabled && order.nextReminderAt && (
                        <p className="text-[10px] text-muted-foreground">
                          Наступне: {new Date(order.nextReminderAt.seconds * 1000 || order.nextReminderAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {!order.reminderEnabled && (
                          <button onClick={() => { setReminderOrder(order); setReminderInterval(60); setReminderUnit("hours") }} className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2">
                            🔔 Запустити нагадування
                          </button>
                        )}
                        {order.reminderEnabled && (
                          <button onClick={() => stopReminder(order.id)} className="text-[10px] text-red-500 hover:text-red-700 underline underline-offset-2">
                            🔕 Зупинити
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>

    {/* Reminder dialog */}
    {reminderOrder && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReminderOrder(null)}>
        <div className="bg-background rounded-xl shadow-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-semibold text-lg mb-1">🔔 Нагадування</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Для {reminderOrder.clientName || "клієнта"} — {reminderOrder.deviceModel || ""}
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex gap-2">
              <Input type="number" min={1} value={reminderInterval} onChange={(e) => setReminderInterval(parseInt(e.target.value) || 1)} className="w-24" />
              <select value={reminderUnit} onChange={(e) => setReminderUnit(e.target.value as any)} className="flex-1 rounded-md border bg-background px-3 text-sm">
                <option value="minutes">Хвилини</option>
                <option value="hours">Години</option>
                <option value="days">Дні</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Нагадування кожні {formatInterval(reminderInterval * (reminderUnit === "minutes" ? 1 : reminderUnit === "hours" ? 60 : 1440))}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setReminderOrder(null)}>Скасувати</Button>
            <Button className="flex-1" onClick={startReminder}>Запустити</Button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

// ========== Phones Tab (gallery) ==========
function PhonesTab() {
  const [phones, setPhones] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ brand: "", model: "", storage: "", color: "", condition: "", price: 0, description: "", imageUrls: [] as string[], available: true })
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  // DeepSeek AI для заповнення характеристик (зміни ключ у файлі якщо треба)
  const AI_API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'

  const autoFillAI = async () => {
    const query = `${form.brand} ${form.model} ${form.storage}`.trim()
    if (!query) return
    setAiLoading(true)
    try {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ти assistant для адмін-панелі магазину ремонту телефонів. Користувач ввів назву телефону. Поверни ТІЛЬКИ JSON з полями: {"brand":"","model":"","storage":"","description":"детальний опис характеристик українською (екран, батарея, камера, процесор, пам\'ять, вага, ОС)"}. Якщо щось невідомо — залиш порожнім. Не додавай пояснень, тільки JSON.' },
            { role: 'user', content: `Телефон: ${query}` },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      })
      const data = await resp.json()
      const text = data?.choices?.[0]?.message?.content || ''
      // Парсимо JSON з відповіді
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        setForm((prev) => ({
          ...prev,
          brand: result.brand || prev.brand,
          model: result.model || prev.model,
          storage: result.storage || prev.storage,
          description: result.description || prev.description,
        }))
      }
    } catch (e) {
      console.error('AI error:', e)
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    const { db } = initFirebase()
    const q = query(collection(db, "gallery_phones"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(q, (snap) => setPhones(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
    return unsub
  }, [])

  const resetForm = () => setForm({ brand: "", model: "", storage: "", color: "", condition: "", price: 0, description: "", imageUrls: [], available: true })

  const handleSave = async () => {
    if (!form.brand.trim() || !form.model.trim()) return
    const { db } = initFirebase()
    const data = { ...form, createdAt: Timestamp.now() }
    if (editing) {
      await updateDoc(doc(db, "gallery_phones", editing), data)
    } else {
      await addDoc(collection(db, "gallery_phones"), data)
    }
    resetForm(); setShowForm(false); setEditing(null)
  }

  const handleEdit = (p: any) => {
    setForm({ brand: p.brand, model: p.model, storage: p.storage || "", color: p.color || "", condition: p.condition || "", price: p.price || 0, description: p.description || "", imageUrls: p.imageUrls || (p.imageUrl ? [p.imageUrl] : []), available: p.available !== false })
    setEditing(p.id); setShowForm(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith("image/")) { alert("Тільки зображення"); return }
    if (file.size > 5 * 1024 * 1024) { alert("Фото не більше 5MB"); return }

    setUploading(true)
    setUploadProgress(0)

    try {
      const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
      const TG_CHAT = 5651005104

      // Відправляємо фото в Telegram через FormData
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('chat_id', String(TG_CHAT))

      const resp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData,
      })
      const json = await resp.json()
      if (!json.ok) throw new Error(json.description || 'Upload failed')

      // Отримуємо file_id останньої (найбільшої) версії фото
      const photoArr = json.result.photo
      const largest = photoArr[photoArr.length - 1]
      const fileId = largest.file_id

      // Отримуємо URL файлу
      const fileResp = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${fileId}`)
      const fileJson = await fileResp.json()
      const photoUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${fileJson.result.file_path}`

      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, photoUrl] }))
      setUploading(false)
    } catch {
      alert("Помилка завантаження фото")
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }))
  }

  const handleDelete = async (id: string) => {
    const { db } = initFirebase()
    await deleteDoc(doc(db, "gallery_phones", id))
  }

  const seedFromStatic = async () => {
    const { db } = initFirebase()
    const { phones: staticPhones } = await import('@/app/data')
    for (const p of staticPhones) {
      await addDoc(collection(db, "gallery_phones"), { ...p, createdAt: Timestamp.now() })
    }
  }

  const filtered = phones.filter((p) =>
    `${p.brand} ${p.model} ${p.storage || ""}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Пошук телефону..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} телефонів</p>
        <Button size="sm" variant="outline" onClick={seedFromStatic}>Завантажити з даних</Button>
        <Button size="sm" onClick={() => { resetForm(); setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4 mr-1" />Додати</Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="accent-primary" />
          AI-заповнення
        </label>
      </div>

      {showForm && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <Input placeholder="Бренд *" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              <Input placeholder="Модель *" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              <div className="relative">
                <Input placeholder="Пам'ять" value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} />
                {aiEnabled && (form.model || form.brand) && (
                  <button
                    onClick={autoFillAI}
                    disabled={aiLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full px-2.5 py-1 transition-colors disabled:opacity-50"
                    title="Автоматично заповнити характеристики"
                  >
                    {aiLoading ? '⏳' : '🤖'} AI
                  </button>
                )}
              </div>
              <Input placeholder="Колір" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              <Input placeholder="Стан" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} />
              <Input type="number" placeholder="Ціна (грн)" value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
              <Input placeholder="Опис" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-3" />
            </div>
            <div className="mb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {form.imageUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url + "?v=" + encodeURIComponent(url)} alt="" className="h-16 w-16 rounded-lg object-cover border" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {form.imageUrls.length === 0 && (
                  <div className="h-16 w-16 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/50 text-[10px] text-center leading-tight p-1">
                    Немає фото
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="relative cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" disabled={uploading} />
                  <div className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                    {uploading ? (
                      <>⏳ Завантаження...</>
                    ) : (
                      <>📁 Додати фото</>
                    )}
                  </div>
                </label>
                <span className="text-[10px] text-muted-foreground">до 5MB, фото зберігаються в Telegram</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                В наявності
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null) }}><X className="w-4 h-4 mr-1" />Скасувати</Button>
              <Button size="sm" onClick={handleSave}><Check className="w-4 h-4 mr-1" />{editing ? "Зберегти" : "Додати"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Модель</th>
              <th className="pb-2 font-medium">Пам'ять</th>
              <th className="pb-2 font-medium">Стан</th>
              <th className="pb-2 font-medium">Ціна</th>
              <th className="pb-2 font-medium">Статус</th>
              <th className="pb-2 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">Телефонів не знайдено</td></tr>}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-muted/30">
                <td className="py-2.5 font-medium">{p.brand} {p.model}</td>
                <td className="py-2.5 text-muted-foreground">{p.storage || "—"}</td>
                <td className="py-2.5 text-muted-foreground">{p.condition || "—"}</td>
                <td className="py-2.5 font-medium">{p.price} ₴</td>
                <td className="py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.available !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.available !== false ? "В наявності" : "Немає"}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1 hover:bg-accent rounded"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ========== Admins Management (тільки superadmin) ==========
function AdminsManagement() {
  const { user } = useAuth()
  const [admins, setAdmins] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const isSuper = isSuperadmin(user?.email)

  useEffect(() => {
    import('@/lib/admin').then((m) => m.loadAdmins().then(setAdmins).finally(() => setLoading(false)))
  }, [])

  const saveAdmins = async (emails: string[]) => {
    const { initFirebase } = await import('@/lib/firebase')
    const { doc, setDoc } = await import('firebase/firestore')
    const { db } = initFirebase()
    await setDoc(doc(db, 'config', 'admins'), { emails })
    setAdmins(emails)
  }

  const addAdmin = () => {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    if (admins.includes(email)) return
    saveAdmins([...admins, email])
    setNewEmail("")
  }

  const removeAdmin = (email: string) => {
    if (email === 'fit5667604@gmail.com') return
    saveAdmins(admins.filter((e) => e !== email))
  }

  if (!isSuper) return null
  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 rounded-full bg-muted animate-pulse" /></div>

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-bold mb-4">Керування адміністраторами</h2>
        <p className="text-sm text-muted-foreground mb-4">Ви — суперкористувач. Тільки ви можете додавати та видаляти адмінів.</p>

        <div className="flex gap-2 mb-6">
          <Input placeholder="Email нового адміна" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addAdmin() }} className="flex-1" />
          <Button onClick={addAdmin} disabled={!newEmail.trim()}>Додати</Button>
        </div>

        <div className="space-y-2">
          {admins.map((email) => (
            <div key={email} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-sm">{email}</span>
                {email === 'fit5667604@gmail.com' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">Superadmin</span>
                )}
              </div>
              {email !== 'fit5667604@gmail.com' && (
                <button onClick={() => removeAdmin(email)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">Видалити</button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ========== Main Admin Page ==========
export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState("clients")
  const [totalUnread, setTotalUnread] = useState(0)
  const { admins, loading: adminsLoading } = useAdmins()
  const isSuper = isSuperadmin(user?.email)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get("tab")
    if (t) setTab(t)
  }, [])

  // Підрахунок непрочитаних повідомлень у всіх чатах
  useEffect(() => {
    const { db } = initFirebase()
    const q = query(collection(db, "chats"), orderBy("lastMessageAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      let total = 0
      snap.docs.forEach((d) => {
        const data = d.data()
        total += (data.unreadAdmin || 0)
      })
      setTotalUnread(total)
    })
    return unsub
  }, [])

  if (adminsLoading) return <div className="min-h-screen flex items-center justify-center bg-muted/30"><div className="w-12 h-12 rounded-full bg-muted animate-pulse" /></div>
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-muted/30"><div className="w-12 h-12 rounded-full bg-muted animate-pulse" /></div>
  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-3">Доступ обмежено</h1>
        <p className="text-muted-foreground mb-6">Увійдіть в акаунт для доступу до адмін-панелі</p>
        <Button asChild><Link href="/">На головну</Link></Button>
      </div>
    </div>
  )
  if (!admins.includes(user.email || "")) return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-3">Немає доступу</h1>
        <p className="text-muted-foreground mb-6">Ця сторінка доступна тільки адміністратору</p>
        <Button asChild><Link href="/">На головну</Link></Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            На сайт
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Адмін-панель</h1>
        <Tabs value={tab} onValueChange={setTab}>
          <div className="mb-6 overflow-x-auto pb-1">
            <TabsList className="w-fit">
              <TabsTrigger value="clients"><Users className="w-4 h-4" />Клієнти</TabsTrigger>
              <TabsTrigger value="calculator"><Calculator className="w-4 h-4" />Калькулятор</TabsTrigger>
              <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4" />Замовлення</TabsTrigger>
              <TabsTrigger value="phones"><Smartphone className="w-4 h-4" />Телефони</TabsTrigger>
              <TabsTrigger value="stats"><Eye className="w-4 h-4" />Статистика</TabsTrigger>
              {isSuper && <TabsTrigger value="admins"><Users className="w-4 h-4" />Адміни</TabsTrigger>}
              <TabsTrigger value="chats" className="relative">
                <MessageCircle className="w-4 h-4" />Чати
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="clients"><UsersTab onSetTab={setTab} /></TabsContent>
          <TabsContent value="calculator"><CalculatorTab /></TabsContent>
          <TabsContent value="orders"><OrdersTab /></TabsContent>
          <TabsContent value="phones"><PhonesTab /></TabsContent>
          <TabsContent value="stats"><VisitCalendar /></TabsContent>
          <TabsContent value="chats"><AdminChat /></TabsContent>
          {isSuper && <TabsContent value="admins"><AdminsManagement /></TabsContent>}
        </Tabs>
      </main>
    </div>
  )
}
