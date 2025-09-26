// @vitest-environment node
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url))

describe('guidogerbpublishing.com automation touchpoints', () => {
  const automationConfigPath = join(
    repoRoot,
    'websites/guidogerbpublishing.com/automation-touchpoints.json',
  )
  const automationConfig = JSON.parse(readFileSync(automationConfigPath, 'utf8'))

  it('tracks domain metadata and ensures listed files exist', () => {
    const { domain, workspaceSlug, touchPoints } = automationConfig

    expect(domain).toBe('guidogerbpublishing.com')
    expect(workspaceSlug).toBe('guidogerbpublishing')
    expect(Array.isArray(touchPoints)).toBe(true)
    expect(touchPoints.length).toBeGreaterThan(0)

    for (const touchPoint of touchPoints) {
      expect(Array.isArray(touchPoint.paths)).toBe(true)
      expect(touchPoint.paths.length).toBeGreaterThan(0)

      for (const relativePath of touchPoint.paths) {
        const absolutePath = join(repoRoot, relativePath)
        const contents = readFileSync(absolutePath, 'utf8')

        switch (touchPoint.check) {
          case 'domain':
            expect(contents).toContain(domain)
            break
          case 'slug':
            expect(contents).toMatch(new RegExp(`\\b${workspaceSlug}\\b`, 'i'))
            break
          default:
            throw new Error(
              `Unknown touchpoint check '${touchPoint.check}' for ${relativePath}`,
            )
        }
      }
    }
  })
})
