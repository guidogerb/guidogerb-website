import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import * as pkg from '../index.js'

const require = createRequire(import.meta.url)

describe('@guidogerb/css package exports', () => {
  it('exposes the reset stylesheet via package exports', () => {
    const resolvedPath = require.resolve('@guidogerb/css/reset.css')
    expect(resolvedPath.endsWith('reset.css')).toBe(true)
  })

  it('exposes the tokens stylesheet via package exports', () => {
    const resolvedPath = require.resolve('@guidogerb/css/tokens.css')
    expect(resolvedPath.endsWith('tokens.css')).toBe(true)
  })

  it('exports the theme provider and helpers', () => {
    expect(typeof pkg.ThemeProvider).toBe('function')
    expect(typeof pkg.ThemeSelect).toBe('function')
    expect(typeof pkg.useTheme).toBe('function')
    expect(pkg.DEFAULT_THEME_ID).toBeTypeOf('string')
    expect(Array.isArray(pkg.DEFAULT_THEMES)).toBe(true)
    expect(pkg.default).toBe(pkg.ThemeProvider)
  })
})
