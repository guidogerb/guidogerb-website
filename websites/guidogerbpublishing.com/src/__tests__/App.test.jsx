import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppBasic } from '@guidogerb/components-app'
import {
  createGuidogerbPublishingAppBasicConfig,
  guidogerbPublishingAutomationScaffold,
} from '../appBasicPlan.jsx'

const { mockUseAuth, mockRegisterSW } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockRegisterSW: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    __esModule: true,
    ...actual,
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: mockUseAuth,
  }
})

vi.mock('@guidogerb/components-sw', () => ({
  __esModule: true,
  registerSW: (...args) => mockRegisterSW(...args),
}))

vi.mock('@guidogerb/components-router-protected', () => ({
  __esModule: true,
  ProtectedRouter: ({ routes = [], fallback, routerOptions }) => {
    const initialEntries = routerOptions?.initialEntries ?? ['/']
    const path = Array.isArray(initialEntries) ? initialEntries[0] : initialEntries ?? '/'
    const match = routes.find((route) => route.path === path)
    if (match?.element) {
      return match.element
    }
    if (fallback?.element) {
      return fallback.element
    }
    return null
  },
}))

beforeEach(() => {
  mockUseAuth.mockReset()
  mockUseAuth.mockReturnValue({
    isAuthenticated: true,
    user: {
      profile: {
        name: 'Catalog Partner',
        email: 'partner@example.com',
      },
    },
  })
  mockRegisterSW.mockReset()
})

function renderApp(initialPath = '/', envOverrides = {}) {
  const config = createGuidogerbPublishingAppBasicConfig({ env: envOverrides })
  config.protectedPages = {
    ...config.protectedPages,
    routerOptions: {
      routerOptions: { initialEntries: [initialPath] },
    },
  }
  return render(<AppBasic {...config} />)
}

describe('GuidoGerb Publishing AppBasic integration', () => {
  it('renders marketing landing content and navigation', () => {
    renderApp('/')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /GuidoGerb Publishing brings manuscripts to market/i,
      }),
    ).toBeInTheDocument()
    const subheadings = screen.getAllByRole('heading', {
      level: 2,
      name: /Work with GuidoGerb Publishing/i,
    })
    expect(subheadings.length).toBeGreaterThan(0)
    subheadings.forEach((heading) => expect(heading).toBeVisible())
  })

  it('exposes the partner portal route when navigating to /partner-portal', () => {
    const config = createGuidogerbPublishingAppBasicConfig()
    const partnerRoute = config.protectedPages.routes.find((route) => route.path === '/partner-portal')
    expect(partnerRoute).toEqual(
      expect.objectContaining({
        path: '/partner-portal',
        componentProps: expect.objectContaining({ logoutUri: expect.any(String) }),
      }),
    )
  })

  it('renders the maintenance status page component', () => {
    const config = createGuidogerbPublishingAppBasicConfig()
    const maintenanceRoute = config.publicPages.routes.find((route) => route.path === '/maintenance')
    expect(maintenanceRoute?.Component).toBeDefined()
    if (maintenanceRoute?.Component) {
      const { Component, componentProps } = maintenanceRoute
      render(<Component {...componentProps} />)

      expect(
        screen.getByRole('heading', { level: 1, name: /Partner portal undergoing updates/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Request status update' })).toHaveAttribute(
        'href',
        expect.stringContaining('partners@guidogerbpublishing.com'),
      )
    }
  })

  it('falls back to the localized not-found page for unknown routes', () => {
    const config = createGuidogerbPublishingAppBasicConfig()
    const fallbackElement = config.publicPages.fallback?.element
    expect(fallbackElement).toBeTruthy()
    render(fallbackElement)

    expect(
      screen.getByRole('heading', { level: 1, name: /Catalog page not found/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email catalog support' })).toHaveAttribute(
      'href',
      expect.stringContaining('portal%20support'),
    )
  })

  it('loads CMS-driven marketing content when the API URL is provided', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          hero: { title: 'CMS Powered Publishing', highlights: [{ label: '50+', description: 'launches' }] },
          platform: [
            {
              title: 'CMS Platform',
              description: 'Author content streamed from CMS',
              features: ['CMS bullet'],
            },
          ],
          distribution: [],
          resources: [],
          newsletter: {
            title: 'CMS Newsletter',
            description: 'Stay in sync',
            formLabel: 'CMS Form',
            buttonLabel: 'Join CMS',
            placeholder: 'cms@example.com',
          },
        }),
    })

    const originalFetch = global.fetch
    global.fetch = fetchSpy

    vi.stubEnv('VITE_API_BASE_URL', 'https://cms.example.com')

    try {
      renderApp('/')

      expect(await screen.findByRole('heading', { level: 1, name: 'CMS Powered Publishing' })).toBeVisible()
      expect(screen.getByText('Author content streamed from CMS')).toBeInTheDocument()
      expect(screen.getByText('CMS bullet')).toBeInTheDocument()
      expect(screen.getByRole('form', { name: 'CMS Form' })).toBeInTheDocument()
      expect(fetchSpy).toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
      vi.unstubAllEnvs()
    }
  })

  it('aligns automation scaffolding with the published navigation', () => {
    expect(guidogerbPublishingAutomationScaffold.tenant.domain).toBe('guidogerbpublishing.com')
    expect(guidogerbPublishingAutomationScaffold.plan.navigation.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Solutions', href: '/solutions' }),
        expect.objectContaining({ label: 'Partner portal', href: '/partner-portal' }),
      ]),
    )
  })
})
