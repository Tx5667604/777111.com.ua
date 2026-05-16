'use client'

import { useEffect } from 'react'
import { increment, doc, setDoc, getDoc } from 'firebase/firestore'
import { initFirebase } from '@/lib/firebase'

const STORAGE_KEY = '777111_viewed_pages'

export default function PageViewCounter({ pagePath }: { pagePath: string }) {
  useEffect(() => {
    const count = async () => {
      try {
        // Check if already counted in this session
        const stored = sessionStorage.getItem(STORAGE_KEY)
        const viewed = stored ? JSON.parse(stored) : []
        if (viewed.includes(pagePath)) return

        const { db } = initFirebase()
        const ref = doc(db, 'page_views', pagePath.replace(/\//g, '_') || 'home')

        // Atomic increment
        await setDoc(ref, { count: increment(1), path: pagePath }, { merge: true })

        // Mark as counted
        viewed.push(pagePath)
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(viewed))
      } catch (e) {
        // Silent fail — analytics shouldn't break the page
        console.warn('PageViewCounter error:', e)
      }
    }
    count()
  }, [pagePath])

  return null
}
