'use client'

import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function PopularDisplays() {
  // Filter brands that have models with display parts, sort by model count descending
  const brandsWithDisplays = brandPartsData
    .map(b => ({
      ...b,
      displayModels: b.models.filter(m => m.parts.display),
    }))
    .filter(b => b.displayModels.length > 0)
    .sort((a, b) => b.displayModels.length - a.displayModels.length)

  const totalModels = brandsWithDisplays.reduce((s, b) => s + b.displayModels.length, 0)

  return (
    <section className="bg-white py-12 border-t">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          🖥 Всі дисплеї
        </h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Повний каталог дисплеїв — {totalModels} моделей
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandsWithDisplays.map((brand) => (
            <div key={brand.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              {/* Brand header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
                {brand.logo.startsWith('/') ? (
                  <img src={brand.logo} alt="" className="w-8 h-6 object-contain" />
                ) : (
                  <span className="text-xl">{brand.logo}</span>
                )}
                <span className="font-semibold text-gray-800">{brand.name}</span>
                <span className="text-xs text-gray-400">({brand.displayModels.length})</span>
              </div>

              {/* Model links — all visible in HTML */}
              <div className="p-2 max-h-[500px] overflow-y-auto space-y-0.5">
                {brand.displayModels.map((model) => {
                  const displayPrice = model.parts.display?.[0]?.partCost
                  return (
                    <Link
                      key={model.modelCode}
                      href={`/${brand.id}/display/${slug(model.modelCode)}`}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg 
                                hover:bg-orange-50 hover:text-orange-700 transition-colors text-sm"
                    >
                      <span className="text-gray-700 hover:text-orange-700">{model.modelName}</span>
                      {displayPrice && (
                        <span className="text-xs text-gray-400 font-mono whitespace-nowrap ml-2">від {displayPrice}₴</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
