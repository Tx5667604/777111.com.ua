'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Smartphone, Wrench, Calculator } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  phoneModel: string
  repairType: string
  estimatedPrice?: number
}

const TG_TOKEN = '8670354731:AAF1gyLmL30HweAgC2VPbTkL2efXNlo8VkU'
const TG_CHAT_ID = 5651005104

async function sendTG(text: string, imageBlob?: Blob) {
  try {
    if (imageBlob) {
      const formData = new FormData()
      formData.append('chat_id', String(TG_CHAT_ID))
      formData.append('photo', imageBlob, 'photo.jpg')
      formData.append('caption', text)
      formData.append('parse_mode', 'HTML')
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
        method: 'POST', body: formData
      })
    } else {
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
      })
    }
  } catch {}
}

export default function OrderFormDialog({
  open,
  onOpenChange,
  phoneModel,
  repairType,
  estimatedPrice,
}: OrderFormDialogProps) {
  const [phone, setPhone] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      toast.error('Будь ласка, вкажіть номер телефону')
      return
    }

    setLoading(true)

    let imageBlob: Blob | undefined
    if (imagePreview) {
      try {
        const resp = await fetch(imagePreview)
        imageBlob = await resp.blob()
      } catch {}
    }

    await new Promise((resolve) => setTimeout(resolve, 800))

    toast.success('Заявку успішно надіслано! Я зв\'яжуся з вами найближчим часом.')
    const priceText = estimatedPrice ? `\n<b>Вартість:</b> ${estimatedPrice.toLocaleString('uk-UA')} ₴` : ''
    const issueText = repairType ? `Заміна: ${repairType}` : 'Потрібен ремонт'
    await sendTG(
      `<b>💰 Нова заявка!</b>\n\n` +
      `<b>Телефон для зв'язку:</b> ${phone}\n` +
      `<b>Модель:</b> ${phoneModel}\n` +
      `<b>Проблема:</b> ${issueText}${priceText}`,
      imageBlob
    )
    setPhone('')
    setImagePreview(null)
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Заявка на ремонт</DialogTitle>
          <DialogDescription>
            Перевірте вибране та вкажіть телефон для зв'язку
          </DialogDescription>
        </DialogHeader>

        {/* Selected info summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium">{phoneModel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wrench className="w-4 h-4 text-primary shrink-0" />
            <span>{repairType}</span>
          </div>
          {estimatedPrice && (
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4 text-primary shrink-0" />
              <span className="font-bold text-primary">{estimatedPrice.toLocaleString('uk-UA')} ₴</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Ваш номер телефону *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+38 (0XX) XXX-XX-XX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Я зателефоную вам для підтвердження</p>
          </div>

          <div className="space-y-2">
            <Label>Фото проблеми (необов'язково)</Label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Завантажити фото</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Надсилання...
              </>
            ) : (
              'Надіслати заявку'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
