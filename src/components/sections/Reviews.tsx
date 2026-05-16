'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Reviews() {
  return (
    <section className="py-16 sm:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-primary font-semibold text-sm uppercase tracking-wider">
          Відгуки
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
          Допоможіть нам стати краще
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-8">
          Нам важлива ваша думка! Залиште відгук про нашу роботу на Google Maps.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-primary hover:bg-primary/90 gap-2 text-base h-12 px-8"
        >
          <a
            href="https://www.google.com/maps/place/?q=place_id:PLACE_ID"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-5 h-5" />
            Залишити відгук на Google Maps
          </a>
        </Button>
      </div>
    </section>
  )
}
