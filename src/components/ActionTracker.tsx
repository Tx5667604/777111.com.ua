'use client'

import { useEffect } from 'react'

const API_KEY = 'AIzaSyCGDrySQ6zeB-EGS-eq-5zphz73evMQc9A'
const PROJECT_ID = 'phone-repair-46298'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

export default function ActionTracker() {
  useEffect(() => {
    const track = async (type: 'phone' | 'map', pagePath: string) => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const docId = `${type}_${pagePath.replace(/[^a-zA-Z0-9_-]/g, '_')}_${today}`

        // Try to read existing, if exists increment
        const existing = await fetch(`${BASE}/actions/${docId}?key=${API_KEY}`, {
          method: 'GET',
        }).then(r => r.ok ? r.json() : null)

        if (existing) {
          const currentCount = parseInt(existing.fields?.count?.integerValue || '0', 10)
          await fetch(`${BASE}/actions/${docId}?key=${API_KEY}&updateMask.fieldPaths=count`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: { count: { integerValue: String(currentCount + 1) } },
            }),
          })
        } else {
          await fetch(`${BASE}/actions?key=${API_KEY}&documentId=${docId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                count: { integerValue: '1' },
                type: { stringValue: type },
                pagePath: { stringValue: pagePath },
                date: { stringValue: today },
              },
            }),
          })
        }
      } catch {
        // Silent fail
      }
    }

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (!link) return

      const href = link.getAttribute('href') || ''
      const pagePath = window.location.pathname

      if (href.startsWith('tel:')) {
        track('phone', pagePath)
      } else if (href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) {
        track('map', pagePath)
      }
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return null
}
