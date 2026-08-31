// Generate UNIQUE SEO texts for parts pages using DeepSeek API
// Multi-line parser for models spread across multiple lines
// node scripts/generate-parts-seo-deepseek.cjs [uk|ru]

const fs = require('fs')
const path = require('path')

const API_KEY = 'sk-abc8f499871946cb81c6e184316fa458'
const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const BATCH_SIZE = 25

const OUTPUT_UK = 'src/app/parts-seo.json'
const OUTPUT_RU = 'src/app/parts-seo-ru.json'

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

console.time('parse')
const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const text = fs.readFileSync(dataPath, 'utf-8')

// Strategy: find all model blocks by looking for modelCode: and then collecting until }, at end of line
const allItems = []
let currentBrand = null

// Split into lines, track brand and model blocks
const lines = text.split('\n')
let i = 0

while (i < lines.length) {
  const line = lines[i]
  
  // Brand detection
  const bm = line.match(/id:\s*['"]([a-z_]+)['"]/)
  if (bm) {
    currentBrand = bm[1]
    // Handle Apple-style one-line model
    const am = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
    if (am && currentBrand) {
      parseOneLineModel(line, currentBrand)
    }
    i++
    continue
  }
  
  // Check if this line starts a model block (multiline format)
  if (line.includes('modelCode:') && !line.includes('modelName:') && !line.includes('parts:')) {
    // Multiline model - collect lines until we find }, that ends the model
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
        
        // Check for end of model: }, at end of line (after trimming)
        // Must be exactly }, with possible trailing space
        if (lines[j].trim() === '},') {
          foundEnd = true
          break
        }
        // Also check inline: } }, or } },\n
        if (lines[j].match(/\}\s*\},/) || lines[j].match(/\}\s*\}\s*,?\s*$/)) {
          foundEnd = true
          break
        }
        j++
      }
      
      if (foundEnd && modelName) {
        parseModelBlock(block, modelCode, modelName)
        i = j
      }
    }
  }
  
  i++
}

function parseOneLineModel(line, brand) {
  const mm = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
  if (!mm) return
  const modelCode = mm[1]
  const modelName = mm[2]
  
  for (const pt of partTypes) {
    const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
    const m = line.match(re)
    if (!m) continue
    const func = m[1]
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    const copyPrice = args[0]
    const origPrice = func === 'two' ? args[1] : null
    
    allItems.push({
      key: `${pt}:${brand}:${modelCode}`,
      brandName: brandNames[brand] || brand,
      modelName,
      partType: pt,
      labelUk: PART_LABELS[pt].uk,
      labelRu: PART_LABELS[pt].ru,
      copyPrice,
      origPrice,
    })
  }
}

function parseModelBlock(block, modelCode, modelName) {
  if (!currentBrand) return
  const brand = currentBrand
  
  for (const pt of partTypes) {
    const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
    const m = block.match(re)
    if (!m) continue
    const func = m[1]
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    const copyPrice = args[0]
    const origPrice = func === 'two' ? args[1] : null
    
    allItems.push({
      key: `${pt}:${brand}:${modelCode}`,
      brandName: brandNames[brand] || brand,
      modelName,
      partType: pt,
      labelUk: PART_LABELS[pt].uk,
      labelRu: PART_LABELS[pt].ru,
      copyPrice,
      origPrice,
    })
  }
}

console.timeEnd('parse')
console.log(`Total items: ${allItems.length}`)

// Count by type
const byType = {}
for (const item of allItems) byType[item.partType] = (byType[item.partType] || 0) + 1
console.log('By type:', JSON.stringify(byType))

// ── Prompts ──
const SYSTEM_PROMPTS = {
  uk: `Ти — SEO-копірайтер для сайту майстра з ремонту телефонів. Твоє завдання — написати короткий унікальний SEO-текст для кожної сторінки.

Для кожної моделі та послуги напиши 1 абзац (60-100 слів, українською) з такою структурою:
1. Запитання/проблема, специфічна для цієї моделі та типу запчастини
2. Пропозиція заміни (назва моделі + тип запчастини)
3. Ціна (вказана в завданні)
4. Запрошення в майстерню: м. Вознесенськ, Центральний ринок, сектор Б, к. 96
5. Переваги: безкоштовна діагностика, гарантія, швидко

ВАЖЛИВО:
- КОЖЕН текст має бути унікальним, не повторювати інші
- Згадуй конкретні особливості саме цієї моделі телефону
- Не використовуй однакові вступи для різних моделей
- Пиши ТІЛЬКИ текст, без лапок, без нумерації
- Кожен текст на окремому рядку
- Мова — українська`,
  
  ru: `Ты — SEO-копирайтер для сайта мастера по ремонту телефонов. Твоя задача — написать короткий уникальный SEO-текст для каждой страницы.

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
- Пиши ТОЛЬКО текст, без кавычек, без нумерации
- Каждый текст на отдельной строке
- Язык — русский`
}

async function generateBatch(items, lang) {
  const labelKey = lang === 'uk' ? 'labelUk' : 'labelRu'
  
  const modelList = items.map((item, i) => {
    const price = item.origPrice 
      ? `копія ${item.copyPrice}грн, оригінал ${item.origPrice}грн`
      : `${item.copyPrice}грн`
    return `${i + 1}. ${item.brandName} ${item.modelName} — ${item[labelKey]} (${price})`
  }).join('\n')

  const userPrompt = `Напиши унікальні SEO-тексти для цих моделей. КОЖЕН ТЕКСТ має бути унікальним. Кожен текст на окремому рядку, без нумерації, без лапок:\n\n${modelList}`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[lang] },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 5000,
    }),
  })

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const lines = text.split('\n').filter(l => l.trim().length > 20)

  if (lines.length !== items.length) {
    console.warn(`  ⚠ Expected ${items.length}, got ${lines.length}`)
  }

  const results = {}
  for (let i = 0; i < items.length && i < lines.length; i++) {
    results[items[i].key] = lines[i].trim()
  }
  return results
}

async function generateLang(lang) {
  const outputPath = path.join(__dirname, '..', lang === 'uk' ? OUTPUT_UK : OUTPUT_RU)
  
  let results = {}
  if (fs.existsSync(outputPath)) {
    try {
      results = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
      console.log(`[${lang}] Already done: ${Object.keys(results).length}`)
    } catch {}
  }

  const toProcess = allItems.filter(item => !results[item.key])
  console.log(`[${lang}] Remaining: ${toProcess.length}`)

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)
    const end = Math.min(i + BATCH_SIZE, toProcess.length)
    console.log(`[${lang}] [${i + 1}-${end}/${toProcess.length}] Generating...`)

    try {
      const br = await generateBatch(batch, lang)
      Object.assign(results, br)
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
      console.log(`  ✅ ${Object.keys(results).length} total`)
    } catch (err) {
      console.error(`  ❌ ${err.message}`)
      await new Promise(r => setTimeout(r, 5000))
      try {
        const br = await generateBatch(batch, lang)
        Object.assign(results, br)
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
        console.log(`  ✅ retry: ${Object.keys(results).length} total`)
      } catch (err2) {
        console.error(`  ❌ retry failed: ${err2.message}`)
      }
    }
    if (i + BATCH_SIZE < toProcess.length) await new Promise(r => setTimeout(r, 300))
  }
  console.log(`[${lang}] ✅ Done! ${Object.keys(results).length}`)
}

const lang = process.argv[2] || 'uk'
generateLang(lang).catch(console.error)
