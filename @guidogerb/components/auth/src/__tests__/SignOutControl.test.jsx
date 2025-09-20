import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const authState = vi.hoisted(() => ({ current: {} }))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authState.current,
}))

import SignOutControl from '../SignOutControl.jsx'

describe('SignOutControl', () => {
  beforeEach(() => {
    authState.current = {}
  })

  it('renders account metadata and forwards sign-out requests', async () => {
    const signoutRedirect = vi.fn(() => Promise.resolve())
    authState.current = {
      user: {
        profile: {
          name: 'Guido Gerb',
          email: 'guido@example.com',
        },
      },
      signoutRedirect,
    }

    render(
      <SignOutControl
        title="End your session?"
        message="We will route you through Cognito to complete the sign-out."
        buttonProps={{ redirectUri: 'https://auth.example.com/logout' }}
      />,
    )

    expect(screen.getByRole('heading', { name: /end your session/i })).toBeInTheDocument()
    expect(screen.getByText('Guido Gerb')).toBeInTheDocument()
    expect(screen.getByText('guido@example.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() =>
      expect(signoutRedirect).toHaveBeenCalledWith({
        post_logout_redirect_uri: 'https://auth.example.com/logout',
      }),
    )
  })

  it('falls back to placeholder details and custom button labels', () => {
    authState.current = { user: null }

    render(
      <SignOutControl
        title="Leave the console?"
        message="Logging out keeps your account secure."
        buttonProps={{ children: 'Log out', variant: 'danger' }}
      />,
    )

    expect(screen.getByRole('heading', { name: /leave the console/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    expect(screen.getByText(/keeps your account secure/i)).toBeInTheDocument()
  })
})
