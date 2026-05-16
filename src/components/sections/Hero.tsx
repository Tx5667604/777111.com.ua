'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Smartphone, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Hero() {
  const handleScrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.1),_transparent_70%)]" />

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-white/30 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-700" />
      <div className="absolute bottom-1/3 right-1/4 w-5 h-5 bg-white/25 rounded-full animate-pulse delay-1000" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" />
                Ремонт телефонів у Вознесенську
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            >
              Ремонт телефонів у <span className="text-yellow-200">Вознесенську — швидко, якісно</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Гарантія на всі роботи — 14 днів згідно Закону «Про захист прав споживачів».
              Гарантія поширюється на телефон після ремонту та виконані роботи.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                onClick={() => handleScrollTo('#calculator')}
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold text-base gap-2 h-12 px-6"
              >
                Розрахувати вартість ремонту
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleScrollTo('#gallery')}
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-semibold text-base h-12 px-6 bg-transparent"
              >
                Обрати відновлені телефони
              </Button>
              <Button
                onClick={() => {
                  if ((window as any).__pwaPrompt) {
                    (window as any).__pwaPrompt()
                  } else {
                    window.open('https://play.google.com/store/apps/details?id=com.example.app', '_blank')
                  }
                }}
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-semibold text-base h-12 px-6 bg-transparent gap-2"
              >
                <Download className="w-4 h-4" />
                Завантажити додаток
              </Button>
            </motion.div>

          </div>

          {/* Decorative phone illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative">
              {/* Phone body */}
              <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] border-4 border-gray-700 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
                <div className="w-full h-full bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 flex items-center justify-center">
                  <div className="text-center text-gray-900">
                    <svg
                      className="w-20 h-20 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
                      />
                    </svg>
                    <p className="text-lg font-bold">Ремонт</p>
                    <p className="text-sm opacity-80">Олександр</p>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-8 -right-12 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800 pr-1">Висока якість роботи</span>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-16 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800 pr-1">Ремонт за 30 хв</span>
              </motion.div>

              <motion.div
                animate={{ y: [-5, 15, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/3 -left-20 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800 pr-1">Оригінальні запчастини</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <button
          onClick={() => handleScrollTo('#advantages')}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Прокрутити вниз"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
      </motion.div>
    </section>
  )
}