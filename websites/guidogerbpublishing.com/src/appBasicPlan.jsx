import { createAppBasicAutomationScaffold } from '@guidogerb/components-app'
import headerSettings from './headerSettings.js'
import footerSettings from './footerSettings.js'
import FooterContact from './FooterContact.jsx'
import {
  MarketingLanding,
  PartnerPortalRoute,
  MaintenanceRoute,
  NotFoundRoute,
} from './App.jsx'

const TENANT_DOMAIN = 'guidogerbpublishing.com'
const TENANT_DISPLAY_NAME = 'GuidoGerb Publishing'
const TENANT_SUPPORT_EMAIL = 'hello@guidogerbpublishing.com'

const DEFAULT_ENV_OVERRIDES = {
  VITE_SITE_DOMAIN: TENANT_DOMAIN,
  VITE_SITE_URL: `https://${TENANT_DOMAIN}`,
  VITE_SUPPORT_EMAIL: TENANT_SUPPORT_EMAIL,
  VITE_API_BASE_URL: 'https://api.guidogerb.dev/',
  VITE_COGNITO_AUTHORITY: 'https://auth.guidogerb.dev',
  VITE_COGNITO_CLIENT_ID: 'guidogerb.app',
  VITE_COGNITO_SCOPE: 'openid profile email',
  VITE_RESPONSE_TYPE: 'code',
  VITE_LOGOUT_URI: `https://${TENANT_DOMAIN}/auth/logout`,
  VITE_COGNITO_POST_LOGOUT_REDIRECT_URI: `https://${TENANT_DOMAIN}/auth/logout`,
  VITE_LOGIN_CALLBACK_PATH: '/auth/callback',
  VITE_ENABLE_SW: 'false',
}

const NAVIGATION_ITEMS = [
  { id: 'solutions', label: 'Solutions', href: '/solutions' },
  { id: 'platform', label: 'Platform', href: '/platform' },
  { id: 'distribution', label: 'Distribution', href: '/distribution' },
  { id: 'resources', label: 'Resources', href: '/resources' },
  { id: 'newsletter', label: 'Newsletter', href: '/newsletter' },
  { id: 'partner-portal', label: 'Partner portal', href: '/partner-portal' },
  { id: 'contact', label: 'Contact', href: '/contact' },
  {
    id: 'support',
    label: 'Support',
    href: 'mailto:support@guidogerbpublishing.com',
    external: true,
  },
]

const MARKETING_ROUTES = [
  { path: '/', focusSectionId: undefined },
  { path: '/solutions', focusSectionId: 'solutions' },
  { path: '/platform', focusSectionId: 'platform' },
  { path: '/distribution', focusSectionId: 'distribution' },
  { path: '/resources', focusSectionId: 'resources' },
  { path: '/newsletter', focusSectionId: 'newsletter' },
  { path: '/contact', focusSectionId: 'contact' },
  { path: '/auth/callback', focusSectionId: undefined },
]

const runtimeEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

const readEnv = (env = {}, key, fallback) => {
  if (env[key] !== undefined && env[key] !== null && env[key] !== '') {
    return env[key]
  }
  if (runtimeEnv[key] !== undefined) {
    return runtimeEnv[key]
  }
  return fallback
}

export const createGuidogerbPublishingAppBasicConfig = (options = {}) => {
  const env = options.env ?? {}

  const logoutUri = readEnv(env, 'VITE_LOGOUT_URI', DEFAULT_ENV_OVERRIDES.VITE_LOGOUT_URI)
  const loginCallbackPath = readEnv(
    env,
    'VITE_LOGIN_CALLBACK_PATH',
    DEFAULT_ENV_OVERRIDES.VITE_LOGIN_CALLBACK_PATH,
  )
  const serviceWorkerEnabled = readEnv(env, 'VITE_ENABLE_SW', DEFAULT_ENV_OVERRIDES.VITE_ENABLE_SW)

  return {
    api: {
      baseUrl: readEnv(env, 'VITE_API_BASE_URL', DEFAULT_ENV_OVERRIDES.VITE_API_BASE_URL),
    },
    auth: {
      authority: readEnv(env, 'VITE_COGNITO_AUTHORITY', DEFAULT_ENV_OVERRIDES.VITE_COGNITO_AUTHORITY),
      metadataUrl: readEnv(env, 'VITE_COGNITO_METADATA_URL', ''),
      client_id: readEnv(env, 'VITE_COGNITO_CLIENT_ID', DEFAULT_ENV_OVERRIDES.VITE_COGNITO_CLIENT_ID),
      redirect_uri: readEnv(env, 'VITE_REDIRECT_URI', undefined),
      response_type: readEnv(env, 'VITE_RESPONSE_TYPE', DEFAULT_ENV_OVERRIDES.VITE_RESPONSE_TYPE),
      scope: readEnv(env, 'VITE_COGNITO_SCOPE', DEFAULT_ENV_OVERRIDES.VITE_COGNITO_SCOPE),
      post_logout_redirect_uri: readEnv(
        env,
        'VITE_COGNITO_POST_LOGOUT_REDIRECT_URI',
        logoutUri,
      ),
      logoutUri,
      loginCallbackPath,
    },
    navigation: {
      items: NAVIGATION_ITEMS,
    },
    header: {
      settings: headerSettings,
    },
    footer: {
      ...footerSettings,
      children: <FooterContact />,
    },
    publicPages: {
      landing: {
        path: '/',
        Component: MarketingLanding,
        componentProps: { logoutUri },
      },
      routes: [
        ...MARKETING_ROUTES.filter((route) => route.path !== '/').map((route) => ({
          path: route.path,
          Component: MarketingLanding,
          componentProps: { focusSectionId: route.focusSectionId, logoutUri },
        })),
        {
          path: '/maintenance',
          Component: MaintenanceRoute,
        },
      ],
      fallback: {
        element: <NotFoundRoute />,
      },
    },
    protectedPages: {
      routes: [
        {
          path: '/partner-portal',
          Component: PartnerPortalRoute,
          componentProps: { logoutUri },
        },
      ],
    },
    serviceWorker: {
      enabled: `${serviceWorkerEnabled}` === 'true',
    },
  }
}

export const guidogerbPublishingAutomationScaffold = createAppBasicAutomationScaffold({
  tenant: {
    domain: TENANT_DOMAIN,
    displayName: TENANT_DISPLAY_NAME,
    supportEmail: TENANT_SUPPORT_EMAIL,
  },
  env: DEFAULT_ENV_OVERRIDES,
  planOverrides: createGuidogerbPublishingAppBasicConfig({ env: DEFAULT_ENV_OVERRIDES }),
})

export const guidogerbPublishingAppBasicProps = createGuidogerbPublishingAppBasicConfig()

export default guidogerbPublishingAutomationScaffold
