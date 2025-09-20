import { cleanup, render, screen } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { AppBasic, useAppApiClient } from '../App.jsx'

const mocks = vi.hoisted(() => {
  return {
    authProvider: vi.fn(({ children, ...rest }) => (
      <div data-testid="auth-provider" data-auth-props={JSON.stringify(rest)}>
        {children}
      </div>
    )),
    authComponent: vi.fn(({ children, ...rest }) => (
      <div data-testid="auth-wrapper" data-auth={JSON.stringify(rest)}>
        {children}
      </div>
    )),
    useAuth: vi.fn(() => ({ isAuthenticated: true })),
    registerSW: vi.fn(),
    createClient: vi.fn(() => ({ id: 'generated-client' })),
  }
})

vi.mock('@guidogerb/components-api', () => ({
  __esModule: true,
  createClient: (...args) => mocks.createClient(...args),
  ApiError: class ApiError extends Error {},
  createApi: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  AuthProvider: (props) => mocks.authProvider(props),
  default: (props) => mocks.authProvider(props),
  Auth: (props) => mocks.authComponent(props),
  useAuth: () => mocks.useAuth(),
}))

vi.mock('@guidogerb/components-sw', () => ({
  __esModule: true,
  registerSW: (opts) => mocks.registerSW(opts),
  unregisterSW: vi.fn(),
}))

describe('AppBasic', () => {
  beforeEach(() => {
    mocks.authProvider.mockClear()
    mocks.authComponent.mockClear()
    mocks.useAuth.mockReturnValue({ isAuthenticated: true })
    mocks.registerSW.mockClear()
    mocks.createClient.mockClear()
    window.history.replaceState({}, '', '/')
  })

  it('renders the default marketing shell and shared chrome', async () => {
    render(<AppBasic />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /dashboard/i })).not.toHaveLength(0)
    expect(
      await screen.findByRole('heading', {
        name: /launch multi-tenant experiences without boilerplate/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(mocks.registerSW).toHaveBeenCalledWith({ url: '/sw.js' })
  })

  it('renders protected content when navigating to the dashboard', async () => {
    window.history.replaceState({}, '', '/dashboard')

    render(<AppBasic />)

    expect(
      await screen.findByRole('heading', { name: /dashboard overview/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/replace this placeholder/i)).toBeInTheDocument()
  })

  it('renders the default fallback for unknown routes', async () => {
    window.history.replaceState({}, '', '/missing')

    render(<AppBasic />)

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(
      screen.getByText(/we could not locate the requested page/i),
    ).toBeInTheDocument()
  })

  it('normalises auth configuration and forwards logout URI to the guard', async () => {
    window.history.replaceState({}, '', '/dashboard')

    render(
      <AppBasic
        auth={{
          clientId: 'custom-client',
          redirectUri: 'https://tenant.example/auth/callback',
          postLogoutRedirectUri: 'https://tenant.example/auth/logout',
        }}
      />,
    )

    expect(await screen.findByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument()

    const authProviderArgs = mocks.authProvider.mock.calls[0]?.[0] ?? {}
    expect(authProviderArgs.client_id).toBe('custom-client')
    expect(authProviderArgs.redirect_uri).toBe('https://tenant.example/auth/callback')
    expect(authProviderArgs.post_logout_redirect_uri).toBe('https://tenant.example/auth/logout')

    const authWrapperArgs = mocks.authComponent.mock.calls[0]?.[0] ?? {}
    expect(authWrapperArgs.logoutUri).toBe('https://tenant.example/auth/logout')
  })

  it('surfaces loading state while authentication is pending', async () => {
    window.history.replaceState({}, '', '/dashboard')
    mocks.useAuth.mockReturnValue({ isAuthenticated: false })

    render(<AppBasic />)

    expect(await screen.findByText(/protected loading/i)).toBeInTheDocument()
  })

  it('exposes the api client through context and honours provided clients', async () => {
    const providedClient = { id: 'provided-client' }

    function ApiConsumer() {
      const client = useAppApiClient()
      return <div data-testid="api-client">{client?.id ?? 'missing'}</div>
    }

    render(
      <AppBasic api={{ client: providedClient }}>
        <ApiConsumer />
      </AppBasic>,
    )

    expect(screen.getByTestId('api-client')).toHaveTextContent('provided-client')
    expect(mocks.createClient).not.toHaveBeenCalled()

    cleanup()

    mocks.createClient.mockReturnValueOnce({ id: 'generated-client' })

    render(
      <AppBasic api={{ baseUrl: 'https://api.tenant.example/' }}>
        <ApiConsumer />
      </AppBasic>,
    )

    expect(mocks.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://api.tenant.example/' }),
    )
  })

  it('supports custom route definitions for public pages', async () => {
    window.history.replaceState({}, '', '/about')

    render(
      <AppBasic
        publicPages={{
          routes: [
            {
              path: '/about',
              element: <h2>About Guidogerb</h2>,
            },
          ],
        }}
      />,
    )

    expect(await screen.findByRole('heading', { name: /about guidogerb/i })).toBeInTheDocument()
  })

  it('does not register the service worker when disabled', async () => {
    render(<AppBasic serviceWorker={{ enabled: false }} />)
    expect(mocks.registerSW).not.toHaveBeenCalled()
  })
})
