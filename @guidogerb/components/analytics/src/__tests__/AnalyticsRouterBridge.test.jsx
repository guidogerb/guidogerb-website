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
        }),
      )
    })
  })
})
