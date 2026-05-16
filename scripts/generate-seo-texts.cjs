// Generate unique SEO texts for all display models using DeepSeek API
// node scripts/generate-seo-texts.cjs

const fs = require('fs')

const API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const BATCH_SIZE = 30 // models per API call

const allBrands = JSON.parse(fs.readFileSync('scripts/seo-models.json', 'utf-8'))
const totalModels = allBrands.reduce((s, b) => s + b.models.length, 0)

// Build flat list with brand info
const allItems = []
for (const brand of allBrands) {
  for (const model of brand.models) {
    allItems.push({
      key: `${brand.id}:${model.code}`,
      brandId: brand.id,
      brandName: brand.name,
      modelCode: model.code,
      modelName: model.name,
      copyPrice: model.copyPrice,
      origPrice: model.origPrice,
      labor: model.labor,
    })
  }
}

console.log(`Total models to process: ${totalModels}`)

// Load existing results to support resuming
const outputPath = 'src/app/display-seo.json'
let results = {}
if (fs.existsSync(outputPath)) {
  try {
    results = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
    console.log(`Loaded ${Object.keys(results).length} existing results`)
  } catch {}
}

const systemPrompt = `Ти — SEO-копірайтер для сайту з ремонту телефонів. Твоє завдання — написати короткий унікальний SEO-текст для сторінки дисплею конкретної моделі телефону.

Для кожної моделі напиши 1 абзац (60-100 слів, українською) з такою структурою:
1. Згадай модель телефону та що пропонується (дисплей/екран)
2. Додай 1-2 конкретні особливості цієї моделі (часті проблеми з екраном, що варто знати)
3. Згадай ціну (копія від X грн, оригінал від Y грн)
4. Запроси в майстерню (м. Вознесенськ, Центральний ринок, сектор Б, к. 96)
5. Згадай переваги: безкоштовна діагностика, гарантія, швидко

Важливо: пиши ТІЛЬКИ текст, без лапок навколо. Кожен текст на окремому рядку. Мова — українська.

Приклад:
Потрібна заміна екрану на Samsung Galaxy A525? Пропонуємо якісні дисплеї — як оригінали з чудовою кольоропередачею, так і бюджетні копії. Galaxy A525 має 6.5-дюймовий Super AMOLED екран, тому рекомендуємо обирати оригінал для найкращої якості зображення. Ціна: копія від 350 грн, оригінал від 600 грн. Запрошуємо в майстерню в м. Вознесенськ, Центральний ринок, сектор Б, к. 96. Безкоштовна діагностика, гарантія на всі роботи, заміна за 30-60 хвилин.`

async function generateBatch(items) {
  const modelList = items.map((item, i) => 
    `${i + 1}. ${item.brandName} ${item.modelName} (код: ${item.modelCode}) — копія ${item.copyPrice}грн, ориг ${item.origPrice}грн`
  ).join('\n')

  const userPrompt = `Напиши унікальні SEO-тексти для цих моделей телефонів. Кожен текст на окремому рядку, без нумерації, без лапок:\n\n${modelList}`

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
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  
  // Parse: split by newlines, filter empty
  const lines = text.split('\n').filter(l => l.trim().length > 20)
  
  if (lines.length !== items.length) {
    console.warn(`  ⚠ Expected ${items.length} texts, got ${lines.length}. Using what we have.`)
  }

  for (let i = 0; i < items.length && i < lines.length; i++) {
    results[items[i].key] = lines[i].trim()
  }
}

// Process in batches
async function main() {
  const toProcess = allItems.filter(item => !results[item.key])
  console.log(`Already done: ${Object.keys(results).length}, Remaining: ${toProcess.length}`)

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const start = i + 1
    const end = Math.min(i + BATCH_SIZE, toProcess.length)
    console.log(`[${start}-${end}/${toProcess.length}] Generating...`)

    try {
      await generateBatch(batch)
      // Save after each batch
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
      console.log(`  ✅ Saved (${Object.keys(results).length} total)`)
    } catch (err) {
      console.error(`  ❌ Batch failed:`, err.message)
      // Wait and retry once
      await new Promise(r => setTimeout(r, 5000))
      try {
        await generateBatch(batch)
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
        console.log(`  ✅ Saved after retry (${Object.keys(results).length} total)`)
      } catch (err2) {
        console.error(`  ❌ Retry also failed:`, err2.message)
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log(`\n✅ Done! Generated ${Object.keys(results).length} / ${totalModels} texts`)
}

main().catch(console.error)
