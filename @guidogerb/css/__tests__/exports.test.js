import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

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
})
