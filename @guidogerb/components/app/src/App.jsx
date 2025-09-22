import { createContext, createElement, isValidElement, useContext, useEffect, useMemo } from 'react'
import { createClient } from '@guidogerb/components-api'
import { AuthProvider } from '@guidogerb/components-auth'
import { Footer } from '@guidogerb/footer'
import { Header, HeaderContextProvider, createHeaderSettings } from '@guidogerb/header'
import { NavigationMenu } from '@guidogerb/components-menu'
import { ProtectedRouter } from '@guidogerb/components-router-protected'
import { ErrorShell, MarketingShell } from '@guidogerb/components-pages-public'
import { Storage } from '@guidogerb/components-storage'
import { ResponsiveSlotProvider } from '@guidogerb/components-ui'
import { registerSW } from '@guidogerb/components-sw'

const DEFAULT_STORAGE_NAMESPACE = 'guidogerb.app'
const DEFAULT_API_BASE_URL = 'https://api.guidogerb.dev/'
const DEFAULT_AUTH_AUTHORITY = 'https://auth.guidogerb.dev'
const DEFAULT_AUTH_CLIENT_ID = 'guidogerb.app'
const DEFAULT_LOGIN_CALLBACK_PATH = '/auth/callback'
const DEFAULT_LOGOUT_PATH = '/auth/logout'

const DEFAULT_NAVIGATION_ITEMS = Object.freeze([
  { id: 'home', label: 'Welcome', href: '/' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'support', label: 'Support', href: 'mailto:hello@guidogerb.com', external: true },
])

const CURRENT_YEAR = new Date().getFullYear()

const DEFAULT_FOOTER_PROPS = Object.freeze({
  brand: { name: 'Guido & Gerber', href: '/' },
  description: 'Multi-tenant publishing experiences designed for storytellers.',
  sections: [
    {
      id: 'platform',
      title: 'Platform',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Roadmap', href: '/#roadmap' },
      ],
    },
    {
      id: 'resources',
      title: 'Resources',
      links: [
        { label: 'Documentation', href: 'https://docs.guidogerb.com', external: true },
        { label: 'Support', href: 'mailto:support@guidogerb.com' },
        { label: 'Status', href: 'https://status.guidogerb.com', external: true },
      ],
    },
  ],
  socialLinks: [
    { label: 'LinkedIn', href: 'https://linkedin.com/company/guidogerb', external: true },
    { label: 'Instagram', href: 'https://instagram.com/guidogerb', external: true },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  copyright: `© ${CURRENT_YEAR} Guido & Gerber, LLC`,
})

const DEFAULT_HEADER_SETTINGS = createHeaderSettings({
  brand: {
    title: 'Guido & Gerber',
    tagline: 'Stories for every stage',
    href: '/',
    logoSrc: null,
  },
  primaryLinks: DEFAULT_NAVIGATION_ITEMS,
  showAuthControls: true,
  showTenantSwitcher: false,
  showThemeToggle: true,
})

const AppBasicContext = createContext({ apiClient: null })

const isObject = (value) => typeof value === 'object' && value !== null

const resolveOrigin = () => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }
  return 'https://app.guidogerb.com'
}

const renderSlot = (slot, props) => {
  if (slot === null || slot === undefined) return null
  if (isValidElement(slot)) return slot
  if (typeof slot === 'function') {
    return createElement(slot, props)
  }
  return slot
}

const normalizeRouteChildren = (children, defaults) => {
  if (!Array.isArray(children) || children.length === 0) return undefined
  const normalized = children
    .map((child) => normalizeRouteDefinition(child, defaults))
    .filter(Boolean)
  return normalized.length > 0 ? normalized : undefined
}

const normalizeRouteDefinition = (route, defaults) => {
  if (!isObject(route)) return null

  const { element, Component, children, isProtected, guard, guardProps, ...rest } = route

  let resolvedElement = element

  if (!resolvedElement && typeof Component === 'function') {
    resolvedElement = createElement(Component, route.componentProps ?? {})
  }

  const finalElement = renderSlot(resolvedElement, route.elementProps)
  if (!finalElement) return null

  const normalized = {
    ...rest,
    element: finalElement,
  }

  if (guard !== undefined) normalized.guard = guard
  if (guardProps !== undefined) normalized.guardProps = guardProps

  const mergedDefaults = defaults ?? {}
  normalized.isProtected =
    isProtected !== undefined ? Boolean(isProtected) : (mergedDefaults.isProtected ?? false)
  if (normalized.guard === undefined && mergedDefaults.guard !== undefined) {
    normalized.guard = mergedDefaults.guard
  }

  const nested = normalizeRouteChildren(children, defaults)
  if (nested) {
    normalized.children = nested
  }

  return normalized
}

const normalizeFallbackRoute = (value, defaults) => {
  const fallbackDefaults = defaults ?? {}
  if (!value && value !== 0) {
    const element = renderSlot(fallbackDefaults.element, fallbackDefaults.props)
    if (!element) return null
    return {
      path: '*',
      element,
      isProtected: fallbackDefaults.isProtected ?? false,
      isFallback: true,
    }
  }

  if (isObject(value)) {
    const normalized = normalizeRouteDefinition(
      {
        path: value.path ?? '*',
        ...value,
      },
      { ...fallbackDefaults, isProtected: fallbackDefaults.isProtected ?? false },
    )
    if (!normalized) return null
    if (!normalized.path) normalized.path = '*'
    normalized.isFallback = true
    return normalized
  }

  const element = renderSlot(value, fallbackDefaults.props)
  if (!element) return null
  return {
    path: '*',
    element,
    isProtected: fallbackDefaults.isProtected ?? false,
    isFallback: true,
  }
}

const normalizeNavigationConfig = (navigation) => {
  if (!isObject(navigation)) {
    return {
      items: DEFAULT_NAVIGATION_ITEMS,
      activePath: typeof window !== 'undefined' && window.location ? window.location.pathname : '/',
      onNavigate: undefined,
    }
  }

  const items =
    Array.isArray(navigation.items) && navigation.items.length > 0
      ? navigation.items
      : DEFAULT_NAVIGATION_ITEMS

  const activePath =
    navigation.activePath ??
    (typeof window !== 'undefined' && window.location ? window.location.pathname : '/')

  return {
    items,
    activePath,
    onNavigate: navigation.onNavigate,
  }
}

const normalizeFooterConfig = (footer, navigation) => {
  if (!isObject(footer)) {
    return {
      ...DEFAULT_FOOTER_PROPS,
      onNavigate: navigation.onNavigate,
    }
  }

  return {
    brand: footer.brand ?? DEFAULT_FOOTER_PROPS.brand,
    description: footer.description ?? DEFAULT_FOOTER_PROPS.description,
    sections:
      Array.isArray(footer.sections) && footer.sections.length > 0
        ? footer.sections
        : DEFAULT_FOOTER_PROPS.sections,
    socialLinks: Array.isArray(footer.socialLinks)
      ? footer.socialLinks
      : DEFAULT_FOOTER_PROPS.socialLinks,
    legalLinks: Array.isArray(footer.legalLinks)
      ? footer.legalLinks
      : DEFAULT_FOOTER_PROPS.legalLinks,
    copyright: footer.copyright ?? DEFAULT_FOOTER_PROPS.copyright,
    onNavigate: footer.onNavigate ?? navigation.onNavigate,
    children: footer.children,
    className: footer.className,
    id: footer.id,
    style: footer.style,
  }
}

const normalizePublicPages = (publicPages, { navigation } = {}) => {
  const config = isObject(publicPages) ? publicPages : {}

  const navigationConfig = isObject(navigation) ? navigation : {}
  const navigationItems = Array.isArray(navigationConfig.items) ? navigationConfig.items : undefined

  const landingProps = {
    navigation,
    navigationItems: navigationItems?.length ? navigationItems : DEFAULT_NAVIGATION_ITEMS,
    navigationActivePath:
      typeof navigationConfig.activePath === 'string' &&
      navigationConfig.activePath.trim().length > 0
        ? navigationConfig.activePath
        : '/',
    navigationOnNavigate:
      typeof navigationConfig.onNavigate === 'function' ? navigationConfig.onNavigate : undefined,
  }

  const landingValue = config.landing ?? DefaultMarketingLanding
  const landingRoute = isObject(landingValue)
    ? normalizeRouteDefinition(
        {
          path: landingValue.path ?? '/',
          ...landingValue,
          componentProps: isObject(landingValue.componentProps)
            ? { ...landingProps, ...landingValue.componentProps }
            : landingProps,
          elementProps: isObject(landingValue.elementProps)
            ? { ...landingProps, ...landingValue.elementProps }
            : landingProps,
          isProtected: false,
          guard: false,
        },
        { isProtected: false, guard: false },
      )
    : {
        path: '/',
        element: renderSlot(landingValue, landingProps),
        isProtected: false,
        guard: false,
      }

  if (!landingRoute?.element) {
    landingRoute.element = (
      <DefaultMarketingLanding
        navigation={landingProps.navigation}
        navigationItems={landingProps.navigationItems}
        navigationActivePath={landingProps.navigationActivePath}
        navigationOnNavigate={landingProps.navigationOnNavigate}
      />
    )
  }

  if (!landingRoute.path) {
    landingRoute.path = '/'
  }
  landingRoute.isProtected = false
  landingRoute.guard = landingRoute.guard ?? false

  const additionalRoutes = Array.isArray(config.routes) ? config.routes : []
  const normalizedAdditional = additionalRoutes
    .map((route) => normalizeRouteDefinition(route, { isProtected: false, guard: false }))
    .filter(Boolean)

  const fallback = normalizeFallbackRoute(config.fallback, {
    element: <DefaultPublicFallback />,
    isProtected: false,
  })

  return {
    landing: landingRoute,
    routes: normalizedAdditional,
    fallback,
  }
}

const normalizeProtectedPages = (protectedPages) => {
  const config = isObject(protectedPages) ? protectedPages : {}

  const defaultRoute = {
    path: '/dashboard',
    element: <DefaultProtectedHome />,
    isProtected: true,
  }

  const baseRoutes = Array.isArray(config.routes) ? config.routes : []
  const normalizedRoutes = [defaultRoute, ...baseRoutes]
    .map((route) => normalizeRouteDefinition(route, { isProtected: true }))
    .filter(Boolean)
    .map((route) => ({ ...route, isProtected: route.isProtected !== false }))

  const fallback = normalizeFallbackRoute(config.fallback, {
    element: <DefaultPublicFallback statusCode={404} />,
    isProtected: false,
  })

  const routerOptions = {
    basename: config.basename,
    router: config.router,
    routerOptions: config.routerOptions,
    wrapElement: config.wrapElement,
  }

  return {
    routes: normalizedRoutes,
    fallback,
    protectFallback: Boolean(config.protectFallback),
    routerOptions,
  }
}

const normalizeAuthOptions = (authConfig) => {
  const config = isObject(authConfig) ? authConfig : {}
  const providerOverrides = isObject(config.provider) ? config.provider : {}

  const origin = resolveOrigin()

  const providerProps = { ...providerOverrides }

  const copyKeys = [
    'authority',
    'metadataUrl',
    'metadata_url',
    'client_id',
    'clientId',
    'redirect_uri',
    'redirectUri',
    'response_type',
    'responseType',
    'scope',
    'post_logout_redirect_uri',
    'postLogoutRedirectUri',
    'loginCallbackPath',
  ]

  for (const key of copyKeys) {
    if (providerProps[key] !== undefined) continue
    if (config[key] !== undefined) {
      providerProps[key] = config[key]
    }
  }

  const merged = { ...providerProps }

  merged.loginCallbackPath =
    merged.loginCallbackPath ?? config.loginCallbackPath ?? DEFAULT_LOGIN_CALLBACK_PATH

  const defaultRedirect = `${origin}${merged.loginCallbackPath}`

  merged.authority = merged.authority ?? config.authority ?? DEFAULT_AUTH_AUTHORITY
  merged.metadataUrl = merged.metadataUrl ?? merged.metadata_url ?? config.metadataUrl
  merged.client_id = merged.client_id ?? merged.clientId ?? config.client_id ?? config.clientId
  if (!merged.client_id) {
    merged.client_id = DEFAULT_AUTH_CLIENT_ID
  }
  delete merged.clientId

  merged.redirect_uri =
    merged.redirect_uri ?? merged.redirectUri ?? config.redirect_uri ?? config.redirectUri
  if (!merged.redirect_uri) {
    merged.redirect_uri = defaultRedirect
  }
  delete merged.redirectUri

  merged.response_type =
    merged.response_type ?? merged.responseType ?? config.response_type ?? config.responseType
  delete merged.responseType

  merged.scope = merged.scope ?? config.scope ?? 'openid email phone profile'

  merged.post_logout_redirect_uri =
    merged.post_logout_redirect_uri ??
    merged.postLogoutRedirectUri ??
    config.post_logout_redirect_uri ??
    config.postLogoutRedirectUri ??
    `${origin}${DEFAULT_LOGOUT_PATH}`
  delete merged.postLogoutRedirectUri

  const normalizedPostLogout =
    config.post_logout_redirect_uri ??
    config.postLogoutRedirectUri ??
    merged.post_logout_redirect_uri

  const logoutUri = config.logoutUri ?? normalizedPostLogout ?? `${origin}${DEFAULT_LOGOUT_PATH}`

  delete merged.logoutUri

  return {
    providerProps: merged,
    logoutUri,
  }
}

const normalizeApiOptions = (apiConfig) => {
  const config = isObject(apiConfig) ? apiConfig : {}
  if (config.client) {
    return { client: config.client }
  }

  return {
    baseUrl: config.baseUrl ?? DEFAULT_API_BASE_URL,
    getAccessToken: config.getAccessToken,
    fetch: config.fetch,
    logger: config.logger,
    retry: config.retry,
    defaultHeaders: config.defaultHeaders,
    userAgent: config.userAgent,
  }
}

const normalizeThemeOptions = (themeConfig) => {
  const config = isObject(themeConfig) ? themeConfig : {}
  return {
    registry: config.registry,
    tokens: config.tokens,
    defaultBreakpoint: config.defaultBreakpoint,
    resolveToken: config.resolveToken,
  }
}

export const useAppBasicContext = () => useContext(AppBasicContext)

export const useAppApiClient = () => useAppBasicContext()?.apiClient ?? null

export const AppBasic = ({
  className,
  api,
  auth,
  navigation,
  header,
  footer,
  publicPages,
  protectedPages,
  storage,
  serviceWorker,
  theme,
  children,
  mainProps,
  ...rest
}) => {
  const apiOptions = useMemo(() => normalizeApiOptions(api), [api])
  const apiClient = useMemo(() => {
    if (apiOptions.client) return apiOptions.client
    return createClient({
      baseUrl: apiOptions.baseUrl,
      getAccessToken: apiOptions.getAccessToken,
      fetch: apiOptions.fetch,
      logger: apiOptions.logger,
      retry: apiOptions.retry,
      defaultHeaders: apiOptions.defaultHeaders,
      userAgent: apiOptions.userAgent,
    })
  }, [
    apiOptions.baseUrl,
    apiOptions.client,
    apiOptions.defaultHeaders,
    apiOptions.fetch,
    apiOptions.getAccessToken,
    apiOptions.logger,
    apiOptions.retry,
    apiOptions.userAgent,
  ])

  const { providerProps: authProviderProps, logoutUri } = useMemo(
    () => normalizeAuthOptions(auth),
    [auth],
  )

  const navigationConfig = useMemo(() => normalizeNavigationConfig(navigation), [navigation])

  const footerConfig = useMemo(
    () => normalizeFooterConfig(footer, navigationConfig),
    [footer, navigationConfig],
  )

  const headerSettings = useMemo(() => {
    const overrides = isObject(header?.settings) ? header.settings : {}
    return createHeaderSettings(
      {
        ...overrides,
        primaryLinks: overrides.primaryLinks ?? navigationConfig.items,
      },
      header?.baseSettings ?? DEFAULT_HEADER_SETTINGS,
    )
  }, [header?.baseSettings, header?.settings, navigationConfig.items])

  const headerProps = useMemo(() => {
    const props = isObject(header?.props) ? header.props : {}
    return {
      ...props,
      activePath: props.activePath ?? navigationConfig.activePath,
      onNavigate: props.onNavigate ?? navigationConfig.onNavigate,
    }
  }, [header?.props, navigationConfig.activePath, navigationConfig.onNavigate])

  const publicConfig = useMemo(
    () => normalizePublicPages(publicPages, { navigation: navigationConfig }),
    [publicPages, navigationConfig],
  )

  const protectedConfig = useMemo(() => normalizeProtectedPages(protectedPages), [protectedPages])

  const combinedRoutes = useMemo(() => {
    const routes = [publicConfig.landing, ...publicConfig.routes, ...protectedConfig.routes]
      .filter(Boolean)
      .map((route) => ({
        ...route,
        isProtected: route.isProtected ?? false,
      }))
    return routes
  }, [publicConfig.landing, publicConfig.routes, protectedConfig.routes])

  const fallbackRoute = useMemo(() => {
    return protectedConfig.fallback ?? publicConfig.fallback ?? null
  }, [protectedConfig.fallback, publicConfig.fallback])

  const guardProps = useMemo(() => ({ logoutUri }), [logoutUri])

  const storageConfig = isObject(storage) ? storage : {}
  const { namespace = DEFAULT_STORAGE_NAMESPACE, ...storageRest } = storageConfig

  const { swEnabled, swUrl, swOptions } = useMemo(() => {
    const config = isObject(serviceWorker) ? serviceWorker : {}
    const { enabled, url, ...rest } = config
    return {
      swEnabled: enabled !== false,
      swUrl: typeof url === 'string' && url.length > 0 ? url : '/sw.js',
      swOptions: rest,
    }
  }, [serviceWorker])

  useEffect(() => {
    if (!swEnabled) return
    registerSW({ url: swUrl, ...swOptions })
  }, [swEnabled, swUrl, swOptions])

  const themeOptions = useMemo(() => normalizeThemeOptions(theme), [theme])

  const contextValue = useMemo(() => ({ apiClient }), [apiClient])

  const rootClassName = useMemo(
    () => ['gg-app', 'gg-app--basic', className].filter(Boolean).join(' '),
    [className],
  )

  const protectedRouterProps = useMemo(() => {
    const options = protectedConfig.routerOptions ?? {}
    const routerProps = {}
    if (options.basename) routerProps.basename = options.basename
    if (options.router) routerProps.router = options.router
    if (options.routerOptions) routerProps.routerOptions = options.routerOptions
    if (options.wrapElement) routerProps.wrapElement = options.wrapElement
    return routerProps
  }, [protectedConfig.routerOptions])

  return (
    <AppBasicContext.Provider value={contextValue}>
      <Storage namespace={namespace} {...storageRest}>
        <AuthProvider {...authProviderProps}>
          <HeaderContextProvider defaultSettings={headerSettings}>
            <ResponsiveSlotProvider
              registry={themeOptions.registry}
              tokens={themeOptions.tokens}
              defaultBreakpoint={themeOptions.defaultBreakpoint}
              resolveToken={themeOptions.resolveToken}
            >
              <div data-app-variant="basic" className={rootClassName} {...rest}>
                <Header {...headerProps} />
                <main className="gg-app-basic__main" {...(mainProps ?? {})}>
                  <ProtectedRouter
                    routes={combinedRoutes}
                    fallback={fallbackRoute}
                    guardProps={guardProps}
                    protectFallback={protectedConfig.protectFallback}
                    {...protectedRouterProps}
                  />
                  {children}
                </main>
                <Footer {...footerConfig} />
              </div>
            </ResponsiveSlotProvider>
          </HeaderContextProvider>
        </AuthProvider>
      </Storage>
    </AppBasicContext.Provider>
  )
}

export const App = AppBasic

export default App

function DefaultMarketingLanding({
  navigation,
  navigationItems = DEFAULT_NAVIGATION_ITEMS,
  navigationActivePath,
  navigationOnNavigate,
}) {
  const navigationConfig = isObject(navigation) ? navigation : {}
  const resolvedNavigationItems =
    Array.isArray(navigationItems) && navigationItems.length > 0
      ? navigationItems
      : Array.isArray(navigationConfig.items) && navigationConfig.items.length > 0
        ? navigationConfig.items
        : DEFAULT_NAVIGATION_ITEMS

  const resolvedActivePath =
    typeof navigationActivePath === 'string' && navigationActivePath.trim().length > 0
      ? navigationActivePath
      : typeof navigationConfig.activePath === 'string' &&
          navigationConfig.activePath.trim().length > 0
        ? navigationConfig.activePath
        : '/'

  const resolvedOnNavigate =
    typeof navigationOnNavigate === 'function'
      ? navigationOnNavigate
      : typeof navigationConfig.onNavigate === 'function'
        ? navigationConfig.onNavigate
        : undefined

  const hasNavigation = Array.isArray(resolvedNavigationItems) && resolvedNavigationItems.length > 0

  return (
    <MarketingShell
      eyebrow="Introducing AppBasic"
      title="Launch multi-tenant experiences without boilerplate"
      description="AppBasic wires navigation, authentication, routing, storage, and offline defaults so teams can publish faster."
      actions={[
        { label: 'View dashboard demo', href: '/dashboard' },
        {
          label: 'Contact Guidogerb',
          href: 'mailto:hello@guidogerb.com',
          variant: 'secondary',
        },
      ]}
      aside={
        hasNavigation ? (
          <div className="gg-app-basic__nav-preview">
            <h2 className="gg-app-basic__nav-preview-title">Primary navigation</h2>
            <NavigationMenu
              items={resolvedNavigationItems}
              orientation="vertical"
              label="App navigation"
              activePath={resolvedActivePath}
              onNavigate={resolvedOnNavigate}
            />
          </div>
        ) : null
      }
    >
      <p>
        Compose shared marketing shells with protected dashboards in a single drop-in component.
        Configure tenant branding through props while keeping Guidogerb defaults for routing,
        storage, and service worker registration.
      </p>
      <ul className="gg-app-basic__feature-list">
        <li>Pre-baked marketing and dashboard routes with a guarded router.</li>
        <li>OIDC authentication configured for Guidogerb&apos;s Cognito environments.</li>
        <li>Storage namespaces that keep tenant preferences isolated across sessions.</li>
      </ul>
    </MarketingShell>
  )
}

function DefaultProtectedHome() {
  return (
    <section className="gg-app-basic__protected">
      <h1 className="gg-app-basic__protected-title">Dashboard overview</h1>
      <p className="gg-app-basic__protected-copy">
        You&apos;re signed in through Guidogerb authentication. Replace this placeholder with tenant
        modules to ship analytics, catalog management, or editorial tooling.
      </p>
    </section>
  )
}

function DefaultPublicFallback({ statusCode = 404 }) {
  return (
    <ErrorShell
      statusCode={statusCode}
      title="Page not found"
      description="We could not locate the requested page. Try returning to the home experience or accessing the dashboard if you\'re signed in."
      actions={[
        { label: 'Back to home', href: '/' },
        { label: 'Visit dashboard', href: '/dashboard', variant: 'secondary' },
      ]}
    />
  )
}

DefaultMarketingLanding.displayName = 'DefaultMarketingLanding'
DefaultProtectedHome.displayName = 'DefaultProtectedHome'
DefaultPublicFallback.displayName = 'DefaultPublicFallback'
