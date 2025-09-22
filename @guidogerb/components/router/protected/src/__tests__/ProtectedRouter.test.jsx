import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ProtectedRouter } from '../ProtectedRouter.jsx'

const guardSpy = vi.fn()
const authState = { isAuthenticated: true, error: null }

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: ({ children, label }) => {
    guardSpy(label)

    if (authState.error) {
      return (
        <div data-testid="default-guard-error" data-label={label}>
          Sign-in failed: {authState.error.message}
        </div>
      )
    }

    if (!authState.isAuthenticated) {
      return (
        <div data-testid="default-guard-loading" data-label={label}>
          Protected Loading...
        </div>
      )
    }

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
    authState.isAuthenticated = true
    authState.error = null
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

  it('leaves fallback content public while authentication is pending', () => {
    authState.isAuthenticated = false

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        fallback={<div>Missing</div>}
      />,
    )

    expect(screen.getByText('Missing')).toBeInTheDocument()
    expect(screen.queryByTestId('default-guard-loading')).not.toBeInTheDocument()
    expect(screen.queryByTestId('default-guard')).not.toBeInTheDocument()
  })

  it('shows the guard loading state when protecting fallbacks during sign-in', () => {
    authState.isAuthenticated = false

    render(
      <ProtectedRouter
        router={createMemoryRouter}
        routerOptions={{ initialEntries: ['/missing'] }}
        routes={[{ path: '/', element: <div>Home</div> }]}
        fallback={<div>Missing</div>}
        protectFallback
      />,
    )

    expect(screen.getByTestId('default-guard-loading')).toHaveTextContent('Protected Loading...')
    expect(screen.queryByText('Missing')).not.toBeInTheDocument()
  })
})
