// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import {
  buildMatrix,
  getTenantSecretName,
  getTenantSlug,
  loadTenantRegistry,
} from '../resolve-tenants.mjs'

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url))

describe('tenant slug derivation', () => {
  test('drops common TLDs for canonical slugs', () => {
    expect(getTenantSlug('garygerber.com')).toBe('garygerber')
    expect(getTenantSlug('this-is-my-story.org')).toBe('this-is-my-story')
  })

  test('preserves uncommon TLDs by including them in the slug', () => {
    expect(getTenantSlug('ggp.llc')).toBe('ggp-llc')
    expect(getTenantSlug('alpha.beta.coop')).toBe('alpha-beta-coop')
  })
})

describe('secret name derivation', () => {
  test('uppercases characters and replaces separators', () => {
    expect(getTenantSecretName('guidogerbpublishing.com')).toBe('GUIDOGERBPUBLISHING_COM_VITE_ENV')
    expect(getTenantSecretName('this-is-my-story.org')).toBe('THIS_IS_MY_STORY_ORG_VITE_ENV')
  })
})

describe('tenant registry discovery', () => {
  test('loads tenant metadata from the repository', () => {
    const tenants = loadTenantRegistry(repoRoot)
    expect(Array.isArray(tenants)).toBe(true)
    expect(tenants.length).toBeGreaterThan(0)

    const gary = tenants.find((tenant) => tenant.domain === 'garygerber.com')
    expect(gary).toBeTruthy()
    expect(gary.workspaceSlug).toBe('garygerber')
    expect(gary.workspacePackage).toBe('websites-garygerber')
    expect(gary.secretName).toBe('GARYGERBER_COM_VITE_ENV')
    expect(gary.workspaceDirectory).toBe('websites/garygerber.com')
    expect(typeof gary.distributionId).toBe('string')
    expect(gary.distributionId.length).toBeGreaterThan(0)
  })

  test('converts registry entries into a GitHub matrix payload', () => {
    const tenants = loadTenantRegistry(repoRoot)
    const matrix = buildMatrix(tenants)
    expect(matrix).toHaveProperty('include')
    expect(Array.isArray(matrix.include)).toBe(true)
    expect(matrix.include.length).toBe(tenants.length)

    const sample = matrix.include[0]
    expect(sample).toHaveProperty('domain')
    expect(sample).toHaveProperty('secretName')
    expect(sample).toHaveProperty('workspacePackage')
  })
})
