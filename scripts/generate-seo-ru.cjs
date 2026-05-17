// Generate Russian SEO texts for all display models
// node scripts/generate-seo-ru.cjs

const fs = require('fs')

const API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const BATCH_SIZE = 30

const allBrands = JSON.parse(fs.readFileSync('scripts/seo-models.json', 'utf-8'))

const allItems = []
for (const brand of allBrands) {
  for (const model of brand.models) {
    allItems.push({
      key: `${brand.id}:${model.code}`,
      brandName: brand.name,
      modelName: model.name,
      copyPrice: model.copyPrice,
      origPrice: model.origPrice,
    })
  }
}

const total = allItems.length
console.log(`Total models: ${total}`)

const outputPath = 'src/app/display-seo-ru.json'
let results = {}
if (fs.existsSync(outputPath)) {
  try {
    results = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
    console.log(`Loaded ${Object.keys(results).length} existing results`)
  } catch {}
}

const systemPrompt = `Ты — SEO-копирайтер для сайта по ремонту телефонов. Твоя задача — написать короткий уникальный SEO-текст на РУССКОМ ЯЗЫКЕ для страницы дисплея конкретной модели телефона.

Для каждой модели напиши 1 абзац (50-80 слов, на русском) со структурой:
1. Упомяни модель телефона и что предлагается (дисплей/экран)
2. Добавь 1 особенность этой модели
3. Упомяни цену (копия от X грн, оригинал от Y грн)
4. Пригласи в мастерскую (г. Вознесенск, Центральный рынок, сектор Б, к. 96)
5. Упомяни: бесплатная диагностика, гарантия, быстро

Важно: пиши ТОЛЬКО текст, без кавычек. Каждый текст на отдельной строке. Язык — РУССКИЙ.

Пример:
Нужна замена экрана на Samsung Galaxy A525? Предлагаем качественные дисплеи — как оригиналы, так и бюджетные копии. Цена: копия от 350 грн, оригинал от 600 грн. Приходите в мастерскую в г. Вознесенск, Центральный рынок, сектор Б, к. 96. Бесплатная диагностика, гарантия на все работы, замена за 30-60 минут.`

async function generateBatch(items) {
  const modelList = items.map((item, i) => 
    `${i + 1}. ${item.brandName} ${item.modelName} — копия ${item.copyPrice}грн, ориг ${item.origPrice}грн`
  ).join('\n')

  const userPrompt = `Напиши уникальные SEO-тексты на РУССКОМ языке для этих моделей. Каждый текст на отдельной строке, без нумерации, без кавычек:\n\n${modelList}`

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
  const lines = text.split('\n').filter(l => l.trim().length > 20)

  for (let i = 0; i < items.length && i < lines.length; i++) {
    results[items[i].key] = lines[i].trim()
  }
}

async function main() {
  const toProcess = allItems.filter(item => !results[item.key])
  console.log(`Already done: ${Object.keys(results).length}, Remaining: ${toProcess.length}`)

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const start = i + 1
    const end = Math.min(i + BATCH_SIZE, toProcess.length)
    console.log(`[${start}-${end}/${toProcess.length}] Generating RU...`)

    try {
      await generateBatch(batch)
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
      console.log(`  ✅ Saved (${Object.keys(results).length} total)`)
    } catch (err) {
      console.error(`  ❌ Error:`, err.message)
      await new Promise(r => setTimeout(r, 3000))
      try {
        await generateBatch(batch)
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
        console.log(`  ✅ Saved after retry`)
      } catch (err2) {
        console.error(`  ❌ Retry failed:`, err2.message)
      }
    }

    if (i + BATCH_SIZE < toProcess.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  console.log(`\n✅ Done! Generated ${Object.keys(results).length} / ${total} Russian texts`)
}

main().catch(console.error)
