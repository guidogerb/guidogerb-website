import { render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseAuth = vi.fn()
const mockUseAnalytics = vi.fn()

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}))

vi.mock('@guidogerb/components-analytics', () => ({
  __esModule: true,
  useAnalytics: mockUseAnalytics,
}))

vi.mock('@guidogerb/components-router-public', () => ({
  __esModule: true,
  PublicRouter: ({ routes = [], defaultFallback, routerOptions }) => {
    const path = routerOptions?.initialEntries?.[0] ?? '/'
    const match = routes.find((route) => route.path === path)
    if (match?.element) {
      return match.element
    }

    if (!defaultFallback) {
      return null
    }

    const {
      title = 'Page unavailable',
      description = 'Check the address and try again.',
      primaryAction,
      secondaryAction,
    } = defaultFallback

    return (
      <section role="alert" aria-live="polite">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
          <nav aria-label="Suggested destinations">
            {primaryAction ? (
              <a href={primaryAction.href ?? '#'}>{primaryAction.label ?? 'Return home'}</a>
            ) : null}
            {secondaryAction ? (
              <a href={secondaryAction.href ?? '#'}>{secondaryAction.label ?? 'Secondary link'}</a>
            ) : null}
          </nav>
        </div>
      </section>
    )
  },
}))

const originalRequest = globalThis.Request

beforeAll(() => {
  if (typeof originalRequest !== 'function') return

  if (typeof AbortController === 'function') {
    try {
      const controller = new AbortController()
      // Attempt to construct a native Request; if it works we can keep it as-is.
      new originalRequest('http://localhost/', { signal: controller.signal })
      return
    } catch {
      // Native Request is incompatible with the AbortSignal generated above.
    }
  }

  class RequestShim {
    constructor(resource, init = {}) {
      this.url = typeof resource === 'string' ? resource : (resource?.url ?? '')
      this.method = init.method ?? 'GET'
      this.signal = init.signal ?? null
      if (init.headers) {
        this.headers = init.headers
      } else if (typeof Headers === 'function') {
        this.headers = new Headers()
      } else {
        this.headers = new Map()
      }
    }

    clone() {
      return new RequestShim(this.url, {
        method: this.method,
        signal: this.signal,
        headers: this.headers,
      })
    }
  }

  globalThis.Request = RequestShim
})

afterAll(() => {
  globalThis.Request = originalRequest
})

async function renderApp(initialEntries = ['/']) {
  const module = await import('../App.jsx')
  const App = module.default
  return render(<App routerOptions={{ initialEntries }} />)
}

beforeEach(() => {
  vi.resetModules()
  mockUseAuth.mockReset()
  mockUseAnalytics.mockReset()
  mockUseAuth.mockReturnValue({ isAuthenticated: false })
  mockUseAnalytics.mockReturnValue({ trackEvent: vi.fn() })
})

describe('Stream4Cloud marketing app', () => {
  it('presents marketing copy and calls to action on the landing route', async () => {
    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /stream4cloud orchestrates your live control room/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /book a control room tour/i })).toHaveAttribute(
      'href',
      expect.stringContaining('calendly.com/stream4cloud'),
    )

    expect(screen.getByText('Global PoPs')).toBeInTheDocument()
    expect(screen.getByText(/zero-touch ad breaks/i)).toBeInTheDocument()

    const workflow = screen
      .getByRole('heading', {
        level: 2,
        name: /broadcast workflow built for teams/i,
      })
      .closest('section')

    expect(workflow).not.toBeNull()
    const workflowQueries = within(workflow ?? document.body)
    expect(
      workflowQueries.getByRole('heading', { level: 3, name: /control room orchestration/i }),
    ).toBeInTheDocument()
    expect(
      workflowQueries.getByRole('heading', { level: 3, name: /monetization and insights/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { level: 2, name: /partner success hub preview/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /partner hub/i })).toHaveAttribute('href', '#partner')
    expect(
      screen.getByRole('heading', { level: 2, name: /broadcast partner outcomes/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Plan your next premiere' })).toHaveAttribute(
      'href',
      'https://stream4cloud.com/launch',
    )
    expect(
      screen.getByRole('heading', { level: 3, name: /signal uptime commitments/i }),
    ).toBeInTheDocument()
  })

  it('serves an offline landing route with reconnect guidance', async () => {
    await renderApp(['/offline'])

    expect(screen.getByRole('heading', { level: 1, name: /you.?re offline/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /return to stream4cloud home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('links to the offline help center from the generated fallback', async () => {
    await renderApp(['/missing'])

    expect(
      screen.getByRole('heading', { level: 1, name: /stream4cloud page unavailable/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open offline support/i })).toHaveAttribute(
      'href',
      '/offline',
    )
  })
})
