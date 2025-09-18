import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { createMemoryRouter } from 'react-router-dom'
import { PublicRouter } from '../PublicRouter.jsx'

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

    expect(factory).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({
      basename: '/app',
      initialEntries: ['/app/dashboard'],
    }))
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
})
