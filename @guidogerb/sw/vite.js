import { VitePWA } from 'vite-plugin-pwa'

const DEFAULT_ICONS = [
  { src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml' },
  { src: '/pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml' },
]

export function createPwaPlugin(options = {}) {
  const {
    base = '/',
    mode = 'production',
    manifest: manifestOverrides = {},
    includeAssets = [],
    enableInDev = false,
    filename = 'sw.js',
    injectManifest = {},
    registerType = 'prompt',
  } = options

  const manifest = {
    name: 'Guidogerb App',
    short_name: 'Guidogerb',
    description: 'Offline-ready storefront shell.',
    display: 'standalone',
    theme_color: '#0b0d12',
    background_color: '#0b0d12',
    start_url: base,
    scope: base,
    icons: DEFAULT_ICONS,
    ...manifestOverrides,
  }

  if (!manifest.start_url) manifest.start_url = base
  if (!manifest.scope) manifest.scope = base
  if (!manifest.icons || manifest.icons.length === 0) {
    manifest.icons = DEFAULT_ICONS
  }

  const uniqueAssets = Array.from(new Set(['offline.html', ...includeAssets]))

  const resolvedSrcDir = injectManifest.srcDir || 'src'
  const resolvedSwSrc = injectManifest.swSrc || 'sw.js'

  const resolvedInjectManifest = {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json,txt,woff2}'],
    globIgnores: ['**/node_modules/**/*', '**/.DS_Store'],
    ...injectManifest,
    swSrc: resolvedSwSrc,
  }

  return VitePWA({
    strategies: 'injectManifest',
    srcDir: resolvedSrcDir,
    filename,
    registerType,
    base,
    manifest,
    includeAssets: uniqueAssets,
    injectRegister: false,
    injectManifest: resolvedInjectManifest,
    devOptions: {
      enabled: enableInDev && mode === 'development',
      suppressWarnings: true,
    },
  })
}
