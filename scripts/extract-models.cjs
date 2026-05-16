const fs = require('fs')
const content = fs.readFileSync('src/app/phone-parts-data.ts', 'utf-8')

// Split by brand blocks
const brandBlocks = content.split(/\n  \{\s*\n    id: '/).slice(1)

const brands = []

for (const block of brandBlocks) {
  const id = block.match(/^(\w+)/)?.[1]
  const name = block.match(/name: '([^']+)'/)?.[1]
  if (!id || !name) continue

  const models = []
  const modelRegex = /modelCode:\s*'([^']+)',[\s\S]*?modelName:\s*'([^']+)',[\s\S]*?display:\s*display\((\d+),\s*(\d+),\s*(\d+)\)/g
  let m
  while ((m = modelRegex.exec(block)) !== null) {
    models.push({
      code: m[1],
      name: m[2],
      copyPrice: parseInt(m[3]),
      origPrice: parseInt(m[4]),
      labor: parseInt(m[5]),
    })
  }

  if (models.length > 0) {
    brands.push({ id, name, models })
  }
}

const total = brands.reduce((s, b) => s + b.models.length, 0)
fs.writeFileSync('scripts/seo-models.json', JSON.stringify(brands, null, 2))
console.log(`Brands: ${brands.length}, Models with display: ${total}`)
console.log(`File saved: scripts/seo-models.json`)
