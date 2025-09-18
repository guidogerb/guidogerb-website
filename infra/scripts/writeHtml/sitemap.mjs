import fs from 'node:fs/promises'
import path from 'node:path'

function normalizeBaseUrl(url) {
  if (!url) throw new Error('generateSitemap requires a `baseUrl` option')
  return url.replace(/\/$/, '')
}

function normalizeRoute(route) {
  if (!route) return '/'
  return route.startsWith('/') ? route : `/${route}`
}

export async function generateSitemap(options = {}) {
  const {
    outFile,
    baseUrl,
    routes = ['/'],
    changefreq = 'weekly',
    priority = {},
    lastmod,
  } = options

  if (!outFile) throw new Error('generateSitemap requires an `outFile` option')

  const normalizedBase = normalizeBaseUrl(baseUrl)
  const iso = lastmod || new Date().toISOString()
  const uniqueRoutes = Array.from(new Set(routes.map(normalizeRoute)))

  const xmlRoutes = uniqueRoutes
    .map((route) => {
      const routeUrl = route === '/' ? `${normalizedBase}/` : `${normalizedBase}${route}`
      const freqValue = typeof changefreq === 'string' ? changefreq : changefreq[route] || 'weekly'
      const priorityValue = typeof priority === 'string' ? priority : priority[route] || (route === '/' ? '1.0' : '0.8')
      const lastmodValue = typeof lastmod === 'object' && lastmod !== null ? lastmod[route] || iso : iso
      return `  <url>\n    <loc>${routeUrl}</loc>\n    <lastmod>${lastmodValue}</lastmod>\n    <changefreq>${freqValue}</changefreq>\n    <priority>${priorityValue}</priority>\n  </url>`
    })
    .join('\n\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n>${xmlRoutes ? `\n\n${xmlRoutes}\n` : ''}</urlset>\n`

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, xml, 'utf8')
  return outFile
}
