import { fireEvent, render, screen } from '@testing-library/react'

import Protected from '../index.jsx'

const mocks = vi.hoisted(() => ({
  authRender: vi.fn(),
  useAuth: vi.fn(),
  redirectState: { hasRedirected: false },
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  Auth: ({ autoSignIn, logoutUri, children }) => {
    mocks.authRender({ autoSignIn, logoutUri })

    const auth = mocks.useAuth()

    if (
      autoSignIn &&
      !auth?.isAuthenticated &&
      !auth?.isLoading &&
      !mocks.redirectState.hasRedirected
    ) {
      mocks.redirectState.hasRedirected = true
      auth?.signinRedirect?.()
    }

    return (
      <div data-testid="auth-wrapper" data-logout-uri={logoutUri}>
        {auth?.isAuthenticated && logoutUri ? (
          <button
            type="button"
            onClick={() => auth?.signoutRedirect?.({ post_logout_redirect_uri: logoutUri })}
          >
            Sign out
          </button>
        ) : null}
        {children}
      </div>
    )
  },
  useAuth: () => mocks.useAuth(),
}))

describe('Protected', () => {
  beforeEach(() => {
    mocks.authRender.mockClear()
    mocks.useAuth.mockReset()
    mocks.redirectState.hasRedirected = false
  })

  it('renders a loading placeholder until authentication completes', () => {
    mocks.useAuth.mockReturnValue({ isAuthenticated: false, isLoading: true })

    render(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('Protected Loading...')).toBeInTheDocument()
    expect(screen.queryByText('secret child')).not.toBeInTheDocument()
  })

  it('surfaces authentication errors from the auth context', () => {
    const error = new Error('Boom')
    mocks.useAuth.mockReturnValue({ error })

    render(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('Sign-in failed: Boom')).toBeInTheDocument()
  })

  it('passes through props to Auth and renders children once authenticated', () => {
    mocks.useAuth.mockReturnValue({ isAuthenticated: true })

    render(
      <Protected logoutUri="/bye">
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('secret child')).toBeInTheDocument()
    expect(mocks.authRender).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSignIn: true,
        logoutUri: '/bye',
      }),
    )
  })

  it('only triggers the sign-in redirect once when autoSignIn is enabled', () => {
    const signinRedirect = vi.fn()
    const authState = { isAuthenticated: false, isLoading: false, signinRedirect }

    mocks.useAuth.mockReturnValue(authState)

    const { rerender } = render(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    rerender(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    expect(signinRedirect).toHaveBeenCalledTimes(1)
  })

  it('renders a logout button and forwards the redirect URI when clicked', () => {
    const signoutRedirect = vi.fn()
    const authState = { isAuthenticated: true, signoutRedirect }

    mocks.useAuth.mockReturnValue(authState)

    render(
      <Protected logoutUri="https://auth.example.com/logout">
        <div>secret child</div>
      </Protected>,
    )

    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    expect(signoutRedirect).toHaveBeenCalledWith({
      post_logout_redirect_uri: 'https://auth.example.com/logout',
    })
  })
})
