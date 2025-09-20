import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, vi } from 'vitest'
import { createMemoryRouter, useLoaderData } from 'react-router-dom'
import { PublicRouter } from '../PublicRouter.jsx'

function LoaderEcho() {
  const data = useLoaderData()
  return <div>{typeof data === 'string' ? data : JSON.stringify(data)}</div>
}

const originalRequest = globalThis.Request

beforeAll(() => {
  if (typeof originalRequest !== 'function') {
    return
  }

  if (typeof AbortController === 'function') {
    try {
      const controller = new AbortController()
      // Attempt to construct a native Request; if it works we can keep it as-is.
      new originalRequest('http://localhost/', { signal: controller.signal })
      return
    } catch (error) {
      // Native Request is incompatible with the AbortSignal generated above.
    }
  }

  class RequestShim {
    constructor(resource, init = {}) {
      this.url = typeof resource === 'string' ? resource : resource?.url ?? ''
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

describe('PublicRouter', () => {
  it('renders the active route using the provided router factory', () => {
    render(
      <PublicRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/about'] }}
        routes={[
          { path: '/', element: <div>Home</div> },
          { path: '/about', element: <div>About</div> },
        ]}
        fallback={<div>Not found</div>}
      />,
    )

    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('renders the fallback element when no routes match', () => {
    render(
      <PublicRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        fallback={<div>404</div>}
      />,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders a default not-found experience when fallback is omitted', () => {
    render(
      <PublicRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
      />,
    )

    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go back home/i })).toHaveAttribute('href', '/')
  })

  it('allows customizing the generated fallback copy', () => {
    render(
      <PublicRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        defaultFallback={{
          title: 'Nicht gefunden',
          description: 'Bitte prüfen Sie die Adresse oder wählen Sie eine Option.',
          homeHref: '/start',
          homeLabel: 'Zur Startseite',
          supportHref: 'mailto:hallo@example.com',
          supportLabel: 'Support kontaktieren',
          lang: 'de',
        }}
      />,
    )

    const heading = screen.getByRole('heading', { name: /nicht gefunden/i })
    const container = heading.closest('section')
    expect(container).not.toBeNull()
    expect(container).toHaveAttribute('lang', 'de')
    expect(screen.getByText(/bitte prüfen sie/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /zur startseite/i })).toHaveAttribute('href', '/start')
    expect(screen.getByRole('link', { name: /support kontaktieren/i })).toHaveAttribute(
      'href',
      'mailto:hallo@example.com',
    )
  })

  it('passes basename and router options to the router factory', () => {
    const factory = vi.fn((routes, options) => createMemoryRouter(routes, { ...options }))

    render(
      <PublicRouter
        router={factory}
        basename="/app"
        routerOptions={{ initialEntries: ['/app/dashboard'] }}
        routes={[{ path: '/dashboard', element: <div>Dashboard</div> }]}
        fallback={<div>Not found</div>}
      />,
    )

    expect(factory).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        basename: '/app',
        initialEntries: ['/app/dashboard'],
      }),
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('wraps route elements when wrapElement is provided', () => {
    render(
      <PublicRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        wrapElement={(element) => <div data-testid="wrapper">{element}</div>}
      />,
    )

    expect(screen.getByTestId('wrapper')).toHaveTextContent('Home')
  })

  it('passes loader and action definitions to the router factory and resolves loader data', async () => {
    const loader = vi.fn(() => 'Loaded from loader')
    const action = vi.fn()
    const factory = vi.fn((routes, options) => createMemoryRouter(routes, { ...options }))

    render(
      <PublicRouter
        router={factory}
        routerOptions={{ initialEntries: ['/data'] }}
        routes={[{ path: '/data', element: <LoaderEcho />, loader, action }]}
      />,
    )

    await screen.findByText('Loaded from loader')

    expect(loader).toHaveBeenCalledTimes(1)
    const [routesArg] = factory.mock.calls[0]
    expect(routesArg[0].loader).toBe(loader)
    expect(routesArg[0].action).toBe(action)
  })
})
