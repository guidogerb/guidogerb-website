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

describe('This-Is-My-Story welcome component', () => {
  let trackEvent

  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
    mockUseAnalytics.mockReset()
    trackEvent = vi.fn()
    mockUseAnalytics.mockReturnValue({ trackEvent })
  })

  it('renders an error message and tracks the failure state', async () => {
    mockUseAuth.mockReturnValue({
      error: { message: 'Token expired', code: 'ExpiredTokenException' },
    })

    await renderWelcome()

    expect(screen.getByText('Sign-in failed: Token expired')).toBeInTheDocument()

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        'thisismystory.auth.context_change',
        expect.objectContaining({
          status: 'error',
          hasError: true,
          errorMessage: 'Token expired',
          errorCode: 'ExpiredTokenException',
        }),
      )
    })
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderWelcome()

    expect(screen.getByText('Welcome Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        'thisismystory.auth.context_change',
        expect.objectContaining({
          status: 'loading',
          isAuthenticated: false,
          hasError: false,
        }),
      )
    })
  })

  it('renders personalized storytelling guidance when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Ari Storyteller',
        },
      },
    })

    await renderWelcome({ children: <div data-testid="nested">Production notes</div> })

    expect(
      screen.getByRole('heading', { level: 3, name: 'Welcome Ari Storyteller' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 4, name: "Jump-start today's chapter" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 4, name: 'Storyteller resources' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 4, name: 'Stay connected with your care team' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('nested')).toHaveTextContent('Production notes')

    const audioGuideLink = screen.getByRole('link', { name: 'Audio diary setup checklist' })
    expect(audioGuideLink).toHaveAttribute(
      'href',
      'https://support.this-is-my-story.org/guides/audio-diary',
    )
    expect(audioGuideLink).toHaveAttribute('target', '_blank')
    expect(audioGuideLink).toHaveAttribute('rel', 'noreferrer')

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        'thisismystory.auth.context_change',
        expect.objectContaining({
          status: 'authenticated',
          storyteller: 'Ari Storyteller',
          isAuthenticated: true,
          hasError: false,
        }),
      )
    })
  })

  it('falls back to the Cognito username when no profile name is provided', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          'cognito:username': 'memorykeeper',
        },
      },
    })

    await renderWelcome()

    expect(screen.getByRole('heading', { level: 3, name: 'Welcome memorykeeper' })).toBeInTheDocument()

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        'thisismystory.auth.context_change',
        expect.objectContaining({
          status: 'authenticated',
          storyteller: 'memorykeeper',
          isAuthenticated: true,
        }),
      )
    })
  })
})
