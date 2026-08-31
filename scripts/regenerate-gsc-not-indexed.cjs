#!/usr/bin/env node
// scripts/regenerate-gsc-not-indexed.cjs
// Regenerate UNIQUE SEO texts only for URLs from GSC not-indexed lists.
// Usage: node scripts/regenerate-gsc-not-indexed.cjs <uk|ru> <urlsFile1.txt> [urlsFile2.txt ...]
// Writes: src/app/parts-seo.json (uk) / parts-seo-ru.json (ru) + display-seo.json / display-seo-ru.json
// Progress: agy-reports/regen-gsc-<lang>.json (resume-safe, overwrites existing keys)

const fs = require('fs')
const path = require('path')

// Gemini 2.5 Flash Lite. Key priority: env GEMINI_KEY > scripts/.gemini-key.local (untracked) > legacy (dead 31.08.2026)
let GEMINI_KEY = process.env.GEMINI_KEY || ''
if (!GEMINI_KEY) {
  try { GEMINI_KEY = fs.readFileSync(path.join(__dirname, '.gemini-key.local'), 'utf-8').trim() } catch (e) {}
}
if (!GEMINI_KEY) { console.error('NO GEMINI KEY: set GEMINI_KEY env or scripts/.gemini-key.local'); process.exit(1) }
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'
const BATCH_SIZE = 20

const lang = process.argv[2] || 'uk'
const urlFiles = process.argv.slice(3)
if (!urlFiles.length) {
  console.error('Usage: node scripts/regenerate-gsc-not-indexed.cjs <uk|ru> <urlsFile...>')
  process.exit(1)
}

const brandNames = {
  apple: 'Apple', samsung: 'Samsung', xiaomi: 'Xiaomi', huawei: 'Huawei',
  nokia: 'Nokia', motorola: 'Motorola', lenovo: 'Lenovo', oppo: 'Oppo',
  vivo: 'Vivo', realme: 'Realme', oneplus: 'OnePlus', meizu: 'Meizu',
  sony: 'Sony', google_pixel: 'Google Pixel', zte: 'ZTE',
  infinix: 'Infinix', tecno: 'Tecno', blackview: 'Blackview',
  doogee: 'Doogee', oukitel: 'Oukitel', cubot: 'Cubot', umidigi: 'Umidigi',
  honor: 'Honor', asus: 'Asus', lg: 'LG', alcatel: 'Alcatel',
}

const partTypes = ['display', 'battery', 'back_cover', 'speaker', 'charging_flex', 'camera', 'microphone', 'buttons', 'connector', 'glass']
const PART_LABELS = {
  display: { uk: 'дисплей (екран)', ru: 'дисплей (экран)' },
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

function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ── Parse phone-parts-data.ts (same strategy as generate-parts-seo-deepseek.cjs) ──
const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const text = fs.readFileSync(dataPath, 'utf-8')
const allItems = []
let currentBrand = null
const lines = text.split('\n')
let i = 0

function pushItem(brand, modelCode, modelName, pt, copyPrice, origPrice) {
  allItems.push({
    key: `${pt}:${brand}:${modelCode}`,
    brandId: brand,
    brandName: brandNames[brand] || brand,
    modelName,
    partType: pt,
    labelUk: PART_LABELS[pt].uk,
    labelRu: PART_LABELS[pt].ru,
    copyPrice,
    origPrice,
    urlKey: `${brand}/${slug(modelCode)}/${pt === 'display' ? 'display' : pt}`,
  })
}

function parseOneLineModel(line, brand) {
  const mm = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
  if (!mm) return
  for (const pt of partTypes) {
    const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
    const m = line.match(re)
    if (!m) continue
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    const orig = (m[1] === 'two' || m[1] === 'display') && args.length >= 2 ? args[1] : null
    pushItem(brand, mm[1], mm[2], pt, args[0], orig)
  }
}

function parseModelBlock(block, modelCode, modelName) {
  if (!currentBrand) return
  for (const pt of partTypes) {
    const re = new RegExp(`${pt}:\\s*(\\w+)\\(([^)]+)\\)`)
    const m = block.match(re)
    if (!m) continue
    const args = m[2].split(',').map(s => parseInt(s.trim()))
    pushItem(currentBrand, modelCode, modelName, pt, args[0], m[1] === 'two' ? args[1] : null)
  }
}

while (i < lines.length) {
  const line = lines[i]
  const bm = line.match(/id:\s*['"]([a-z_]+)['"]/)
  if (bm) {
    currentBrand = bm[1]
    const am = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
    if (am && currentBrand) parseOneLineModel(line, currentBrand)
    i++
    continue
  }
  // One-line model on ANY line (Apple-style): modelCode + modelName together
  if (line.includes('modelCode:') && line.includes('modelName:')) {
    const om = line.match(/modelCode:\s*['"]([^'"]+)['"].*?modelName:\s*['"]([^'"]+)['"]/)
    if (om && currentBrand) parseOneLineModel(line, currentBrand)
    i++
    continue
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
        if (lines[j].trim() === '},') { foundEnd = true; break }
        if (lines[j].match(/\}\s*\},/) || lines[j].match(/\}\s*\}\s*,?\s*$/)) { foundEnd = true; break }
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

// urlKey index (one item per unique urlKey — display and 9 parts have distinct keys)
const urlIndex = {}
for (const item of allItems) urlIndex[item.urlKey] = item
console.log(`Parsed ${allItems.length} items (${Object.keys(urlIndex).length} unique pages)`)

// ── Load URL lists ──
const rejects = []
const items = []
const seenKeys = new Set()
for (const f of urlFiles) {
  const urls = fs.readFileSync(f, 'utf-8').split('\n').map(l => l.trim()).filter(Boolean)
  for (const url of urls) {
    const m = url.match(/^https?:\/\/777111\.com\.ua\/([a-z_]+)\/([a-z-]+)\/([^\/\?]+)/)
    if (!m) { rejects.push(url); continue }
    const [, brandSlug, partSlug, modelSlug] = m
    const pt = partSlug === 'charging-flex' ? 'charging_flex' : partSlug === 'back-cover' ? 'back_cover' : partSlug
    const urlKey = `${brandSlug}/${modelSlug}/${pt}`
    const item = urlIndex[urlKey]
    if (!item) { rejects.push(url); continue }
    if (seenKeys.has(item.key)) continue
    seenKeys.add(item.key)
    items.push(item)
  }
}
console.log(`Matched ${items.length} unique pages for regeneration (${rejects.length} rejects)`)
fs.writeFileSync(path.join(__dirname, '..', 'agy-reports', `regen-rejects-${lang}.txt`), rejects.join('\n'))

const byType = {}
for (const it of items) byType[it.partType] = (byType[it.partType] || 0) + 1
console.log('By part type:', JSON.stringify(byType))

if (process.env.DRY) {
  console.log('DRY RUN — first 5 items:')
  console.log(items.slice(0, 5).map(it => `${it.key} | ${it.urlKey} | ${it.copyPrice}/${it.origPrice}`).join('\n'))
  process.exit(0)
}
if (!items.length) process.exit(0)

// ── Outputs ──
const outputs = {
  uk: { parts: 'src/app/parts-seo.json', display: 'src/app/display-seo.json' },
  ru: { parts: 'src/app/parts-seo-ru.json', display: 'src/app/display-seo-ru.json' },
}
const progressPath = path.join(__dirname, '..', 'agy-reports', `regen-gsc-${lang}.json`)
let done = {}
if (fs.existsSync(progressPath)) {
  try { done = JSON.parse(fs.readFileSync(progressPath, 'utf-8')) } catch {}
}

function loadTarget(item) {
  const p = path.join(__dirname, '..', outputs[lang][item.partType === 'display' ? 'display' : 'parts'])
  return { p, data: JSON.parse(fs.readFileSync(p, 'utf-8')) }
}

// ── Prompts (anti-duplicate emphasis) ──
const SYSTEM_PROMPTS = {
  uk: `Ти — SEO-копірайтер сайту майстра з ремонту телефонів у Вознесенську. Для кожної позиції напиши 1 абзац українською (60-90 слів):
1. Конкретна проблема/симптом саме цієї моделі та цієї запчастини (уяви реальний сценарій поломки)
2. Пропозиція: заміна + ціна з завдання
3. Запрошення: м. Вознесенськ, Центральний ринок, сектор Б, к. 96
4. Безкоштовна діагностика, гарантія, ремонт за 30-60 хвилин

КРИТИЧНО ПРО УНІКАЛЬНІСТЬ: кожен текст має відрізнятися СТРУКТУРОЮ і формулюваннями — різні типи початку (питання / ситуація / порада), різний порядок згадок ціни та адреси, різні синоніми. НЕ повторюй однакові фрази між текстами. Пиши як жива людина, без канцеляриту.
Тільки текст, без лапок і нумерації, кожен текст на окремому рядку.`,
  ru: `Ты — SEO-копирайтер сайта мастера по ремонту телефонов в Вознесенске. Для каждой позиции напиши 1 абзац на русском (60-90 слов):
1. Конкретная проблема/симптом именно этой модели и этой запчасти (представь реальный сценарий поломки)
2. Предложение: замена + цена из задания
3. Приглашение: г. Вознесенск, Центральный рынок, сектор Б, к. 96
4. Бесплатная диагностика, гарантия, ремонт за 30-60 минут

КРИТИЧНО ПРО УНИКАЛЬНОСТЬ: каждый текст должен отличаться СТРУКТУРОЙ и формулировками — разные типы начала (вопрос / ситуация / совет), разный порядок упоминаний цены и адреса, разные синонимы. НЕ повторяй одинаковые фразы между текстами. Пиши как живой человек, без канцелярита.
Только текст, без кавычек и нумерации, каждый текст на отдельной строке.`,
}

async function callGemini(prompt) {
  const response = await fetch(API_URL + '?key=' + GEMINI_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
    }),
  })
  if (!response.ok) throw new Error(`Gemini ${response.status}: ${(await response.text()).slice(0, 200)}`)
  const data = await response.json()
  if (!data.candidates || !data.candidates[0]) throw new Error('Gemini empty: ' + JSON.stringify(data).slice(0, 200))
  return data.candidates[0].content.parts.map(p => p.text || '').join('')
}

async function generateBatch(batch) {
  const labelKey = lang === 'uk' ? 'labelUk' : 'labelRu'
  const modelList = batch.map((item, n) => {
    const price = item.origPrice
      ? (lang === 'uk' ? `копія ${item.copyPrice} грн, оригінал ${item.origPrice} грн` : `копия ${item.copyPrice} грн, оригинал ${item.origPrice} грн`)
      : `${item.copyPrice} грн`
    return `${n + 1}. ${item.brandName} ${item.modelName} — ${item[labelKey]} (${price})`
  }).join('\n')

  const userPrompt = `${SYSTEM_PROMPTS[lang]}\n\nПозиции:\n${modelList}\n\nВивід: для кожної позиції окремий рядок у форматі "N. текст" (N — номер позиції). Нічого іншого.`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const content = await callGemini(userPrompt)
      // parse "N. text" lines
      const out = new Array(batch.length).fill(null)
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
      for (const line of lines) {
        const m = line.match(/^(\d{1,2})[.)]\s*(.+)$/)
        if (m) {
          const idx = parseInt(m[1]) - 1
          if (idx >= 0 && idx < batch.length && m[2].length > 40 && !out[idx]) out[idx] = m[2].trim()
        }
      }
      // fallback: long lines in order
      if (out.some(x => !x)) {
        const long = lines.filter(l => l.length > 60 && !/^\d{1,2}[.)]/.test(l))
        for (let i = 0, j = 0; i < batch.length && j < long.length; i++) {
          if (!out[i]) out[i] = long[j++].replace(/^\d{1,2}[.)]\s*/, '')
        }
      }
      if (out.some(x => !x)) throw new Error(`unfilled slots: ${out.filter(x => !x).length}`)
      return out
    } catch (e) {
      console.error(`  attempt ${attempt} failed: ${e.message}`)
      if (attempt === 3) throw e
      await new Promise(r => setTimeout(r, 3000 * attempt))
    }
  }
}

async function main() {
  const todo = items.filter(it => !done[it.key])
  console.log(`[${lang}] To regenerate: ${todo.length} (done before: ${Object.keys(done).length})`)

  let updated = 0
  for (let b = 0; b < todo.length; b += BATCH_SIZE) {
    const batch = todo.slice(b, b + BATCH_SIZE)
    console.log(`[${lang}] batch ${Math.floor(b / BATCH_SIZE) + 1}/${Math.ceil(todo.length / BATCH_SIZE)} (${batch.length})`)
    try {
      const texts = await generateBatch(batch)
      // group by target file
      const byFile = {}
      batch.forEach((it, idx) => {
        const { p } = loadTarget(it)
        if (!byFile[p]) byFile[p] = {}
        byFile[p][it.key] = texts[idx]
      })
      for (const [p, kv] of Object.entries(byFile)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
        Object.assign(data, kv)
        fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8')
      }
      batch.forEach(it => { done[it.key] = 1 })
      updated += batch.length
      fs.writeFileSync(progressPath, JSON.stringify(done), 'utf-8')
      console.log(`  saved ${updated}/${todo.length}`)
    } catch (e) {
      console.error(`  BATCH FAILED, skipping: ${e.message}`)
    }
    await new Promise(r => setTimeout(r, 400))
  }
  console.log(`[${lang}] DONE. updated=${updated}, total items=${items.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
