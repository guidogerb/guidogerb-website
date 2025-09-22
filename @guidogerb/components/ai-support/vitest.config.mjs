import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))
const workspaceRoot = resolve(packageRoot, '../../..')

export default defineConfig({
  root: packageRoot,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(workspaceRoot, 'vitest.setup.js')],
    include: ['src/**/__tests__/**/*.{test,spec}.[jt]s?(x)'],
    exclude: ['node_modules', 'dist', '**/__fixtures__/**'],
    coverage: { enabled: false },
    // Keep threads modest for small packages to reduce memory
    poolOptions: { threads: { minThreads: 1, maxThreads: 2 } },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
})
