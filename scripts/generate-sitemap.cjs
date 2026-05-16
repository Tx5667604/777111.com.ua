// Script to generate sitemap with all display pages
// Run after npm run build: node scripts/generate-sitemap.cjs

const fs = require('fs')
const path = require('path')

const BASE = 'https://777111.com.ua'

// Parse the phone-parts-data.ts to get all display pages
const data = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts'),
  'utf-8'
)

function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Extract brand IDs and model codes
const brandRegex = /id:\s*'(\w+)'/g
const modelRegex = /modelCode:\s*'([^']+)'/g

const brands = []
let m
while ((m = brandRegex.exec(data)) !== null) {
  brands.push(m[1])
}

// We need to associate models with brands. Let's parse structure.
// Simple approach: read sections
const sections = data.split("id: '")
const pages = []

for (let i = 1; i < sections.length; i++) {
  const section = sections[i]
  const brandId = section.match(/^(\w+)/)?.[1]
  if (!brandId) continue

  const modelRegex2 = /modelCode:\s*'([^']+)'/g
  let m2
  while ((m2 = modelRegex2.exec(section)) !== null) {
    pages.push({
      loc: `${BASE}/${brandId}/display/${slug(m2[1])}`,
      priority: '0.6',
      changefreq: 'weekly',
    })
  }
}

// Read existing sitemap
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml')
let existing
try {
  existing = fs.readFileSync(sitemapPath, 'utf-8')
} catch {
  existing = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`
}

// Replace closing tag with display pages + closing tag
const closeTag = '</urlset>'
const existingBody = existing.replace(closeTag, '')

const today = new Date().toISOString().split('T')[0]

let sitemap = existingBody
for (const page of pages) {
  sitemap += `  <url>\n    <loc>${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`
}
sitemap += closeTag

fs.writeFileSync(sitemapPath, sitemap)
console.log(`✓ Sitemap generated: ${pages.length} display pages + existing pages`)
