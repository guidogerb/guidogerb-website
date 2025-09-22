import { render, screen } from '@testing-library/react'
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

describe('Stream4Cloud welcome component', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
  })

  it('renders an error message when authentication fails', async () => {
    mockUseAuth.mockReturnValue({
      error: { message: 'Network unavailable' },
    })

    await renderWelcome()

    expect(screen.getByText('Sign-in failed: Network unavailable')).toBeInTheDocument()
  })

  it('shows a loading indicator while authentication resolves', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderWelcome()

    expect(screen.getByText('Welcome Loading...')).toBeInTheDocument()
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
  })
})
