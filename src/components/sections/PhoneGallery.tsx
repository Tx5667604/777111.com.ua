'use client'

import { useState, useEffect } from 'react'
import { initFirebase } from '@/lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Info, ShoppingCart, CreditCard, User, Phone, Mail, Loader2, Send, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { trackPhoneClick } from '@/lib/routeTracker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { addDoc, Timestamp } from 'firebase/firestore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Phone {
  id: string
  brand: string
  model: string
  storage?: string
  color?: string
  condition?: string
  price: number
  imageUrl?: string | null
  imageUrls?: string[]
  description?: string
  available?: boolean
}

const brandLogos: Record<string, string> = {
  Apple: '🍎',
  Samsung: '📱',
  Xiaomi: '🤖',
}

const conditionStyles: Record<string, { label: string; color: string }> = {
  'Відмінний': { label: 'Відмінний', color: 'bg-green-100 text-green-700' },
  'Як новий': { label: 'Як новий', color: 'bg-blue-100 text-blue-700' },
  'Добрий': { label: 'Добрий', color: 'bg-yellow-100 text-yellow-700' },
}

export default function PhoneGallery() {
  const [phones, setPhones] = useState<Phone[]>([])
  const [filter, setFilter] = useState('all')
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [buyPhone, setBuyPhone] = useState<Phone | null>(null)

  const getFirstImage = (phone: Phone): string | null => {
    if (phone.imageUrls && phone.imageUrls.length > 0) return phone.imageUrls[0]
    if (phone.imageUrl) return phone.imageUrl
    return null
  }
  const { addItem } = useCart()
  const { user, profile } = useAuth()
  const [buyForm, setBuyForm] = useState({ name: "", phone: "", email: "" })
  const [buyLoading, setBuyLoading] = useState(false)

  const addPhoneToCart = (phone: Phone) => {
    addItem({
      brand: phone.brand,
      modelCode: phone.model,
      modelName: phone.model,
      partCategory: "phone_sale",
      partName: `${phone.brand} ${phone.model}${phone.storage ? ` ${phone.storage}` : ""}`,
      quality: "original",
      label: phone.condition || "Відновлений",
      partCost: phone.price,
      laborCost: 0,
      total: phone.price,
    })
    toast.success(`${phone.brand} ${phone.model} додано в кошик!`, { duration: 2000 })
  }

  const openBuyDialog = (phone: Phone) => {
    setBuyForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
    })
    setBuyPhone(phone)
  }

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyForm.name.trim() || !buyForm.phone.trim()) {
      toast.error("Заповніть ім'я та телефон")
      return
    }
    if (!buyPhone) return

    setBuyLoading(true)
    try {
      const { db } = initFirebase()
      await addDoc(collection(db, "orders"), {
        type: "cart",
        status: "accepted",
        clientName: buyForm.name.trim(),
        clientPhone: buyForm.phone.trim(),
        clientEmail: buyForm.email.trim(),
        name: buyForm.name.trim(),
        phone: buyForm.phone.trim(),
        email: buyForm.email.trim(),
        items: [{ name: `${buyPhone.brand} ${buyPhone.model}${buyPhone.storage ? ` ${buyPhone.storage}` : ""}`, quality: buyPhone.condition || "Відновлений", price: buyPhone.price }],
        total: buyPhone.price,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: Timestamp.now(),
      })

      const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
      const TG_CHAT_ID = 5651005104
      const authStatus = user ? `✅ ${profile?.name || user.email}` : "❌ Не авторизований"
      fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: `<b>🛒 НОВЕ ЗАМОВЛЕННЯ ТЕЛЕФОНУ!</b>\n\n<b>Товар:</b> ${buyPhone.brand} ${buyPhone.model}\n<b>Ціна:</b> ${buyPhone.price}₴\n<b>Ім'я:</b> ${buyForm.name}\n<b>Телефон:</b> ${buyForm.phone}\n<b>Email:</b> ${buyForm.email || "—"}\n<b>Статус:</b> ${authStatus}`,
          parse_mode: 'HTML'
        })
      }).catch(() => {})

      toast.success("Замовлення оформлено! Я зв'яжуся з вами.")
      setBuyPhone(null)
    } catch {
      toast.error("Помилка. Спробуйте ще раз.")
    }
    setBuyLoading(false)
  }

  // Load phones ONLY from Firestore
  useEffect(() => {
    try {
      const { db } = initFirebase()
      const q = query(collection(db, "gallery_phones"), orderBy("createdAt", "desc"))
      const unsub = onSnapshot(q, (snap) => {
        const fbPhones = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Phone))
        if (fbPhones.length > 0) setPhones(fbPhones)
      })
      return unsub
    } catch {}
  }, [])

  const brands = [...new Set(phones.map((p) => p.brand))]
  const filteredPhones = filter === 'all'
    ? phones.filter(p => p.available !== false)
    : phones.filter((p) => p.brand === filter && p.available !== false)

  if (phones.length === 0) return null

  return (
    <section id="gallery" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Каталог
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Відновлені телефони
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Якісні відновлені пристрої за доступними цінами з гарантією
          </p>
        </motion.div>

        {/* Brand tabs */}
        {brands.length > 1 && (
          <Tabs value={filter} onValueChange={setFilter} className="mb-8">
            <TabsList className="justify-center">
              <TabsTrigger value="all">Всі</TabsTrigger>
              {brands.map((brand) => (
                <TabsTrigger key={brand} value={brand}>
                  {brandLogos[brand] || '📱'} {brand}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Phone grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPhones.map((phone) => {
              const style = conditionStyles[phone.condition || ''] || { label: phone.condition || '—', color: 'bg-gray-100 text-gray-700' }
              return (
                <motion.div
                  key={phone.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full cursor-pointer" onClick={() => setSelectedPhone(phone)}>
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted/30 relative overflow-hidden">
                      {phone.imageUrl || (phone.imageUrls && phone.imageUrls.length > 0) ? (
                        <img
                          src={(getFirstImage(phone) || '') + "?v=" + encodeURIComponent(getFirstImage(phone) || '')}
                          alt={`${phone.brand} ${phone.model}`}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Smartphone className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 font-normal ${style.color}`}>
                        {style.label}
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{brandLogos[phone.brand] || '📱'}</span>
                        <span className="text-xs text-muted-foreground">{phone.brand}</span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                        {phone.brand} {phone.model}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        {phone.storage && <span>{phone.storage}</span>}
                        {phone.color && <><span>•</span><span>{phone.color}</span></>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-primary">
                          {phone.price.toLocaleString('uk-UA')} ₴
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPhone(phone)}
                          >
                            <Info className="w-3.5 h-3.5 mr-1" />
                            Деталі
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addPhoneToCart(phone)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBuyDialog(phone)}
                            className="border-primary/50 text-primary hover:bg-primary/5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedPhone} onOpenChange={(open) => { if (!open) setGalleryIndex(0); setSelectedPhone(null) }}>
          {selectedPhone && (
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedPhone.brand} {selectedPhone.model}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Gallery */}
                {(selectedPhone.imageUrl || (selectedPhone.imageUrls && selectedPhone.imageUrls.length > 0)) && (
                  <div className="relative">
                    <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                      {(() => {
                        const imgs = selectedPhone.imageUrls || (selectedPhone.imageUrl ? [selectedPhone.imageUrl] : [])
                        return imgs.length > 0 ? (
                          <img
                            src={imgs[galleryIndex] + "?v=" + encodeURIComponent(imgs[galleryIndex])}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Smartphone className="w-16 h-16 text-muted-foreground/30" />
                          </div>
                        )
                      })()}
                    </div>
                    {(() => {
                      const imgs = selectedPhone.imageUrls || (selectedPhone.imageUrl ? [selectedPhone.imageUrl] : [])
                      if (imgs.length <= 1) return null
                      return (
                        <div className="absolute inset-0">
                          <button
                            onClick={() => setGalleryIndex((galleryIndex - 1 + imgs.length) % imgs.length)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors shadow"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setGalleryIndex((galleryIndex + 1) % imgs.length)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors shadow"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {imgs.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setGalleryIndex(i)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  i === galleryIndex ? 'bg-primary' : 'bg-muted-foreground/40'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Пам'ять</p>
                    <p className="font-medium">{selectedPhone.storage || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Колір</p>
                    <p className="font-medium">{selectedPhone.color || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Стан</p>
                    <p className="font-medium">{selectedPhone.condition || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ціна</p>
                    <p className="font-bold text-lg text-primary">{selectedPhone.price.toLocaleString('uk-UA')} ₴</p>
                  </div>
                </div>
                {selectedPhone.description && (
                  <p className="text-sm text-muted-foreground">{selectedPhone.description}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => { addPhoneToCart(selectedPhone); setSelectedPhone(null) }} className="flex-1">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Додати в кошик
                  </Button>
                  <Button asChild variant="outline">
                    <a href="tel:+380960777111" onClick={trackPhoneClick}>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Зателефонувати
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

        {/* Buy Dialog */}
        <Dialog open={!!buyPhone} onOpenChange={() => setBuyPhone(null)}>
          {buyPhone && (
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Купити {buyPhone.brand} {buyPhone.model}
                </DialogTitle>
                <DialogDescription>
                  {buyPhone.storage && `${buyPhone.storage} • `}{buyPhone.price.toLocaleString('uk-UA')} ₴
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBuy} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ім'я *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={buyForm.name} onChange={(e) => setBuyForm({ ...buyForm, name: e.target.value })} className="pl-9" required placeholder="Ваше ім'я" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Телефон *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={buyForm.phone} onChange={(e) => setBuyForm({ ...buyForm, phone: e.target.value })} className="pl-9" required placeholder="+38 (0XX) XXX-XX-XX" type="tel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={buyForm.email} onChange={(e) => setBuyForm({ ...buyForm, email: e.target.value })} className="pl-9" placeholder="email@example.com" type="email" />
                  </div>
                </div>
                {user && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    ✅ Авторизовано як {profile?.name || user.email}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={buyLoading}>
                  {buyLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Оформлення...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Замовити {buyPhone.price.toLocaleString('uk-UA')} ₴</>
                  )}
                </Button>
              </form>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </section>
  )
}
