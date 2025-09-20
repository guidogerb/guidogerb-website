import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}))

async function renderWelcome(props = {}) {
  const module = await import('../index.jsx')
  const Welcome = module.default
  return render(<Welcome {...props} />)
}

describe('Guidogerb Publishing welcome component', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    mockUseAuth.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders an error message when authentication fails', async () => {
    mockUseAuth.mockReturnValue({
      error: { message: 'Network unavailable' },
    })

    const { container } = await renderWelcome()

    const error = container.querySelector('.welcome-error')
    expect(error).toBeInTheDocument()
    expect(error).toHaveTextContent('Sign-in failed: Network unavailable')
  })

  it('shows a loading indicator while authentication is pending', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    const { container } = await renderWelcome()

    const loading = container.querySelector('.welcome-loading')
    expect(loading).toBeInTheDocument()
    expect(loading).toHaveTextContent('Loading partner workspace…')
  })

  it('renders partner details and default resource links when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Catalog Partner',
          email: 'partner@example.com',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="nested">Nested widget</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, Catalog Partner!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as partner@example.com')).toBeInTheDocument()
    expect(screen.getByTestId('nested')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Download release calendar/i }),
    ).toHaveAttribute('href', '/files/release-calendar.xlsx')
    expect(
      screen.getByRole('link', { name: /Review latest royalty template/i }),
    ).toHaveAttribute('href', '/files/royalty-report-sample.pdf')
    expect(
      screen.getByRole('link', { name: /Email publishing operations/i }),
    ).toHaveAttribute(
      'href',
      'mailto:partners@guidogerbpublishing.com?subject=Catalog%20update%20request',
    )
  })

  it('uses configured resource URLs and mailto address when provided', async () => {
    vi.stubEnv('VITE_PARTNER_RESOURCES_RELEASE_CALENDAR_URL', 'https://cdn.example.com/calendar.xlsx')
    vi.stubEnv('VITE_PARTNER_RESOURCES_ROYALTY_TEMPLATE_URL', '/assets/royalty.pdf')
    vi.stubEnv('VITE_PARTNER_RESOURCES_OPERATIONS_EMAIL', 'ops@example.com')
    vi.stubEnv('VITE_PARTNER_RESOURCES_OPERATIONS_EMAIL_SUBJECT', 'Metadata sync request')

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'catalog-admin',
        },
      },
    })

    await renderWelcome()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, catalog-admin!' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Download release calendar/i }),
    ).toHaveAttribute('href', 'https://cdn.example.com/calendar.xlsx')
    expect(
      screen.getByRole('link', { name: /Review latest royalty template/i }),
    ).toHaveAttribute('href', '/assets/royalty.pdf')
    expect(
      screen.getByRole('link', { name: /Email publishing operations/i }),
    ).toHaveAttribute('href', 'mailto:ops@example.com?subject=Metadata%20sync%20request')
  })
})
