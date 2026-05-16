'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Phone, Menu, X, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton'
import UserMenu from '@/components/auth/UserMenu'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { trackRouteClick, trackPhoneClick } from '@/lib/routeTracker'

const navLinks = [
  { href: '/#hero', label: 'Головна' },
  { href: '/#calculator', label: 'Ціни' },
  { href: '/#gallery', label: 'Товари' },
  { href: '/#contacts', label: 'Контакти' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setOpen(false)
    if (href.startsWith('/')) {
      window.location.href = href
    } else {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => handleNavClick('/#hero')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">
              Олександр <span className="text-primary">Ремонт</span>
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Phone + Route CTA + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-primary/30 text-primary hover:bg-primary/5 hover:text-primary gap-1 text-xs px-2.5"
            >
              <a href="https://www.google.com/maps/dir/?api=1&destination=47.5627,31.3382" target="_blank" rel="noopener noreferrer" onClick={trackRouteClick}>
                <MapPin className="w-3.5 h-3.5" />
                Маршрут
              </a>
            </Button>

            <Button
              asChild
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <a href="tel:+380960777111" onClick={trackPhoneClick}>
                <Phone className="w-4 h-4" />
                +38 (096) 077-71-11
              </a>
            </Button>

            <Button
              asChild
              className="sm:hidden size-10 bg-primary hover:bg-primary/90 text-primary-foreground p-0"
            >
              <a href="tel:+380960777111" onClick={trackPhoneClick}>
                <Phone className="w-4 h-4" />
              </a>
            </Button>

            {/* Mobile Route Button */}
            <Button
              asChild
              variant="outline"
              size="icon"
              className="sm:hidden size-10 border-primary/30 text-primary hover:bg-primary/5 p-0"
            >
              <a href="https://www.google.com/maps/dir/?api=1&destination=47.5627,31.3382" target="_blank" rel="noopener noreferrer" onClick={trackRouteClick}>
                <MapPin className="w-4 h-4" />
              </a>
            </Button>

            {/* User Menu - more compact on mobile */}
            <div className="flex items-center gap-1">
              <UserMenu />
              <CartDrawer />
            </div>

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Відкрити меню"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetTitle className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold">
                    Олександр <span className="text-primary">Ремонт</span>
                  </span>
                </SheetTitle>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link, index) => (
                    <motion.button
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNavClick(link.href)}
                      className="text-left px-4 py-3 text-base font-medium text-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      {link.label}
                    </motion.button>
                  ))}
                </nav>
                <div className="mt-4 px-4">
                  <UserMenu />
                </div>
                <div className="mt-8 pt-6 border-t space-y-2">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-primary/30 text-primary hover:bg-primary/5 gap-2"
                  >
                    <a href="https://www.google.com/maps/dir/?api=1&destination=47.5627,31.3382" target="_blank" rel="noopener noreferrer" onClick={trackRouteClick}>
                      <MapPin className="w-4 h-4" />
                      Прокласти маршрут
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                  >
                    <a href="tel:+380960777111" onClick={trackPhoneClick}>
                      <Phone className="w-4 h-4" />
                      +38 (096) 077-71-11
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
