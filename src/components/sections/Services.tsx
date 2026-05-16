// src/components/sections/Services.tsx
"use client"

import { useState } from "react"
import { Smartphone, Battery, ShieldCheck, Cpu, RefreshCw, Zap, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const services = [
  {
    icon: Smartphone,
    title: "Заміна екрана",
    desc: "Дисплей, скло, модуль у зборі для будь-яких телефонів",
    price: "від 650 грн",
    href: "/zamina-ekrana",
  },
  {
    icon: Battery,
    title: "Заміна акумулятора",
    desc: "Нова батарея, якщо телефон швидко розряджається",
    price: "від 550 грн",
    href: "/zamina-akumuliatora",
  },
  {
    icon: ShieldCheck,
    title: "Ремонт iPhone",
    desc: "Всі моделі — від SE до 15 Pro Max",
    price: "від 500 грн",
    href: "/remont-iphone",
  },
  {
    icon: Cpu,
    title: "Ремонт Samsung",
    desc: "Galaxy S, A, Note, Fold — екран, АКБ, прошивка",
    price: "від 400 грн",
    href: "/remont-samsung",
  },
  {
    icon: RefreshCw,
    title: "Розблокування iCloud",
    desc: "Легальне зняття блокування активації iPhone/iPad",
    price: "від 800 грн",
    href: "/rozblokuvannja-icloud",
  },
  {
    icon: Zap,
    title: "Прошивка",
    desc: "Перевстановлення ПЗ, оновлення, видалення FRP",
    price: "від 350 грн",
    href: "/proshivka-telefonu",
  },
]

export default function Services() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Наші послуги
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
                Що ми ремонтуємо
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
                Професійний ремонт телефонів у Вознесенську — швидко, якісно, з гарантією
              </p>
            </div>
            <ChevronDown className={`w-6 h-6 shrink-0 text-muted-foreground transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {services.map((service, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => { if (expanded) window.location.href = service.href }}
                    className="bg-background rounded-xl p-6 border hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{service.desc}</p>
                    <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {service.price}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
