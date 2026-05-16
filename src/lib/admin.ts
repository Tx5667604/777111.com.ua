// Утиліти для перевірки прав адміна
// Адміни зберігаються в Firestore, керує ними superadmin

const SUPERADMIN = 'fit5667604@gmail.com'
const FALLBACK_ADMINS = [SUPERADMIN, 'pavlovich2008@gmail.com', 'vihnykov354@gmail.com', 'perpetoto@gmail.com', 'fenixdutkaev@gmail.com']

// Завантажити список адмінів з Firestore
export async function loadAdmins(): Promise<string[]> {
  try {
    const { initFirebase } = await import('./firebase')
    const { doc, getDoc } = await import('firebase/firestore')
    const { db } = initFirebase()
    const snap = await getDoc(doc(db, 'config', 'admins'))
    if (snap.exists() && Array.isArray(snap.data().emails)) {
      const emails = snap.data().emails as string[]
      // superadmin завжди є
      if (!emails.includes(SUPERADMIN)) emails.push(SUPERADMIN)
      return emails
    }
  } catch {}
  return FALLBACK_ADMINS
}

// Хук для React компонентів
import { useState, useEffect } from 'react'

export function useAdmins() {
  const [admins, setAdmins] = useState<string[]>(FALLBACK_ADMINS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdmins().then(setAdmins).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return { admins, loading, isSuperadmin: (email?: string | null) => email === SUPERADMIN }
}

export function isSuperadmin(email?: string | null): boolean {
  return email === SUPERADMIN
}
