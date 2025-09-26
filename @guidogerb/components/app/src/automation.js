import {
  APP_BASIC_DEFAULTS,
  APP_BASIC_TENANT_CONTROLS,
  APP_SHELL_LAYOUT_BLUEPRINT,
  APP_SHELL_PROVIDER_BLUEPRINT,
  createAppBasicPlan,
} from './App.jsx'

const DEFAULT_AUTOMATION_DOMAIN = 'tenant.example.com'
const DEFAULT_AUTOMATION_DISPLAY_NAME = 'Guidogerb Tenant'
const DEFAULT_AUTOMATION_SUPPORT_EMAIL = 'support@guidogerb.com'
const DEFAULT_AUTOMATION_TAGLINE = 'Stories in motion for modern audiences.'
const DEFAULT_AUTOMATION_LOGOUT_PATH = '/auth/logout'

const DEFAULT_AUTOMATION_NAVIGATION_ITEMS = Object.freeze([
  { id: 'home', label: 'Home', href: '/' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'support', label: 'Support', href: `mailto:${DEFAULT_AUTOMATION_SUPPORT_EMAIL}`, external: true },
])

const DEFAULT_AUTOMATION_CI_COMMANDS = Object.freeze([
  'pnpm clean',
  'pnpm install',
  'pnpm build',
  'pnpm lint',
  'pnpm format:check',
  'pnpm test',
])

const deepFreeze = (value) => {
  if (Array.isArray(value)) {
    for (const entry of value) deepFreeze(entry)
    return Object.freeze(value)
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) deepFreeze(entry)
    return Object.freeze(value)
  }
  return value
}

const copyBlueprintOrder = () => [...APP_SHELL_PROVIDER_BLUEPRINT.order]

const copyLayoutRegions = () =>
  APP_SHELL_LAYOUT_BLUEPRINT.regions.map((region) => ({
    id: region.id,
    role: region.role,
    description: region.description,
  }))

const ENVIRONMENT_VARIABLES = Object.freeze([
  {
    key: 'VITE_SITE_DOMAIN',
    required: true,
    description:
      'Primary domain served by the tenant. Used to derive canonical URLs, redirect URIs, and preview hosts.',
  },
  {
    key: 'VITE_SITE_URL',
    required: false,
    description: 'Fully qualified site URL. Defaults to https://{VITE_SITE_DOMAIN} when omitted.',
  },
  {
    key: 'VITE_SUPPORT_EMAIL',
    required: false,
    description: 'Contact email surfaced in navigation and footer support links.',
  },
  {
    key: 'VITE_API_BASE_URL',
    required: false,
    description: 'Overrides the shared API base URL consumed by @guidogerb/components-api.',
  },
  {
    key: 'VITE_COGNITO_AUTHORITY',
    required: true,
    description: 'OIDC authority/issuer URL consumed by the shared authentication provider.',
  },
  {
    key: 'VITE_COGNITO_METADATA_URL',
    required: false,
    description: 'Optional discovery metadata URL for tenants that publish a non-standard OIDC document.',
  },
  {
    key: 'VITE_COGNITO_CLIENT_ID',
    required: true,
    description: 'OIDC client identifier used by the hosted UI login flow.',
  },
  {
    key: 'VITE_COGNITO_SCOPE',
    required: false,
    description: 'OIDC scopes requested during authentication. Defaults to "openid profile email".',
  },
  {
    key: 'VITE_RESPONSE_TYPE',
    required: false,
    description: 'OIDC response type requested from Cognito. Defaults to "code".',
  },
  {
    key: 'VITE_LOGIN_CALLBACK_PATH',
    required: false,
    description: 'Path appended to the site URL for OIDC login callbacks. Defaults to /auth/callback.',
  },
  {
    key: 'VITE_REDIRECT_URI',
    required: false,
    description: 'Explicit login redirect URI. Derived from VITE_SITE_URL + VITE_LOGIN_CALLBACK_PATH by default.',
  },
  {
    key: 'VITE_COGNITO_POST_LOGOUT_REDIRECT_URI',
    required: false,
    description:
      'Redirect URI Cognito invokes after logout. Defaults to the site URL with the shared /auth/logout path.',
  },
  {
    key: 'VITE_LOGOUT_URI',
    required: false,
    description: 'Frontend logout URL routed through AppBasic. Defaults to the shared /auth/logout path.',
  },
  {
    key: 'VITE_ENABLE_SW',
    required: false,
    description: 'When "true", registers the shared service worker during automation smoke tests.',
  },
  {
    key: 'VITE_SW_URL',
    required: false,
    description: 'Custom service worker URL registered when automation enables offline support.',
  },
])

const cloneNavigationItems = (supportEmail) =>
  DEFAULT_AUTOMATION_NAVIGATION_ITEMS.map((item) => {
    if (item.id !== 'support') return { ...item }
    const email = typeof supportEmail === 'string' && supportEmail.trim().length > 0
      ? supportEmail.trim()
      : DEFAULT_AUTOMATION_SUPPORT_EMAIL
    return { ...item, href: `mailto:${email}` }
  })

const ensureString = (value) => (typeof value === 'string' ? value.trim() : '')

const ensurePath = (value, fallback) => {
  const trimmed = ensureString(value)
  if (!trimmed) return fallback
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const stripTrailingSlash = (value) => value.replace(/\/+$/, '') || value

const coerceBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === null) return fallback
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

const buildEnvironmentMap = ({
  domain,
  siteUrl,
  supportEmail,
  apiBaseUrl,
  authority,
  metadataUrl,
  clientId,
  scope,
  responseType,
  loginCallbackPath,
  redirectUri,
  postLogoutRedirectUri,
  logoutUri,
  serviceWorkerEnabled,
  serviceWorkerUrl,
}) => {
  return {
    VITE_SITE_DOMAIN: domain,
    VITE_SITE_URL: siteUrl,
    VITE_SUPPORT_EMAIL: supportEmail,
    VITE_API_BASE_URL: apiBaseUrl,
    VITE_COGNITO_AUTHORITY: authority,
    VITE_COGNITO_METADATA_URL: metadataUrl ?? '',
    VITE_COGNITO_CLIENT_ID: clientId,
    VITE_COGNITO_SCOPE: scope,
    VITE_RESPONSE_TYPE: responseType,
    VITE_LOGIN_CALLBACK_PATH: loginCallbackPath,
    VITE_REDIRECT_URI: redirectUri,
    VITE_COGNITO_POST_LOGOUT_REDIRECT_URI: postLogoutRedirectUri,
    VITE_LOGOUT_URI: logoutUri,
    VITE_ENABLE_SW: serviceWorkerEnabled ? 'true' : 'false',
    VITE_SW_URL: serviceWorkerUrl,
  }
}

const rawAutomationDefaults = {
  variant: 'basic',
  providerOrder: copyBlueprintOrder(),
  layoutRegions: copyLayoutRegions(),
  tenantControls: APP_BASIC_TENANT_CONTROLS,
  environment: {
    variables: ENVIRONMENT_VARIABLES,
  },
  ci: {
    commands: DEFAULT_AUTOMATION_CI_COMMANDS,
  },
  notes: [
    'Use createAppBasicAutomationScaffold to derive tenant plans consumed by <AppBasic /> during automation.',
    'Environment variables default to the shared Guidogerb infrastructure but can be overridden per tenant.',
  ],
}

export const APP_BASIC_AUTOMATION_DEFAULTS = deepFreeze(rawAutomationDefaults)

export const createAppBasicAutomationScaffold = ({
  tenant = {},
  env = {},
  planOverrides = {},
} = {}) => {
  const tenantDomain = ensureString(env.VITE_SITE_DOMAIN) || ensureString(tenant.domain)
  const domain = tenantDomain || DEFAULT_AUTOMATION_DOMAIN

  const rawSiteUrl = ensureString(env.VITE_SITE_URL)
  const siteUrl = stripTrailingSlash(rawSiteUrl || `https://${domain}`)

  const loginCallbackPath = ensurePath(
    env.VITE_LOGIN_CALLBACK_PATH,
    APP_BASIC_DEFAULTS.auth.loginCallbackPath || '/auth/callback',
  )
  const redirectUri = ensureString(env.VITE_REDIRECT_URI) || `${siteUrl}${loginCallbackPath}`

  const supportEmail = ensureString(env.VITE_SUPPORT_EMAIL) || ensureString(tenant.supportEmail) || DEFAULT_AUTOMATION_SUPPORT_EMAIL

  const authority = ensureString(env.VITE_COGNITO_AUTHORITY) || APP_BASIC_DEFAULTS.auth.authority
  const metadataUrl = ensureString(env.VITE_COGNITO_METADATA_URL) || undefined
  const clientId = ensureString(env.VITE_COGNITO_CLIENT_ID) || APP_BASIC_DEFAULTS.auth.client_id
  const scope = ensureString(env.VITE_COGNITO_SCOPE) || APP_BASIC_DEFAULTS.auth.scope
  const responseType = ensureString(env.VITE_RESPONSE_TYPE) || APP_BASIC_DEFAULTS.auth.response_type

  const postLogoutRedirectUri =
    ensureString(env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI) || `${siteUrl}${DEFAULT_AUTOMATION_LOGOUT_PATH}`
  const logoutUri = ensureString(env.VITE_LOGOUT_URI) || postLogoutRedirectUri

  const apiBaseUrl = ensureString(env.VITE_API_BASE_URL) || APP_BASIC_DEFAULTS.api.baseUrl

  const serviceWorkerEnabled = coerceBoolean(env.VITE_ENABLE_SW, APP_BASIC_DEFAULTS.serviceWorker.enabled)
  const serviceWorkerUrl = ensureString(env.VITE_SW_URL) || APP_BASIC_DEFAULTS.serviceWorker.url

  const displayName = ensureString(tenant.displayName) || DEFAULT_AUTOMATION_DISPLAY_NAME

  const baseConfig = {
    api: {
      baseUrl: apiBaseUrl,
    },
    auth: {
      authority,
      metadataUrl,
      clientId,
      redirectUri,
      responseType,
      scope,
      postLogoutRedirectUri,
      logoutUri,
    },
    navigation: {
      items: cloneNavigationItems(supportEmail),
    },
    header: {
      settings: {
        brand: {
          title: displayName,
          tagline: DEFAULT_AUTOMATION_TAGLINE,
          href: '/',
        },
      },
    },
    footer: {
      brand: { name: displayName, href: '/' },
      description: 'Replace this placeholder copy with tenant-specific storytelling highlights.',
      socialLinks: [{ label: 'Email', href: `mailto:${supportEmail}`, external: true }],
      legalLinks: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    serviceWorker: {
      enabled: serviceWorkerEnabled,
      url: serviceWorkerUrl,
    },
  }

  const mergedConfig = {
    ...planOverrides,
    api: { ...baseConfig.api, ...(planOverrides.api ?? {}) },
    auth: { ...baseConfig.auth, ...(planOverrides.auth ?? {}) },
    navigation: { ...baseConfig.navigation, ...(planOverrides.navigation ?? {}) },
    header: {
      ...baseConfig.header,
      ...(planOverrides.header ?? {}),
      settings: {
        ...(baseConfig.header?.settings ?? {}),
        ...(planOverrides.header?.settings ?? {}),
        brand: {
          ...(baseConfig.header?.settings?.brand ?? {}),
          ...(planOverrides.header?.settings?.brand ?? {}),
        },
      },
    },
    footer: { ...baseConfig.footer, ...(planOverrides.footer ?? {}) },
    serviceWorker: { ...baseConfig.serviceWorker, ...(planOverrides.serviceWorker ?? {}) },
  }

  const plan = createAppBasicPlan(mergedConfig)

  const environment = buildEnvironmentMap({
    domain,
    siteUrl,
    supportEmail,
    apiBaseUrl: plan.api.baseUrl ?? apiBaseUrl,
    authority: plan.providers.auth.props.authority ?? authority,
    metadataUrl,
    clientId: plan.providers.auth.props.client_id,
    scope: plan.providers.auth.props.scope,
    responseType: plan.providers.auth.props.response_type,
    loginCallbackPath,
    redirectUri: plan.providers.auth.props.redirect_uri,
    postLogoutRedirectUri: plan.providers.auth.props.post_logout_redirect_uri,
    logoutUri: plan.providers.auth.logoutUri,
    serviceWorkerEnabled: plan.serviceWorker.enabled,
    serviceWorkerUrl: plan.serviceWorker.url,
  })

  return {
    tenant: {
      domain,
      displayName,
      supportEmail,
    },
    environment,
    ci: APP_BASIC_AUTOMATION_DEFAULTS.ci,
    plan,
    summary: {
      providerOrder: plan.providerBlueprint.order,
      layoutRegions: plan.layoutBlueprint.regions.map((region) => region.id),
    },
  }
}

export default createAppBasicAutomationScaffold
