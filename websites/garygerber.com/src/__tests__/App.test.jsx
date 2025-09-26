import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppBasic } from '@guidogerb/components-app'
import {
  createGaryGerberAppBasicConfig,
  garyGerberAutomationScaffold,
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
        name: 'Guest Artist',
        email: 'guest@example.com',
      },
    },
  })
  mockRegisterSW.mockReset()
})

function renderApp(initialPath = '/') {
  const config = createGaryGerberAppBasicConfig()
  config.protectedPages = {
    ...config.protectedPages,
    routerOptions: {
      routerOptions: { initialEntries: [initialPath] },
    },
  }
  return render(<AppBasic {...config} />)
}

describe('Gary Gerber AppBasic integration', () => {
  it('renders marketing landing content with shared navigation', () => {
    renderApp('/')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Gary Gerber shapes performances that stay with audiences/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Bring Gary Gerber to your next residency/i,
      }),
    ).toBeInTheDocument()
  })

  it('exposes the protected rehearsal route in the plan configuration', () => {
    const config = createGaryGerberAppBasicConfig()
    const rehearsalRoute = config.protectedPages.routes.find((route) => route.path === '/rehearsal')
    expect(rehearsalRoute).toEqual(
      expect.objectContaining({
        path: '/rehearsal',
        componentProps: expect.objectContaining({ logoutUri: expect.any(String) }),
      }),
    )
  })

  it('falls back to the localized not-found route for unknown paths', () => {
    const config = createGaryGerberAppBasicConfig()
    const fallbackElement = config.publicPages.fallback?.element
    expect(fallbackElement).toBeTruthy()
    render(fallbackElement)

    expect(
      screen.getByRole('heading', { level: 1, name: /We couldn’t find that page/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email production team' })).toHaveAttribute(
      'href',
      expect.stringContaining('hello@garygerber.com'),
    )
  })

  it('exposes automation defaults aligned with the shared scaffold', () => {
    expect(garyGerberAutomationScaffold.tenant.domain).toBe('garygerber.com')
    expect(garyGerberAutomationScaffold.plan.navigation.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Programs', href: '/programs' }),
        expect.objectContaining({ label: 'Rehearsal room', href: '/rehearsal' }),
      ]),
    )
  })
})
