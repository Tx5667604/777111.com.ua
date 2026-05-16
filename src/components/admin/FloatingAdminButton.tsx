// src/components/admin/FloatingAdminButton.tsx
"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Shield, X, Users, Calculator, ShoppingCart, Smartphone, LogOut } from "lucide-react"

import { useAdmins } from "@/lib/admin"

const ADMIN_EMAILS = ["fit5667604@gmail.com", "pavlovich2008@gmail.com", "vihnykov354@gmail.com", "perpetoto@gmail.com", "fenixdutkaev@gmail.com"]

const links = [
  { href: "/admin", icon: Shield, label: "Адмін-панель", color: "text-orange-500" },
  { href: "/admin?tab=clients", icon: Users, label: "Клієнти", color: "text-blue-500" },
  { href: "/admin?tab=calculator", icon: Calculator, label: "Калькулятор", color: "text-purple-500" },
  { href: "/admin?tab=orders", icon: ShoppingCart, label: "Замовлення", color: "text-green-500" },
  { href: "/admin?tab=phones", icon: Smartphone, label: "Телефони", color: "text-rose-500" },
]

export function FloatingAdminButton() {
  const { user, loading, logout } = useAuth()
  const { admins, loading: adminsLoading } = useAdmins()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  if (loading || adminsLoading || !user || !admins.includes(user.email || "")) return null

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    window.location.href = "/"
  }

  const navigate = (href: string) => {
    setOpen(false)
    window.location.href = href
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed right-4 bottom-20 z-40 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open ? "bg-muted rotate-45" : "bg-orange-500 hover:bg-orange-600"
        }`}
        aria-label="Адмін-панель"
      >
        {open ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Shield className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Side panel */}
      <div
        className={`fixed right-0 bottom-0 top-0 z-30 w-64 bg-background border-l shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 pt-16">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Адмін-панель</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => navigate(link.href)}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors"
              >
                <link.icon className={`w-4 h-4 ${link.color}`} />
                {link.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Вихід..." : "Вийти"}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
      )}
    </>
  )
}
