import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const tokensPath = path.resolve(currentDir, '..', 'tokens.css')

const extractRootBlock = (css) => {
  const rootIndex = css.indexOf(':root')
  if (rootIndex === -1) return ''

  const startBrace = css.indexOf('{', rootIndex)
  if (startBrace === -1) return ''

  let depth = 1
  let index = startBrace + 1

  while (index < css.length && depth > 0) {
    const character = css[index]
    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1
    }

    index += 1
  }

  return css.slice(startBrace + 1, index - 1)
}

const collectVariables = (cssBlock) => {
  if (!cssBlock) return []

  const matches = cssBlock.matchAll(/(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g)
  const entries = []

  for (const match of matches) {
    const [, name, rawValue] = match
    const value = rawValue
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .replace(/\s{2,}/g, ' ')
      .trim()

    entries.push([name, value])
  }

  return entries.sort(([a], [b]) => a.localeCompare(b))
}

describe('design tokens', () => {
  it('captures the :root custom property snapshot', () => {
    const css = readFileSync(tokensPath, 'utf8')
    const rootBlock = extractRootBlock(css)
    const tokens = Object.fromEntries(collectVariables(rootBlock))

    expect(tokens).toMatchInlineSnapshot(`
      {
        "--color-bg": "#0b0c0f",
        "--color-danger": "#ef4444",
        "--color-muted": "#a1a7b3",
        "--color-primary": "#3b82f6",
        "--color-primary-600": "#2563eb",
        "--color-success": "#22c55e",
        "--color-surface": "#111318",
        "--color-text": "#e6e8ec",
        "--color-warning": "#f59e0b",
        "--font-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        "--font-sans": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        "--gg-navigation-menu-item-radius": "var(--radius-1)",
        "--gg-navigation-menu-link-active-background": "color-mix(in srgb, var(--color-primary) 26%, transparent)",
        "--gg-navigation-menu-link-active-color": "var(--color-text)",
        "--gg-navigation-menu-link-active-ring": "inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 55%, transparent)",
        "--gg-navigation-menu-link-background": "transparent",
        "--gg-navigation-menu-link-color": "var(--color-text)",
        "--gg-navigation-menu-link-focus-background": "color-mix(in srgb, var(--color-primary) 22%, transparent)",
        "--gg-navigation-menu-link-focus-color": "var(--color-text)",
        "--gg-navigation-menu-link-focus-ring": "0 0 0 2px color-mix(in srgb, var(--color-primary) 45%, transparent)",
        "--gg-navigation-menu-link-gap": "var(--space-1)",
        "--gg-navigation-menu-link-hover-background": "color-mix(in srgb, var(--color-primary) 18%, transparent)",
        "--gg-navigation-menu-link-hover-color": "var(--color-text)",
        "--gg-navigation-menu-link-padding-block": "var(--space-2)",
        "--gg-navigation-menu-link-padding-inline": "var(--space-3)",
        "--radius-1": "4px",
        "--radius-2": "8px",
        "--radius-round": "999px",
        "--shadow-1": "0 1px 2px rgba(0, 0, 0, 0.2)",
        "--shadow-2": "0 4px 12px rgba(0, 0, 0, 0.25)",
        "--space-0": "0",
        "--space-1": "4px",
        "--space-10": "40px",
        "--space-12": "48px",
        "--space-2": "8px",
        "--space-3": "12px",
        "--space-4": "16px",
        "--space-5": "20px",
        "--space-6": "24px",
        "--space-8": "32px",
        "--text-base": "1rem",
        "--text-lg": "1.125rem",
        "--text-sm": "0.875rem",
        "--text-xl": "1.25rem",
      }
    `)
  })

  it('keeps base html/body styles referencing shared tokens', () => {
    const css = readFileSync(tokensPath, 'utf8')

    expect(css).toMatch(/html,\s*\nbody\s*{[\s\S]*?var\(--color-bg\)[\s\S]*?var\(--color-text\)/)
  })
})
