import { describe, expect, it } from 'vitest'

import { APP_VARIANT_SPECS, getAppVariantSpec, listAppVariantSpecs } from '../variantSpecs.js'
import { APP_SHELL_LAYOUT_BLUEPRINT, APP_SHELL_PROVIDER_BLUEPRINT } from '../App.jsx'

describe('APP_VARIANT_SPECS', () => {
  it('exposes base, analytics, and commerce variants', () => {
    expect(Object.keys(APP_VARIANT_SPECS)).toEqual(['basic', 'analytics', 'commerce'])
  })

  it('keeps variant specifications immutable', () => {
    const analytics = APP_VARIANT_SPECS.analytics
    const commerce = APP_VARIANT_SPECS.commerce

    expect(Object.isFrozen(analytics)).toBe(true)
    expect(Object.isFrozen(analytics.enhancements)).toBe(true)
    expect(Object.isFrozen(analytics.enhancements.providers)).toBe(true)
    expect(Object.isFrozen(commerce.operations.notes)).toBe(true)
  })

  it('describes analytics-focused defaults and routes', () => {
    const analytics = APP_VARIANT_SPECS.analytics
    const providerPackages = analytics.enhancements.providers.map((provider) => provider.package)
    const protectedPaths = analytics.enhancements.protectedRoutes.map((route) => route.path)

    expect(analytics.inheritsFrom).toBe('basic')
    expect(analytics.recommendedPackages).toEqual(
      expect.arrayContaining(['@guidogerb/components-analytics']),
    )
    expect(providerPackages).toContain('@guidogerb/components-analytics')
    expect(protectedPaths).toEqual(expect.arrayContaining(['/analytics', '/reports']))
    expect(analytics.operations.environment.join(' ')).toMatch(/GA4/i)
  })

  it('describes commerce-focused provider additions and storefront routes', () => {
    const commerce = APP_VARIANT_SPECS.commerce
    const providerPackages = commerce.enhancements.providers.map((provider) => provider.package)
    const publicPaths = commerce.enhancements.publicRoutes.map((route) => route.path)

    expect(commerce.recommendedPackages).toEqual(
      expect.arrayContaining([
        '@guidogerb/components-catalog',
        '@guidogerb/components-shopping-cart',
        '@guidogerb/components-point-of-sale',
      ]),
    )
    expect(providerPackages).toEqual(
      expect.arrayContaining([
        '@guidogerb/components-catalog',
        '@guidogerb/components-shopping-cart',
        '@guidogerb/components-point-of-sale',
      ]),
    )
    expect(publicPaths).toContain('/shop')
    expect(commerce.operations.environment.join(' ')).toMatch(/stripe/i)
  })

  it('reuses the shared provider blueprint ordering and layout regions', () => {
    const basic = APP_VARIANT_SPECS.basic

    expect(basic.blueprint.providerOrder).toEqual(APP_SHELL_PROVIDER_BLUEPRINT.order)
    expect(basic.blueprint.layoutRegions.map((region) => region.id)).toEqual(
      APP_SHELL_LAYOUT_BLUEPRINT.regions.map((region) => region.id),
    )
  })
})

describe('getAppVariantSpec', () => {
  it('returns the frozen spec for a known variant', () => {
    expect(getAppVariantSpec('analytics')).toBe(APP_VARIANT_SPECS.analytics)
  })

  it('returns null for unknown variants', () => {
    expect(getAppVariantSpec('unknown')).toBeNull()
  })
})

describe('listAppVariantSpecs', () => {
  it('returns the specs in declaration order', () => {
    const list = listAppVariantSpecs()
    expect(list.map((spec) => spec.id)).toEqual(['basic', 'analytics', 'commerce'])
  })
})
