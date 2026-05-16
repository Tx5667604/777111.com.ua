'use client'

import { motion } from 'framer-motion'
import { Phone, MapPin, Clock, Smartphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { trackRouteClick, trackPhoneClick } from '@/lib/routeTracker'

export default function Appointment() {
  return (
    <section id="appointment" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Зв'язок
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Контакти
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Приходьте або телефонуйте — я завжди на зв'язку
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Schedule */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-lg">Години роботи</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Вт–Нд: 9:00 — 16:00<br />
                    Пн: вихідний
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Address — opens Google Maps */}
            <a
              onClick={trackRouteClick}
              href="https://www.google.com/maps/dir/?api=1&destination=47.5627,31.3382"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">Адреса</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      м. Вознесенськ<br />
                      Центральний ринок, сектор Б, к. 96
                    </p>
                    <p className="text-xs text-primary mt-2">Прокласти маршрут →</p>
                  </div>
                </CardContent>
              </Card>
            </a>

            {/* Phone — opens dialer */}
            <a href="tel:+380960777111" onClick={trackPhoneClick} className="block">
              <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-lg">Телефон</p>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-nowrap">
                      +38 (096) 077-71-11
                    </p>
                    <p className="text-xs text-primary mt-2">Натисніть, щоб зателефонувати →</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
