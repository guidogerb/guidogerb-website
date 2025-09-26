// @vitest-environment node
import { readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(process.cwd(), '..', '..')

const readFile = (relativePath) =>
  readFileSync(isAbsolute(relativePath) ? relativePath : join(repoRoot, relativePath), 'utf8')

const normalizeMatches = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return [value]
}

describe('ggp.llc automation touchpoints', () => {
  const automationConfigPath = join(repoRoot, 'websites/ggp.llc/automation-touchpoints.json')
  const automationConfig = JSON.parse(readFile(automationConfigPath))

  it('tracks domain metadata and ensures listed files exist', () => {
    const { domain, workspaceSlug, touchPoints } = automationConfig

    expect(domain).toBe('ggp.llc')
    expect(workspaceSlug).toBe('ggp-llc')
    expect(Array.isArray(touchPoints)).toBe(true)
    expect(touchPoints.length).toBeGreaterThan(0)

    for (const touchPoint of touchPoints) {
      expect(Array.isArray(touchPoint.paths)).toBe(true)
      expect(touchPoint.paths.length).toBeGreaterThan(0)

      for (const relativePath of touchPoint.paths) {
        const contents = readFile(relativePath)
        const matches = normalizeMatches(touchPoint.match)

        if (matches.length > 0) {
          for (const pattern of matches) {
            expect(contents).toContain(pattern)
          }
          continue
        }

        switch (touchPoint.check) {
          case 'domain':
            expect(contents).toContain(domain)
            break
          case 'slug':
            expect(contents).toMatch(new RegExp(`\\b${workspaceSlug}\\b`, 'i'))
            break
          default:
            throw new Error(`Unknown touchpoint check '${touchPoint.check}' for ${relativePath}`)
        }
      }
    }
  })
})
