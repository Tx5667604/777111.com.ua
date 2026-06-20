#!/usr/bin/env node
// scripts/regenerate-not-indexed.cjs
// Regenerate SEO texts only for 405 not-indexed display pages
// node scripts/regenerate-not-indexed.cjs

const fs = require('fs')
const path = require('path')

const API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const BATCH_SIZE = 25

// Load existing texts
const ukPath = 'src/app/display-seo.json'
const ruPath = 'src/app/display-seo-ru.json'
let ukResults = JSON.parse(fs.readFileSync(ukPath, 'utf-8'))
let ruResults = JSON.parse(fs.readFileSync(ruPath, 'utf-8'))
console.log(`Loaded ${Object.keys(ukResults).length} UK texts, ${Object.keys(ruResults).length} RU texts`)

// Load all brand models
const allBrands = JSON.parse(fs.readFileSync('scripts/seo-models.json', 'utf-8'))

// Build lookup: slug(brand + modelCode) -> { brand, brandName, modelName, code, copyPrice, origPrice }
function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const lookup = {}
for (const brand of allBrands) {
  for (const model of brand.models) {
    const key = slug(`${brand.id}/${model.code}`)
    lookup[key] = {
      brandId: brand.id,
      brandName: brand.name,
      modelCode: model.code,
      modelName: model.name || model.code,
      copyPrice: model.copyPrice,
      origPrice: model.origPrice,
    }
  }
}

// Read URL list
const urls = fs.readFileSync('/tmp/clean_urls.txt', 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && l.includes('777111.com.ua/'))

console.log(`Processing ${urls.length} URLs`)

// Extract brand/model from URL and find in lookup
const items = []
for (const url of urls) {
  // https://777111.com.ua/apple/display/iphone-11-pro
  const match = url.match(/777111\.com\.ua\/([^/]+)\/display\/(.+)/)
  if (!match) continue
  const brandSlug = match[1]
  const modelSlug = match[2]
  const lookupKey = slug(`${brandSlug}/${modelSlug}`)
  const found = lookup[lookupKey]
  if (found) {
    items.push({
      key: `${found.brandId}:${found.modelCode}`,
      brandName: found.brandName,
      modelName: found.modelName,
      copyPrice: found.copyPrice,
      origPrice: found.origPrice,
      brandSlug,
      modelSlug,
    })
  } else {
    console.log(`  Not found in lookup: ${url}`)
  }
}

console.log(`Matched ${items.length} models for regeneration`)

if (items.length === 0) {
  console.log('No models to regenerate')
  process.exit(0)
}

// Updated system prompts for more natural, varied content
const ukSystemPrompt = `Ти — SEO-копірайтер для сайту майстра з ремонту телефонів. Напиши унікальний природний SEO-текст УКРАЇНСЬКОЮ для сторінки дисплея кожної моделі.

Для кожної моделі напиши 1 абзац (40-70 слів, українською) зі структурою:
1. Згадай модель телефону і шо пропонується (дисплей/екран)
2. Додай 1 унікальну особливість цієї моделі (як ламається, що часто виходить з ладу)
3. Згадай ціну (копія від X грн, оригінал від Y грн)
4. Запроси в майстерню (м. Вознесенськ, Центральний ринок, сектор Б, к. 96)
5. Згадай: безкоштовна діагностика, гарантія, швидко

ВАЖЛИВО: КОЖЕН текст має бути УНІКАЛЬНИМ за структурою! Не використовуй однакові фрази. Змінюй початок речень, структуру, формулювання. Уникай шаблонів! Пиши природно, як жива людина.`

const ruSystemPrompt = `Ты — SEO-копирайтер для сайта мастера по ремонту телефонов. Напиши уникальный естественный SEO-текст на РУССКОМ ЯЗЫКЕ для страницы дисплея каждой модели.

Для каждой модели напиши 1 абзац (40-70 слов, на русском):
1. Упомяни модель телефона и что предлагается (дисплей/экран)
2. Добавь 1 уникальную особенность этой модели (как ломается, что часто выходит из строя)
3. Упомяни цену (копия от X грн, оригинал от Y грн)
4. Пригласи в мастерскую (г. Вознесенск, Центральный рынок, сектор Б, к. 96)
5. Упомяни: бесплатная диагностика, гарантия, быстро

ВАЖНО: Каждый текст должен быть УНИКАЛЬНЫМ по структуре! Меняй начало предложений, порядок слов, формулировки. Избегай шаблонов — пиши естественно, как живой человек. Разные модели должны звучать по-разному.`

async function generateBatch(batch, lang) {
  const systemPrompt = lang === 'uk' ? ukSystemPrompt : ruSystemPrompt
  const langName = lang === 'uk' ? 'УКРАИНСКОМ' : 'РУССКОМ'

  const modelList = batch.map((item, i) =>
    `${i + 1}. ${item.brandName} ${item.modelName} — копия ${item.copyPrice}грн, ориг ${item.origPrice}грн`
  ).join('\n')

  const userPrompt = `Напиши уникальные SEO-тексты на ${langName} языке для этих моделей. КАЖДЫЙ текст ДОЛЖЕН быть уникальным по структуре! Не копируй шаблоны! Каждый текст на отдельной строке, без нумерации, без кавычек:\n\n${modelList}`

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.choices[0].message.content.trim()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  if (lines.length !== batch.length) {
    console.warn(`  Warning: expected ${batch.length} lines, got ${lines.length}`)
  }

  for (let i = 0; i < Math.min(lines.length, batch.length); i++) {
    batch[i].generatedText = lines[i]
  }
}

async function regenerateLang(lang) {
  const target = lang === 'uk' ? ukResults : ruResults
  const totalBatches = Math.ceil(items.length / BATCH_SIZE)
  let updated = 0

  for (let b = 0; b < totalBatches; b++) {
    const start = b * BATCH_SIZE
    const batch = items.slice(start, start + BATCH_SIZE)
    
    console.log(`\n[${lang}] Batch ${b + 1}/${totalBatches} (${batch.length} models)`)
    
    try {
      await generateBatch(batch, lang)
      
      for (const item of batch) {
        if (item.generatedText) {
          target[item.key] = item.generatedText
          updated++
        }
      }
      
      // Save after each batch (resume-safe)
      if (lang === 'uk') {
        fs.writeFileSync(ukPath, JSON.stringify(target, null, 2) + '\n', 'utf-8')
      } else {
        fs.writeFileSync(ruPath, JSON.stringify(target, null, 2) + '\n', 'utf-8')
      }
      console.log(`  Saved (${updated}/${items.length} updated)`)
      
      // Small delay between batches
      if (b < totalBatches - 1) {
        await new Promise(r => setTimeout(r, 1000))
      }
    } catch (err) {
      console.error(`  Batch failed: ${err.message}`)
      console.log('  Will retry on next run (resume-safe)')
    }
  }
  
  return updated
}

;(async () => {
  console.log('\n=== Regenerating UK texts ===')
  const ukUpdated = await regenerateLang('uk')
  
  console.log(`\n=== Regenerating RU texts ===`)
  const ruUpdated = await regenerateLang('ru')
  
  console.log(`\n=== Done! ===`)
  console.log(`UK: ${ukUpdated}/${items.length} updated`)
  console.log(`RU: ${ruUpdated}/${items.length} updated`)
  console.log(`Total UK texts: ${Object.keys(ukResults).length}`)
  console.log(`Total RU texts: ${Object.keys(ruResults).length}`)
  
  // Verify not-indexed models
  const stillMissing = items.filter(item => !ukResults[item.key]).length
  console.log(`Still missing UK texts for not-indexed models: ${stillMissing}`)
})()
