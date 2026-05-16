// src/components/ServicePage.tsx
"use client"

import { Phone, MapPin, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Header from "@/components/sections/Header"
import Footer from "@/components/sections/Footer"
import { trackPhoneClick } from "@/lib/routeTracker"

interface ServicePageProps {
  title: string
  description: string
  content: string
  benefits: string[]
  price?: string
  slug: string
  parentTitle?: string
}

export default function ServicePage({ title, description, content, benefits, price, slug, parentTitle }: ServicePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Головна", item: "https://777111.com.ua" },
              { "@type": "ListItem", position: 2, name: parentTitle || title, item: `https://777111.com.ua/${slug}` },
            ],
          }),
        }}
      />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 py-20 sm:py-28">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              {title}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-6">
              {description}
            </p>
            {price && (
              <div className="inline-block bg-white/15 backdrop-blur-sm text-white font-bold text-xl px-6 py-2 rounded-full mb-6">
                {price}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold text-base h-12 px-8"
                asChild
              >
                <a href="tel:+380960777111" onClick={trackPhoneClick}>
                  <Phone className="w-4 h-4 mr-2" />
                  +38 (096) 077-71-11
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-base h-12 px-8"
                asChild
              >
                <a href="/#calculator">
                  Розрахувати вартість
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {content}
              </p>
            </div>

            {/* Benefits */}
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              Чому варто звернутися до нас
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                  <p className="text-muted-foreground">{b}</p>
                </div>
              ))}
            </div>

            {/* Contact info */}
            <div className="bg-muted/30 rounded-2xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-6">Наші контакти</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    м. Вознесенськ, Центральний ринок, сектор Б, контейнер 96
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <a href="tel:+380960777111" onClick={trackPhoneClick} className="text-primary hover:underline font-medium">
                    +38 (096) 077-71-11
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Вт–Нд: 9:00 — 16:00 · Пн: вихідний
                  </span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <a href="/#contacts">
                    Прокласти маршрут
                    <MapPin className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
