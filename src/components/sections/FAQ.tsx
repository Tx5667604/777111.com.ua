// src/components/sections/FAQ.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    q: "Скільки часу займає заміна екрана?",
    a: "Заміна екрана займає від 30 до 60 хвилин, залежно від моделі телефону. Складніші моделі (наприклад, iPhone з OLED екраном) можуть потребувати більше часу.",
  },
  {
    q: "Чи даєте гарантію на ремонт?",
    a: "Так, на всі види ремонту надаємо гарантію. На заміну екрана та акумулятора — до 12 місяців. На інші роботи — від 14 днів згідно з Законом України «Про захист прав споживачів».",
  },
  {
    q: "Чи можна розблокувати iCloud без пароля?",
    a: "Так, ми виконуємо легальне розблокування iCloud на iPhone та iPad. Для цього потрібен сам пристрій. Ми використовуємо офіційні методи розблокування через сервіси Apple.",
  },
  {
    q: "Скільки коштує діагностика?",
    a: "Діагностика безкоштовна. Ми безоплатно визначаємо несправність і називаємо вартість ремонту. Якщо вас не влаштовує ціна — ви нічого не платите.",
  },
  {
    q: "Чи можна купити відновлений телефон з гарантією?",
    a: "Так, у нас є в наявності відновлені телефони iPhone, Samsung, Xiaomi. Кожен проходить повну діагностику, заміну зношених деталей та має гарантію.",
  },
  {
    q: "Який графік роботи?",
    a: "Ми працюємо з вівторка по неділю з 9:00 до 16:00. Понеділок — вихідний. Знаходимось на Центральному ринку, сектор Б, контейнер 96.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Питання та відповіді
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Часті запитання
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQ JSON-LD для Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: f.a,
                },
              })),
            }),
          }}
        />
      </div>
    </section>
  )
}
