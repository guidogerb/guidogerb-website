import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  useAuth: mockUseAuth,
}))

vi.mock('../App.css', () => ({}), { virtual: true })
vi.mock('../assets/story-circle.svg', () => ({ default: 'story-circle.svg' }))

async function renderApp() {
  const module = await import('../App.jsx')
  const App = module.default
  return render(<App />)
}

describe('This-Is-My-Story.org App', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
    window.history.replaceState({}, '', '/')
  })

  it('renders storytelling content and teaser copy for guests', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Amplify the voices shaping our neighborhoods/i,
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Community storytelling programs',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Join the storyteller studio',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', {
        name: 'Sign in to share your story',
      }),
    ).toHaveAttribute('href', '/auth/sign-in')

    expect(
      screen.getByText('Mutual aid micro-grants that cover childcare, transit, and assistive technology needs.'),
    ).toBeInTheDocument()

    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: /Welcome /i,
      }),
    ).not.toBeInTheDocument()
  })

  it('renders the storyteller studio portal for authenticated members', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          name: 'Taylor Storyteller',
          email: 'taylor@example.org',
        },
      },
    })

    await renderApp()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Welcome Taylor Storyteller',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Signed in as taylor@example.org.')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Download story release form' }),
    ).toHaveAttribute('href', 'https://stories.this-is-my-story.org/resources/release-form.pdf')

    expect(
      screen.getByRole('heading', { level: 3, name: 'Upcoming workshops' }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Digital archiving sprint — April 3, collaboration with the public library.'),
    ).toBeInTheDocument()
  })
})
