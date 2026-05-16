// src/lib/routeTracker.ts
// Лічильники натискань "Маршрут" та "Телефон"

const API_KEY = "AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A"
const PROJECT_ID = "phone-repair-46298"
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function incrementCounter(docId: string) {
  try {
    const res = await fetch(`${BASE}/site_stats/${docId}?key=${API_KEY}`)
    const data = res.ok ? await res.json() : null

    if (data?.fields) {
      const current = parseInt(data.fields.count?.integerValue || "0", 10)
      await fetch(`${BASE}/site_stats/${docId}?key=${API_KEY}&updateMask.fieldPaths=count`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { count: { integerValue: String(current + 1) } } }),
      })
    } else {
      const date = docId.replace(/^(routes|calls)_/, "")
      await fetch(`${BASE}/site_stats?key=${API_KEY}&documentId=${docId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: { count: { integerValue: "1" }, date: { stringValue: date }, type: { stringValue: docId.startsWith("routes") ? "route" : "call" } },
        }),
      })
    }
  } catch {}
}

export function trackRouteClick() {
  const today = new Date().toISOString().slice(0, 10)
  incrementCounter(`routes_${today}`)
}

export function trackPhoneClick() {
  const today = new Date().toISOString().slice(0, 10)
  incrementCounter(`calls_${today}`)
}
