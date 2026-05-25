'use client'

import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function SEOLinks() {
  const brands = brandPartsData
    .map(b => ({
      id: b.id,
      name: b.name,
      displayModels: b.models.filter(m => m.parts.display),
    }))
    .filter(b => b.displayModels.length > 0)
    .sort((a, b) => b.displayModels.length - a.displayModels.length)

  return (
    <nav
      aria-label="Карта сайта"
      className="bg-gray-50 border-t py-4"
    >
      <div className="max-w-6xl mx-auto px-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          🖥 Всі дисплеї — {brands.reduce((s, b) => s + b.displayModels.length, 0)} моделей
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-x-4 gap-y-2">
          {brands.map((brand) => (
            <details key={brand.id} className="group text-xs">
              <summary className="cursor-pointer text-gray-400 hover:text-orange-600 font-medium mb-1">
                {brand.name} ({brand.displayModels.length})
              </summary>
              <div className="space-y-0.5 mt-0.5">
                {brand.displayModels.map((model) => (
                  <Link
                    key={model.modelCode}
                    href={`/${brand.id}/display/${slug(model.modelCode)}`}
                    className="block text-gray-300 hover:text-orange-600 transition-colors truncate"
                  >
                    {model.modelName}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </nav>
  )
}
