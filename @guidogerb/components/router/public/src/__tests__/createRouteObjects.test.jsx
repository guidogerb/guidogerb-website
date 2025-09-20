import { describe, expect, it, vi } from 'vitest'
import { createRouteObjects } from '../createRouteObjects.jsx'
import { Navigate } from 'react-router-dom'

describe('createRouteObjects', () => {
  it('normalizes nested route definitions', () => {
    const routes = createRouteObjects([
      {
        path: '/',
        element: <div>Home</div>,
        children: [
          {
            index: true,
            element: <div>Index</div>,
          },
          {
            path: 'about',
            redirectTo: '/company',
          },
        ],
      },
    ])

    expect(routes).toHaveLength(2)
    expect(routes[0].path).toBe('/')
    expect(routes[0].children).toHaveLength(2)
    expect(routes[0].children[0]).toMatchObject({ index: true })
    expect(routes[0].children[1].element.type).toBe(Navigate)
    expect(routes[1].element.type.displayName).toBe('DefaultPublicRouterFallback')
  })

  it('generates a default fallback route when none is provided', () => {
    const routes = createRouteObjects([{ path: '/', element: <div>Home</div> }])

    expect(routes).toHaveLength(2)
    const fallback = routes[1]
    expect(fallback.path).toBe('*')
    expect(fallback.element.type.displayName).toBe('DefaultPublicRouterFallback')
    expect(fallback.element.props.title).toBe('Page not found')
    expect(fallback.element.props.primaryAction).toMatchObject({ href: '/', label: 'Go back home' })
  })

  it('supports disabling the generated fallback route', () => {
    const routes = createRouteObjects([{ path: '/', element: <div>Home</div> }], {
      defaultFallback: false,
    })

    expect(routes).toHaveLength(1)
  })

  it('allows customizing the generated fallback copy and locale', () => {
    const routes = createRouteObjects([{ path: '/', element: <div>Home</div> }], {
      defaultFallback: {
        title: 'Nicht gefunden',
        description: 'Bitte prüfen Sie die Adresse oder wählen Sie eine Option unten.',
        homeHref: '/start',
        homeLabel: 'Zur Startseite',
        supportHref: 'mailto:hallo@example.com',
        supportLabel: 'Support kontaktieren',
        lang: 'de',
        className: 'custom-fallback',
      },
    })

    expect(routes).toHaveLength(2)
    const fallback = routes[1]
    expect(fallback.element.props.lang).toBe('de')
    expect(fallback.element.props.className).toContain('custom-fallback')
    expect(fallback.element.props.title).toBe('Nicht gefunden')
    expect(fallback.element.props.description).toMatch(/bitte prüfen sie/i)
    expect(fallback.element.props.primaryAction).toMatchObject({
      href: '/start',
      label: 'Zur Startseite',
    })
    expect(fallback.element.props.secondaryAction).toMatchObject({
      href: 'mailto:hallo@example.com',
      label: 'Support kontaktieren',
    })
  })

  it('preserves loader and action definitions on route objects', () => {
    const loader = vi.fn()
    const action = vi.fn()
    const handle = { breadcrumb: 'Data route' }
    const routes = createRouteObjects([
      {
        path: '/data',
        element: <div>Data</div>,
        loader,
        action,
        handle,
        shouldRevalidate: () => true,
      },
    ])

    expect(routes[0]).toMatchObject({ loader, action, handle })
    expect(routes[0].shouldRevalidate).toBeInstanceOf(Function)
    expect(routes[0].shouldRevalidate()).toBe(true)
  })

  it('propagates data API options to the generated fallback route', () => {
    const loader = vi.fn(() => ({ status: 'missing' }))
    const action = vi.fn()
    const fallbackRoutes = createRouteObjects(
      [{ path: '/', element: <div>Home</div> }],
      {
        defaultFallback: {
          loader,
          action,
          handle: { from: '404' },
          errorElement: <div>Fallback error</div>,
          shouldRevalidate: () => false,
          hasErrorBoundary: true,
          id: 'fallback',
          caseSensitive: true,
          path: '/*',
        },
      },
    )

    expect(fallbackRoutes).toHaveLength(2)
    const fallback = fallbackRoutes[1]
    expect(fallback).toMatchObject({
      path: '/*',
      loader,
      action,
      handle: { from: '404' },
      hasErrorBoundary: true,
      id: 'fallback',
      caseSensitive: true,
    })
    expect(fallback.errorElement).toBeTruthy()
    expect(fallback.shouldRevalidate?.()).toBe(false)
  })

  it('invokes wrapElement for each route including fallback', () => {
    const wrapElement = vi.fn((element) => element)
    const routes = createRouteObjects(
      [
        {
          path: '/',
          element: <div>Home</div>,
        },
      ],
      { fallback: <div>Not found</div>, wrapElement },
    )

    expect(routes).toHaveLength(2)
    expect(wrapElement).toHaveBeenCalledTimes(2)
    const fallbackCall = wrapElement.mock.calls[1]
    expect(fallbackCall[1]).toMatchObject({ isFallback: true })
  })

  it('throws when fallback definition is missing an element', () => {
    expect(() => createRouteObjects([], { fallback: { path: '*', loader: () => null } })).toThrow(
      /Fallback routes must include an element/,
    )
  })
})
