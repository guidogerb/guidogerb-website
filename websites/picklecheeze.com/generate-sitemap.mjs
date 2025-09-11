// website/generate-sitemap.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Lightweight env loader respecting Vite’s naming
const mode = process.argv[2] || 'development'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)))

function loadEnvLikeVite() {
  // Prefer .env.[mode] over .env
  const modeFile = path.join(root, `.env.${mode}`)
  const baseFile = path.join(root, `.env`)
  const env = {}

  const parse = (content) =>
    content
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .forEach((l) => {
        const idx = l.indexOf('=')
        if (idx > -1) {
          const key = l.slice(0, idx).trim()
          let val = l.slice(idx + 1).trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          env[key] = val
        }
      })

  if (fs.existsSync(baseFile)) parse(fs.readFileSync(baseFile, 'utf8'))
  if (fs.existsSync(modeFile)) parse(fs.readFileSync(modeFile, 'utf8'))

  return env
}

const env = loadEnvLikeVite()
const siteUrl =
  env.VITE_SITE_URL ||
  (mode === 'production' ? 'https://picklecheeze.com' : 'https://local.picklecheeze.com')

// Define your public routes here. Start minimal; expand as you add pages.
const routes = [
  '/', // home
  '/auth/callback', // example auth callback if exposed
  // add more public routes as needed: '/catalog', '/artists', etc.
]

const now = new Date().toISOString()
const urlset = routes
  .map(
    (r) => `
  <url>
    <loc>${siteUrl.replace(/\/$/, '')}${r === '/' ? '' : r}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${mode === 'production' ? 'weekly' : 'daily'}</changefreq>
    <priority>${r === '/' ? '1.0' : '0.8'}</priority>
  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urlset}
</urlset>
`

const outDir = path.join(root, 'public')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml, 'utf8')

console.log(`Sitemap generated for mode=${mode} at ${path.join(outDir, 'sitemap.xml')}`)
