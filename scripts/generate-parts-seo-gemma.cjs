// Generate RU SEO texts using Gemma 4 via Gemini API
// node scripts/generate-parts-seo-gemma.cjs

const fs = require('fs')
const path = require('path')

const API_KEY = 'AIzaSyBVpTcGh_413iCcdM_qoPVfg8nYs2236TA'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'
const BATCH_SIZE = 20
const OUTPUT_FILE = 'src/app/parts-seo-ru.json'

const brandNames = {
  apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', huawei: 'Huawei',
  nokia: 'Nokia', motorola: 'Motorola', lenovo: 'Lenovo', oppo: 'Oppo',
  vivo: 'Vivo', realme: 'Realme', oneplus: 'OnePlus', meizu: 'Meizu',
  sony: 'Sony', google_pixel: 'Google Pixel', zte: 'ZTE',
  infinix: 'Infinix', tecno: 'Tecno', blackview: 'Blackview',
  doogee: 'Doogee', oukitel: 'Oukitel', cubot: 'Cubot', umidigi: 'Umidigi',
  honor: 'Honor', asus: 'Asus', lg: 'LG', alcatel: 'Alcatel',
  sigma: 'Sigma', 
}

const partTypes = ['battery', 'back_cover', 'speaker', 'charging_flex', 'camera', 'microphone', 'buttons', 'connector', 'glass']
const PART_LABELS = {
  battery: { uk: 'акумулятор', ru: 'аккумулятор' },
  back_cover: { uk: 'задня кришка', ru: 'задняя крышка' },
  speaker: { uk: 'динамік', ru: 'динамик' },
  charging_flex: { uk: 'шлейф зарядки', ru: 'шлейф зарядки' },
  camera: { uk: 'камера', ru: 'камера' },
  microphone: { uk: 'мікрофон', ru: 'микрофон' },
  buttons: { uk: 'кнопки', ru: 'кнопки' },
  connector: { uk: "роз'єм", ru: 'разъем' },
  glass: { uk: 'скло екрану', ru: 'стекло экрана' },
}

// ── Parse data ──
console.time('parse')
const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const text = fs.readFileSync(dataPath, 'utf-8')
const allItems = []
let currentBrand = null
const lines = text.split('\n')

function parseOneLineModel(line, brand) {
  const mm = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
  if (!mm) return
  const modelCode = mm[1]
  const modelName = mm[2]
  for (const pt of partTypes) {
    const re = new RegExp(pt + ':\\s*(\\w+)\\(([^)]+)\\)')
    const m = line.match(re)
    if (!m) continue
    const func = m[1]
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    const copyPrice = args[0]
    const origPrice = func === 'two' ? args[1] : null
    allItems.push({
      key: pt + ':' + brand + ':' + modelCode,
      brandName: brandNames[brand] || brand,
      modelName, partType: pt,
      labelRu: PART_LABELS[pt].ru,
      labelUk: PART_LABELS[pt].uk,
      copyPrice, origPrice,
    })
  }
}

function parseModelBlock(block, modelCode, modelName) {
  if (!currentBrand) return
  const brand = currentBrand
  for (const pt of partTypes) {
    const re = new RegExp(pt + ':\\s*(\\w+)\\(([^)]+)\\)')
    const m = block.match(re)
    if (!m) continue
    const func = m[1]
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    const copyPrice = args[0]
    const origPrice = func === 'two' ? args[1] : null
    allItems.push({
      key: pt + ':' + brand + ':' + modelCode,
      brandName: brandNames[brand] || brand,
      modelName, partType: pt,
      labelRu: PART_LABELS[pt].ru,
      labelUk: PART_LABELS[pt].uk,
      copyPrice, origPrice,
    })
  }
}

let i = 0
while (i < lines.length) {
  const line = lines[i]
  const bm = line.match(/id:\s*['"]([a-z_]+)['"]/)
  if (bm) {
    currentBrand = bm[1]
    const am = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
    if (am && currentBrand) { parseOneLineModel(line, currentBrand); i++; continue }
  }
  if (line.includes('modelCode:') && !line.includes('modelName:') && !line.includes('parts:')) {
    const mc = line.match(/modelCode:\s*['"]([^'"]+)['"]/)
    if (mc && currentBrand) {
      const modelCode = mc[1]
      let block = line + '\n'
      let j = i + 1
      let modelName = null
      let foundEnd = false
      while (j < lines.length) {
        block += lines[j] + '\n'
        const nm = lines[j].match(/modelName:\s*['"]([^'"]+)['"]/)
        if (nm) modelName = nm[1]
        if (lines[j].trim() === '},' || lines[j].match(/}\s*},/) || lines[j].match(/}\s*}\s*,?\s*$/)) { foundEnd = true; break }
        j++
      }
      if (foundEnd && modelName) { parseModelBlock(block, modelCode, modelName); i = j }
    }
  }
  i++
}

console.timeEnd('parse')
console.log(`Total items: ${allItems.length}`)

// ── Load existing ──
let existing = {}
if (fs.existsSync(OUTPUT_FILE)) {
  existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'))
}
console.log(`Existing: ${Object.keys(existing).length}`)

const existingKeys = new Set(Object.keys(existing))
const missing = allItems.filter(item => !existingKeys.has(item.key))
console.log(`Missing: ${missing.length}`)

if (missing.length === 0) {
  console.log('All done!')
  process.exit(0)
}

// ── Prompt ──
const SYSTEM_PROMPT = `Ты — SEO-копирайтер для сайта мастера по ремонту телефонов. Твоя задача — написать короткий уникальный SEO-текст для каждой страницы.

Для каждой модели и услуги напиши 1 абзац (60-100 слов, на русском) со следующей структурой:
1. Вопрос/проблема, специфичная для этой модели и типа запчасти
2. Предложение замены (название модели + тип запчасти)
3. Цена (указана в задании)
4. Приглашение в мастерскую: г. Вознесенск, Центральный рынок, сектор Б, к. 96
5. Преимущества: бесплатная диагностика, гарантия, быстро

ВАЖНО:
- КАЖДЫЙ текст должен быть уникальным, не повторять другие
- Упоминай конкретные особенности именно этой модели телефона
- Не используй одинаковые вступления для разных моделей
- Пиши ТОЛЬКО текст, без кавычек, без нумерации`

// ── API call ──
async function callGemma(batch) {
  const lines = batch.map((item, idx) => {
    const price = item.origPrice ? `${item.copyPrice}-${item.origPrice} грн` : `${item.copyPrice} грн`
    return `[${idx + 1}] Модель: ${item.brandName} ${item.modelName}, Запчасть: ${item.labelRu}, Цена: ${price}`
  })

  const prompt = `Напиши ${batch.length} уникальных SEO-текстов на русском языке для страниц запчастей телефонов.

Данные для генерации (каждая строка — отдельная страница):
${lines.join('\n')}

Напиши ровно ${batch.length} текстов, каждый с новой строки. НЕ нумеруй строки. НЕ добавляй пояснений. Только тексты, каждый на отдельной строке.`

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }]
    }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 8192,
      topP: 0.95,
    }
  })

  let attempts = 0
  while (attempts < 5) {
    try {
      const response = await fetch(API_URL + '?key=' + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      })

      if (response.status === 429) {
        const wait = Math.pow(2, attempts) * 5000
        console.log(`  429, waiting ${wait/1000}s...`)
        await new Promise(r => setTimeout(r, wait))
        attempts++
        continue
      }

      if (!response.ok) {
        const err = await response.text()
        console.log(`  HTTP ${response.status}:`, err.substring(0, 200))
        await new Promise(r => setTimeout(r, 10000))
        attempts++
        continue
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return text

    } catch (e) {
      console.log(`  Error: ${e.message}`)
      await new Promise(r => setTimeout(r, 5000))
      attempts++
    }
  }
  throw new Error(`Failed after 5 attempts`)
}

// ── Process ──
async function main() {
  const total = missing.length
  let processed = 0
  const startTime = Date.now()

  // Process in batches
  for (let batchStart = 0; batchStart < missing.length; batchStart += BATCH_SIZE) {
    const batch = missing.slice(batchStart, batchStart + BATCH_SIZE)
    const startIdx = batchStart + 1
    const endIdx = Math.min(batchStart + BATCH_SIZE, total)

    process.stdout.write(`[${startIdx}-${endIdx}/${total}] Generating... `)

    try {
      const result = await callGemma(batch)
      const lines = result.split('\n').filter(l => l.trim().length > 10)

      // Match lines to items
      for (let k = 0; k < batch.length; k++) {
        const text = lines[k] || lines[lines.length - 1] || ''
        existing[batch[k].key] = text.trim() || `Замена ${batch[k].labelRu} для ${batch[k].brandName} ${batch[k].modelName} — ${batch[k].copyPrice} грн. Обращайтесь в мастерскую по адресу г. Вознесенск, Центральный рынок, сектор Б, к. 96. Бесплатная диагностика, гарантия, быстро.`
      }

      // Save every batch
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2))
      processed += batch.length

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(`✅ ${Object.keys(existing).length} total (${elapsed}s)`)

    } catch (e) {
      console.log(`❌ ${e.message}`)
      // Save what we have
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2))
      console.log('Saved progress. Continuing...')
      // Wait before retry
      await new Promise(r => setTimeout(r, 10000))
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 500))
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000)
  console.log(`\n=== DONE ===`)
  console.log(`Total: ${Object.keys(existing).length} texts`)
  console.log(`Time: ${Math.floor(totalTime / 60)}m ${totalTime % 60}s`)
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
