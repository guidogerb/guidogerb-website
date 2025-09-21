import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import Analytics, { useAnalytics } from '../Analytics.jsx'

describe('Analytics', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete window.dataLayer
    delete window.gtag
  })

  it('injects the GA script and configures gtag defaults', () => {
    render(<Analytics measurementId="G-UNITTEST" />)

    const script = document.querySelector('script[data-gg-analytics-loader="G-UNITTEST"]')
    expect(script).not.toBeNull()
    expect(script.async).toBe(true)
    expect(script.src).toContain('https://www.googletagmanager.com/gtag/js?id=G-UNITTEST')

    expect(window.dataLayer).toBeDefined()
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        ['js', expect.any(Date)],
        ['config', 'G-UNITTEST'],
      ]),
    )
  })

  it('merges config overrides, debug mode, and sendPageView options', () => {
    render(
      <Analytics
        measurementId="G-CONFIG"
        debugMode
        sendPageView={false}
        config={{ allow_ad_personalization_signals: false }}
      />,
    )

    const configEntry = window.dataLayer.find(
      (entry) => entry[0] === 'config' && entry[1] === 'G-CONFIG',
    )
    expect(configEntry).toBeDefined()
    expect(configEntry[2]).toMatchObject({
      allow_ad_personalization_signals: false,
      debug_mode: true,
      send_page_view: false,
    })
  })

  it('applies default consent settings before configuration', () => {
    render(
      <Analytics
        measurementId="G-CONSENT"
        defaultConsent={{ ad_storage: 'denied', analytics_storage: 'granted' }}
      />,
    )

    const consentIndex = window.dataLayer.findIndex((entry) => entry[0] === 'consent')
    const configIndex = window.dataLayer.findIndex(
      (entry) => entry[0] === 'config' && entry[1] === 'G-CONSENT',
    )

    expect(consentIndex).toBeGreaterThan(-1)
    expect(configIndex).toBeGreaterThan(-1)
    expect(consentIndex).toBeLessThan(configIndex)
    expect(window.dataLayer[consentIndex]).toEqual([
      'consent',
      'default',
      { ad_storage: 'denied', analytics_storage: 'granted' },
    ])
  })

  it('exposes helper methods through the analytics context', async () => {
    function Tracker() {
      const analytics = useAnalytics()

      useEffect(() => {
        analytics.trackEvent('test_event', { value: 1 })
        analytics.pageView('/demo', { title: 'Demo' })
        analytics.setUserProperties({ theme: 'dark' })
        analytics.setUserId('user-123')
        analytics.consent('update', { ad_storage: 'granted' })
      }, [analytics])

      return null
    }

    render(
      <Analytics measurementId="G-CONTEXT">
        <Tracker />
      </Analytics>,
    )

    await waitFor(() => {
      const eventEntry = window.dataLayer.find(
        (entry) => entry[0] === 'event' && entry[1] === 'test_event',
      )
      expect(eventEntry).toBeDefined()
    })

    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        ['event', 'test_event', { value: 1 }],
        ['event', 'page_view', { page_path: '/demo', title: 'Demo' }],
        ['set', 'user_properties', { theme: 'dark' }],
        ['set', { user_id: 'user-123' }],
        ['consent', 'update', { ad_storage: 'granted' }],
      ]),
    )
  })

  it('tracks consent events and exposes history helpers', async () => {
    const consentCallback = vi.fn()
    const consentListener = vi.fn()
    let historySnapshot = []
    let lastEvent = null

    function Tracker() {
      const analytics = useAnalytics()

      useEffect(() => {
        const unsubscribe = analytics.subscribeToConsent(consentListener)
        const timer = setTimeout(() => {
          analytics.consent('update', { ad_storage: 'denied' })
          historySnapshot = analytics.getConsentHistory()
          lastEvent = analytics.getLastConsentEvent()
        }, 0)
        return () => {
          clearTimeout(timer)
          unsubscribe()
        }
      }, [analytics])

      return null
    }

    render(
      <Analytics
        measurementId="G-CONSENT-TRACKING"
        defaultConsent={{ ad_storage: 'granted' }}
        onConsentEvent={consentCallback}
      >
        <Tracker />
      </Analytics>,
    )

    await waitFor(() => {
      expect(consentCallback).toHaveBeenCalledTimes(2)
    })

    const events = consentCallback.mock.calls.map(([event]) => event)
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'default',
          mode: 'default',
          settings: { ad_storage: 'granted' },
        }),
        expect.objectContaining({
          type: 'update',
          mode: 'update',
          settings: { ad_storage: 'denied' },
        }),
      ]),
    )

    await waitFor(() => {
      expect(historySnapshot).toHaveLength(2)
    })

    expect(consentListener).toHaveBeenCalledTimes(2)
    expect(historySnapshot.some((event) => event.type === 'default')).toBe(true)
    expect(lastEvent).toMatchObject({ type: 'update', mode: 'update' })
  })

  it('avoids duplicating default consent events across re-renders', async () => {
    const initialCallback = vi.fn()
    const rerenderCallback = vi.fn()

    const { rerender } = render(
      <Analytics
        measurementId="G-CONSENT-ONCE"
        defaultConsent={{ analytics_storage: 'granted' }}
        onConsentEvent={initialCallback}
      />,
    )

    await waitFor(() => {
      expect(initialCallback).toHaveBeenCalledTimes(1)
    })

    rerender(
      <Analytics
        measurementId="G-CONSENT-ONCE"
        defaultConsent={{ analytics_storage: 'granted' }}
        onConsentEvent={rerenderCallback}
      >
        <ConsentUpdater />
      </Analytics>,
    )

    await waitFor(() => {
      expect(initialCallback).toHaveBeenCalledTimes(1)
      expect(rerenderCallback).toHaveBeenCalledTimes(1)
      expect(rerenderCallback.mock.calls[0][0]).toMatchObject({ type: 'update' })
    })
  })

  it('gracefully no-ops when the measurement id is missing', () => {
    render(<Analytics measurementId={null} />)

    expect(document.querySelector('script[data-gg-analytics-loader]')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })

  it('reuses an existing loader script between renders', () => {
    const { rerender } = render(<Analytics measurementId="G-DEDUP" />)

    rerender(<Analytics measurementId="G-DEDUP" />)

    const scripts = document.querySelectorAll('script[data-gg-analytics-loader="G-DEDUP"]')
    expect(scripts).toHaveLength(1)
  })
})

function ConsentUpdater() {
  const analytics = useAnalytics()

  useEffect(() => {
    analytics.consent('update', { analytics_storage: 'denied' })
  }, [analytics])

  return null
}
