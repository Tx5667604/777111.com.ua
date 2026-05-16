'use client'

import dynamic from 'next/dynamic'

const Counter = dynamic(() => import('@/components/PageViewCounter'), { ssr: false })

export default function ViewCounter({ pagePath }: { pagePath: string }) {
  return <Counter pagePath={pagePath} />
}
