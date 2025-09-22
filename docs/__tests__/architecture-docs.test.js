import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(__dirname, '..', '..')
const docsDir = resolve(repoRoot, 'docs')
const adrDir = resolve(docsDir, 'adr')

const readText = (absolutePath) => readFileSync(absolutePath, 'utf8')

describe('architecture documentation cross-linking', () => {
  it('seeds the ADR log with guidance and references to core docs', () => {
    const adrReadme = readText(resolve(adrDir, 'README.md'))

    expect(adrReadme).toMatch(/Architecture Decision Records/i)
    expect(adrReadme).toMatch(/NNNN-short-title\.md/)
    expect(adrReadme).toMatch(/\.\.\/SPEC\.md/)
    expect(adrReadme).toMatch(/\.\.\/PUBLISHING\.md/)
    expect(adrReadme).toMatch(/\.\.\/\.\.\/README\.md/)

    const adrEntries = readdirSync(adrDir).filter((file) => /^\d{4}-.+\.md$/.test(file))
    expect(adrEntries.length).toBeGreaterThan(0)

    const firstEntry = readText(resolve(adrDir, adrEntries.sort()[0]))
    expect(firstEntry).toMatch(/# ADR 0001/i)
    expect(firstEntry).toMatch(/\.\.\/SPEC\.md/)
    expect(firstEntry).toMatch(/\.\.\/PUBLISHING\.md/)
    expect(firstEntry).toMatch(/\.\.\/\.\.\/README\.md/)
  })

  it('links the README, SPEC, and publishing guide back to the ADR log', () => {
    const rootReadme = readText(resolve(repoRoot, 'README.md'))
    expect(rootReadme).toMatch(/\.\/docs\/SPEC\.md/)
    expect(rootReadme).toMatch(/\.\/docs\/PUBLISHING\.md/)
    expect(rootReadme).toMatch(/\.\/docs\/adr\/README\.md/)

    const spec = readText(resolve(docsDir, 'SPEC.md'))
    expect(spec).toMatch(/\.\/adr\/README\.md/)
    expect(spec).toMatch(/\.\/PUBLISHING\.md/)
    expect(spec).toMatch(/\.\.\/README\.md/)

    const publishing = readText(resolve(docsDir, 'PUBLISHING.md'))
    expect(publishing).toMatch(/\.\/SPEC\.md/)
    expect(publishing).toMatch(/\.\/adr\/README\.md/)
    expect(publishing).toMatch(/\.\.\/README\.md/)
  })
})
