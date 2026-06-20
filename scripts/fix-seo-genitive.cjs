const fs = require('fs')
const path = require('path')

const PART_LABELS = {
  battery: { uk: 'Акумулятор', ru: 'Аккумулятор' },
  back_cover: { uk: 'Задня кришка', ru: 'Задняя крышка' },
  speaker: { uk: 'Динамік', ru: 'Динамик' },
  charging_flex: { uk: 'Шлейф зарядки', ru: 'Шлейф зарядки' },
  camera: { uk: 'Камера', ru: 'Камера' },
  microphone: { uk: 'Мікрофон', ru: 'Микрофон' },
  buttons: { uk: 'Кнопки', ru: 'Кнопки' },
  connector: { uk: "Роз'єм", ru: 'Разъем' },
  glass: { uk: 'Скло екрану', ru: 'Стекло экрана' },
}

// Ukrainian genitive forms for "заміна + noun"
const GENITIVE_UK = {
  battery: 'акумулятора',
  back_cover: 'задньої кришки',
  speaker: 'динаміка',
  charging_flex: 'шлейфу зарядки',
  camera: 'камери',
  microphone: 'мікрофона',
  buttons: 'кнопок',
  connector: "роз'єму",
  glass: 'скла екрану',
}

// Russian genitive forms for "замена + noun"
const GENITIVE_RU = {
  battery: 'аккумулятора',
  back_cover: 'задней крышки',
  speaker: 'динамика',
  charging_flex: 'шлейфа зарядки',
  camera: 'камеры',
  microphone: 'микрофона',
  buttons: 'кнопок',
  connector: 'разъема',
  glass: 'стекла экрана',
}

// Read existing JSON files
const ukPath = path.join(__dirname, '..', 'src', 'app', 'parts-seo.json')
const ruPath = path.join(__dirname, '..', 'src', 'app', 'parts-seo-ru.json')

const seoUk = JSON.parse(fs.readFileSync(ukPath, 'utf-8'))
const seoRu = JSON.parse(fs.readFileSync(ruPath, 'utf-8'))

let count = 0
for (const [key, text] of Object.entries(seoUk)) {
  const partType = key.split(':')[0]
  const genitive = GENITIVE_UK[partType]
  if (genitive) {
    const oldLabel = PART_LABELS[partType].uk.toLowerCase()
    // Replace "заміну {nominative}" with "заміну {genitive}"
    const newText = text.replace(`заміну ${oldLabel}`, `заміну ${genitive}`)
    if (newText !== text) {
      seoUk[key] = newText
      count++
    }
  }
}

let countRu = 0
for (const [key, text] of Object.entries(seoRu)) {
  const partType = key.split(':')[0]
  const genitive = GENITIVE_RU[partType]
  if (genitive) {
    const oldLabel = PART_LABELS[partType].ru.toLowerCase()
    const newText = text.replace(`замену ${oldLabel}`, `замену ${genitive}`)
    if (newText !== text) {
      seoRu[key] = newText
      countRu++
    }
  }
}

fs.writeFileSync(ukPath, JSON.stringify(seoUk, null, 2), 'utf-8')
fs.writeFileSync(ruPath, JSON.stringify(seoRu, null, 2), 'utf-8')

console.log(`Fixed ${count} UK texts, ${countRu} RU texts`)

// Verify a sample
console.log(`\nSample UK: ${seoUk["battery:apple:iPhone 6"]}`)
console.log(`\nSample RU: ${seoRu["battery:apple:iPhone 6"]}`)
