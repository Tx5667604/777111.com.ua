'use client'

import { useState, useEffect } from 'react'
import { Eye, Phone, MapPin, Users, TrendingUp, Calendar } from 'lucide-react'

const API_KEY = 'AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A'
const PROJECT_ID = 'phone-repair-46298'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

interface DailyStats {
  date: string
  visitors: number
  phoneClicks: number
  mapClicks: number
}

interface PageStat {
  path: string
  count: number
}

export default function StatsDashboard() {
  const [loading, setLoading] = useState(true)
  const [dailyVisitors, setDailyVisitors] = useState<DailyStats[]>([])
  const [totalViews, setTotalViews] = useState(0)
  const [totalPhoneClicks, setTotalPhoneClicks] = useState(0)
  const [totalMapClicks, setTotalMapClicks] = useState(0)
  const [topPages, setTopPages] = useState<PageStat[]>([])
  const [allTimeViews, setAllTimeViews] = useState(0)
  const [todayViews, setTodayViews] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get daily visitors for last 14 days
        const statsResp = await fetch(`${BASE}/site_stats?key=${API_KEY}&orderBy=date%20desc&pageSize=14`, {
          method: 'GET',
        })
        if (statsResp.ok) {
          const statsData = await statsResp.json()
          const daily: DailyStats[] = (statsData.documents || []).map((d: any) => ({
            date: d.fields?.date?.stringValue || '',
            visitors: parseInt(d.fields?.count?.integerValue || '0', 10),
            phoneClicks: 0,
            mapClicks: 0,
          }))
          setDailyVisitors(daily)
        }

        // 2. Get today's visitors
        const today = new Date().toISOString().slice(0, 10)
        const todayResp = await fetch(`${BASE}/site_stats/daily_${today}?key=${API_KEY}`, {
          method: 'GET',
        })
        if (todayResp.ok) {
          const td = await todayResp.json()
          setTodayViews(parseInt(td.fields?.count?.integerValue || '0', 10))
        }

        // 3. Get page views (total + top pages) via REST list
        const viewsResp = await fetch(`${BASE}/page_views?key=${API_KEY}&pageSize=500`, {
          method: 'GET',
        })
        if (viewsResp.ok) {
          const viewsData = await viewsResp.json()
          const pages: PageStat[] = []
          let total = 0
          for (const doc of viewsData.documents || []) {
            const count = parseInt(doc.fields?.count?.integerValue || '0', 10)
            const path = doc.fields?.path?.stringValue || doc.name.split('/').pop() || ''
            total += count
            pages.push({ path, count })
          }
          // Sort by count descending
          pages.sort((a, b) => b.count - a.count)
          setTotalViews(total)
          setTopPages(pages.slice(0, 20))
          setAllTimeViews(total)
        }

        // 4. Get action stats (phone + map clicks)
        const actionsResp = await fetch(`${BASE}/actions?key=${API_KEY}&pageSize=1000`, {
          method: 'GET',
        })
        if (actionsResp.ok) {
          const actionsData = await actionsResp.json()
          let phoneTotal = 0
          let mapTotal = 0
          for (const doc of actionsData.documents || []) {
            const type = doc.fields?.type?.stringValue || ''
            const count = parseInt(doc.fields?.count?.integerValue || '0', 10)
            if (type === 'phone') phoneTotal += count
            else if (type === 'map') mapTotal += count
          }
          setTotalPhoneClicks(phoneTotal)
          setTotalMapClicks(mapTotal)
        }
      } catch (e) {
        console.error('Stats error:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-pulse">Завантаження статистики...</div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold">📊 Загальна статистика сайту</h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span>Переглядів (всього)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{allTimeViews.toLocaleString('uk-UA')}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Users className="w-4 h-4 text-green-500" />
            <span>Відвідувачів сьогодні</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{todayViews.toLocaleString('uk-UA')}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Phone className="w-4 h-4 text-red-500" />
            <span>Дзвінків (всього)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalPhoneClicks.toLocaleString('uk-UA')}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>Переходів на карту</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalMapClicks.toLocaleString('uk-UA')}</div>
        </div>
      </div>

      {/* Daily visitors chart (simplified) */}
      {dailyVisitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            Відвідувачі за останні дні
          </h4>
          <div className="flex items-end gap-2 h-24 overflow-x-auto pb-2">
            {dailyVisitors.slice().reverse().map((day) => {
              const max = Math.max(...dailyVisitors.map(d => d.visitors), 1)
              const height = Math.max((day.visitors / max) * 100, 4)
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] font-medium text-gray-600">{day.visitors}</span>
                  <div
                    className="w-8 bg-blue-500 rounded-t-md transition-all"
                    style={{ height: `${height}%`, minHeight: 4 }}
                  />
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                    {day.date.slice(5)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Pages */}
      {topPages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Топ-20 сторінок
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Сторінка</th>
                  <th className="pb-2 font-medium text-right">Перегляди</th>
                  <th className="pb-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page) => (
                  <tr key={page.path} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1.5 pr-4">
                      <span className="text-xs font-mono text-gray-800 truncate block max-w-[300px]">
                        {page.path}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">
                      {page.count.toLocaleString('uk-UA')}
                    </td>
                    <td className="py-1.5 text-right text-gray-400 tabular-nums">
                      {allTimeViews > 0 ? ((page.count / allTimeViews) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
