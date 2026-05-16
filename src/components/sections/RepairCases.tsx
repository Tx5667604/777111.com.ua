'use client'

import { useState } from 'react'
import { repairCases as casesData } from '@/app/data'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Wrench } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RepairCase {
  id: string
  title: string
  description: string
  beforeImage: string | null
  afterImage: string | null
  createdAt: string
}

const beforeColors = [
  'from-red-400 to-red-600',
  'from-orange-400 to-orange-600',
  'from-rose-400 to-rose-600',
  'from-amber-400 to-amber-600',
]

const afterColors = [
  'from-emerald-400 to-green-500',
  'from-teal-400 to-emerald-500',
  'from-green-400 to-emerald-600',
  'from-lime-400 to-green-500',
]

export default function RepairCases() {
  const [cases] = useState(casesData)
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextCase = () => {
    setCurrentIndex((prev) => (prev + 1) % cases.length)
  }

  const prevCase = () => {
    setCurrentIndex((prev) => (prev - 1 + cases.length) % cases.length)
  }

  if (cases.length === 0) return null

  return (
    <section id="cases" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Портфоліо
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Мої роботи — до та після
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Переконайтесь у якості ремонту на реальних прикладах
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Current case */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {/* Before */}
                  <div className="relative">
                    <div
                      className={`h-56 sm:h-72 bg-gradient-to-br ${
                        beforeColors[currentIndex % beforeColors.length]
                      } flex items-center justify-center`}
                    >
                      <div className="text-center text-white">
                        <Wrench className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <p className="text-lg font-semibold opacity-90">До ремонту</p>
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 bg-red-500/90 text-white hover:bg-red-500/90">
                      До
                    </Badge>
                  </div>

                  {/* After */}
                  <div className="relative">
                    <div
                      className={`h-56 sm:h-72 bg-gradient-to-br ${
                        afterColors[currentIndex % afterColors.length]
                      } flex items-center justify-center`}
                    >
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="text-lg font-semibold opacity-90">Після ремонту</p>
                      </div>
                    </div>
                    <Badge className="absolute top-3 left-3 bg-emerald-500/90 text-white hover:bg-emerald-500/90">
                      Після
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {cases[currentIndex].title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {cases[currentIndex].description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevCase}
              disabled={cases.length <= 1}
              aria-label="Попередній кейс"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-2">
              {cases.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-primary w-8'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Кейс ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextCase}
              disabled={cases.length <= 1}
              aria-label="Наступний кейс"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
