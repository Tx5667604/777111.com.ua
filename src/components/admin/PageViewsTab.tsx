'use client'

import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { initFirebase } from '@/lib/firebase'

interface PageStat {
  path: string
  count: number
  url: string
}

export default function PageViewsTab() {
  const [pages, setPages] = useState<PageStat[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [sortBy, setSortBy] = useState<'count' | 'path'>('count')

  const fetchStats = async () => {
    try {
      const { db } = initFirebase()
      const q = query(
        collection(db, 'page_views'),
        orderBy('count', 'desc'),
        limit(200)
      )
      const snap = await getDocs(q)
      const list: PageStat[] = snap.docs.map((d) => ({
        path: d.data().path || d.id,
        count: d.data().count || 0,
        url: d.data().path || '',
      }))
      setPages(list)
    } catch (e) {
      console.error('Failed to load page views:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleReset = async () => {
    if (!confirm('Скинути всю статистику переглядів? Цю дію неможливо відмінити.')) return

    setResetting(true)
    try {
      const { db } = initFirebase()
      const q = query(collection(db, 'page_views'), limit(500))
      const snap = await getDocs(q)

      const promises = snap.docs.map((d) => deleteDoc(doc(db, 'page_views', d.id)))
      await Promise.all(promises)

      setPages([])
      alert('Статистику скинуто!')
    } catch (e) {
      console.error('Failed to reset stats:', e)
      alert('Помилка при скиданні статистики')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Завантаження статистики...</p>
      </div>
    )
  }

  const sorted = [...pages].sort((a, b) =>
    sortBy === 'count' ? b.count - a.count : a.path.localeCompare(b.path)
  )

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-semibold">Перегляди сторінок дисплеїв</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={resetting || pages.length === 0}
            className="px-3 py-1.5 text-sm rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {resetting ? 'Скидаю...' : 'Скинути статистику'}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'count' | 'path')}
            className="border rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="count">За кількістю переглядів</option>
            <option value="path">За назвою</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-500 text-sm">Статистика поки що порожня</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Сторінка</th>
                <th className="pb-2 font-medium text-right">Перегляди</th>
                <th className="pb-2 font-medium text-right">Посилання</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((page) => (
                <tr key={page.path} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <span className="text-xs font-mono text-gray-800">
                      {page.path}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums">
                    {page.count.toLocaleString('uk-UA')}
                  </td>
                  <td className="py-2 text-right">
                    <a
                      href={`https://777111.com.ua${page.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      Відкрити ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Всього сторінок: {pages.length} | Оновлюється автоматично
      </p>
    </div>
  )
}
