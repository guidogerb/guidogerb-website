import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.resolve(currentDir, '..', 'tokens.css')

describe('navigation menu tokens', () => {
  const tokens = readFileSync(tokensPath, 'utf8')

  it('exposes hover, focus, and active state custom properties', () => {
    expect(tokens).toContain('--gg-navigation-menu-link-hover-background')
    expect(tokens).toContain('--gg-navigation-menu-link-focus-ring')
    expect(tokens).toContain('--gg-navigation-menu-link-active-background')
  })

  it('references the shared color tokens for defaults', () => {
    expect(tokens).toMatch(
      /--gg-navigation-menu-link-hover-background:\s*color-mix\(\s*in srgb,\s*var\(--color-primary\)/,
    )
    expect(tokens).toMatch(
      /--gg-navigation-menu-link-active-ring:\s*inset 0 0 0 1px\s*color-mix\(in srgb, var\(--color-primary\)/,
    )
  })
})
