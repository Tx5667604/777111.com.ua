// src/app/account/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { initFirebase } from "@/lib/firebase"
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, Timestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Mail,
  Phone,
  ShoppingBag,
  Wallet,
  Package,
  LogOut,
  ArrowLeft,
  History,
  Plus,
  ClipboardList,
  Smartphone,
  CheckCircle,
} from "lucide-react"
import NotificationSubscribe from "@/components/NotificationSubscribe"

// Вспомогательные секции (заглушки для будущего функционала)
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// ========== Orders List Component ==========
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  accepted: { label: "Прийнято", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В роботі", color: "bg-yellow-100 text-yellow-700" },
  ready: { label: "Готово", color: "bg-green-100 text-green-700" },
  handed_over: { label: "Отримано ✅", color: "bg-gray-200 text-gray-800" },
}

function OrdersList({ userId, userEmail }: { userId?: string | null; userEmail?: string | null }) {
  const [orders, setOrders] = useState<any[]>([])
  const [confirming, setConfirming] = useState<string | null>(null)

  const confirmReady = async (orderId: string) => {
    setConfirming(orderId)
    try {
      const { db } = initFirebase()
      await updateDoc(doc(db, "orders", orderId), {
        clientConfirmed: true,
        confirmedAt: Timestamp.now(),
      })
    } catch {}
    setConfirming(null)
  }

  useEffect(() => {
    if (!userId && !userEmail) return
    const { db } = initFirebase()

    // Try by userId first, fallback to email
    if (userId) {
      const q = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      )
      const unsub = onSnapshot(q, (snap) => {
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setOrders(results)
      })
      return unsub
    }

    // Fallback: match by email
    if (userEmail) {
      const q = query(
        collection(db, "orders"),
        where("userEmail", "==", userEmail),
        orderBy("createdAt", "desc")
      )
      const unsub = onSnapshot(q, (snap) => {
        const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setOrders(results)
      })
      return unsub
    }
  }, [userId, userEmail])

  if (orders.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">У вас ще немає замовлень</p>
        <p className="text-xs mt-1">Після оформлення ремонту статуси з'являться тут</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const st = STATUS_LABELS[order.status] || STATUS_LABELS.accepted
        return (
          <div key={order.id} className="p-3 bg-muted/30 rounded-xl border">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {order.deviceModel || "Ремонт телефону"}
                  </span>
                </div>
                {order.deviceIssue && (
                  <p className="text-xs text-muted-foreground">{order.deviceIssue}</p>
                )}
                {order.items && order.items.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items.length} позицій
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{order.price || order.total || 0} ₴</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${st.color}`}>
                  {st.label}
                </span>
                {order.status === "ready" && (
                  <div className="mt-2">
                    {order.clientConfirmed ? (
                      <p className="text-[10px] text-green-600 flex items-center gap-1 justify-end">
                        <CheckCircle className="w-3 h-3" /> Підтверджено
                      </p>
                    ) : (
                      <button
                        onClick={() => confirmReady(order.id)}
                        disabled={confirming === order.id}
                        className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2"
                      >
                        {confirming === order.id ? "..." : "✅ Я бачив, дякую"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {order.createdAt ? new Date(order.createdAt.seconds * 1000 || order.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long" }) : ""}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function AccountPage() {
  const { user, profile, loading, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // Если не авторизован и загрузка завершена — показать приглашение
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Увійдіть в акаунт</h1>
          <p className="text-muted-foreground mb-6">
            Щоб переглянути особистий кабінет, увійдіть через Google або зареєструйтеся
          </p>
          <Button asChild>
            <Link href="/">На головну</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.email || user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Вийти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent h-24" />
            <CardContent className="p-6 -mt-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-background shadow-lg overflow-hidden bg-background">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                  <h1 className="text-2xl font-bold truncate">
                    {profile?.name || "Користувач"}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {profile?.email || user?.email}
                  </p>
                  {profile?.phone ? (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {profile.phone}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <input
                        type="tel"
                        placeholder="+38 (0XX) XXX-XX-XX"
                        className="bg-transparent border-b border-dashed border-muted-foreground/30 text-sm outline-none focus:border-primary w-40"
                        onBlur={async (e) => {
                          const val = e.target.value.trim()
                          if (val && user) {
                            const { doc, updateDoc } = await import("firebase/firestore")
                            const { initFirebase: init } = await import("@/lib/firebase")
                            const { db } = init()
                            await updateDoc(doc(db, "users", user.uid), { phone: val })
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                        }}
                      />
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full whitespace-nowrap">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Онлайн
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Push Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Сповіщення про статус замовлення</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Отримуйте Push-повідомлення коли замовлення готове
                </p>
              </div>
              <NotificationSubscribe />
            </CardContent>
          </Card>
        </motion.div>

        {/* Dashboard sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Order History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionCard icon={ShoppingBag} title="Мої замовлення">
              <OrdersList userId={user?.uid} userEmail={user?.email} />
            </SectionCard>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
