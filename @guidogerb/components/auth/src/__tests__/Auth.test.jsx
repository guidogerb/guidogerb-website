import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const authState = vi.hoisted(() => ({ current: {} }))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authState.current,
}))

import Auth from '../Auth.jsx'

describe('Auth', () => {
  beforeEach(() => {
    authState.current = {}
  })

  it('renders a loading indicator while authentication status is pending', () => {
    authState.current = { isLoading: true }

    render(<Auth />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('surfaces authentication errors to help with configuration debugging', () => {
    authState.current = { error: { message: 'network down' } }

    render(<Auth />)

    expect(screen.getByText(/network down/i)).toBeInTheDocument()
    expect(screen.getByText(/hint: ensure oidc is configured/i)).toBeInTheDocument()
  })

  it('renders the protected children once the session is authenticated', () => {
    authState.current = { isAuthenticated: true }

    render(
      <Auth>
        <span>secret payload</span>
      </Auth>,
    )

    expect(screen.getByText('secret payload')).toBeInTheDocument()
  })

  it('renders a sign-out control when logoutUri is provided and triggers signoutRedirect', async () => {
    const signoutRedirect = vi.fn(() => Promise.resolve())
    authState.current = {
      isAuthenticated: true,
      signoutRedirect,
      user: {
        profile: { name: 'Guido Gerb', email: 'guido@example.com' },
      },
    }

    render(<Auth logoutUri="https://auth.example.com/logout" />)

    expect(screen.getByRole('heading', { name: /ready to head out/i })).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    expect(button).toHaveTextContent(/signing out/i)

    await waitFor(() =>
      expect(signoutRedirect).toHaveBeenCalledWith({
        post_logout_redirect_uri: 'https://auth.example.com/logout',
      }),
    )
  })

  it('merges signOutButtonProps and forwards redirect overrides', async () => {
    const signoutRedirect = vi.fn(() => Promise.resolve())
    authState.current = {
      isAuthenticated: true,
      signoutRedirect,
      user: {
        profile: { preferred_username: 'guidogerb' },
      },
    }

    render(
      <Auth
        logoutUri="https://auth.example.com/logout-default"
        signOutButtonProps={{
          redirectUri: 'https://auth.example.com/custom',
          pendingText: 'Signing out now…',
          children: 'Log out',
        }}
      />,
    )

    const button = screen.getByRole('button', { name: /log out/i })
    fireEvent.click(button)

    expect(button).toHaveTextContent(/signing out now/i)

    await waitFor(() =>
      expect(signoutRedirect).toHaveBeenCalledWith({
        post_logout_redirect_uri: 'https://auth.example.com/custom',
      }),
    )
  })

  it('lets the user trigger a sign-in redirect when autoSignIn is disabled', () => {
    const signinRedirect = vi.fn()
    authState.current = {
      signinRedirect,
      isAuthenticated: false,
      isLoading: false,
    }

    render(<Auth />)

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(signinRedirect).toHaveBeenCalledTimes(1)
  })

  it('kicks off redirect flow exactly once when autoSignIn is enabled', async () => {
    const signinRedirect = vi.fn()
    authState.current = {
      signinRedirect,
      isAuthenticated: false,
      isLoading: false,
    }

    const { rerender, container } = render(<Auth autoSignIn />)

    expect(container).toBeEmptyDOMElement()

    await waitFor(() => expect(signinRedirect).toHaveBeenCalledTimes(1))

    rerender(<Auth autoSignIn />)

    await waitFor(() => expect(signinRedirect).toHaveBeenCalledTimes(1))
  })
})
