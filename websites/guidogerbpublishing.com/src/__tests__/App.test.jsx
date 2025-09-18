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

async function renderApp() {
  const AppModule = await import('../App.jsx')
  const App = AppModule.default
  return render(<App />)
}

describe('GuidoGerb Publishing website App', () => {
  let originalScrollIntoView
  const scrollSpy = vi.fn()

  beforeEach(() => {
    vi.resetModules()

    originalScrollIntoView = globalThis.Element?.prototype?.scrollIntoView

    mockProtected.mockClear()

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

    scrollSpy.mockClear()
    if (globalThis.Element?.prototype) {
      globalThis.Element.prototype.scrollIntoView = function scrollIntoViewSpy(...args) {
        scrollSpy(this, ...args)
      }
    }
  })

  afterEach(() => {
    if (originalScrollIntoView && globalThis.Element?.prototype) {
      globalThis.Element.prototype.scrollIntoView = originalScrollIntoView
    }
    vi.unstubAllEnvs()
  })

  it('renders the landing page content and configures the partner portal guard', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /GuidoGerb Publishing brings manuscripts to market with full-service production and rights management/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Partner operations portal',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Welcome back, Catalog Partner!',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Signed in as partner@example.com')).toBeInTheDocument()

    expect(mockProtected).toHaveBeenCalledWith(
      expect.objectContaining({
        logoutUri: '/logout',
      }),
    )
  })

  it('activates header navigation links and scrolls to the matching section', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()
    const user = userEvent.setup()
    const platformLink = await screen.findByRole('link', { name: /Platform/ })

    await user.click(platformLink)

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/platform')

    const lastScrollCall = scrollSpy.mock.calls.at(-1)
    expect(lastScrollCall?.[0]).toHaveProperty('id', 'platform')

    await waitFor(() => {
      expect(platformLink).toHaveAttribute('aria-current', 'page')
    })

    pushStateSpy.mockRestore()
  })

  it('renders the shared footer and routes footer navigation through the handler', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Work with GuidoGerb Publishing')
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/company/guidogerb',
    )

    const user = userEvent.setup()
    const partnerLink = await within(footer).findByRole('link', { name: /Partner portal/i })

    await user.click(partnerLink)

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/partner-portal')
    const lastScrollCall = scrollSpy.mock.calls.at(-1)
    expect(lastScrollCall?.[0]).toHaveProperty('id', 'partner-portal')

    pushStateSpy.mockRestore()
  })
})
