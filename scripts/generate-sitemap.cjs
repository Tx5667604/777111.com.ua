// Generate sitemaps for all part types
// node scripts/generate-sitemap.cjs

const fs = require('fs')
const path = require('path')

const BASE = 'https://777111.com.ua'
const TODAY = new Date().toISOString().split('T')[0]

const PART_TYPES = [
  { id: 'display', url: 'display', priority: '0.6' },
  { id: 'charging_flex', url: 'charging-flex', priority: '0.6' },
  { id: 'battery', url: 'battery', priority: '0.6' },
  { id: 'back_cover', url: 'back-cover', priority: '0.6' },
  { id: 'glass', url: 'glass', priority: '0.6' },
  { id: 'speaker', url: 'speaker', priority: '0.6' },
  { id: 'camera', url: 'camera', priority: '0.6' },
  { id: 'microphone', url: 'microphone', priority: '0.6' },
  { id: 'buttons', url: 'buttons', priority: '0.6' },
  { id: 'connector', url: 'connector', priority: '0.6' },
]

const mainPages = [
  { loc: `${BASE}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${BASE}/zamina-ekrana`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/remont-iphone`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/zamina-akumuliatora`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/rozblokuvannja-icloud`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/remont-samsung`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/remont-xiaomi`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/proshivka-telefonu`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/remont-pislya-zalyvky`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/vidnovleni-telefony`, priority: '0.9', changefreq: 'monthly' },
  { loc: `${BASE}/returns`, priority: '0.6', changefreq: 'monthly' },
  { loc: `${BASE}/account`, priority: '0.3', changefreq: 'monthly' },
  { loc: `${BASE}/admin`, priority: '0.1', changefreq: 'monthly' },
]

function xmlUrl(url) {
  return `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
}

function writeSitemap(name, urls) {
  const content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map(xmlUrl).join('\n')}\n</urlset>`
  fs.writeFileSync(path.join(__dirname, '..', 'public', name), content)
}

// Read data
const data = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts'),
  'utf-8'
)

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const sections = data.split("id: '")

// Collect URLs per part type
const partUrls = {}  // key: part_type_id -> array of URLs
for (const pt of PART_TYPES) {
  partUrls[pt.id] = []
}

for (let i = 1; i < sections.length; i++) {
  const section = sections[i]
  const brandId = section.match(/^(\w+)/)?.[1]
  if (!brandId) continue
  const modelRegex = /modelCode:\s*'([^']+)'/g
  let m
  while ((m = modelRegex.exec(section)) !== null) {
    for (const pt of PART_TYPES) {
      partUrls[pt.id].push({
        loc: `${BASE}/${brandId}/${pt.url}/${slug(m[1])}`,
        priority: pt.priority,
        changefreq: 'weekly'
      })
    }
  }
}

// Write individual sitemaps (for Search Console — submit sitemap-parts.xml)
let allPartUrls = []  // unused but kept for possible future combined sitemap
for (const pt of PART_TYPES) {
  const filename = `sitemap-${pt.url}.xml`
  writeSitemap(filename, partUrls[pt.id])
  console.log(`✓ ${filename}: ${partUrls[pt.id].length} URLs`)
}

// Write main pages
writeSitemap('sitemap-pages.xml', mainPages)
console.log(`✓ sitemap-pages.xml: ${mainPages.length} URLs`)

// Write sitemap index — references all individual sitemaps (Google prefers smaller sitemaps)
const indexFiles = [
  'sitemap-pages.xml',
  ...PART_TYPES.map(pt => `sitemap-${pt.url}.xml`)
]
const indexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexFiles.map(f => `  <sitemap>\n    <loc>${BASE}/${f}</loc>\n    <lastmod>${TODAY}</lastmod>\n  </sitemap>`).join('\n')}
</sitemapindex>`
fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap-index.xml'), indexContent)
console.log(`✓ sitemap-index.xml (index of ${indexFiles.length} individual sitemaps)`)

// Write lightweight sitemap.xml — just the 13 main pages + index reference (for backward compat)
// No longer includes all 13K URLs — Google gets the index instead
writeSitemap('sitemap.xml', mainPages)
console.log(`✓ sitemap.xml (main pages only — submit sitemap-index.xml to Google)`)
