import { brandPartsData } from '@/app/phone-parts-data'
import { PART_CATEGORIES } from '@/app/types'
import Link from 'next/link'
import type { Metadata } from 'next'
import ViewCounter from '@/components/ViewCounterWrapper'
import seoTexts from '@/app/display-seo.json'

// Slug helpers
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface Props {
  params: Promise<{ brand: string; model: string }>
}

// Generate all display pages at build time
export async function generateStaticParams() {
  const params: { brand: string; model: string }[] = []

  for (const brand of brandPartsData) {
    for (const model of brand.models) {
      if (model.parts['display']) {
        params.push({
          brand: brand.id,
          model: slug(model.modelCode),
        })
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

  const displayParts = phoneModel.parts['display']
  if (!displayParts) return null

  return { brand, phoneModel, displayParts }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brand, model } = await params
  const data = findData(brand, model)
  if (!data) return { title: 'Сторінка не знайдена' }

  const { brand: b, phoneModel: m, displayParts } = data
  const copyPrice = displayParts.find((p) => p.quality === 'copy')?.partCost
  const origPrice = displayParts.find((p) => p.quality === 'original')?.partCost
  const priceStr = origPrice
    ? `від ${Math.min(...displayParts.map((p) => p.partCost)).toLocaleString('uk-UA')} грн`
    : ''

  const title = `Дисплей для ${b.name} ${m.modelName} — заміна екрану в Вознесенську | 777111.com.ua`
  const description = `✱ Заміна дисплею для ${b.name} ${m.modelName} у Вознесенську. ${priceStr}. Оригінал та копія. Гарантія. Безкоштовна діагностика. Центральний ринок, сектор Б, к. 96.`
  const path = `/${brand}/${'display'}/${model}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://777111.com.ua${path}`,
      siteName: 'Ремонт телефонів 777111',
      locale: 'uk_UA',
      type: 'website',
    },
    alternates: {
      canonical: `https://777111.com.ua${path}`,
    },
    robots: 'index, follow',
  }
}

export default async function DisplayPage({ params }: Props) {
  const { brand, model } = await params
  const data = findData(brand, model)
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center flex-col gap-4 p-8">
        <h1 className="text-2xl font-bold">Сторінку не знайдено</h1>
        <Link
          href="https://777111.com.ua"
          className="text-primary hover:underline text-lg"
        >
          На головний сайт →
        </Link>
      </main>
    )
  }

  const { brand: b, phoneModel: m, displayParts } = data
  const copyVariant = displayParts.find((p) => p.quality === 'copy')
  const origVariant = displayParts.find((p) => p.quality === 'original')
  const origFrameVariant = displayParts.find(
    (p) => p.quality === 'original_with_frame'
  )

  const pageTitle = `Дисплей для ${b.name} ${m.modelName}`
  const canonicalUrl = `https://777111.com.ua/${brand}/display/${model}`

  // Get AI-generated SEO text for this model
  const seoKey = `${brand}:${m.modelCode}`
  const seoText = (seoTexts as Record<string, string>)[seoKey] || ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Дисплей для ${b.name} ${m.modelName}`,
    description: `Заміна дисплею для ${b.name} ${m.modelName}. Ціна: від ${Math.min(...displayParts.map((p) => p.partCost)).toLocaleString('uk-UA')} грн.`,
    brand: { '@type': 'Brand', name: b.name },
    offers: displayParts.map((p) => ({
      '@type': 'Offer',
      price: p.partCost,
      priceCurrency: 'UAH',
      itemCondition:
        p.quality === 'original'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/RefurbishedCondition',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewCounter pagePath={`/${brand}/display/${model}`} />
      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href="https://777111.com.ua"
              className="text-lg font-bold text-primary hover:underline"
            >
              ← 777111.com.ua
            </Link>
            <a
              href="tel:+380960777111"
              className="text-sm font-medium text-gray-700 hover:text-primary"
            >
              +38 (096) 077-71-11
            </a>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1" aria-label="Breadcrumb">
            <Link href="https://777111.com.ua" className="hover:text-primary">
              Головна
            </Link>
            <span className="mx-1">/</span>
            <span className="text-gray-700 font-medium capitalize">{b.name}</span>
            <span className="mx-1">/</span>
            <span className="text-gray-700">Дисплей</span>
            <span className="mx-1">/</span>
            <span className="text-gray-900">{m.modelName}</span>
          </nav>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {pageTitle}
          </h1>

          {/* Price cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {copyVariant && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="text-sm text-gray-500 mb-1">Копія</div>
                <div className="text-2xl font-bold text-gray-900">
                  {copyVariant.partCost.toLocaleString('uk-UA')} грн
                </div>
                <div className="text-xs text-gray-400">+ робота {copyVariant.laborCost.toLocaleString('uk-UA')} грн</div>
              </div>
            )}
            {origVariant && (
              <div className="bg-white rounded-xl shadow-sm border border-primary/30 p-5 relative">
                <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">Оригінал</div>
                <div className="text-sm text-gray-500 mb-1">Оригінал</div>
                <div className="text-2xl font-bold text-primary">
                  {origVariant.partCost.toLocaleString('uk-UA')} грн
                </div>
                <div className="text-xs text-gray-400">+ робота {origVariant.laborCost.toLocaleString('uk-UA')} грн</div>
              </div>
            )}
            {origFrameVariant && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <div className="text-sm text-gray-500 mb-1">Оригінал з рамкою</div>
                <div className="text-2xl font-bold text-gray-900">
                  {origFrameVariant.partCost.toLocaleString('uk-UA')} грн
                </div>
                <div className="text-xs text-gray-400">+ робота {origFrameVariant.laborCost.toLocaleString('uk-UA')} грн</div>
              </div>
            )}
          </div>

          {/* SEO text */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 prose prose-sm max-w-none text-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Заміна дисплею {b.name} {m.modelName} в Вознесенську
            </h2>
            {seoText ? (
              <p>{seoText}</p>
            ) : (
              <>
            <p>
              Потребуєте заміни екрану на {b.name} {m.modelName}? Ми пропонуємо
              якісний ремонт з використанням оригінальних запчастин та якісних
              копій. Працюємо в м. Вознесенськ на Центральному ринку, сектор Б,
              к. 96. Безкоштовна діагностика, гарантія на всі роботи.
            </p>
            <p>
              <strong>Оригінальний дисплей:</strong> ідеальна кольоропередача,
              максимальна яскравість, сенсорний шар як у новому телефоні.
            </p>
            <p>
              <strong>Якісна копія:</strong> бюджетний варіант з гарною
              кольоропередачею, підійде для повсякденного використання.
            </p>
            <p className="font-medium">
              Приходьте — промаємо, порадимо, зробимо якісно!
            </p>
            </>
            )}
          </div>

          {/* Map */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              🗺️ Як нас знайти
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              м. Вознесенськ, Центральний ринок, сектор Б, к. 96
            </p>
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2697.9466804053873!2d31.3338907!3d47.569012!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c61955dca38d3f%3A0x47a6413f2e1ffc99!2z0JTQu9GPINC90LDRgQ!5e0!3m2!1sru!2sua!4v1688111111111"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 300 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Мапа розташування"
              />
            </div>
          </div>

          {/* CTA */}  
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Потрібна допомога?
            </h2>
            <p className="text-gray-600 mb-4">
              Зателефонуйте або завітайте — промаємо безкоштовно!
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="tel:+380960777111"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90"
              >
                📞 +38 (096) 077-71-11
              </a>
              <Link
                href="https://777111.com.ua"
                className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-6 py-3 rounded-full font-medium hover:bg-primary/5"
              >
                На головний сайт →
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white py-6">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>Ремонт телефонів у Вознесенську | 777111.com.ua</p>
            <p className="mt-1">
              Центральний ринок, сектор Б, к. 96 | Вт–Нд: 9:00–16:00
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
