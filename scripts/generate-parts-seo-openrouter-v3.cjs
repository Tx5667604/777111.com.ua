// Generate UK SEO texts via OpenRouter (new key, free models)
// node scripts/generate-parts-seo-openrouter-v3.cjs

const fs = require('fs')
const path = require('path')

const API_KEY = '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'
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'
const BATCH_SIZE = 20
const OUTPUT = 'src/app/parts-seo.json'
const LANG = 'uk'

// ── Parse phone-parts-data.ts ──────────────────────────────────
const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const lines = fs.readFileSync(dataPath, 'utf-8').split('\n')

const brandNames = {
  apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', huawei: 'Huawei',
  nokia: 'Nokia', motorola: 'Motorola', lenovo: 'Lenovo', oppo: 'Oppo',
  vivo: 'Vivo', realme: 'Realme', oneplus: 'OnePlus', meizu: 'Meizu',
  sony: 'Sony', google_pixel: 'Google Pixel', zte: 'ZTE',
  infinix: 'Infinix', tecno: 'Tecno', blackview: 'Blackview',
  doogee: 'Doogee', oukitel: 'Oukitel', cubot: 'Cubot', umidigi: 'Umidigi',
  honor: 'Honor', asus: 'Asus', lg: 'LG', alcatel: 'Alcatel',
}

const partTypes = ['battery', 'back_cover', 'speaker', 'charging_flex', 'camera', 'microphone', 'buttons', 'connector', 'glass']
const PART_LABELS_UK = {
  battery: 'акумулятор', back_cover: 'задня кришка', speaker: 'динамік',
  charging_flex: 'шлейф зарядки', camera: 'камера', microphone: 'мікрофон',
  buttons: 'кнопки', connector: 'роз\'єм', glass: 'скло екрану',
}

const allItems = []
let currentBrand = null

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const bm = line.match(/id:\s*['"]([a-z_]+)['"]/)
  if (bm) { currentBrand = bm[1]; continue }
  
  const am = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
  if (am && currentBrand) {
    const modelCode = am[1], modelName = am[2]
    for (const pt of partTypes) {
      const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
      const m = line.match(re)
      if (!m) continue
      const func = m[1], args = m[2].split(',').map(s => parseInt(s.trim()))
      allItems.push({ key: `${pt}:${currentBrand}:${modelCode}`, brandName: brandNames[currentBrand] || currentBrand, modelName, label: PART_LABELS_UK[pt], copyPrice: args[0], origPrice: func === 'two' ? args[1] : null })
    }
    continue
  }
  
  if (line.includes('modelCode:') && !line.includes('modelName:') && currentBrand) {
    const mc = line.match(/modelCode:\s*['"]([^'"]+)['"]/)
    if (!mc) continue
    let block = line, j = i + 1, modelName = null
    while (j < lines.length) {
      block += lines[j]
      const nm = lines[j].match(/modelName:\s*['"]([^'"]+)['"]/)
      if (nm) modelName = nm[1]
      if (lines[j].trim() === '},' || lines[j].match(/\}\s*\},/) || lines[j].match(/\}\s*\}\s*,?\s*$/)) {
        if (modelName) {
          for (const pt of partTypes) {
            const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
            const m = block.match(re)
            if (!m) continue
            const func = m[1], args = m[2].split(',').map(s => parseInt(s.trim()))
            allItems.push({ key: `${pt}:${currentBrand}:${mc[1]}`, brandName: brandNames[currentBrand] || currentBrand, modelName, label: PART_LABELS_UK[pt], copyPrice: args[0], origPrice: func === 'two' ? args[1] : null })
          }
        }
        break
      }
      j++
    }
  }
}

console.log(`Total items: ${allItems.length}`)

const SYSTEM = `Ти — SEO-копірайтер для сайту майстра з ремонту телефонів. Напиши короткий унікальний SEO-текст для кожної сторінки.

Для кожної моделі та послуги напиши 1 абзац (60-100 слів, українською):
1. Запитання/проблема, специфічна для цієї моделі + запчастини
2. Пропозиція заміни (модель + тип запчастини)
3. Ціна (вказана в завданні)
4. Запрошення: м. Вознесенськ, Центральний ринок, сектор Б, к. 96
5. Переваги: безкоштовна діагностика, гарантія, швидко

ВАЖЛИВО: КОЖЕН текст унікальний. Пиши ТІЛЬКИ текст, без лапок, без нумерації. Кожен текст на окремому рядку. Мова — українська.`

async function generateBatch(items) {
  const list = items.map((item, i) => {
    const price = item.origPrice ? `копія ${item.copyPrice}грн, оригінал ${item.origPrice}грн` : `${item.copyPrice}грн`
    return `${i + 1}. ${item.brandName} ${item.modelName} — ${item.label} (${price})`
  }).join('\n')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Напиши унікальні SEO-тексти для цих моделей. Кожен текст на окремому рядку, без нумерації, без лапок:\n\n${list}` },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    }),
  })

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const lines = text.split('\n').filter(l => l.trim().length > 20)
  if (lines.length !== items.length) console.warn(`  ⚠ Expected ${items.length}, got ${lines.length}`)
  
  const results = {}
  for (let i = 0; i < items.length && i < lines.length; i++) results[items[i].key] = lines[i].trim()
  return results
}

async function main() {
  const outputPath = path.join(__dirname, '..', OUTPUT)
  let results = {}
  if (fs.existsSync(outputPath)) {
    try { results = JSON.parse(fs.readFileSync(outputPath, 'utf-8')); console.log(`Loaded ${Object.keys(results).length} existing`) } catch {}
  }

  const toProcess = allItems.filter(item => !results[item.key])
  console.log(`Remaining: ${toProcess.length}`)

  const startTime = Date.now()
  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const end = Math.min(i + BATCH_SIZE, toProcess.length)
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`[${i+1}-${end}/${toProcess.length}] ${elapsed}s elapsed...`)

    try {
      const br = await generateBatch(batch)
      Object.assign(results, br)
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
      console.log(`  ✅ ${Object.keys(results).length} total`)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      // If 429, wait and retry with different model
      if (err.message.includes('429')) {
        console.log('  429 — waiting 30s...')
        await new Promise(r => setTimeout(r, 30000))
        try {
          const br = await generateBatch(batch)
          Object.assign(results, br)
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
          console.log(`  ✅ retry: ${Object.keys(results).length} total`)
        } catch (err2) { console.error(`  ❌ retry failed: ${err2.message}`) }
      } else {
        await new Promise(r => setTimeout(r, 5000))
        try {
          const br = await generateBatch(batch)
          Object.assign(results, br)
          fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
          console.log(`  ✅ retry: ${Object.keys(results).length} total`)
        } catch (err2) { console.error(`  ❌ retry failed: ${err2.message}`) }
      }
    }
    if (i + BATCH_SIZE < toProcess.length) await new Promise(r => setTimeout(r, 500))
  }
  const totalTime = Math.round((Date.now() - startTime) / 1000 / 60)
  console.log(`✅ Done! ${Object.keys(results).length} items in ${totalTime}min`)
}

main().catch(console.error)
