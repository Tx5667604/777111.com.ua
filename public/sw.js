// Service Worker for PWA + Push Notifications — v3
const CACHE_NAME = "777-cache-v3"
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo.svg",
]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch(() => {})
    )
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  )
})

// Handle push notifications
self.addEventListener("push", (event) => {
  let data = { title: "777 Ремонт", body: "Нове повідомлення", icon: "/icons/icon-192.png" }
  try {
    if (event.data) {
      data = JSON.parse(event.data.text())
    }
  } catch {}

  const options = {
    body: data.body || "Нове повідомлення",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: data.url || "/" },
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "777 Ремонт", options)
  )
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/account") ||
    url.hostname === "firestore.googleapis.com" ||
    url.hostname === "api.telegram.org" ||
    url.pathname.endsWith(".txt")
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response("", { status: 503 })))
    return
  }

  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone())
            return response
          })
          return cached || fetchPromise
        })
      )
    )
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
