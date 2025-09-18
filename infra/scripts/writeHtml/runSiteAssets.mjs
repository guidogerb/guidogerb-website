import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { generateSitemap, writeOfflinePage, writeSvgIcon } from './index.mjs'

const { values } = parseArgs({
  options: {
    config: { type: 'string' },
    mode: { type: 'string' },
  },
  allowPositionals: true,
})

const configArg = values.config || values._?.[0]
const mode = values.mode || values._?.[1] || 'development'

if (!configArg) {
  console.error('Usage: node runSiteAssets.mjs --config ./pwa.config.js [--mode production]')
  process.exit(1)
}

const configPath = path.resolve(process.cwd(), configArg)
const moduleUrl = pathToFileURL(configPath)
const configModule = await import(moduleUrl.href)
const pwaConfig = configModule.pwaConfig || configModule.default

if (!pwaConfig) {
  console.error(`Expected ${configPath} to export pwaConfig`)
  process.exit(1)
}

const rootDir = path.dirname(configPath)
const publicDir = path.join(rootDir, 'public')

const baseUrls = pwaConfig.baseUrls || {}
const baseUrl = baseUrls[mode] || baseUrls.production || baseUrls.default || pwaConfig.baseUrl

if (!baseUrl) {
  console.error('PWA config must provide baseUrls for the selected mode or a baseUrl string')
  process.exit(1)
}

await writeOfflinePage({
  outFile: path.join(publicDir, 'offline.html'),
  siteName: pwaConfig.siteName,
  headline: pwaConfig.offlineHeadline,
  message: pwaConfig.offlineMessage,
  backgroundColor: pwaConfig.backgroundColor,
  cardColor: pwaConfig.cardColor || '#12161f',
  textColor: pwaConfig.textColor || '#eaeef3',
  accentColor: pwaConfig.accentColor,
})

await writeSvgIcon({
  outFile: path.join(publicDir, 'pwa-icon.svg'),
  text: pwaConfig.iconText || pwaConfig.shortName || 'GG',
  backgroundColor: pwaConfig.backgroundColor,
  textColor: pwaConfig.iconTextColor || '#f7f8fc',
})

await generateSitemap({
  outFile: path.join(publicDir, 'sitemap.xml'),
  baseUrl,
  routes: pwaConfig.routes || ['/'],
  changefreq: mode === 'production' ? 'weekly' : 'daily',
})
