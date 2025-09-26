import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  APP_SHELL_LAYOUT_BLUEPRINT,
  APP_SHELL_PROVIDER_BLUEPRINT,
  APP_BASIC_TENANT_CONTROLS,
  AppBasic,
  createAppBasicPlan,
  useAppApiClient,
  useAppBasicPlan,
} from '../App.jsx'

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
    protectedRouter: vi.fn(),
    storage: vi.fn(),
    headerProvider: vi.fn(),
    header: vi.fn(),
    footer: vi.fn(),
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

vi.mock('@guidogerb/components-router-protected', async () => {
  const actual = await vi.importActual('@guidogerb/components-router-protected')
  return {
    __esModule: true,
    ...actual,
    ProtectedRouter: vi.fn((props) => {
      mocks.protectedRouter(props)
      return actual.ProtectedRouter(props)
    }),
  }
})

vi.mock('@guidogerb/components-storage', async () => {
  const actual = await vi.importActual('@guidogerb/components-storage')
  const WrappedStorage = (props) => {
    mocks.storage(props)
    return actual.Storage(props)
  }
  return {
    __esModule: true,
    ...actual,
    Storage: WrappedStorage,
    default: WrappedStorage,
  }
})

vi.mock('@guidogerb/header', async () => {
  const actual = await vi.importActual('@guidogerb/header')
  const HeaderContextProvider = (props) => {
    mocks.headerProvider(props)
    return actual.HeaderContextProvider(props)
  }
  const Header = (props) => {
    mocks.header(props)
    return actual.Header(props)
  }
  return {
    __esModule: true,
    ...actual,
    HeaderContextProvider,
    Header,
    default: HeaderContextProvider,
  }
})

vi.mock('@guidogerb/footer', async () => {
  const actual = await vi.importActual('@guidogerb/footer')
  const Footer = (props) => {
    mocks.footer(props)
    return actual.Footer(props)
  }
  return {
    __esModule: true,
    ...actual,
    Footer,
    default: Footer,
  }
})

describe('AppBasic', () => {
  beforeEach(() => {
    mocks.authProvider.mockClear()
    mocks.authComponent.mockClear()
    mocks.useAuth.mockReturnValue({ isAuthenticated: true })
    mocks.registerSW.mockClear()
    mocks.createClient.mockClear()
    mocks.protectedRouter.mockClear()
    mocks.storage.mockClear()
    mocks.headerProvider.mockClear()
    mocks.header.mockClear()
    mocks.footer.mockClear()
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
    expect(mocks.registerSW).not.toHaveBeenCalled()
  })

  it('registers the shared service worker when explicitly enabled', async () => {
    render(<AppBasic serviceWorker={{ enabled: true }} />)

    await waitFor(() => {
      expect(mocks.registerSW).toHaveBeenCalledWith({ url: '/sw.js' })
    })
  })

  it('renders protected content when navigating to the dashboard', async () => {
    window.history.replaceState({}, '', '/dashboard')

    render(<AppBasic />)

    expect(await screen.findByRole('heading', { name: /dashboard overview/i })).toBeInTheDocument()
    expect(screen.getByText(/replace this placeholder/i)).toBeInTheDocument()
  })

  it('renders the default fallback for unknown routes', async () => {
    window.history.replaceState({}, '', '/missing')

    render(<AppBasic />)

    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByText(/we could not locate the requested page/i)).toBeInTheDocument()
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

  it('forwards custom service worker options when provided', async () => {
    render(
      <AppBasic
        serviceWorker={{
          enabled: true,
          url: '/tenant/sw.js',
          immediate: true,
          scope: '/tenant',
          onOfflineReady: vi.fn(),
        }}
      />,
    )

    await waitFor(() => {
      expect(mocks.registerSW).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/tenant/sw.js',
          immediate: true,
          scope: '/tenant',
        }),
      )
    })
  })

  it('invokes navigation handlers from the marketing shell preview', async () => {
    const user = userEvent.setup()
    const handleNavigate = vi.fn()

    render(<AppBasic navigation={{ onNavigate: handleNavigate }} />)

    const previewNav = await screen.findByRole('navigation', { name: /app navigation/i })
    const dashboardLink = within(previewNav).getByRole('link', { name: /dashboard/i })

    expect(within(previewNav).getByRole('link', { name: /home/i })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await user.click(dashboardLink)

    expect(handleNavigate).toHaveBeenCalledTimes(1)
    expect(handleNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        item: expect.objectContaining({ id: 'dashboard', href: '/dashboard' }),
      }),
    )
  })

  it('wires route definitions and guard metadata into the protected router', async () => {
    function Reports() {
      return <div>Reports</div>
    }

    function About() {
      return <div>About Guidogerb</div>
    }

    window.history.replaceState({}, '', '/app-shell/')

    render(
      <AppBasic
        publicPages={{
          routes: [{ path: '/about', Component: About }],
          fallback: { element: <div>Public fallback</div> },
        }}
        protectedPages={{
          basename: '/app-shell',
          routes: [
            {
              path: '/reports',
              Component: Reports,
              guard: { props: { fallback: <div>Guard loading</div> } },
            },
          ],
          fallback: { element: <div>Missing page</div>, isProtected: true },
          protectFallback: true,
          routerOptions: { future: { v7_normalizeFormMethod: true } },
        }}
      />,
    )

    await waitFor(() => expect(mocks.protectedRouter).toHaveBeenCalled())

    const routerProps = mocks.protectedRouter.mock.calls.at(-1)?.[0] ?? {}

    expect(routerProps.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/', isProtected: false }),
        expect.objectContaining({ path: '/about', isProtected: false }),
        expect.objectContaining({ path: '/dashboard', isProtected: true }),
        expect.objectContaining({ path: '/reports', isProtected: true }),
      ]),
    )

    expect(routerProps.fallback).toEqual(expect.objectContaining({ path: '*', isFallback: true }))
    const expectedLogout = `${window.location.origin}/auth/logout`
    expect(routerProps.guardProps).toEqual(expect.objectContaining({ logoutUri: expectedLogout }))
    expect(routerProps.protectFallback).toBe(true)
    expect(routerProps.basename).toBe('/app-shell')
    expect(routerProps.routerOptions).toEqual({ future: { v7_normalizeFormMethod: true } })
  })

  it('applies navigation overrides to header and footer components', () => {
    const handleNavigate = vi.fn()
    const navItems = [
      { id: 'home', label: 'Home', href: '/' },
      { id: 'account', label: 'Account', href: '/account' },
    ]

    render(
      <AppBasic
        navigation={{ items: navItems, activePath: '/account', onNavigate: handleNavigate }}
      />,
    )

    const providerProps = mocks.headerProvider.mock.calls.at(-1)?.[0] ?? {}
    expect(providerProps.defaultSettings?.primaryLinks).toHaveLength(navItems.length)
    expect(providerProps.defaultSettings?.primaryLinks).toEqual(
      expect.arrayContaining(navItems.map((item) => expect.objectContaining(item))),
    )

    const headerProps = mocks.header.mock.calls.at(-1)?.[0] ?? {}
    expect(headerProps.activePath).toBe('/account')
    expect(headerProps.onNavigate).toBe(handleNavigate)

    const footerProps = mocks.footer.mock.calls.at(-1)?.[0] ?? {}
    expect(footerProps.onNavigate).toBe(handleNavigate)
  })

  it('configures storage namespace and forwards persistence props', () => {
    render(<AppBasic />)

    const defaultStorageProps = mocks.storage.mock.calls.at(-1)?.[0] ?? {}
    expect(defaultStorageProps.namespace).toBe('guidogerb.app')

    cleanup()
    mocks.storage.mockClear()

    render(<AppBasic storage={{ namespace: 'tenant.app', mode: 'session', persist: false }} />)

    const storageProps = mocks.storage.mock.calls.at(-1)?.[0] ?? {}
    expect(storageProps.namespace).toBe('tenant.app')
    expect(storageProps.mode).toBe('session')
    expect(storageProps.persist).toBe(false)
  })

  it('provides the runtime plan through context', async () => {
    function PlanProbe() {
      const plan = useAppBasicPlan()
      if (!plan) return null
      return (
        <div
          data-testid="plan"
          data-variant={plan.variant}
          data-providers={plan.providerBlueprint.order.join(',')}
        >
          {plan.providers.auth.logoutUri}
        </div>
      )
    }

    render(
      <AppBasic auth={{ postLogoutRedirectUri: 'https://tenant.example/logout' }}>
        <PlanProbe />
      </AppBasic>,
    )

    const planNode = await screen.findByTestId('plan')
    expect(planNode).toHaveAttribute('data-variant', 'basic')
    expect(planNode).toHaveAttribute('data-providers', 'storage,auth,header,ui')
    expect(planNode).toHaveTextContent('https://tenant.example/logout')
  })
})

describe('App shell blueprint', () => {
  it('documents provider order and layout regions', () => {
    expect(APP_SHELL_PROVIDER_BLUEPRINT.order).toEqual(['storage', 'auth', 'header', 'ui'])
    expect(APP_SHELL_PROVIDER_BLUEPRINT.definitions.auth.package).toBe('@guidogerb/components-auth')
    expect(APP_SHELL_LAYOUT_BLUEPRINT.regions.map((region) => region.id)).toEqual([
      'header',
      'main',
      'footer',
    ])
    expect(APP_SHELL_LAYOUT_BLUEPRINT.regions[0]?.role).toBe('banner')
  })
})

describe('createAppBasicPlan', () => {
  it('produces defaults and tenant controls for the base variant', () => {
    const plan = createAppBasicPlan()

    expect(plan.variant).toBe('basic')
    expect(plan.providers.storage.props.namespace).toBe('guidogerb.app')
    expect(plan.providers.auth.logoutUri).toMatch(/\/auth\/logout$/)
    expect(plan.defaults.auth.logoutUri).toMatch(/\/auth\/logout$/)
    expect(plan.providers.auth.props.response_type).toBe('code')
    expect(plan.providers.auth.props.scope).toBe('openid profile email')
    expect(plan.defaults.auth.response_type).toBe('code')
    expect(plan.defaults.auth.scope).toBe('openid profile email')
    expect(plan.tenantControls).toBe(APP_BASIC_TENANT_CONTROLS)
    expect(plan.layout.main.props.className).toBe('gg-app-basic__main')
    expect(plan.defaults.serviceWorker.enabled).toBe(false)
    expect(plan.defaults.navigation.items[0]?.label).toBe('Home')
    expect(plan.router.routes.some((route) => route.path === '/')).toBe(true)
  })

  it('reflects tenant overrides inside the plan metadata', () => {
    function Reports() {
      return <div>Reports</div>
    }

    const plan = createAppBasicPlan({
      navigation: {
        items: [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'account', label: 'Account', href: '/account' },
        ],
        activePath: '/account',
        onNavigate: vi.fn(),
      },
      auth: {
        clientId: 'tenant-client',
        logoutUri: 'https://tenant.example/logout',
      },
      protectedPages: {
        routes: [{ path: '/reports', Component: Reports }],
        protectFallback: true,
        routerOptions: { basename: '/app' },
      },
      serviceWorker: {
        url: '/tenant/sw.js',
        scope: '/tenant',
      },
      storage: {
        namespace: 'tenant.app',
        mode: 'session',
      },
      mainProps: {
        className: 'tenant-main',
      },
    })

    expect(plan.providers.auth.props.client_id).toBe('tenant-client')
    expect(plan.providers.auth.logoutUri).toBe('https://tenant.example/logout')
    expect(plan.router.routes.some((route) => route.path === '/reports')).toBe(true)
    expect(plan.router.protectFallback).toBe(true)
    expect(plan.router.passthroughProps.routerOptions?.basename).toBe('/app')
    expect(plan.serviceWorker.url).toBe('/tenant/sw.js')
    expect(plan.serviceWorker.options.scope).toBe('/tenant')
    expect(plan.providers.storage.props.namespace).toBe('tenant.app')
    expect(plan.layout.main.props.className).toContain('tenant-main')
  })
})
