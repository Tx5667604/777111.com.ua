// src/lib/cart-context.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "./auth-context"
import { initFirebase } from "./firebase"
import { doc, setDoc, collection, addDoc, Timestamp } from "firebase/firestore"

export interface CartItem {
  id: string
  brand: string
  modelCode: string
  modelName: string
  partCategory: string
  partName: string
  quality: string
  label: string
  partCost: number
  laborCost: number
  total: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  clearCart: () => void
  totalPrice: number
  itemCount: number
  checkout: (name: string, phone: string, email: string, message: string) => Promise<string>
  checkingOut: boolean
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  totalPrice: 0,
  itemCount: 0,
  checkout: async () => "",
  checkingOut: false,
})

const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
const TG_CHAT_ID = 5651005104

function sendTG(text: string) {
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
  }).catch(() => {})
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [checkingOut, setCheckingOut] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart")
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, loaded])

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = `${item.brand}-${item.modelCode}-${item.partCategory}-${item.quality}-${Date.now()}`
    setItems((prev) => [...prev, { ...item, id }])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem("cart")
  }, [])

  const totalPrice = items.reduce((sum, i) => sum + i.total, 0)
  const itemCount = items.length

  const checkout = async (name: string, phone: string, email: string, message: string): Promise<string> => {
    if (items.length === 0) return "Корзина порожня"
    setCheckingOut(true)
    try {
      const orderData = {
        type: "cart",
        status: "accepted",
        clientName: name,
        clientPhone: phone,
        clientEmail: email || "",
        name,
        phone,
        email: email || "",
        message: message || "",
        items: items.map((i) => ({
          name: `${i.brand} ${i.modelName} — ${i.partName}`,
          quality: i.label,
          price: i.total,
        })),
        total: totalPrice,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: Timestamp.now(),
      }

      // Save to Firestore
      const { db } = initFirebase()
      await addDoc(collection(db, "orders"), orderData)

      // Send to Telegram
      const itemsList = items.map((i) => 
        `• ${i.brand} ${i.modelName} — ${i.partName} (${i.label}): ${i.total}₴`
      ).join("\n")

      const authInfo = user
        ? `✅ Користувач: ${profile?.name || user.email}`
        : "❌ Не авторизований"

      sendTG(
        `<b>🛒 НОВЕ ЗАМОВЛЕННЯ!</b>\n\n` +
        `<b>Ім'я:</b> ${name}\n` +
        `<b>Телефон:</b> ${phone}\n` +
        `<b>Email:</b> ${email || "—"}\n` +
        `<b>Повідомлення:</b> ${message || "—"}\n\n` +
        `<b>Товари:</b>\n${itemsList}\n\n` +
        `<b>Сума:</b> ${totalPrice}₴\n` +
        `<b>Статус:</b> ${authInfo}`
      )

      clearCart()
      setCheckingOut(false)
      return ""
    } catch (err: any) {
      setCheckingOut(false)
      return err.message || "Помилка оформлення замовлення"
    }
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, totalPrice, itemCount, checkout, checkingOut }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within CartProvider")
  return context
}
