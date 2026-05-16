// src/components/cart/CartDrawer.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ShoppingCart, X, Plus, Trash2, Send, Loader2, ShoppingBag, User, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

export function CartDrawer() {
  const { items, removeItem, clearCart, totalPrice, itemCount, checkout, checkingOut } = useCart()
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"cart" | "checkout">("cart")

  // Checkout form
  const [name, setName] = useState(profile?.name || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [email, setEmail] = useState(profile?.email || "")
  const [message, setMessage] = useState("")

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      toast.error("Заповніть ім'я та телефон")
      return
    }
    const err = await checkout(name.trim(), phone.trim(), email.trim(), message.trim())
    if (err) {
      toast.error(err)
    } else {
      toast.success("Замовлення оформлено! Я зв'яжуся з вами.")
      setStep("cart")
      setOpen(false)
    }
  }

  const openDrawer = () => {
    setOpen(true)
    setStep("cart")
    setName(profile?.name || "")
    setPhone(profile?.phone || "")
    setEmail(profile?.email || "")
  }

  return (
    <>
      {/* Cart button in header */}
      <button
        onClick={openDrawer}
        className="relative inline-flex items-center justify-center rounded-lg border bg-background shadow-xs h-8 w-8 sm:h-9 sm:w-9 hover:bg-accent transition-colors"
        aria-label="Кошик"
      >
        <ShoppingCart className="w-4 h-4" />
        {itemCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary text-[9px] sm:text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-lg">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Кошик
                {itemCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">({itemCount})</span>
                )}
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === "cart" ? (
              <>
                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {items.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Кошик порожній</p>
                      <p className="text-xs mt-1">Оберіть запчастини в калькуляторі</p>
                    </div>
                  )}
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.brand} {item.modelName}</p>
                        <p className="text-xs text-muted-foreground">{item.partName}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{item.total} ₴</p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-red-400 hover:text-red-600 mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div className="border-t p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Всього:</span>
                      <span className="text-xl font-bold text-primary">{totalPrice} ₴</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearCart} className="flex-1">
                        Очистити
                      </Button>
                      <Button onClick={() => setStep("checkout")} className="flex-1">
                        <Send className="w-4 h-4 mr-1" />
                        Оформити
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Checkout form */
              <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cart-name">Ім'я *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="cart-name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" required placeholder="Ваше ім'я" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cart-phone">Телефон *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="cart-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" required placeholder="+38 (0XX) XXX-XX-XX" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cart-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="cart-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="email@example.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cart-message">Коментар</Label>
                    <Textarea id="cart-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Додаткова інформація..." />
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Сума:</span>
                      <span className="text-lg font-bold text-primary">{totalPrice} ₴</span>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep("cart")}>
                        ← Назад
                      </Button>
                      <Button type="submit" className="flex-1" disabled={checkingOut}>
                        {checkingOut ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Оформлення...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-1" /> Замовити</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
