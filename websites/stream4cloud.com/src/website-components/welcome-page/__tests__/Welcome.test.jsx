import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseAuth, mockUseAnalytics } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseAnalytics: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}))

vi.mock('@guidogerb/components-analytics', () => ({
  __esModule: true,
  useAnalytics: mockUseAnalytics,
}))

async function renderWelcome(props = {}) {
  const module = await import('../index.jsx')
  const Welcome = module.default
  return render(<Welcome {...props} />)
}

describe('Stream4Cloud welcome component', () => {
  let analyticsTrackEvent

  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
    mockUseAnalytics.mockReset()
    analyticsTrackEvent = vi.fn()
    mockUseAnalytics.mockReturnValue({ trackEvent: analyticsTrackEvent })
  })

  it('renders an error message when authentication fails', async () => {
    mockUseAuth.mockReturnValue({
      error: { message: 'Network unavailable' },
    })

    await renderWelcome()

    expect(screen.getByText('Sign-in failed: Network unavailable')).toBeInTheDocument()
    expect(analyticsTrackEvent).not.toHaveBeenCalled()
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderWelcome()

    expect(screen.getByText('Welcome Loading...')).toBeInTheDocument()
    expect(analyticsTrackEvent).not.toHaveBeenCalled()
  })

  it('renders collaborator details and nested content once authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Streaming Partner',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="nested">Portal content</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome Streaming Partner' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('nested')).toHaveTextContent('Portal content')
    expect(
      screen.getByRole('heading', { level: 4, name: 'Broadcast documentation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 4, name: 'Integration quick-starts' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Direct support' })).toBeInTheDocument()

    await waitFor(() => {
      expect(analyticsTrackEvent).toHaveBeenCalledWith(
        'stream4cloud.auth.sign_in_complete',
        expect.objectContaining({ collaborator: 'Streaming Partner' }),
      )
    })
  })

  it('falls back to the Cognito username when no profile name is provided', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'dj-stream',
        },
      },
    })

    await renderWelcome()

    expect(screen.getByRole('heading', { level: 3, name: 'Welcome dj-stream' })).toBeInTheDocument()

    await waitFor(() => {
      expect(analyticsTrackEvent).toHaveBeenCalledWith(
        'stream4cloud.auth.sign_in_complete',
        expect.objectContaining({ collaborator: 'dj-stream' }),
      )
    })
  })

  it('lists curated broadcast resources for partner teams', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Ops Lead',
        },
      },
    })

    await renderWelcome()

    const controlRoomLink = screen.getByRole('link', {
      name: 'Control room readiness checklist',
    })
    expect(controlRoomLink).toHaveAttribute(
      'href',
      'https://support.stream4cloud.com/docs/control-room-readiness',
    )
    expect(screen.getByRole('link', { name: 'Partner success desk' })).toHaveAttribute(
      'href',
      'mailto:success@stream4cloud.com',
    )
    expect(screen.getByRole('link', { name: 'Schedule a redundancy workshop' })).toHaveAttribute(
      'href',
      'https://calendly.com/stream4cloud/broadcaster-onboarding',
    )
  })
})
