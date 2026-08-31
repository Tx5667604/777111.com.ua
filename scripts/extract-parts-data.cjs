// Extract all model × part-type combinations from phone-parts-data.ts
// Outputs a JSON file with all entries for DeepSeek generation

const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const src = fs.readFileSync(dataPath, 'utf-8')

// Parse brand IDs
const brandIds = []
const brandRe = /id:\s*['"]([a-z_]+)['"]/g
let m
while ((m = brandRe.exec(src)) !== null) brandIds.push({ name: m[1], pos: m.index })

// Brand display names
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
  battery: { uk: 'акумулятор', ru: 'аккумулятор', genitiveUk: 'акумулятора', genitiveRu: 'аккумулятора' },
  back_cover: { uk: 'задня кришка', ru: 'задняя крышка', genitiveUk: 'задньої кришки', genitiveRu: 'задней крышки' },
  speaker: { uk: 'динамік', ru: 'динамик', genitiveUk: 'динаміка', genitiveRu: 'динамика' },
  charging_flex: { uk: 'шлейф зарядки', ru: 'шлейф зарядки', genitiveUk: 'шлейфу зарядки', genitiveRu: 'шлейфа зарядки' },
  camera: { uk: 'камера', ru: 'камера', genitiveUk: 'камери', genitiveRu: 'камеры' },
  microphone: { uk: 'мікрофон', ru: 'микрофон', genitiveUk: 'мікрофона', genitiveRu: 'микрофона' },
  buttons: { uk: 'кнопки', ru: 'кнопки', genitiveUk: 'кнопок', genitiveRu: 'кнопок' },
  connector: { uk: 'роз\'єм', ru: 'разъем', genitiveUk: 'роз\'єму', genitiveRu: 'разъема' },
  glass: { uk: 'скло екрану', ru: 'стекло экрана', genitiveUk: 'скла екрану', genitiveRu: 'стекла экрана' },
}

// Extract modelCode and modelName + parts for each brand
const allItems = []

for (let bi = 0; bi < brandIds.length; bi++) {
  const brand = brandIds[bi]
  const start = brand.pos
  const end = bi < brandIds.length - 1 ? brandIds[bi + 1].pos : src.length
  const block = src.slice(start, end)
  
  // Find all model entries in this block
  // Pattern: { modelCode: '...', modelName: '...', parts: { ... } }
  const modelRe = /\{\s*modelCode:\s*['"](.+?)['"][\s\S]*?modelName:\s*['"](.+?)['"][\s\S]*?parts:\s*\{([\s\S]*?)\}\s*\}/g
  let match
  while ((match = modelRe.exec(block)) !== null) {
    const modelCode = match[1]
    const modelName = match[2]
    const partsBlock = match[3]
    
    for (const pt of partTypes) {
      // Extract price for this part type
      // Format: pt: two(copy, orig, labor) or pt: only(copy, labor)
      const ptRe = new RegExp(`${pt}:\\s*(two|only)\\(([^)]+)\\)`)
      const ptMatch = partsBlock.match(ptRe)
      if (!ptMatch) continue
      
      const func = ptMatch[1]
      const args = ptMatch[2].split(',').map(s => parseInt(s.trim()))
      
      let copyPrice, origPrice, labor
      if (func === 'two') {
        copyPrice = args[0]
        origPrice = args[1]
        labor = args[2]
      } else { // only
        copyPrice = args[0]
        origPrice = null
        labor = args[1]
      }
      
      allItems.push({
        key: `${pt}:${brand.name}:${modelCode}`,
        brandId: brand.name,
        brandName: brandNames[brand.name] || brand.name,
        modelCode,
        modelName,
        partType: pt,
        partLabelUk: PART_LABELS[pt].uk,
        partLabelRu: PART_LABELS[pt].ru,
        partGenitiveUk: PART_LABELS[pt].genitiveUk,
        partGenitiveRu: PART_LABELS[pt].genitiveRu,
        copyPrice,
        origPrice,
        labor,
      })
    }
  }
}

console.log(`Extracted ${allItems.length} items`)

// Group by part type for verification
const byType = {}
for (const item of allItems) {
  byType[item.partType] = (byType[item.partType] || 0) + 1
}
console.log('By type:', byType)

// Output
const outputPath = path.join(__dirname, 'parts-data.json')
fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2))
console.log(`Saved to ${outputPath}`)

// Sample
console.log('\nSamples:')
for (let i = 0; i < 3; i++) {
  const item = allItems[i]
  console.log(`  ${item.key}: ${item.brandName} ${item.modelName} — ${item.partLabelUk} (коп. ${item.copyPrice}, ориг. ${item.origPrice}, роб. ${item.labor})`)
}
