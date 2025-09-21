import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRouter } from '../ProtectedRouter.jsx'

const guardSpy = vi.fn()

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: ({ children, label }) => {
    guardSpy(label)
    return (
      <div data-testid="default-guard" data-label={label}>
        {children}
      </div>
    )
  },
}))

describe('ProtectedRouter', () => {
  beforeEach(() => {
    guardSpy.mockClear()
  })

  it('wraps protected routes in the default guard', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/dashboard'] }}
        routes={[{ path: '/dashboard', element: <div>Dashboard</div> }]}
      />,
    )

    expect(screen.getByTestId('default-guard')).toHaveTextContent('Dashboard')
  })

  it('skips the guard for public routes and fallback by default', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/login'] }}
        routes={[{ path: '/login', element: <div>Login</div>, isProtected: false }]}
        fallback={<div>Missing</div>}
      />,
    )

    expect(screen.queryByTestId('default-guard')).not.toBeInTheDocument()
    expect(screen.getByText('Login')).toBeInTheDocument()
  })

  it('allows overriding the guard component and props', () => {
    const CustomGuard = ({ children, tone }) => (
      <div data-testid="custom-guard" data-tone={tone}>
        {children}
      </div>
    )

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/secure'] }}
        routes={[{ path: '/secure', element: <div>Secure</div> }]}
        guard={CustomGuard}
        guardProps={{ tone: 'warm' }}
      />,
    )

    expect(screen.getByTestId('custom-guard')).toHaveAttribute('data-tone', 'warm')
  })

  it('supports per-route guard configuration objects', () => {
    const ConfigurableGuard = ({ children, tone, badge }) => (
      <div data-testid="config-guard" data-tone={tone} data-badge={badge}>
        {children}
      </div>
    )

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/secure'] }}
        routes={[
          {
            path: '/secure',
            element: <div>Secure</div>,
            guard: { component: ConfigurableGuard, props: { tone: 'config', badge: 'config' } },
            guardProps: { tone: 'route' },
          },
        ]}
        guardProps={{ tone: 'global', badge: 'global' }}
      />,
    )

    expect(screen.queryByTestId('default-guard')).not.toBeInTheDocument()
    const guard = screen.getByTestId('config-guard')
    expect(guard).toHaveAttribute('data-tone', 'route')
    expect(guard).toHaveAttribute('data-badge', 'config')
  })

  it('allows disabling guards from route configuration objects', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/public'] }}
        routes={[{ path: '/public', element: <div>Public</div>, guard: { disabled: true } }]}
      />,
    )

    expect(screen.getByText('Public')).toBeInTheDocument()
    expect(screen.queryByTestId('default-guard')).not.toBeInTheDocument()
  })

  it('supports additional wrapping via the wrapElement prop', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        wrapElement={(element) => <div data-testid="decorator">{element}</div>}
      />,
    )

    expect(screen.getByTestId('decorator')).toBeInTheDocument()
    expect(screen.getByTestId('default-guard')).toHaveTextContent('Home')
  })

  it('guards the fallback route when requested', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        fallback={<div>Missing</div>}
        protectFallback
      />,
    )

    expect(screen.getByTestId('default-guard')).toHaveTextContent('Missing')
  })

  it('renders fallback content for guests when fallback remains public', () => {
    const StatefulGuard = ({ children, isAuthenticated }) => (
      <div data-testid="stateful-guard" data-state={isAuthenticated ? 'authenticated' : 'guest'}>
        {children}
      </div>
    )

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        guard={StatefulGuard}
        guardProps={{ isAuthenticated: false }}
        fallback={<div role="status">Missing</div>}
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Missing')
    expect(screen.queryByTestId('stateful-guard')).not.toBeInTheDocument()
  })

  it('wraps fallback routes with guard state when protection is enabled', () => {
    const StatefulGuard = ({ children, isAuthenticated }) => (
      <div data-testid="stateful-guard" data-state={isAuthenticated ? 'authenticated' : 'guest'}>
        {children}
      </div>
    )

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        guard={StatefulGuard}
        guardProps={{ isAuthenticated: true }}
        fallback={<div role="status">Missing</div>}
        protectFallback
      />,
    )

    const guard = screen.getByTestId('stateful-guard')
    expect(guard).toHaveAttribute('data-state', 'authenticated')
    expect(guard).toHaveTextContent('Missing')
  })

  it('respects defaultFallback overrides when generating a catch-all route', () => {
    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        defaultFallback={{
          title: 'Hola',
          description: 'No encontramos la página solicitada.',
          homeHref: '/inicio',
          homeLabel: 'Volver al inicio',
        }}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Hola' })).toBeInTheDocument()
    expect(screen.getByText('No encontramos la página solicitada.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/inicio',
    )
    expect(screen.queryByTestId('default-guard')).not.toBeInTheDocument()
  })
})
