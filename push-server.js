#!/usr/bin/env node
/**
 * Push Notification Server for 777111.com.ua
 * 
 * Запуск: node ~/Desktop/777111-temp/push-server.js
 * Принимает POST запросы на http://localhost:3999/push
 * 
 * Тело запроса:
 * {
 *   "subscription": {...}  // PushSubscription JSON из Firestore
 *   "title": "✅ Замовлення готове!",
 *   "body": "Ваш телефон готовий до видачі",
 *   "url": "/account"
 * }
 */

const http = require("http")
const webpush = require("web-push")

const VAPID_PUBLIC_KEY = "BFEfOSwm3Tc9ZDxk8SkNL07qsw5x-3maAE6i31QLSyolp8Ga8Ek-kZvc0tj2lBcjZcPGRpILmdv8ApXN7B749Cc"
const VAPID_PRIVATE_KEY = "93aTnjQ7k49ASiQv_-78GZrph7oWGnWQ1OjzC8PhvDA"

webpush.setVapidDetails(
  "mailto:fit5667604@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const PORT = 3999

const server = http.createServer(async (req, res) => {
  // CORS for localhost
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.writeHead(200)
    res.end()
    return
  }

  if (req.method !== "POST" || req.url !== "/push") {
    res.writeHead(404)
    res.end(JSON.stringify({ error: "Not found" }))
    return
  }

  let body = ""
  req.on("data", (chunk) => (body += chunk))

  req.on("end", async () => {
    try {
      const { subscription, title, body: messageBody, url } = JSON.parse(body)

      if (!subscription || !subscription.endpoint) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: "Missing subscription" }))
        return
      }

      const payload = JSON.stringify({
        title: title || "777 Ремонт",
        body: messageBody || "Нове повідомлення",
        icon: "/icons/icon-192.png",
        url: url || "/",
      })

      await webpush.sendNotification(subscription, payload)

      console.log(`✅ Push sent to ${subscription.endpoint.substring(0, 50)}...`)
      res.writeHead(200)
      res.end(JSON.stringify({ success: true }))
    } catch (err) {
      console.error("❌ Push error:", err.message || err)
      res.writeHead(500)
      res.end(JSON.stringify({ error: err.message || "Push failed" }))
    }
  })
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Push server running on http://127.0.0.1:${PORT}`)
  console.log(`   POST /push — send push notification`)
})
