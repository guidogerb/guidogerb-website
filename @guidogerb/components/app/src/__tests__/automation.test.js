import { describe, expect, it } from 'vitest'

import { APP_BASIC_AUTOMATION_DEFAULTS, createAppBasicAutomationScaffold } from '../automation.js'

describe('APP_BASIC_AUTOMATION_DEFAULTS', () => {
  it('documents provider order, layout regions, CI commands, and environment variables', () => {
    expect(Object.isFrozen(APP_BASIC_AUTOMATION_DEFAULTS)).toBe(true)
    expect(APP_BASIC_AUTOMATION_DEFAULTS.providerOrder).toEqual(['storage', 'auth', 'header', 'ui'])
    expect(APP_BASIC_AUTOMATION_DEFAULTS.layoutRegions.map((region) => region.id)).toEqual([
      'header',
      'main',
      'footer',
    ])
    expect(APP_BASIC_AUTOMATION_DEFAULTS.ci.commands).toEqual(
      expect.arrayContaining(['pnpm clean', 'pnpm install', 'pnpm build', 'pnpm lint', 'pnpm test']),
    )
    const variableKeys = APP_BASIC_AUTOMATION_DEFAULTS.environment.variables.map((variable) => variable.key)
    expect(variableKeys).toEqual(
      expect.arrayContaining([
        'VITE_SITE_DOMAIN',
        'VITE_API_BASE_URL',
        'VITE_COGNITO_AUTHORITY',
        'VITE_COGNITO_CLIENT_ID',
        'VITE_LOGIN_CALLBACK_PATH',
        'VITE_REDIRECT_URI',
        'VITE_ENABLE_SW',
      ]),
    )
  })
})

describe('createAppBasicAutomationScaffold', () => {
  it('produces a tenant-aware plan and environment defaults', () => {
    const scaffold = createAppBasicAutomationScaffold({
      tenant: {
        domain: 'stories.example.com',
        displayName: 'Stories Example',
        supportEmail: 'help@example.com',
      },
    })

    expect(scaffold.tenant).toEqual(
      expect.objectContaining({
        domain: 'stories.example.com',
        displayName: 'Stories Example',
        supportEmail: 'help@example.com',
      }),
    )

    expect(scaffold.environment).toEqual(
      expect.objectContaining({
        VITE_SITE_DOMAIN: 'stories.example.com',
        VITE_SITE_URL: 'https://stories.example.com',
        VITE_REDIRECT_URI: 'https://stories.example.com/auth/callback',
        VITE_LOGOUT_URI: 'https://stories.example.com/auth/logout',
        VITE_SUPPORT_EMAIL: 'help@example.com',
      }),
    )

    expect(scaffold.plan.variant).toBe('basic')
    expect(scaffold.plan.navigation.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'support', href: 'mailto:help@example.com', external: true }),
      ]),
    )
  })

  it('honours environment and plan overrides when generating the scaffold', () => {
    const scaffold = createAppBasicAutomationScaffold({
      tenant: { domain: 'tenant.example.com' },
      env: {
        VITE_API_BASE_URL: 'https://api.tenant.example/',
        VITE_ENABLE_SW: 'true',
      },
      planOverrides: {
        serviceWorker: { url: '/custom-sw.js' },
      },
    })

    expect(scaffold.environment).toEqual(
      expect.objectContaining({
        VITE_API_BASE_URL: 'https://api.tenant.example/',
        VITE_ENABLE_SW: 'true',
        VITE_SW_URL: '/custom-sw.js',
      }),
    )

    expect(scaffold.plan.serviceWorker).toEqual(
      expect.objectContaining({ enabled: true, url: '/custom-sw.js' }),
    )
    expect(scaffold.plan.api).toEqual(expect.objectContaining({ baseUrl: 'https://api.tenant.example/' }))
  })
})
