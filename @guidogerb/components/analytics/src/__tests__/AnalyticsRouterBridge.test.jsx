import { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'

import Analytics from '../Analytics.jsx'
import { AnalyticsRouterBridge } from '../AnalyticsRouterBridge.jsx'

function NavigateOnMount({ to }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(to)
  }, [navigate, to])

  return null
}

describe('AnalyticsRouterBridge', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    delete window.dataLayer
    delete window.gtag
    document.title = 'Guidogerb Test'
  })

  it('dispatches page views when the router navigates', async () => {
    render(
      <Analytics measurementId="G-ROUTER" sendPageView={false}>
        <MemoryRouter initialEntries={['/']}>
          <AnalyticsRouterBridge />
          <Routes>
            <Route path="/" element={<NavigateOnMount to="/about?ref=spec" />} />
            <Route path="/about" element={<div>About</div>} />
          </Routes>
        </MemoryRouter>
      </Analytics>,
    )

    await waitFor(() => {
      const entry = window.dataLayer?.find(
        (event) =>
          event[0] === 'event' &&
          event[1] === 'page_view' &&
          event[2]?.page_path === '/about?ref=spec',
      )
      expect(entry).toBeDefined()
      expect(entry?.[2]?.page_referrer).toBe('/')
    })
  })

  it('records the initial location when trackInitialPageView is enabled', async () => {
    document.title = 'Landing page'

    render(
      <Analytics measurementId="G-ROUTER-INITIAL" sendPageView={false}>
        <MemoryRouter initialEntries={['/welcome']}>
          <AnalyticsRouterBridge trackInitialPageView />
        </MemoryRouter>
      </Analytics>,
    )

    await waitFor(() => {
      const entry = window.dataLayer?.find(
        (event) =>
          event[0] === 'event' && event[1] === 'page_view' && event[2]?.page_path === '/welcome',
      )
      expect(entry).toBeDefined()
      expect(entry?.[2]).toMatchObject({ page_title: 'Landing page' })
    })
  })

  it('supports custom path builders and tracking callbacks', async () => {
    const onTrack = vi.fn()

    render(
      <Analytics measurementId="G-ROUTER-CUSTOM" sendPageView={false}>
        <MemoryRouter initialEntries={['/']}>
          <AnalyticsRouterBridge
            getPath={({ location }) => location.pathname}
            getParams={({ location }) => ({ page_title: `Viewing ${location.pathname}` })}
            onTrack={onTrack}
          />
          <Routes>
            <Route path="/" element={<NavigateOnMount to="/products/123" />} />
            <Route path="/products/:id" element={<div>Product</div>} />
          </Routes>
        </MemoryRouter>
      </Analytics>,
    )

    await waitFor(() => {
      expect(onTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/products/123',
          params: expect.objectContaining({ page_title: 'Viewing /products/123' }),
          previousPath: '/',
        }),
      )
    })
  })

  it('allows customizing or disabling referrer tracking', async () => {
    const customReferrer = vi.fn(({ previousPath }) => `custom:${previousPath ?? 'none'}`)

    render(
      <Analytics measurementId="G-ROUTER-REF" sendPageView={false}>
        <MemoryRouter initialEntries={['/landing']}>
          <AnalyticsRouterBridge getReferrer={customReferrer} />
          <Routes>
            <Route path="/landing" element={<NavigateOnMount to="/docs" />} />
            <Route path="/docs" element={<NavigateOnMount to="/docs/api" />} />
            <Route path="/docs/api" element={<div>Docs</div>} />
          </Routes>
        </MemoryRouter>
      </Analytics>,
    )

    await waitFor(() => {
      const entries = window.dataLayer?.filter(
        (event) => event[0] === 'event' && event[1] === 'page_view',
      )
      expect(entries?.length).toBeGreaterThanOrEqual(2)
    })

    const lastEntry = window.dataLayer
      ?.filter((event) => event[0] === 'event' && event[1] === 'page_view')
      .pop()

    expect(lastEntry?.[2]?.page_referrer).toBe('custom:/docs')
    expect(customReferrer).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/docs/api', previousPath: '/docs' }),
    )

    window.dataLayer = []

    render(
      <Analytics measurementId="G-ROUTER-REF-OFF" sendPageView={false}>
        <MemoryRouter initialEntries={['/landing']}>
          <AnalyticsRouterBridge includeReferrer={false} />
          <Routes>
            <Route path="/landing" element={<NavigateOnMount to="/settings" />} />
            <Route path="/settings" element={<div>Settings</div>} />
          </Routes>
        </MemoryRouter>
      </Analytics>,
    )

    await waitFor(() => {
      const entry = window.dataLayer?.find(
        (event) => event[0] === 'event' && event[1] === 'page_view',
      )
      expect(entry?.[2]?.page_referrer).toBeUndefined()
    })
  })
})
