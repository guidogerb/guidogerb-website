import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Library build config for React component package
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'GuidogerbAuth',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-oidc-context'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-oidc-context': 'ReactOidcContext'
        }
      }
    }
  }
})
