import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createProtectedRouteObjects } from '../createProtectedRouteObjects.jsx'

const guardSpy = vi.fn()

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    guardSpy(props)
    return (
      <div data-testid="guard" {...props}>
        {children}
      </div>
    )
  },
}))

describe('createProtectedRouteObjects', () => {
  beforeEach(() => {
    guardSpy.mockClear()
  })

  it('wraps protected routes with the configured guard', () => {
    const routes = createProtectedRouteObjects([{ path: '/', element: <div>Home</div> }])

    render(routes[0].element)
    expect(screen.getByTestId('guard')).toHaveTextContent('Home')
  })

  it('skips guarding routes marked as public', () => {
    const routes = createProtectedRouteObjects([
      { path: '/', element: <div>Home</div>, isProtected: false },
    ])

    render(routes[0].element)
    expect(screen.queryByTestId('guard')).not.toBeInTheDocument()
  })

  it('respects fallback guard preference', () => {
    const routes = createProtectedRouteObjects([{ path: '/', element: <div>Home</div> }], {
      fallback: <div>Not found</div>,
    })

    expect(routes).toHaveLength(2)

    render(routes[1].element)
    expect(screen.queryByTestId('guard')).not.toBeInTheDocument()

    const guardedFallback = createProtectedRouteObjects([{ path: '/', element: <div>Home</div> }], {
      fallback: <div>Not found</div>,
      protectFallback: true,
    })

    render(guardedFallback[1].element)
    expect(screen.getByTestId('guard')).toHaveTextContent('Not found')
  })

  it('merges global and route-specific guard props', () => {
    const CustomGuard = ({ children, label }) => (
      <div data-testid="custom-guard">
        {label || 'none'}- {children}
      </div>
    )

    const routes = createProtectedRouteObjects(
      [{ path: '/', element: <div>Home</div>, guard: CustomGuard, guardProps: { label: 'route' } }],
      { guardProps: { label: 'global' } },
    )

    render(routes[0].element)
    expect(screen.getByTestId('custom-guard')).toHaveTextContent('route- Home')
  })

  it('delegates to wrapElement after guarding the element', () => {
    const wrapElement = vi.fn((element, route) => (
      <div data-testid="wrapped" data-path={route.path}>
        {element}
      </div>
    ))

    const routes = createProtectedRouteObjects([{ path: '/', element: <div>Home</div> }], {
      wrapElement,
    })

    render(routes[0].element)

    expect(routes).toHaveLength(2)
    expect(wrapElement).toHaveBeenCalledTimes(2)

    const routeCall = wrapElement.mock.calls.find(([, meta]) => meta.path === '/')
    const fallbackCall = wrapElement.mock.calls.find(([, meta]) => meta.isFallback)

    expect(routeCall).toBeDefined()
    expect(fallbackCall).toBeDefined()
    expect(routeCall?.[1]).toMatchObject({ path: '/', isFallback: false })
    expect(fallbackCall?.[1]).toMatchObject({ path: '*', isFallback: true })
    const [elementArg] = routeCall
    expect(screen.getByTestId('guard')).toBeInTheDocument()
    expect(screen.getByTestId('wrapped')).toHaveAttribute('data-path', '/')
    expect(screen.getByTestId('wrapped')).toHaveTextContent('Home')
  })

  it('allows disabling the generated fallback route', () => {
    const routes = createProtectedRouteObjects(
      [{ path: '/', element: <div>Home</div> }],
      { defaultFallback: false },
    )

    expect(routes).toHaveLength(1)
  })

  it('supports customizing the generated fallback copy', () => {
    const routes = createProtectedRouteObjects(
      [{ path: '/', element: <div>Home</div> }],
      {
        defaultFallback: {
          title: 'Hola',
          homeLabel: 'Inicio',
          homeHref: '/inicio',
        },
      },
    )

    expect(routes).toHaveLength(2)
    const fallback = routes[1]
    expect(fallback.element.props.title).toBe('Hola')
    expect(fallback.element.props.primaryAction).toMatchObject({ href: '/inicio', label: 'Inicio' })
  })
})
