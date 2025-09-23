import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseAuth = vi.fn()

async function renderWelcome(props = {}) {
  const module = await import('../index.jsx')
  const Welcome = module.default
  return render(<Welcome useAuthHook={mockUseAuth} {...props} />)
}

describe('Gary Gerber welcome component', () => {
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
      error: { message: 'Sign-in blocked' },
    })

    await renderWelcome()

    expect(screen.getByText('Sign-in failed: Sign-in blocked')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderWelcome()

    expect(screen.getByText('Loading rehearsal room…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('renders collaborator details and default rehearsal resources when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Touring Pianist',
          email: 'pianist@example.com',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="nested">Portal content</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, Touring Pianist!' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as pianist@example.com')).toBeInTheDocument()
    expect(screen.getByTestId('nested')).toBeInTheDocument()
    expect(
      screen.getByText(
        /You now have access to scores, stage plots, and rehearsal notes for upcoming engagements\./i,
      ),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Download latest stage plot/i })).toHaveAttribute(
      'href',
      '/files/stage-plot.pdf',
    )
    expect(screen.getByRole('link', { name: /Rehearsal checklist/i })).toHaveAttribute(
      'href',
      '/files/rehearsal-checklist.pdf',
    )
    expect(screen.getByRole('link', { name: /Email production team/i })).toHaveAttribute(
      'href',
      'mailto:hello@garygerber.com?subject=Collaboration%20Notes',
    )
  })

  it('uses configured rehearsal resource links when environment overrides are provided', async () => {
    vi.stubEnv(
      'VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL',
      'https://cdn.example.com/plots/latest.pdf',
    )
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_CHECKLIST_URL', '/assets/custom-checklist.pdf')
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL', 'production@example.com')
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT', 'Updated rehearsal notes')

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'guest-performer',
        },
      },
    })

    await renderWelcome()

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome back, guest-performer!' }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Download latest stage plot/i })).toHaveAttribute(
      'href',
      'https://cdn.example.com/plots/latest.pdf',
    )
    expect(screen.getByRole('link', { name: /Rehearsal checklist/i })).toHaveAttribute(
      'href',
      '/assets/custom-checklist.pdf',
    )
    expect(screen.getByRole('link', { name: /Email production team/i })).toHaveAttribute(
      'href',
      'mailto:production@example.com?subject=Updated%20rehearsal%20notes',
    )
  })

  it('prefers provided rehearsal resources over configuration defaults', async () => {
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL', 'https://cdn.example.com/env-stage.pdf')
    vi.stubEnv(
      'VITE_REHEARSAL_RESOURCES_CHECKLIST_URL',
      'https://cdn.example.com/env-checklist.pdf',
    )
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL', 'env-team@example.com')
    vi.stubEnv('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT', 'Env subject should not appear')

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Touring Pianist',
        },
      },
    })

    await renderWelcome({
      rehearsalResources: {
        stagePlotHref: '/overrides/stage.pdf',
        rehearsalChecklistHref: '/overrides/checklist.pdf',
        productionEmailHref: 'mailto:custom@example.com?subject=Custom%20Plan',
      },
    })

    expect(screen.getByRole('link', { name: /Download latest stage plot/i })).toHaveAttribute(
      'href',
      '/overrides/stage.pdf',
    )
    expect(screen.getByRole('link', { name: /Rehearsal checklist/i })).toHaveAttribute(
      'href',
      '/overrides/checklist.pdf',
    )
    expect(screen.getByRole('link', { name: /Email production team/i })).toHaveAttribute(
      'href',
      'mailto:custom@example.com?subject=Custom%20Plan',
    )
  })

  it('falls back to a default collaborator identity when profile information is unavailable', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {},
      },
    })

    await renderWelcome()

    expect(screen.getByRole('heading', { level: 3, name: 'Welcome back, userNotAvailable!' })).toBeInTheDocument()
    expect(screen.queryByText(/Signed in as/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(
        /You now have access to scores, stage plots, and rehearsal notes for upcoming engagements\./i,
      ),
    ).toBeInTheDocument()
  })
})
