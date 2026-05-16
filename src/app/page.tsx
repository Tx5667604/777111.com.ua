'use client'

import Header from '@/components/sections/Header'
import Hero from '@/components/sections/Hero'
import Services from '@/components/sections/Services'
import Advantages from '@/components/sections/Advantages'
import PriceCalculator from '@/components/sections/PriceCalculator'
import PhoneGallery from '@/components/sections/PhoneGallery'
import FAQ from '@/components/sections/FAQ'
import Reviews from '@/components/sections/Reviews'
import Appointment from '@/components/sections/Appointment'
import Contacts from '@/components/sections/Contacts'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <Advantages />
        <PriceCalculator />
        <PhoneGallery />
        <FAQ />
        <Reviews />
        <Appointment />
        <Contacts />
      </main>
      <Footer />
    </div>
  )
}
