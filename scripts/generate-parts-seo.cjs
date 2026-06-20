const fs = require('fs')
const path = require('path')

const dataPath = path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts')
const src = fs.readFileSync(dataPath, 'utf-8')

// Extract all model entries by finding modelCode/modelName pairs
const codeRegex = /modelCode:\s*['"](.+?)['"]/g
const nameRegex = /modelName:\s*['"](.+?)['"]/g

const codes = []
let m
while ((m = codeRegex.exec(src)) !== null) codes.push(m[1])

const names = []
while ((m = nameRegex.exec(src)) !== null) names.push(m[1])

// Extract brand IDs - they follow the pattern `id: 'brandname',`
const brandRegex = /}\s*,\s*{\s*\n\s*id:\s*['"](.+?)['"]/gs
const brands = ['apple'] // first brand
while ((m = brandRegex.exec(src)) !== null) brands.push(m[1])

console.log(`Found ${brands.length} brands`)
console.log(`Found ${codes.length} model codes, ${names.length} model names`)
console.log(`Brands: ${brands.join(', ')}`)

// Map brand to model count
// We need to track which brand each model belongs to
// Let's split by brand blocks
const brandBlocks = src.split(/\bid:\s*['"][a-z_]+['"]/)
console.log(`Found ${brandBlocks.length} brand blocks`)

// Re-extract with position tracking
const allBrands = []
const brandRe = /id:\s*['"]([a-z_]+)['"]/g
while ((m = brandRe.exec(src)) !== null) {
  allBrands.push({ name: m[1], pos: m.index })
}

// Now for each brand, get models between its position and the next brand's position
const entries = []
for (let i = 0; i < allBrands.length; i++) {
  const brand = allBrands[i]
  const start = brand.pos
  const end = i < allBrands.length - 1 ? allBrands[i + 1].pos : src.length
  const block = src.slice(start, end)
  
  // Extract modelCode and modelName from this block
  const modelRe = /modelCode:\s*['"](.+?)['"][\s\S]*?modelName:\s*['"](.+?)['"]/g
  let match
  while ((match = modelRe.exec(block)) !== null) {
    entries.push({ brand: brand.name, code: match[1], name: match[2] })
  }
}

console.log(`\nExtracted ${entries.length} model entries`)

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

const PART_INTROS = {
  battery: {
    uk: [
      'Акумулятор швидко розряджається, телефон вимикається на морозі або на 20-30% заряду?',
      'Телефон гріється в районі батареї, здувся корпус або акумулятор тримає заряд менше години?',
      'Час роботи телефону значно скоротився, батарея здулася або телефон вимикається без попередження?',
      'Потрібна заміна акумулятора — телефон став повільно заряджатися або взагалі не вмикається без зарядки?',
    ],
    ru: [
      'Аккумулятор быстро разряжается, телефон выключается на морозе или при 20-30% заряда?',
      'Телефон греется в районе батареи, вздулся корпус или аккумулятор держит заряд меньше часа?',
      'Время работы телефона сильно сократилось, батарея вздулась или телефон выключается без предупреждения?',
      'Нужна замена аккумулятора — телефон стал медленно заряжаться или вовсе не включается без зарядки?',
    ],
  },
  back_cover: {
    uk: [
      'Задня кришка розбита, тріснула при падінні або втратила герметичність?',
      'Розбита скляна або пластикова задня панель — потрібно терміново замінити?',
      'Задня кришка відклеїлася, тріснула або має глибокі подряпини?',
      'Потрібна нова задня кришка після падіння — скляні кришки часто тріскаються повністю при ударі?',
    ],
    ru: [
      'Задняя крышка разбита, треснула при падении или потеряла герметичность?',
      'Разбита стеклянная или пластиковая задняя панель — нужно срочно заменить?',
      'Задняя крышка отклеилась, треснула или имеет глубокие царапины?',
      'Нужна новая задняя крышка после падения — стеклянные крышки часто трескаются полностью при ударе?',
    ],
  },
  speaker: {
    uk: [
      'Немає звуку в динаміку, хрипить або звук надто тихий навіть на максимальній гучності?',
      'Динамік захрипів, звук переривається або зовсім зник після намокання телефону?',
      'Погано чути співрозмовника, музика звучить з перешкодами або динамік видає тріск?',
      'Не працює розмовний або поліфонічний динамік — звук зник після падіння або залиття?',
    ],
    ru: [
      'Нет звука в динамике, хрипит или звук слишком тихий даже на максимальной громкости?',
      'Динамик захрипел, звук прерывается или совсем исчез после намокания телефона?',
      'Плохо слышно собеседника, музыка звучит с помехами или динамик издаёт треск?',
      'Не работает разговорный или полифонический динамик — звук пропал после падения или залития?',
    ],
  },
  charging_flex: {
    uk: [
      'Телефон не заряджається, зарядка переривається або зарядний пристрій не визначається?',
      'Розхитався роз\'єм зарядки, телефон заряджається тільки в певному положенні кабелю?',
      'Не працює USB-порт — телефон не бачить зарядку, дані не передаються?',
      'Зарядка йде повільно, роз\'єм люфтить або телефон показує "волога виявлена" без причини?',
    ],
    ru: [
      'Телефон не заряжается, зарядка прерывается или зарядное устройство не определяется?',
      'Разболтался разъем зарядки, телефон заряжается только в определённом положении кабеля?',
      'Не работает USB-порт — телефон не видит зарядку, данные не передаются?',
      'Зарядка идёт медленно, разъем люфтит или телефон показывает "влага обнаружена" без причины?',
    ],
  },
  camera: {
    uk: [
      'Камера не фокусується, знімки розмиті або камера взагалі не вмикається?',
      'Основна або фронтальна камера видає чорний екран, зображення тремтить або має плями?',
      'Дисплей показує "помилка камери", знімки з дефектами або камера працює тільки після перезавантаження?',
      'Розбите скло камери, пил під об\'єктивом або автофокус перестав працювати?',
    ],
    ru: [
      'Камера не фокусируется, снимки размыты или камера вообще не включается?',
      'Основная или фронтальная камера выдаёт чёрный экран, изображение дрожит или имеет пятна?',
      'Дисплей показывает "ошибка камеры", снимки с дефектами или камера работает только после перезагрузки?',
      'Разбито стекло камеры, пыль под объективом или автофокус перестал работать?',
    ],
  },
  microphone: {
    uk: [
      'Співрозмовник погано чує, мікрофон передає звук з перешкодами або зовсім не працює?',
      'Мікрофон перестав працювати після залиття водою або падіння телефону?',
      'Не працює диктофон, голосові повідомлення не записуються або мікрофон видає шум?',
      'Під час розмови звук пропадає, мікрофон забився пилом або вийшов з ладу?',
    ],
    ru: [
      'Собеседник плохо слышит, микрофон передаёт звук с помехами или совсем не работает?',
      'Микрофон перестал работать после залития водой или падения телефона?',
      'Не работает диктофон, голосовые сообщения не записываются или микрофон издаёт шум?',
      'Во время разговора звук пропадает, микрофон забился пылью или вышел из строя?',
    ],
  },
  buttons: {
    uk: [
      'Кнопки не реагують на натискання, залипають або спрацьовують через раз?',
      'Не працює кнопка живлення, гойдалка гучності або домашня кнопка (Touch ID)?',
      'Кнопка провалилася всередину корпусу або натискається тільки з зусиллям?',
      'Перестала працювати бічна кнопка, кнопки реагують через раз або залипають?',
    ],
    ru: [
      'Кнопки не реагируют на нажатие, залипают или срабатывают через раз?',
      'Не работает кнопка питания, качелька громкости или домашняя кнопка (Touch ID)?',
      'Кнопка провалилась внутрь корпуса или нажимается только с усилием?',
      'Перестала работать боковая кнопка, кнопки реагируют через раз или залипают?',
    ],
  },
  connector: {
    uk: [
      'Не працює роз\'єм для навушників, слот SIM-карти або перехідний шлейф?',
      'Розхитався або пошкодився внутрішній конектор після падіння — не бачить SIM?',
      'Дисплей не бачить SIM-карту, не працює аудіороз\'єм або інші порти?',
      'Відпав або пошкодився шлейф конектора — потрібна заміна та пайка?',
    ],
    ru: [
      'Не работает разъем для наушников, слот SIM-карты или переходной шлейф?',
      'Разболтался или повредился внутренний коннектор после падения — не видит SIM?',
      'Телефон не видит SIM-карту, не работает аудиоразъем или другие порты?',
      'Отошёл или повредился шлейф коннектора — нужна замена и пайка?',
    ],
  },
  glass: {
    uk: [
      'Скло екрану розбите — тріщини, сколи, осколки на дисплеї?',
      'Розбите скло, але дисплей працює — можна замінити тільки скло без заміни матриці?',
      'Потрібна заміна скла на телефоні — тріщини заважають користуватися, осколки сипляться?',
      'Скло розбите вщент — сенсор працює, але користуватися небезпечно через осколки?',
    ],
    ru: [
      'Стекло экрана разбито — трещины, сколы, осколки на дисплее?',
      'Разбито стекло, но дисплей работает — можно заменить только стекло без замены матрицы?',
      'Нужна замена стекла на телефоне — трещины мешают пользоваться, осколки сыпятся?',
      'Стекло разбито вдребезги — сенсор работает, но пользоваться опасно из-за осколков?',
    ],
  },
}

const OUTRO_UK = 'Запрошуємо в майстерню в м. Вознесенськ, Центральний ринок, сектор Б, к. 96. Безкоштовна діагностика, гарантія на всі роботи.'
const OUTRO_RU = 'Приходите в мастерскую в г. Вознесенск, Центральный рынок, сектор Б, к. 96. Бесплатная диагностика, гарантия на все работы.'

// Use a deterministic seed based on model code for intro variation
function getIntroIndex(code, partType, lang, max) {
  // Simple hash from code + partType
  let hash = 0
  const str = code + partType + lang
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

const seoUk = {}
const seoRu = {}

for (const entry of entries) {
  const brandName = brandNames[entry.brand] || entry.brand
  const modelCode = entry.code
  const modelName = entry.name || entry.code
  
  for (const partType of partTypes) {
    const key = `${partType}:${entry.brand}:${modelCode}`
    const labelUk = PART_LABELS[partType].uk.toLowerCase()
    const labelRu = PART_LABELS[partType].ru.toLowerCase()
    
    const introIdxUk = getIntroIndex(modelCode, partType, 'uk', PART_INTROS[partType].uk.length)
    const introIdxRu = getIntroIndex(modelCode, partType, 'ru', PART_INTROS[partType].ru.length)
    
    const introUk = PART_INTROS[partType].uk[introIdxUk]
    const introRu = PART_INTROS[partType].ru[introIdxRu]
    
    seoUk[key] = `${introUk} Пропонуємо заміну ${labelUk} для ${brandName} ${modelName}. ${OUTRO_UK}`
    seoRu[key] = `${introRu} Предлагаем замену ${labelRu} для ${brandName} ${modelName}. ${OUTRO_RU}`
  }
}

const ukPath = path.join(__dirname, '..', 'src', 'app', 'parts-seo.json')
const ruPath = path.join(__dirname, '..', 'src', 'app', 'parts-seo-ru.json')

fs.writeFileSync(ukPath, JSON.stringify(seoUk, null, 2), 'utf-8')
fs.writeFileSync(ruPath, JSON.stringify(seoRu, null, 2), 'utf-8')

console.log(`\nGenerated ${Object.keys(seoUk).length} UK texts`)
console.log(`Generated ${Object.keys(seoRu).length} RU texts`)
const ukSize = (Buffer.byteLength(JSON.stringify(seoUk, null, 2)) / 1024 / 1024).toFixed(1)
const ruSize = (Buffer.byteLength(JSON.stringify(seoRu, null, 2)) / 1024 / 1024).toFixed(1)
console.log(`UK size: ${ukSize} MB`)
console.log(`RU size: ${ruSize} MB`)

// Verify a few samples
const allKeys = Object.keys(seoUk)
for (let i = 0; i < Math.min(7, allKeys.length); i++) {
  const k = allKeys[i]
  console.log(`\n--- ${k} ---`)
  console.log(`UK: ${seoUk[k]}`)
  console.log(`RU: ${seoRu[k]}`)
}
