'use client'

import { motion } from 'framer-motion'
import { CheckCircle, BadgePercent, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const advantages = [
  {
    icon: CheckCircle,
    title: 'Запчастини: копії та оригінали',
    description: 'Запчастини копії та оригінали — залежно від моделі телефону. Пропонуємо різні варіанти під будь-який бюджет.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: BadgePercent,
    title: 'Доступні ціни',
    description: 'Ціна на сайті вказана з урахуванням вартості запчастини та вартості роботи майстра.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Search,
    title: 'Безкоштовна діагностика',
    description: 'Визначимо проблему безкоштовно, навіть якщо ви вирішите не ремонтувати.',
    color: 'bg-rose-50 text-rose-600',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

export default function Advantages() {
  return (
    <section id="advantages" className="py-20 sm:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {advantages.map((advantage, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${advantage.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <advantage.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
