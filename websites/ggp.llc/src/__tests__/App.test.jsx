import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockProtected, mockUseAuth } = vi.hoisted(() => ({
  mockProtected: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: (props) => {
    mockProtected(props)
    return <div data-testid="protected-shell">{props.children}</div>
  },
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  Auth: ({ children }) => <>{children}</>,
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: mockUseAuth,
}))

vi.mock('../App.css', () => ({}), { virtual: true })

async function renderApp({ initialPath = '/' } = {}) {
  window.history.replaceState({}, '', initialPath)
  const AppModule = await import('../App.jsx')
  const App = AppModule.default
  return render(<App />)
}

describe('GGP.llc website App', () => {
  let originalScrollIntoView
  const scrollSpy = vi.fn()

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    mockProtected.mockClear()
    mockUseAuth.mockReset()
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Regulator One',
          email: 'regulator@example.gov',
          'custom:agencyName': 'State Modernization Office',
        },
      },
    })

    originalScrollIntoView = globalThis.Element?.prototype?.scrollIntoView
    scrollSpy.mockClear()
    if (globalThis.Element?.prototype) {
      globalThis.Element.prototype.scrollIntoView = function scrollIntoViewSpy(...args) {
        scrollSpy(this, ...args)
      }
    }

    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    if (originalScrollIntoView && globalThis.Element?.prototype) {
      globalThis.Element.prototype.scrollIntoView = originalScrollIntoView
    }
    vi.unstubAllEnvs()
  })

  it('renders the marketing narrative and portal preview for authenticated regulators', async () => {
    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /GGP Regulatory Platform unifies licensing, compliance, analytics, and AI assistance/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Portal preview: a secure home for regulators',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Welcome Regulator One/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Signed in as regulator@example.gov')).toBeInTheDocument()

    expect(mockProtected).toHaveBeenCalledWith(
      expect.objectContaining({
        logoutUri: '/logout',
      }),
    )
  })

  it('navigates to marketing sections through the header and scrolls to the target element', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()
    const user = userEvent.setup()

    const headerNav = screen.getByRole('navigation', { name: /Primary navigation/i })
    const complianceLink = await within(headerNav).findByRole('link', { name: /Compliance/ })

    await user.click(complianceLink)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/compliance')
    })

    const lastPush = pushStateSpy.mock.calls.at(-1)
    expect(lastPush?.[2]).toBe('/compliance')

    const lastScroll = scrollSpy.mock.calls.at(-1)
    expect(lastScroll?.[0]).toHaveProperty('id', 'compliance')

    pushStateSpy.mockRestore()
  })

  it('routes to the compliance portal skeleton when visiting the portal path', async () => {
    await renderApp({ initialPath: '/portal/compliance' })

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Compliance operations',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Roadmap focus areas',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Risk scoring blends historical outcomes with AI-detected anomalies.'),
    ).toBeInTheDocument()

    expect(mockProtected).toHaveBeenCalledWith(
      expect.objectContaining({
        logoutUri: '/logout',
      }),
    )
  })

  it('uses footer navigation to reach the contact section', async () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()
    const user = userEvent.setup()

    const footer = screen.getByRole('contentinfo')
    const contactLink = within(footer).getByRole('link', { name: 'Contact team' })

    await user.click(contactLink)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/contact')
    })

    const lastPush = pushStateSpy.mock.calls.at(-1)
    expect(lastPush?.[2]).toBe('/contact')

    const lastScroll = scrollSpy.mock.calls.at(-1)
    expect(lastScroll?.[0]).toHaveProperty('id', 'contact')

    pushStateSpy.mockRestore()
  })

  it('renders a branded 404 fallback when navigating to an unknown path', async () => {
    await renderApp({ initialPath: '/missing' })

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Regulatory page unavailable',
      }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Return to modernization overview' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Email modernization support' })).toHaveAttribute(
      'href',
      expect.stringContaining('innovation@ggp.llc'),
    )
  })

  it('serves a maintenance route with compliance-focused messaging', async () => {
    await renderApp({ initialPath: '/maintenance' })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Portal maintenance in progress' }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Schedule a modernization briefing' })).toHaveAttribute(
      'href',
      'https://calendly.com/ggp-regulation/modernization',
    )

    expect(screen.getByText(/roll out new oversight tooling/i)).toBeInTheDocument()
  })
})
