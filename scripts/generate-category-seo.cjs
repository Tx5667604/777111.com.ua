#!/usr/bin/env node
/**
 * Генерация SEO-текстов для конкретной категории запчастей через Gemini 2.5 Flash Lite
 * 
 * Использование: node scripts/generate-category-seo.cjs <partType> [lang]
 *   partType: battery, charging-flex, back-cover, glass, speaker, camera, microphone, buttons, connector
 *   lang: uk (default) или ru
 * 
 * Пример: node scripts/generate-category-seo.cjs battery uk
 *         node scripts/generate-category-seo.cjs battery ru
 */

const GEMINI_KEY = 'AIzaSyBVpTcGh_413iCcdM_qoPVfg8nYs2236TA'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'

const fs = require('fs')
const path = require('path')

const partType = process.argv[2]
const lang = process.argv[3] || 'uk'

// Map URL partType to storage prefix (some use underscores in keys)
const STORAGE_KEYS = {
  'charging-flex': 'charging_flex',
  'back-cover': 'back_cover',
}
const storagePrefix = (STORAGE_KEYS[partType] || partType) + ':'

if (!partType) {
  console.error('Usage: node scripts/generate-category-seo.cjs <partType> [uk|ru]')
  process.exit(1)
}

const PARTS_SEO_FILE = path.join(__dirname, '..', 'src', 'app', lang === 'ru' ? 'parts-seo-ru.json' : 'parts-seo.json')

// Category-specific prompts for Gemini
const CATEGORY_PROMPTS = {
  battery: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни акумулятора. Згадай конкретну модель телефону, бренд. Напиши про ознаки зносу батареї, важливість якісної заміни, гарантію. 40-70 слів. Тільки текст, без заголовків. Кожен текст має бути унікальним, не повторювати структуру інших.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены аккумулятора. Упомяни конкретную модель телефона, бренд. Напиши про признаки износа батареи, важность качественной замены, гарантию. 40-70 слов. Только текст, без заголовков. Каждый текст должен быть уникальным.',
  },
  'charging-flex': {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни шлейфу зарядки (USB-роз\'єму). Згадай конкретну модель, бренд. Поясни важливість якісного шлейфу для стабільної зарядки. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены шлейфа зарядки (USB-разъема). Упомяни конкретную модель, бренд. Объясни важность качественного шлейфа для стабильной зарядки. 40-70 слов.',
  },
  'back-cover': {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни задньої кришки. Згадай модель, бренд. Розкажи про матеріали (скло/пластик), кольори, важливість герметизації. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены задней крышки. Упомяни модель, бренд. Расскажи про материалы (стекло/пластик), цвета, важность герметизации. 40-70 слов.',
  },
  glass: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни скла екрану. Згадай модель, бренд. Поясни різницю між заміною скла та всього дисплейного модуля. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены стекла экрана. Упомяни модель, бренд. Объясни разницу между заменой стекла и всего дисплейного модуля. 40-70 слов.',
  },
  speaker: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни динаміка (спікера). Згадай модель, бренд. Розкажи про симптоми несправності динаміка. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены динамика (спикера). Упомяни модель, бренд. Расскажи про симптомы неисправности динамика. 40-70 слов.',
  },
  camera: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни камери (фотомодуля). Згадай модель, бренд. Опиши ознаки несправності камери. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены камеры (фотомодуля). Упомяни модель, бренд. Опиши признаки неисправности камеры. 40-70 слов.',
  },
  microphone: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни мікрофона. Згадай модель, бренд. Розкажи про проблеми зі звуком під час розмови. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены микрофона. Упомяни модель, бренд. Расскажи про проблемы со звуком во время разговора. 40-70 слов.',
  },
  buttons: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни кнопок (живлення, гучності, дому). Згадай модель, бренд. Розкажи про симптоми зносу кнопок. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены кнопок (питания, громкости, дома). Упомяни модель, бренд. Расскажи про симптомы износа кнопок. 40-70 слов.',
  },
  connector: {
    uk: 'Ти — майстер з ремонту телефонів в місті Вознесенськ. Напиши унікальний SEO-текст для сторінки заміни роз\'єму (конектора, Type-C, USB-гнізда). Згадай модель, бренд. Розкажи про причини поломки роз\'єму. 40-70 слів.',
    ru: 'Ты — мастер по ремонту телефонов в городе Вознесенск. Напиши уникальный SEO-текст для страницы замены разъема (коннектора, Type-C, USB-гнезда). Упомяни модель, бренд. Расскажи про причины поломки разъема. 40-70 слов.',
  },
}

const PART_LABELS = {
  'charging-flex': { uk: 'шлейфу зарядки', ru: 'шлейфа зарядки' },
  'battery': { uk: 'акумулятора', ru: 'аккумулятора' },
  'back-cover': { uk: 'задньої кришки', ru: 'задней крышки' },
  'glass': { uk: 'скла екрану', ru: 'стекла экрана' },
  'speaker': { uk: 'динаміка', ru: 'динамика' },
  'camera': { uk: 'камери', ru: 'камеры' },
  'microphone': { uk: 'мікрофона', ru: 'микрофона' },
  'buttons': { uk: 'кнопок', ru: 'кнопок' },
  'connector': { uk: 'роз\'єму', ru: 'разъема' },
}

const BATCH_SIZE = 15

async function callGemini(prompt) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
  })

  const response = await fetch(API_URL + '?key=' + GEMINI_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('Empty response from Gemini: ' + JSON.stringify(data))
  }

  return data.candidates[0].content.parts[0].text
}

function parseBatchResponse(text, keys) {
  const results = {}
  const lines = text.split('\n').filter(l => l.trim().length > 20)
  
  // Try to match KEY: text format first
  let matched = 0
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped + '[:\\s]+(.+?)(?=(?:' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')|$)', 's')
    const match = text.match(regex)
    if (match && match[1].trim().length > 0) {
      results[key] = match[1].trim()
      matched++
    }
  }

  // Fallback: just map lines to keys in order
  if (matched < keys.length) {
    for (let i = 0; i < keys.length && i < lines.length; i++) {
      if (!results[keys[i]]) {
        results[keys[i]] = lines[i].trim()
      }
    }
  }

  return results
}

async function main() {
  const promptTemplate = CATEGORY_PROMPTS[partType]
  if (!promptTemplate || !promptTemplate[lang]) {
    console.error(`No prompt defined for category: ${partType}, lang: ${lang}`)
    process.exit(1)
  }

  // Read existing SEO file
  let seoData = {}
  try {
    seoData = JSON.parse(fs.readFileSync(PARTS_SEO_FILE, 'utf-8'))
  } catch {
    console.log('File not found, starting fresh')
  }

  const prefix = storagePrefix
  const label = (PART_LABELS[partType] || {})[lang] || partType

  // Filter entries for this category that need regeneration
  const entries = Object.entries(seoData)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, text]) => ({ key, text }))

  console.log(`${lang.toUpperCase()} | ${partType}: ${entries.length} existing texts`)

  // Process in batches
  let processed = 0
  let total = entries.length
  let i = 0

  while (i < total) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    const batchData = batch.map(e => {
      const parts = e.key.split(':')
      const brandName = parts[1] || '?'
      const modelCode = parts.slice(2).join(':') || '?'
      return `${e.key}: ${brandName} ${modelCode} (current text: "${e.text.substring(0, 50)}...")`
    }).join('\n')

    const userPrompt = `${promptTemplate[lang]}\n\nСтвори текст для ${label}. Дані:\n${batchData}\n\nФормат відповіді:\nКЛЮЧ: текст\n(кожен ключ з нового рядка)`

    console.log(`  Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(total/BATCH_SIZE)} (${i+1}-${Math.min(i+BATCH_SIZE, total)}/${total})...`)

    try {
      const response = await callGemini(userPrompt)
      const parsed = parseBatchResponse(response, batch.map(e => e.key))

      let updated = 0
      for (const e of batch) {
        if (parsed[e.key] && parsed[e.key].length > 30) {
          seoData[e.key] = parsed[e.key]
          updated++
        }
      }

      // Save after each batch
      fs.writeFileSync(PARTS_SEO_FILE, JSON.stringify(seoData, null, 2))
      processed += updated
      console.log(`    Generated: ${updated}/${batch.length} new texts`)

      // Rate limit: ~1s between batches
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`    Error on batch ${Math.floor(i/BATCH_SIZE)+1}: ${err.message}`)
      // Don't abort - skip batch and continue
    }

    i += BATCH_SIZE
  }

  console.log(`\n✅ Done. Processed ${processed}/${total} texts for ${partType} (${lang}).`)
  console.log(`File: ${PARTS_SEO_FILE}`)
  console.log(`Total entries in file: ${Object.keys(seoData).length}`)
}

main().catch(console.error)
