// src/components/admin/VisitCalendar.tsx
// Календарь посещаемости + маршруты + звонки
"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Eye, Calendar, MapPin, Phone } from "lucide-react"

const API_KEY = "AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A"
const PROJECT_ID = "phone-repair-46298"
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"]
const MONTH_NAMES = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"]

type Metric = "visits" | "routes" | "calls"

const METRICS: { key: Metric; label: string; icon: any; color: string; prefix: string }[] = [
  { key: "visits", label: "Відвідування", icon: Eye, color: "text-primary bg-primary/5", prefix: "daily_" },
  { key: "routes", label: "Маршрути", icon: MapPin, color: "text-orange-500 bg-orange-50", prefix: "routes_" },
  { key: "calls", label: "Дзвінки", icon: Phone, color: "text-green-500 bg-green-50", prefix: "calls_" },
]

interface DayData {
  date: string
  count: number
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6
  const days: { date: string; day: number; isToday: boolean; isFuture: boolean }[] = []
  for (let i = 0; i < startOffset; i++) days.push({ date: "", day: 0, isToday: false, isFuture: false })
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d)
    const dateStr = dateObj.toISOString().slice(0, 10)
    days.push({ date: dateStr, day: d, isToday: dateStr === todayStr, isFuture: dateObj > today })
  }
  return days
}

function getHeatColor(count: number, max: number, metric: Metric): string {
  if (count === 0) return "bg-muted/30"
  if (max === 0) return metric === "routes" ? "bg-orange-200" : metric === "calls" ? "bg-green-200" : "bg-green-200"
  const ratio = count / max
  if (ratio > 0.75) return metric === "routes" ? "bg-orange-600 text-white" : metric === "calls" ? "bg-green-600 text-white" : "bg-green-600 text-white"
  if (ratio > 0.5) return metric === "routes" ? "bg-orange-500 text-white" : metric === "calls" ? "bg-green-500 text-white" : "bg-green-500 text-white"
  if (ratio > 0.25) return metric === "routes" ? "bg-orange-400" : metric === "calls" ? "bg-green-400" : "bg-green-400"
  return metric === "routes" ? "bg-orange-200" : metric === "calls" ? "bg-green-200" : "bg-green-200"
}

export default function VisitCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [metric, setMetric] = useState<Metric>("visits")
  const [data, setData] = useState<Record<Metric, DayData[]>>({ visits: [], routes: [], calls: [] })
  const [totals, setTotals] = useState<Record<Metric, number>>({ visits: 0, routes: 0, calls: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "site_stats" }] } }),
        })
        if (!res.ok) return
        const results = await res.json()

        const grouped: Record<string, DayData[]> = { visits: [], routes: [], calls: [] }
        const totalCounts: Record<string, number> = { visits: 0, routes: 0, calls: 0 }

        for (const item of results) {
          if (!item.document) continue
          const id = item.document.name.split("/").pop() || ""
          const fields = item.document.fields || {}
          const count = parseInt(fields.count?.integerValue || "0", 10)

          if (id.startsWith("daily_")) {
            grouped.visits.push({ date: id.replace("daily_", ""), count })
            totalCounts.visits += count
          } else if (id.startsWith("routes_")) {
            grouped.routes.push({ date: id.replace("routes_", ""), count })
            totalCounts.routes += count
          } else if (id.startsWith("calls_")) {
            grouped.calls.push({ date: id.replace("calls_", ""), count })
            totalCounts.calls += count
          }
        }

        for (const key of Object.keys(grouped)) {
          grouped[key].sort((a, b) => b.date.localeCompare(a.date))
        }

        setData(grouped as any)
        setTotals(totalCounts as any)
      } catch {}
    }
    fetchData()
  }, [])

  const currentData = data[metric]
  const currentTotal = totals[metric]
  const days = getMonthDays(year, month)
  const monthDays = currentData.filter((d) => d.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
  const monthTotal = monthDays.reduce((s, d) => s + d.count, 0)
  const maxCount = Math.max(...monthDays.map((d) => d.count), 1)

  const getCount = (dateStr: string): number => {
    const found = currentData.find((d) => d.date === dateStr)
    return found ? found.count : 0
  }

  const currentMetric = METRICS.find((m) => m.key === metric)!

  return (
    <div>
      {/* Счетчики */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all ${
              metric === m.key ? `${m.color} ring-2 ring-offset-1 ring-${m.key === "routes" ? "orange" : m.key === "calls" ? "green" : "primary"}/50` : "bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <m.icon className={`w-5 h-5 ${metric === m.key ? m.color.split(" ")[0] : "text-muted-foreground"}`} />
            <span className="text-2xl font-bold">{totals[m.key].toLocaleString("uk-UA")}</span>
            <span className="text-sm text-muted-foreground">{m.label.toLowerCase()}</span>
          </button>
        ))}
      </div>

      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }}
          className="p-2 hover:bg-accent rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-semibold">{MONTH_NAMES[month]} {year} — {monthTotal.toLocaleString("uk-UA")} {currentMetric.label.toLowerCase()}</h2>
        <button onClick={() => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }}
          className="p-2 hover:bg-accent rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Календарь */}
      <div className="bg-background border rounded-xl p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((name) => (
            <div key={name} className="text-center text-xs font-medium text-muted-foreground py-1">{name}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d.date) return <div key={`empty-${i}`} className="aspect-square" />
            const count = getCount(d.date)
            const heatClass = d.isFuture ? "bg-muted/10" : getHeatColor(count, maxCount, metric)
            return (
              <div key={d.date} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${heatClass} ${d.isToday ? "ring-2 ring-primary ring-offset-1" : ""}`} title={`${d.date}: ${count} ${currentMetric.label.toLowerCase()}`}>
                <span className={`font-medium ${d.isFuture ? "text-muted-foreground/30" : ""}`}>{d.day}</span>
                {!d.isFuture && count > 0 && <span className="text-[9px] leading-none mt-0.5 opacity-80">{count}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>Менше</span>
        {[30, 25, 50, 75, 100].map((pct) => (
          <div key={pct} className={`w-4 h-4 rounded ${getHeatColor(pct, 100, metric)}`} />
        ))}
        <span>Більше</span>
      </div>
    </div>
  )
}
