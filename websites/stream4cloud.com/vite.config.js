import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { createPwaPlugin } from '@guidogerb/sw/vite'
import { pwaConfig } from './pwa.config.js'

export default ({ mode }) => {
  // Single source of truth for the base domain
  const ip = '127.0.0.4'
  const host = 'stream4cloud.com'
  const localHost = `local.${host}`
  const wildcardLocalHost = `*.local.${host}`

  function restrictHosts(allowed) {
    return {
      name: 'restrict-hosts',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const reqHost = (req.headers.host || '').split(':')[0].toLowerCase()
          if (reqHost && !allowed.includes(reqHost)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const reqHost = (req.headers.host || '').split(':')[0].toLowerCase()
          if (reqHost && !allowed.includes(reqHost)) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }
          next()
        })
      },
    }
  }

  function printPreviewUrls() {
    return {
      name: 'print-preview-urls',
      configurePreviewServer(server) {
        server.httpServer?.once('listening', () => {
          console.log(`  ➜  Local: https://${localHost}/`)
        })
      },
    }
  }

  const allowedHosts = [localHost]
  const env = loadEnv(mode, process.cwd(), '')

  const basePath = env.VITE_BASE_PATH || '/'
  const manifest = {
    name: pwaConfig.siteName,
    short_name: pwaConfig.shortName,
    description: pwaConfig.description,
    theme_color: pwaConfig.themeColor,
    background_color: pwaConfig.backgroundColor,
    icons: [
      { src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/pwa-icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }

  let buildOptions = {
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
  }

  if (mode === 'staging') {
    buildOptions = {
      sourcemap: true,
      minify: false,
      cssCodeSplit: true,
    }
  }

  if (mode === 'production-bundle') {
    buildOptions = {
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
          entryFileNames: 'assets/app.[hash].js',
          chunkFileNames: 'assets/app.[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    }
  }

  return defineConfig({
    logLevel: 'silent',
    resolve: {
      conditions: [mode],
    },
    plugins: [
      react(),
      mkcert({
        force: true,
        hosts: [localHost, wildcardLocalHost, ip],
      }),
      restrictHosts(allowedHosts),
      printPreviewUrls(),
    ],
    base: basePath,
    server: {
      https: true,
      host: true,
      port: 443,
      strictPort: true,
      open: false,
      allowedHosts,
    },
    preview: {
      https: true,
      host: true,
      port: 443,
      strictPort: true,
      open: false,
    },
    build: buildOptions,
  })
}
