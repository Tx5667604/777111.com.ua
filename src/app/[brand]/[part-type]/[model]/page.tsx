import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'
import type { Metadata } from 'next'
import ViewCounter from '@/components/ViewCounterWrapper'
import SEOLinks from '@/components/sections/SEOLinks'
import PriceCalculator from '@/components/sections/PriceCalculator'
import seoTexts from '@/app/parts-seo.json'
import seoTextsRu from '@/app/parts-seo-ru.json'
import { PART_CATEGORY_CONTENT } from '@/app/part-category-content'

const PART_CONFIG: Record<string, { label: string; labelRu: string; icon: string }> = {
  'charging-flex': { label: 'Шлейф зарядки', labelRu: 'Шлейф зарядки', icon: '🔌' },
  'battery': { label: 'Акумулятор', labelRu: 'Аккумулятор', icon: '🔋' },
  'back-cover': { label: 'Задня кришка', labelRu: 'Задняя крышка', icon: '📱' },
  'glass': { label: 'Скло екрану', labelRu: 'Стекло экрана', icon: '🪟' },
  'speaker': { label: 'Динамік', labelRu: 'Динамик', icon: '🔊' },
  'camera': { label: 'Камера', labelRu: 'Камера', icon: '📷' },
  'microphone': { label: 'Мікрофон', labelRu: 'Микрофон', icon: '🎤' },
  'buttons': { label: 'Кнопки', labelRu: 'Кнопки', icon: '🔘' },
  'connector': { label: "Роз'єм", labelRu: 'Разъем', icon: '🔗' },
}

const PART_FIELDS: Record<string, string> = {
  'charging-flex': 'charging_flex',
  'battery': 'battery',
  'back-cover': 'back_cover',
  'glass': 'glass',
  'speaker': 'speaker',
  'camera': 'camera',
  'microphone': 'microphone',
  'buttons': 'buttons',
  'connector': 'connector',
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

interface Props {
  params: Promise<{ brand: string; partType: string; model: string }>
}

export async function generateStaticParams() {
  const result: { brand: string; 'part-type': string; model: string }[] = []

  for (const partType of Object.keys(PART_FIELDS)) {
    const field = PART_FIELDS[partType]
    for (const brand of brandPartsData) {
      for (const m of brand.models) {
        if ((m as any).parts && (m as any).parts[field]) {
          result.push({ brand: brand.id, 'part-type': partType, model: slug(m.modelCode) })
        }
      }
    }
  }
  return result
}

function findData(brandSlug: string, partType: string, modelSlug: string) {
  const field = PART_FIELDS[partType]
  if (!field) return null
  const brand = brandPartsData.find((b) => b.id === brandSlug)
  if (!brand) return null
  const phoneModel = brand.models.find((m) => slug(m.modelCode) === modelSlug)
  if (!phoneModel) return null
  const parts = (phoneModel as any).parts?.[field]
  if (!parts) return null
  return { brand, phoneModel, parts, config: PART_CONFIG[partType] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, 'part-type': partType, model } = await params
  const data = findData(brand, partType, model)
  if (!data) return { title: 'Сторінка не знайдена' }
  const { brand: b, phoneModel: m, parts, config } = data
  const prices = (parts as any[]).map((p: any) => p.partCost)
  const minPrice = Math.min(...prices).toLocaleString('uk-UA')
  const title = b.name + ' ' + m.modelName + ' — заміна ' + config.label.toLowerCase() + ' в Вознесенську | 777111.com.ua'
  const description = '✱ Заміна ' + config.label.toLowerCase() + ' для ' + b.name + ' ' + m.modelName + ' у Вознесенську. від ' + minPrice + ' грн. Гарантія. Безкоштовна діагностика. Центральний ринок, сектор Б, к. 96.'
  const path = '/' + brand + '/' + partType + '/' + model
  return {
    title, description,
    openGraph: { title, description, url: 'https://777111.com.ua' + path, siteName: 'Ремонт телефонів 777111', locale: 'uk_UA', type: 'website' },
    robots: 'index, follow',
    alternates: { canonical: 'https://777111.com.ua' + path, languages: { uk: 'https://777111.com.ua' + path, ru: 'https://777111.com.ua' + path, 'x-default': 'https://777111.com.ua' + path } },
    other: { 'geo.placename': 'Вознесенськ, Центральний ринок, сектор Б, к. 96', 'geo.region': 'UA-48' },
  }
}

export default async function PartPage({ params }: Props) {
  const { brand, 'part-type': partType, model } = await params
  const data = findData(brand, partType, model)
  if (!data) return <div className="p-8 text-center text-gray-500">Сторінка не знайдена</div>
  const { brand: b, phoneModel: m, parts, config } = data
  const STORAGE_KEYS: Record<string, string> = {
    'charging-flex': 'charging_flex',
    'back-cover': 'back_cover',
  }
  const storageKey = STORAGE_KEYS[partType] || partType
  const seoKey = storageKey + ':' + b.id + ':' + m.modelCode
  const seoText = (seoTexts as Record<string, string>)[seoKey]
  const seoTextRu = (seoTextsRu as Record<string, string>)[seoKey]
  const labelLow = config.label.toLowerCase()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Product',
          name: config.label + ' для ' + b.name + ' ' + m.modelName,
          description: config.label + ' для ' + b.name + ' ' + m.modelName + '. Ціна від ' + Math.min(...(parts as any[]).map((p: any) => p.partCost)).toLocaleString('uk-UA') + ' грн.',
          image: 'https://777111.com.ua/brands/' + b.id + '.svg',
          sku: partType.toUpperCase().replace('-','_') + '-' + m.modelCode.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase(),
          mpn: '777111-' + partType.toUpperCase().replace('-','') + '-' + m.modelCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
          brand: { '@type': 'Brand', name: b.name },
          offers: {
            '@type': 'AggregateOffer', priceCurrency: 'UAH',
            lowPrice: Math.min(...(parts as any[]).map((p: any) => p.partCost)),
            highPrice: Math.max(...(parts as any[]).map((p: any) => p.partCost)),
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Person', name: 'Олександр Панібратенко', telephone: '+380960777111', address: { '@type': 'PostalAddress', addressLocality: 'Вознесенськ', streetAddress: 'Центральний ринок, сектор Б, к. 96' } },
          },
        }),
      }} />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">Головна</Link>
            <span className="mx-2">/</span>
            <Link href={'/' + b.id} className="hover:text-primary">{b.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{config.label} {m.modelName}</span>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ViewCounter pagePath={'/' + brand + '/' + partType + '/' + model} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{config.icon} {config.label} для {b.name} {m.modelName}</h1>
          <p className="text-gray-600 mb-6">Заміна {labelLow} в Вознесенську. Швидко, якісно, з гарантією.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(parts as any[]).map((part: any, i: number) => (
              <div key={part.quality} className={'bg-white rounded-2xl p-6 border shadow-sm ' + (i === 0 ? 'border-primary/30 bg-primary/[0.02]' : 'border-gray-200')}>
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{part.label}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{part.partCost.toLocaleString('uk-UA')} ₴</div>
                <div className="text-sm text-gray-500">Запчастина + робота</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            <a href="tel:+380960777111" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90">📞 Подзвонити</a>
            <a href="https://maps.app.goo.gl/XRhaZaVCwTfE8W7Q7" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-full font-medium hover:bg-gray-50">📍 Як дістатись</a>
          </div>
          {/* Category-specific content */}
          {PART_CATEGORY_CONTENT[partType] && (() => {
            const cc = PART_CATEGORY_CONTENT[partType]
            return (
              <>
                {/* Symptoms */}
                <section className="bg-white rounded-2xl border border-red-100 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Ознаки несправності</h2>
                  <ul className="space-y-2">
                    {cc.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-red-400 mt-0.5 shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                {/* Features */}
                <section className="bg-white rounded-2xl border border-green-100 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">✅ Чому обирають нас</h2>
                  <ul className="space-y-2">
                    {cc.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                {/* FAQ */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">❓ Часті запитання</h2>
                  <div className="space-y-4">
                    {cc.faq.map((item, i) => (
                      <div key={i}>
                        <h3 className="font-medium text-gray-800 mb-1">{item.q}</h3>
                        <p className="text-gray-600 text-sm">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )
          })()}
          <div className="mb-8"><PriceCalculator initialBrand={b.name} initialModelCode={m.modelCode} /></div>
          {seoText && <section className="prose prose-gray max-w-none mb-6"><p>{seoText}</p></section>}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">📍 Де ми знаходимось</h2></div>
            <div style={{ height: 300 }}>
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2697.9466804053873!2d31.3338907!3d47.569012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c61955dca38d3f%3A0x47a6413f2e1ffc99!2z0J7Qu9C10LrRgdCw0L3QtNGAINCf0LDQvdGW0LHRgNCw0YLQtdC90LrQviDQoNC10LzQvtC90YIg0YLQtdC70LXRhNC-0L3RltCy!5e0!3m2!1suk!2sua!4v1700000000000" width="100%" height="100%" style={{ border: 0, minHeight: 300 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Мапа розташування" />
            </div>
          </div>
          {seoTextRu && <section className="prose prose-gray max-w-none mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200"><h2 className="text-lg font-semibold text-gray-900 mb-2">{config.labelRu} для {b.name} {m.modelName}</h2><p>{seoTextRu}</p></section>}
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Потрібна допомога?</h2>
            <p className="text-gray-600 mb-4">Зателефонуйте або завітайте — проконсультуємо безкоштовно!</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="tel:+380960777111" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90">📞 +38 (096) 077-71-11</a>
              <Link href="https://777111.com.ua" className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-full font-medium hover:bg-primary/5">На головний сайт →</Link>
              <a href="https://search.google.com/local/writereview?placeid=0x40cf77f2bef69811:0xcf2f3b40e05122f9" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-300 px-6 py-3 rounded-full font-medium hover:bg-yellow-100">⭐ Оставить отзыв на Google</a>
            </div>
          </div>
        </main>
        <SEOLinks currentType={partType} />
        <footer className="border-t bg-white py-6">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500"><p>Ремонт телефонів у Вознесенську | 777111.com.ua</p><p className="mt-1">Центральний ринок, сектор Б, к. 96 | Вт–Нд: 9:00–16:00</p></div>
        </footer>
      </div>
    </>
  )
}
