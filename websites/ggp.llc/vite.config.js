import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default ({ mode }) => {
  // Single source of truth for the base domain
  const ip = '127.0.0.5'
  const host = 'llc.guidogerbpublishing.com'
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
  const isVitest = process.env.VITEST === 'true'

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

  const plugins = [react(), restrictHosts(allowedHosts)]

  if (!isVitest) {
    plugins.push(
      mkcert({
        force: true,
        hosts: [localHost, wildcardLocalHost, ip],
      }),
      printPreviewUrls(),
    )
  }

  return defineConfig({
    logLevel: 'silent',
    resolve: isVitest
      ? {}
      : {
          conditions: [mode, 'import', 'module', 'browser', 'default'].filter(Boolean),
        },
    plugins,
    base: env.VITE_BASE_PATH || '/',
    server: {
      https: !isVitest,
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
