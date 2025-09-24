// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

describe('AddCF-Tenant runbook', () => {
  test('documents the operator workflow and guardrails', async () => {
    const runbookPath = join(repoRoot, 'infra/ps1/AddCF-Tenant.runbook.md')
    const contents = await readFile(runbookPath, 'utf8')

    expect(contents).toMatch(/## Prerequisites/)
    expect(contents).toMatch(/PowerShell 7\.4\+/)
    expect(contents).toMatch(/AWS CLI v2/)
    expect(contents).toMatch(/pnpm clean\s+pnpm install\s+pnpm build\s+pnpm lint\s+pnpm format/)
    expect(contents).toMatch(/## IAM access/)
    expect(contents).toMatch(/cloudfront:ListDistributions/)
    expect(contents).toMatch(/cloudfront:GetDistribution/)
    expect(contents).toMatch(/AddCF-Tenant\.ps1/)
    expect(contents).toMatch(/-ValidateOnly/)
    expect(contents).toMatch(/-RepoRoot/)
    expect(contents).toMatch(/## Generated assets/)
    expect(contents).toMatch(/cf-distributions\.json/)
    expect(contents).toMatch(/sync-sites\.sh/)
    expect(contents).toMatch(/cloudfront\/nginx\.conf/)
    expect(contents).toMatch(/s3\/nginx\.conf/)
    expect(contents).toMatch(/## Cleanup and rollback/)
    expect(contents).toMatch(/git restore/)
    expect(contents).toMatch(/git clean -fd websites/)
  })
})
