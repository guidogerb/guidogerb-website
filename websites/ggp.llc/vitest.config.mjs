import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../vitest.config.mjs'

const workspaceRoot = dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  baseConfig,
  defineConfig({
    root: workspaceRoot,
    test: {
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    },
    resolve: {
      alias: {
        '@': resolve(workspaceRoot, 'src'),
      },
    },
  }),
)
