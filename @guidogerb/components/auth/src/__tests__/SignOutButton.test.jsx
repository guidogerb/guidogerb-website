import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const authState = vi.hoisted(() => ({ current: {} }))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authState.current,
}))

import SignOutButton from '../SignOutButton.jsx'
import { restoreLocation, setMockLocation } from './testUtils.js'

describe('SignOutButton', () => {
  beforeEach(() => {
    authState.current = {}
  })

  afterEach(() => {
    restoreLocation()
  })

  it('triggers signoutRedirect with the provided redirect URI and surfaces pending state', async () => {
    const signoutRedirect = vi.fn(() => Promise.resolve())
    authState.current = {
      signoutRedirect,
      settings: { post_logout_redirect_uri: 'https://app.example.com/logout-default' },
    }

    render(<SignOutButton redirectUri="https://app.example.com/logout-complete" />)

    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveTextContent(/signing out/i)
    expect(screen.getByRole('status')).toHaveTextContent(/signing out/i)

    await waitFor(() =>
      expect(signoutRedirect).toHaveBeenCalledWith({
        post_logout_redirect_uri: 'https://app.example.com/logout-complete',
      }),
    )

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/signed out/i))
  })

  it('falls back to removeUser and window navigation when signoutRedirect is unavailable', async () => {
    const removeUser = vi.fn(() => Promise.resolve())
    const location = setMockLocation('https://app.example.com/dashboard')

    authState.current = {
      removeUser,
      settings: { post_logout_redirect_uri: 'https://app.example.com/logged-out' },
    }

    render(<SignOutButton />)

    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    await waitFor(() => expect(removeUser).toHaveBeenCalledTimes(1))
    expect(location.assign).toHaveBeenCalledWith('https://app.example.com/logged-out')
  })

  it('announces errors and re-enables the control when signoutRedirect rejects', async () => {
    const error = new Error('network down')
    const signoutRedirect = vi.fn(() => Promise.reject(error))

    authState.current = { signoutRedirect }

    render(<SignOutButton />)

    const button = screen.getByRole('button', { name: /sign out/i })
    fireEvent.click(button)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/unable to sign out: network down/i),
    )
    expect(button).not.toBeDisabled()
  })

  it('honours consumer onClick handlers that prevent default behaviour', () => {
    const onClick = vi.fn((event) => event.preventDefault())
    const signoutRedirect = vi.fn(() => Promise.resolve())

    authState.current = { signoutRedirect }

    render(<SignOutButton onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(signoutRedirect).not.toHaveBeenCalled()
  })
})
