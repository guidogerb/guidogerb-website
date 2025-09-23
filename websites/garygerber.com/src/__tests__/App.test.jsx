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

describe('Gary Gerber website App', () => {
  let originalScrollIntoView
  const scrollSpy = vi.fn()

  beforeEach(() => {
    vi.resetModules()

    originalScrollIntoView = globalThis.Element?.prototype?.scrollIntoView

    window.history.replaceState({}, '', '/')

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
    window.history.replaceState({}, '', '/')
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
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Everything you need for the next residency',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Upcoming schedule' })).toBeInTheDocument()
    expect(
      screen.getByText('Tech rehearsal — Northern Lights residency'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open full calendar' })).toHaveAttribute(
      'href',
      'https://calendar.google.com/calendar/u/0?cid=Z2FyeWdlcmJlci5jb21fcmVoZWFyc2Fsc0BleGFtcGxlLmNvbQ',
    )
    expect(screen.getByRole('link', { name: 'Call +1 (612) 555-0148' })).toBeInTheDocument()

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

  it('renders the shared footer and routes footer links through the navigation handler', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Bookings & inquiries')
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/garygerbermusic',
    )

    const user = userEvent.setup()
    const rehearsalLink = await within(footer).findByRole('link', { name: /Rehearsal room/i })

    await user.click(rehearsalLink)

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/rehearsal')
    const lastScrollCall = scrollSpy.mock.calls.at(-1)
    expect(lastScrollCall?.[0]).toHaveProperty('id', 'client-access')

    pushStateSpy.mockRestore()
  })

  it('renders a localized not-found page when navigating to an unknown route', async () => {
    vi.stubEnv('VITE_LOGOUT_URI', '/logout')

    window.history.replaceState({}, '', '/missing-page')
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    await renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: 'We couldn’t find that page' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/the link has been retired between tour stops/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Email production team' })).toHaveAttribute(
      'href',
      expect.stringContaining('hello@garygerber.com'),
    )
    expect(screen.getByRole('link', { name: 'Call +1 (612) 555-0148' })).toHaveAttribute(
      'href',
      'tel:+16125550148',
    )
    expect(mockProtected).not.toHaveBeenCalled()

    const user = userEvent.setup()
    const homeLink = screen.getByRole('link', { name: 'Back to main stage' })

    await user.click(homeLink)

    expect(pushStateSpy).toHaveBeenCalledWith({}, '', '/')

    pushStateSpy.mockRestore()
  })
})
