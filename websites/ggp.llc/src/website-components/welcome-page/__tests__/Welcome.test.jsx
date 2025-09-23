import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('GGP.llc welcome component', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
  })

  it('renders an error message when authentication fails', async () => {
    mockUseAuth.mockReturnValue({ error: { message: 'Session expired' } })

    await renderWelcome()

    expect(screen.getByText('Sign-in failed: Session expired')).toBeInTheDocument()
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderWelcome()

    expect(screen.getByText('Loading regulator workspace…')).toBeInTheDocument()
  })

  it('renders regulator details, curated links, and nested content once authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Jordan Compliance',
          email: 'jordan.compliance@ggp.llc',
          'custom:agencyName': 'Midwest Utilities Commission',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="slot">Portal widgets</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome Jordan Compliance' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Midwest Utilities Commission regulator workspace')).toBeInTheDocument()
    expect(screen.getByText('Signed in as jordan.compliance@ggp.llc')).toBeInTheDocument()

    const filingsHeading = screen.getByRole('heading', {
      level: 4,
      name: 'Filings & compliance deadlines',
    })
    expect(filingsHeading).toBeInTheDocument()
    const filingsLinks = within(filingsHeading.closest('section')).getAllByRole('link')
    expect(filingsLinks[0]).toHaveAttribute('href', 'https://compliance.ggp.llc/filings/calendar')
    expect(filingsLinks[0]).toHaveTextContent('Review filing calendar')
    expect(filingsLinks[1]).toHaveAttribute('href', 'https://compliance.ggp.llc/forms/annual-report')
    expect(filingsLinks[1]).toHaveTextContent('Submit annual compliance report')
    expect(filingsLinks[2]).toHaveAttribute(
      'href',
      'https://compliance.ggp.llc/resources/emergency-order-toolkit.pdf',
    )
    expect(filingsLinks[2]).toHaveTextContent('Download emergency order toolkit')

    const licensingHeading = screen.getByRole('heading', { level: 4, name: 'Licensing dashboards' })
    expect(licensingHeading).toBeInTheDocument()
    const licensingLinks = within(licensingHeading.closest('section')).getAllByRole('link')
    expect(licensingLinks[0]).toHaveAttribute('href', 'https://portal.ggp.llc/licensing/dashboard')
    expect(licensingLinks[0]).toHaveTextContent('Open licensing cases')
    expect(licensingLinks[1]).toHaveAttribute('href', 'https://portal.ggp.llc/licensing/escalations')
    expect(licensingLinks[2]).toHaveAttribute('href', 'https://portal.ggp.llc/licensing/renewals')

    const aiHeading = screen.getByRole('heading', { level: 4, name: 'AI assistance & training' })
    expect(aiHeading).toBeInTheDocument()
    const aiLinks = within(aiHeading.closest('section')).getAllByRole('link')
    expect(aiLinks[0]).toHaveAttribute('href', 'https://ai.ggp.llc/copilot')
    expect(aiLinks[1]).toHaveAttribute('href', 'https://ai.ggp.llc/resources/audit-trail.pdf')
    expect(aiLinks[2]).toHaveAttribute('href', 'mailto:innovation@ggp.llc')

    expect(screen.getByTestId('slot')).toHaveTextContent('Portal widgets')
  })

  it('falls back to the Cognito username when no profile name is provided', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'compliance-chief',
        },
      },
    })

    await renderWelcome()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome compliance-chief' }),
    ).toBeInTheDocument()
  })

  it('uses a generic fallback name when neither profile name nor username exist', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { profile: {} },
    })

    await renderWelcome()

    expect(screen.getByRole('heading', { level: 3, name: 'Welcome Regulator' })).toBeInTheDocument()
  })
})
