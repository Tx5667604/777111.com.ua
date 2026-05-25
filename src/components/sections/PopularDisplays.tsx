'use client'

import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Популярные модели из топ-брендов для внутренних ссылок на главной
const POPULAR_MODELS = [
  // Apple — самые частые
  { brand: 'apple', name: 'iPhone 11' },
  { brand: 'apple', name: 'iPhone 12' },
  { brand: 'apple', name: 'iPhone 13' },
  { brand: 'apple', name: 'iPhone 14 Pro Max' },
  { brand: 'apple', name: 'iPhone 15 Pro Max' },
  // Samsung
  { brand: 'samsung', name: 'Galaxy A52' },
  { brand: 'samsung', name: 'Galaxy A53' },
  { brand: 'samsung', name: 'Galaxy A54' },
  { brand: 'samsung', name: 'Galaxy A73' },
  { brand: 'samsung', name: 'Galaxy S21' },
  { brand: 'samsung', name: 'Galaxy S22' },
  { brand: 'samsung', name: 'Galaxy S23' },
  { brand: 'samsung', name: 'Galaxy S24' },
  { brand: 'samsung', name: 'Galaxy Note 10+' },
  // Xiaomi
  { brand: 'xiaomi', name: 'Redmi Note 10' },
  { brand: 'xiaomi', name: 'Redmi Note 11' },
  { brand: 'xiaomi', name: 'Redmi Note 12' },
  { brand: 'xiaomi', name: 'Redmi Note 13' },
  { brand: 'xiaomi', name: 'Poco X3' },
  { brand: 'xiaomi', name: 'Poco X5 Pro' },
  // Huawei
  { brand: 'huawei', name: 'P30 Lite' },
  { brand: 'huawei', name: 'P Smart' },
  { brand: 'huawei', name: 'Y9 (2019)' },
  // OnePlus
  { brand: 'oneplus', name: 'OnePlus 8' },
  { brand: 'oneplus', name: 'OnePlus 9' },
  // Google Pixel
  { brand: 'google', name: 'Pixel 7' },
  { brand: 'google', name: 'Pixel 8' },
]

// Build lookup map: brandId -> modelCode -> modelName display exists
function buildModelMap() {
  const map: Record<string, Record<string, { modelName: string; modelCode: string }>> = {}
  for (const brand of brandPartsData) {
    for (const model of brand.models) {
      if (!model.parts.display) continue
      if (!map[brand.id]) map[brand.id] = {}
      map[brand.id][model.modelName] = { modelName: model.modelName, modelCode: model.modelCode }
    }
  }
  return map
}

export default function PopularDisplays() {
  const modelMap = buildModelMap()

  // Find all valid entries
  const entries: { href: string; brandName: string; modelName: string; modelCode: string }[] = []

  for (const pop of POPULAR_MODELS) {
    const brandData = brandPartsData.find(b => b.id === pop.brand)
    if (!brandData) continue

    const brandModels = modelMap[pop.brand]
    if (!brandModels) continue

    // Try exact match first, then partial
    let match = brandModels[pop.name]
    if (!match) {
      // Try matching by modelName containing the search name
      match = Object.values(brandModels).find(
        m => m.modelName.toLowerCase().includes(pop.name.toLowerCase())
      )
    }
    if (!match) continue

    entries.push({
      href: `/${pop.brand}/display/${slug(match.modelCode)}`,
      brandName: brandData.name,
      modelName: match.modelName,
      modelCode: match.modelCode,
    })
  }

  if (entries.length === 0) return null

  return (
    <section className="bg-white py-12 border-t">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          🖥 Популярні дисплеї
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Ціни на заміну дисплея для популярних моделей
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {entries.map((entry, i) => {
            const brandData = brandPartsData.find(b => b.id === entry.href.split('/')[1])
            const modelData = brandData?.models.find(m => m.modelCode === entry.modelCode)
            const display = modelData?.parts.display
            const minPrice = display?.[0]?.partCost ?? '—'

            return (
              <Link
                key={i}
                href={entry.href}
                className="group block bg-gray-50 hover:bg-orange-50 rounded-xl p-4 border border-gray-100 
                          hover:border-orange-200 transition-all duration-200"
              >
                <div className="text-xs text-orange-600 font-medium mb-1 uppercase tracking-wide">
                  {entry.brandName}
                </div>
                <div className="text-sm font-semibold text-gray-800 group-hover:text-orange-700 
                              transition-colors mb-2 leading-tight">
                  {entry.modelName}
                </div>
                <div className="text-xs text-gray-400">
                  від <span className="text-gray-700 font-medium">{minPrice}₴</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
