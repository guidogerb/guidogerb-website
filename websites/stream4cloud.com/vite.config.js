import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Defaults for dev/normal builds
  let buildOptions = {
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
  }

  // Staging (main branch): readable output (no minify) + sourcemaps
  if (mode === 'staging') {
    buildOptions = {
      sourcemap: true,
      minify: false,
      cssCodeSplit: true,
    }
  }

  // Production single-file bundle (prod branch)
  if (mode === 'production-bundle') {
    buildOptions = {
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: false, // merge CSS
      rollupOptions: {
        output: {
          // Inline all dynamic imports and avoid manual chunking
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
    plugins: [
      react(),
      mkcert({
        force: true,
        hosts: ['local.stream4cloud.com', '*.local.stream4cloud.com', '127.0.0.4'],
      }),
    ],
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: env.VITE_SITE_PORT ? parseInt(env.VITE_SITE_PORT) : 443,
      strictPort: true,
    },
    build: buildOptions,
  })
}
