import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default ({ mode }) => {
  // Single source of truth for the base domain
  const ip = '127.0.0.3'
  const host = 'this-is-my-story.org'
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
    base: env.VITE_BASE_PATH || '/',
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
