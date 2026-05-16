'use client'

import { Wrench, Phone, MapPin, Instagram, MessageCircle, Heart } from 'lucide-react'
import { trackPhoneClick } from '@/lib/routeTracker'

const navLinks = [
  { href: '/#hero', label: 'Головна' },
  { href: '/#calculator', label: 'Ціни' },
  { href: '/#gallery', label: 'Товари' },
  { href: '/#contacts', label: 'Контакти' },
]

const serviceLinks = [
  { href: '/zamina-ekrana', label: 'Заміна екрана' },
  { href: '/zamina-akumuliatora', label: 'Заміна акумулятора' },
  { href: '/remont-iphone', label: 'Ремонт iPhone' },
  { href: '/remont-samsung', label: 'Ремонт Samsung' },
  { href: '/remont-xiaomi', label: 'Ремонт Xiaomi' },
  { href: '/rozblokuvannja-icloud', label: 'Розблокування iCloud' },
  { href: '/proshivka-telefonu', label: 'Прошивка телефону' },
  { href: '/remont-pislya-zalyvky', label: 'Ремонт після заливки' },
  { href: '/vidnovleni-telefony', label: 'Відновлені телефони' },
]

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/mobihelp_voznesensk' },
  { icon: MessageCircle, label: 'Telegram', href: 'https://t.me/tx5667604bot' },
  { icon: Phone, label: 'Viber', href: 'viber://chat?number=%2B380960777111' },
  { icon: Phone, label: 'WhatsApp', href: 'https://wa.me/380960777111' },
]

export default function Footer() {
  const handleNavClick = (href: string) => {
    if (href.startsWith('/')) {
      window.location.href = href
    } else {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-white">
                Олександр <span className="text-primary">Ремонт</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Професійний ремонт телефонів у Вознесенську. Більше 10 років досвіду. Гарантія якості на всі роботи.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary/20 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-4">Навігація</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Послуги</h4>
            <ul className="space-y-2">
              {serviceLinks.map((service, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleNavClick(service.href)}
                    className="text-sm text-gray-400 hover:text-primary transition-colors"
                  >
                    {service.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Контакти</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400">
                  м. Вознесенськ, Миколаївська обл., Центральний ринок
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <a
                  href="tel:+380960777111" onClick={trackPhoneClick}
                  className="text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  +38 (096) 077-71-11
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Олександр Панібратенко. Усі права захищені.
          </p>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Ремонт телефонів у Вознесенську
          </p>
        </div>
      </div>
    </footer>
  )
}