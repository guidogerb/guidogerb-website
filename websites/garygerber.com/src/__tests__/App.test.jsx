import { render, screen, waitFor } from '@testing-library/react'
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

describe('Gary Gerber website App', () => {
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
          name: 'Guest Artist',
          email: 'guest@example.com',
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

  it('renders the landing page content and configures the rehearsal room guard', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Gary Gerber shapes performances that stay with audiences long after the final encore/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Client rehearsal room',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Welcome back, Guest Artist!',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Signed in as guest@example.com')).toBeInTheDocument()

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
    const programsLink = await screen.findByRole('link', { name: /Programs/ })

    await user.click(programsLink)

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/programs')

    const lastScrollCall = scrollSpy.mock.calls.at(-1)
    expect(lastScrollCall?.[0]).toHaveProperty('id', 'programs')

    await waitFor(() => {
      expect(programsLink).toHaveAttribute('aria-current', 'page')
    })

    pushStateSpy.mockRestore()
  })
})
