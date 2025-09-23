import { describe, expect, it, vi } from 'vitest'
import {
  MARKETING_CONTENT_ENDPOINT,
  buildMarketingContentUrl,
  fetchMarketingContent,
  getDefaultMarketingContent,
  normalizeMarketingContent,
} from '../marketingContent.js'

describe('marketingContent helpers', () => {
  it('returns default marketing content when input is missing', () => {
    const normalized = normalizeMarketingContent()
    const defaults = getDefaultMarketingContent()

    expect(normalized).toEqual(defaults)
    expect(normalized.hero).not.toBe(defaults.hero)
  })

  it('merges hero and section overrides from CMS data', () => {
    const data = {
      hero: {
        eyebrow: 'Updated eyebrow',
        title: 'Updated title',
        lede: 'Updated lede',
        highlightsLabel: 'Updated metrics',
        highlights: [
          { label: '12', description: 'Updated highlight' },
          { value: '24', text: 'Another metric' },
        ],
      },
      platform: [
        {
          title: 'Automation',
          description: 'Automated flows',
          features: ['Workflow sync'],
        },
      ],
      newsletter: {
        title: 'CMS title',
        description: 'CMS description',
        formLabel: 'CMS form',
        buttonLabel: 'CMS CTA',
        placeholder: 'cms@example.com',
        inputLabel: 'CMS email label',
      },
    }

    const normalized = normalizeMarketingContent(data)

    expect(normalized.hero.eyebrow).toBe('Updated eyebrow')
    expect(normalized.hero.title).toBe('Updated title')
    expect(normalized.hero.lede).toBe('Updated lede')
    expect(normalized.hero.highlightsLabel).toBe('Updated metrics')
    expect(normalized.hero.highlights).toEqual([
      { label: '12', description: 'Updated highlight' },
      { label: '24', description: 'Another metric' },
    ])
    expect(normalized.platform[0]).toEqual({
      title: 'Automation',
      description: 'Automated flows',
      features: ['Workflow sync'],
    })
    expect(normalized.newsletter).toEqual({
      title: 'CMS title',
      description: 'CMS description',
      formLabel: 'CMS form',
      buttonLabel: 'CMS CTA',
      placeholder: 'cms@example.com',
      inputLabel: 'CMS email label',
    })
  })

  it('falls back to defaults when overrides are incomplete', () => {
    const normalized = normalizeMarketingContent({
      platform: [{}, null],
      distribution: [],
      resources: [{ heading: 'Docs' }],
      newsletter: { buttonLabel: '' },
    })

    const defaults = getDefaultMarketingContent()

    expect(normalized.platform).toEqual(defaults.platform)
    expect(normalized.distribution).toEqual(defaults.distribution)
    expect(normalized.resources[0].title).toBe('Docs')
    expect(normalized.newsletter.buttonLabel).toBe(defaults.newsletter.buttonLabel)
  })

  it('builds the marketing content URL with normalized slashes', () => {
    expect(buildMarketingContentUrl('https://api.example.com/')).toBe(
      `https://api.example.com${MARKETING_CONTENT_ENDPOINT}`,
    )
    expect(buildMarketingContentUrl('')).toBeNull()
  })

  it('uses defaults when no base URL is provided to fetchMarketingContent', async () => {
    const fetchSpy = vi.fn()

    const result = await fetchMarketingContent({ fetchImpl: fetchSpy })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result).toEqual(getDefaultMarketingContent())
  })

  it('fetches and normalizes marketing content when a base URL is provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          hero: { eyebrow: 'Eyebrow from CMS' },
          distribution: [{ title: 'CMS Distribution', description: 'Desc', items: ['Bullet'] }],
        }),
    })

    const result = await fetchMarketingContent({
      baseUrl: 'https://api.example.com',
      fetchImpl: fetchSpy,
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://api.example.com${MARKETING_CONTENT_ENDPOINT}`,
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    )
    expect(result.hero.eyebrow).toBe('Eyebrow from CMS')
    expect(result.distribution[0]).toEqual({
      title: 'CMS Distribution',
      description: 'Desc',
      features: ['Bullet'],
    })
  })
})
