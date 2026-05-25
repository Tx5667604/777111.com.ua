'use client'

import Header from '@/components/sections/Header'
import Hero from '@/components/sections/Hero'
import Services from '@/components/sections/Services'
import Advantages from '@/components/sections/Advantages'
import PriceCalculator from '@/components/sections/PriceCalculator'
import PhoneGallery from '@/components/sections/PhoneGallery'
import SEOLinks from '@/components/sections/SEOLinks'
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
      {/* Russian SEO block — виден пользователям и индексируется Google */}
      <section className="bg-gray-50 border-t py-12">
        <div className="max-w-4xl mx-auto px-4 text-sm text-gray-600 leading-relaxed space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Ремонт телефонов в Вознесенске — быстро, качественно, с гарантией</h2>
          <p>
            Мастерская Александра Панибратенко в Вознесенске предлагает профессиональный ремонт
            телефонов всех брендов: iPhone, Samsung, Xiaomi, Huawei и других. Замена экрана,
            дисплея, стекла, аккумулятора, разъема зарядки, динамика, микрофона, кнопок,
            а также разблокировка iCloud и прошивка телефона. Используем оригинальные запчасти
            и качественные аналоги. Гарантия на все работы до 12 месяцев. Бесплатная диагностика
            в день обращения.
          </p>
          <p>
            <strong>Адрес:</strong> г. Вознесенск, Николаевская обл., Центральный рынок, сектор Б, контейнер 96.
            <br />
            <strong>График:</strong> Вт–Вс: 9:00–16:00, Пн: выходной.
            <br />
            <strong>Телефон:</strong> +38 (096) 077-71-11
          </p>
          <p>
            Цены на ремонт телефонов в Вознесенске — от 350 грн. Недорогой и качественный
            ремонт смартфонов, восстановленные телефоны с гарантией. Мастер по ремонту
            телефонов в Вознесенске и Николаевской области.
          </p>
        </div>
      </section>
      <SEOLinks />
      <Footer />
    </div>
  )
}
