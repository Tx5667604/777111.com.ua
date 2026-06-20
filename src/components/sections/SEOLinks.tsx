'use client'

import { useState } from 'react'
import { brandPartsData } from '@/app/phone-parts-data'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const PART_SECTIONS = [
  { id: 'display', urlType: 'display', label: '🖥 Дисплеї' },
  { id: 'charging_flex', urlType: 'charging-flex', label: '🔌 Шлейфи зарядки' },
  { id: 'battery', urlType: 'battery', label: '🔋 Акумулятори' },
  { id: 'back_cover', urlType: 'back-cover', label: '📱 Задні кришки' },
  { id: 'glass', urlType: 'glass', label: '🪟 Скло екрану' },
  { id: 'speaker', urlType: 'speaker', label: '🔊 Динаміки' },
  { id: 'camera', urlType: 'camera', label: '📷 Камери' },
  { id: 'microphone', urlType: 'microphone', label: '🎤 Мікрофони' },
  { id: 'buttons', urlType: 'buttons', label: '🔘 Кнопки' },
  { id: 'connector', urlType: 'connector', label: "🔗 Роз'єми" },
]

interface Props {
  currentType?: string
  singleSection?: string
  showAll?: boolean
}

export default function SEOLinks({ currentType, singleSection, showAll }: Props) {
  const initialExpanded = showAll ? '__all' : (currentType ?? null)
  const [expanded, setExpanded] = useState<string | null>(initialExpanded)

  // Pre-compute all brands × parts data
  const brands = brandPartsData
    .map((b) => ({
      id: b.id,
      name: b.name,
      parts: PART_SECTIONS.map((sec) => ({
        secId: sec.id,
        models: b.models.filter((m) => m.parts[sec.id]),
      })),
    }))
    .filter((b) => b.parts.some((p) => p.models.length > 0))
    .sort((a, b) => {
      const at = a.parts.reduce((s, p) => s + p.models.length, 0)
      const bt = b.parts.reduce((s, p) => s + p.models.length, 0)
      return bt - at
    })

  const getTotal = (si: number) => brands.reduce((s, b) => s + (b.parts[si]?.models.length || 0), 0)
  const getBrandsWithModels = (si: number) => brands.filter((b) => (b.parts[si]?.models.length || 0) > 0)

  // Filter sections: if singleSection is set, show only that; otherwise all
  const visibleSections = singleSection
    ? PART_SECTIONS.filter((s) => s.urlType === singleSection)
    : PART_SECTIONS

  return (
    <nav aria-label="Карта сайта" className="bg-gray-50 border-t py-6">
      <div className="max-w-6xl mx-auto px-4">
        {!singleSection && (
          <button
            onClick={() => setExpanded(expanded === '__all' ? null : '__all')}
            className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
          >
            <ChevronRight
              className={`w-3 h-3 transition-transform ${expanded === '__all' ? 'rotate-90' : ''}`}
            />
            📋 Карта сайта (всі сторінки)
          </button>
        )}

        <div className="space-y-6">
          {visibleSections.map((section, si) => {
            const originalIndex = PART_SECTIONS.indexOf(section)
            const isOpen = expanded === section.urlType || expanded === '__all'
            const total = getTotal(originalIndex)
            return (
              <div key={section.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : section.urlType)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 select-none hover:text-gray-600 transition-colors"
                >
                  <ChevronRight
                    className={`w-2.5 h-2.5 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                  />
                  {section.label} — {total} моделей
                </button>
                {(singleSection || isOpen) ? (
                <div className={isOpen ? '' : 'hidden'}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-x-4 gap-y-2">
                    {getBrandsWithModels(originalIndex).map((brand) => (
                      <div key={`${section.id}-${brand.id}`} className="text-xs">
                        <div className="font-medium text-gray-400 hover:text-orange-600 transition-colors mb-1">
                          {brand.name} ({brand.parts[originalIndex].models.length})
                        </div>
                        <div className="space-y-0.5">
                          {brand.parts[originalIndex].models.map((model) => (
                            <Link
                              key={model.modelCode}
                              href={`/${brand.id}/${section.urlType}/${slug(model.modelCode)}`}
                              className="block text-gray-300 hover:text-gray-600 transition-colors truncate"
                            >
                              {model.modelName}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {singleSection && (
          <div className="mt-6 text-center">
            <Link
              href="/sitemap"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
            >
              Повна карта сайту (всі запчастини) →
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
