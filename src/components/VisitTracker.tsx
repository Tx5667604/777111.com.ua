// src/components/VisitTracker.tsx
// Невидимый компонент — считает уникальных посетителей за день (1 раз в день на браузер)
// Использует Firestore REST API напрямую (без SDK), чтобы избежать проблем с ленивой загрузкой
"use client"

import { useEffect } from "react"

const STORAGE_KEY = "_777visit"
const API_KEY = "AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A"
const PROJECT_ID = "phone-repair-46298"
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

export default function VisitTracker() {
  useEffect(() => {
    const track = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const lastVisit = localStorage.getItem(STORAGE_KEY)
      if (lastVisit === today) return

      const docId = `daily_${today}`
      const url = `${BASE}/site_stats?key=${API_KEY}&documentId=${docId}`

      try {
        // Сначала пробуем прочитать — если есть, увеличиваем
        const existing = await fetch(
          `${BASE}/site_stats/${docId}?key=${API_KEY}`,
          { method: "GET" }
        ).then((r) => (r.ok ? r.json() : null))

        if (existing) {
          const currentCount = parseInt(existing.fields?.count?.integerValue || "0", 10)
          // Обновляем через PATCH
          await fetch(`${BASE}/site_stats/${docId}?key=${API_KEY}&updateMask.fieldPaths=count`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                count: { integerValue: String(currentCount + 1) },
              },
            }),
          })
        } else {
          // Создаём новый документ
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                count: { integerValue: "1" },
                date: { stringValue: today },
              },
            }),
          })
        }

        localStorage.setItem(STORAGE_KEY, today)
      } catch {
        // Тихий сбой — не влияет на пользователя
      }
    }

    const timer = setTimeout(track, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
}
