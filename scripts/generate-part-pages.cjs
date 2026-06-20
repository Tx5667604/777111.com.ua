#!/usr/bin/env node
// scripts/generate-part-pages.cjs
const fs = require('fs')
const path = require('path')

const PART_TYPES = [
  { url: 'charging-flex', field: 'charging_flex', label: 'Шлейф зарядки', labelRu: 'Шлейф зарядки', icon: '🔌', seoPrefix: 'шлейфу зарядки' },
  { url: 'battery', field: 'battery', label: 'Акумулятор', labelRu: 'Аккумулятор', icon: '🔋', seoPrefix: 'акумулятора' },
  { url: 'back-cover', field: 'back_cover', label: 'Задня кришка', labelRu: 'Задняя крышка', icon: '📱', seoPrefix: 'задньої кришки' },
  { url: 'glass', field: 'glass', label: 'Скло екрану', labelRu: 'Стекло экрана', icon: '🪟', seoPrefix: 'скла екрану' },
  { url: 'speaker', field: 'speaker', label: 'Динамік', labelRu: 'Динамик', icon: '🔊', seoPrefix: 'динаміка' },
  { url: 'camera', field: 'camera', label: 'Камера', labelRu: 'Камера', icon: '📷', seoPrefix: 'камери' },
  { url: 'microphone', field: 'microphone', label: 'Мікрофон', labelRu: 'Микрофон', icon: '🎤', seoPrefix: 'мікрофона' },
  { url: 'buttons', field: 'buttons', label: 'Кнопки', labelRu: 'Кнопки', icon: '🔘', seoPrefix: 'кнопок' },
  { url: 'connector', field: 'connector', label: "Роз'єм", labelRu: 'Разъем', icon: '🔗', seoPrefix: "роз'єму" },
]

const FIELD_REF = (f) => `(model as any).parts?.['${f}']`

const BASE_DIR = path.join(__dirname, '..', 'src', 'app', '[brand]')

for (const pt of PART_TYPES) {
  const dir = path.join(BASE_DIR, pt.url, '[model]')
  fs.mkdirSync(dir, { recursive: true })

  const fieldRef = FIELD_REF(pt.field)

  const pageContent = `import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'
import type { Metadata } from 'next'
import ViewCounter from '@/components/ViewCounterWrapper'
import SEOLinks from '@/components/sections/SEOLinks'
import PriceCalculator from '@/components/sections/PriceCalculator'
import seoTexts from '@/app/parts-seo.json'
import seoTextsRu from '@/app/parts-seo-ru.json'

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface Props {
  params: Promise<{ brand: string; model: string }>
}

export async function generateStaticParams() {
  const params: { brand: string; model: string }[] = []
  for (const brand of brandPartsData) {
    for (const model of brand.models) {
      if (${fieldRef}) {
        params.push({ brand: brand.id, model: slug(model.modelCode) })
      }
    }
  }
  return params
}

function findData(brandSlug: string, modelSlug: string) {
  const brand = brandPartsData.find((b) => b.id === brandSlug)
  if (!brand) return null
  const phoneModel = brand.models.find((m) => slug(m.modelCode) === modelSlug)
  if (!phoneModel) return null
  const parts = ${fieldRef}
  if (!parts) return null
  return { brand, phoneModel, parts }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params
  const data = findData(brand, model)
  if (!data) return { title: 'Сторінка не знайдена' }
  const { brand: b, phoneModel: m, parts } = data
  const prices = (parts as any[]).map((p: any) => p.partCost)
  const minPrice = Math.min(...prices).toLocaleString('uk-UA')
  const title = \`\${b.name} \${m.modelName} — заміна ${pt.seoPrefix} в Вознесенську | 777111.com.ua\`
  const description = \`✱ Заміна ${pt.seoPrefix} для \${b.name} \${m.modelName} у Вознесенську. від \${minPrice} грн. Гарантія. Безкоштовна діагностика. Центральний ринок, сектор Б, к. 96.\`
  const path = \`/\${brand}/${pt.url}/\${model}\`
  return {
    title, description,
    openGraph: { title, description, url: \`https://777111.com.ua\${path}\`, siteName: 'Ремонт телефонів 777111', locale: 'uk_UA', type: 'website' },
    robots: 'index, follow',
    alternates: { canonical: \`https://777111.com.ua\${path}\`, languages: { uk: \`https://777111.com.ua\${path}\`, ru: \`https://777111.com.ua\${path}\`, 'x-default': \`https://777111.com.ua\${path}\` } },
    other: { 'geo.placename': 'Вознесенськ, Центральний ринок, сектор Б, к. 96', 'geo.region': 'UA-48' },
  }
}

export default async function Page({ params }: Props) {
  const { brand, model } = await params
  const data = findData(brand, model)
  if (!data) return <div className="p-8 text-center text-gray-500">Сторінка не знайдена</div>
  const { brand: b, phoneModel: m, parts } = data
  const seoKey = \`${pt.url}:\${b.id}:\${m.modelCode}\`
  const seoText = (seoTexts as Record<string, string>)[seoKey]
  const seoTextRu = (seoTextsRu as Record<string, string>)[seoKey]
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: \`${pt.label} для \${b.name} \${m.modelName}\`, description: \`${pt.label} для \${b.name} \${m.modelName}. Ціна від \${Math.min(...(parts as any[]).map((p: any) => p.partCost)).toLocaleString('uk-UA')} грн.\`, image: \`https://777111.com.ua/brands/\${b.id}.svg\`, sku: \`${pt.url.toUpperCase().replace('-','_')}-\${m.modelCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}\`, mpn: \`777111-${pt.url.toUpperCase().replace('-','')}-\${m.modelCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}\`, brand: { '@type': 'Brand', name: b.name }, offers: { '@type': 'AggregateOffer', priceCurrency: 'UAH', lowPrice: Math.min(...(parts as any[]).map((p: any) => p.partCost)), highPrice: Math.max(...(parts as any[]).map((p: any) => p.partCost)), availability: 'https://schema.org/InStock', seller: { '@type': 'Person', name: 'Олександр Панібратенко', telephone: '+380960777111', address: { '@type': 'PostalAddress', addressLocality: 'Вознесенськ', streetAddress: 'Центральний ринок, сектор Б, к. 96' } } } }) }} />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b" aria-label="Хлібні крихти">
          <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Головна</Link>
            <span className="mx-2">/</span>
            <Link href={"/"+b.id} className="hover:text-primary">{b.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">${pt.label} {m.modelName}</span>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ViewCounter slug={\`${pt.url}/\${b.id}/\${slug(m.modelCode)}\`} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">${pt.icon} ${pt.label} для {b.name} {m.modelName}</h1>
          <p className="text-gray-600 mb-6">Заміна ${pt.seoPrefix} в Вознесенську. Швидко, якісно, з гарантією.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(parts as any[]).map((part: any, i: number) => (
              <div key={part.quality} className={\`bg-white rounded-2xl p-6 border shadow-sm \${i === 0 ? 'border-primary/30 bg-primary/[0.02]' : 'border-gray-200'}\`}>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{part.label}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{part.partCost.toLocaleString('uk-UA')} ₴</div>
                <div className="text-sm text-gray-500">Запчастина + робота</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            <a href="tel:+380960777111" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">📞 Подзвонити</a>
            <a href="https://maps.app.goo.gl/Qj2mRAwwWJDh9Uif8" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors">📍 Як дістатись</a>
          </div>
          <div className="mb-8"><PriceCalculator initialBrand={b.name} initialModelCode={m.modelCode} /></div>
          {seoText && <section className="prose prose-gray max-w-none mb-6"><p>{seoText}</p></section>}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">📍 Де ми знаходимось</h2></div>
            <div style={{ height: 300 }}>
              <iframe src="https://www.google.com/maps/embed?pb=..." width="100%" height="100%" style={{ border: 0, minHeight: 300 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Мапа розташування" />
            </div>
          </div>
          {seoTextRu && <section className="prose prose-gray max-w-none mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200"><h2 className="text-lg font-semibold text-gray-900 mb-2">${pt.labelRu} для {b.name} {m.modelName}</h2><p>{seoTextRu}</p></section>}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Потрібна допомога?</h2>
            <p className="text-gray-600 mb-4">Зателефонуйте або завітайте — проконсультуємо безкоштовно!</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="tel:+380960777111" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90">📞 +38 (096) 077-71-11</a>
              <Link href="https://777111.com.ua" className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-full font-medium hover:bg-primary/5">На головний сайт →</Link>
            </div>
          </div>
        </main>
        <SEOLinks />
        <footer className="border-t bg-white py-6">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500"><p>Ремонт телефонів у Вознесенську | 777111.com.ua</p><p className="mt-1">Центральний ринок, сектор Б, к. 96 | Вт–Нд: 9:00–16:00</p></div>
        </footer>
      </div>
    </>
  )
}
`

  fs.writeFileSync(path.join(dir, 'page.tsx'), pageContent)
  console.log(`Created: ${pt.url}/[model]/page.tsx`)
}

console.log('\nDone!')
