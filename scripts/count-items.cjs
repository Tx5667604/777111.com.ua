const fs = require('fs')
const path = require('path')

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

console.log('Total items in data:', allItems.length)
console.log('Unique keys:', new Set(allItems.map(x => x.key)).size)

// Загрузка существующих
const existing = JSON.parse(fs.readFileSync('src/app/parts-seo-ru.json', 'utf-8'))
console.log('Existing RU texts:', Object.keys(existing).length)

const existingKeys = new Set(Object.keys(existing))
const missing = allItems.filter(item => !existingKeys.has(item.key))
console.log('Missing RU texts:', missing.length)

// Покажем первые 5 missing
for (const item of missing.slice(0, 5)) {
  console.log(JSON.stringify(item))
}
console.log('--- Last 5 missing ---')
for (const item of missing.slice(-5)) {
  console.log(JSON.stringify(item))
}
