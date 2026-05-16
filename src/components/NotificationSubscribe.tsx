// src/components/NotificationSubscribe.tsx
"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const VAPID_PUBLIC_KEY = "BFEfOSwm3Tc9ZDxk8SkNL07qsw5x-3maAE6i31QLSyolp8Ga8Ek-kZvc0tj2lBcjZcPGRpILmdv8ApXN7B749Cc"

export default function NotificationSubscribe() {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false)
      return
    }
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub)
      })
    })
  }, [])

  const subscribe = async () => {
    if (!user) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        alert("Будь ласка, дозвольте сповіщення в налаштуваннях браузера")
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Save subscription to Firestore under user doc
      const { doc, setDoc } = await import("firebase/firestore")
      const { initFirebase } = await import("@/lib/firebase")
      const { db } = initFirebase()

      await setDoc(
        doc(db, "user_push_subscriptions", user.uid || user.email || "anon"),
        {
          subscription: JSON.stringify(sub),
          email: user.email,
          name: user.displayName || "",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )

      setSubscribed(true)
    } catch (e: any) {
      console.error("Push subscribe error:", e)
      alert("Не вдалося підписатися на сповіщення: " + (e.message || ""))
    }
    setLoading(false)
  }

  const unsubscribe = async () => {
    if (!user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()

      // Remove from Firestore
      const { deleteDoc, doc } = await import("firebase/firestore")
      const { initFirebase } = await import("@/lib/firebase")
      const { db } = initFirebase()

      await deleteDoc(doc(db, "user_push_subscriptions", user.uid || user.email || "anon"))
      setSubscribed(false)
    } catch {}
    setLoading(false)
  }

  if (!supported) return null
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {subscribed ? (
        <Button variant="outline" size="sm" onClick={unsubscribe} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
          <span className="hidden sm:inline">Вимкнути сповіщення</span>
        </Button>
      ) : (
        <Button size="sm" onClick={subscribe} disabled={loading} className="bg-primary hover:bg-primary/90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          <span className="hidden sm:inline">Отримувати сповіщення</span>
        </Button>
      )}
    </div>
  )
}

// Helper: base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}
