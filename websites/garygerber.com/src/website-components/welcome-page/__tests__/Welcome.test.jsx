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

    const { container } = await renderWelcome()

    const error = container.querySelector('.welcome-error')
    expect(error).toBeInTheDocument()
    expect(error).toHaveTextContent('Sign-in failed: Sign-in blocked')
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    const { container } = await renderWelcome()

    const loading = container.querySelector('.welcome-loading')
    expect(loading).toBeInTheDocument()
    expect(loading).toHaveTextContent('Loading rehearsal room…')
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
})
