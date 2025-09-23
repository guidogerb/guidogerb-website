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

const DEFAULT_HEADER_SETTINGS = Object.freeze(
  createHeaderSettings({
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
  }),
)

export const APP_SHELL_PROVIDER_BLUEPRINT = Object.freeze({
  order: Object.freeze(['storage', 'auth', 'header', 'ui']),
  definitions: Object.freeze({
    storage: Object.freeze({
      id: 'storage',
      package: '@guidogerb/components-storage',
      description:
        'Wraps the application with a persistent namespace used by authentication and offline caches.',
      provides: Object.freeze(['StorageContext']),
      dependsOn: Object.freeze([]),
    }),
    auth: Object.freeze({
      id: 'auth',
      package: '@guidogerb/components-auth',
      description:
        'Provides OIDC authentication context and guards protected routes before they render.',
      provides: Object.freeze(['AuthContext']),
      dependsOn: Object.freeze(['storage']),
    }),
    header: Object.freeze({
      id: 'header',
      package: '@guidogerb/header',
      description: 'Hydrates navigation chrome and exposes header state to variant layouts.',
      provides: Object.freeze(['HeaderContext']),
      dependsOn: Object.freeze(['auth']),
    }),
    ui: Object.freeze({
      id: 'ui',
      package: '@guidogerb/components-ui',
      description: 'Registers responsive slot tokens so shared chrome renders consistently.',
      provides: Object.freeze(['ResponsiveSlotContext']),
      dependsOn: Object.freeze(['header']),
    }),
  }),
})

export const APP_SHELL_LAYOUT_BLUEPRINT = Object.freeze({
  regions: Object.freeze([
    Object.freeze({
      id: 'header',
      component: '@guidogerb/header',
      role: 'banner',
      description: 'Site-wide header chrome with navigation and auth affordances.',
      dependsOn: Object.freeze(['navigation', 'auth', 'ui']),
    }),
    Object.freeze({
      id: 'main',
      component: '@guidogerb/components-router-protected',
      role: 'main',
      description: 'Marketing routes and the protected dashboard rendered through a guarded router.',
      dependsOn: Object.freeze(['routes', 'auth']),
    }),
    Object.freeze({
      id: 'footer',
      component: '@guidogerb/footer',
      role: 'contentinfo',
      description: 'Shared footer with support, legal, and social navigation links.',
      dependsOn: Object.freeze(['navigation']),
    }),
  ]),
})

export const APP_BASIC_TENANT_CONTROLS = Object.freeze({
  api: Object.freeze([
    'client',
    'baseUrl',
    'getAccessToken',
    'fetch',
    'logger',
    'retry',
    'defaultHeaders',
    'userAgent',
  ]),
  auth: Object.freeze([
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
    'logoutUri',
    'provider',
  ]),
  navigation: Object.freeze(['items', 'activePath', 'onNavigate']),
  header: Object.freeze(['settings', 'baseSettings', 'props']),
  footer: Object.freeze([
    'brand',
    'description',
    'sections',
    'socialLinks',
    'legalLinks',
    'copyright',
    'onNavigate',
    'children',
    'className',
    'id',
    'style',
  ]),
  publicPages: Object.freeze(['landing', 'routes', 'fallback']),
  protectedPages: Object.freeze([
    'routes',
    'basename',
    'router',
    'routerOptions',
    'wrapElement',
    'fallback',
    'protectFallback',
  ]),
  storage: Object.freeze(['namespace', 'mode', 'persist', 'adapter']),
  serviceWorker: Object.freeze(['enabled', 'url', 'scope', 'immediate', 'onOfflineReady', 'onNeedRefresh']),
  theme: Object.freeze(['registry', 'tokens', 'defaultBreakpoint', 'resolveToken']),
  main: Object.freeze(['className', 'id', 'style', 'role']),
})

export const APP_BASIC_DEFAULTS = Object.freeze({
  storage: Object.freeze({ namespace: DEFAULT_STORAGE_NAMESPACE }),
  api: Object.freeze({ baseUrl: DEFAULT_API_BASE_URL }),
  auth: Object.freeze({
    authority: DEFAULT_AUTH_AUTHORITY,
    client_id: DEFAULT_AUTH_CLIENT_ID,
    loginCallbackPath: DEFAULT_LOGIN_CALLBACK_PATH,
    scope: 'openid email phone profile',
  }),
  navigation: Object.freeze({
    items: DEFAULT_NAVIGATION_ITEMS,
    activePath: '/',
  }),
  headerSettings: DEFAULT_HEADER_SETTINGS,
  footer: DEFAULT_FOOTER_PROPS,
  serviceWorker: Object.freeze({ enabled: true, url: '/sw.js' }),
  layout: Object.freeze({
    rootClassName: 'gg-app gg-app--basic',
    mainClassName: 'gg-app-basic__main',
  }),
})

const AppBasicContext = createContext({ apiClient: null, plan: null })

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

export const createAppBasicPlan = ({
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
  mainProps,
} = {}) => {
  const apiOptions = normalizeApiOptions(api)
  const { providerProps: authProviderProps, logoutUri } = normalizeAuthOptions(auth)
  const navigationConfig = normalizeNavigationConfig(navigation)
  const footerConfig = normalizeFooterConfig(footer, navigationConfig)

  const headerOverrides = isObject(header?.settings) ? header.settings : {}
  const headerSettings = createHeaderSettings(
    {
      ...headerOverrides,
      primaryLinks: headerOverrides.primaryLinks ?? navigationConfig.items,
    },
    header?.baseSettings ?? DEFAULT_HEADER_SETTINGS,
  )

  const headerPropsBase = isObject(header?.props) ? header.props : {}
  const headerProps = {
    ...headerPropsBase,
    activePath: headerPropsBase.activePath ?? navigationConfig.activePath,
    onNavigate: headerPropsBase.onNavigate ?? navigationConfig.onNavigate,
  }

  const publicConfig = normalizePublicPages(publicPages, { navigation: navigationConfig })
  const protectedConfig = normalizeProtectedPages(protectedPages)

  const combinedRoutes = [publicConfig.landing, ...publicConfig.routes, ...protectedConfig.routes]
    .filter(Boolean)
    .map((route) => ({
      ...route,
      isProtected: route.isProtected ?? false,
    }))

  const fallbackRoute = protectedConfig.fallback ?? publicConfig.fallback ?? null
  const guardProps = { logoutUri }

  const storageConfig = isObject(storage) ? storage : {}
  const { namespace = DEFAULT_STORAGE_NAMESPACE, ...storageRest } = storageConfig
  const storageProps = { namespace, ...storageRest }

  const swConfig = isObject(serviceWorker) ? serviceWorker : {}
  const { enabled: swEnabledRaw, url: swUrlRaw, ...swOptions } = swConfig
  const swEnabled = swEnabledRaw !== false
  const swUrl =
    typeof swUrlRaw === 'string' && swUrlRaw.length > 0
      ? swUrlRaw
      : APP_BASIC_DEFAULTS.serviceWorker.url

  const themeOptions = normalizeThemeOptions(theme)

  const rootClassName = ['gg-app', 'gg-app--basic', className].filter(Boolean).join(' ')

  const resolvedMainProps = isObject(mainProps) ? mainProps : {}
  const mainClassName = ['gg-app-basic__main', resolvedMainProps.className]
    .filter(Boolean)
    .join(' ')
  const mainAttributes = { ...resolvedMainProps, className: mainClassName }

  const routerPassthrough = {}
  const routerOptions = protectedConfig.routerOptions ?? {}
  if (routerOptions.basename) routerPassthrough.basename = routerOptions.basename
  if (routerOptions.router) routerPassthrough.router = routerOptions.router
  if (routerOptions.routerOptions) routerPassthrough.routerOptions = routerOptions.routerOptions
  if (routerOptions.wrapElement) routerPassthrough.wrapElement = routerOptions.wrapElement

  const defaultLogoutUri = `${resolveOrigin()}${DEFAULT_LOGOUT_PATH}`

  const defaults = {
    storage: APP_BASIC_DEFAULTS.storage,
    api: APP_BASIC_DEFAULTS.api,
    auth: {
      ...APP_BASIC_DEFAULTS.auth,
      post_logout_redirect_uri: defaultLogoutUri,
      logoutUri: defaultLogoutUri,
    },
    navigation: APP_BASIC_DEFAULTS.navigation,
    headerSettings: APP_BASIC_DEFAULTS.headerSettings,
    footer: APP_BASIC_DEFAULTS.footer,
    serviceWorker: APP_BASIC_DEFAULTS.serviceWorker,
    layout: APP_BASIC_DEFAULTS.layout,
  }

  return {
    variant: 'basic',
    providerBlueprint: APP_SHELL_PROVIDER_BLUEPRINT,
    layoutBlueprint: APP_SHELL_LAYOUT_BLUEPRINT,
    defaults,
    tenantControls: APP_BASIC_TENANT_CONTROLS,
    providers: {
      storage: { id: 'storage', props: storageProps },
      auth: { id: 'auth', props: authProviderProps, logoutUri },
      header: { id: 'header', settings: headerSettings, props: headerProps },
      ui: { id: 'ui', props: themeOptions },
    },
    navigation: navigationConfig,
    publicPages: publicConfig,
    protectedPages: protectedConfig,
    router: {
      routes: combinedRoutes,
      fallback: fallbackRoute,
      guardProps,
      protectFallback: protectedConfig.protectFallback,
      passthroughProps: routerPassthrough,
    },
    layout: {
      root: { className: rootClassName, dataAttributes: { 'data-app-variant': 'basic' } },
      header: { props: headerProps },
      main: { props: mainAttributes },
      footer: { props: footerConfig },
    },
    serviceWorker: { enabled: swEnabled, url: swUrl, options: swOptions },
    api: apiOptions,
  }
}

export const useAppBasicContext = () => useContext(AppBasicContext)

export const useAppApiClient = () => useAppBasicContext()?.apiClient ?? null

export const useAppBasicPlan = () => useAppBasicContext()?.plan ?? null

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
  const plan = useMemo(
    () =>
      createAppBasicPlan({
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
        mainProps,
      }),
    [
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
      mainProps,
    ],
  )

  const {
    api: apiOptions,
    providers,
    router,
    layout: layoutPlan,
    serviceWorker: serviceWorkerConfig,
  } = plan

  const {
    client: providedClient,
    baseUrl: apiBaseUrl,
    getAccessToken,
    fetch: fetchImpl,
    logger: loggerImpl,
    retry: retryOptions,
    defaultHeaders,
    userAgent,
  } = apiOptions

  const apiClient = useMemo(() => {
    if (providedClient) return providedClient
    return createClient({
      baseUrl: apiBaseUrl,
      getAccessToken,
      fetch: fetchImpl,
      logger: loggerImpl,
      retry: retryOptions,
      defaultHeaders,
      userAgent,
    })
  }, [
    providedClient,
    apiBaseUrl,
    getAccessToken,
    fetchImpl,
    loggerImpl,
    retryOptions,
    defaultHeaders,
    userAgent,
  ])

  const { enabled: swEnabled, url: swUrl, options: swOptions } = serviceWorkerConfig

  useEffect(() => {
    if (!swEnabled) return
    registerSW({ url: swUrl, ...swOptions })
  }, [swEnabled, swUrl, swOptions])

  const contextValue = useMemo(() => ({ apiClient, plan }), [apiClient, plan])

  const storageProps = providers.storage.props ?? {}
  const authProviderProps = providers.auth.props ?? {}
  const { logoutUri } = providers.auth
  const headerSettings = providers.header.settings
  const headerProps = providers.header.props ?? {}
  const themeOptions = providers.ui.props ?? {}
  const guardProps = router.guardProps ?? { logoutUri }
  const protectedRouterProps = router.passthroughProps ?? {}
  const rootAttributes = layoutPlan.root ?? { className: 'gg-app gg-app--basic', dataAttributes: {} }
  const mainAttributes = layoutPlan.main?.props ?? { className: 'gg-app-basic__main' }
  const footerConfig = layoutPlan.footer?.props ?? DEFAULT_FOOTER_PROPS

  return (
    <AppBasicContext.Provider value={contextValue}>
      <Storage {...storageProps}>
        <AuthProvider {...authProviderProps}>
          <HeaderContextProvider defaultSettings={headerSettings}>
            <ResponsiveSlotProvider
              registry={themeOptions.registry}
              tokens={themeOptions.tokens}
              defaultBreakpoint={themeOptions.defaultBreakpoint}
              resolveToken={themeOptions.resolveToken}
            >
              <div
                {...(rootAttributes.dataAttributes ?? {})}
                className={rootAttributes.className ?? APP_BASIC_DEFAULTS.layout.rootClassName}
                {...rest}
              >
                <Header {...headerProps} />
                <main {...mainAttributes}>
                  <ProtectedRouter
                    routes={router.routes}
                    fallback={router.fallback}
                    guardProps={guardProps}
                    protectFallback={router.protectFallback}
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
