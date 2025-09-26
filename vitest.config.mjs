import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 10000,
    setupFiles: [resolve(workspaceRoot, 'vitest.setup.js')],
    coverage: {
      reporter: ['text', 'html'],
      lines: 70,
      statements: 70,
      functions: 60,
      branches: 60,
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
})
