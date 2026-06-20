import SEOLinks from '@/components/sections/SEOLinks'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Карта сайта | Всі запчастини для телефонів | 777111.com.ua',
  description: 'Повна карта сайту — всі дисплеї, шлейфи зарядки, акумулятори, задні кришки, скло, динаміки, камери, мікрофони, кнопки та роз\'єми для телефонів у Вознесенську.',
  robots: { index: true, follow: true },
}

export default function SitemapPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Карта сайта</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Всі сторінки сайту — дисплеї та запчастини для телефонів
        </p>
      </div>
      <SEOLinks showAll />
    </div>
  )
}
