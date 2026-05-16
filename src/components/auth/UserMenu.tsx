// src/components/auth/UserMenu.tsx
"use client"

import React, { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "./AuthModal"
import { User, LogOut, ChevronDown, Mail, LayoutDashboard, Shield } from "lucide-react"

import { useAdmins } from "@/lib/admin"

const ADMIN_EMAILS = ["fit5667604@gmail.com", "pavlovich2008@gmail.com", "vihnykov354@gmail.com", "perpetoto@gmail.com", "fenixdutkaev@gmail.com"]

export default function UserMenu() {
  const { user, profile, logout, loading } = useAuth()
  const { admins, loading: adminsLoading } = useAdmins()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
  }

  // Logged in — show avatar + dropdown
  if (user) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 rounded-lg hover:bg-accent transition-colors px-1.5 py-1"
        >
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-primary object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {(profile?.name || user.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 bg-popover border rounded-xl shadow-lg p-1.5 z-50 min-w-[200px]">
            <div className="px-3 py-2 border-b mb-1">
              <p className="text-sm font-medium truncate">{profile?.name || "Користувач"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || user.email}</p>
            </div>
            <button
              onClick={() => { window.location.href = '/account'; setMenuOpen(false) }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Особистий кабінет
            </button>
            {admins.includes(user?.email || "") && (
              <button
                onClick={() => { window.location.href = '/admin'; setMenuOpen(false) }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4" />
                Адмін-панель
              </button>
            )}
            <button
              onClick={() => { logout(); setMenuOpen(false) }}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Вийти
            </button>
          </div>
        )}
      </div>
    )
  }

  // Not logged in — main button does Google directly
  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-0">
        {/* Main button: direct Google login (redirect) */}
        <button
          onClick={() => loginWithGoogle()}
          className="inline-flex items-center justify-center gap-1 rounded-l-lg border border-r-0 bg-background shadow-xs h-8 w-8 sm:h-9 sm:w-auto sm:px-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
          title="Увійти через Google"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="hidden sm:inline">Увійти</span>
        </button>

        {/* Dropdown chevron for email option */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex items-center justify-center rounded-r-lg border bg-background shadow-xs h-8 w-5 sm:h-9 sm:w-auto sm:px-1.5 text-sm transition-all hover:bg-accent"
          aria-label="Більше способів входу"
        >
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 bg-popover border rounded-xl shadow-lg p-1.5 z-50 min-w-[200px]">
          <button
            onClick={() => { setMenuOpen(false); setModalOpen(true) }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email + Пароль
          </button>
        </div>
      )}

      <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
