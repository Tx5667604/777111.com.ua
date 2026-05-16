// src/components/PwaInstallPrompt.tsx
"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Expose global trigger for the install button
  useEffect(() => {
    (window as any).__pwaPrompt = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        deferredPrompt.userChoice.then((result: any) => {
          if (result.outcome === "accepted") {
            setShowBanner(false)
            setDismissed(true)
          }
          setDeferredPrompt(null)
        })
      } else {
        // iOS or unsupported - show install instructions
        alert('Для встановлення: натисніть "Поділитися" → "На екран додому"')
      }
    }
    return () => { (window as any).__pwaPrompt = undefined }
  }, [deferredPrompt])

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (localStorage.getItem("pwa-dismissed")) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Also show banner after 3 seconds if no prompt event (iOS/Safari fallback)
    const timeout = setTimeout(() => {
      if (!deferredPrompt && !dismissed && !localStorage.getItem("pwa-dismissed")) {
        setShowBanner(true)
      }
    }, 5000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timeout)
    }
  }, [dismissed, deferredPrompt])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === "accepted") {
        setShowBanner(false)
        setDismissed(true)
      }
      setDeferredPrompt(null)
    } else {
      // iOS fallback - show instructions
      alert('Для встановлення: натисніть "Поділитися" → "На екран додому"')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem("pwa-dismissed", "true")
  }

  if (!showBanner) return null

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-background border rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Встановіть додаток</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Натисніть «Поділитися» → «На екран додому»"
                : "Встановіть на телефон для швидкого доступу"}
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {isIOS ? "Як встановити" : "Встановити"}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Не зараз
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1 hover:bg-accent rounded shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
