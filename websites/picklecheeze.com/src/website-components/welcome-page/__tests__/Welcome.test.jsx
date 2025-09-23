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

describe('PickleCheeze welcome component', () => {
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
    expect(loading).toHaveTextContent('Loading partner pantry…')
  })

  it('renders partner details and default resource links when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Fermentation Lead',
          email: 'ferment@example.com',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="nested">Partner slot</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, Fermentation Lead!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as ferment@example.com')).toBeInTheDocument()
    expect(screen.getByTestId('nested')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Download current cellar inventory/i })).toHaveAttribute(
      'href',
      '/files/picklecheeze-cellar-inventory.pdf',
    )
    expect(screen.getByRole('link', { name: /Cheeze care & plating guide/i })).toHaveAttribute(
      'href',
      '/files/cheese-care-guide.pdf',
    )
    expect(screen.getByRole('link', { name: /Email the fermentation team/i })).toHaveAttribute(
      'href',
      'mailto:partners@picklecheeze.com?subject=Partner%20portal%20question',
    )
  })

  it('uses configured resource URLs and contact details when provided', async () => {
    vi.stubEnv('VITE_PARTNER_RESOURCES_INVENTORY_URL', 'https://cdn.example.com/inventory.pdf')
    vi.stubEnv('VITE_PARTNER_RESOURCES_CARE_GUIDE_URL', '/assets/care-guide.pdf')
    vi.stubEnv('VITE_PARTNER_RESOURCES_CONTACT_EMAIL', 'support@picklecheeze.com')
    vi.stubEnv('VITE_PARTNER_RESOURCES_CONTACT_EMAIL_SUBJECT', 'Fermentation question')

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'cellar-chief',
        },
      },
    })

    await renderWelcome()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, cellar-chief!' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Download current cellar inventory/i })).toHaveAttribute(
      'href',
      'https://cdn.example.com/inventory.pdf',
    )
    expect(screen.getByRole('link', { name: /Cheeze care & plating guide/i })).toHaveAttribute(
      'href',
      '/assets/care-guide.pdf',
    )
    expect(screen.getByRole('link', { name: /Email the fermentation team/i })).toHaveAttribute(
      'href',
      'mailto:support@picklecheeze.com?subject=Fermentation%20question',
    )
  })

  it('shows an empty state when all resource flags are disabled', async () => {
    vi.stubEnv('VITE_FLAG_PARTNER_INVENTORY', 'false')
    vi.stubEnv('VITE_FLAG_PARTNER_CARE_GUIDE', 'false')
    vi.stubEnv('VITE_FLAG_PARTNER_CONTACT_EMAIL', 'false')

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {},
      },
    })

    const { container } = await renderWelcome()

    expect(container.querySelector('.welcome-links')).not.toBeInTheDocument()
    const empty = container.querySelector('.welcome-empty')
    expect(empty).toBeInTheDocument()
    expect(empty).toHaveTextContent('New partner resources are curing')
  })
})
