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
import Script from "next/script";

const GA_ID = "G-LYHH8N7276";

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
    // Українською (чітке семантичне ядро)
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
          {/* Google Analytics with PII sanitizer */}
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // PII sanitizer — intercept gtag calls and strip personally identifiable information
              // Also sanitizes URL parameters before they reach Google Analytics
              const PII_FIELDS = ['name','email','phone','tel','user_name','user_email',
                'form_name','form_email','form_phone','first_name','last_name',
                'client_name','client_email','client_phone','sender_name','sender_email',
                'to_name','to_email','from_name','from_email','customer_name',
                'customer_email','customer_phone','full_name','address','street_address',
                'user_address','contact_name','contact_email','contact_phone',
                'billing_name','billing_email','billing_phone','shipping_name',
                'shipping_email','shipping_phone'];

              // Sanitize URL — strip query params that look like PII
              function sanitizeUrl(url) {
                try {
                  const u = new URL(url);
                  const cleanParams = new URLSearchParams();
                  let hasPii = false;
                  for (const [key, val] of u.searchParams) {
                    const lowerKey = key.toLowerCase();
                    if (PII_FIELDS.includes(lowerKey) ||
                        lowerKey.includes('phone') ||
                        lowerKey.includes('email') ||
                        lowerKey.includes('name') ||
                        lowerKey.includes('address') ||
                        lowerKey.includes('contact') ||
                        lowerKey.includes('client')) {
                      hasPii = true;
                      continue;
                    }
                    cleanParams.append(key, val);
                  }
                  const cleanSearch = cleanParams.toString();
                  const result = u.origin + u.pathname + (cleanSearch ? '?' + cleanSearch : '') + u.hash;
                  return hasPii ? result : url;
                } catch(e) {
                  return url;
                }
              }

              const _gtagPush = dataLayer.push.bind(dataLayer);
              dataLayer.push = function() {
                for (let i = 0; i < arguments.length; i++) {
                  const arg = arguments[i];
                  if (typeof arg === 'object' && arg !== null) {
                    // Strip PII from event parameters
                    if (arg[0] === 'event' || arg[0] === 'set' || arg[0] === 'config') {
                      const params = arg[2];
                      if (params && typeof params === 'object') {
                        for (const field of PII_FIELDS) {
                          if (field in params) {
                            params[field] = '[REDACTED]';
                          }
                        }
                        // Sanitize page_location and page_referrer
                        if (params.page_location) {
                          params.page_location = sanitizeUrl(params.page_location);
                        }
                        if (params.page_referrer) {
                          params.page_referrer = sanitizeUrl(params.page_referrer);
                        }
                        // Sanitize page_path — only keep the path, strip query
                        if (params.page_path && params.page_path.includes('?')) {
                          params.page_path = params.page_path.split('?')[0];
                        }
                      }
                    }
                  }
                }
                return _gtagPush.apply(this, arguments);
              };

              // Also sanitize initial page_view
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: sanitizeUrl(window.location.href).split(window.location.host)[1] || window.location.pathname,
                page_location: sanitizeUrl(window.location.href),
              });
            `}
          </Script>
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
