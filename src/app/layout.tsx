import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { FloatingAdminButton } from "@/components/admin/FloatingAdminButton";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import VisitTracker from "@/components/VisitTracker";
import ChatWidget from "@/components/chat/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

const siteUrl = "https://777111.com.ua";

export const metadata: Metadata = {
  title: {
    default: "Ремонт телефонів у Вознесенську | Олександр Панібратенко",
    template: "%s | Ремонт телефонів Вознесенськ",
  },
  description:
    "Професійний ремонт телефонів у Вознесенську, Миколаївська область. Заміна екрана, дисплея, скла, акумулятора. Розблокування iCloud, прошивка. Ремонт iPhone, Samsung, Xiaomi. Відновлені телефони. Безкоштовна діагностика. Гарантія до 12 місяців. +38 (096) 077-71-11",
  keywords: [
    // Українською
    "ремонт телефонів Вознесенськ",
    "ремонт смартфонів Вознесенськ",
    "заміна екрана Вознесенськ",
    "заміна скла на телефоні Вознесенськ",
    "заміна дисплея Вознесенськ",
    "заміна акумулятора Вознесенськ",
    "ремонт айфон Вознесенськ",
    "розблокування iCloud",
    "прошивка телефону Вознесенськ",
    "ремонт після заливки Вознесенськ",
    "відновлені телефони Вознесенськ",
    "купити бу телефон Вознесенськ",
    "ремонт телефонів ціни Вознесенськ",
    "ремонт телефонів недорого Вознесенськ",
    "терміновий ремонт телефонів Вознесенськ",
    "безкоштовна діагностика телефону",
    "майстер по ремонту телефонів Вознесенськ",
    "ремонт телефонів Миколаївська область",
    // Русский (для русскоязычных запросов)
    "ремонт телефонов Вознесенск",
    "ремонт смартфонов Вознесенск",
    "замена экрана Вознесенск",
    "замена стекла на телефоне Вознесенск",
    "замена дисплея Вознесенск",
    "замена аккумулятора Вознесенск",
    "ремонт айфон Вознесенск",
    "разблокировка iCloud",
    "прошивка телефона Вознесенск",
    "восстановленные телефоны Вознесенск",
    "ремонт телефонов цены Вознесенск",
    "ремонт телефонов недорого Вознесенск",
    "срочный ремонт телефонов Вознесенск",
    "мастер по ремонту телефонов Вознесенск",
    "ремонт телефонов Николаевская область",
  ],
  authors: [{ name: "Олександр Панібратенко" }],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  verification: {
    google: "91O_NUTFRgCA4EG2rkHQcx26fxukYcsfVdfbRP33IXA",
  },
  openGraph: {
    title: "Ремонт телефонів у Вознесенську — швидко, якісно",
    description:
      "Професійний ремонт телефонів у Вознесенську. Заміна екрана, акумулятора, скла, дисплея. Розблокування iCloud, прошивка. Ремонт iPhone, Samsung, Xiaomi. Відновлені телефони. Безкоштовна діагностика. +38 (096) 077-71-11",
    url: siteUrl,
    siteName: "Олександр Панібратенко — Ремонт телефонів",
    type: "website",
    locale: "uk_UA",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ремонт телефонів у Вознесенську",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ремонт телефонів у Вознесенську",
    description:
      "Професійний ремонт телефонів з гарантією. Заміна екрана, акумулятора, розблокування.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "theme-color": "#1a1a2e",
    "hreflang": "uk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data for Local Business */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="Ремонт 777" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <link rel="apple-touch-icon" href="/icons/icon-192.png" />
          <script
            type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Олександр Панібратенко — Ремонт телефонів",
              description:
                "Професійний ремонт телефонів у Вознесенську, Миколаївська область",
              url: siteUrl,
              telephone: "+380960777111",
              email: "fit5667604@gmail.com",
              image: `${siteUrl}/og-image.png`,
              address: {
                "@type": "PostalAddress",
                streetAddress: "Центральний ринок, сектор Б, контейнер 96",
                addressLocality: "Вознесенськ",
                addressRegion: "Миколаївська область",
                addressCountry: "UA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 47.5627,
                longitude: 31.3382,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ],
                  opens: "09:00",
                  closes: "16:00",
                },
              ],
              priceRange: "$$",
              areaServed: ["Вознесенськ", "Миколаївська область"],
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Послуги ремонту телефонів",
                itemListElement: [
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Заміна екрана телефону",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Заміна акумулятора",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Розблокування iCloud",
                    },
                  },
                  {
                    "@type": "Offer",
                    itemOffered: {
                      "@type": "Service",
                      name: "Прошивка телефону",
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <CartProvider>
            {children}
          <PwaInstallPrompt />
          <FloatingAdminButton />
          <VisitTracker />
          <ChatWidget />
          <Toaster richColors position="top-right" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ("serviceWorker" in navigator) {
                  window.addEventListener("load", () => {
                    navigator.serviceWorker.register("/sw.js?v=${Date.now()}");
                  });
                }
              `,
            }}
          />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
