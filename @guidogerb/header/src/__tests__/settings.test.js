import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_HEADER_SETTINGS,
  createHeaderSettings,
  getDefaultHeaderSettings,
  getHeaderSettings,
  resetHeaderSettings,
  setHeaderSettings,
  updateHeaderSettings,
} from '../settings.js'

describe('header settings store', () => {
  beforeEach(() => {
    resetHeaderSettings()
  })

  it('returns defensive copies of the defaults', () => {
    const defaults = getDefaultHeaderSettings()
    const current = getHeaderSettings()

    expect(current).toEqual(defaults)
    expect(current).not.toBe(defaults)

    current.brand.title = 'Mutated'
    current.primaryLinks.push({ label: 'Oops', href: '/oops' })

    const after = getHeaderSettings()
    expect(after.brand.title).toBe(DEFAULT_HEADER_SETTINGS.brand.title)
    expect(after.primaryLinks).toHaveLength(0)
  })

  it('merges nested structures without dropping defaults', () => {
    setHeaderSettings({
      brand: { title: 'PickleCheeze', tagline: 'Fermented delights', href: '/home' },
      primaryLinks: [
        { label: 'Home', href: '/' },
        { label: 'Docs', href: '/docs', external: true },
      ],
      actions: [
        { label: 'Start trial', href: '/start', variant: 'primary' },
        { label: 'Contact', href: '/contact', variant: 'secondary' },
      ],
      announcements: [
        { id: 'launch', message: 'Launching soon!', href: '/launch', tone: 'warning' },
      ],
      i18n: { currency: 'EUR' },
      showAuthControls: false,
      showTenantSwitcher: true,
    })

    const settings = getHeaderSettings()

    expect(settings.brand.title).toBe('PickleCheeze')
    expect(settings.brand.tagline).toBe('Fermented delights')
    expect(settings.brand.href).toBe('/home')
    expect(settings.brand.logoSrc).toBeNull()

    expect(settings.primaryLinks).toHaveLength(2)
    expect(settings.primaryLinks[1]).toMatchObject({ label: 'Docs', href: '/docs', external: true })

    expect(settings.actions).toEqual([
      { label: 'Start trial', href: '/start', external: false, variant: 'primary' },
      { label: 'Contact', href: '/contact', external: false, variant: 'secondary' },
    ])

    expect(settings.announcements).toEqual([
      { id: 'launch', message: 'Launching soon!', href: '/launch', tone: 'warning' },
    ])

    expect(settings.i18n).toEqual({
      ...DEFAULT_HEADER_SETTINGS.i18n,
      currency: 'EUR',
    })

    expect(settings.showAuthControls).toBe(false)
    expect(settings.showTenantSwitcher).toBe(true)
    expect(settings.showThemeToggle).toBe(DEFAULT_HEADER_SETTINGS.showThemeToggle)
  })

  it('updates settings via callback updaters', () => {
    updateHeaderSettings((current) => ({
      primaryLinks: [...current.primaryLinks, { label: 'Stories', href: '/stories' }],
      showThemeToggle: false,
    }))

    const settings = getHeaderSettings()

    expect(settings.primaryLinks).toHaveLength(1)
    expect(settings.primaryLinks[0]).toEqual({
      label: 'Stories',
      href: '/stories',
      external: false,
      children: [],
    })
    expect(settings.showThemeToggle).toBe(false)
  })

  it('creates normalized settings when overrides omit fields', () => {
    const base = createHeaderSettings({
      brand: { title: 'Base', href: '/base', tagline: 'Base tagline' },
      utilityLinks: [{ label: 'Support', href: '/support' }],
      actions: [{ label: 'Subscribe', href: '/subscribe', variant: 'primary' }],
      showAuthControls: false,
    })

    const merged = createHeaderSettings(
      {
        brand: { title: 'Override' },
        utilityLinks: [{ label: 'Docs', href: '/docs', external: false }],
      },
      base,
    )

    expect(merged.brand).toEqual({
      title: 'Override',
      href: '/base',
      tagline: 'Base tagline',
      logoSrc: null,
    })
    expect(merged.utilityLinks).toEqual([
      { label: 'Docs', href: '/docs', external: false, children: [] },
    ])
    expect(merged.actions).toEqual(base.actions)
    expect(merged.showAuthControls).toBe(false)
  })

  it('resets back to defaults', () => {
    setHeaderSettings({ brand: { title: 'Changed' } })
    const mutated = getHeaderSettings()
    expect(mutated.brand.title).toBe('Changed')

    resetHeaderSettings()
    expect(getHeaderSettings().brand.title).toBe(DEFAULT_HEADER_SETTINGS.brand.title)
  })
})
