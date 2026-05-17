// Generate split sitemaps + keep sitemap.xml for backward compat
// node scripts/generate-sitemap.cjs

const fs = require('fs')
const path = require('path')

const BASE = 'https://777111.com.ua'
const TODAY = new Date().toISOString().split('T')[0]

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

// --- Display pages ---
const data = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'app', 'phone-parts-data.ts'),
  'utf-8'
)

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const sections = data.split("id: '")
const displayUrls = []

for (let i = 1; i < sections.length; i++) {
  const section = sections[i]
  const brandId = section.match(/^(\w+)/)?.[1]
  if (!brandId) continue
  const modelRegex = /modelCode:\s*'([^']+)'/g
  let m
  while ((m = modelRegex.exec(section)) !== null) {
    displayUrls.push({ loc: `${BASE}/${brandId}/display/${slug(m[1])}`, priority: '0.6', changefreq: 'weekly' })
  }
}

// Write split sitemaps
writeSitemap('sitemap-pages.xml', mainPages)
writeSitemap('sitemap-displays.xml', displayUrls)

// Write combined sitemap (backward compat for Search Console)
const allUrls = [...mainPages, ...displayUrls]
writeSitemap('sitemap.xml', allUrls)

console.log(`✓ sitemap.xml (combined): ${allUrls.length} URLs`)
console.log(`✓ sitemap-pages.xml: ${mainPages.length} URLs`)
console.log(`✓ sitemap-displays.xml: ${displayUrls.length} URLs`)
