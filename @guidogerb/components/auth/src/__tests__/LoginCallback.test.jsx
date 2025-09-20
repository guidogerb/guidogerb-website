import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

const authState = vi.hoisted(() => ({ current: {} }))

vi.mock('react-oidc-context', () => ({
  useAuth: () => authState.current,
}))

import LoginCallback from '../LoginCallback.jsx'
import { restoreLocation, setMockLocation } from './testUtils.js'

describe('LoginCallback', () => {
  beforeEach(() => {
    authState.current = {}
    sessionStorage.clear()
    localStorage.clear()
    setMockLocation('http://localhost/auth/callback')
  })

  afterAll(() => {
    restoreLocation()
  })

  it('renders a completion message while processing the redirect', () => {
    render(<LoginCallback />)

    expect(screen.getByText(/completing sign-in/i)).toBeInTheDocument()
  })

  it('shows an error when the auth context exposes one', () => {
    authState.current = { error: { message: 'callback failed' } }

    render(<LoginCallback />)

    expect(screen.getByText(/callback failed/i)).toBeInTheDocument()
  })

  it('finalizes the redirect response once when OIDC parameters are present', async () => {
    const signinRedirectCallback = vi.fn(() => Promise.resolve())
    authState.current = {
      signinRedirectCallback,
      isAuthenticated: false,
    }

    setMockLocation('http://localhost/auth/callback?code=abc&state=xyz')

    render(<LoginCallback />)

    await waitFor(() => expect(signinRedirectCallback).toHaveBeenCalledTimes(1))
  })

  it('redirects to the stored location after authentication succeeds', async () => {
    const signinRedirectCallback = vi.fn(() => Promise.resolve())
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    authState.current = {
      signinRedirectCallback,
      isAuthenticated: true,
      user: { state: { returnTo: '/from-state' } },
    }

    sessionStorage.setItem('auth:returnTo', '/from-session')
    localStorage.setItem('auth:returnTo', '/from-local')

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/from-state'))

    expect(sessionStorage.getItem('auth:returnTo')).toBeNull()
    expect(localStorage.getItem('auth:returnTo')).toBeNull()
  })

  it('prefers an explicit redirectTo prop over stored hints', async () => {
    const signinRedirectCallback = vi.fn(() => Promise.resolve())
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    authState.current = {
      signinRedirectCallback,
      isAuthenticated: true,
      user: { state: { returnTo: '/from-state' } },
    }

    render(<LoginCallback redirectTo="/from-prop" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/from-prop'))
  })

  it('falls back to user.url_state when no explicit return hints are provided', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    sessionStorage.setItem(
      'auth:returnTo',
      JSON.stringify({ pathname: '/from-session', search: '?tab=billing', hash: '#invoices' }),
    )
    localStorage.setItem('auth:returnTo', '/from-local')

    authState.current = {
      isAuthenticated: true,
      user: { url_state: '/from-url-state?foo=bar' },
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/from-url-state?foo=bar'))

    expect(sessionStorage.getItem('auth:returnTo')).toBeNull()
    expect(localStorage.getItem('auth:returnTo')).toBeNull()
  })

  it('parses serialized storage hints to construct the redirect target', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    sessionStorage.setItem(
      'auth:returnTo',
      JSON.stringify({ pathname: '/from-session', search: '?pane=reports', hash: '#q1' }),
    )

    authState.current = {
      isAuthenticated: true,
      user: {},
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() =>
      expect(location.replace).toHaveBeenCalledWith('/from-session?pane=reports#q1'),
    )

    expect(sessionStorage.getItem('auth:returnTo')).toBeNull()
  })

  it('normalizes nested object hints in the OIDC user state', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    authState.current = {
      isAuthenticated: true,
      user: {
        state: {
          returnTo: {
            pathname: '/from-object',
            search: '?view=metrics',
            hash: '#section',
          },
        },
      },
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() =>
      expect(location.replace).toHaveBeenCalledWith('/from-object?view=metrics#section'),
    )
  })

  it('handles redirectTo object props by composing pathname, search, and hash', async () => {
    const signinRedirectCallback = vi.fn(() => Promise.resolve())
    const location = setMockLocation('http://localhost/auth/callback?code=abc&state=xyz')

    authState.current = {
      signinRedirectCallback,
      isAuthenticated: true,
      user: {
        state: {
          returnTo: '/fallback',
        },
      },
    }

    render(
      <LoginCallback
        redirectTo={{ pathname: '/from-prop', search: '?mode=prop', hash: '#anchor' }}
      />,
    )

    await waitFor(() =>
      expect(location.replace).toHaveBeenCalledWith('/from-prop?mode=prop#anchor'),
    )
    expect(signinRedirectCallback).toHaveBeenCalledTimes(1)
  })

  it('falls back to trimmed string hints when JSON parsing fails', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    sessionStorage.setItem('auth:returnTo', '   /raw-destination  ')

    authState.current = {
      isAuthenticated: true,
      user: {},
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/raw-destination'))
    expect(sessionStorage.getItem('auth:returnTo')).toBeNull()
  })

  it('ignores hints that resolve to a different origin', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    sessionStorage.setItem('auth:returnTo', 'https://evil.example.com/admin')

    authState.current = {
      isAuthenticated: true,
      user: {},
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/'))
  })

  it('rejects unsafe protocols even when they look like URLs', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    localStorage.setItem('auth:returnTo', 'javascript:alert(1)')

    authState.current = {
      isAuthenticated: true,
      user: {},
    }

    render(<LoginCallback storageKey="auth:returnTo" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/'))
  })

  it('accepts absolute URLs that match the current origin', async () => {
    const location = setMockLocation('http://localhost/auth/callback?code=abc')

    authState.current = {
      isAuthenticated: true,
      user: {},
    }

    render(<LoginCallback redirectTo="http://localhost/dashboard?tab=live#anchor" />)

    await waitFor(() => expect(location.replace).toHaveBeenCalledWith('/dashboard?tab=live#anchor'))
  })
})
