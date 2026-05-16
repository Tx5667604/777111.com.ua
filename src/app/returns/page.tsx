import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Політика повернення | 777111.com.ua',
  description: 'Умови повернення та гарантії на ремонт телефонів у Вознесенську. Гарантія 14 днів згідно Закону України.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← На головну</Link>
          <span className="text-white/20">|</span>
          <span className="text-orange-400 font-semibold">Політика повернення</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 text-white/80 space-y-8">
        <h1 className="text-3xl font-bold text-white">Політика повернення та гарантії</h1>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-400">1. Гарантія на ремонт</h2>
          <p>На всі виконані роботи надається гарантія <strong>14 днів</strong> згідно Закону України «Про захист прав споживачів».</p>
          <p>Гарантія поширюється на якість виконаних робіт та встановлених запчастин.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-400">2. Умови гарантії</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Гарантія діє за умови відсутності механічних пошкоджень, слідів води, або стороннього втручання після ремонту.</li>
            <li>Випадкові пошкодження (падіння, удари, намокання) не покриваються гарантією.</li>
            <li>Гарантія на акумулятор — перевірка в день отримання. Після виходу з майстерні претензії щодо ємності не приймаються.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-400">3. Повернення запчастин</h2>
          <p>У разі виявлення дефекту запчастини протягом гарантійного терміну — заміна проводиться безкоштовно.</p>
          <p>Повернення оплати за ремонт можливе лише у випадку, якщо робота не була виконана або виконана з порушенням домовленостей.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-400">4. Продаж відновлених телефонів</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>На відновлені телефони діє гарантія <strong>6 місяців</strong>.</li>
            <li>Повернення можливе протягом 14 днів за умови збереження товарного вигляду.</li>
            <li>Гроші повертаються після перевірки стану телефону.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-400">5. Як звернутись</h2>
          <p>Для гарантійного обслуговування або повернення — звертайтесь:</p>
          <ul className="space-y-1">
            <li>📍 м. Вознесенськ</li>
            <li>📞 <a href="tel:+380960777111" className="text-orange-400 hover:underline">+380 96 077 71 11</a></li>
            <li>✉️ <a href="mailto:fit5667604@gmail.com" className="text-orange-400 hover:underline">fit5667604@gmail.com</a></li>
          </ul>
        </section>

        <p className="text-white/40 text-sm pt-8 border-t border-white/10">
          Останнє оновлення: травень 2026
        </p>
      </main>
    </div>
  )
}
